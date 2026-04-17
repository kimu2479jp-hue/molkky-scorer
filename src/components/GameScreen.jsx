import React, { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { AlertTriangle, Bot, ChevronLeft, ClipboardList, RefreshCw, Target, Trash2, Users, Undo2 } from "lucide-react";

import { C, MASCOT_R, MAX_NAME, MAX_PL, MAX_FAV, MF, PEN, SS, WIN, ANALYSIS_DAILY_MAX, getWeatherInfo } from "../constants.js";
import { _db, idbSet, loadFavs, loadReplays, _saveFavsRaw } from "../db.js";
import { _debouncedSync } from "../sync.js";
import { buildGameRecord, fmtHM, fmtMD, saveGameStatsToDB, saveReplay, renamePlayerData } from "../stats.js";
import { fetchPlayerAnalysis, getAnalysisCached, getPlayerAnalysisCount, makeAnalysisKey } from "../analysis.js";
import { failsOf, getPI, reducer, scoreOf, shuf } from "../gameLogic.js";
import { WindSensorManager } from "../windSensor.js";
import { CSSConfetti, Confirm, FavDropdown, GameSheet, ScoreTable, ShuffleAnimation } from "./common.jsx";
import GameWindWidget from "./GameWindWidget.jsx";

// ═══ Weather fetch via OpenMeteo API ═══
// Primary: use stored coordinates from location profile
// Fallback: browser geolocation (may be blocked by Permissions-Policy)
async function fetchWeatherFromCoords(lat, lng) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=Asia%2FTokyo`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    const c = data.current;
    return {
      temp: Math.round(c.temperature_2m),
      weatherCode: c.weather_code,
      windSpeed: c.wind_speed_10m,
      windDirection: c.wind_direction_10m,
    };
  } catch (e) {
    console.error("weather fetch failed:", e);
    return null;
  }
}
async function fetchWeatherData(location) {
  // If location with coordinates is provided, use those
  if (location && location.latitude && location.longitude) {
    return fetchWeatherFromCoords(location.latitude, location.longitude);
  }
  // Fallback: browser geolocation
  try {
    const pos = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("no geolocation"));
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      });
    });
    return fetchWeatherFromCoords(pos.coords.latitude.toFixed(2), pos.coords.longitude.toFixed(2));
  } catch (e) {
    console.error("weather fetch (geolocation) failed:", e);
    return null;
  }
}

function saveFavs(l){_saveFavsRaw(l);_debouncedSync();}
export function useFavs(){const[f,sF]=useState(()=>loadFavs());return{favs:f,addF:n=>{const x=n.trim().slice(0,MAX_NAME);if(x&&!f.includes(x)&&f.length<MAX_FAV){const u=[...f,x];sF(u);saveFavs(u);}},rmF:n=>{const u=f.filter(v=>v!==n);sF(u);saveFavs(u);},editF:(oldName,newName)=>{const x=newName.trim().slice(0,MAX_NAME);if(!x||x===oldName||!f.includes(oldName))return false;if(f.includes(x))return false;const u=f.map(v=>v===oldName?x:v);sF(u);saveFavs(u);renamePlayerData(oldName,x);return true;}};}

/* ═══ Score Input — centered numpad ═══ */
function ScoreInput({dispatch,canUndo,teamName,teamScore,teamColor,playerName,fails,onConfirm,minimized,onToggleMin}){
const[sel,setSel]=useState(null);
const pv=sel!=null?teamScore+sel:null;const over=pv!=null&&pv>WIN;const win=pv===WIN;
const doScore=()=>{if(sel==null)return;if(win){onConfirm("score",sel,teamName+"が50点で上がりです。\n確定しますか？");setSel(null);return;}dispatch({type:"SCORE",score:sel});setSel(null);};
const doMiss=()=>{if(fails>=MF-1){onConfirm("miss",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}dispatch({type:"MISS"});setSel(null);};
const doFault=()=>{if(fails>=MF-1){onConfirm("fault",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}if(teamScore>=PEN){onConfirm("fault",0,teamName+"は"+teamScore+"点（37点以上）。\nフォルトで25点に戻ります。確定しますか？");setSel(null);return;}dispatch({type:"FAULT"});setSel(null);};
const vw=typeof window!=="undefined"?window.innerWidth:375;
const isNarrow=vw<420;const isTabletSI=vw>=768;const PAD=isTabletSI?12:8;const ACT_W=isNarrow?80:(isTabletSI?160:90);const GAP=isNarrow?6:(isTabletSI?14:10);const NG=isNarrow?4:(isTabletSI?10:6);
const gridW=vw-PAD*2-ACT_W-GAP;const NB=isTabletSI?Math.min(Math.floor((gridW-NG*3)/4),110):Math.min(Math.floor((gridW-NG*3)/4),70);const NFS=Math.max(Math.floor(NB*0.42),16);
/* Info font size: scale player name to fit without ellipsis */
const pnLen=(playerName||"").length;const pnFS=isTabletSI?(pnLen<=4?52:pnLen<=7?46:38):(isNarrow?(pnLen<=4?16:pnLen<=7?14:12):(pnLen<=4?18:pnLen<=7?16:14));
const scFS=isTabletSI?64:(isNarrow?20:24);
if(minimized){return(<div onPointerDown={onToggleMin} style={{background:"var(--bg-secondary)",padding:isTabletSI?"24px 40px":"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
<span style={{fontSize:isTabletSI?48:18,color:"var(--text-inverse)",fontWeight:800}}>▲ 入力</span></div>);}
return(
<div style={{background:"var(--bg-surface)",borderTop:"2px solid #dde1e6",padding:(isTabletSI?"10px ":"6px ")+PAD+"px",paddingBottom:"calc("+(isTabletSI?"12":"8")+"px + env(safe-area-inset-bottom, 0px))",flexShrink:0,touchAction:"none"}}>
{/* Top info: player name + score left, minimize button right */}
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:isTabletSI?6:2}}>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"baseline",gap:isTabletSI?10:6,flexWrap:"nowrap"}}>
<span style={{fontSize:pnFS,fontWeight:700,color:"var(--text-primary)",whiteSpace:"nowrap"}}>{playerName||""}</span>
<span style={{fontSize:scFS,fontWeight:900,color:"var(--text-primary)",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{teamScore}<span style={{fontSize:Math.round(scFS*0.55),fontWeight:700}}>点</span></span>
</div>
<div style={{display:"flex",gap:isTabletSI?6:3,alignItems:"center",marginTop:isTabletSI?6:2}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:isTabletSI?30:(isNarrow?10:13),height:isTabletSI?30:(isNarrow?10:13),borderRadius:"50%",display:"inline-block",background:j<fails?"#e74c3c":"#ddd"}}/>))}</div>
</div>
<button onPointerDown={onToggleMin} style={{padding:isTabletSI?"20px 36px":"4px 8px",border:"1px solid var(--border-input)",borderRadius:isTabletSI?14:8,background:"transparent",color:"var(--text-muted)",fontSize:isTabletSI?44:14,fontWeight:800,cursor:"pointer",flexShrink:0}}>▼</button>
</div>
{teamScore>=PEN&&<div style={{fontSize:isTabletSI?18:13,fontWeight:700,color:"var(--text-warning)",marginBottom:isTabletSI?4:2,display:"flex",alignItems:"center",gap:3}}><AlertTriangle size={isTabletSI?18:14}/> フォルト=25点</div>}
<div style={{display:"flex",justifyContent:"center"}}>
<div style={{display:"flex",gap:GAP,alignItems:"stretch"}}>
{/* Pin layout buttons + undo */}
<div style={{display:"flex",flexDirection:"column",gap:NG}}>
{[[7,9,8],[5,11,12,6],[3,10,4],[1,2]].map((row,ri)=>(<div key={ri} style={{display:"flex",gap:NG,justifyContent:"center"}}>{row.map(n=>{const isSel=sel===n;return(<button key={n} onPointerDown={()=>setSel(sel===n?null:n)} style={{width:NB,height:NB,borderRadius:NB/2,border:isSel?"3px solid var(--bg-secondary)":"2px solid #8899aa",background:isSel?"var(--bg-secondary)":"var(--bg-surface)",color:isSel?"var(--text-inverse)":"var(--text-primary)",fontSize:NFS,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.05s",boxShadow:isSel?"0 2px 8px rgba(20,54,90,0.3)":"none",padding:0}}>{n}</button>);})}</div>))}
{/* Undo button: same width as pin buttons area, under 1,2 */}
<div style={{display:"flex",justifyContent:"center"}}>
<button style={{width:NB*2+NG,padding:isTabletSI?"8px 0":"4px 0",border:"1px solid var(--border-input)",borderRadius:isTabletSI?10:8,background:"#f5f5f5",color:"#666",fontSize:isTabletSI?16:12,fontWeight:800,cursor:"pointer",opacity:canUndo?1:0.2}} onPointerDown={canUndo?()=>dispatch({type:"UNDO"}):undefined}><Undo2 size={isTabletSI?16:12} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/> 戻る</button>
</div>
</div>
{/* Action buttons: decide / fault / miss */}
<div style={{width:ACT_W,display:"flex",flexDirection:"column",gap:isNarrow?4:(isTabletSI?10:6),flexShrink:0}}>
<button style={{flex:1,border:"none",borderRadius:isNarrow?10:(isTabletSI?16:14),background:sel!=null?"var(--bg-secondary)":"#ccc",color:"var(--text-inverse)",fontSize:isNarrow?20:(isTabletSI?34:26),fontWeight:900,cursor:"pointer",boxShadow:sel!=null?"0 2px 8px rgba(20,54,90,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center"}} onPointerDown={doScore}>決定</button>
<button style={{padding:isNarrow?"10px 0":(isTabletSI?"16px 0":"12px 0"),border:"2px solid #f0b0b0",borderRadius:isNarrow?8:(isTabletSI?12:10),background:"#fde8e8",color:"var(--text-danger)",fontSize:isNarrow?13:(isTabletSI?20:15),fontWeight:900,cursor:"pointer",flexShrink:0}} onPointerDown={doFault}>x フォルト</button>
<button style={{flex:1,border:"2px solid #f0d4a0",borderRadius:isNarrow?10:(isTabletSI?16:14),background:"#fff3e0",color:"var(--accent-orange)",fontSize:isNarrow?15:(isTabletSI?24:17),fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onPointerDown={doMiss}>{"－"} ミス</button>
</div>
</div>
</div>
</div>);
}

/* ═══ Player Modal ═══ */
function PlModal({teams,dispatch,onClose,isAdmin,courtCount,courtAllocation,onUpdateCourtAllocation}){
const{favs,addF,rmF,editF}=useFavs();const[name,setName]=useState("");
const sizes=teams.map(t=>t.players.filter(p=>p.active).length);const mi=sizes.indexOf(Math.min(...sizes));const[sel,setSel]=useState(mi);
const[addConf,setAddConf]=useState(null);const[delConf,setDelConf]=useState(null);
const[activeCourt,setActiveCourt]=useState(1);
const cc=courtCount||1;
const tog=(ti,pi,a)=>{const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.map((p,j)=>j===pi?{...p,active:a}:p)}:t);dispatch({type:"SET_TEAMS",teams:nt});};
const rmPlayer=(ti,pi)=>{
/* Block if this would leave any team with 0 active players */
const team=teams[ti];const activeCount=team.players.filter(p=>p.active).length;
const isActive=team.players[pi]&&team.players[pi].active;
if(isActive&&activeCount<=1){window.alert("各チームに最低1人のアクティブメンバーが必要です");setDelConf(null);return;}
const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.filter((_,j)=>j!==pi)}:t);dispatch({type:"SET_TEAMS",teams:nt});setDelConf(null);};
/* Paper court helpers */
const canDeleteFromPaperCourt=(courtNum,teamIdx,playerIdx)=>{
if(!courtAllocation||!courtAllocation.courtData||!courtAllocation.courtData[courtNum])return{ok:false,msg:"データなし"};
const courtTeams=courtAllocation.courtData[courtNum];
const afterDelete=courtTeams.map((t,ti)=>({...t,players:ti===teamIdx?t.players.filter((_,pi)=>pi!==playerIdx):[...t.players]}));
const totalPlayers=afterDelete.reduce((s,t)=>s+t.players.length,0);
if(totalPlayers<2)return{ok:false,msg:"各コートに最低2人のメンバーが必要です"};
const teamsWithPlayers=afterDelete.filter(t=>t.players.length>0).length;
if(teamsWithPlayers<2)return{ok:false,msg:"対戦するには最低2チームが必要です"};
return{ok:true};};
const addToPaperCourt=(courtNum,teamIdx,playerName)=>{
if(!courtAllocation)return;const updated=JSON.parse(JSON.stringify(courtAllocation));
updated.courtData[courtNum][teamIdx].players.push(playerName);onUpdateCourtAllocation(updated);};
const removeFromPaperCourt=(courtNum,teamIdx,playerIdx)=>{
if(!courtAllocation)return;const check=canDeleteFromPaperCourt(courtNum,teamIdx,playerIdx);
if(!check.ok){window.alert(check.msg);return;}
const updated=JSON.parse(JSON.stringify(courtAllocation));
updated.courtData[courtNum][teamIdx].players.splice(playerIdx,1);onUpdateCourtAllocation(updated);};
/* doAdd: works for both device court and paper court */
const doAdd=(n,tI)=>{const nm=(n||name).trim().slice(0,MAX_NAME);if(!nm)return;
if(activeCourt===1){const tg=tI??sel;if(teams[tg].players.length>=MAX_PL)return;setAddConf({nm,tg,court:1});}
else{const tg=tI??sel;if(courtAllocation&&courtAllocation.courtData&&courtAllocation.courtData[activeCourt]){const targetTeam=courtAllocation.courtData[activeCourt][tg];if(targetTeam&&targetTeam.players.length>=MAX_PL){window.alert("1チーム最大"+MAX_PL+"人までです");return;}}setAddConf({nm,tg,court:activeCourt});}};
const confirmAdd=()=>{if(!addConf)return;const{nm,tg,court}=addConf;
if(court===1){const nt=teams.map((t,i)=>i===tg?{...t,players:[...t.players,{name:nm,active:true}]}:t);dispatch({type:"SET_TEAMS",teams:nt});}
else{addToPaperCourt(court,tg,nm);}
setName("");setAddConf(null);};
/* Auto-add: find team with fewest active members */
const doAutoAdd=(n)=>{const nm=(n||name).trim().slice(0,MAX_NAME);if(!nm)return;
if(activeCourt===1){
const counts=teams.map(t=>t.players.filter(p=>p.active).length);
const underMax=counts.filter(c=>c<MAX_PL);
if(underMax.length===0){window.alert("全チームが上限("+MAX_PL+"人)に達しています");return;}
const minC=Math.min(...underMax);
const candidates=teams.map((t,i)=>({i,c:counts[i]})).filter(x=>x.c===minC&&x.c<MAX_PL);
const pick=candidates[Math.floor(Math.random()*candidates.length)];
setAddConf({nm,tg:pick.i,court:1,auto:true});}
else{
if(!courtAllocation||!courtAllocation.courtData||!courtAllocation.courtData[activeCourt])return;
const ct=courtAllocation.courtData[activeCourt];
const counts=ct.map(t=>t.players.length);
const underMax=counts.filter(c=>c<MAX_PL);
if(underMax.length===0){window.alert("全チームが上限("+MAX_PL+"人)に達しています");return;}
const minC=Math.min(...underMax);
const candidates=ct.map((t,i)=>({i,c:counts[i]})).filter(x=>x.c===minC&&x.c<MAX_PL);
const pick=candidates[Math.floor(Math.random()*candidates.length)];
setAddConf({nm,tg:pick.i,court:activeCourt,auto:true});}};
/* Get teams list for current court's add section */
const addTeamsList=activeCourt===1?teams:(courtAllocation&&courtAllocation.courtData&&courtAllocation.courtData[activeCourt])?courtAllocation.courtData[activeCourt]:[];
/* Get add confirmation team name */
const getConfTeamName=()=>{if(!addConf)return"";if(addConf.court===1)return teams[addConf.tg]?.name||"";
if(courtAllocation&&courtAllocation.courtData&&courtAllocation.courtData[addConf.court])return courtAllocation.courtData[addConf.court][addConf.tg]?.name||"";return"";};
const allUsed=activeCourt===1?teams.flatMap(t=>t.players.filter(p=>p.active).map(p=>p.name)):[];
/* Reset sel when switching courts */
const courtTeamsForSel=activeCourt===1?teams:addTeamsList;
const effectiveSel=sel<courtTeamsForSel.length?sel:0;
return(<div style={SS.ov} onClick={onClose}><div className="mk-fade-scale-in" style={{...SS.mod,position:"relative",overflow:"visible"}} onClick={e=>e.stopPropagation()}><div style={{maxHeight:"90vh",overflow:"auto",WebkitOverflowScrolling:"touch"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:32,fontWeight:900,color:"var(--text-primary)",display:"flex",alignItems:"center",gap:6}}><Users size={28}/> メンバー</h2><button style={SS.clsB} onClick={onClose}>✕</button></div>
{/* Court switching tabs (only when courtCount >= 2) */}
{cc>=2&&<div style={{display:"flex",gap:4,marginBottom:12}}>
{Array.from({length:cc},(_,i)=>i+1).map(cn=>(<button key={cn} onClick={()=>{setActiveCourt(cn);setSel(0);}} style={{flex:1,padding:"8px 0",border:"none",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer",background:activeCourt===cn?"var(--accent-blue)":"rgba(0,0,0,0.06)",color:activeCourt===cn?"#fff":"#666"}}>{cn===1?"📱":"📋"} {cn}コート</button>))}
</div>}
{/* Device court (court 1): existing behavior */}
{activeCourt===1&&<>
{teams.map((team,ti)=>(<div key={ti} style={{marginBottom:12}}>
<div style={{fontSize:18,fontWeight:700,color:C[ti].tx,borderBottom:"2px solid "+C[ti].ac,paddingBottom:4,marginBottom:5}}>{team.name}（{team.players.filter(p=>p.active).length}人）</div>
{team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",padding:"6px 12px",background:p.active?"#f8f9fa":"#f0f0f0",borderRadius:8,marginBottom:4,opacity:p.active?1:0.4}}>
<span style={{flex:1,fontSize:17}}>{p.name}</span>
<div style={{display:"flex",gap:5}}>
<button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"var(--text-inverse)"}}>{p.active?"退出":"復帰"}</button>
<button onClick={()=>setDelConf({ti,pi,name:p.name,court:1})} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:"#888",color:"var(--text-inverse)"}}>削除</button>
</div>
</div>))}
</div>))}
</>}
{/* Paper court (court 2, 3): show from courtAllocation */}
{activeCourt>=2&&courtAllocation&&courtAllocation.courtData&&courtAllocation.courtData[activeCourt]&&<>
{courtAllocation.courtData[activeCourt].map((team,ti)=>(<div key={ti} style={{marginBottom:12}}>
<div style={{fontSize:18,fontWeight:700,color:C[ti]?C[ti].tx:"#333",borderBottom:"2px solid "+(C[ti]?C[ti].ac:"#ccc"),paddingBottom:4,marginBottom:5}}>{team.name}（{team.players.length}人）</div>
{team.players.map((pName,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",padding:"6px 12px",background:"#f8f9fa",borderRadius:8,marginBottom:4}}>
<span style={{flex:1,fontSize:17}}>{pName}</span>
<div style={{display:"flex",gap:5}}>
<button onClick={()=>setDelConf({ti,pi,name:pName,court:activeCourt})} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:"#888",color:"var(--text-inverse)"}}>削除</button>
</div>
</div>))}
</div>))}
</>}
<div style={{background:"#e6f0fb",borderRadius:10,padding:14,marginTop:8}}>
<div style={{fontSize:16,fontWeight:700,marginBottom:6}}>➕追加</div>
<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
<select value={effectiveSel} onChange={e=>setSel(+e.target.value)} style={{padding:8,borderRadius:8,border:"1px solid var(--border-input)",fontSize:16}}>{addTeamsList.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select>
<input value={name} onChange={e=>setName(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder="名前" style={{flex:1,minWidth:80,padding:8,borderRadius:8,border:"1px solid var(--border-input)",fontSize:16}}/>
<button onClick={()=>doAdd()} style={{minWidth:80,padding:"8px 14px",borderRadius:8,border:"none",background:"var(--accent-blue)",color:"var(--text-inverse)",fontWeight:700,fontSize:15,cursor:"pointer",opacity:name.trim()?1:0.3}}>追加</button>
<button onClick={()=>doAutoAdd()} style={{minWidth:80,padding:"8px 14px",borderRadius:8,border:"none",background:"#22b566",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",opacity:name.trim()?1:0.3}}>自動追加</button>
<FavDropdown favs={favs} addF={addF} rmF={rmF} editF={editF} onPick={n=>setName(n)} usedNames={allUsed} isAdmin={isAdmin}/>
</div>
</div>
</div>
{addConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:6}}>{addConf.auto?"メンバー自動追加":"メンバー追加確認"}</div>
<div style={{fontSize:16,marginBottom:16}}>{"「"+addConf.nm+"」を"}<br/><span style={{fontWeight:800,color:C[addConf.tg]?.tx||"#333"}}>{getConfTeamName()}</span>{"に追加します。"}{addConf.auto&&<><br/><span style={{fontSize:13,color:"var(--text-secondary)"}}>投げ順はチーム内最後になります。</span></>}</div>
<div style={{display:"flex",gap:8}}><button onClick={confirmAdd} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>決定</button><button onClick={()=>setAddConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--bg-secondary)",borderRadius:10,background:"transparent",color:"var(--text-primary)",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
</div></div>}
{delConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> メンバー削除</div>
<div style={{fontSize:16,marginBottom:16}}>{"「"+delConf.name+"」を完全に削除しますか？"}<br/><span style={{fontSize:13,color:"var(--text-secondary)"}}>この操作は元に戻せません</span></div>
<div style={{display:"flex",gap:8}}><button onClick={()=>{if(delConf.court===1){rmPlayer(delConf.ti,delConf.pi);}else{removeFromPaperCourt(delConf.court,delConf.ti,delConf.pi);setDelConf(null);}}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button><button onClick={()=>setDelConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
</div></div>}

  </div></div>);
}

export function OrderPicker({teams,teamOrder,value,onChangeOrd,prevOrder,shufAnim,onShufAnimDone}){
const rev=[...teamOrder].reverse();const rot=[...teamOrder.slice(1),teamOrder[0]];const[man,setMan]=useState([...teamOrder]);const[randOrd,setRandOrd]=useState(null);const[randTeams,setRandTeams]=useState(null);const[hasShuffled,setHasShuffled]=useState(false);const[shufAnimData,setShufAnimData]=useState(null);
const mvUp=i=>{if(i===0)return;const m=[...man];[m[i-1],m[i]]=[m[i],m[i-1]];setMan(m);onChangeOrd("manual",m,null);};
const doRand=()=>{
/* Collect all active players from all teams */
const allPlayers=[];const teamSizes=[];
teamOrder.forEach(ti=>{const ap=teams[ti].players.filter(p=>typeof p==="object"?p.active:true);teamSizes.push(ap.length);ap.forEach(p=>allPlayers.push(typeof p==="object"?p:{name:p,active:true}));});
const prevSets=teams.map(t=>{const ap=t.players.filter(p=>typeof p==="object"?p.active:true);return new Set(ap.map(p=>typeof p==="object"?p.name:p));});
const nTeams=teamOrder.length;
const tryOnce=()=>{const shuffled=shuf(allPlayers.map(p=>({...p})));const newTeams=teams.map(t=>({...t,players:t.players.map(p=>({...p}))}));
let idx=0;teamOrder.forEach((ti,oi)=>{const size=teamSizes[oi];const subset=shuffled.slice(idx,idx+size);newTeams[ti]={...newTeams[ti],players:subset};idx+=size;});
return newTeams;};
let newTeams=tryOnce();
if(allPlayers.length>nTeams){for(let att=0;att<10;att++){const same=teamOrder.some(ti=>{const ns=new Set(newTeams[ti].players.map(p=>p.name));return prevSets.some(ps=>ps.size===ns.size&&[...ns].every(n=>ps.has(n)));});if(!same)break;newTeams=tryOnce();}}
const newOrd=shuf([...teamOrder]);
setRandOrd(newOrd);setRandTeams(newTeams);setHasShuffled(true);
if(shufAnim){const allNames=[];newOrd.forEach(ti=>{newTeams[ti].players.forEach(p=>allNames.push(p.name));});
const animTeams=newOrd.map(ti=>({name:newTeams[ti].name,players:newTeams[ti].players.map(p=>p.name)}));
setShufAnimData({names:allNames,teams:animTeams,order:newOrd,newTeams});}
else{onChangeOrd("random",newOrd,newTeams);}};
const pick=v=>{if(v==="same")onChangeOrd("same",[...teamOrder],null);else if(v==="reverse")onChangeOrd("reverse",rev,null);else if(v==="rotate")onChangeOrd("rotate",rot,null);else if(v==="random"){if(randOrd)onChangeOrd("random",randOrd,randTeams);else onChangeOrd("random",[...teamOrder],null);/* show tab without auto-shuffle */}
else onChangeOrd("manual",man,null);};
const dispTeams=value==="random"&&randTeams?randTeams:teams;
const disp=value==="reverse"?rev:value==="rotate"?rot:value==="manual"?man:value==="same"?[...teamOrder]:value==="random"?(randOrd||[...teamOrder]):null;
return(<><div style={{display:"flex",gap:6,marginBottom:6}}>{[["same","🔁同順"],["reverse","🔄裏"],["rotate","🔃ローテ"],["random","🎲ランダム"],["manual","✏️手動"]].map(([k,l])=>(<button key={k} onClick={()=>pick(k)} style={{flex:1,padding:"8px 0",border:"1px solid var(--border-input)",borderRadius:8,background:value===k?"var(--bg-secondary)":"var(--bg-surface)",color:value===k?"var(--text-inverse)":"var(--text-primary)",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}}>{l}</button>))}</div>
{value==="random"&&<button onClick={()=>{if(!hasShuffled||window.confirm("シャッフルし直しますか？"))doRand();}} style={{width:"100%",marginBottom:6,padding:"10px 0",border:"2px dashed var(--accent-blue)",borderRadius:8,background:"transparent",color:"var(--accent-blue)",fontSize:15,fontWeight:700,cursor:"pointer"}}><RefreshCw size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> {hasShuffled?"再シャッフル":"シャッフル"}</button>}
{disp&&(<div style={{background:"var(--bg-surface-dim)",borderRadius:8,padding:8,marginBottom:6}}>{disp.map((ti,i)=>{const t=dispTeams[ti];const ap=t?.players?t.players.filter(p=>typeof p==="object"?p.active:true):[];return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<disp.length-1?"1px solid var(--neutral-100)":"none"}}><span style={{fontSize:16,fontWeight:800,color:C[ti]?.ac||"#aaa",width:24,textAlign:"center"}}>{i+1}</span><span style={{fontSize:17,fontWeight:700,color:C[ti]?.tx||"#333"}}>{t?.name||""}</span><span style={{fontSize:13,color:"var(--text-secondary)",marginLeft:2}}>{ap.map(p=>typeof p==="object"?p.name:p).join("・")}</span>{value==="manual"&&i>0&&<button onClick={()=>mvUp(i)} style={{marginLeft:"auto",padding:"4px 10px",border:"1px solid var(--border-input)",borderRadius:5,background:"var(--bg-surface)",fontSize:12,cursor:"pointer"}}>▲</button>}</div>);})}
</div>)}
{shufAnimData&&<ShuffleAnimation names={shufAnimData.names} teams={shufAnimData.teams} onDone={()=>{onChangeOrd("random",shufAnimData.order,shufAnimData.newTeams);setShufAnimData(null);}}/>}
</>);
}

export function GameScreen({initialTeams,initialOrder,bestOf:iBo,numGames:iNg,dqEnd,goBack,saveToStatsProp,recoverData,selectedLocation,piAddress,isAdmin,aiEnabled,shufAnim,hasCourtAllocation,clearCourtAllocation,courtCount,courtAllocation,onUpdateCourtAllocation,GameResult,StatsModal,windDebugEnabled,onWindDebugLog,onWindDebugConnected}){
const windSensorEnabled=!!piAddress;
const init=recoverData?{
teams:recoverData.teams.map(t=>({...t,players:t.players.map(p=>typeof p==="string"?{name:p,active:true}:p)})),
history:recoverData.history,currentOrderIdx:recoverData.currentOrderIdx,currentTurn:recoverData.currentTurn,
teamOrder:recoverData.teamOrder,eliminated:recoverData.eliminated,
winner:recoverData.winner!=null?recoverData.winner:null,gameNumber:recoverData.gameNumber||1,dqEndGame:recoverData.dqEndGame!==undefined?recoverData.dqEndGame:dqEnd,
autoEnd:!!recoverData.autoEnd,turnStartTime:Date.now(),plOffsets:recoverData.plOffsets||recoverData.teams.map(()=>0)
}:{teams:initialTeams.map(t=>({...t,players:t.players.map(n=>({name:n,active:true}))})),history:[],currentOrderIdx:0,currentTurn:1,teamOrder:initialOrder,eliminated:initialTeams.map(()=>false),winner:null,gameNumber:1,dqEndGame:dqEnd,autoEnd:false,turnStartTime:Date.now(),plOffsets:initialTeams.map(()=>0)};
const[st,dispatch]=useReducer(reducer,init);const{teams,history,currentOrderIdx,currentTurn,teamOrder,eliminated,winner,gameNumber,plOffsets,autoEnd,dqEndGame}=st;
const[showPl,setShowPl]=useState(false);const[showRes,setShowRes]=useState(()=>!!(recoverData&&recoverData.winner!=null));
const[savedGameDateKey,setSavedGameDateKey]=useState(null);
const[view,setView]=useState("both");const[conf,setConf]=useState(null);
const[gW,setGW]=useState(()=>(recoverData&&recoverData.gW)?recoverData.gW:initialTeams.map(()=>0));
const[numGames,setNumGames]=useState(recoverData&&recoverData.numGames?recoverData.numGames:iNg);const[bestOf,setBestOf]=useState(recoverData&&recoverData.bestOf?recoverData.bestOf:iBo);
const[saveDialog,setSaveDialog]=useState(false);const[inputMin,setInputMin]=useState(false);
const[timestamps,setTimestamps]=useState([]);
const[animState,setAnimState]=useState({bounce:null,warn:null,flash:null,reset:null,shake:null,confetti:false});
const turnStartRef=useRef(Date.now());
const ti=teamOrder[currentOrderIdx];const score=scoreOf(history,ti);const fails=failsOf(history,ti);
const{ap:_ap,pi:cpIdx}=teams[ti]?getPI(teams,history,ti,plOffsets):{ap:[],pi:0};
const ap=_ap;const cp=ap.length>0?ap[cpIdx]:null;
const activeCell=winner===null?{teamIndex:ti,playerIndex:cpIdx,turn:currentTurn}:null;
const _initSaved=(()=>{const m={};if(recoverData&&recoverData.winner!=null){m[((recoverData.gameNumber||1)+"-"+recoverData.history.length)]=true;}return m;})();
const statsSavedRef=useRef(_initSaved);
const weatherStartRef=useRef(null);
const weatherEndRef=useRef(null);
/* Record timestamp when score is entered */
const prevHistLen=useRef(0);
useEffect(()=>{
if(history.length>prevHistLen.current){
const dur=(Date.now()-turnStartRef.current)/1000;
const hIdx=history.length-1;
setTimestamps(p=>[...p,{histIdx:hIdx,ts:Date.now(),dur}]);
turnStartRef.current=Date.now();
/* Wind sensor snapshot */
if(windSensorEnabled&&windManagerRef.current){
const snap=windManagerRef.current.snapshot();
if(snap)setTurnWindData(prev=>[...prev,snap]);
}
/* Trigger animations based on last entry */
const last=history[history.length-1];
if(last){
const tI=last.teamIndex;
if(last.type==="score"){
setAnimState(p=>({...p,bounce:tI}));
setTimeout(()=>setAnimState(p=>({...p,bounce:null})),500);
if(last.reset25){setAnimState(p=>({...p,reset:tI}));setTimeout(()=>setAnimState(p=>({...p,reset:null})),800);}
}
if((last.type==="miss"||last.type==="fault")&&last.consecutiveFails===2){
setAnimState(p=>({...p,warn:tI}));setTimeout(()=>setAnimState(p=>({...p,warn:null})),1000);
}
if((last.type==="miss"||last.type==="fault")&&last.consecutiveFails>=MF){
setAnimState(p=>({...p,flash:tI,shake:tI}));setTimeout(()=>setAnimState(p=>({...p,flash:null,shake:null})),600);
}
}
} else if(history.length<prevHistLen.current){
setTimestamps(p=>p.slice(0,-1));
if(windSensorEnabled)setTurnWindData(prev=>prev.slice(0,-1));
turnStartRef.current=Date.now();
}
prevHistLen.current=history.length;
},[history.length]);

/* Auto-save progress for crash recovery (includes result screen) */
useEffect(()=>{
try{
const snapshot={teams:teams.map(t=>({name:t.name,players:t.players.map(p=>({name:p.name,active:p.active}))})),history,teamOrder,currentOrderIdx,currentTurn,eliminated,gameNumber,plOffsets,dqEndGame:dqEnd,winner,autoEnd:!!autoEnd,gW:gW,numGames,bestOf,selectedLocation:selectedLocation||null,savedAt:Date.now()};
if(_db)idbSet(_db,"game-progress",snapshot).catch(e=>console.error("progress save error",e));
}catch(e){console.error("Progress save failed:",e);}
},[history,eliminated,currentTurn,winner,gW]);
/* iOS safety: also save on pagehide/visibilitychange (fires before app kill) */
useEffect(()=>{
const saveNow=()=>{try{
const snapshot={teams:teams.map(t=>({name:t.name,players:t.players.map(p=>({name:p.name,active:p.active}))})),history,teamOrder,currentOrderIdx,currentTurn,eliminated,gameNumber,plOffsets,dqEndGame:dqEnd,winner,autoEnd:!!autoEnd,gW:gW,numGames,bestOf,selectedLocation:selectedLocation||null,savedAt:Date.now()};
if(_db)idbSet(_db,"game-progress",snapshot).catch(e=>console.error("progress save error",e));
}catch(e){}};
const onVisChange=()=>{if(document.visibilityState==="hidden")saveNow();};
document.addEventListener("visibilitychange",onVisChange);
window.addEventListener("pagehide",saveNow);
return()=>{document.removeEventListener("visibilitychange",onVisChange);window.removeEventListener("pagehide",saveNow);};
},[history,eliminated,currentTurn,winner,teams,teamOrder,currentOrderIdx,gameNumber,plOffsets,gW,numGames,bestOf,autoEnd]);

useEffect(()=>{fetchWeatherData(selectedLocation).then(data=>{weatherStartRef.current=data;});},[]);

/* ═══ Wind Sensor ═══ */
const[currentWind,setCurrentWind]=useState(null);
const[windConnected,setWindConnected]=useState(false);
const[compassValid,setCompassValid]=useState(false);
const[turnWindData,setTurnWindData]=useState([]);
const windManagerRef=useRef(null);
const[windToast,setWindToast]=useState(null);
useEffect(()=>{
if(!windSensorEnabled)return;
const manager=new WindSensorManager();
windManagerRef.current=manager;
manager.onDataCallback=(data)=>{
setCurrentWind(data);
setCompassValid(!!data.compass_valid);
if(manager.compassHeadingInitial==null&&data.compass_valid){
manager.setInitialCompassHeading();
}
};
manager.onStatusCallback=(status)=>{
setWindConnected(status.connected);
if(windDebugEnabled&&onWindDebugConnected)onWindDebugConnected(status.connected);
};
if(windDebugEnabled&&onWindDebugLog){
manager.onDebugLogCallback=(logs)=>{onWindDebugLog(logs);};
}
manager.connect(piAddress);
return()=>{manager.disconnect();windManagerRef.current=null;if(windDebugEnabled&&onWindDebugConnected)onWindDebugConnected(false);};
},[windSensorEnabled,piAddress]);

useEffect(()=>{if(winner!==null&&!showRes){
setGW(p=>{const n=[...p];n[winner]++;return n;});setShowRes(true);
setAnimState(p=>({...p,confetti:true}));setTimeout(()=>setAnimState(p=>({...p,confetti:false})),3000);
const key=gameNumber+"-"+history.length;
if(!statsSavedRef.current[key]){
statsSavedRef.current[key]=true;
const d=new Date().toISOString();
setSavedGameDateKey(d);
/* Save replay for score table viewing */
const fieldType=selectedLocation?selectedLocation.field_type:null;
const roofType=null;
saveReplay(d,teams,history,teamOrder,winner,autoEnd,dqEndGame,{field:fieldType,roof:roofType,venueType:selectedLocation?selectedLocation.venue_type||"outdoor":null,locationName:selectedLocation?selectedLocation.place_name:null,fieldName:selectedLocation?selectedLocation.sub_name:null,locationId:selectedLocation?selectedLocation.id:null});
/* Save stats */
if(saveToStatsProp){
const favs=loadFavs();
const buildAndSave=async()=>{
let env=null;
try{
const endData=await fetchWeatherData(selectedLocation);
weatherEndRef.current=endData;
const startData=weatherStartRef.current;
if(startData||endData||fieldType||roofType){
const weatherSource=endData||startData;
const avgWind=(startData&&endData)?Math.round((startData.windSpeed+endData.windSpeed)/2*10)/10:weatherSource?Math.round(weatherSource.windSpeed*10)/10:null;
const avgWindDir=(startData&&endData&&startData.windDirection!=null&&endData.windDirection!=null)?Math.round((startData.windDirection+endData.windDirection)/2):weatherSource?.windDirection!=null?Math.round(weatherSource.windDirection):null;
env={field:fieldType,roof:roofType,venueType:selectedLocation?selectedLocation.venue_type||"outdoor":null,weatherCode:weatherSource?.weatherCode??null,weather:weatherSource?getWeatherInfo(weatherSource.weatherCode).label:null,temp:weatherSource?.temp??null,windSpeed:avgWind,windDirection:avgWindDir,windStart:startData?.windSpeed??null,windEnd:endData?.windSpeed??null,locationName:selectedLocation?selectedLocation.place_name:null,fieldName:selectedLocation?selectedLocation.sub_name:null,locationId:selectedLocation?selectedLocation.id:null};
}
}catch(e){console.error("env build error:",e);}
const records=buildGameRecord(teams,history,teamOrder,winner,timestamps,favs,d,env);
saveGameStatsToDB(records);
};
buildAndSave();
}
}
}},[winner]);

const execConf=()=>{if(!conf)return;if(conf.t==="score")dispatch({type:"SCORE",score:conf.s});else if(conf.t==="miss")dispatch({type:"MISS"});else dispatch({type:"FAULT"});setConf(null);};
const handleNext=(order,newTeams)=>{if(newTeams)dispatch({type:"SET_TEAMS",teams:newTeams});dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);setTurnWindData([]);turnStartRef.current=Date.now();fetchWeatherData(selectedLocation).then(data=>{weatherStartRef.current=data;});weatherEndRef.current=null;};
const handleExtend=(type,order,newTeams)=>{if(type==="game")setNumGames(p=>p+1);else if(type==="set")setBestOf(p=>p+1);if(newTeams)dispatch({type:"SET_TEAMS",teams:newTeams});dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);setTurnWindData([]);turnStartRef.current=Date.now();fetchWeatherData(selectedLocation).then(data=>{weatherStartRef.current=data;});weatherEndRef.current=null;};
const extractTeamInfo=()=>teams.map(t=>({name:t.name,players:t.players.map(p=>p.name)}));
const handleReshuffle=(type)=>{setShowRes(false);goBack(null,type);};
const handleBack=()=>setSaveDialog(true);const[caKeepDialog,setCaKeepDialog]=useState(false);const[caKeepDiscard,setCaKeepDiscard]=useState(0);/* 0=none,1=first,2=second */
const doBack=save=>{setSaveDialog(false);setShowRes(false);goBack(save?extractTeamInfo():null);};
const doBackNoSaveWithCA=()=>{setSaveDialog(false);if(hasCourtAllocation){setCaKeepDialog(true);}else{setShowRes(false);goBack(null);}};
const gsVw=typeof window!=="undefined"?window.innerWidth:375;const isTablet=gsVw>=768;const nTeams=teamOrder.length;
/* Miss dot component: filled circle = miss, empty circle = no miss */
const MissDots=({f,size})=>{const s=size||8;return(<div style={{display:"flex",gap:2,alignItems:"center"}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:s,height:s,borderRadius:"50%",display:"inline-block",background:j<f?(f>=2?"#c0392b":"#e6a817"):"rgba(120,120,120,0.25)",border:j>=f?"1px solid rgba(120,120,120,0.3)":"none"}}/>))}</div>);};
/* Active team card: full-width info card with team color */
const ActiveCard=()=>{const t=teams[ti];const sc=scoreOf(history,ti);const f=failsOf(history,ti);const el=eliminated[ti];
const isBounce=animState.bounce===ti;const isWarn=animState.warn===ti;const isFlash=animState.flash===ti;const isReset=animState.reset===ti;const isShake=animState.shake===ti;
const anim=isShake&&isFlash?"mk-shake 0.5s ease,mk-danger-flash 0.6s ease":isShake?"mk-shake 0.5s ease":isWarn?"mk-warn-pulse 0.5s ease 2":isFlash?"mk-danger-flash 0.6s ease":"none";
const scAnim=isBounce?"mk-scale-bounce 0.4s ease":isReset?"mk-reset-blink 0.8s ease":"none";
const acFS=isTablet?32:17;
return(<div style={{flexShrink:0,background:"#14365a",borderBottom:"1px solid rgba(0,0,0,0.15)",animation:anim,display:"flex",alignItems:"center",gap:0}}>
<div style={{width:isTablet?6:5,alignSelf:"stretch",background:"#ffc107",flexShrink:0}}/>
<div style={{flex:1,padding:isTablet?"14px 18px":"7px 10px",display:"flex",alignItems:"center",gap:isTablet?16:8,flexWrap:"nowrap",minWidth:0}}>
<span style={{fontSize:acFS,fontWeight:900,color:"#fff",whiteSpace:"nowrap",flexShrink:0,textDecoration:el?"line-through":"none"}}>{t.name}{el?" DQ":""}{(bestOf>0||numGames>1)?" "+gW[ti]+"勝":""}</span>
{cp&&<span style={{fontSize:acFS,fontWeight:700,color:"#ffc107",whiteSpace:"nowrap",flexShrink:1,minWidth:0}}>{cp.name}</span>}
<span style={{fontSize:isTablet?38:20,fontWeight:900,color:isReset?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",lineHeight:1,flexShrink:0,animation:scAnim}}>{sc}<span style={{fontSize:isTablet?20:11,fontWeight:700}}>点</span></span>
<MissDots f={f} size={isTablet?20:9}/>
<GameWindWidget currentWind={windConnected?currentWind:null}/>
</div>
</div>);};
/* Inactive teams row */
const InactiveRow=()=>{const others=teamOrder.filter(idx=>idx!==ti);if(others.length===0)return null;
const oFS=isTablet?20:11;
return(<div style={{flexShrink:0,display:"flex",gap:0,background:"#1a2a3e",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
{others.map((oIdx,oi)=>{const t=teams[oIdx];const sc=scoreOf(history,oIdx);const f=failsOf(history,oIdx);const el=eliminated[oIdx];
const{ap:oAp,pi:oPi}=getPI(teams,history,oIdx,plOffsets);const ocp=oAp.length>0?oAp[oPi]:null;
const oiOrder=teamOrder.indexOf(oIdx)+1;
const isBounce2=animState.bounce===oIdx;const isReset2=animState.reset===oIdx;
const scAnim2=isBounce2?"mk-scale-bounce 0.4s ease":isReset2?"mk-reset-blink 0.8s ease":"none";
return(<React.Fragment key={oIdx}>{oi>0&&<div style={{width:1,alignSelf:"stretch",background:"rgba(255,255,255,0.15)"}}/>}
<div style={{flex:1,minWidth:0,padding:isTablet?"8px 12px":"3px 6px",opacity:el?0.35:1,display:"flex",alignItems:"center",gap:isTablet?8:4,flexWrap:"nowrap"}}>
<span style={{fontSize:oFS,fontWeight:800,color:"#fff",flexShrink:0}}>{oiOrder}</span>
<span style={{fontSize:oFS,fontWeight:700,color:"#fff",whiteSpace:"nowrap",flexShrink:0,textDecoration:el?"line-through":"none"}}>{t.name}</span>
<span style={{fontSize:isTablet?24:13,fontWeight:900,color:isReset2?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",flexShrink:0,animation:scAnim2}}>{sc}</span>
{ocp&&<span style={{fontSize:oFS,fontWeight:600,color:"rgba(255,255,255,0.7)",whiteSpace:"nowrap",flexShrink:1,minWidth:0}}>{ocp.name}</span>}
<MissDots f={f} size={isTablet?12:6}/>
</div></React.Fragment>);})}
</div>);};
return(
<div style={SS.gW} className="mk-slide-in-left">
{/* Header: match info only */}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isTablet?"calc(8px + env(safe-area-inset-top, 0px)) 14px 8px":"calc(3px + env(safe-area-inset-top, 0px)) 10px 3px",background:"var(--bg-secondary)",flexShrink:0,gap:6}}>
<div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>
<button style={{...SS.tBtn,padding:isTablet?"7px 10px":"5px 8px"}} onClick={handleBack}><ChevronLeft size={isTablet?18:14}/></button>
<button style={{...SS.tBtn,padding:isTablet?"7px 10px":undefined}} onClick={()=>setShowPl(true)}><Users size={isTablet?18:14}/></button>
{windSensorEnabled&&<span style={{fontSize:isTablet?14:11,fontWeight:700,padding:isTablet?"4px 10px":"2px 6px",borderRadius:6,background:windConnected?"rgba(34,181,102,0.2)":"rgba(239,68,68,0.2)",color:windConnected?"#22b566":"#ef4444",whiteSpace:"nowrap"}}>{windConnected?"風速計OK":"風速計..."}</span>}
{windSensorEnabled&&windConnected&&<button style={{...SS.tBtn,padding:isTablet?"7px 10px":"5px 8px",fontSize:isTablet?12:10,fontWeight:700}} onClick={()=>{if(windManagerRef.current){windManagerRef.current.resetCompassHeading();setWindToast("風速計の基準方向を再設定しました");setTimeout(()=>setWindToast(null),2000);}}}><RefreshCw size={isTablet?14:12}/></button>}
</div>
<span style={{fontSize:isTablet?28:16,fontWeight:isTablet?900:700,color:"#fff",textAlign:"center",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gameNumber}試合目 {currentTurn}ターン目{bestOf>0?" "+bestOf+"先取":""}</span>
<div style={{display:"flex",gap:2,flexShrink:0}}>
<div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:7,padding:2,gap:2}}>{[["both","両方"],["sheet","表"],["input","入力"]].map(([k,l])=>(<button key={k} onClick={()=>setView(k)} style={{padding:isTablet?"6px 12px":"4px 9px",border:"none",borderRadius:5,background:view===k?"rgba(255,255,255,0.2)":"transparent",color:view===k?"#fff":"rgba(255,255,255,0.4)",fontSize:isTablet?16:12,fontWeight:600,cursor:"pointer"}}>{l}</button>))}</div>
</div>
</div>
{/* Wind sensor compass warning banner */}
{windSensorEnabled&&windConnected&&!compassValid&&(
<div style={{padding:"8px 12px",background:"rgba(251,191,36,0.15)",border:"1px solid #fbbf24",borderRadius:6,margin:"4px 10px 0",fontSize:14,color:"#b45309"}}>{"⚠"} コンパス異常 — 風向きデータなし（風速のみ記録中）</div>
)}
{/* Active team card */}
{(view==="both"||view==="input")&&<ActiveCard/>}
{/* Inactive teams row */}
{(view==="both"||view==="input")&&<InactiveRow/>}
<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
{(view==="both"||view==="sheet")&&(<div style={{flex:view==="both"?1:"1",minHeight:0,overflow:"hidden"}}><GameSheet teams={teams} history={history} currentTurn={currentTurn} teamOrder={teamOrder} activeCell={activeCell}/></div>)}
{(view==="both"||view==="input")&&(<ScoreInput dispatch={dispatch} canUndo={history.length>0} teamName={teams[ti].name} teamScore={score} teamColor={C[ti].ac} playerName={cp?.name} fails={fails} onConfirm={(t,s,m)=>setConf({t,s,msg:m})} minimized={inputMin} onToggleMin={()=>setInputMin(p=>!p)}/>)}
</div>
{showPl&&<PlModal teams={teams} dispatch={dispatch} onClose={()=>setShowPl(false)} isAdmin={isAdmin} courtCount={courtCount} courtAllocation={courtAllocation} onUpdateCourtAllocation={onUpdateCourtAllocation}/>}
{conf&&<Confirm msg={conf.msg} onOk={execConf} onCancel={()=>setConf(null)}/>}
{showRes&&winner!==null&&<GameResult teams={teams} history={history} teamOrder={teamOrder} winner={winner} gameWins={gW} bestOf={bestOf} numGames={numGames} gameNumber={gameNumber} onNext={handleNext} onBack={handleBack} onExtend={handleExtend} onReshuffle={handleReshuffle} hasCourtAllocation={hasCourtAllocation} courtCount={courtCount} timestamps={timestamps} isAdmin={isAdmin} aiEnabled={aiEnabled} autoEnd={!!autoEnd} dqEndGame={!!dqEndGame} shufAnim={shufAnim} StatsModal={StatsModal} windSensorEnabled={windSensorEnabled} piAddress={piAddress} turnWindData={turnWindData} gameDateKey={savedGameDateKey} windManagerRef={windManagerRef}/>}
{animState.confetti&&<CSSConfetti/>}
{windToast&&<div style={{position:"fixed",top:"calc(60px + env(safe-area-inset-top, 0px))",left:"50%",transform:"translateX(-50%)",background:"rgba(0,0,0,0.85)",color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:14,fontWeight:700,zIndex:9000,pointerEvents:"none"}}>{windToast}</div>}
{saveDialog&&<Confirm msg={"チーム・プレイヤー情報を\n設定画面に保存しますか？"} sub={"保存すると次のゲームで\n同じメンバーをすぐ使えます"} okLabel="保存する" cancelLabel="保存しない" thirdLabel="キャンセル（試合に戻る）" onOk={()=>doBack(true)} onCancel={doBackNoSaveWithCA} onThird={()=>setSaveDialog(false)}/>}
{caKeepDialog&&(<div style={{position:"fixed",inset:0,zIndex:9600,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#1a1a2e",borderRadius:16,padding:"24px 28px",maxWidth:380,width:"100%"}}>
{caKeepDiscard===0?(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>コート割り当てデータの扱い</div>
<div style={{display:"flex",flexDirection:"column",gap:10}}>
<button onClick={()=>{setCaKeepDialog(false);setCaKeepDiscard(0);setShowRes(false);goBack(null);}} style={{padding:"14px 0",border:"none",borderRadius:10,background:"var(--accent-blue)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>コート割り当ては保持する</button>
<button onClick={()=>setCaKeepDiscard(1)} style={{padding:"14px 0",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:15,fontWeight:800,cursor:"pointer"}}>コート割り当ても破棄する</button>
<button onClick={()=>{setCaKeepDialog(false);setCaKeepDiscard(0);setSaveDialog(true);}} style={{padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>キャンセル</button>
</div>
</>):caKeepDiscard===1?(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>コート割り当てを破棄しますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>setCaKeepDiscard(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
<button onClick={()=>setCaKeepDiscard(0)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>いいえ</button>
</div>
</>):(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>この操作は取り消せません。破棄しますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>{setCaKeepDialog(false);setCaKeepDiscard(0);if(clearCourtAllocation)clearCourtAllocation();setShowRes(false);goBack(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
<button onClick={()=>setCaKeepDiscard(0)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>キャンセル</button>
</div>
</>)}
</div></div>)}
</div>);
}
