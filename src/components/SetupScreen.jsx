import React, { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, BarChart3, RefreshCw, Settings, Target, Undo2 } from "lucide-react";

import { C, MASCOT_S, MAX_NAME, MAX_PL, MAX_TEAMS, MF, PEN, WIN, LOCATION_FIELD_TYPES, FIELD_TYPE_BADGE_COLORS, VENUE_TYPES, VENUE_TYPE_BADGE_COLORS } from "../constants.js";
import { _db, idbDel, idbSet, loadFavs, loadStats } from "../db.js";
import { getSyncCode } from "../sync.js";
import { getLocations } from "../locationSync.js";
import { shuf } from "../gameLogic.js";
import { CourtOverview, FavDropdown, MultiCourtShuffleManager, SettingsPage, ShuffleAnimation, SmartFavPicker } from "./common.jsx";

export function SetupScreen({onStart,savedTeams,isAdmin,onAdminToggle,aiEnabled,onAIToggle,shufAnim,onShufAnimToggle,courtAllocation,onClearCourtAllocation,setupDraft,onClearSetupDraft,autoReshuffleMode,onClearAutoReshuffle,favs,addF,rmF,editF,StatsModal}){

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
const[selectedLocation,setSelectedLocation]=useState(null);
const[locationList,setLocationList]=useState([]);
const setupSyncCode=getSyncCode();
useEffect(()=>{if(setupSyncCode){getLocations(setupSyncCode).then(l=>setLocationList(l||[])).catch(()=>{});}},[]); // eslint-disable-line react-hooks/exhaustive-deps
const[caDiscardStep,setCaDiscardStep]=useState(0);/* 0=none, 1=first confirm, 2=second confirm */
const[reshuffleSettingsMode,setReshuffleSettingsMode]=useState(false);
const[draftRestored,setDraftRestored]=useState(false);
const draftTimerRef=useRef(null);
const saveDraft=useCallback(()=>{if(draftTimerRef.current)clearTimeout(draftTimerRef.current);draftTimerRef.current=setTimeout(()=>{const filledMems=mems.filter(m=>m.trim());const filledTeams=teams.slice(0,tc).some(t=>t.players.some(p=>p.trim()));if(filledMems.length===0&&!filledTeams){if(_db)idbDel(_db,"setup-draft").catch(e=>{});return;}if(_db)idbSet(_db,"setup-draft",{mems,teams:teams.slice(0,tc),sp,courtCount,courtTeamCounts,mode,tc,savedAt:new Date().toISOString()}).catch(e=>console.error("setup-draft save error",e));},500);},[mems,teams,tc,sp,courtCount,courtTeamCounts,mode]);
useEffect(()=>{saveDraft();return()=>{if(draftTimerRef.current)clearTimeout(draftTimerRef.current);};},[mems,teams,tc,sp,courtCount,courtTeamCounts,mode]);
const[trimConfirm,setTrimConfirm]=useState(null);/* {filled,newMax,step,onConfirm} */
const showTrimConfirm=(filled,newMax,onConfirm)=>{if(filled<=newMax||filled===0){onConfirm();return;}setTrimConfirm({filled,newMax,step:1,onConfirm});};
const trimDialogExec=()=>{if(!trimConfirm)return;const{newMax,onConfirm}=trimConfirm;onConfirm();setMems(prev=>prev.slice(0,Math.max(newMax,2)));setSp(null);setAllCourtData(null);setTrimConfirm(null);};
const lpStart=(e)=>{if(e.target.tagName==="INPUT"||e.target.tagName==="BUTTON"||e.target.tagName==="SELECT")return;lpRef.current=setTimeout(()=>{setEditMode(true);setExpandedDel(null);},450);};
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
const go=()=>{let ft;if(mode==="manual"){ft=teams.slice(0,tc).map(t=>({...t,players:t.players.filter(p=>p.trim())}));if(!ft.every(t=>t.players.length>0))return;}else{if(!sp||!isSpValid())return;ft=sp;}const ord=Array.from({length:ft.length},(_,i)=>i);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,courtCount>=2&&allCourtData?{courtCount,courtTeamCounts,courtData:allCourtData}:null,selectedLocation);};
const fieldLabel=(v)=>(LOCATION_FIELD_TYPES.find(f=>f.value===v)||{}).label||v;
const venueLabel=(v)=>(VENUE_TYPES.find(t=>t.value===v)||{}).label||"屋根なし";
const LocationSelector=setupSyncCode?(<div style={{marginBottom:14}}>
<div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:2,marginBottom:6}}>場所</div>
<div style={{background:"rgba(255,255,255,0.96)",borderRadius:12,padding:10,maxHeight:200,overflow:"auto"}}>
<label style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",background:!selectedLocation?"rgba(43,125,233,0.08)":"transparent",marginBottom:2}}>
<input type="radio" name="loc" checked={!selectedLocation} onChange={()=>setSelectedLocation(null)} style={{accentColor:"var(--accent-blue)"}}/>
<span style={{fontSize:14,fontWeight:600,color:!selectedLocation?"var(--accent-blue)":"var(--text-secondary)"}}>場所を選択しない</span>
</label>
{locationList.length===0&&<div style={{fontSize:13,color:"var(--text-secondary)",padding:"8px 10px"}}>場所が登録されていません</div>}
{locationList.map(loc=>(<label key={loc.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,cursor:"pointer",background:selectedLocation&&selectedLocation.id===loc.id?"rgba(43,125,233,0.08)":"transparent",marginBottom:2}}>
<input type="radio" name="loc" checked={selectedLocation&&selectedLocation.id===loc.id} onChange={()=>setSelectedLocation(loc)} style={{accentColor:"var(--accent-blue)"}}/>
<span style={{flex:1}}>
<span style={{fontSize:14,fontWeight:600,color:"var(--text-primary)"}}>{loc.place_name} - {loc.sub_name}</span>
<span style={{display:"inline-block",marginLeft:6,padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700,color:"#fff",background:FIELD_TYPE_BADGE_COLORS[loc.field_type]||"#6b7280"}}>{fieldLabel(loc.field_type)}</span>
<span style={{display:"inline-block",marginLeft:4,padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:700,color:"#fff",background:VENUE_TYPE_BADGE_COLORS[loc.venue_type]||"#3498db"}}>{venueLabel(loc.venue_type)}</span>
</span>
</label>))}
</div>
</div>):null;
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
<div style={{padding:"36px 20px 8px",textAlign:"center",position:"relative"}}><button onClick={()=>window.location.reload()} style={{position:"absolute",top:40,left:20,width:42,height:42,border:"none",borderRadius:"50%",background:"linear-gradient(135deg,#8BC53F,#2E7D32)",cursor:"pointer",zIndex:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(0,0,0,0.18)",transition:"transform 0.1s",padding:0}} onPointerDown={e=>e.currentTarget.style.transform="scale(0.95)"} onPointerUp={e=>e.currentTarget.style.transform="scale(1)"} onPointerLeave={e=>e.currentTarget.style.transform="scale(1)"}><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 0 1 7.75 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M12 4a8 8 0 0 0-7.75 6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M4.25 10a8 8 0 0 0 7.75 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/><path d="M12 20a8 8 0 0 0 7.2-4.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none"/><polygon points="20.5,12 16.5,15 17,11" fill="#fff"/></svg></button><button onClick={()=>setShowSettings(true)} style={{position:"absolute",top:40,right:20,padding:"8px 14px",border:"1px solid rgba(255,255,255,0.25)",borderRadius:10,background:"rgba(255,255,255,0.08)",color:"var(--text-inverse)",fontSize:18,cursor:"pointer",zIndex:10}}><Settings size={18}/></button><img src={MASCOT_S} alt="モルック" style={{width:200,height:200,objectFit:"contain",display:"block",margin:"0 auto -6px"}}/><h1 style={{fontSize:38,fontWeight:900,color:"var(--text-inverse)",letterSpacing:4}}>モルック スコアラー</h1><div style={{fontSize:13,color:"rgba(255,255,255,0.3)",fontWeight:600,letterSpacing:5}}>MÖLKKY SCORER</div></div>
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
{LocationSelector}
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
{showSmartFav&&<SmartFavPicker favs={favs} stats={loadStats()} usedNames={used} maxMembers={maxShufForCourt} currentCount={used.length} minMembers={courtCount===1?tc:totalTeamsMulti} onAdd={({toAdd,toRemove})=>{setMems(prev=>{let updated=[...prev];if(toRemove&&toRemove.length>0){updated=updated.filter(m=>!toRemove.includes(m));}let ai=0;for(let i=0;i<updated.length&&ai<toAdd.length;i++){if(!updated[i].trim()){updated[i]=toAdd[ai++];}}while(ai<toAdd.length&&updated.length<maxShufForCourt){updated.push(toAdd[ai++]);}const filled=updated.filter(m=>m.trim()).length;const minReq=courtCount===1?tc:totalTeamsMulti;if(filled<minReq){window.alert("最低"+minReq+"人必要です");return prev;}return updated;});setSp(null);setAllCourtData(null);}} onClose={()=>setShowSmartFav(false)}/>}
{showSettings&&<SettingsPage onClose={()=>setShowSettings(false)} isAdmin={isAdmin} onAdminToggle={onAdminToggle} aiEnabled={aiEnabled} onAIToggle={onAIToggle} shufAnim={shufAnim} onShufAnimToggle={onShufAnimToggle} favs={favs}/>}
{shufAnimData&&<ShuffleAnimation names={shufAnimData.names} teams={shufAnimData.teams} onDone={()=>{if(shufAnimData.goData){const{ft,ord}=shufAnimData.goData;setShufAnimData(null);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,courtCount>=2&&allCourtData?{courtCount,courtTeamCounts,courtData:allCourtData}:null,selectedLocation);}else{setSp(shufAnimData.teams);setShufAnimData(null);}}} onStartGame={shufAnimData.goData?null:()=>{const ft=shufAnimData.teams;const ord=Array.from({length:ft.length},(_,i)=>i);setShufAnimData(null);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats,courtCount,null,selectedLocation);}} onReshuffle={shufAnimData.goData?null:()=>{setShufAnimData(null);setTimeout(()=>doShuf(),100);}}/>}
{multiCourtShufData&&<MultiCourtShuffleManager courtData={multiCourtShufData.courtData} courtCount={courtCount} courtOrder={multiCourtShufData.courtOrder} onAllDone={(data)=>{setMultiCourtShufData(null);setAllCourtData(data);setSp(data[1]);setShowCourtOverview(true);if(_db&&courtCount>=2)idbSet(_db,"court-allocation",{courtCount,courtTeamCounts,courtData:data,numGames,bestOf,dqEnd,saveToStats,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));}} onSkipAll={(data)=>{setMultiCourtShufData(null);setAllCourtData(data);setSp(data[1]);setShowCourtOverview(true);if(_db&&courtCount>=2)idbSet(_db,"court-allocation",{courtCount,courtTeamCounts,courtData:data,numGames,bestOf,dqEnd,saveToStats,savedAt:new Date().toISOString()}).then(()=>{if(_db)idbDel(_db,"setup-draft").catch(e=>{});}).catch(e=>console.error("court-allocation save error",e));}}/>}
{showCourtOverview&&allCourtData&&<CourtOverview courtData={allCourtData} courtCount={courtCount} courtTeamCounts={courtTeamCounts} numGames={numGames} bestOf={bestOf} dqEnd={dqEnd} saveToStats={saveToStats} onStartGame={(teams,order)=>{setShowCourtOverview(false);onStart(teams,order,numGames,bestOf,dqEnd,saveToStats,courtCount,{courtCount,courtTeamCounts,courtData:allCourtData},selectedLocation);}} onBack={()=>{setShowCourtOverview(false);if(allCourtData){const allNames=[];for(let c=1;c<=courtCount;c++){const teams=allCourtData[c]||[];teams.forEach(t=>t.players.forEach(p=>{const nm=typeof p==="string"?p:(typeof p==="object"?(p.name||""):String(p));if(nm.trim())allNames.push(nm);}));}if(allNames.length>0)setMems(allNames);}}}/>}
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
