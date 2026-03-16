import React, { useState, useReducer, useRef, useEffect, useCallback } from "react";
import { Target, BarChart3, Lock, Cloud, Settings, Bot, Upload, Camera, MessageCircle, RefreshCw, Trophy, Star, ClipboardList, ChevronLeft, Users, Undo2, AlertTriangle, Shield, Trash2 } from "lucide-react";

import { MAX_TEAMS,MAX_PL,MAX_SHUF,MAX_NAME,WIN,RST,PEN,MF,C,PC,H1,BLINK_ID,MASCOT_S,MASCOT_R,LS_KEY,LS_FAV_BK,MAX_FAV,STATS_KEY,PROGRESS_KEY,SYNC_CODE_KEY,PIN_LOCKOUT_KEY,PIN_AUTH_TS_KEY,AI_ENABLED_KEY,ANALYSIS_TOTAL_KEY,ANALYSIS_LIMIT_KEY,ANALYSIS_DAILY_MAX,ANALYSIS_CACHE_DAYS,REPLAY_KEY,IDB_NAME,IDB_VER,MAX_GAMES,MAX_REPLAYS,MAX_SYNC_CODES,SHUF_ANIM_KEY,DEV_MASTER_LIST,SS } from "./constants.js";
import { _db, _cache, idbGet, idbSet, idbDel, initDB, loadStats, loadReplays, _persistStats, _persistReplays, saveStats, getShufAnim, setShufAnimLS, loadFavs, _saveFavsRaw } from "./db.js";
import { getSyncCode, setSyncCodeLS, getPinLockout, incPinAttempt, clearPinLockout, getPinAuthTs, setPinAuthTs, verifyPinOnServer, createPinOnServer, checkServerHasPin, maskSyncCode, _debouncedSync, pushToServer, pullFromServer } from "./sync.js";
import { saveGameStatsToDB, deleteStatsByPeriod, deleteGameByKey, renamePlayerData, calcOjama, buildGameRecord, saveReplay, getMondayOfWeek, fmtMD, fmtHM, getAvailableSessions, getAvailableWeeks, getAvailableMonths, filterGames, calcMetrics, getAvailableGames, getGameDates, filterGamesByDates, filterGamesByKeys, getGamesForNames } from "./stats.js";
import { getAIEnabled, setAIEnabledLS, getPlayerAnalysisCount, incPlayerAnalysisCount, getAnalysisTotal, incAnalysisTotal, _persistAnalysis, getAnalysisCached, setAnalysisCached, makeAnalysisKey, fetchPlayerAnalysis } from "./analysis.js";
import { ensureBlink, shuf, scoreOf, failsOf, getFA, smartShuf, getPI, reducer } from "./gameLogic.js";
import { Confirm, FavDropdown, CSSConfetti, ShuffleAnimation, SmartFavPicker, CourtRevealPanel, CourtOverview, MultiCourtShuffleManager, ScoreTable, GameSheet, AdminPinModal, SettingsPage } from "./components/common.jsx";
/* C: Prevent iOS context menu on buttons */
if(typeof document!=="undefined"){document.addEventListener("contextmenu",e=>{if(e.target&&!e.target.matches("input,textarea,a[href]"))e.preventDefault();},{passive:false});}

