import { IDB_NAME, IDB_VER, STATS_KEY, REPLAY_KEY, ANALYSIS_CACHE_DAYS, SHUF_ANIM_KEY, LS_KEY, LS_FAV_BK, LS_LEVEL_KEY } from "./constants.js";

// ═══ Shuffle Animation Setting ═══
export function getShufAnim(){try{const v=localStorage.getItem(SHUF_ANIM_KEY);return v===null?true:v==="true";}catch(e){return true;}}
export function setShufAnimLS(v){try{localStorage.setItem(SHUF_ANIM_KEY,v?"true":"false");}catch(e){}}

// ═══ In-memory cache ═══
export const _cache={stats:{},replays:{},analysis:{},ready:false};

// ═══ IndexedDB Operations ═══
function openIDB(){
return new Promise((res,rej)=>{
const req=indexedDB.open(IDB_NAME,IDB_VER);
req.onupgradeneeded=e=>{
const db=e.target.result;
if(!db.objectStoreNames.contains("kv"))db.createObjectStore("kv");
if(!db.objectStoreNames.contains("analysis"))db.createObjectStore("analysis");
};
req.onsuccess=()=>res(req.result);
req.onerror=()=>rej(req.error);
});
}
export function idbGet(db,key){
return new Promise((res,rej)=>{
const tx=db.transaction("kv","readonly");
const req=tx.objectStore("kv").get(key);
req.onsuccess=()=>res(req.result);
req.onerror=()=>rej(req.error);
});
}
export function idbSet(db,key,val){
return new Promise((res,rej)=>{
const tx=db.transaction("kv","readwrite");
const req=tx.objectStore("kv").put(val,key);
req.onsuccess=()=>res();
req.onerror=()=>rej(req.error);
});
}
export function idbDel(db,key){
return new Promise((res,rej)=>{
const tx=db.transaction("kv","readwrite");
const req=tx.objectStore("kv").delete(key);
req.onsuccess=()=>res();
req.onerror=()=>rej(req.error);
});
}

// ═══ DB Singleton ═══
export let _db=null;

export async function initDB(){
try{
_db=await openIDB();
/* Load from IndexedDB */
let stats=await idbGet(_db,"stats");
let replays=await idbGet(_db,"replays");
/* Migrate from localStorage if IDB is empty */
if(!stats){
try{const ls=JSON.parse(localStorage.getItem(STATS_KEY));if(ls&&Object.keys(ls).length>0){stats=ls;await idbSet(_db,"stats",stats);localStorage.removeItem(STATS_KEY);}}catch(e){}
}
if(!replays){
try{const lr=JSON.parse(localStorage.getItem(REPLAY_KEY));if(lr&&Object.keys(lr).length>0){replays=lr;await idbSet(_db,"replays",replays);localStorage.removeItem(REPLAY_KEY);}}catch(e){}
}
/* Also try to migrate favs backup from stats if needed */
if(stats){
try{const existingFavs=JSON.parse(localStorage.getItem("mk-fav"));if(!existingFavs||existingFavs.length===0){const names=Object.keys(stats);if(names.length>0){localStorage.setItem("mk-fav",JSON.stringify(names));localStorage.setItem("mk-fav-bk",JSON.stringify(names));}}}catch(e){}
}
_cache.stats=stats||{};
_cache.replays=replays||{};
/* Load analysis cache + prune expired */
try{
const ac=await idbGet(_db,"analysisCache");
if(ac&&typeof ac==="object"){
const now=Date.now();const maxAge=ANALYSIS_CACHE_DAYS*86400000;
const pruned={};let changed=false;
for(const k in ac){if(ac[k].t&&(now-ac[k].t)<maxAge)pruned[k]=ac[k];else changed=true;}
_cache.analysis=pruned;
if(changed)idbSet(_db,"analysisCache",pruned).catch(()=>{});
}
}catch(e){_cache.analysis={};}
}catch(e){
console.error("IDB init failed, falling back to localStorage",e);
try{_cache.stats=JSON.parse(localStorage.getItem(STATS_KEY))||{};}catch(e2){_cache.stats={};}
try{_cache.replays=JSON.parse(localStorage.getItem(REPLAY_KEY))||{};}catch(e2){_cache.replays={};}
}
_cache.ready=true;
}

// ═══ Cache Accessors ═══
export function loadStats(){return _cache.stats;}
export function loadReplays(){return _cache.replays;}

/* Async-persist writes (fire-and-forget) */
export function _persistStats(){if(_db)idbSet(_db,"stats",_cache.stats).catch(e=>console.error("stats persist error",e));}
export function _persistReplays(){if(_db)idbSet(_db,"replays",_cache.replays).catch(e=>console.error("replays persist error",e));}

export function saveStats(d){
_cache.stats=d;
_persistStats();
}

// ═══ Favorites (raw access — no sync dependency) ═══
export function loadFavs(){
try{
let f=JSON.parse(localStorage.getItem(LS_KEY));
if(f&&f.length>0)return f;
/* Backup 1: secondary key */
f=JSON.parse(localStorage.getItem(LS_FAV_BK));
if(f&&f.length>0){localStorage.setItem(LS_KEY,JSON.stringify(f));return f;}
/* Backup 2: reconstruct from stats cache */
if(_cache.ready){const names=Object.keys(_cache.stats);if(names.length>0){localStorage.setItem(LS_KEY,JSON.stringify(names));localStorage.setItem(LS_FAV_BK,JSON.stringify(names));return names;}}
/* Backup 3: try localStorage stats (pre-migration) */
try{const stats=JSON.parse(localStorage.getItem("mk-player-stats"));if(stats){const names=Object.keys(stats);if(names.length>0){localStorage.setItem(LS_KEY,JSON.stringify(names));localStorage.setItem(LS_FAV_BK,JSON.stringify(names));return names;}}}catch(e2){}
return[];
}catch(e){return[];}
}
export function _saveFavsRaw(l){try{localStorage.setItem(LS_KEY,JSON.stringify(l));localStorage.setItem(LS_FAV_BK,JSON.stringify(l));}catch(e){}}

// ═══ Player Manual Level ═══
export function loadPlayerLevels(){
try{const d=JSON.parse(localStorage.getItem(LS_LEVEL_KEY));return d&&typeof d==="object"?d:{};}catch(e){return{};}
}
export function savePlayerLevel(name,level){
try{const d=loadPlayerLevels();if(level===null||level===undefined){delete d[name];}else{d[name]=level;}localStorage.setItem(LS_LEVEL_KEY,JSON.stringify(d));}catch(e){}
}
export function renamePlayerLevel(oldName,newName){
try{const d=loadPlayerLevels();if(d[oldName]!==undefined){d[newName]=d[oldName];delete d[oldName];localStorage.setItem(LS_LEVEL_KEY,JSON.stringify(d));}}catch(e){}
}
