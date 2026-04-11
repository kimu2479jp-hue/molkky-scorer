import { SYNC_CODE_KEY, PIN_LOCKOUT_KEY, PIN_AUTH_TS_KEY, MAX_SYNC_CODES, API_BASE } from "./constants.js";
import { _cache, _persistStats, _persistReplays, loadFavs, _saveFavsRaw, loadWindData, saveWindData } from "./db.js";

// ═══ Cloud Sync — Supabase via /api/sync ═══
export function getSyncCode(){try{return localStorage.getItem(SYNC_CODE_KEY)||"";}catch(e){return "";}}
export function setSyncCodeLS(c){try{localStorage.setItem(SYNC_CODE_KEY,c);}catch(e){}}

/* ═══ Admin PIN — server-side only (Supabase) ═══ */
/* PIN is NEVER stored in localStorage. Verification is done via /api/sync */
export function getPinLockout(){
try{const d=JSON.parse(localStorage.getItem(PIN_LOCKOUT_KEY)||"{}");
if(d.until&&Date.now()<d.until)return{locked:true,remaining:Math.ceil((d.until-Date.now())/1000),attempts:d.attempts||0};
return{locked:false,remaining:0,attempts:d.until&&Date.now()>=d.until?0:(d.attempts||0)};
}catch(e){return{locked:false,remaining:0,attempts:0};}
}
export function incPinAttempt(){
try{const d=JSON.parse(localStorage.getItem(PIN_LOCKOUT_KEY)||"{}");
const attempts=(d.until&&Date.now()>=d.until)?1:((d.attempts||0)+1);
const lockout=attempts>=5?{attempts,until:Date.now()+600000}:{attempts,until:null};
localStorage.setItem(PIN_LOCKOUT_KEY,JSON.stringify(lockout));
return lockout;
}catch(e){return{attempts:99,until:Date.now()+600000};}
}
export function clearPinLockout(){try{localStorage.removeItem(PIN_LOCKOUT_KEY);}catch(e){}}
export function getPinAuthTs(){try{return localStorage.getItem(PIN_AUTH_TS_KEY)||"";}catch(e){return "";}}
export function setPinAuthTs(ts){try{localStorage.setItem(PIN_AUTH_TS_KEY,ts||"");}catch(e){}}