/* ═══ Favorites ═══ */
function saveFavs(l){_saveFavsRaw(l);_debouncedSync();}
function useFavs(){const[f,sF]=useState(()=>loadFavs());return{favs:f,addF:n=>{const x=n.trim().slice(0,MAX_NAME);if(x&&!f.includes(x)&&f.length<MAX_FAV){const u=[...f,x];sF(u);saveFavs(u);}},rmF:n=>{const u=f.filter(v=>v!==n);sF(u);saveFavs(u);},editF:(oldName,newName)=>{const x=newName.trim().slice(0,MAX_NAME);if(!x||x===oldName||!f.includes(oldName))return false;if(f.includes(x))return false;const u=f.map(v=>v===oldName?x:v);sF(u);saveFavs(u);renamePlayerData(oldName,x);return true;}};}
function SetupScreen({onStart,savedTeams,isAdmin,onAdminToggle,aiEnabled,onAIToggle,shufAnim,onShufAnimToggle,courtAllocation,onClearCourtAllocation,setupDraft,onClearSetupDraft,autoReshuffleMode,onClearAutoReshuffle}){
const{favs,addF,rmF,editF}=useFavs();
const[mode,setMode]=useState("shuffle");const[tc,setTc]=useState(savedTeams?savedTeams.length:2);
const[courtCount,setCourtCount]=useState(1);const[courtTeamCounts,setCourtTeamCounts]=useState({1:2,2:2,3:2});const[activeCourt,setActiveCourt]=useState(1);
const[courtTeams,setCourtTeams]=useState(()=>{const init={};for(let c=1;c<=3;c++){init[c]=Array.from({length:4},(_,i)=>({name:"チーム"+(i+1),players:[""]}));}return init;});
const[numGames,setNumGames]=useState(1);const[bestOf,setBestOf]=useState(0);const[dqEnd,setDqEnd]=useState(true);
const[saveToStats,setSaveToStats]=useState(true);
const[teams,setTeams]=useState(()=>{if(savedTeams){const base=savedTeams.map(t=>({name:t.name,players:t.players.length>0?t.players:[""]}));while(base.length<MAX_TEAMS)base.push({name:"チーム"+(base.length+1),players:[""]});return base.slice(0,MAX_TEAMS);}return Array.from({length:MAX_TEAMS},(_,i)=>({name:"チーム"+(i+1),players:[""]}));});
const[mems,setMems]=useState(()=>{if(savedTeams){const ap=savedTeams.flatMap(t=>(t.players||[]).map(p=>typeof p==="object"?(p.name||""):typeof p==="string"?p:String(p))).filter(p=>p.trim());if(ap.length>=2)return ap;}return Array(4).fill("");});const[sp,setSp]=useState(null);const[showSetupStats,setShowSetupStats]=useState(false);
const[showSettings,setShowSettings]=useState(false);const[shufAnimData,setShufAnimData]=useState(null);
const[multiCourtShufData,setMultiCourtShufData]=useState(null);const[allCourtData,setAllCourtData]=useState(null);const[showCourtOverview,setShowCourtOverview]=useState(false);const[showSmartFav,setShowSmartFav]=useState(false);
const[editMode,setEditMode]=useState(false);const[expandedDel,setExpandedDel]=useState(null);const lpRef=useRef(null);const reshuffleGuard=useRef(false);
const[caDiscardStep,setCaDiscardStep]=useState(0);/* 0=none, 1=first confirm, 2=second confirm */
const[reshuffleSettingsMode,setReshuffleSettingsMode]=useState(false);
const[draftRestored,setDraftRestored]=useState(false);
const draftTimerRef=useRef(null);
const saveDraft=useCallback(()=>{if(draftTimerRef.current)clearTimeout(draftTimerRef.current);draftTimerRef.current=setTimeout(()=>{const filledMems=mems.filter(m=>m.trim());const filledTeams=teams.slice(0,tc).some(t=>t.players.some(p=>p.trim()));if(filledMems.length===0&&!filledTeams){if(_db)idbDel(_db,"setup-draft").catch(e=>{});return;}if(_db)idbSet(_db,"setup-draft",{mems,teams:teams.slice(0,tc),sp,courtCount,courtTeamCounts,mode,tc,savedAt:new Date().toISOString()}).catch(e=>console.error("setup-draft save error",e));},500);},[mems,teams,tc,sp,courtCount,courtTeamCounts,mode]);
useEffect(()=>{saveDraft();return()=>{if(draftTimerRef.current)clearTimeout(draftTimerRef.current);};},[mems,teams,tc,sp,courtCount,courtTeamCounts,mode]);
const[trimConfirm,setTrimConfirm]=useState(null);/* {filled,newMax,step,onConfirm} */
const showTrimConfirm=(filled,newMax,onConfirm)=>{if(filled<=newMax||filled===0){onConfirm();return;}setTrimConfirm({filled,newMax,step:1,onConfirm});};
const trimDialogExec=()=>{if(!trimConfirm)return;const{newMax,onConfirm}=trimConfirm;onConfirm();setMems(prev=>prev.slice(0,Math.max(newMax,2)));setSp(null);setAllCourtData(null);setTrimConfirm(null);};
const lpStart=(e)=>{if(e.target.tagName==="INPUT"||e.target.tagName==="BUTTON"||e.target.tagName==="SELECT")return;lpRef.current=setTimeout(()=>{setEditMode(true);setExpandedDel(null);},600);};
const lpEnd=()=>{if(lpRef.current){clearTimeout(lpRef.current);lpRef.current=null;}};
const lpMove=()=>{if(lpRef.current){clearTimeout(lpRef.current);lpRef.current=null;}};
/* Auto-adjust team count when player count exceeds per-team max */
const pCountSetup=mode==="shuffle"?mems.filter(m=>m.trim()).length:teams.slice(0,tc).reduce((s,t)=>s+t.players.filter(p=>p.trim()).length,0);
useEffect(()=>{if(courtCount>=2)return;const minT=pCountSetup>=13?4:pCountSetup>=9?3:2;if(tc<minT){setTc(minT);setSp(null);}},[pCountSetup,courtCount]);
/* Trim mems when maxShufForCourt decreases (e.g. team count reduced) */
const maxShufRef=courtCount===1?tc*MAX_PL:[1,2,3].filter(c=>c<=courtCount).reduce((s,c)=>s+courtTeamCounts[c],0)*MAX_PL;
useEffect(()=>{if(reshuffleGuard.current){reshuffleGuard.current=false;return;}if(mode!=="shuffle")return;setMems(prev=>{if(prev.length<=maxShufRef)return prev;const trimmed=prev.slice(0,maxShufRef);return trimmed.length>=2?trimmed:["",""];});setSp(null);setAllCourtData(null);},[maxShufRef]);
const uN=(i,v)=>setTeams(p=>p.map((t,j)=>j===i?{...t,name:v}:t));
const uP=(ti,pi,v)=>setTeams(p=>p.map((t,i)=>i===ti?{...t,players:t.players.map((pl,j)=>j===pi?v.slice(0,MAX_NAME):pl)}:t));
const aP=ti=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length<MAX_PL?{...t,players:[...t.players,""]}:t));
const rP=(ti,pi)=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length>1?{...t,players:t.players.filter((_,j)=>j!==pi)}:t));
const ctUn=(c,ti,v)=>setCourtTeams(p=>({...p,[c]:p[c].map((t,j)=>j===ti?{...t,name:v}:t)}));
const ctUp=(c,ti,pi,v)=>setCourtTeams(p=>({...p,[c]:p[c].map((t,j)=>j===ti?{...t,players:t.players.map((pl,k)=>k===pi?v.slice(0,MAX_NAME):pl)}:t)}));
const ctAp=(c,ti)=>{const totalP=[1,2,3].filter(x=>x<=courtCount).reduce((s,x)=>s+courtTeams[x].slice(0,courtTeamCounts[x]).reduce((a,t)=>a+t.players.filter(p=>p.trim()).length,0),0);if(totalP>=18){window.alert("19人以上の場合はランダムモードにしてください");return;}setCourtTeams(p=>({...p,[c]:p[c].map((t,j)=>j===ti&&t.players.length<MAX_PL?{...t,players:[...t.players,""]}:t)}));};
const ctRp=(c,ti,pi)=>setCourtTeams(p=>({...p,[c]:p[c].map((t,j)=>j===ti&&t.players.length>1?{...t,players:t.players.filter((_,k)=>k!==pi)}:t)}));
const uM=(i,v)=>{setMems(p=>p.map((m,j)=>j===i?v.slice(0,MAX_NAME):m));setSp(null);setAllCourtData(null);};
const totalTeamsMulti=[1,2,3].filter(c=>c<=courtCount).reduce((s,c)=>s+courtTeamCounts[c],0);const maxShufForCourt=courtCount===1?tc*MAX_PL:totalTeamsMulti*MAX_PL;
const aM=()=>{if(mems.length<maxShufForCourt){setMems(p=>[...p,""]);setSp(null);setAllCourtData(null);}};
const rM=i=>{if(mems.length>2){setMems(p=>p.filter((_,j)=>j!==i));setSp(null);setAllCourtData(null);}};
const doMultiCourtShuf=()=>{const totalTeams=Object.entries(courtTeamCounts).filter(([k])=>Number(k)<=courtCount).reduce((s,[,v])=>s+v,0);const allNames=[...mems.filter(m=>m.trim())];const minReq=Math.max(totalTeams,courtCount*2);if(allNames.length<minReq)return null;
const syncCode=getSyncCode();const currentFavs=loadFavs();
const isKimuraEnabled=syncCode==="MolkkyFuji223"&&currentFavs.includes("キムラ");
let kimuraName=null;if(isKimuraEnabled){const ki=allNames.findIndex(n=>n==="キムラ");if(ki>=0)kimuraName=allNames.splice(ki,1)[0];}
const total=allNames.length;const remaining=total-courtCount*2;const base2=remaining>=0?Math.floor(remaining/courtCount):0;const rem2=remaining>=0?remaining%courtCount:0;
const courtSizes={};for(let c=1;c<=courtCount;c++){const extraOrder=c===1?courtCount:c-1;courtSizes[c]=2+base2+(extraOrder<=rem2?1:0);}
/* MAX_PLキャップ: 各コートの人数がチーム数×MAX_PLを超えないよう再配分 */
let overflow=0;for(let c=1;c<=courtCount;c++){const cap=courtTeamCounts[c]*MAX_PL-(c===1&&kimuraName?1:0);if(courtSizes[c]>cap){overflow+=courtSizes[c]-cap;courtSizes[c]=cap;}}
if(overflow>0){for(let c=courtCount;c>=1&&overflow>0;c--){const cap=courtTeamCounts[c]*MAX_PL-(c===1&&kimuraName?1:0);const room=cap-courtSizes[c];if(room>0){const add=Math.min(room,overflow);courtSizes[c]+=add;overflow-=add;}}}
const shuffled=shuf(allNames);const courtPlayers={};let idx=0;
for(let c=1;c<=courtCount;c++){courtPlayers[c]=shuffled.slice(idx,idx+courtSizes[c]);idx+=courtSizes[c];}
if(kimuraName)courtPlayers[1].push(kimuraName);
const courtResults={};for(let c=1;c<=courtCount;c++){const players=shuf(courtPlayers[c]);const nT=courtTeamCounts[c];
const tSizes=[];const b2=Math.floor(players.length/nT);const r2=players.length%nT;for(let i=0;i<nT;i++)tSizes.push(b2+(i<r2?1:0));
const tms=[];let pi=0;for(let i=0;i<nT;i++){tms.push({name:"チーム"+(i+1),players:players.slice(pi,pi+tSizes[i])});pi+=tSizes[i];}
courtResults[c]=tms;}return courtResults;};
const doReshuffleFromCA=(ca)=>{
if(!ca||!ca.courtData||!ca.courtCount)return;
const cc=ca.courtCount;
const ctc=ca.courtTeamCounts;
/* 全コートの全メンバーをフラット配列に展開 */
const allNames=[];
for(let c=1;c<=cc;c++){
const teams=ca.courtData[c]||[];
teams.forEach(t=>{
const players=t.players||[];
players.forEach(p=>{
const nm=typeof p==="string"?p:(typeof p==="object"?(p.name||""):String(p));
if(nm.trim())allNames.push(nm.trim());
});
});
}
/* 最低人数チェック */
const totalTeams=Object.entries(ctc).filter(([k])=>Number(k)<=cc).reduce((s,[,v])=>s+v,0);
const minReq=Math.max(totalTeams,cc*2);
if(allNames.length<minReq)return;
/* キムラ隠し仕様 */
const syncCode=getSyncCode();
const currentFavs=loadFavs();
const isKimuraEnabled=syncCode==="MolkkyFuji223"&&currentFavs.includes("キムラ");
let kimuraName=null;
if(isKimuraEnabled){const ki=allNames.findIndex(n=>n==="キムラ");if(ki>=0)kimuraName=allNames.splice(ki,1)[0];}
/* コート別人数配分 */
const total=allNames.length;const remaining=total-cc*2;
const base2=remaining>=0?Math.floor(remaining/cc):0;
const rem2=remaining>=0?remaining%cc:0;
const courtSizes={};
for(let c=1;c<=cc;c++){const extraOrder=c===1?cc:c-1;courtSizes[c]=2+base2+(extraOrder<=rem2?1:0);}
/* MAX_PLキャップ */
let overflow=0;for(let c=1;c<=cc;c++){const cap=ctc[c]*MAX_PL-(c===1&&kimuraName?1:0);if(courtSizes[c]>cap){overflow+=courtSizes[c]-cap;courtSizes[c]=cap;}}
if(overflow>0){for(let c=cc;c>=1&&overflow>0;c--){const cap=ctc[c]*MAX_PL-(c===1&&kimuraName?1:0);const room=cap-courtSizes[c];if(room>0){const add=Math.min(room,overflow);courtSizes[c]+=add;overflow-=add;}}}
/* シャッフル＋チーム分け（重複チェック付き、最大10回再抽選） */
const prevData=ca.courtData;
const isSameAsPrev=(newResult)=>{
for(let c=1;c<=cc;c++){
const prevTeams=prevData[c]||[];const newTeams=newResult[c]||[];
if(prevTeams.length!==newTeams.length)return false;
const prevSets=prevTeams.map(t=>new Set(t.players));
const newSets=newTeams.map(t=>new Set(t.players));
const allMatch=prevSets.every(ps=>newSets.some(ns=>ns.size===ps.size&&[...ps].every(n=>ns.has(n))));
if(!allMatch)return false;
}return true;
};
const buildResult=()=>{
const namesPool=[...allNames];const shuffled=shuf(namesPool);
const courtPlayers={};let idx=0;
for(let c=1;c<=cc;c++){courtPlayers[c]=shuffled.slice(idx,idx+courtSizes[c]);idx+=courtSizes[c];}
if(kimuraName)courtPlayers[1].push(kimuraName);
const courtResults={};
for(let c=1;c<=cc;c++){
const players=shuf(courtPlayers[c]);const nT=ctc[c];
const tSizes=[];const b=Math.floor(players.length/nT);const r=players.length%nT;
for(let i=0;i<nT;i++)tSizes.push(b+(i<r?1:0));
const tms=[];let pi=0;
for(let i=0;i<nT;i++){tms.push({name:"チーム"+(i+1),players:players.slice(pi,pi+tSizes[i])});pi+=tSizes[i];}
courtResults[c]=tms;
}return courtResults;
};
let courtResults=buildResult();
for(let att=0;att<10;att++){if(!isSameAsPrev(courtResults))break;courtResults=buildResult();}
/* state更新 */
const nGames=ca.numGames||1;const bo=ca.bestOf||0;
const dq=ca.dqEnd!==undefined?ca.dqEnd:true;
const sts=ca.saveToStats!==undefined?ca.saveToStats:true;
setCourtCount(cc);setCourtTeamCounts(ctc);setNumGames(nGames);setBestOf(bo);setDqEnd(dq);setSaveToStats(sts);
setMems(kimuraName?[...allNames,kimuraName]:[...allNames]);
/* シャッフルアニメーション or 直接セット */
if(shufAnim){
const courtOrder=[];for(let c=2;c<=cc;c++)courtOrder.push(c);courtOrder.push(1);
setMultiCourtShufData({courtData:courtResults,courtOrder:courtOrder});
}else{
setSp(courtResults[1]);setAllCourtData(courtResults);setShowCourtOverview(true);
if(_db&&cc>=2)idbSet(_db,"court-allocation",{courtCount:cc,courtTeamCounts:ctc,courtData:courtResults,numGames:nGames,bestOf:bo,dqEnd:dq,saveToStats:sts,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));
}
};
const doLocalReshuffle=(ca)=>{
if(!ca||!ca.courtData||!ca.courtData[1]||!ca.courtCount)return;
const cc=ca.courtCount;
const ctc=ca.courtTeamCounts;
/* 端末コートのメンバーをフラット配列に */
const court1Teams=ca.courtData[1];
const allPlayers=[];
court1Teams.forEach(t=>{
(t.players||[]).forEach(p=>{
const nm=typeof p==="string"?p:(typeof p==="object"?(p.name||""):String(p));
if(nm.trim())allPlayers.push(nm.trim());
});
});
const nT=ctc[1];
if(allPlayers.length<nT)return;
/* シャッフル（前回と同じにならないよう最大10回試行） */
const prevSets=court1Teams.map(t=>new Set(t.players));
const buildResult=()=>{
const shuffled=shuf(allPlayers);
const tSizes=[];const b=Math.floor(shuffled.length/nT);const r=shuffled.length%nT;
for(let i=0;i<nT;i++)tSizes.push(b+(i<r?1:0));
const tms=[];let pi=0;
for(let i=0;i<nT;i++){tms.push({name:"チーム"+(i+1),players:shuffled.slice(pi,pi+tSizes[i])});pi+=tSizes[i];}
return tms;
};
let newCourt1=buildResult();
for(let att=0;att<10;att++){
const same=newCourt1.every((t,i)=>{const ns=new Set(t.players);return prevSets[i]&&ns.size===prevSets[i].size&&[...ns].every(n=>prevSets[i].has(n));});
if(!same)break;
newCourt1=buildResult();
}
/* courtAllocationを更新 */
const newCourtData={...ca.courtData,1:newCourt1};
const nGames=ca.numGames||1;const bo=ca.bestOf||0;
const dq=ca.dqEnd!==undefined?ca.dqEnd:true;
const sts=ca.saveToStats!==undefined?ca.saveToStats:true;
setCourtCount(cc);setCourtTeamCounts(ctc);
setNumGames(nGames);setBestOf(bo);setDqEnd(dq);setSaveToStats(sts);
if(shufAnim){
/* 端末コートのみの演出。courtOrder=[1]で端末コートだけ表示 */
setMultiCourtShufData({courtData:newCourtData,courtOrder:[1]});
}else{
setSp(newCourt1);setAllCourtData(newCourtData);setShowCourtOverview(true);
if(_db&&cc>=2)idbSet(_db,"court-allocation",{courtCount:cc,courtTeamCounts:ctc,courtData:newCourtData,numGames:nGames,bestOf:bo,dqEnd:dq,saveToStats:sts,savedAt:new Date().toISOString()}).catch(e=>console.error("court-allocation save error",e));
}
};
const handleChangeCourtSettings=(ca)=>{
if(!ca||!ca.courtData||!ca.courtCount)return;
/* 全メンバーを抽出して mems にセット */
const allNames=[];
for(let c=1;c<=ca.courtCount;c++){
const teams=ca.courtData[c]||[];
teams.forEach(t=>{
const players=t.players||[];
players.forEach(p=>{
const nm=typeof p==="string"?p:(typeof p==="object"?(p.name||""):String(p));
if(nm.trim())allNames.push(nm.trim());
});
});
}
setMems(allNames.length>=2?allNames:["",""]);
/* 前回のコート設定を復元 */
setCourtCount(ca.courtCount);setCourtTeamCounts(ca.courtTeamCounts);
if(ca.numGames)setNumGames(ca.numGames);
if(ca.bestOf!==undefined)setBestOf(ca.bestOf);
if(ca.dqEnd!==undefined)setDqEnd(ca.dqEnd);
if(ca.saveToStats!==undefined)setSaveToStats(ca.saveToStats);
/* モードをランダムに設定 */
setMode("shuffle");
/* 前回のシャッフル結果をクリア */
setSp(null);setAllCourtData(null);
/* reshuffleSettingsModeでバナーを一時的に非表示 */
setReshuffleSettingsMode(true);
};
useEffect(()=>{
if(!autoReshuffleMode||!courtAllocation)return;
const mode=autoReshuffleMode;
if(onClearAutoReshuffle)onClearAutoReshuffle();
reshuffleGuard.current=true;
if(mode==="all"){
doReshuffleFromCA(courtAllocation);
}else if(mode==="local"){
doLocalReshuffle(courtAllocation);
}else if(mode==="settings"){
handleChangeCourtSettings(courtAllocation);
}
},[autoReshuffleMode]);
const doShufCore=()=>{const names=mems.filter(m=>m.trim());if(names.length<tc)return null;
const prevSets=sp?sp.map(t=>new Set(t.players)):null;
const teamSizes=[];{const base=Math.floor(names.length/tc);const rem=names.length%tc;for(let i=0;i<tc;i++)teamSizes.push(base+(i<rem?1:0));}
const tryOnce=()=>{const s=shuf(names);const r=Array.from({length:tc},(_,i)=>({name:sp?sp[i]?.name||("チーム"+(i+1)):"チーム"+(i+1),players:[]}));let idx=0;for(let i=0;i<tc;i++){r[i].players=s.slice(idx,idx+teamSizes[i]);idx+=teamSizes[i];}return r;};
let result=tryOnce();
if(prevSets&&names.length>tc){for(let att=0;att<10;att++){const same=result.some(t=>{const ts=new Set(t.players);return prevSets.some(ps=>ps.size===ts.size&&[...ts].every(n=>ps.has(n)));});if(!same)break;result=tryOnce();}}
const ord=shuf(Array.from({length:tc},(_,i)=>i));
return ord.map(i=>result[i]);};
const doShuf=()=>{if(courtCount===1){const result=doShufCore();if(!result)return;
if(shufAnim){setReshuffleSettingsMode(false);const allNames=result.flatMap(t=>t.players);setShufAnimData({names:allNames,teams:result});}
else{setReshuffleSettingsMode(false);setSp(result);}}else{const courtResults=doMultiCourtShuf();if(!courtResults)return;
if(shufAnim){const courtOrder=[];for(let c=2;c<=courtCount;c++)courtOrder.push(c);courtOrder.push(1);
setReshuffleSettingsMode(false);setMultiCourtShufData({courtData:courtResults,courtOrder:courtOrder});}
else{setReshuffleSettingsMode(false);setSp(courtResults[1]);setAllCourtData(courtResults);if(_db&&courtCount>=2)idbSet(_db,"court-allocation",{courtCount,courtTeamCounts,courtData:courtResults,numGames,bestOf,dqEnd,saveToStats,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));}}};
const okM=teams.slice(0,tc).every(t=>t.name.trim()&&t.players.some(p=>p.trim()));const totalTeamsForAllCourts=courtCount===1?tc:Object.entries(courtTeamCounts).filter(([k])=>Number(k)<=courtCount).reduce((s,[,v])=>s+v,0);
const filledCount=mems.filter(m=>m.trim()).length;const hasEmpty=mems.some(m=>!m.trim());const minRequired=Math.max(totalTeamsForAllCourts,courtCount*2);const okS=!hasEmpty&&filledCount>=minRequired;
const okSReason=hasEmpty?"未入力の欄があります":filledCount<minRequired?("最低"+minRequired+"人必要です"):"";
const isSpValid=()=>{if(!sp||!Array.isArray(sp)||sp.length===0)return false;if(!sp.every(t=>t.players&&t.players.length>0&&t.players.some(p=>p.trim())))return false;if(!sp.every(t=>t.name&&t.name.trim()))return false;const totalP=sp.reduce((s,t)=>s+t.players.filter(p=>p.trim()).length,0);if(totalP<2)return false;const curNames=new Set(mems.filter(m=>m.trim()));return sp.flatMap(t=>t.players).every(n=>curNames.has(n));};
const go=()=>{let ft;if(mode==="manual"){ft=teams.slice(0,tc).map(t=>({...t,players:t.players.filter(p=>p.trim())}));if(!ft.every(t=>t.players.length>0))return;}else{if(!sp||!isSpValid())return;ft=sp;}const ord=Array.from({length:ft.length},(_,i)=>i);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,courtCount>=2&&allCourtData?{courtCount,courtTeamCounts,courtData:allCourtData}:null);};
const usedManual=courtCount>=2?[1,2,3].filter(c=>c<=courtCount).flatMap(c=>courtTeams[c].slice(0,courtTeamCounts[c]).flatMap(t=>t.players)).filter(p=>p.trim()).map(p=>p.trim()):teams.slice(0,tc).flatMap(t=>t.players).filter(p=>p.trim()).map(p=>p.trim());
const usedShuffle=mems.filter(m=>m.trim()).map(m=>m.trim());const used=mode==="manual"?usedManual:usedShuffle;
const SL={display:"block",fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:3,marginBottom:8};
const CH={flex:1,padding:"16px 0",border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"transparent",color:"var(--text-inverse)",fontSize:20,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"};
const CHA={background:"var(--accent-blue)",borderColor:"var(--accent-blue)"};
const SEL={width:"100%",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.92)",color:"var(--text-primary)",fontSize:18,fontWeight:600,cursor:"pointer",outline:"none",WebkitAppearance:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7'%3E%3Cpath d='M0 0l6 7 6-7z' fill='%23999'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"34px"};
const CARD={background:"rgba(255,255,255,0.96)",borderRadius:14,padding:"16px 18px 14px",marginBottom:12};
const PIN={flex:1,border:"1px solid var(--border-light)",borderRadius:10,padding:"12px 14px",fontSize:20,outline:"none",background:"#fafafa"};
const TIN={flex:1,border:"none",borderBottom:"2px solid var(--border-input)",padding:"6px 4px",fontSize:22,fontWeight:700,outline:"none",background:"transparent"};
return(
<div style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"auto",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))",WebkitOverflowScrolling:"touch",overscrollBehavior:"none"}}>
<div style={{padding:"36px 20px 8px",textAlign:"center",position:"relative"}}><button onClick={()=>setShowSettings(true)} style={{position:"absolute",top:40,right:20,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,background:"rgba(255,255,255,0.08)",color:"var(--text-inverse)",fontSize:18,cursor:"pointer",zIndex:10}}><Settings size={18}/></button><img src={MASCOT_S} alt="モルック" style={{width:200,height:200,objectFit:"contain",display:"block",margin:"0 auto -6px"}}/><h1 style={{fontSize:38,fontWeight:900,color:"var(--text-inverse)",letterSpacing:4}}>モルック スコアラー</h1><div style={{fontSize:13,color:"rgba(255,255,255,0.3)",fontWeight:600,letterSpacing:5}}>MÖLKKY SCORER</div></div>
<div style={{flex:1,padding:"0 20px",paddingBottom:"calc(36px + env(safe-area-inset-bottom, 0px))",maxWidth:720,margin:"0 auto",width:"100%"}}>
{courtAllocation&&!reshuffleSettingsMode&&<div style={{background:"rgba(43,125,233,0.12)",border:"2px solid rgba(43,125,233,0.3)",borderRadius:14,padding:16,marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-inverse)",marginBottom:10}}>{"🔄"} 前回のコート割り当てがあります</div>
<div style={{display:"flex",gap:8,marginBottom:8}}>
<button onClick={()=>{setCourtCount(courtAllocation.courtCount);setCourtTeamCounts(courtAllocation.courtTeamCounts);setAllCourtData(courtAllocation.courtData);setSp(courtAllocation.courtData[1]);setNumGames(courtAllocation.numGames||1);setBestOf(courtAllocation.bestOf||0);setDqEnd(courtAllocation.dqEnd!==undefined?courtAllocation.dqEnd:true);setSaveToStats(courtAllocation.saveToStats!==undefined?courtAllocation.saveToStats:true);setShowCourtOverview(true);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#2b7de9,#1a6dd4)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>{"📋"} コート一覧を見る</button>
<button onClick={()=>doReshuffleFromCA(courtAllocation)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#22b566,#1a9d52)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>{"🎲"} 組み換えシャッフル</button>
</div>
<div style={{display:"flex",gap:8}}>
<button onClick={()=>handleChangeCourtSettings(courtAllocation)} style={{flex:1,padding:"10px 0",border:"2px solid rgba(255,255,255,0.25)",borderRadius:10,background:"transparent",color:"var(--text-inverse)",fontSize:13,fontWeight:700,cursor:"pointer"}}>{"⚙"} コート設定を変更して組み換え</button>
<button onClick={()=>setCaDiscardStep(1)} style={{flex:"0 0 auto",padding:"10px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄</button>
</div></div>}
{setupDraft&&!draftRestored&&!savedTeams&&<div style={{background:"rgba(34,181,102,0.12)",border:"2px solid rgba(34,181,102,0.3)",borderRadius:14,padding:16,marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-inverse)",marginBottom:10}}>{"📝"} 前回の入力途中のメンバーがあります</div>
<div style={{display:"flex",gap:8}}>
<button onClick={()=>{if(setupDraft.mems)setMems(setupDraft.mems);if(setupDraft.mode)setMode(setupDraft.mode);if(setupDraft.tc)setTc(setupDraft.tc);if(setupDraft.courtCount)setCourtCount(setupDraft.courtCount);if(setupDraft.courtTeamCounts)setCourtTeamCounts(setupDraft.courtTeamCounts);if(setupDraft.sp)setSp(setupDraft.sp);if(setupDraft.teams){setTeams(prev=>{const base=[...prev];setupDraft.teams.forEach((t,i)=>{if(i<base.length)base[i]={...base[i],name:t.name,players:t.players&&t.players.length>0?t.players:[""]};});return base;});}setDraftRestored(true);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#22b566,#1a9d52)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>{"✅"} 復元する</button>
<button onClick={()=>{setDraftRestored(true);if(onClearSetupDraft)onClearSetupDraft();}} style={{flex:"0 0 auto",padding:"12px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄する</button>
</div></div>}
<div style={{marginBottom:14}}><label style={SL}>入力モード</label><div style={{display:"flex",gap:8}}>{[["manual","✏️ 手動"],["shuffle","🎲 ランダム"]].map(([k,l])=>(<button key={k} onClick={()=>{if(k===mode)return;const doSwitch=()=>{if(k==="shuffle"){let ns;if(courtCount>=2){ns=[];for(let c=1;c<=courtCount;c++){const ct=courtTeams[c]||[];ct.slice(0,courtTeamCounts[c]).forEach(t=>{t.players.filter(p=>p.trim()).forEach(p=>ns.push(p));});}if(ns.length===0)ns=["",""];}else{ns=teams.slice(0,tc).flatMap(t=>t.players).filter(p=>p.trim());if(ns.length>0)ns=ns.length<2?[...ns,""]:ns;}setMems(ns.length>0?ns:["","","",""]);}else if(k==="manual"){const ns=mems.filter(m=>m.trim());if(ns.length>0){setTeams(p=>{const nt=p.map((t,i)=>i<tc?{...t,players:[]}:t);ns.forEach((n,j)=>{const ti=j%tc;nt[ti]={...nt[ti],players:[...nt[ti].players,n]};});for(let i=0;i<tc;i++){if(nt[i].players.length===0)nt[i]={...nt[i],players:[""]};} return nt;});}}setMode(k);setSp(null);setAllCourtData(null);setEditMode(false);setExpandedDel(null);};if(mode==="shuffle"&&k==="manual"){const fc=mems.filter(m=>m.trim()).length;const manualMax=courtCount===1?tc*MAX_PL:18;if(fc>manualMax&&fc>0){showTrimConfirm(fc,manualMax,doSwitch);return;}}doSwitch();}} style={{...CH,...(mode===k?CHA:{})}}>{l}</button>))}</div></div>
<div style={{display:"flex",gap:14,marginBottom:14}}>{courtCount===1&&<div style={{flex:1}}><label style={SL}>チーム数</label><div style={{display:"flex",gap:8}}>{[2,3,4].map(n=>{const pCount=mode==="shuffle"?mems.filter(m=>m.trim()).length:teams.slice(0,tc).reduce((s,t)=>s+t.players.filter(p=>p.trim()).length,0);const minTeams=pCount>=13?4:pCount>=9?3:2;const dis=n<minTeams;return(<button key={n} onClick={()=>{if(dis)return;if(mode==="shuffle"&&n<tc){const fc=mems.filter(m=>m.trim()).length;const nm=n*MAX_PL;if(fc>nm&&fc>0){showTrimConfirm(fc,nm,()=>{setTc(n);setSp(null);});return;}}setTc(n);setSp(null);}} style={{...CH,...(tc===n?CHA:{}),padding:"16px 0",opacity:dis?0.3:1,cursor:dis?"not-allowed":"pointer"}}>{n}</button>);})}</div></div>}<div style={{flex:1}}><label style={SL}>コート数</label><div style={{display:"flex",gap:8}}>{[1,2,3].map(n=>{const isTab=typeof window!=="undefined"&&window.innerWidth>=768;const dis=n>=2&&!isTab;return(<button key={n} onClick={()=>{if(dis)return;if(mode==="shuffle"&&n<courtCount){const fc=mems.filter(m=>m.trim()).length;const newTotalT=n===1?tc:[1,2,3].filter(c=>c<=n).reduce((s,c)=>s+courtTeamCounts[c],0);const nm=n===1?tc*MAX_PL:newTotalT*MAX_PL;if(fc>nm&&fc>0){showTrimConfirm(fc,nm,()=>{setCourtCount(n);if(n===1)setActiveCourt(1);setSp(null);});return;}}setCourtCount(n);if(n===1){setActiveCourt(1);}}} style={{...CH,...(courtCount===n?CHA:{}),padding:"16px 0",opacity:dis?0.3:1,cursor:dis?"not-allowed":"pointer"}}>{n}コート</button>);})}</div></div></div>
{courtCount>=2&&(<div style={{marginBottom:14}}>{[1,2,3].filter(c=>c<=courtCount).map(c=>(<div key={c} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px",marginBottom:8,border:c===1?"2px solid rgba(43,125,233,0.3)":"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontSize:15,fontWeight:800,color:"var(--text-inverse)"}}>{c===1?"📱":"📋"} {c}コート（{c===1?"端末":"紙"}）</span><div style={{display:"flex",gap:6}}>{[2,3,4].map(n=>(<button key={n} onClick={()=>{if(mode==="shuffle"&&n<courtTeamCounts[c]){const fc=mems.filter(m=>m.trim()).length;const newCTC={...courtTeamCounts,[c]:n};const newTotalT=[1,2,3].filter(x=>x<=courtCount).reduce((s,x)=>s+newCTC[x],0);const nm=newTotalT*MAX_PL;if(fc>nm&&fc>0){showTrimConfirm(fc,nm,()=>{setCourtTeamCounts(p=>({...p,[c]:n}));setSp(null);});return;}}setCourtTeamCounts(p=>({...p,[c]:n}));}} style={{width:44,height:36,borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:courtTeamCounts[c]===n?"var(--accent-blue)":"transparent",color:courtTeamCounts[c]===n?"#fff":"rgba(255,255,255,0.5)",fontSize:16,fontWeight:800,cursor:"pointer"}}>{n}</button>))}</div></div>))}<div style={{fontSize:20,fontWeight:900,color:"var(--text-inverse)",textAlign:"right",marginTop:8}}>合計 {[1,2,3].filter(c=>c<=courtCount).reduce((s,c)=>s+courtTeamCounts[c],0)} チーム</div></div>)}
<div style={{display:"flex",gap:8,marginBottom:14}}><div style={{flex:"1 1 0"}}><label style={SL}>ゲーム数</label><select value={numGames} onChange={e=>setNumGames(+e.target.value)} style={SEL}>{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}ゲーム</option>)}</select></div><div style={{flex:"1 1 0"}}><label style={SL}>先取機能</label><select value={bestOf} onChange={e=>setBestOf(+e.target.value)} style={SEL}><option value={0}>なし</option>{Array.from({length:11},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}先取</option>)}</select></div><div style={{flex:"1 1 0"}}><label style={SL}>失格時</label><select value={dqEnd?"end":"cont"} onChange={e=>setDqEnd(e.target.value==="end")} style={SEL}><option value="end">即終了</option><option value="cont">継続</option></select></div></div>
{/* Stats toggle (UISwitch) + Stats button */}
<div style={{display:"flex",gap:8,marginBottom:14}}>
<div onClick={()=>setSaveToStats(p=>!p)} style={{flex:1,padding:"14px 16px",border:"2px solid "+(saveToStats?"var(--accent-green)":"rgba(255,255,255,0.25)"),borderRadius:12,background:saveToStats?"rgba(34,181,102,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
<span style={{color:saveToStats?"var(--text-success)":"rgba(255,255,255,0.5)",fontSize:15,fontWeight:700}}>スタッツ反映</span>
<div style={{width:48,height:28,borderRadius:14,padding:2,background:saveToStats?"var(--accent-green)":"rgba(255,255,255,0.25)",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:saveToStats?"flex-end":"flex-start"}}>
<div style={{width:24,height:24,borderRadius:12,background:"var(--bg-surface)",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"all 0.2s"}}/>
</div>
</div>
<button onClick={()=>setShowSetupStats(true)} style={{flex:1,padding:"14px 16px",border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"var(--text-inverse)",fontSize:18,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}><BarChart3 size={18}/> スタッツ</button>
</div>
<div style={{padding:"12px 16px",background:"rgba(43,125,233,0.12)",borderRadius:12,border:"1px solid rgba(43,125,233,0.2)",marginBottom:14}}><div style={{fontWeight:800,fontSize:16,color:"var(--text-inverse)",marginBottom:3}}><ClipboardList size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 公式ルール</div><div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.8}}>50点で勝利 / 超過→25点 / 37点以上でフォルト→25点 / ミス＝倒れず / フォルト＝反則 / 3連続→失格</div></div>
{mode==="manual"&&courtCount===1&&(<>
{editMode&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button onClick={()=>{setEditMode(false);setExpandedDel(null);}} style={{padding:"6px 18px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>Done</button></div>}
{teams.slice(0,tc).map((team,ti)=>(<div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac}} onTouchStart={lpStart} onTouchEnd={lpEnd} onTouchMove={lpMove}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-inverse)",fontWeight:900,fontSize:18,flexShrink:0,background:C[ti].ac}}>{ti+1}</div><input value={team.name} onChange={e=>uN(ti,e.target.value)} style={TIN} placeholder={"チーム"+(ti+1)}/></div>
<div style={{paddingLeft:editMode?28:44}}>{team.players.map((p,pi)=>{const delKey="m"+ti+"_"+pi;const isExp=expandedDel===delKey;return(<div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,overflow:"hidden"}}>
{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
<span style={{width:20,fontSize:16,color:"var(--text-muted)",fontWeight:700,textAlign:"center"}}>{pi+1}</span><input value={p} onChange={e=>uP(ti,pi,e.target.value)} maxLength={MAX_NAME} style={{...PIN,flex:isExp?"0 1 auto":"1"}} placeholder={"名前("+MAX_NAME+"文字)"}/>
{!editMode&&<FavDropdown favs={favs} addF={addF} rmF={rmF} editF={editF} onPick={name=>uP(ti,pi,name)} usedNames={used} isAdmin={isAdmin}/>}
{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{rP(ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
</div>);})}
{!editMode&&team.players.length<MAX_PL&&<button style={{width:"100%",padding:10,border:"2px dashed var(--border-input)",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer"}} onClick={()=>aP(ti)}>＋ 追加</button>}
{!editMode&&team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rP(ti,team.players.length-1)}>− 最後を削除</button>}
</div></div>))}
<button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"var(--text-inverse)",fontSize:32,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:6,boxShadow:"0 3px 16px rgba(43,125,233,0.3)",opacity:okM?1:0.3}} onClick={okM?go:undefined}><Target size={28} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> ゲーム開始</button>
</>)}
{mode==="manual"&&courtCount>=2&&(<>
<div style={{display:"flex",gap:8,marginBottom:10}}>{[1,2,3].filter(c=>c<=courtCount).map(c=>{const act=activeCourt===c;return(<button key={c} onClick={()=>setActiveCourt(c)} style={{flex:1,padding:"12px 0",border:act?"2px solid #2b7de9":"2px solid rgba(255,255,255,0.2)",borderRadius:10,background:act?"rgba(43,125,233,0.2)":"rgba(255,255,255,0.06)",color:act?"#fff":"rgba(255,255,255,0.5)",fontSize:16,fontWeight:800,cursor:"pointer",textAlign:"center"}}><div>{c===1?"📱":"📋"} {c}コート</div><div style={{fontSize:12,fontWeight:600,marginTop:2}}>{courtTeamCounts[c]}チーム</div></button>);})}</div>
<div style={{padding:"8px 14px",borderRadius:10,marginBottom:10,background:activeCourt===1?"rgba(43,125,233,0.15)":"rgba(255,255,255,0.06)",border:activeCourt===1?"1px solid rgba(43,125,233,0.3)":"1px solid rgba(255,255,255,0.1)"}}><span style={{fontSize:14,fontWeight:700,color:activeCourt===1?"#6ab0ff":"rgba(255,255,255,0.5)"}}>{activeCourt===1?"端末で試合するコート":"紙で記録するコート"}</span></div>
{editMode&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}><button onClick={()=>{setEditMode(false);setExpandedDel(null);}} style={{padding:"6px 18px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>Done</button></div>}
{courtTeams[activeCourt].slice(0,courtTeamCounts[activeCourt]).map((team,ti)=>(<div key={activeCourt+"-"+ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac}} onTouchStart={lpStart} onTouchEnd={lpEnd} onTouchMove={lpMove}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-inverse)",fontWeight:900,fontSize:18,flexShrink:0,background:C[ti].ac}}>{ti+1}</div><input value={team.name} onChange={e=>ctUn(activeCourt,ti,e.target.value)} style={TIN} placeholder={"チーム"+(ti+1)}/></div>
<div style={{paddingLeft:editMode?28:44}}>{team.players.map((p,pi)=>{const delKey="c"+activeCourt+"_"+ti+"_"+pi;const isExp=expandedDel===delKey;return(<div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7,overflow:"hidden"}}>
{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
<span style={{width:20,fontSize:16,color:"var(--text-muted)",fontWeight:700,textAlign:"center"}}>{pi+1}</span><input value={p} onChange={e=>ctUp(activeCourt,ti,pi,e.target.value)} maxLength={MAX_NAME} style={{...PIN,flex:isExp?"0 1 auto":"1"}} placeholder={"名前("+MAX_NAME+"文字)"}/>
{!editMode&&<FavDropdown favs={favs} addF={addF} rmF={rmF} editF={editF} onPick={name=>ctUp(activeCourt,ti,pi,name)} usedNames={used} isAdmin={isAdmin}/>}
{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{ctRp(activeCourt,ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
</div>);})}
{!editMode&&team.players.length<MAX_PL&&<button style={{width:"100%",padding:10,border:"2px dashed var(--border-input)",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer"}} onClick={()=>ctAp(activeCourt,ti)}>＋ 追加</button>}
{!editMode&&team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>ctRp(activeCourt,ti,team.players.length-1)}>− 最後を削除</button>}
</div></div>))}
<button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"var(--text-inverse)",fontSize:32,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:6,boxShadow:"0 3px 16px rgba(43,125,233,0.3)"}} onClick={go}><Target size={28} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> ゲーム開始</button>
</>)}
{mode==="shuffle"&&(<><div style={CARD} onTouchStart={lpStart} onTouchEnd={lpEnd} onTouchMove={lpMove}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:700,fontSize:18,color:"var(--text-primary)"}}>参加メンバー（最大{maxShufForCourt}人）</div>
{editMode&&<button onClick={()=>{setEditMode(false);setExpandedDel(null);}} style={{padding:"4px 14px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>Done</button>}</div>
<div style={{display:"grid",gridTemplateColumns:editMode?"1fr":"1fr 1fr",gap:7}}>{mems.map((m,i)=>{const delKey="s"+i;const isExp=expandedDel===delKey;return(<div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:24,height:24,borderRadius:12,border:"none",background:"#e74c3c",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
<span style={{width:20,fontSize:14,color:"var(--text-muted)",fontWeight:700,textAlign:"right",flexShrink:0}}>{i+1}</span><input value={m} onChange={e=>uM(i,e.target.value)} maxLength={MAX_NAME} style={{...PIN,padding:"10px 12px",fontSize:18,flex:isExp?"0 1 auto":"1",minWidth:0}} placeholder="メンバー"/>
{!editMode&&<FavDropdown favs={favs} addF={addF} rmF={rmF} editF={editF} onPick={name=>uM(i,name)} usedNames={used} isAdmin={isAdmin}/>}
{editMode&&isExp&&mems.length>2&&<button onClick={()=>{rM(i);setExpandedDel(null);}} style={{padding:"4px 14px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
</div>);})}</div>
{!editMode&&mems.length<maxShufForCourt&&<button style={{width:"100%",padding:10,border:"2px dashed var(--border-input)",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:6}} onClick={aM}>＋</button>}
{!editMode&&<button onClick={()=>setShowSmartFav(true)} style={{width:"100%",padding:10,border:"2px solid var(--accent-blue)",borderRadius:8,background:"rgba(43,125,233,0.08)",color:"var(--accent-blue)",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:4}}>{"☆"} お気に入りから選択追加</button>}
{!editMode&&mems.length>2&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rM(mems.length-1)}>− 最後を削除</button>}</div>
{!okS&&okSReason&&<div style={{fontSize:13,fontWeight:700,color:"#e74c3c",textAlign:"center",marginBottom:4}}>{okSReason}</div>}
<button style={{width:"100%",padding:16,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"var(--text-inverse)",fontSize:20,fontWeight:800,cursor:"pointer",opacity:okS?1:0.3}} onClick={okS?doShuf:undefined}>🎲 シャッフル</button>
{courtCount>=2&&allCourtData&&<button onClick={()=>setShowCourtOverview(true)} style={{width:"100%",padding:18,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#1a6dd4)",color:"#fff",fontSize:24,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:4,boxShadow:"0 3px 12px rgba(43,125,233,0.3)"}}>{"📋"} コート一覧を見る</button>}
{courtCount===1&&sp&&(<div style={{marginTop:8}}>{sp.map((t,ti)=>(<div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac,padding:"10px 16px",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text-inverse)",fontWeight:900,fontSize:14,background:C[ti].ac}}>{ti+1}</div><input value={t.name} onChange={e=>setSp(p=>p.map((x,i)=>i===ti?{...x,name:e.target.value}:x))} style={{...TIN,fontSize:18}}/></div><div style={{paddingLeft:34,fontSize:16,color:"#555"}}>{t.players.join("、")}</div></div>))}
<button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"var(--text-inverse)",fontSize:32,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:4,opacity:isSpValid()?1:0.3}} onClick={isSpValid()?go:undefined}><Target size={28} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> 開始</button>
<button style={{width:"100%",padding:14,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"var(--text-inverse)",fontSize:18,fontWeight:800,cursor:"pointer",marginTop:6,opacity:okS?1:0.3}} onClick={okS?()=>{if(window.confirm("シャッフルし直しますか？"))doShuf();}:undefined}><RefreshCw size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 再シャッフル</button></div>)}
</>)}
</div>
{showSetupStats&&<StatsModal onClose={()=>setShowSetupStats(false)} source="setup" isAdmin={isAdmin} aiEnabled={aiEnabled}/>}
{showSmartFav&&<SmartFavPicker favs={favs} stats={_cache.stats} usedNames={used} maxMembers={maxShufForCourt} currentCount={used.length} minMembers={courtCount===1?tc:totalTeamsMulti} onAdd={({toAdd,toRemove})=>{setMems(prev=>{let updated=[...prev];if(toRemove&&toRemove.length>0){updated=updated.filter(m=>!toRemove.includes(m));}let ai=0;for(let i=0;i<updated.length&&ai<toAdd.length;i++){if(!updated[i].trim()){updated[i]=toAdd[ai++];}}while(ai<toAdd.length&&updated.length<maxShufForCourt){updated.push(toAdd[ai++]);}const filled=updated.filter(m=>m.trim()).length;const minReq=courtCount===1?tc:totalTeamsMulti;if(filled<minReq){window.alert("最低"+minReq+"人必要です");return prev;}return updated;});setSp(null);setAllCourtData(null);}} onClose={()=>setShowSmartFav(false)}/>}
{showSettings&&<SettingsPage onClose={()=>setShowSettings(false)} isAdmin={isAdmin} onAdminToggle={onAdminToggle} aiEnabled={aiEnabled} onAIToggle={onAIToggle} shufAnim={shufAnim} onShufAnimToggle={onShufAnimToggle}/>}
{shufAnimData&&<ShuffleAnimation names={shufAnimData.names} teams={shufAnimData.teams} onDone={()=>{if(shufAnimData.goData){const{ft,ord}=shufAnimData.goData;setShufAnimData(null);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,courtCount>=2&&allCourtData?{courtCount,courtTeamCounts,courtData:allCourtData}:null);}else{setSp(shufAnimData.teams);setShufAnimData(null);}}} onStartGame={shufAnimData.goData?null:()=>{const ft=shufAnimData.teams;const ord=Array.from({length:ft.length},(_,i)=>i);setShufAnimData(null);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,null);}} onReshuffle={shufAnimData.goData?null:()=>{setShufAnimData(null);setTimeout(()=>doShuf(),100);}}/>}
{multiCourtShufData&&<MultiCourtShuffleManager courtData={multiCourtShufData.courtData} courtCount={courtCount} courtOrder={multiCourtShufData.courtOrder} onAllDone={(data)=>{setMultiCourtShufData(null);setAllCourtData(data);setSp(data[1]);setShowCourtOverview(true);if(_db&&courtCount>=2)idbSet(_db,"court-allocation",{courtCount,courtTeamCounts,courtData:data,numGames,bestOf,dqEnd,saveToStats,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));}} onSkipAll={(data)=>{setMultiCourtShufData(null);setAllCourtData(data);setSp(data[1]);setShowCourtOverview(true);if(_db&&courtCount>=2)idbSet(_db,"court-allocation",{courtCount,courtTeamCounts,courtData:data,numGames,bestOf,dqEnd,saveToStats,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));}}/>}
{showCourtOverview&&allCourtData&&<CourtOverview courtData={allCourtData} courtCount={courtCount} courtTeamCounts={courtTeamCounts} numGames={numGames} bestOf={bestOf} dqEnd={dqEnd} saveToStats={saveToStats} onStartGame={(teams,order)=>{setShowCourtOverview(false);onStart(teams,order,numGames,bestOf,dqEnd,saveToStats,courtCount,{courtCount,courtTeamCounts,courtData:allCourtData});}} onBack={()=>{setShowCourtOverview(false);if(allCourtData){const allNames=[];for(let c=1;c<=courtCount;c++){const teams=allCourtData[c]||[];teams.forEach(t=>t.players.forEach(p=>{const nm=typeof p==="string"?p:(typeof p==="object"?(p.name||""):String(p));if(nm.trim())allNames.push(nm);}));}if(allNames.length>0)setMems(allNames);}}}/>}
{trimConfirm&&(<div style={{position:"fixed",inset:0,zIndex:9300,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#1a1a2e",borderRadius:16,padding:"24px 28px",maxWidth:400,width:"100%"}}>
{trimConfirm.step===1?(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:10}}>{"⚠"} メンバー数が超過します</div>
<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>現在<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled}人</span>入力済みですが、変更後の上限は<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.newMax}人</span>です。超過分の<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>が末尾から削除されます。続けますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>setTrimConfirm(p=>({...p,step:2}))} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
<button onClick={()=>setTrimConfirm(null)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>いいえ</button>
</div>
</>):(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:10}}>本当に変更しますか？</div>
<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>この操作は取り消せません。<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>のメンバーが削除されます。</div>
<div style={{display:"flex",gap:10}}>
<button onClick={trimDialogExec} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>変更する</button>
<button onClick={()=>setTrimConfirm(null)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>キャンセル</button>
</div>
</>)}
</div></div>)}
{caDiscardStep>0&&(<div style={{position:"fixed",inset:0,zIndex:9400,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#1a1a2e",borderRadius:16,padding:"24px 28px",maxWidth:360,width:"100%"}}>
{caDiscardStep===1?(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>前回のコート割り当てを破棄しますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>setCaDiscardStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
<button onClick={()=>setCaDiscardStep(0)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>いいえ</button>
</div>
</>):(<>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>この操作は取り消せません。破棄しますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>{setCaDiscardStep(0);if(onClearCourtAllocation)onClearCourtAllocation();}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
<button onClick={()=>setCaDiscardStep(0)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>キャンセル</button>
</div>
</>)}
</div></div>)}
</div>);
}

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
if(minimized){return(<div onClick={onToggleMin} style={{background:"var(--bg-secondary)",padding:isTabletSI?"24px 40px":"8px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
<span style={{fontSize:isTabletSI?48:18,color:"var(--text-inverse)",fontWeight:800}}>▲ 入力</span></div>);}
return(
<div style={{background:"var(--bg-surface)",borderTop:"2px solid #dde1e6",padding:(isTabletSI?"10px ":"6px ")+PAD+"px",paddingBottom:"calc("+(isTabletSI?"12":"8")+"px + env(safe-area-inset-bottom, 0px))",flexShrink:0}}>
{/* Top info: player name + score left, minimize button right */}
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:isTabletSI?6:2}}>
<div style={{flex:1,minWidth:0}}>
<div style={{display:"flex",alignItems:"baseline",gap:isTabletSI?10:6,flexWrap:"nowrap"}}>
<span style={{fontSize:pnFS,fontWeight:700,color:"var(--text-primary)",whiteSpace:"nowrap"}}>{playerName||""}</span>
<span style={{fontSize:scFS,fontWeight:900,color:"var(--text-primary)",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{teamScore}<span style={{fontSize:Math.round(scFS*0.55),fontWeight:700}}>点</span></span>
</div>
<div style={{display:"flex",gap:isTabletSI?6:3,alignItems:"center",marginTop:isTabletSI?6:2}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:isTabletSI?30:(isNarrow?10:13),height:isTabletSI?30:(isNarrow?10:13),borderRadius:"50%",display:"inline-block",background:j<fails?"#e74c3c":"#ddd"}}/>))}</div>
</div>
<button onClick={onToggleMin} style={{padding:isTabletSI?"20px 36px":"4px 8px",border:"1px solid var(--border-input)",borderRadius:isTabletSI?14:8,background:"transparent",color:"var(--text-muted)",fontSize:isTabletSI?44:14,fontWeight:800,cursor:"pointer",flexShrink:0}}>▼</button>
</div>
{teamScore>=PEN&&<div style={{fontSize:isTabletSI?18:13,fontWeight:700,color:"var(--text-warning)",marginBottom:isTabletSI?4:2,display:"flex",alignItems:"center",gap:3}}><AlertTriangle size={isTabletSI?18:14}/> フォルト=25点</div>}
<div style={{display:"flex",justifyContent:"center"}}>
<div style={{display:"flex",gap:GAP,alignItems:"stretch"}}>
{/* Pin layout buttons + undo */}
<div style={{display:"flex",flexDirection:"column",gap:NG}}>
{[[7,9,8],[5,11,12,6],[3,10,4],[1,2]].map((row,ri)=>(<div key={ri} style={{display:"flex",gap:NG,justifyContent:"center"}}>{row.map(n=>{const isSel=sel===n;return(<button key={n} onClick={()=>setSel(sel===n?null:n)} style={{width:NB,height:NB,borderRadius:NB/2,border:isSel?"3px solid var(--bg-secondary)":"2px solid #8899aa",background:isSel?"var(--bg-secondary)":"var(--bg-surface)",color:isSel?"var(--text-inverse)":"var(--text-primary)",fontSize:NFS,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.1s",boxShadow:isSel?"0 2px 8px rgba(20,54,90,0.3)":"none",padding:0}}>{n}</button>);})}</div>))}
{/* Undo button: same width as pin buttons area, under 1,2 */}
<div style={{display:"flex",justifyContent:"center"}}>
<button style={{width:NB*2+NG,padding:isTabletSI?"8px 0":"4px 0",border:"1px solid var(--border-input)",borderRadius:isTabletSI?10:8,background:"#f5f5f5",color:"#666",fontSize:isTabletSI?16:12,fontWeight:800,cursor:"pointer",opacity:canUndo?1:0.2}} onClick={canUndo?()=>dispatch({type:"UNDO"}):undefined}><Undo2 size={isTabletSI?16:12} style={{display:"inline",verticalAlign:"middle",marginRight:3}}/> 戻る</button>
</div>
</div>
{/* Action buttons: decide / fault / miss */}
<div style={{width:ACT_W,display:"flex",flexDirection:"column",gap:isNarrow?4:(isTabletSI?10:6),flexShrink:0}}>
<button style={{flex:1,border:"none",borderRadius:isNarrow?10:(isTabletSI?16:14),background:sel!=null?"var(--bg-secondary)":"#ccc",color:"var(--text-inverse)",fontSize:isNarrow?20:(isTabletSI?34:26),fontWeight:900,cursor:"pointer",boxShadow:sel!=null?"0 2px 8px rgba(20,54,90,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doScore}>決定</button>
<button style={{padding:isNarrow?"10px 0":(isTabletSI?"16px 0":"12px 0"),border:"2px solid #f0b0b0",borderRadius:isNarrow?8:(isTabletSI?12:10),background:"#fde8e8",color:"var(--text-danger)",fontSize:isNarrow?13:(isTabletSI?20:15),fontWeight:900,cursor:"pointer",flexShrink:0}} onClick={doFault}>x フォルト</button>
<button style={{flex:1,border:"2px solid #f0d4a0",borderRadius:isNarrow?10:(isTabletSI?16:14),background:"#fff3e0",color:"var(--accent-orange)",fontSize:isNarrow?15:(isTabletSI?24:17),fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doMiss}>{"－"} ミス</button>
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

function OrderPicker({teams,teamOrder,value,onChangeOrd,prevOrder,shufAnim,onShufAnimDone}){
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
{disp&&(<div style={{background:"var(--bg-surface-dim)",borderRadius:8,padding:8,marginBottom:6}}>{disp.map((ti,i)=>{const t=dispTeams[ti];const ap=t?.players?t.players.filter(p=>typeof p==="object"?p.active:true):[];return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<disp.length-1?"1px solid var(--border-lighter)":"none"}}><span style={{fontSize:16,fontWeight:800,color:C[ti]?.ac||"#aaa",width:24,textAlign:"center"}}>{i+1}</span><span style={{fontSize:17,fontWeight:700,color:C[ti]?.tx||"#333"}}>{t?.name||""}</span><span style={{fontSize:13,color:"var(--text-secondary)",marginLeft:2}}>{ap.map(p=>typeof p==="object"?p.name:p).join("・")}</span>{value==="manual"&&i>0&&<button onClick={()=>mvUp(i)} style={{marginLeft:"auto",padding:"4px 10px",border:"1px solid var(--border-input)",borderRadius:5,background:"var(--bg-surface)",fontSize:12,cursor:"pointer"}}>▲</button>}</div>);})}
</div>)}
{shufAnimData&&<ShuffleAnimation names={shufAnimData.names} teams={shufAnimData.teams} onDone={()=>{onChangeOrd("random",shufAnimData.order,shufAnimData.newTeams);setShufAnimData(null);}}/>}
</>);
}

/* ═══ Canvas image save ═══ */
function drawScoreImage(teams,history,teamOrder,comments,gameNumber,isDqWin,winner){
const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
const dqWinLastTurn=(isDqWin&&winner!=null)?Math.max(0,...history.filter(h=>h.teamIndex===winner).map(h=>h.turn)):null;
const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
const CW=56,RW=40,RH=34,HDR=30,NMH=84,PAD=20;
const totalW=RW+ordered.reduce((s,o)=>s+(o.ap.length+1)*CW,0)+PAD*2;
const tableH=HDR+NMH+Math.max(maxT,1)*RH+4;const commentH=comments.length>0?(34+comments.length*28+10):0;
const totalH=PAD+36+10+tableH+commentH+PAD;
const c=document.createElement("canvas");c.width=totalW*2;c.height=totalH*2;
const ctx=c.getContext("2d");ctx.scale(2,2);ctx.fillStyle="#fff";ctx.fillRect(0,0,totalW,totalH);
ctx.fillStyle="#14365a";ctx.font="bold 20px sans-serif";ctx.textAlign="center";ctx.fillText("Game "+gameNumber+" スコア表",totalW/2,PAD+24);
let y=PAD+36+10,x=PAD;ctx.fillStyle="#14365a";ctx.fillRect(x,y,RW,HDR);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("R",x+RW/2,y+20);let cx=x+RW;
ordered.forEach(o=>{const w=(o.ap.length+1)*CW;ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,w,HDR);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.fillText(o.team.name,cx+w/2,y+20);cx+=w;});y+=HDR;
ctx.fillStyle="#1e4a72";ctx.fillRect(x,y,RW,NMH);cx=x+RW;
ordered.forEach(o=>{o.ap.forEach(p=>{ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle=C[o.idx].nm;ctx.font="bold 13px sans-serif";ctx.textAlign="center";p.name.slice(0,MAX_NAME).split("").forEach((ch,ci)=>{ctx.fillText(ch,cx+CW/2,y+16+ci*13);});cx+=CW;});ctx.fillStyle="#0d2a48";ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle="#ffd700";ctx.font="bold 13px sans-serif";ctx.fillText("計",cx+CW/2,y+16);cx+=CW;});y+=NMH;
for(let turn=1;turn<=Math.max(maxT,1);turn++){ctx.fillStyle=turn%2===0?"#f8f9fb":"#fff";ctx.fillRect(x,y,totalW-PAD*2,RH);ctx.strokeStyle="#ddd";ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,y+RH);ctx.lineTo(x+totalW-PAD*2,y+RH);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText(""+turn,x+RW/2,y+23);cx=x+RW;
ordered.forEach(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);o.ap.forEach((p,pi)=>{const isP=e&&e.playerIndex===pi;let txt="";if(isP){if(e.type==="miss")txt="−";else if(e.type==="fault")txt=(e.faultReset&&!(e.consecutiveFails>=MF))?"F↓":"F";else txt=e.reset25?e.score+"↓":""+e.score;if(e.consecutiveFails>=MF)txt+="✕";}ctx.fillStyle=isP?(e.type==="miss"?"#bf6900":e.type==="fault"?"#c0392b":C[o.idx].tx):"#333";ctx.font=(isP?"bold ":"")+"13px sans-serif";ctx.fillText(txt,cx+CW/2,y+23);cx+=CW;});ctx.fillStyle=e?C[o.idx].tx:"#ccc";ctx.font="bold 14px sans-serif";const totalV=e?(dqWinLastTurn!=null&&o.idx===winner&&turn===dqWinLastTurn?50:e.runningTotal):"";ctx.fillText(""+totalV,cx+CW/2,y+23);cx+=CW;});y+=RH;}
if(comments.length>0){y+=10;ctx.fillStyle="#14365a";ctx.font="bold 15px sans-serif";ctx.textAlign="left";ctx.fillText("💬 メモ",x,y+18);y+=30;comments.forEach(c2=>{ctx.fillStyle="#444";ctx.font="14px sans-serif";ctx.fillText("• "+c2,x+6,y+16);y+=26;});}
return c;
}
async function saveImage(canvas){return new Promise((res,rej)=>{canvas.toBlob(async blob=>{if(!blob)return rej("fail");const file=new File([blob],"molkky-score.png",{type:"image/png"});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"モルック スコア"});res("shared");}catch(e){if(e.name!=="AbortError")rej(e);else res("cancelled");}}else{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="molkky-score.png";a.click();URL.revokeObjectURL(url);res("dl");}},"image/png");});}

/* ═══ Radar Chart SVG ═══ */
const RADAR_LABELS=["ミス率\n(低い程◎)","上がり\n決定率","投擲\n平均点","2ミス後\n平均点","お邪魔\n成功率","ブレイク\n平均点","勝率"];
const RADAR_MAX=["0%","100%","12pt","12pt","100%","12pt","100%"];
/* Per-vertex nudge for 7-gon */
const LB_ADJ=[{dx:0,dy:-20},{dx:30,dy:-8},{dx:30,dy:8},{dx:14,dy:20},{dx:-14,dy:20},{dx:-30,dy:8},{dx:-30,dy:-8}];
const MX_ADJ=[{dx:0,dy:6},{dx:18,dy:0},{dx:18,dy:0},{dx:8,dy:-4},{dx:-8,dy:-4},{dx:-18,dy:0},{dx:-18,dy:0}];
function RadarChart({playersData,size}){
const isTablet=typeof window!=="undefined"&&window.innerWidth>=768;
const S=isTablet?1200:size||600;
const rRatio=0.28;
const lbDist=isTablet?160:72;
const mxDist=isTablet?42:22;
const lbFS=isTablet?30:16;
const mxFS=isTablet?29:17;
const lbDy=isTablet?34:21;
const adjScale=isTablet?1.7:1;
const cx2=S/2,cy2=S/2,R=S*rRatio;const n=7;
const ang=i=>-Math.PI/2+i*(2*Math.PI/n);
const pt=(i,r)=>({x:cx2+r*Math.cos(ang(i)),y:cy2+r*Math.sin(ang(i))});
const grid=[0.25,0.5,0.75,1].map(f=>Array.from({length:n},(_,i)=>pt(i,R*f)).map(p=>p.x+","+p.y).join(" "));
const axes=Array.from({length:n},(_,i)=>({x1:cx2,y1:cy2,x2:pt(i,R).x,y2:pt(i,R).y}));
const labels=RADAR_LABELS.map((l,i)=>{const p=pt(i,R+lbDist);return{x:p.x+LB_ADJ[i].dx*adjScale,y:p.y+LB_ADJ[i].dy*adjScale,t:l};});
const maxPts=RADAR_MAX.map((m,i)=>{const p=pt(i,R+mxDist);return{x:p.x+MX_ADJ[i].dx*adjScale,y:p.y+MX_ADJ[i].dy*adjScale,t:m};});
const mSize=R*1.4;
const fnt="'Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif";
const pad=isTablet?40:30;
return(<svg width="100%" viewBox={`${-pad} ${-pad} ${S+pad*2} ${S+pad*2}`} style={{display:"block",margin:"0 auto"}}>
<image href={MASCOT_R} x={cx2-mSize/2} y={cy2-mSize/2} width={mSize} height={mSize} opacity={0.22}/>
{grid.map((g,i)=><polygon key={i} points={g} fill="none" stroke="#ccd" strokeWidth={i===3?2:0.7}/>)}
{axes.map((a,i)=><line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#ccc" strokeWidth={0.7}/>)}
{playersData.map((pd,pi)=>{const pts=pd.r.map((v,i)=>pt(i,R*Math.min(v,100)/100));const poly=pts.map(p=>p.x+","+p.y).join(" ");
return <React.Fragment key={pi}><polygon points={poly} fill={pd.color+"33"} stroke={pd.color} strokeWidth={2.5}/>{pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={4} fill={pd.color}/>)}</React.Fragment>;})}
{labels.map((l,i)=><text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" fontSize={lbFS} fontWeight={700} fill="#2c3e50" fontFamily={fnt} letterSpacing={1}>{l.t.split("\n").map((line,li)=><tspan key={li} x={l.x} dy={li===0?0:lbDy}>{line}</tspan>)}</text>)}
{maxPts.map((m,i)=><text key={"m"+i} x={m.x} y={m.y} textAnchor="middle" dominantBaseline="middle" fontSize={mxFS} fontWeight={900} fill="#1565c0" fontFamily={fnt}>{m.t}</text>)}
</svg>);
}



function fmtSec(s){if(s==null)return"-";return s<60?s.toFixed(1)+"秒":Math.floor(s/60)+"分"+Math.round(s%60)+"秒";}

/* ═══ Calendar Component ═══ */
function CalendarPicker({gameDates,onSelect,onSelectMonth,onSelectYear,mode,selectedStart,selectedEnd}){
const[viewDate,setViewDate]=useState(()=>new Date());
const year=viewDate.getFullYear();const month=viewDate.getMonth();
const firstDay=new Date(year,month,1).getDay();
const daysInMonth=new Date(year,month+1,0).getDate();
const prevMonth=()=>setViewDate(new Date(year,month-1,1));
const nextMonth=()=>setViewDate(new Date(year,month+1,1));
const dayNames=["日","月","火","水","木","金","土"];
const cells=[];
for(let i=0;i<firstDay;i++)cells.push(null);
for(let d=1;d<=daysInMonth;d++)cells.push(d);
const isGameDay=d=>{if(!d)return false;const ds=year+"-"+String(month+1).padStart(2,"0")+"-"+String(d).padStart(2,"0");return gameDates.has(ds);};
const isInRange=(d)=>{if(!d||!selectedStart)return false;const dt=new Date(year,month,d);dt.setHours(0,0,0,0);const s=new Date(selectedStart);s.setHours(0,0,0,0);if(!selectedEnd)return dt.getTime()===s.getTime();const e=new Date(selectedEnd);e.setHours(0,0,0,0);return dt>=s&&dt<=e;};
const isStart=(d)=>{if(!d||!selectedStart)return false;const dt=new Date(year,month,d);dt.setHours(0,0,0,0);const s=new Date(selectedStart);s.setHours(0,0,0,0);return dt.getTime()===s.getTime();};
const isEnd=(d)=>{if(!d||!selectedEnd)return false;const dt=new Date(year,month,d);dt.setHours(0,0,0,0);const e=new Date(selectedEnd);e.setHours(0,0,0,0);return dt.getTime()===e.getTime();};
const handleClick=(d)=>{if(!d)return;const dt=new Date(year,month,d);dt.setHours(0,0,0,0);onSelect(dt);};
const handleMonthTap=()=>{const s=new Date(year,month,1);s.setHours(0,0,0,0);const e=new Date(year,month,daysInMonth);e.setHours(0,0,0,0);onSelectMonth(s,e);};
/* 3: Year tap - toggle all games in viewed year (period mode only, exclude future) */
const handleYearTap=()=>{if(mode!=="range")return;const s=new Date(year,0,1);s.setHours(0,0,0,0);const now=new Date();now.setHours(23,59,59,999);const e=year===now.getFullYear()?now:new Date(year,11,31);e.setHours(23,59,59,999);onSelectYear(s,e);};
/* 3: Year picker - only current year (+ next year auto-added if year has changed) */
const[showYearPicker,setShowYearPicker]=useState(false);
const currentYear=new Date().getFullYear();
const BASE_YEAR=2026;
const availableYears=[];for(let y=BASE_YEAR;y<=currentYear&&availableYears.length<10;y++)availableYears.push(y);
const today=new Date();today.setHours(0,0,0,0);
const isToday=(d)=>{if(!d)return false;return year===today.getFullYear()&&month===today.getMonth()&&d===today.getDate();};
return(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:16,border:"1px solid var(--border-input)",marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
<button onClick={prevMonth} style={{width:36,height:36,border:"1px solid var(--border-input)",borderRadius:8,background:"var(--bg-surface)",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
<div style={{display:"flex",alignItems:"center",gap:4}}>
<button onClick={()=>{if(mode==="range")handleYearTap();else setShowYearPicker(p=>!p);}} style={{fontSize:20,fontWeight:800,color:mode==="range"?"var(--accent-blue)":"var(--text-primary)",background:"transparent",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,textDecoration:mode==="range"?"underline":"none",textDecorationStyle:"dotted",textUnderlineOffset:4}}>{year}年</button>
<button onClick={handleMonthTap} style={{fontSize:20,fontWeight:800,color:"var(--accent-blue)",background:"transparent",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:4}}>{String(month+1).padStart(2,"0")}月</button>
</div>
{(()=>{const nextMonthDate=new Date(year,month+1,1);const canGoNext=nextMonthDate<=new Date();return(<button onClick={canGoNext?nextMonth:undefined} style={{width:36,height:36,border:"1px solid var(--border-input)",borderRadius:8,background:"var(--bg-surface)",fontSize:18,cursor:canGoNext?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",opacity:canGoNext?1:0.3}}>›</button>);})()}
</div>
{showYearPicker&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10,justifyContent:"center"}}>{availableYears.map(y=>(<button key={y} onClick={()=>{setViewDate(new Date(y,month,1));setShowYearPicker(false);}} style={{padding:"6px 14px",border:y===year?"2px solid var(--accent-blue)":"1px solid var(--border-input)",borderRadius:8,background:y===year?"var(--accent-blue)":"var(--bg-surface)",color:y===year?"var(--text-inverse)":"var(--text-primary)",fontSize:14,fontWeight:700,cursor:"pointer"}}>{y}</button>))}</div>)}
<div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
{dayNames.map((dn,i)=>(<div key={dn} style={{textAlign:"center",fontSize:13,fontWeight:700,color:i===0?"#d93a5e":i===6?"var(--accent-blue)":"var(--text-secondary)",padding:"4px 0"}}>{dn}</div>))}
{cells.map((d,i)=>{
const inR=isInRange(d);const isSt=isStart(d);const isEn=isEnd(d);const gd=isGameDay(d);const td=isToday(d);const today=new Date();today.setHours(23,59,59,999);const isFuture=d&&new Date(year,month,d)>today;
return(<div key={i} onClick={()=>{if(!isFuture)handleClick(d);}} style={{textAlign:"center",padding:"8px 2px",cursor:d&&!isFuture?"pointer":"default",position:"relative",borderRadius:isSt&&isEn?10:isSt?"10px 0 0 10px":isEn?"0 10px 10px 0":0,background:inR&&!isFuture?"var(--accent-blue)":"transparent",color:isFuture?"#ccc":inR?"#fff":!d?"transparent":td?"var(--accent-blue)":"#333",fontWeight:td||inR?800:500,fontSize:15,opacity:isFuture?0.4:1,transition:"background 0.15s"}}>
{d||""}{gd&&!inR&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:5,height:5,borderRadius:"50%",background:"var(--accent-blue)"}}/>}{gd&&inR&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>}
</div>);
})}
</div>
{selectedStart&&(<div style={{marginTop:8,fontSize:13,fontWeight:600,color:"var(--text-primary)",textAlign:"center"}}>
期間: {fmtMD(new Date(selectedStart))}
{selectedEnd&&selectedStart.getTime()!==selectedEnd.getTime()?" 〜 "+fmtMD(new Date(selectedEnd)):""}
</div>)}

  </div>);
}

/* ═══ Score Distribution Component ═══ */
function ScoreDistribution({playersData,favs,isAdmin,aiEnabled}){
const hasSV=playersData.some(pd=>pd.metrics.scoreValues&&pd.metrics.scoreValues.length>0);
const[analyzeAll,setAnalyzeAll]=useState(false);
const[analyzeKey,setAnalyzeKey]=useState(0);
if(!hasSV)return(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid var(--border-input)"}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}><Target size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スコア分布分析</div>
<div style={{textAlign:"center",padding:20,color:"var(--text-muted)",fontSize:14}}>スコア分布データがありません</div>

  </div>);
  const SCORE_COLORS=["#e8e8e8","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a","#f59e0b","#ef4444"];
  const analyzablePlayers=playersData.filter(pd=>(favs||[]).includes(pd.name)&&(pd.metrics.gameCount||0)>=3);
  return(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid var(--border-input)"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
    <div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)"}}><Target size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スコア分布分析</div>
    {aiEnabled&&analyzablePlayers.length>1&&<button onClick={()=>{setAnalyzeAll(true);setAnalyzeKey(k=>k+1);}} style={{padding:"6px 14px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"var(--text-inverse)",fontSize:13,fontWeight:700,cursor:"pointer"}}><Bot size={13} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/> 全員分析</button>}
    </div>
    {playersData.map(pd=>(<ScoreDistPlayer key={pd.name} pd={pd} SCORE_COLORS={SCORE_COLORS} isFav={(favs||[]).includes(pd.name)} isAdmin={isAdmin} aiEnabled={aiEnabled} triggerAll={analyzeAll} analyzeKey={analyzeKey}/>))}
  </div>);
}

function ScoreDistPlayer({pd,SCORE_COLORS,isFav,isAdmin,aiEnabled,triggerAll,analyzeKey}){
const sv=pd.metrics.scoreValues||[];
const gc=pd.metrics.gameCount||0;
const canAnalyze=isFav&&gc>=3;
const[aiText,setAiText]=useState(()=>{if(!canAnalyze)return null;const key=makeAnalysisKey(pd.name,gc,pd.metrics);return getAnalysisCached(key);});
const[aiLoading,setAiLoading]=useState(false);
const[aiError,setAiError]=useState(null);
const remaining=ANALYSIS_DAILY_MAX-getPlayerAnalysisCount(pd.name);

const doAnalyze=useCallback(async(force)=>{
if(!canAnalyze)return;
const key=makeAnalysisKey(pd.name,gc,pd.metrics);
if(!force){const cached=getAnalysisCached(key);if(cached){setAiText(cached);setAiError(null);return;}}
setAiLoading(true);setAiError(null);
const r=await fetchPlayerAnalysis(pd.name,pd.metrics,isAdmin);
setAiLoading(false);
if(r.text){setAiText(r.text);setAiError(null);}else{setAiError(r.error);}
},[pd.name,gc,isAdmin,canAnalyze]);

/* Trigger from "全員分析" button */
useEffect(()=>{if(triggerAll&&analyzeKey>0&&canAnalyze&&aiEnabled){doAnalyze(false);}},[analyzeKey]);

if(!sv.length)return null;
const dist=Array(12).fill(0);sv.forEach(s=>{if(s>=1&&s<=12)dist[s-1]++;});
const maxC=Math.max(...dist,1);
const sorted=[...dist.map((c,i)=>({score:i+1,count:c}))].sort((a,b)=>b.count-a.count);
const top3=sorted.filter(s=>s.count>0).slice(0,3);
return(<div style={{marginBottom:16}}>
<div style={{fontSize:15,fontWeight:800,color:pd.color,marginBottom:8}}>{pd.name}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:10}}>
{dist.map((c,i)=>{const ratio=maxC>0?c/maxC:0;return(<div key={i} style={{textAlign:"center",padding:"10px 4px",borderRadius:8,background:c>0?SCORE_COLORS[i]:"#f5f5f5",color:c>0?(i>=6?"#fff":"#333"):"#ccc",fontWeight:700,fontSize:16,position:"relative",cursor:"default",border:c>0?"none":"1px solid #e8e8e8",opacity:c>0?0.5+ratio*0.5:0.4}}>
{i+1}<div style={{fontSize:10,fontWeight:500,marginTop:2}}>{c>0?c+"回":"-"}</div>
</div>);})}
</div>
<div style={{background:"var(--bg-surface-dim)",borderRadius:8,padding:10}}>
<div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>分析結果</div>
<div style={{fontSize:13,color:"#555"}}>よく獲得するスコア: {top3.length>0?top3.map(s=>s.score+"点").join(", "):"−"}</div>
<div style={{fontSize:13,color:"#555",marginTop:6}}>
<span style={{fontWeight:700}}>プレイスタイルAI分析: </span>
{!aiEnabled?<span style={{color:"var(--text-muted)"}}>AI分析OFF</span>
:!isFav?<span style={{color:"var(--text-muted)"}}>お気に入り登録で分析可能</span>
:gc<3?<span style={{color:"var(--text-muted)"}}>3試合以上で分析可能（現在{gc}試合）</span>
:aiLoading?<span style={{color:"var(--accent-blue)"}}>AI分析中...</span>
:aiError?<span style={{color:"var(--text-danger)"}}>{aiError}</span>
:aiText?<span style={{whiteSpace:"pre-line",lineHeight:1.6}}>{aiText}</span>
:<span style={{color:"var(--text-muted)"}}>ボタンを押して分析</span>}
</div>
{aiEnabled&&canAnalyze&&!aiLoading&&(
<div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
{aiText?<button onClick={()=>doAnalyze(true)} style={{padding:"5px 12px",border:"1px solid var(--border-input)",borderRadius:6,background:"var(--bg-surface)",color:"#555",fontSize:12,fontWeight:600,cursor:"pointer"}}><RefreshCw size={12} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/> 再分析</button>
:<button onClick={()=>doAnalyze(false)} style={{padding:"6px 14px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"var(--text-inverse)",fontSize:13,fontWeight:700,cursor:"pointer"}}><Bot size={13} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/> 分析</button>}
{!isAdmin&&<span style={{fontSize:11,color:"#bbb"}}>残{remaining}/{ANALYSIS_DAILY_MAX}回</span>}
</div>)}
</div>

  </div>);
}

/* ═══ Game Score Table Modal (uses real ScoreTable from replay data) ═══ */
function GameScoreModal({gameKey,onClose}){
const[replay,setReplay]=useState(null);
useEffect(()=>{if(!gameKey)return;const replays=loadReplays();setReplay(replays[gameKey]||null);},[gameKey]);
if(!gameKey||!replay)return null;
const dt=new Date(gameKey);
const dateStr=(dt.getMonth()+1)+"/"+dt.getDate()+" "+fmtHM(dt);
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={onClose}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(10px + env(safe-area-inset-top, 0px)) 16px 8px",background:"var(--bg-secondary)",flexShrink:0}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:20,fontWeight:800,color:"var(--text-inverse)"}}><ClipboardList size={18} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スコア表</div>
<div style={{fontSize:14,color:"rgba(255,255,255,0.7)"}}>{dateStr}</div>
<button onClick={onClose} style={{padding:"6px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"transparent",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>✕ 閉じる</button>
</div>
<div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg-surface)"}} onClick={e=>e.stopPropagation()}>
<ScoreTable teams={replay.teams} history={replay.history} teamOrder={replay.teamOrder} highlightLast={false} forCapture={true} dqWinnerIdx={(replay.autoEnd&&replay.dqEndGame&&replay.winner!=null)?replay.winner:null}/>
</div>

  </div>);
}

/* ═══ Game List Item ═══ */
function GameListItem({game,checked,onToggle,isTab,onShowScore,onDelete,isAdmin}){
const dt=new Date(game.d);
const timeStr=fmtHM(dt);
const dateStr=(dt.getMonth()+1)+"/"+dt.getDate();
const ftLabel=game.ft==="50finish"?"50点決着":game.ft==="dq"?"失格決着":"不明";
const ftColor=game.ft==="50finish"?"var(--text-success)":"var(--text-danger)";
/* E: Labels depend on finish type */
const winLabel=game.ft==="50finish"?"上がり者":"勝者";
const hasTeam=(game.winnerMembers||[]).length>=2;
const hasReplay=game.hasReplay;
return(<div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:checked?"#e6f0fb":"#fff",borderRadius:10,border:checked?"2px solid var(--accent-blue)":"1px solid #e0e0e0",marginBottom:6,transition:"all 0.15s"}}>
<div onClick={onToggle} style={{width:22,height:22,borderRadius:6,border:checked?"none":"2px solid #ccc",background:checked?"var(--accent-blue)":"var(--bg-surface)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer"}}>
{checked&&<span style={{color:"var(--text-inverse)",fontSize:14,fontWeight:900}}>✓</span>}
</div>
<div onClick={onToggle} style={{flex:1,minWidth:0,cursor:"pointer"}}>
<div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
<span style={{fontSize:isTab?18:15,fontWeight:800,color:"var(--text-primary)"}}>{dateStr} {timeStr}</span>
<span style={{fontSize:isTab?14:12,fontWeight:700,color:ftColor,background:ftColor+"18",padding:"2px 8px",borderRadius:4}}>{ftLabel}</span>
</div>
<div style={{fontSize:isTab?15:13,color:"#555",marginTop:3}}>
{game.players.length}人戦　参加者: {game.players.join(", ")}
</div>
{game.winnerName&&<div style={{fontSize:isTab?14:12,color:"var(--text-success)",fontWeight:700,marginTop:2}}>{winLabel}: {game.winnerName}</div>}
{hasTeam&&<div style={{fontSize:isTab?13:11,color:"var(--accent-blue)",fontWeight:600,marginTop:1}}>勝利チームのメンバー: {game.winnerMembers.join(", ")}</div>}
</div>
{hasReplay&&<button onClick={e=>{e.stopPropagation();onShowScore&&onShowScore(game.d);}} style={{padding:"6px 10px",border:"1px solid #2b7de9",borderRadius:8,background:"#f0f6ff",color:"var(--accent-blue)",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><ClipboardList size={14}/></button>}
{isAdmin&&onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(game.d,game);}} style={{padding:"6px 10px",border:"1px solid #e74c3c",borderRadius:8,background:"#fef2f2",color:"#e74c3c",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><Trash2 size={14}/></button>}
  </div>);
}

/* ═══ Stats Modal — with Calendar/Recent tabs + Score Distribution ═══ */
function StatsModal({onClose,currentGameRecords,initialDelete,source,isAdmin,aiEnabled}){
const isTab=typeof window!=="undefined"&&window.innerWidth>=768;
const[stats,setStats]=useState(()=>loadStats());
const favs=loadFavs();
const[viewMode,setViewMode]=useState(source==="setup"?"cumulative":"cumulative");
const[tab,setTab]=useState("all");
const[delStep,setDelStep]=useState(initialDelete?1:0);
/* Calendar state */
const[calMode,setCalMode]=useState("single");
const[calStart,setCalStart]=useState(null);const[calEnd,setCalEnd]=useState(null);
/* Game selection state */
const[selectedGameKeys,setSelectedGameKeys]=useState(new Set());
/* F: Pagination for recent tab */
const[recentPage,setRecentPage]=useState(0);
const RECENT_TOTAL=30;const PAGE_SIZE=10;
/* Score table modal (stores game date key) */
const[scoreGame,setScoreGame]=useState(null);
/* A: Game delete confirmation */
const[deleteConf,setDeleteConf]=useState(null);
/* E: Calendar pagination */
const[calPage,setCalPage]=useState(0);

const currentNames=(currentGameRecords||[]).map(r=>r.nm);
const allNames=favs.filter(n=>(stats[n]&&stats[n].length>0)||currentNames.includes(n));
/* Fix 6: game source shows only participating fav members */
const gameParticipants=source==="game"?allNames.filter(n=>currentNames.includes(n)):allNames;
const names=viewMode==="current"?gameParticipants:source==="game"?gameParticipants:allNames;
const[selected,setSelected]=useState(()=>{
if(source==="game"){const gp=favs.filter(n=>((stats[n]&&stats[n].length>0)||currentNames.includes(n))&&currentNames.includes(n));return gp.slice(0,6);}
return allNames.slice(0,4);
});
const effectiveSelected=viewMode==="current"?selected.filter(n=>currentNames.includes(n)):selected;
const toggleSel=n=>{setSelected(p=>{if(p.includes(n))return p.filter(x=>x!==n);if(p.length<6)return[...p,n];return[...p.slice(1),n];});};

const allGames=getAvailableGames(stats,names);
const gameDateSet=getGameDates(stats,names);

/* Calendar date selection */
const handleCalSelect=(dt)=>{
setCalPage(0);
if(calMode==="single"){setCalStart(dt);setCalEnd(dt);
const ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
const dayGames=allGames.filter(g=>g.d.startsWith(ds));
setSelectedGameKeys(new Set(dayGames.map(g=>g.d)));
}else{
if(!calStart||calEnd){setCalStart(dt);setCalEnd(null);setSelectedGameKeys(new Set());}
else{
const s=dt<calStart?dt:calStart;const e=dt<calStart?calStart:dt;
setCalStart(s);setCalEnd(e);
const rangeGames=filterGamesByDates(allGames,s,e);
setSelectedGameKeys(new Set(rangeGames.map(g=>g.d)));
}
}
};

/* D: Month tap to select/deselect entire month */
const handleMonthSelect=(monthStart,monthEnd)=>{
setCalPage(0);
const monthGames=filterGamesByDates(allGames,monthStart,monthEnd);
if(monthGames.length===0)return;
const monthKeys=new Set(monthGames.map(g=>g.d));
const allSelected=monthGames.every(g=>selectedGameKeys.has(g.d));
if(allSelected){
setSelectedGameKeys(p=>{const n=new Set(p);monthKeys.forEach(k=>n.delete(k));return n;});
setCalStart(null);setCalEnd(null);
}else{
setSelectedGameKeys(p=>{const n=new Set(p);monthKeys.forEach(k=>n.add(k));return n;});
setCalStart(monthStart);setCalEnd(monthEnd);
}
};

/* 3: Year tap to select/deselect entire year (period mode only, exclude future) */
const handleYearSelect=(yearStart,yearEnd)=>{
setCalPage(0);
const yearGames=filterGamesByDates(allGames,yearStart,yearEnd);
if(yearGames.length===0)return;
const yearKeys=new Set(yearGames.map(g=>g.d));
const allSelected=yearGames.every(g=>selectedGameKeys.has(g.d));
if(allSelected){
setSelectedGameKeys(p=>{const n=new Set(p);yearKeys.forEach(k=>n.delete(k));return n;});
setCalStart(null);setCalEnd(null);
}else{
setSelectedGameKeys(p=>{const n=new Set(p);yearKeys.forEach(k=>n.add(k));return n;});
setCalStart(yearStart);setCalEnd(yearEnd);
}
};

/* F: Recent tab: 30 games, 10/page */
const recentGamesAll=allGames.slice(0,RECENT_TOTAL);
const totalPages=Math.ceil(recentGamesAll.length/PAGE_SIZE);
const recentGames=recentGamesAll.slice(recentPage*PAGE_SIZE,(recentPage+1)*PAGE_SIZE);

const toggleGameKey=(key)=>{setSelectedGameKeys(p=>{const n=new Set(p);if(n.has(key))n.delete(key);else n.add(key);return n;});};
const selectAllRecent=()=>{setSelectedGameKeys(p=>{const n=new Set(p);recentGamesAll.forEach(g=>n.add(g.d));return n;});};
const deselectAllRecent=()=>{setSelectedGameKeys(p=>{const n=new Set(p);recentGamesAll.forEach(g=>n.delete(g.d));return n;});};

/* Compute player data based on tab + selection */
const getPlayerGames=(nm)=>{
if(viewMode==="current"){const r=(currentGameRecords||[]).find(r2=>r2.nm===nm);return r?[r.data]:[];}
if(tab==="all")return stats[nm]||[];
const playerGames=stats[nm]||[];
return playerGames.filter(g=>selectedGameKeys.has(g.d));
};
const playersData=effectiveSelected.map((nm,i)=>{const g=getPlayerGames(nm);const m=calcMetrics(g);return{name:nm,color:PC[i%PC.length],metrics:m,r:m?m.r:[0,0,0,0,0,0]};}).filter(p=>p.metrics);

const doDelete=(p)=>{deleteStatsByPeriod(p);setStats(loadStats());setDelStep(0);};

const tabBtnStyle=(k)=>({padding:isTab?"10px 24px":"8px 16px",border:"none",borderBottom:tab===k?"3px solid #2b7de9":"3px solid transparent",background:"transparent",color:tab===k?"var(--text-primary)":"var(--text-secondary)",fontSize:isTab?20:15,fontWeight:tab===k?800:600,cursor:"pointer"});

/* Games filtered for display in calendar tab */
const calFilteredGames=(calStart&&calEnd)?filterGamesByDates(allGames,calStart,calEnd):calStart?filterGamesByDates(allGames,calStart,calStart):[];

return(<div className="mk-fade-scale-in" style={{position:"fixed",inset:0,background:"var(--bg-surface-alt)",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden",overscrollBehavior:"none"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(10px + env(safe-area-inset-top, 0px)) 20px 10px",background:"var(--bg-secondary)",flexShrink:0}}>
<h2 style={{fontSize:isTab?32:24,fontWeight:900,color:"var(--text-inverse)",margin:0,display:"flex",alignItems:"center",gap:6}}><BarChart3 size={24}/> {source==="setup"?"累計スタッツ":"プレイヤースタッツ"}</h2>
<button onClick={onClose} style={{padding:"8px 18px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"transparent",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>✕ 閉じる</button>
</div>
<div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"12px 20px",paddingBottom:"calc(12px + env(safe-area-inset-bottom, 0px))",overscrollBehavior:"contain"}}>
{names.length===0?<div style={{textAlign:"center",padding:40,color:"var(--text-secondary)",fontSize:18}}><Star size={18} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> お気に入り登録プレイヤーのデータなし</div>:(<>
{/* View mode toggle: cumulative vs current game (only from game result) */}
{source!=="setup"&&currentGameRecords&&currentGameRecords.length>0&&(
<div style={{display:"flex",gap:6,marginBottom:10}}>{[["cumulative","累計データ"],["current","この試合"]].map(([k,l])=>(<button key={k} onClick={()=>{setViewMode(k);}} style={{flex:1,padding:"10px 0",border:"2px solid "+(viewMode===k?"var(--bg-secondary)":"var(--border-input)"),borderRadius:10,background:viewMode===k?"var(--bg-secondary)":"var(--bg-surface)",color:viewMode===k?"var(--text-inverse)":"var(--text-primary)",fontSize:16,fontWeight:700,cursor:"pointer"}}>{l}</button>))}</div>
)}
{/* Tabs (only for cumulative mode) */}
{viewMode==="cumulative"&&(
<div style={{display:"flex",borderBottom:"1px solid var(--border-input)",marginBottom:10}}>
<button onClick={()=>{setTab("calendar");setSelectedGameKeys(new Set());}} style={tabBtnStyle("calendar")}>カレンダー</button>
<button onClick={()=>{setTab("recent");setSelectedGameKeys(new Set());}} style={tabBtnStyle("recent")}>直近の試合</button>
<button onClick={()=>{setTab("all");}} style={tabBtnStyle("all")}>累計</button>
</div>
)}
{/* Calendar Tab */}
{viewMode==="cumulative"&&tab==="calendar"&&(<>
<div style={{display:"flex",gap:6,marginBottom:8}}>
{[["single","単一日付"],["range","期間選択"]].map(([k,l])=>(<button key={k} onClick={()=>{setCalMode(k);setCalStart(null);setCalEnd(null);setSelectedGameKeys(new Set());setCalPage(0);}} style={{flex:1,padding:"8px 0",border:"2px solid "+(calMode===k?"var(--accent-blue)":"var(--border-input)"),borderRadius:8,background:calMode===k?"var(--accent-blue)":"var(--bg-surface)",color:calMode===k?"var(--text-inverse)":"var(--text-primary)",fontSize:14,fontWeight:700,cursor:"pointer"}}>{l}</button>))}
</div>
<CalendarPicker gameDates={gameDateSet} onSelect={handleCalSelect} onSelectMonth={handleMonthSelect} onSelectYear={handleYearSelect} mode={calMode} selectedStart={calStart} selectedEnd={calEnd}/>
{calFilteredGames.length>0&&(<div style={{marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
<span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{selectedGameKeys.size}/{calFilteredGames.length} セット選択中</span>
<div style={{display:"flex",gap:6}}>
<button onClick={()=>setSelectedGameKeys(new Set(calFilteredGames.map(g=>g.d)))} style={{padding:"4px 12px",border:"1px solid #2b7de9",borderRadius:6,background:"var(--bg-surface)",color:"var(--accent-blue)",fontSize:12,fontWeight:700,cursor:"pointer"}}>全選択</button>
<button onClick={()=>setSelectedGameKeys(new Set())} style={{padding:"4px 12px",border:"1px solid var(--border-input)",borderRadius:6,background:"var(--bg-surface)",color:"var(--text-secondary)",fontSize:12,fontWeight:700,cursor:"pointer"}}>全解除</button>
</div>
</div>
{(()=>{const CAL_PAGE_SIZE=10;const calTotalPages=Math.ceil(calFilteredGames.length/CAL_PAGE_SIZE);const calPagedGames=calFilteredGames.slice(calPage*CAL_PAGE_SIZE,(calPage+1)*CAL_PAGE_SIZE);return(<>
{calPagedGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab} onShowScore={setScoreGame} onDelete={(key,game)=>setDeleteConf(game)} isAdmin={isAdmin}/>))}
{calTotalPages>1&&<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:8}}>
{Array.from({length:calTotalPages},(_,i)=>(<button key={i} onClick={()=>setCalPage(i)} style={{width:36,height:36,border:calPage===i?"2px solid var(--accent-blue)":"1px solid var(--border-input)",borderRadius:8,background:calPage===i?"var(--accent-blue)":"var(--bg-surface)",color:calPage===i?"var(--text-inverse)":"var(--text-primary)",fontSize:14,fontWeight:700,cursor:"pointer"}}>{i+1}</button>))}
</div>}
</>);})()}
</div>)}
</>)}
{/* Recent Tab */}
{viewMode==="cumulative"&&tab==="recent"&&(<div style={{marginBottom:10}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
<span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{selectedGameKeys.size}/{recentGamesAll.length} セット選択中</span>
<div style={{display:"flex",gap:6}}>
<button onClick={selectAllRecent} style={{padding:"4px 12px",border:"1px solid #2b7de9",borderRadius:6,background:"var(--bg-surface)",color:"var(--accent-blue)",fontSize:12,fontWeight:700,cursor:"pointer"}}>全選択</button>
<button onClick={deselectAllRecent} style={{padding:"4px 12px",border:"1px solid var(--border-input)",borderRadius:6,background:"var(--bg-surface)",color:"var(--text-secondary)",fontSize:12,fontWeight:700,cursor:"pointer"}}>全解除</button>
</div>
</div>
{/* 4: Range preset buttons */}
<div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
{[["today","今日",0],["7d","直近7日",7],["30d","直近30日",30],["1y","直近1年",365]].map(([k,label,days])=>{
const applyPreset=()=>{
const now=new Date();now.setHours(23,59,59,999);
const start=new Date();start.setHours(0,0,0,0);
if(days>0)start.setDate(start.getDate()-days+1);
const matched=recentGamesAll.filter(g=>{const d=new Date(g.d);return d>=start&&d<=now;});
setSelectedGameKeys(new Set(matched.map(g=>g.d)));
};
return(<button key={k} onClick={applyPreset} style={{padding:"6px 12px",border:"1px solid #2b7de9",borderRadius:8,background:"#f0f6ff",color:"var(--accent-blue)",fontSize:13,fontWeight:700,cursor:"pointer"}}>{label}</button>);
})}
</div>
{recentGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab} onShowScore={setScoreGame} onDelete={(key,game)=>setDeleteConf(game)} isAdmin={isAdmin}/>))}
{/* F: Pagination */}
{totalPages>1&&(<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10}}>
{Array.from({length:totalPages},(_,i)=>(<button key={i} onClick={()=>setRecentPage(i)} style={{width:36,height:36,border:recentPage===i?"2px solid var(--accent-blue)":"1px solid var(--border-input)",borderRadius:8,background:recentPage===i?"var(--accent-blue)":"var(--bg-surface)",color:recentPage===i?"var(--text-inverse)":"var(--text-primary)",fontSize:14,fontWeight:700,cursor:"pointer"}}>{i+1}</button>))}
</div>)}
</div>)}
{/* Player selection */}
{source==="setup"?(<div style={{background:"var(--bg-surface)",borderRadius:12,border:"1px solid var(--border-input)",padding:12,marginBottom:10,marginTop:6}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
<span style={{fontSize:14,fontWeight:700,color:"var(--text-primary)"}}>{effectiveSelected.length}/6 人選択中</span>
<button onClick={()=>setSelected([])} style={{padding:"4px 12px",border:"1px solid var(--border-input)",borderRadius:6,background:"var(--bg-surface)",color:"var(--text-secondary)",fontSize:12,fontWeight:700,cursor:"pointer"}}>全解除</button>
</div>
<div style={{display:"grid",gridTemplateColumns:isTab?"1fr 1fr 1fr":"1fr 1fr",gap:6}}>{names.map(nm=>{const isSel=effectiveSelected.includes(nm);const ci=isSel?effectiveSelected.indexOf(nm)%PC.length:0;return(<button key={nm} onClick={()=>toggleSel(nm)} style={{display:"flex",alignItems:"center",gap:8,padding:isTab?"10px 14px":"8px 10px",border:"2px solid "+(isSel?PC[ci]:"var(--border-input)"),borderRadius:10,background:isSel?PC[ci]+"15":"var(--bg-surface)",cursor:"pointer",textAlign:"left"}}>
<div style={{width:20,height:20,borderRadius:4,border:"2px solid "+(isSel?PC[ci]:"#ccc"),background:isSel?PC[ci]:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isSel&&<span style={{color:"#fff",fontSize:14,fontWeight:900,lineHeight:1}}>&#10003;</span>}</div>
<span style={{fontSize:isTab?18:14,fontWeight:700,color:isSel?PC[ci]:"var(--text-secondary)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nm}</span>
</button>);})}</div>
</div>):(<div style={{display:"flex",gap:isTab?12:6,marginBottom:10,flexWrap:"wrap",marginTop:6}}>{names.map(nm=>{const isSel=effectiveSelected.includes(nm);const ci=isSel?effectiveSelected.indexOf(nm)%PC.length:0;return(<button key={nm} onClick={()=>toggleSel(nm)} style={{padding:isTab?"12px 28px":"6px 14px",border:"2px solid "+(isSel?PC[ci]:"var(--border-input)"),borderRadius:isTab?36:20,background:isSel?PC[ci]+"22":"#fff",color:isSel?PC[ci]:"#888",fontSize:isTab?28:14,fontWeight:700,cursor:"pointer"}}>{nm}</button>);})}</div>)}
{playersData.length>0&&(<>
{/* SVG Radar (7-axis) - full width */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{display:"flex",justifyContent:"center",width:"100%"}}><RadarChart playersData={playersData} size={isTab?600:340}/></div>
<div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:4}}>{playersData.map(pd=>(<div key={pd.name} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:5,background:pd.color}}/><span style={{fontSize:12,fontWeight:700,color:"#333"}}>{pd.name}</span></div>))}</div>
</div>
{/* Summary table */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid var(--border-input)"}}>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{background:"var(--bg-secondary)",color:"var(--text-inverse)"}}><th style={{padding:"8px",textAlign:"left"}}>プレイヤー</th><th style={{padding:"8px"}}>試合</th><th style={{padding:"8px"}}>勝利</th><th style={{padding:"8px"}}>ターン</th><th style={{padding:"8px"}}>ミス</th><th style={{padding:"8px"}}>ミス率</th><th style={{padding:"8px"}}>上がり率</th><th style={{padding:"8px"}}>お邪魔</th></tr></thead>
<tbody>{playersData.map(pd=>{const m=pd.metrics;return(<tr key={pd.name} style={{borderBottom:"1px solid var(--border-lighter)"}}><td style={{padding:"8px",fontWeight:700,color:pd.color}}>{pd.name}</td><td style={{padding:"8px",textAlign:"center"}}>{m.gameCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.winCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.turnCount}</td><td style={{padding:"8px",textAlign:"center",color:"var(--accent-orange)"}}>{m.missCount}</td><td style={{padding:"8px",textAlign:"center"}}>{(m.missRate*100).toFixed(1)}%</td><td style={{padding:"8px",textAlign:"center"}}>{(m.finishRate*100).toFixed(1)}%</td><td style={{padding:"8px",textAlign:"center",color:"var(--text-success)",fontWeight:800}}>{m.ojamaCount}</td></tr>);})}</tbody></table>
</div>
{/* Score Distribution */}
<ScoreDistribution playersData={playersData} favs={favs} isAdmin={isAdmin} aiEnabled={aiEnabled!==false}/>
{/* Detailed metrics */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}><BarChart3 size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 詳細指標</div>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"var(--bg-surface-alt)"}}><th style={{padding:"6px",textAlign:"left"}}>指標</th>{playersData.map(pd=><th key={pd.name} style={{padding:"6px",textAlign:"center",color:pd.color,fontWeight:800}}>{pd.name}</th>)}</tr></thead>
<tbody>{[["先攻勝率",pd=>pd.metrics.firstWinRate!=null?(pd.metrics.firstWinRate*100).toFixed(1)+"% ("+pd.metrics.firstGames+"試合)":"-"],["後攻勝率",pd=>pd.metrics.lastWinRate!=null?(pd.metrics.lastWinRate*100).toFixed(1)+"% ("+pd.metrics.lastGames+"試合)":"-"],["投擲平均点",pd=>pd.metrics.avgPts.toFixed(2)],["ブレイク平均",pd=>pd.metrics.breakAvg.toFixed(2)],["お邪魔成功率",pd=>(pd.metrics.ojamaRate*100).toFixed(1)+"%"],["2ミス後平均",pd=>pd.metrics.recAvg.toFixed(2)],["上がり決定率",pd=>(pd.metrics.finishRate*100).toFixed(1)+"%"],["ミス率",pd=>(pd.metrics.missRate*100).toFixed(1)+"%"],["最短投擲",pd=>fmtSec(pd.metrics.throwMin)],["最長投擲",pd=>fmtSec(pd.metrics.throwMax)],["平均投擲",pd=>fmtSec(pd.metrics.throwAvg)]].map(([label,fn])=>(<tr key={label} style={{borderBottom:"1px solid var(--border-lighter)"}}><td style={{padding:"6px",fontWeight:700}}>{label}</td>{playersData.map(pd=><td key={pd.name} style={{padding:"6px",textAlign:"center"}}>{fn(pd)}</td>)}</tr>))}</tbody></table>
</div>
{/* Turn-by-turn performance */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}><BarChart3 size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> ターン別パフォーマンス分析</div>
{playersData.map(pd=>{
const sv=pd.metrics.scoreValues||[];if(!sv.length)return null;
const maxBars=Math.min(sv.length,20);const recent=sv.slice(-maxBars);
const maxV=Math.max(...recent,1);
return(<div key={pd.name} style={{marginBottom:12}}>
<div style={{fontSize:14,fontWeight:700,color:pd.color,marginBottom:6}}>{pd.name}（直近{recent.length}投）</div>
<div style={{display:"flex",alignItems:"flex-end",gap:2,height:60}}>
{recent.map((v,i)=>(<div key={i} style={{flex:1,background:v===0?"#e0e0e0":pd.color,borderRadius:"3px 3px 0 0",height:Math.max((v/maxV)*56,4),opacity:0.7+0.3*(v/maxV),position:"relative"}} title={v+"点"}>
{recent.length<=12&&<div style={{position:"absolute",top:-16,left:"50%",transform:"translateX(-50%)",fontSize:9,fontWeight:700,color:"#666"}}>{v}</div>}
</div>))}
</div>
</div>);
})}
</div>
</>)}
</>)}
</div>
{/* Score table modal */}
{scoreGame&&<GameScoreModal gameKey={scoreGame} onClose={()=>setScoreGame(null)}/>}
{/* Delete dialogs */}
{delStep===1&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
{isAdmin?(<>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> スタッツを削除しますか？</div>
<div style={{display:"flex",gap:8}}><button onClick={()=>setDelStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>する</button><button onClick={()=>setDelStep(0)} style={{flex:1,padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
</>):(<>
<div style={{marginBottom:8}}><Lock size={44} color="var(--text-primary)"/></div>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}>管理者モードが必要です</div>
<div style={{fontSize:14,color:"var(--text-secondary)",marginBottom:14}}>スタッツの削除は管理者のみ実行できます。<br/>⚙️ 詳細設定で管理者モードをONにしてください。</div>
<button onClick={()=>setDelStep(0)} style={{width:"100%",padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>閉じる</button>
</>)}
</div></div>}
{delStep===2&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:250,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:400,width:"90%",textAlign:"center"}}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:12}}>削除する期間を選択</div>
<div style={{display:"flex",flexDirection:"column",gap:6}}>{[["day","今日"],["week","今週"],["month","今月"],["year","今年"],["all","全期間"]].map(([k,l])=>(<button key={k} onClick={()=>doDelete(k)} style={{padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>{l}のデータを削除</button>))}<button onClick={()=>setDelStep(0)} style={{padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
</div></div>}
{deleteConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setDeleteConf(null)}><div className="mk-fade-scale-in" style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:400,width:"90%"}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={18}/> 試合データを削除</div>
<div style={{fontSize:15,color:"var(--text-primary)",marginBottom:6}}>以下の試合データを完全に削除しますか?</div>
<div style={{background:"rgba(0,0,0,0.04)",borderRadius:8,padding:10,marginBottom:6,fontSize:14}}>
<div style={{fontWeight:700}}>{new Date(deleteConf.d).toLocaleDateString("ja-JP")} {new Date(deleteConf.d).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})}</div>
<div style={{color:"#555",marginTop:2}}>{deleteConf.players.length}人戦: {deleteConf.players.join(", ")}</div>
</div>
<div style={{fontSize:13,color:"var(--text-danger)",marginBottom:16}}>この操作は元に戻せません。参加者全員のスタッツとスコア表データが削除されます。</div>
<div style={{display:"flex",gap:8}}>
<button onClick={async()=>{await deleteGameByKey(deleteConf.d);setStats({...loadStats()});setDeleteConf(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button>
<button onClick={()=>setDeleteConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button>
</div>
</div></div>}

  </div>);
}

/* ═══ Game Result — with stats toggle + long-press delete ═══ */
function GameResult({teams,history,teamOrder,winner,gameWins,bestOf,numGames,gameNumber,onNext,onBack,onExtend,onReshuffle,hasCourtAllocation,courtCount,timestamps,isAdmin,aiEnabled,autoEnd,dqEndGame,shufAnim}){
const[comment,setComment]=useState("");const[comments,setComments]=useState([]);
const[ordMode,setOrdMode]=useState("reverse");const[ordVal,setOrdVal]=useState([...teamOrder].reverse());const[ordTeams,setOrdTeams]=useState(null);
const[saving,setSaving]=useState(false);const[showStats,setShowStats]=useState(false);
const statsLPRef=useRef(null);
const tw=gameWins||teams.map(()=>0);const matchWin=bestOf>0?tw.findIndex(w=>w>=bestOf):-1;
const isMatchOver=matchWin>=0;const isLastGame=numGames>0&&gameNumber>=numGames&&!isMatchOver;
const isAllDone=isMatchOver||isLastGame;const canContinue=!isAllDone;
const addC=()=>{if(comment.trim()){setComments(p=>[...p,comment.trim()]);setComment("");}};
const isDqWin=!!(autoEnd&&dqEndGame);
const teamStats=teamOrder.map(ti=>{const th=history.filter(h=>h.teamIndex===ti);const sc=th.filter(h=>h.type==="score");const rawFinal=scoreOf(history,ti);return{ti,name:teams[ti].name,final:(isDqWin&&ti===winner)?WIN:rawFinal,totalPts:sc.reduce((s2,h)=>s2+h.score,0),misses:th.filter(h=>h.type==="miss").length,faults:th.filter(h=>h.type==="fault").length,turns:th.length};});
const handleOrd=(m,v,nt)=>{setOrdMode(m);setOrdVal(v);setOrdTeams(nt||null);};
const doSave=async()=>{setSaving(true);try{const canvas=drawScoreImage(teams,history,teamOrder,comments,gameNumber,isDqWin,winner);await saveImage(canvas);}catch(e){console.error(e);}setSaving(false);};
/* Build current game records for per-game stats view */
const favs=loadFavs();
const currentGameRecords=buildGameRecord(teams,history,teamOrder,winner,timestamps||[],favs);
const startLP=()=>{statsLPRef.current=setTimeout(()=>{setShowStats("delete");},600);};
const cancelLP=()=>{if(statsLPRef.current)clearTimeout(statsLPRef.current);};
return(
<div className="mk-slide-up" style={{position:"fixed",inset:0,background:"var(--bg-surface-alt)",zIndex:100,display:"flex",flexDirection:"column",overflow:"hidden",overscrollBehavior:"none"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(10px + env(safe-area-inset-top, 0px)) 20px 10px",background:"var(--bg-secondary)",flexShrink:0}}>
<h2 style={{fontSize:24,fontWeight:900,color:"var(--text-inverse)",margin:0,display:"flex",alignItems:"center",gap:6}}><Trophy size={22}/> Game {gameNumber} 結果</h2>
<button onPointerDown={startLP} onPointerUp={cancelLP} onPointerLeave={cancelLP} onClick={()=>{if(showStats!=="delete")setShowStats(true);}} style={{padding:"8px 18px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"rgba(255,255,255,0.1)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}><BarChart3 size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スタッツ</button>
</div>
<div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"14px 20px",paddingBottom:"calc(14px + env(safe-area-inset-bottom, 0px))",overscrollBehavior:"contain"}}>
<div style={{textAlign:"center",marginBottom:12}}><h2 style={{fontSize:30,fontWeight:900,color:C[winner]?.ac||"var(--text-primary)",margin:0}}>{teams[winner]?.name} 勝利！</h2>{isMatchOver&&<div style={{fontSize:32,fontWeight:900,color:"var(--text-success)",marginTop:4}}><Trophy size={28} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> {teams[matchWin].name} {bestOf}先取達成！</div>}</div>
<div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>{teamOrder.map(ti=>(<div key={ti} style={{textAlign:"center",padding:"12px 24px",borderRadius:16,background:ti===winner?C[ti].lt:"#fff",border:ti===winner?"3px solid "+C[ti].ac:"2px solid #e0e0e0"}}><div style={{fontSize:17,fontWeight:700,color:C[ti].tx}}>{teams[ti].name}</div><div style={{fontSize:44,fontWeight:900,color:C[ti].ac,lineHeight:1.1}}>{tw[ti]}</div><div style={{fontSize:13,fontWeight:800,color:"var(--text-secondary)"}}>勝</div></div>))}</div>
<button onClick={doSave} disabled={saving} style={{width:"100%",padding:"14px 0",border:"none",borderRadius:10,background:"var(--accent-green)",color:"var(--text-inverse)",fontSize:18,fontWeight:800,cursor:"pointer",marginBottom:10,opacity:saving?0.5:1}}>{saving?"保存中...":<><Camera size={18} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スコア表を画像保存</>}</button>
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid var(--border-input)"}}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}><ClipboardList size={18} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> スコア表</div>
{(()=>{const vw2=typeof window!=="undefined"?window.innerWidth:375;const isTab2=vw2>=768;const tc2=teamOrder.reduce((s2,i)=>s2+teams[i].players.filter(p=>p.active).length,0)+teamOrder.length+1;const rfs=isTab2?16:tc2>=14?8:tc2>=12?9:tc2>=10?10:tc2>=8?12:16;const rrw=isTab2?36:tc2>=12?22:tc2>=10?26:36;const rnh=rfs<=10?50:rfs<=12?70:90;return(<div style={{overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}><ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={false} fontSize={rfs} colW={0} roundW={rrw} nameH={rnh} forCapture={true} dqWinnerIdx={isDqWin?winner:null}/></div>);})()}
<div style={{marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:15}}><thead><tr style={{background:"var(--bg-secondary)",color:"var(--text-inverse)"}}><th style={{padding:"7px 8px",textAlign:"left"}}>チーム</th><th style={{padding:"7px"}}>最終</th><th style={{padding:"7px"}}>得点計</th><th style={{padding:"7px"}}>ミス</th><th style={{padding:"7px"}}>フォルト</th><th style={{padding:"7px"}}>ターン</th></tr></thead><tbody>{teamStats.map((ts,i)=>(<tr key={i} style={{background:ts.ti===winner?"#fffde6":"#fff",borderBottom:"1px solid var(--border-lighter)"}}><td style={{padding:"7px 8px",fontWeight:700,color:C[ts.ti].tx}}>{ts.ti===winner?<Trophy size={14} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/>:""}{ts.name}</td><td style={{padding:"7px",textAlign:"center",fontWeight:800,color:C[ts.ti].ac}}>{ts.final}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.totalPts}</td><td style={{padding:"7px",textAlign:"center",color:"var(--accent-orange)"}}>{ts.misses}</td><td style={{padding:"7px",textAlign:"center",color:"var(--text-danger)"}}>{ts.faults}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.turns}</td></tr>))}</tbody></table></div>
{comments.length>0&&<div style={{marginTop:10,borderTop:"1px solid var(--border-lighter)",paddingTop:8}}><div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}><MessageCircle size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> コメント</div>{comments.map((c2,i)=><div key={i} style={{padding:"5px 10px",background:"var(--bg-surface-dim)",borderRadius:6,marginBottom:3,fontSize:14,color:"#444"}}>{c2}</div>)}</div>}
</div>
<div style={{marginBottom:14}}><div style={{fontSize:17,fontWeight:800,color:"var(--text-primary)",marginBottom:5}}><MessageCircle size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> コメント追加</div><div style={{display:"flex",gap:6}}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="コメント..." onKeyDown={e=>{if(e.key==="Enter")addC();}} style={{flex:1,padding:"12px 14px",border:"1px solid var(--border-input)",borderRadius:10,fontSize:17,outline:"none"}}/><button onClick={addC} style={{padding:"12px 20px",border:"none",borderRadius:10,background:"var(--accent-blue)",color:"var(--text-inverse)",fontWeight:700,fontSize:16,cursor:"pointer",opacity:comment.trim()?1:0.3}}>追加</button></div></div>
{canContinue&&(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:16,marginBottom:12,border:"1px solid var(--border-input)"}}><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}>次ゲームの投げ順</div><OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder} shufAnim={shufAnim}/><button onClick={()=>onNext(ordVal,ordTeams)} style={{width:"100%",padding:"16px 0",border:"none",borderRadius:12,background:"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:19,fontWeight:700,cursor:"pointer",marginTop:6}}>次のゲーム開始</button></div>)}
{isAllDone&&(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #d0dff0"}}><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:5}}><RefreshCw size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> ゲーム継続・延長</div><OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder} shufAnim={shufAnim}/><div style={{display:"flex",gap:8,marginTop:6}}><button onClick={()=>onExtend("game",ordVal,ordTeams)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"var(--accent-blue)",color:"var(--text-inverse)",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1ゲーム追加</button>{isMatchOver&&<button onClick={()=>onExtend("set",ordVal,ordTeams)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"var(--accent-green)",color:"var(--text-inverse)",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1セット延長</button>}</div></div>)}
{hasCourtAllocation&&courtCount>=2&&(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:16,marginBottom:12,border:"2px solid rgba(43,125,233,0.3)"}}><div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>{"🔄"} 次の試合の組み換え</div><div style={{display:"flex",gap:8,marginBottom:8}}><button onClick={()=>onReshuffle("all")} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#22b566,#1a9d52)",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer"}}>{"🎲"} 全コート組み換え</button><button onClick={()=>onReshuffle("local")} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"linear-gradient(135deg,#2b7de9,#1a6dd4)",color:"#fff",fontSize:16,fontWeight:800,cursor:"pointer"}}>{"🔀"} コート内組み換え</button></div><button onClick={()=>onReshuffle("settings")} style={{width:"100%",padding:"10px 0",border:"2px solid rgba(255,255,255,0.25)",borderRadius:10,background:"transparent",color:"var(--text-secondary)",fontSize:13,fontWeight:700,cursor:"pointer"}}>{"⚙"} コート設定を変更して組み換え</button></div>)}
<button onClick={onBack} style={{width:"100%",padding:"16px 0",border:"2px solid var(--bg-secondary)",borderRadius:12,background:"transparent",color:"var(--text-primary)",fontSize:19,fontWeight:700,cursor:"pointer",marginBottom:24}}>設定に戻る</button>
</div>
{showStats===true&&<StatsModal onClose={()=>setShowStats(false)} currentGameRecords={currentGameRecords} source="game" isAdmin={isAdmin} aiEnabled={aiEnabled}/>}
{showStats==="delete"&&<StatsModal onClose={()=>setShowStats(false)} currentGameRecords={currentGameRecords} initialDelete={true} source="game" isAdmin={isAdmin} aiEnabled={aiEnabled}/>}
</div>
);
}

/* ═══ Game Screen — with timing ═══ */
function GameScreen({initialTeams,initialOrder,bestOf:iBo,numGames:iNg,dqEnd,goBack,saveToStatsProp,recoverData,isAdmin,aiEnabled,shufAnim,hasCourtAllocation,clearCourtAllocation,courtCount,courtAllocation,onUpdateCourtAllocation}){
const init=recoverData?{
teams:recoverData.teams.map(t=>({...t,players:t.players.map(p=>typeof p==="string"?{name:p,active:true}:p)})),
history:recoverData.history,currentOrderIdx:recoverData.currentOrderIdx,currentTurn:recoverData.currentTurn,
teamOrder:recoverData.teamOrder,eliminated:recoverData.eliminated,
winner:recoverData.winner!=null?recoverData.winner:null,gameNumber:recoverData.gameNumber||1,dqEndGame:recoverData.dqEndGame!==undefined?recoverData.dqEndGame:dqEnd,
autoEnd:!!recoverData.autoEnd,turnStartTime:Date.now(),plOffsets:recoverData.plOffsets||recoverData.teams.map(()=>0)
}:{teams:initialTeams.map(t=>({...t,players:t.players.map(n=>({name:n,active:true}))})),history:[],currentOrderIdx:0,currentTurn:1,teamOrder:initialOrder,eliminated:initialTeams.map(()=>false),winner:null,gameNumber:1,dqEndGame:dqEnd,autoEnd:false,turnStartTime:Date.now(),plOffsets:initialTeams.map(()=>0)};
const[st,dispatch]=useReducer(reducer,init);const{teams,history,currentOrderIdx,currentTurn,teamOrder,eliminated,winner,gameNumber,plOffsets,autoEnd,dqEndGame}=st;
const[showPl,setShowPl]=useState(false);const[showRes,setShowRes]=useState(()=>!!(recoverData&&recoverData.winner!=null));
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
/* Record timestamp when score is entered */
const prevHistLen=useRef(0);
useEffect(()=>{
if(history.length>prevHistLen.current){
const dur=(Date.now()-turnStartRef.current)/1000;
const hIdx=history.length-1;
setTimestamps(p=>[...p,{histIdx:hIdx,ts:Date.now(),dur}]);
turnStartRef.current=Date.now();
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
turnStartRef.current=Date.now();
}
prevHistLen.current=history.length;
},[history.length]);

/* Auto-save progress for crash recovery (includes result screen) */
useEffect(()=>{
try{
const snapshot={teams:teams.map(t=>({name:t.name,players:t.players.map(p=>({name:p.name,active:p.active}))})),history,teamOrder,currentOrderIdx,currentTurn,eliminated,gameNumber,plOffsets,dqEndGame:dqEnd,winner,autoEnd:!!autoEnd,gW:gW,numGames,bestOf,savedAt:Date.now()};
if(_db)idbSet(_db,"game-progress",snapshot).catch(e=>console.error("progress save error",e));
}catch(e){console.error("Progress save failed:",e);}
},[history,eliminated,currentTurn,winner,gW]);
/* iOS safety: also save on pagehide/visibilitychange (fires before app kill) */
useEffect(()=>{
const saveNow=()=>{try{
const snapshot={teams:teams.map(t=>({name:t.name,players:t.players.map(p=>({name:p.name,active:p.active}))})),history,teamOrder,currentOrderIdx,currentTurn,eliminated,gameNumber,plOffsets,dqEndGame:dqEnd,winner,autoEnd:!!autoEnd,gW:gW,numGames,bestOf,savedAt:Date.now()};
if(_db)idbSet(_db,"game-progress",snapshot).catch(e=>console.error("progress save error",e));
}catch(e){}};
const onVisChange=()=>{if(document.visibilityState==="hidden")saveNow();};
document.addEventListener("visibilitychange",onVisChange);
window.addEventListener("pagehide",saveNow);
return()=>{document.removeEventListener("visibilitychange",onVisChange);window.removeEventListener("pagehide",saveNow);};
},[history,eliminated,currentTurn,winner,teams,teamOrder,currentOrderIdx,gameNumber,plOffsets,gW,numGames,bestOf,autoEnd]);

useEffect(()=>{if(winner!==null&&!showRes){
setGW(p=>{const n=[...p];n[winner]++;return n;});setShowRes(true);
setAnimState(p=>({...p,confetti:true}));setTimeout(()=>setAnimState(p=>({...p,confetti:false})),3000);
const key=gameNumber+"-"+history.length;
if(!statsSavedRef.current[key]){
statsSavedRef.current[key]=true;
const d=new Date().toISOString();
/* Save replay for score table viewing */
saveReplay(d,teams,history,teamOrder,winner,autoEnd,dqEndGame);
/* Save stats */
if(saveToStatsProp){const favs=loadFavs();const records=buildGameRecord(teams,history,teamOrder,winner,timestamps,favs,d);saveGameStatsToDB(records);}
}
}},[winner]);

const execConf=()=>{if(!conf)return;if(conf.t==="score")dispatch({type:"SCORE",score:conf.s});else if(conf.t==="miss")dispatch({type:"MISS"});else dispatch({type:"FAULT"});setConf(null);};
const handleNext=(order,newTeams)=>{if(newTeams)dispatch({type:"SET_TEAMS",teams:newTeams});dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);turnStartRef.current=Date.now();};
const handleExtend=(type,order,newTeams)=>{if(type==="game")setNumGames(p=>p+1);else if(type==="set")setBestOf(p=>p+1);if(newTeams)dispatch({type:"SET_TEAMS",teams:newTeams});dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);turnStartRef.current=Date.now();};
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
</div>
<span style={{fontSize:isTablet?28:16,fontWeight:isTablet?900:700,color:"#fff",textAlign:"center",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{gameNumber}試合目 {currentTurn}ターン目{bestOf>0?" "+bestOf+"先取":""}</span>
<div style={{display:"flex",gap:2,flexShrink:0}}>
<div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:7,padding:2,gap:2}}>{[["both","両方"],["sheet","表"],["input","入力"]].map(([k,l])=>(<button key={k} onClick={()=>setView(k)} style={{padding:isTablet?"6px 12px":"4px 9px",border:"none",borderRadius:5,background:view===k?"rgba(255,255,255,0.2)":"transparent",color:view===k?"#fff":"rgba(255,255,255,0.4)",fontSize:isTablet?16:12,fontWeight:600,cursor:"pointer"}}>{l}</button>))}</div>
</div>
</div>
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
{showRes&&winner!==null&&<GameResult teams={teams} history={history} teamOrder={teamOrder} winner={winner} gameWins={gW} bestOf={bestOf} numGames={numGames} gameNumber={gameNumber} onNext={handleNext} onBack={handleBack} onExtend={handleExtend} onReshuffle={handleReshuffle} hasCourtAllocation={hasCourtAllocation} courtCount={courtCount} timestamps={timestamps} isAdmin={isAdmin} aiEnabled={aiEnabled} autoEnd={!!autoEnd} dqEndGame={!!dqEndGame} shufAnim={shufAnim}/>}
{animState.confetti&&<CSSConfetti/>}
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

export default function App(){
const[dbReady,setDbReady]=useState(_cache.ready);
useEffect(()=>{if(!_cache.ready)initDB().then(()=>{setDbReady(true);/* Auto-sync on load */if(getSyncCode())pullFromServer().catch(e=>console.error("auto-pull error",e));}).catch(()=>setDbReady(true));},[]);
const[scr,setScr]=useState("loading");
const[cfg,setCfg]=useState(null);const[saved,setSaved]=useState(null);const[recovery,setRecovery]=useState(null);
const[isAdmin,setIsAdmin]=useState(false);
const[aiEnabled,setAiEnabled]=useState(()=>getAIEnabled());
const handleAIToggle=(v)=>{setAiEnabled(v);setAIEnabledLS(v);};
const[shufAnim,setShufAnim]=useState(()=>getShufAnim());
const handleShufAnimToggle=(v)=>{setShufAnim(v);setShufAnimLS(v);};
const[courtAllocation,setCourtAllocation]=useState(null);
const[setupDraft,setSetupDraft]=useState(null);
const[autoReshuffleMode,setAutoReshuffleMode]=useState(null);
useEffect(()=>{if(!dbReady)return;(async()=>{try{if(_db){const ca=await idbGet(_db,"court-allocation");if(ca&&ca.courtData&&ca.courtCount>=2)setCourtAllocation(ca);const sd=await idbGet(_db,"setup-draft");if(sd&&sd.mems){const filled=sd.mems.filter(m=>m&&m.trim());if(filled.length>0)setSetupDraft(sd);}}const p=_db?await idbGet(_db,"game-progress"):null;if(p&&p.teams){setRecovery(p);setScr("recover");return;}const lp=JSON.parse(localStorage.getItem(PROGRESS_KEY));if(lp&&lp.teams){if(_db)await idbSet(_db,"game-progress",lp);try{localStorage.removeItem(PROGRESS_KEY);}catch(e2){}setRecovery(lp);setScr("recover");return;}}catch(e){console.error("progress check error",e);}setScr("setup");})();},[dbReady]);
const doRecover=()=>{if(!recovery)return;const r=recovery;const cc=courtAllocation?courtAllocation.courtCount:1;setCfg({t:r.teams,o:r.teamOrder,ng:r.numGames||1,bo:r.bestOf||0,dq:r.dqEndGame!==undefined?r.dqEndGame:true,sts:true,recover:r,courtCount:cc});setScr("game");};
const dismissRecover=()=>{if(_db)idbDel(_db,"game-progress").catch(e=>console.error("progress delete error",e));try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}setRecovery(null);setScr("setup");};
if(!dbReady||scr==="loading"||(scr==="recover"&&!recovery)){return(<div style={{width:"100%",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))"}}>
<div style={{textAlign:"center"}}><div style={{marginBottom:12}}><Target size={48} color="var(--text-inverse)"/></div><div style={{fontSize:20,fontWeight:700,color:"var(--text-inverse)"}}>データ読み込み中...</div></div>

  </div>);}
  if(scr==="recover"&&recovery){return(<div style={{width:"100%",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))",padding:20}}>
    <div style={{background:"var(--bg-surface)",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"var(--shadow-lg)"}}>
      <div style={{marginBottom:8}}>{recovery.winner!=null?<Trophy size={44} color="var(--text-success)"/>:<RefreshCw size={44} color="var(--accent-blue)"/>}</div>
      <div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",marginBottom:6}}>{recovery.winner!=null?"試合結果があります":"未完了の試合があります"}</div>
      <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:14}}>{recovery.winner!=null?"Game "+recovery.gameNumber+"の結果を表示しますか？":((recovery.history||[]).length>0?"Game "+recovery.gameNumber+"、"+recovery.currentTurn+"ターン目まで記録があります。\n続きから再開しますか？":"Game "+recovery.gameNumber+"を開始しています。\n続きから再開しますか？")}</div>
      <div style={{display:"flex",gap:10}}><button onClick={doRecover} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:18,fontWeight:700,cursor:"pointer"}}>{recovery.winner!=null?"表示する":"再開する"}</button><button onClick={dismissRecover} style={{flex:1,padding:"16px 0",border:"2px solid var(--bg-secondary)",borderRadius:12,background:"transparent",color:"var(--text-primary)",fontSize:18,fontWeight:700,cursor:"pointer"}}>破棄する</button></div>
    </div>
  </div>);}
  return(<div style={{width:"100%",height:"100dvh"}}>{(scr==="setup"||!cfg)?<SetupScreen savedTeams={saved} isAdmin={isAdmin} onAdminToggle={setIsAdmin} aiEnabled={aiEnabled} onAIToggle={handleAIToggle} shufAnim={shufAnim} onShufAnimToggle={handleShufAnimToggle} courtAllocation={courtAllocation} onClearCourtAllocation={()=>{setCourtAllocation(null);if(_db)idbDel(_db,"court-allocation").catch(e=>console.error(e));}} setupDraft={setupDraft} onClearSetupDraft={()=>{setSetupDraft(null);if(_db)idbDel(_db,"setup-draft").catch(e=>{});}} autoReshuffleMode={autoReshuffleMode} onClearAutoReshuffle={()=>setAutoReshuffleMode(null)} onStart={(t,o,ng,bo,dq,sts,cc,caData)=>{setSetupDraft(null);if(_db)idbDel(_db,"setup-draft").catch(e=>{});if(caData)setCourtAllocation(caData);setCfg({t,o,ng,bo,dq,sts,courtCount:cc||1});setScr("game");}}/>:<GameScreen initialTeams={cfg.t} initialOrder={cfg.o} bestOf={cfg.bo} numGames={cfg.ng} dqEnd={cfg.dq} saveToStatsProp={cfg.sts!==false} recoverData={cfg.recover||null} isAdmin={isAdmin} aiEnabled={aiEnabled} shufAnim={shufAnim} hasCourtAllocation={!!courtAllocation} clearCourtAllocation={()=>{setCourtAllocation(null);if(_db)idbDel(_db,"court-allocation").catch(e=>console.error(e));}} courtCount={cfg.courtCount||1} courtAllocation={courtAllocation} onUpdateCourtAllocation={(updatedData)=>{setCourtAllocation(updatedData);if(_db)idbSet(_db,"court-allocation",{...updatedData,savedAt:new Date().toISOString()}).catch(e=>console.error(e));}} goBack={(saveData,reshuffleType)=>{if(_db)idbDel(_db,"game-progress").catch(e=>console.error("progress delete error",e));try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}if(saveData)setSaved(saveData);if(reshuffleType)setAutoReshuffleMode(reshuffleType);setScr("setup");setCfg(null);if(_db)idbGet(_db,"court-allocation").then(data=>{if(data&&data.courtData&&data.courtCount>=2)setCourtAllocation(data);}).catch(e=>console.error(e));}}/>}</div>);
}