export async function verifyPinOnServer(code,pin){
if(!code)return{ok:false,reason:"no_code"};
try{const r=await fetch(API_BASE+"/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({code,action:"verify_pin",pin})});
return await r.json();
}catch(e){return{ok:false,reason:"network"};}
}
export async function createPinOnServer(code,pin){
if(!code)return{ok:false,error:"no_code"};
try{const r=await fetch(API_BASE+"/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({code,action:"create_pin",pin})});
return await r.json();
}catch(e){return{ok:false,error:"network"};}
}
export async function checkServerHasPin(code){
if(!code)return{has_pin:false,pin_updated_at:null,exists:false};
try{const r=await fetch(API_BASE+"/api/sync?code="+encodeURIComponent(code));
if(!r.ok)return{has_pin:false,pin_updated_at:null,exists:false};
const d=await r.json();return{has_pin:!!d.has_pin,pin_updated_at:d.pin_updated_at||null,exists:true};
}catch(e){return{has_pin:false,pin_updated_at:null,exists:false};}
}
export function maskSyncCode(code){if(!code||code.length<=2)return code?"***":"";return code.slice(0,2)+"•".repeat(Math.min(code.length-2,8));}

// ═══ Sync Engine ═══
let _syncTimer=null;
export function _debouncedSync(){
if(_syncTimer)clearTimeout(_syncTimer);
_syncTimer=setTimeout(()=>{pushToServer().catch(e=>console.error("auto-sync error",e));},2000);
}

let _syncBusy=false;
export async function pushToServer(){
const code=getSyncCode();
if(!code||_syncBusy)return{ok:false};
_syncBusy=true;
try{
const r=await fetch(API_BASE+"/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},
body:JSON.stringify({code,favorites:loadFavs(),stats:_cache.stats,replays:_cache.replays})});
const d=await r.json();
_syncBusy=false;
return{ok:r.ok,error:d.error};
}catch(e){_syncBusy=false;return{ok:false,error:e.message};}
}

export async function pullFromServer(){
const code=getSyncCode();
if(!code||_syncBusy)return{merged:false,reason:"no_code"};
_syncBusy=true;
try{
const r=await fetch(API_BASE+"/api/sync?code="+encodeURIComponent(code));
if(r.status===404){_syncBusy=false;try{const cr=await fetch(API_BASE+"/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,action:"count_codes"})});const cd=await cr.json();if(cd.ok&&cd.count>=MAX_SYNC_CODES){return{merged:false,reason:"limit",error:"既存の同期コードを使用してください"};}}catch(e){}await pushToServer();return{merged:true,reason:"new_pushed",added:0};}
if(!r.ok){const e=await r.json().catch(()=>({}));_syncBusy=false;return{merged:false,reason:"error",error:e.error||"HTTP "+r.status};}
const data=await r.json();

/* Favorites: server wins (replace local with server) — enables deletion sync */
const serverFavs=data.favorites||[];
_saveFavsRaw(serverFavs);

/* Merge stats (union by player x date) */
const localStats=_cache.stats;
const serverStats=data.stats||{};
let added=0;
const allNames=new Set([...Object.keys(localStats),...Object.keys(serverStats)]);
for(const nm of allNames){
  const local=localStats[nm]||[];
  const server=serverStats[nm]||[];
  const seen=new Set(local.map(g=>g.d));
  const newG=server.filter(g=>!seen.has(g.d));
  if(newG.length>0){added+=newG.length;localStats[nm]=[...local,...newG];}
  else if(!localStats[nm])localStats[nm]=server;
}
_cache.stats=localStats;
_persistStats();

/* Merge replays (union by key) */
const localReplays=_cache.replays;
const serverReplays=data.replays||{};
for(const key in serverReplays){if(!localReplays[key]){localReplays[key]=serverReplays[key];added++;}}
_cache.replays=localReplays;
_persistReplays();

_syncBusy=false;
/* Push merged data back so both sides are identical */
await pushToServer();
/* Sync wind data for all games with replays (fire-and-forget) */
syncAllWindData(Object.keys(localReplays)).catch(e=>console.warn("wind sync error",e));
return{merged:true,added,favs:serverFavs};

}catch(e){_syncBusy=false;return{merged:false,reason:"network",error:e.message};}
}

// ═══ Wind Data Sync (separate from main sync — uses game_wind_data table) ═══

/* Sync wind data for all known game keys.
   - Local wind data exists → push to server
   - No local wind data → pull from server and cache to IndexedDB */
async function syncAllWindData(gameKeys) {
  const code = getSyncCode();
  if (!code || !gameKeys || gameKeys.length === 0) return;
  for (const key of gameKeys) {
    try {
      const local = await loadWindData(key);
      if (local && local.turnWindData && local.turnWindData.length > 0) {
        /* Local data exists — push to server */
        await pushWindData(key, local);
      } else {
        /* No local data — try pull from server */
        const pulled = await pullWindData(key);
        if (pulled) {
          /* Normalize snake_case (Supabase) to camelCase (IndexedDB) */
          const normalized = (pulled.windSensor || pulled.turnWindData) ? pulled
            : (pulled.wind_sensor || pulled.turn_wind_data) ? { windSensor: pulled.wind_sensor || null, turnWindData: pulled.turn_wind_data || null, windSummary: pulled.wind_summary || null }
            : null;
          if (normalized && normalized.turnWindData && normalized.turnWindData.length > 0) {
            await saveWindData(key, normalized);
          }
        }
      }
    } catch (e) {
      /* Per-game errors should not block other games */
    }
  }
}

export async function pushWindData(gameId, windData) {
  const code = getSyncCode();
  if (!code || !gameId || !windData) return { ok: false };
  try {
    const r = await fetch(API_BASE+"/api/game-wind-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sync_code: code,
        game_id: gameId,
        wind_sensor: windData.windSensor || null,
        turn_wind_data: windData.turnWindData || null,
        wind_summary: windData.windSummary || null,
      }),
    });
    const d = await r.json();
    return { ok: r.ok, error: d.error };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function pullWindData(gameId) {
  const code = getSyncCode();
  if (!code || !gameId) return null;
  try {
    const r = await fetch(
      "/api/game-wind-data?game_id=" + encodeURIComponent(gameId) +
      "&sync_code=" + encodeURIComponent(code)
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.wind_data || null;
  } catch (e) {
    return null;
  }
}
