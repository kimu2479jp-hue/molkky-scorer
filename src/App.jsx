import React, { useState, useReducer, useRef, useEffect, useCallback } from "react";

const MAX_TEAMS=4,MAX_PL=5,MAX_SHUF=20,MAX_NAME=7,WIN=50,RST=25,PEN=37,MF=3;
const C=[
  {bg:"#14365a",lt:"#e6f0fb",ac:"#2b7de9",tx:"#14365a",nm:"#c8dfff"},
  {bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30",nm:"#ffc8d6"},
  {bg:"#1a5c3a",lt:"#e6faf0",ac:"#22b566",tx:"#1a5c3a",nm:"#b8ffd8"},
  {bg:"#6b5a1d",lt:"#fbf5e6",ac:"#d9a83a",tx:"#6b5a1d",nm:"#ffe8a0"},
];
const PC=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c"];
const H1=30;
const BLINK_ID="mk-blink-style";
const MASCOT_S = "/molkky_mascot_transparent.png";
const MASCOT_R = "/molkky_mascot_transparent.png";
function ensureBlink(){if(document.getElementById(BLINK_ID))return;const s=document.createElement("style");s.id=BLINK_ID;s.textContent="@keyframes mk-blink{0%,100%{background:rgba(43,125,233,0.12)}50%{background:rgba(43,125,233,0.45)}}";document.head.appendChild(s);}
/* C: Prevent iOS context menu on buttons */
if(typeof document!=="undefined"){document.addEventListener("contextmenu",e=>{if(e.target&&!e.target.matches("input,textarea,a[href]"))e.preventDefault();},{passive:false});}

/* ═══ Favorites ═══ */
const LS_KEY="mk-fav";
const LS_FAV_BK="mk-fav-bk";
function loadFavs(){
  try{
    let f=JSON.parse(localStorage.getItem(LS_KEY));
    if(f&&f.length>0)return f;
    /* Backup 1: secondary key */
    f=JSON.parse(localStorage.getItem(LS_FAV_BK));
    if(f&&f.length>0){localStorage.setItem(LS_KEY,JSON.stringify(f));return f;}
    /* Backup 2: reconstruct from stats keys */
    const stats=JSON.parse(localStorage.getItem("mk-player-stats"));
    if(stats){const names=Object.keys(stats);if(names.length>0){localStorage.setItem(LS_KEY,JSON.stringify(names));localStorage.setItem(LS_FAV_BK,JSON.stringify(names));return names;}}
    return[];
  }catch(e){return[];}
}
function saveFavs(l){try{localStorage.setItem(LS_KEY,JSON.stringify(l));localStorage.setItem(LS_FAV_BK,JSON.stringify(l));}catch(e){}}
const MAX_FAV=99;
function useFavs(){const[f,sF]=useState(()=>loadFavs());return{favs:f,addF:n=>{const x=n.trim().slice(0,MAX_NAME);if(x&&!f.includes(x)&&f.length<MAX_FAV){const u=[...f,x];sF(u);saveFavs(u);}},rmF:n=>{const u=f.filter(v=>v!==n);sF(u);saveFavs(u);}};}

/* ═══ Stats Storage ═══ */
const STATS_KEY="mk-player-stats";
const PROGRESS_KEY="mk-game-progress";
function loadStats(){try{return JSON.parse(localStorage.getItem(STATS_KEY))||{};}catch(e){return{};}}
function saveStats(d){try{localStorage.setItem(STATS_KEY,JSON.stringify(d));}catch(e){}}
function deleteStatsByPeriod(period){
  if(period==="all"){localStorage.removeItem(STATS_KEY);return;}
  const stats=loadStats();const now=new Date();let start;
  if(period==="day"){start=new Date(now);start.setHours(0,0,0,0);}
  else if(period==="week"){start=new Date(now);const dow=start.getDay();start.setDate(start.getDate()-(dow===0?6:dow-1));start.setHours(0,0,0,0);}
  else if(period==="month"){start=new Date(now.getFullYear(),now.getMonth(),1);}
  else if(period==="year"){start=new Date(now.getFullYear(),0,1);}
  for(const nm in stats){stats[nm]=stats[nm].filter(g=>new Date(g.d)<start);if(!stats[nm].length)delete stats[nm];}
  saveStats(stats);
}

function calcOjama(history,playerName,playerTeamIdx){
  let success=0,attempts=0;
  const pTurns=history.filter(h=>h.playerName===playerName&&h.teamIndex===playerTeamIdx);
  for(const pt of pTurns){
    if(pt.type!=="score"||pt.score<1||pt.score>12)continue;
    const needed=pt.score;
    const otherTeams=[...new Set(history.map(h=>h.teamIndex))].filter(ti=>ti!==playerTeamIdx);
    for(const oti of otherTeams){
      const prevH=history.filter(x=>x.teamIndex===oti&&history.indexOf(x)<history.indexOf(pt));
      const otherScoreBefore=prevH.length?prevH[prevH.length-1].runningTotal:0;
      if(otherScoreBefore>=38&&(WIN-otherScoreBefore)===needed){
        const idx=history.indexOf(pt);
        const nxt=history.find((h,i)=>i>idx&&h.teamIndex===oti);
        if(nxt){
          attempts++;
          if(nxt.type==="score"&&nxt.runningTotal===WIN){/* opponent finished → failure */}
          else{success++;}
        }
      }
    }
  }
  return{success,attempts};
}

/* Build per-game stats record from history.
   timestamps = array of {teamIndex,playerIndex,ts} for throw timing
   teamOrder[0] = first thrower team for break definition */
function buildGameRecord(teams,history,teamOrder,winner,timestamps,favs){
  const records=[];const d=new Date().toISOString();
  const gameStart=timestamps.length>0?timestamps[0].ts:null;
  const gameEnd=timestamps.length>0?timestamps[timestamps.length-1].ts:null;
  /* Determine finish type */
  const finishType=(()=>{
    if(winner===null)return"unknown";
    const ws=scoreOf(history,winner);
    if(ws===WIN)return"50finish";
    return"dq";
  })();
  teams.forEach((t,ti)=>{t.players.forEach(p=>{
    const nm=typeof p==="object"?p.name:p;
    if(!favs.includes(nm))return;
    const turns=history.filter(h=>h.playerName===nm&&h.teamIndex===ti);
    if(!turns.length)return;
    const scores=turns.filter(h=>h.type==="score");
    const misses=turns.filter(h=>h.type==="miss").length;
    const faults=turns.filter(h=>h.type==="fault").length;
    const totalPts=scores.reduce((s2,h)=>s2+h.score,0);
    const highScores=scores.filter(h=>h.score>=10&&h.score<=12).length;
    const scoreValues=scores.map(h=>h.score);
    let finA=0,finS=0;
    turns.forEach(h=>{if(h.prevScore>=38){finA++;if(h.type==="score"&&h.runningTotal===WIN)finS++;}});
    const rec=[];let consF=0;
    turns.forEach(h=>{if(h.type==="miss"||h.type==="fault"){consF++;}else{if(consF>=2)rec.push(h.score);consF=0;}});
    let breakScore=null;
    const firstTeam=teamOrder[0];
    if(ti===firstTeam){const t1=turns.find(h=>h.turn===1);if(t1&&t1.type==="score")breakScore=t1.score;}
    const ojama=calcOjama(history,nm,ti);
    const won=winner===ti;
    const times=[];
    turns.forEach(h=>{
      const hIdx=history.indexOf(h);
      const tsEntry=timestamps.find(ts=>ts.histIdx===hIdx);
      if(tsEntry&&tsEntry.dur!=null)times.push(tsEntry.dur);
    });
    const tMin=times.length>0?Math.min(...times):null;
    const tMax=times.length>0?Math.max(...times):null;
    const tAvg=times.length>0?times.reduce((a,b)=>a+b,0)/times.length:null;
    /* winner name for display */
    const winnerName=winner!==null?teams[winner].players.map(p2=>typeof p2==="object"?p2.name:p2).find((_,pi)=>{const wturns=history.filter(h=>h.teamIndex===winner);const last=wturns[wturns.length-1];return last&&last.playerIndex===pi;})||"":null;
    records.push({nm,data:{d,de:gameEnd,t:turns.length,s:totalPts,m:misses,f:faults,w:won?1:0,o:ojama.success,oa:ojama.attempts,fa:finA,fs:finS,hs:highScores,rc:rec,br:breakScore,tMin,tMax,tAvg,ft:finishType,sv:scoreValues}});
  });});
  return records;
}

function saveGameStatsToDB(records){
  const stats=loadStats();
  records.forEach(({nm,data})=>{if(!stats[nm])stats[nm]=[];stats[nm].push(data);});
  saveStats(stats);
}

/* ═══ Period helpers ═══ */
function getMondayOfWeek(d){const dt=new Date(d);const dow=dt.getDay();dt.setDate(dt.getDate()-(dow===0?6:dow-1));dt.setHours(0,0,0,0);return dt;}
function fmtMD(d){return(d.getMonth()+1)+"/"+d.getDate();}
function fmtHM(d){return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0");}

function getAvailableSessions(stats,names){
  const all=[];names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{all.push(g.d);});});
  const dates=[...new Set(all.map(d=>d.slice(0,10)))].sort().reverse();
  const sessions=[];
  dates.forEach(dateStr=>{
    const dayGames=all.filter(d=>d.startsWith(dateStr)).sort();
    if(dayGames.length>0){
      const s=new Date(dayGames[0]);const e=new Date(dayGames[dayGames.length-1]);
      sessions.push({date:dateStr,label:fmtHM(s)+"〜"+fmtHM(e),start:s,end:e});
    }
  });
  return sessions;
}

function getAvailableWeeks(stats,names){
  const all=[];names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{all.push(new Date(g.d));});});
  const weeks=new Map();
  all.forEach(d=>{const mon=getMondayOfWeek(d);const key=mon.toISOString().slice(0,10);if(!weeks.has(key))weeks.set(key,mon);});
  return[...weeks.values()].sort((a,b)=>b-a);
}

function getAvailableMonths(stats,names){
  const all=[];names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{all.push(g.d);});});
  const months=new Set(all.map(d=>d.slice(0,7)));
  return[...months].sort().reverse();
}

function filterGames(games,period,subSel){
  if(period==="all")return games;
  const now=new Date();
  if(period==="day"){
    if(subSel){return games.filter(g=>{const d=new Date(g.d);return d>=subSel.start&&d<=new Date(subSel.end.getTime()+60000);});}
    const start=new Date(now);start.setHours(0,0,0,0);return games.filter(g=>new Date(g.d)>=start);
  }
  if(period==="week"){
    const mon=subSel||getMondayOfWeek(now);const sun=new Date(mon);sun.setDate(sun.getDate()+7);
    return games.filter(g=>{const d=new Date(g.d);return d>=mon&&d<sun;});
  }
  if(period==="month"){
    const ym=subSel||now.getFullYear()+"/"+(now.getMonth()+1);
    const[y,m]=ym.split("/").map(Number);const start=new Date(y,m-1,1);const end=new Date(y,m,1);
    return games.filter(g=>{const d=new Date(g.d);return d>=start&&d<end;});
  }
  if(period==="year"){const start=new Date(now.getFullYear(),0,1);return games.filter(g=>new Date(g.d)>=start);}
  return games;
}

function calcMetrics(games){
  if(!games.length)return null;
  const tot={t:0,s:0,m:0,f:0,w:0,o:0,oa:0,fa:0,fs:0,hs:0,rc:[],br:[],tMin:[],tMax:[],tAvg:[],sv:[]};
  games.forEach(g=>{tot.t+=g.t;tot.s+=g.s;tot.m+=g.m;tot.f+=g.f;tot.w+=g.w;tot.o+=g.o;tot.oa+=(g.oa||0);tot.fa+=g.fa;tot.fs+=g.fs;tot.hs+=g.hs;if(g.rc)tot.rc.push(...g.rc);if(g.br!=null)tot.br.push(g.br);if(g.tMin!=null)tot.tMin.push(g.tMin);if(g.tMax!=null)tot.tMax.push(g.tMax);if(g.tAvg!=null)tot.tAvg.push(g.tAvg);if(g.sv)tot.sv.push(...g.sv);});
  const missRate=tot.t>0?tot.m/tot.t:0;
  const finishRate=tot.fa>0?tot.fs/tot.fa:0;
  const avgPts=tot.t>0?tot.s/tot.t:0;
  const recAvg=tot.rc.length>0?tot.rc.reduce((a,b)=>a+b,0)/tot.rc.length:0;
  const highRate=tot.t>0?tot.hs/tot.t:0;
  const breakAvg=tot.br.length>0?tot.br.reduce((a,b)=>a+b,0)/tot.br.length:0;
  const ojamaRate=tot.oa>0?tot.o/tot.oa:0;
  const throwMin=tot.tMin.length>0?Math.min(...tot.tMin):null;
  const throwMax=tot.tMax.length>0?Math.max(...tot.tMax):null;
  const throwAvg=tot.tAvg.length>0?tot.tAvg.reduce((a,b)=>a+b,0)/tot.tAvg.length:null;
  return{
    missRate,finishRate,avgPts,recAvg,highRate,breakAvg,ojamaRate,throwMin,throwMax,throwAvg,
    missCount:tot.m,turnCount:tot.t,ojamaCount:tot.o,ojamaAttempts:tot.oa,winCount:tot.w,gameCount:games.length,
    scoreValues:tot.sv,
    r:[(1-missRate)*100,finishRate*100,(avgPts/12)*100,(recAvg/12)*100,ojamaRate*100,(breakAvg/12)*100]
  };
}

/* ═══ Game-level helpers ═══ */
function getAvailableGames(stats,names){
  const gameMap=new Map();
  names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{
    const key=g.d;
    if(!gameMap.has(key)){gameMap.set(key,{d:g.d,de:g.de,players:[],records:[],ft:g.ft||"unknown",winnerMembers:[]});}
    const gm=gameMap.get(key);
    if(!gm.players.includes(nm))gm.players.push(nm);
    gm.records.push({nm,data:g});
    if(g.w===1){
      if(!gm.winnerName)gm.winnerName=nm;
      if(!gm.winnerMembers.includes(nm))gm.winnerMembers.push(nm);
    }
    if(g.ft&&g.ft!=="unknown")gm.ft=g.ft;
  });});
  return[...gameMap.values()].sort((a,b)=>new Date(b.d)-new Date(a.d));
}
function getGameDates(stats,names){
  const dates=new Set();
  names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{dates.add(g.d.slice(0,10));});});
  return dates;
}
function filterGamesByDates(games,startDate,endDate){
  const s=new Date(startDate);s.setHours(0,0,0,0);
  const e=new Date(endDate);e.setHours(23,59,59,999);
  return games.filter(g=>{const d=new Date(g.d);return d>=s&&d<=e;});
}
function filterGamesByKeys(games,selectedKeys){
  return games.filter(g=>selectedKeys.has(g.d));
}
function getGamesForNames(stats,names,selectedKeys){
  const result={};
  names.forEach(nm=>{
    const all=stats[nm]||[];
    result[nm]=selectedKeys?all.filter(g=>selectedKeys.has(g.d)):all;
  });
  return result;
}

/* ═══ Helpers ═══ */
const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const arrEq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const scoreOf=(h,t)=>{for(let i=h.length-1;i>=0;i--)if(h[i].teamIndex===t)return h[i].runningTotal;return 0;};
const failsOf=(h,t)=>{let c=0;for(let i=h.length-1;i>=0;i--){if(h[i].teamIndex===t){if(h[i].type==="miss"||h[i].type==="fault")c++;else break;}}return c;};
const getFA=(hist,tIdx,turn)=>{let c=0;const th=hist.filter(h=>h.teamIndex===tIdx&&h.turn<=turn);for(let i=th.length-1;i>=0;i--){if(th[i].type==="miss"||th[i].type==="fault")c++;else break;}return c;};
function smartShuf(arr,prev,n){n=n||20;if(arr.length<=1)return[...arr];for(let i=0;i<n;i++){const s=shuf(arr);if(!prev||!arrEq(s,prev))return s;}return shuf(arr);}

/* ═══ Reducer (with timestamp support + player rotation offset) ═══ */
function adv(s){let oi=(s.currentOrderIdx+1)%s.teamOrder.length,t=s.currentTurn;if(oi===0)t++;let x=0;while(s.eliminated[s.teamOrder[oi]]&&x<s.teamOrder.length){oi=(oi+1)%s.teamOrder.length;if(oi===0)t++;x++;}const alive=s.teamOrder.filter(ti=>!s.eliminated[ti]);if(alive.length<=1)return{...s,currentOrderIdx:oi,currentTurn:t,winner:alive.length===1?alive[0]:null,autoEnd:true};return{...s,currentOrderIdx:oi,currentTurn:t};}
function getPI(teams,history,ti,plOffsets){
  const ap=teams[ti].players.filter(p=>p.active);
  const td=history.filter(h=>h.teamIndex===ti).length;
  const off=(plOffsets&&plOffsets[ti])||0;
  const pi=ap.length>0?((td+off)%ap.length+ap.length)%ap.length:0;
  return{ap,pi};
}
function reducer(s,a){
  const ti=s.teamOrder[s.currentOrderIdx];
  const gPI=()=>getPI(s.teams,s.history,ti,s.plOffsets);
  switch(a.type){
    case "SCORE":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);let ns=pv+a.score,r25=false;if(ns>WIN){ns=RST;r25=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"score",score:a.score,runningTotal:ns,prevScore:pv,reset25:r25,faultReset:false};const nh=[...s.history,e];if(ns===WIN)return{...s,history:nh,winner:ti,turnStartTime:Date.now()};return adv({...s,history:nh,turnStartTime:Date.now()});}
    case "MISS":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv;let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"miss",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:false,consecutiveFails:cf};const ns2={...s,history:[...s.history,e],eliminated:ne,turnStartTime:Date.now()};if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}return adv(ns2);}
    case "FAULT":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv,fr=false;if(pv>=PEN){rt=RST;fr=true;}let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"fault",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:fr,consecutiveFails:cf};const ns2={...s,history:[...s.history,e],eliminated:ne,turnStartTime:Date.now()};if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}return adv(ns2);}
    case "UNDO":{if(!s.history.length)return s;const last=s.history[s.history.length-1];const nh=s.history.slice(0,-1);const ne=[...s.eliminated];if(s.eliminated[last.teamIndex])ne[last.teamIndex]=false;const oi=s.teamOrder.indexOf(last.teamIndex);return{...s,history:nh,currentOrderIdx:oi>=0?oi:0,currentTurn:last.turn,eliminated:ne,winner:null,autoEnd:false,turnStartTime:Date.now()};}
    case "SET_TEAMS":{
      /* Adjust plOffsets: find who threw LAST and make next = person after them in new roster */
      const newOff=[...(s.plOffsets||s.teams.map(()=>0))];
      for(let i=0;i<s.teams.length;i++){
        const oldAp=s.teams[i].players.filter(p=>p.active);
        const newAp=a.teams[i]?a.teams[i].players.filter(p=>p.active):[];
        if(oldAp.length===newAp.length||newAp.length===0)continue;
        const td=s.history.filter(h=>h.teamIndex===i).length;
        if(td===0){newOff[i]=0;continue;}
        /* Find who threw last for this team */
        let lastEntry=null;
        for(let j=s.history.length-1;j>=0;j--){if(s.history[j].teamIndex===i){lastEntry=s.history[j];break;}}
        if(!lastEntry){newOff[i]=0;continue;}
        const lastName=lastEntry.playerName;
        const lastIdx=newAp.findIndex(p=>p.name===lastName);
        let nextPI;
        if(lastIdx>=0){
          /* Last thrower is in new roster → next is person after them */
          nextPI=(lastIdx+1)%newAp.length;
        }else{
          /* Last thrower was removed → keep current position clamped */
          const oldOff=newOff[i]||0;
          const oldPI=oldAp.length>0?((td+oldOff)%oldAp.length+oldAp.length)%oldAp.length:0;
          nextPI=oldPI<newAp.length?oldPI:0;
        }
        /* Set offset so (td+off)%newLen = nextPI */
        const raw=((td%newAp.length)+newAp.length)%newAp.length;
        newOff[i]=((nextPI-raw)%newAp.length+newAp.length)%newAp.length;
      }
      return{...s,teams:a.teams,plOffsets:newOff};
    }
    case "RESET_GAME":return{...s,history:[],currentOrderIdx:0,currentTurn:1,eliminated:s.teams.map(()=>false),winner:null,autoEnd:false,teamOrder:a.teamOrder||s.teamOrder,gameNumber:(s.gameNumber||1)+1,turnStartTime:Date.now(),plOffsets:s.teams.map(()=>0)};
    default:return s;
  }
}

function Confirm({msg,sub,okLabel,cancelLabel,thirdLabel,onOk,onCancel,onThird}){
  return(<div style={SS.ov}><div style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 10px 36px rgba(0,0,0,0.25)"}}>
    <div style={{fontSize:44,marginBottom:8}}>⚠️</div>
    <div style={{fontSize:22,fontWeight:800,color:"#14365a",marginBottom:6,whiteSpace:"pre-line"}}>{msg}</div>
    {sub&&<div style={{fontSize:16,color:"#888",marginBottom:14,whiteSpace:"pre-line"}}>{sub}</div>}
    <div style={{display:"flex",gap:10,flexDirection:"column"}}><div style={{display:"flex",gap:10}}>
      <button onClick={onOk} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"#14365a",color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer"}}>{okLabel||"確定"}</button>
      <button onClick={onCancel} style={{flex:1,padding:"16px 0",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:18,fontWeight:700,cursor:"pointer"}}>{cancelLabel||"キャンセル"}</button>
    </div>{onThird&&<button onClick={onThird} style={{padding:"14px 0",border:"2px solid #ccc",borderRadius:12,background:"transparent",color:"#888",fontSize:16,fontWeight:600,cursor:"pointer"}}>{thirdLabel||"戻る"}</button>}</div>
  </div></div>);
}

function FavDropdown({favs,addF,rmF,onPick,usedNames}){
  const[open,setOpen]=useState(false);const[newN,setNewN]=useState("");const[delTarget,setDelTarget]=useState(null);
  const[dropPos,setDropPos]=useState({top:0,right:0,maxHeight:300});
  const longRef=useRef(null);const wrapRef=useRef(null);const dropRef=useRef(null);
  const available=favs.filter(f=>!(usedNames||[]).includes(f));
  useEffect(()=>{if(!open)return;const h=e=>{if(wrapRef.current&&wrapRef.current.contains(e.target))return;if(dropRef.current&&dropRef.current.contains(e.target))return;setOpen(false);};document.addEventListener("pointerdown",h);return()=>document.removeEventListener("pointerdown",h);},[open]);
  useEffect(()=>{if(!open||!wrapRef.current)return;const rect=wrapRef.current.getBoundingClientRect();const spBelow=window.innerHeight-rect.bottom-12;const spAbove=rect.top-12;const useBelow=spBelow>=200||spBelow>=spAbove;const mH=Math.min(useBelow?spBelow:spAbove,420);const r=window.innerWidth-rect.right;if(useBelow){setDropPos({top:rect.bottom+4,right:Math.max(r,8),maxHeight:mH});}else{setDropPos({bottom:window.innerHeight-rect.top+4,right:Math.max(r,8),maxHeight:mH});}},[open]);
  const startLP=name=>{longRef.current=setTimeout(()=>setDelTarget(name),600);};const cancelLP=()=>{if(longRef.current)clearTimeout(longRef.current);};
  return(<div ref={wrapRef} style={{position:"relative",display:"inline-block"}}>
    <button onClick={()=>{setOpen(!open);setDelTarget(null);}} style={{width:40,height:40,border:"1px solid #d0dff0",borderRadius:8,background:open?"#2b7de9":"#f0f6ff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:open?"#fff":"#d9a83a"}}>⭐</button>
    {open&&(<div ref={dropRef} style={{position:"fixed",...dropPos,background:"#fff",border:"1px solid #ccc",borderRadius:12,boxShadow:"0 6px 20px rgba(0,0,0,0.18)",zIndex:9999,minWidth:220,maxWidth:300,padding:10,display:"flex",flexDirection:"column"}}>
      {available.length===0&&<div style={{padding:12,textAlign:"center",color:"#aaa",fontSize:16}}>{favs.length===0?"登録なし":"全員配置済み"}</div>}
      <div style={{flex:1,minHeight:0,overflow:"auto",WebkitOverflowScrolling:"touch"}}>{available.map(f=>(<div key={f}><button onPointerDown={()=>startLP(f)} onPointerUp={cancelLP} onPointerLeave={cancelLP} onClick={()=>{if(delTarget===f)setDelTarget(null);else{onPick(f);setOpen(false);}}} style={{width:"100%",padding:"12px 16px",border:"none",borderBottom:"1px solid #f0f0f0",background:delTarget===f?"#fde8e8":"transparent",fontSize:18,fontWeight:600,color:"#14365a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span>{f}</span>{delTarget===f&&<span onClick={e=>{e.stopPropagation();rmF(f);setDelTarget(null);}} style={{padding:"5px 12px",background:"#e74c3c",color:"#fff",borderRadius:6,fontSize:13,fontWeight:700}}>削除</span>}</button></div>))}</div>
      <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4,flexShrink:0}}><div style={{display:"flex",gap:6}}>
        <input value={newN} onChange={e=>setNewN(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder={"新規("+MAX_NAME+"文字)"} style={{flex:1,padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:16,outline:"none"}}/>
        <button onClick={()=>{if(newN.trim()&&favs.length<MAX_FAV){addF(newN.trim());setNewN("");}}} style={{padding:"10px 16px",border:"none",borderRadius:8,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",opacity:newN.trim()?1:0.3}}>登録</button>
      </div>{favs.length>=MAX_FAV&&<div style={{fontSize:12,color:"#c0392b",marginTop:4,textAlign:"center"}}>登録上限({MAX_FAV}人)に達しています</div>}</div>
    </div>)}
  </div>);
}

const VT={writingMode:"vertical-rl",WebkitWritingMode:"vertical-rl",textOrientation:"upright",WebkitTextOrientation:"upright",letterSpacing:"-1px",lineHeight:1,margin:"0 auto",whiteSpace:"nowrap",overflow:"hidden",display:"inline-block"};

function ScoreTable({teams,history,teamOrder,highlightLast,fontSize,colW,roundW,nameH,activeCell,forCapture}){
  const fs=fontSize||18;const cw=colW||60;const rw=roundW||44;const nh=nameH||100;
  const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
  const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
  const totalCols=1+ordered.reduce((s,o)=>s+o.ap.length+1,0);
  const showRows=activeCell&&activeCell.turn>maxT?activeCell.turn:maxT;
  useEffect(()=>{ensureBlink();},[]);
  return(<table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",borderSpacing:0}}>
    <colgroup><col style={{width:rw}}/>{ordered.map(o=><React.Fragment key={o.idx}>{o.ap.map((_,pi)=><col key={pi} style={{width:cw}}/>)}<col style={{width:cw}}/></React.Fragment>)}</colgroup>
    <thead><tr style={{height:H1}}>
      <th style={{background:"#14365a",color:"#fff",fontWeight:700,fontSize:fs*0.8,textAlign:"center",position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none"}}>R</th>
      {ordered.map(o=>(<th key={o.idx} colSpan={o.ap.length+1} style={{background:C[o.idx].bg,color:"#fff",fontWeight:700,fontSize:fs*0.75,textAlign:"center",borderLeft:"3px solid "+C[o.idx].ac,position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none",whiteSpace:"nowrap",overflow:"hidden"}}>{o.team.name}</th>))}
    </tr><tr>
      <th style={{background:"#1e4a72",position:forCapture?"static":"sticky",top:H1,zIndex:7,padding:0,borderTop:"none",borderBottom:"2px solid #0d2a48"}}/>
      {ordered.map(o=><React.Fragment key={o.idx}>
        {o.ap.map((p,pi)=>(<th key={pi} style={{background:"linear-gradient(180deg,"+C[o.idx].bg+",#1e4a72)",color:C[o.idx].nm,fontWeight:800,fontSize:fs*0.78,textAlign:"center",verticalAlign:"top",borderLeft:pi===0?"3px solid "+C[o.idx].ac:"1px solid rgba(255,255,255,0.15)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:"5px 2px",letterSpacing:1,textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:800}}>{p.name.slice(0,MAX_NAME)}</span></th>))}
        <th style={{background:"#0d2a48",color:"#ffd700",fontWeight:900,textAlign:"center",verticalAlign:"top",borderLeft:"1px solid rgba(255,255,255,0.2)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:"5px 2px",textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:900}}>計</span></th>
      </React.Fragment>)}
    </tr></thead>
    <tbody>{showRows===0?(<tr><td colSpan={totalCols} style={{color:"#bbb",padding:24,fontSize:fs*0.8,textAlign:"center",borderBottom:"1px solid #eee"}}>スコアを入力してください</td></tr>):(
      Array.from({length:showRows},(_,i)=>i+1).map(turn=>{
        const isLast=highlightLast&&turn===maxT;
        return(<tr key={turn} style={isLast?{background:"#fffde6"}:{}}>
          <td style={{padding:"5px 3px",textAlign:"center",borderBottom:"1px solid #ddd",fontWeight:800,color:"#666",fontSize:fs*0.85}}>{turn}</td>
          {ordered.map(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);const cf=e?getFA(history,o.idx,turn):0;
            return(<React.Fragment key={o.idx}>{o.ap.map((p,pi)=>{
              const isP=e&&e.playerIndex===pi;const isAct=activeCell&&activeCell.turn===turn&&activeCell.teamIndex===o.idx&&activeCell.playerIndex===pi&&!e;
              let txt="",clr="#333",bg="transparent",fw=400;
              if(isP){if((e.type==="miss"||e.type==="fault")&&cf===1)bg="#fff9db";if((e.type==="miss"||e.type==="fault")&&cf>=2)bg="#ffe0e0";if(e.type==="miss"){txt="−";clr="#bf6900";fw=800;}else if(e.type==="fault"&&e.faultReset){txt="F↓";clr="#c0392b";fw=800;}else if(e.type==="fault"){txt="F";clr="#c0392b";fw=800;}else if(e.reset25){txt=e.score+"↓";clr="#d93a5e";fw=800;}else{txt=e.score;clr=C[o.idx].tx;fw=700;}if(e.consecutiveFails>=MF)txt+="✕";}
              const cs={padding:"5px 3px",textAlign:"center",borderBottom:"1px solid #ddd",color:clr,fontWeight:fw,background:bg,borderLeft:pi===0?"3px solid "+C[o.idx].ac+"33":"1px solid #eee",fontSize:fs};
              if(isAct)cs.animation="mk-blink 1s ease-in-out infinite";
              return <td key={pi} style={cs}>{txt}</td>;
            })}<td style={{padding:"5px 3px",textAlign:"center",borderBottom:"1px solid #ddd",fontWeight:900,color:C[o.idx].tx,background:e?"#f0f3f8":"transparent",borderLeft:"2px solid #d0d0d0",fontSize:fs}}>{e?e.runningTotal:""}</td></React.Fragment>);
          })}
        </tr>);
      })
    )}</tbody>
  </table>);
}

function GameSheet({teams,history,currentTurn,teamOrder,activeCell}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)setTimeout(()=>{ref.current.scrollTop=ref.current.scrollHeight;},50);},[history.length,currentTurn]);
  return(<div ref={ref} style={{height:"100%",overflow:"auto",WebkitOverflowScrolling:"touch"}}><ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={true} fontSize={20} colW={0} roundW={48} nameH={110} activeCell={activeCell}/></div>);
}

/* ═══ Setup — 1.5x bigger + stats toggle ═══ */
function SetupScreen({onStart,savedTeams}){
  const{favs,addF,rmF}=useFavs();
  const[mode,setMode]=useState("manual");const[tc,setTc]=useState(savedTeams?savedTeams.length:2);
  const[om,setOm]=useState("normal");const[numGames,setNumGames]=useState(1);const[bestOf,setBestOf]=useState(0);const[dqEnd,setDqEnd]=useState(true);
  const[saveToStats,setSaveToStats]=useState(true);
  const[teams,setTeams]=useState(()=>{if(savedTeams){const base=savedTeams.map(t=>({name:t.name,players:t.players.length>0?t.players:[""]}));while(base.length<MAX_TEAMS)base.push({name:"チーム"+(base.length+1),players:[""]});return base.slice(0,MAX_TEAMS);}return Array.from({length:MAX_TEAMS},(_,i)=>({name:"チーム"+(i+1),players:[""]}));});
  const[mems,setMems]=useState(Array(4).fill(""));const[sp,setSp]=useState(null);const[showSetupStats,setShowSetupStats]=useState(false);
  const uN=(i,v)=>setTeams(p=>p.map((t,j)=>j===i?{...t,name:v}:t));
  const uP=(ti,pi,v)=>setTeams(p=>p.map((t,i)=>i===ti?{...t,players:t.players.map((pl,j)=>j===pi?v.slice(0,MAX_NAME):pl)}:t));
  const aP=ti=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length<MAX_PL?{...t,players:[...t.players,""]}:t));
  const rP=(ti,pi)=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length>1?{...t,players:t.players.filter((_,j)=>j!==pi)}:t));
  const uM=(i,v)=>setMems(p=>p.map((m,j)=>j===i?v.slice(0,MAX_NAME):m));
  const aM=()=>{if(mems.length<MAX_SHUF)setMems(p=>[...p,""]);};
  const rM=i=>{if(mems.length>2)setMems(p=>p.filter((_,j)=>j!==i));};
  const doShuf=()=>{const names=mems.filter(m=>m.trim());if(names.length<tc)return;const s=shuf(names);const r=Array.from({length:tc},(_,i)=>({name:"チーム"+(i+1),players:[]}));s.forEach((n,i)=>r[i%tc].players.push(n));setSp(r);};
  const okM=teams.slice(0,tc).every(t=>t.name.trim()&&t.players.some(p=>p.trim()));const okS=mems.filter(m=>m.trim()).length>=tc;
  const go=()=>{let ft;if(mode==="manual")ft=teams.slice(0,tc).map(t=>({...t,players:t.players.filter(p=>p.trim())}));else{if(!sp)return;ft=sp;}let ord=Array.from({length:ft.length},(_,i)=>i);if(om==="random")ord=shuf(ord);onStart(ft,ord,numGames,bestOf,dqEnd,saveToStats);};
  const usedManual=teams.slice(0,tc).flatMap(t=>t.players).filter(p=>p.trim()).map(p=>p.trim());
  const usedShuffle=mems.filter(m=>m.trim()).map(m=>m.trim());const used=mode==="manual"?usedManual:usedShuffle;
  const SL={display:"block",fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:3,marginBottom:8};
  const CH={flex:1,padding:"16px 0",border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"transparent",color:"#fff",fontSize:20,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"};
  const CHA={background:"#2b7de9",borderColor:"#2b7de9"};
  const SEL={width:"100%",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.92)",color:"#14365a",fontSize:18,fontWeight:600,cursor:"pointer",outline:"none",WebkitAppearance:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7'%3E%3Cpath d='M0 0l6 7 6-7z' fill='%23999'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"34px"};
  const CARD={background:"rgba(255,255,255,0.96)",borderRadius:14,padding:"16px 18px 14px",marginBottom:12};
  const PIN={flex:1,border:"1px solid #e0e0e0",borderRadius:10,padding:"12px 14px",fontSize:20,outline:"none",background:"#fafafa"};
  const TIN={flex:1,border:"none",borderBottom:"2px solid #ddd",padding:"6px 4px",fontSize:22,fontWeight:700,outline:"none",background:"transparent"};
  return(
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"auto",background:"linear-gradient(170deg,#0f1f30,#14365a)",WebkitOverflowScrolling:"touch",overscrollBehavior:"none"}}>
      <div style={{padding:"36px 20px 8px",textAlign:"center"}}><img src={MASCOT_S} alt="モルック" style={{width:200,height:200,objectFit:"contain",display:"block",margin:"0 auto -6px"}}/><h1 style={{fontSize:38,fontWeight:900,color:"#fff",letterSpacing:4}}>モルック スコアラー</h1><div style={{fontSize:13,color:"rgba(255,255,255,0.3)",fontWeight:600,letterSpacing:5}}>MÖLKKY SCORER</div></div>
      <div style={{flex:1,padding:"0 20px 36px",maxWidth:720,margin:"0 auto",width:"100%"}}>
        <div style={{marginBottom:14}}><label style={SL}>入力モード</label><div style={{display:"flex",gap:8}}>{[["manual","✏️ 手動"],["shuffle","🎲 ランダム"]].map(([k,l])=>(<button key={k} onClick={()=>{setMode(k);setSp(null);}} style={{...CH,...(mode===k?CHA:{})}}>{l}</button>))}</div></div>
        <div style={{display:"flex",gap:14,marginBottom:14}}><div style={{flex:1}}><label style={SL}>チーム数</label><div style={{display:"flex",gap:8}}>{[2,3,4].map(n=>(<button key={n} onClick={()=>{setTc(n);setSp(null);}} style={{...CH,...(tc===n?CHA:{}),padding:"16px 0"}}>{n}</button>))}</div></div><div style={{flex:1}}><label style={SL}>投げ順</label><div style={{display:"flex",gap:8}}>{[["normal","通常"],["random","ランダム"]].map(([k,l])=>(<button key={k} onClick={()=>setOm(k)} style={{...CH,...(om===k?CHA:{})}}>{l}</button>))}</div></div></div>
        <div style={{display:"flex",gap:8,marginBottom:14}}><div style={{flex:"1 1 0"}}><label style={SL}>ゲーム数</label><select value={numGames} onChange={e=>setNumGames(+e.target.value)} style={SEL}>{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}ゲーム</option>)}</select></div><div style={{flex:"1 1 0"}}><label style={SL}>先取機能</label><select value={bestOf} onChange={e=>setBestOf(+e.target.value)} style={SEL}><option value={0}>なし</option>{Array.from({length:11},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}先取</option>)}</select></div><div style={{flex:"1 1 0"}}><label style={SL}>失格時</label><select value={dqEnd?"end":"cont"} onChange={e=>setDqEnd(e.target.value==="end")} style={SEL}><option value="end">即終了</option><option value="cont">継続</option></select></div></div>
        {/* Stats toggle (UISwitch) + Stats button */}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div onClick={()=>setSaveToStats(p=>!p)} style={{flex:1,padding:"14px 16px",border:"2px solid "+(saveToStats?"#22b566":"rgba(255,255,255,0.25)"),borderRadius:12,background:saveToStats?"rgba(34,181,102,0.15)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
            <span style={{color:saveToStats?"#22b566":"rgba(255,255,255,0.5)",fontSize:15,fontWeight:700}}>スタッツ反映</span>
            <div style={{width:48,height:28,borderRadius:14,padding:2,background:saveToStats?"#22b566":"rgba(255,255,255,0.25)",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:saveToStats?"flex-end":"flex-start"}}>
              <div style={{width:24,height:24,borderRadius:12,background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"all 0.2s"}}/>
            </div>
          </div>
          <button onClick={()=>setShowSetupStats(true)} style={{flex:1,padding:"14px 16px",border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📊 スタッツ</button>
        </div>
        <div style={{padding:"12px 16px",background:"rgba(43,125,233,0.12)",borderRadius:12,border:"1px solid rgba(43,125,233,0.2)",marginBottom:14}}><div style={{fontWeight:800,fontSize:16,color:"#fff",marginBottom:3}}>📋 公式ルール</div><div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.8}}>50点で勝利 / 超過→25点 / 37点以上でフォルト→25点 / ミス＝倒れず / フォルト＝反則 / 3連続→失格</div></div>
        {mode==="manual"&&(<>{teams.slice(0,tc).map((team,ti)=>(<div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:18,flexShrink:0,background:C[ti].ac}}>{ti+1}</div><input value={team.name} onChange={e=>uN(ti,e.target.value)} style={TIN} placeholder={"チーム"+(ti+1)}/></div>
          <div style={{paddingLeft:44}}>{team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}><span style={{width:20,fontSize:16,color:"#aaa",fontWeight:700,textAlign:"center"}}>{pi+1}</span><input value={p} onChange={e=>uP(ti,pi,e.target.value)} maxLength={MAX_NAME} style={PIN} placeholder={"名前("+MAX_NAME+"文字)"}/><FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={name=>uP(ti,pi,name)} usedNames={used}/></div>))}
            {team.players.length<MAX_PL&&<button style={{width:"100%",padding:10,border:"2px dashed #ddd",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer"}} onClick={()=>aP(ti)}>＋ 追加</button>}
            {team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"#c0392b",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rP(ti,team.players.length-1)}>− 最後を削除</button>}
          </div></div>))}
          <button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:32,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:6,boxShadow:"0 3px 16px rgba(43,125,233,0.3)",opacity:okM?1:0.3}} onClick={okM?go:undefined}>🎯 ゲーム開始</button>
        </>)}
        {mode==="shuffle"&&(<><div style={CARD}><div style={{fontWeight:700,fontSize:18,marginBottom:6,color:"#14365a"}}>参加メンバー（最大{MAX_SHUF}人）</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{mems.map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:20,fontSize:14,color:"#aaa",fontWeight:700,textAlign:"right"}}>{i+1}</span><input value={m} onChange={e=>uM(i,e.target.value)} maxLength={MAX_NAME} style={{...PIN,padding:"10px 12px",fontSize:18}} placeholder="メンバー"/><FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={name=>uM(i,name)} usedNames={used}/></div>))}</div>
          {mems.length<MAX_SHUF&&<button style={{width:"100%",padding:10,border:"2px dashed #ddd",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:6}} onClick={aM}>＋</button>}
          {mems.length>2&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"#c0392b",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rM(mems.length-1)}>− 最後を削除</button>}</div>
          <button style={{width:"100%",padding:16,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:20,fontWeight:800,cursor:"pointer",opacity:okS?1:0.3}} onClick={okS?doShuf:undefined}>🎲 シャッフル</button>
          {sp&&(<div style={{marginTop:8}}>{sp.map((t,ti)=>(<div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac,padding:"10px 16px",marginBottom:6}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:14,background:C[ti].ac}}>{ti+1}</div><input value={t.name} onChange={e=>setSp(p=>p.map((x,i)=>i===ti?{...x,name:e.target.value}:x))} style={{...TIN,fontSize:18}}/></div><div style={{paddingLeft:34,fontSize:16,color:"#555"}}>{t.players.join("、")}</div></div>))}
            <button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:32,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:4}} onClick={go}>🎯 開始</button>
            <button style={{width:"100%",padding:14,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",marginTop:6}} onClick={doShuf}>🔄 再シャッフル</button></div>)}
        </>)}
      </div>
      {showSetupStats&&<StatsModal onClose={()=>setShowSetupStats(false)} source="setup"/>}
    </div>);
}

/* ═══ Score Input — centered numpad ═══ */
function ScoreInput({dispatch,canUndo,teamName,teamScore,teamColor,playerName,fails,onConfirm,minimized,onToggleMin}){
  const[sel,setSel]=useState(null);
  const pv=sel!=null?teamScore+sel:null;const over=pv!=null&&pv>WIN;const win=pv===WIN;
  const doScore=()=>{if(sel==null)return;if(win){onConfirm("score",sel,teamName+"が50点で上がりです。\n確定しますか？");setSel(null);return;}dispatch({type:"SCORE",score:sel});setSel(null);};
  const doMiss=()=>{if(fails>=MF-1){onConfirm("miss",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}dispatch({type:"MISS"});setSel(null);};
  const doFault=()=>{if(fails>=MF-1){onConfirm("fault",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}if(teamScore>=PEN){onConfirm("fault",0,teamName+"は"+teamScore+"点（37点以上）。\nフォルトで25点に戻ります。確定しますか？");setSel(null);return;}dispatch({type:"FAULT"});setSel(null);};
  const NB=90,NG=8,NFS=38;
  if(minimized){return(<div onClick={onToggleMin} style={{background:"#14365a",padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:32,fontWeight:900,color:teamColor}}>{teamName}</span><span style={{fontSize:36,fontWeight:900,color:"#fff"}}>{teamScore}点</span>{playerName&&<span style={{fontSize:18,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>▶{playerName}</span>}<div style={{display:"flex",gap:4}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:18,height:18,borderRadius:9,background:j<fails?"#e74c3c":"rgba(255,255,255,0.2)"}}/>))}</div></div>
    <span style={{fontSize:28,color:"#fff",fontWeight:900,padding:"12px 24px",background:"rgba(255,255,255,0.15)",borderRadius:12}}>▲ 入力</span></div>);}
  return(
    <div style={{background:"#fff",borderTop:"3px solid #dde1e6",padding:"14px 18px 20px",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10,flexWrap:"wrap"}}>
          <span style={{fontSize:30,fontWeight:900,color:teamColor}}>(プレーヤー：{playerName||"−"})</span>
          <span style={{fontSize:66,fontWeight:900,color:"#14365a",lineHeight:1}}>{teamScore}</span><span style={{fontSize:30,fontWeight:900,color:"#14365a"}}>点</span>
          {fails>0&&<div style={{display:"flex",gap:5,alignItems:"center"}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:26,height:26,borderRadius:13,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,background:j<fails?"#e74c3c":"#ddd",color:j<fails?"#fff":"#999"}}>{j<fails?"✕":""}</span>))}</div>}
        </div>
        <button onClick={onToggleMin} style={{padding:"14px 28px",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:22,fontWeight:800,cursor:"pointer",flexShrink:0}}>▼ 最小化</button>
      </div>
      {sel!=null&&<div style={{fontSize:22,fontWeight:700,marginBottom:4,color:over?"#d93a5e":win?"#22b566":"#14365a"}}>+{sel} → {over?"超過！25点に戻る":win?"🎉50点勝利！":pv+"点"}</div>}
      {teamScore>=PEN&&<div style={{fontSize:18,fontWeight:700,color:"#e67700",marginBottom:4}}>⚠ フォルトで25点に戻ります</div>}
      <div style={{display:"flex",gap:16,justifyContent:"center",alignItems:"flex-start"}}>
        <div style={{display:"flex",flexDirection:"column",gap:NG,alignItems:"center"}}>
          {[[7,9,8],[5,11,12,6],[3,10,4],[1,2]].map((row,ri)=>(<div key={ri} style={{display:"flex",gap:NG,justifyContent:"center"}}>{row.map(n=>{const isSel=sel===n;return(<button key={n} onClick={()=>setSel(sel===n?null:n)} style={{width:NB,height:NB,borderRadius:NB/2,border:isSel?"4px solid #14365a":"3px solid #b0bec5",background:isSel?"#14365a":"#fff",color:isSel?"#fff":"#14365a",fontSize:NFS,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.1s",boxShadow:isSel?"0 4px 16px rgba(20,54,90,0.3)":"none"}}>{n}</button>);})}</div>))}
          <button style={{width:"100%",maxWidth:NB*3+NG*2,padding:"12px 0",border:"2px solid #ccc",borderRadius:10,background:"#f5f5f5",color:"#666",fontSize:18,fontWeight:800,cursor:"pointer",opacity:canUndo?1:0.2,marginTop:4}} onClick={canUndo?()=>dispatch({type:"UNDO"}):undefined}>↩ 戻る</button>
          <div style={{height:16}}/>
        </div>
        <div style={{width:200,display:"flex",flexDirection:"column",gap:8,flexShrink:0,paddingBottom:20}}>
          <button style={{flex:1.3,minHeight:120,border:"none",borderRadius:16,background:sel!=null?"#14365a":"#ccc",color:"#fff",fontSize:34,fontWeight:900,cursor:"pointer",boxShadow:sel!=null?"0 4px 16px rgba(20,54,90,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doScore}>決定</button>
          <button style={{padding:"14px 0",border:"2px solid #f0b0b0",borderRadius:10,background:"#fde8e8",color:"#c0392b",fontSize:18,fontWeight:800,cursor:"pointer",flexShrink:0}} onClick={doFault}>✕ フォルト</button>
          <button style={{flex:1,minHeight:100,border:"2px solid #f0d4a0",borderRadius:16,background:"#fff3e0",color:"#bf6900",fontSize:30,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doMiss}>〇 ミス</button>
        </div>
      </div>
    </div>);
}

/* ═══ Player Modal ═══ */
function PlModal({teams,dispatch,onClose}){
  const{favs,addF,rmF}=useFavs();const[name,setName]=useState("");
  const sizes=teams.map(t=>t.players.filter(p=>p.active).length);const mi=sizes.indexOf(Math.min(...sizes));const[sel,setSel]=useState(mi);
  const[addConf,setAddConf]=useState(null);const[delConf,setDelConf]=useState(null);
  const tog=(ti,pi,a)=>{const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.map((p,j)=>j===pi?{...p,active:a}:p)}:t);dispatch({type:"SET_TEAMS",teams:nt});};
  const rmPlayer=(ti,pi)=>{const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.filter((_,j)=>j!==pi)}:t);dispatch({type:"SET_TEAMS",teams:nt});setDelConf(null);};
  const doAdd=(n,tI)=>{const nm=(n||name).trim().slice(0,MAX_NAME);const tg=tI??sel;if(!nm||teams[tg].players.length>=MAX_PL)return;setAddConf({nm,tg});};
  const confirmAdd=()=>{if(!addConf)return;const{nm,tg}=addConf;const nt=teams.map((t,i)=>i===tg?{...t,players:[...t.players,{name:nm,active:true}]}:t);dispatch({type:"SET_TEAMS",teams:nt});setName("");setAddConf(null);};
  const allUsed=teams.flatMap(t=>t.players.filter(p=>p.active).map(p=>p.name));
  return(<div style={SS.ov} onClick={onClose}><div style={{...SS.mod,position:"relative"}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:32,fontWeight:900,color:"#14365a"}}>👥 メンバー</h2><button style={SS.clsB} onClick={onClose}>✕</button></div>
    {teams.map((team,ti)=>(<div key={ti} style={{marginBottom:12}}>
      <div style={{fontSize:18,fontWeight:700,color:C[ti].tx,borderBottom:"2px solid "+C[ti].ac,paddingBottom:4,marginBottom:5}}>{team.name}（{team.players.filter(p=>p.active).length}人）</div>
      {team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",padding:"6px 12px",background:p.active?"#f8f9fa":"#f0f0f0",borderRadius:8,marginBottom:4,opacity:p.active?1:0.4}}>
        <span style={{flex:1,fontSize:17}}>{p.name}</span>
        <div style={{display:"flex",gap:5}}>
          <button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"#fff"}}>{p.active?"退出":"復帰"}</button>
          <button onClick={()=>setDelConf({ti,pi,name:p.name})} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:"#888",color:"#fff"}}>削除</button>
        </div>
      </div>))}
    </div>))}
    <div style={{background:"#e6f0fb",borderRadius:10,padding:14,marginTop:8}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>➕追加</div>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
        <select value={sel} onChange={e=>setSel(+e.target.value)} style={{padding:8,borderRadius:8,border:"1px solid #ccc",fontSize:16}}>{teams.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select>
        <input value={name} onChange={e=>setName(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder="名前" style={{flex:1,minWidth:80,padding:8,borderRadius:8,border:"1px solid #ccc",fontSize:16}}/>
        <button onClick={()=>doAdd()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",opacity:name.trim()?1:0.3}}>追加</button>
        <FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={n=>doAdd(n)} usedNames={allUsed}/>
      </div>
    </div>
    {addConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:6}}>メンバー追加確認</div>
      <div style={{fontSize:16,marginBottom:16}}>「{addConf.nm}」を<br/><span style={{fontWeight:800,color:C[addConf.tg]?.tx}}>{teams[addConf.tg]?.name}</span>に追加しますか？</div>
      <div style={{display:"flex",gap:8}}><button onClick={confirmAdd} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#14365a",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>決定</button><button onClick={()=>setAddConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid #14365a",borderRadius:10,background:"transparent",color:"#14365a",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
    </div></div>}
    {delConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:800,color:"#c0392b",marginBottom:6}}>⚠️ メンバー削除</div>
      <div style={{fontSize:16,marginBottom:16}}>「{delConf.name}」を完全に削除しますか？<br/><span style={{fontSize:13,color:"#888"}}>この操作は元に戻せません</span></div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>rmPlayer(delConf.ti,delConf.pi)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#c0392b",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button><button onClick={()=>setDelConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid #ccc",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
    </div></div>}
  </div></div>);
}

function OrderPicker({teams,teamOrder,value,onChangeOrd,prevOrder}){
  const rev=[...teamOrder].reverse();const[man,setMan]=useState([...teamOrder]);const[randOrd,setRandOrd]=useState(()=>smartShuf([...teamOrder],prevOrder));
  const mvUp=i=>{if(i===0)return;const m=[...man];[m[i-1],m[i]]=[m[i],m[i-1]];setMan(m);onChangeOrd("manual",m);};
  const doRand=()=>{const r=smartShuf([...teamOrder],prevOrder);setRandOrd(r);onChangeOrd("random",r);};
  const pick=v=>{if(v==="same")onChangeOrd("same",[...teamOrder]);else if(v==="reverse")onChangeOrd("reverse",rev);else if(v==="random")doRand();else onChangeOrd("manual",man);};
  const disp=value==="reverse"?rev:value==="manual"?man:value==="same"?[...teamOrder]:value==="random"?randOrd:null;
  return(<><div style={{display:"flex",gap:6,marginBottom:6}}>{[["same","🔁同順"],["reverse","🔄裏"],["random","🎲ランダム"],["manual","✏️手動"]].map(([k,l])=>(<button key={k} onClick={()=>pick(k)} style={{flex:1,padding:"8px 0",border:"1px solid #ddd",borderRadius:8,background:value===k?"#14365a":"#fff",color:value===k?"#fff":"#14365a",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}}>{l}</button>))}</div>
    {disp&&(<div style={{background:"#f8f9fa",borderRadius:8,padding:8,marginBottom:6}}>{disp.map((ti,i)=>{const t=teams[ti];const ap=t?.players?t.players.filter(p=>typeof p==="object"?p.active:true):[];return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<disp.length-1?"1px solid #eee":"none"}}><span style={{fontSize:16,fontWeight:800,color:C[ti]?.ac||"#aaa",width:24,textAlign:"center"}}>{i+1}</span><span style={{fontSize:17,fontWeight:700,color:C[ti]?.tx||"#333"}}>{t?.name||""}</span><span style={{fontSize:13,color:"#888",marginLeft:2}}>{ap.map(p=>typeof p==="object"?p.name:p).join("・")}</span>{value==="manual"&&i>0&&<button onClick={()=>mvUp(i)} style={{marginLeft:"auto",padding:"4px 10px",border:"1px solid #ddd",borderRadius:5,background:"#fff",fontSize:12,cursor:"pointer"}}>▲</button>}</div>);})}
      {value==="random"&&<button onClick={doRand} style={{width:"100%",marginTop:6,padding:"8px 0",border:"2px dashed #2b7de9",borderRadius:8,background:"transparent",color:"#2b7de9",fontSize:14,fontWeight:700,cursor:"pointer"}}>🔄 再シャッフル</button>}
    </div>)}</>);
}

/* ═══ Canvas image save ═══ */
function drawScoreImage(teams,history,teamOrder,comments,gameNumber){
  const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
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
    ordered.forEach(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);o.ap.forEach((p,pi)=>{const isP=e&&e.playerIndex===pi;let txt="";if(isP){if(e.type==="miss")txt="−";else if(e.type==="fault")txt=e.faultReset?"F↓":"F";else txt=e.reset25?e.score+"↓":""+e.score;if(e.consecutiveFails>=MF)txt+="✕";}ctx.fillStyle=isP?(e.type==="miss"?"#bf6900":e.type==="fault"?"#c0392b":C[o.idx].tx):"#333";ctx.font=(isP?"bold ":"")+"13px sans-serif";ctx.fillText(txt,cx+CW/2,y+23);cx+=CW;});ctx.fillStyle=e?C[o.idx].tx:"#ccc";ctx.font="bold 14px sans-serif";ctx.fillText(e?""+e.runningTotal:"",cx+CW/2,y+23);cx+=CW;});y+=RH;}
  if(comments.length>0){y+=10;ctx.fillStyle="#14365a";ctx.font="bold 15px sans-serif";ctx.textAlign="left";ctx.fillText("💬 メモ",x,y+18);y+=30;comments.forEach(c2=>{ctx.fillStyle="#444";ctx.font="14px sans-serif";ctx.fillText("• "+c2,x+6,y+16);y+=26;});}
  return c;
}
async function saveImage(canvas){return new Promise((res,rej)=>{canvas.toBlob(async blob=>{if(!blob)return rej("fail");const file=new File([blob],"molkky-score.png",{type:"image/png"});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"モルック スコア"});res("shared");}catch(e){if(e.name!=="AbortError")rej(e);else res("cancelled");}}else{const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="molkky-score.png";a.click();URL.revokeObjectURL(url);res("dl");}},"image/png");});}

/* ═══ Radar Chart SVG ═══ */
const RADAR_LABELS=["ミス率\n(低い程◎)","上がり\n決定率","投擲\n平均点","2ミス後\n平均点","お邪魔\n成功率","ブレイク\n平均点"];
const RADAR_MAX=["0%","100%","12pt","12pt","100%","12pt"];
/* Per-vertex nudge: separate max-value from label to prevent overlap */
const LB_ADJ=[{dx:0,dy:-20},{dx:28,dy:-2},{dx:28,dy:10},{dx:0,dy:20},{dx:-28,dy:10},{dx:-28,dy:-2}];
const MX_ADJ=[{dx:0,dy:6},{dx:16,dy:2},{dx:16,dy:-2},{dx:0,dy:-6},{dx:-16,dy:-2},{dx:-16,dy:2}];
function RadarChart({playersData,size}){
  const isTablet=typeof window!=="undefined"&&window.innerWidth>=768;
  const S=isTablet?952:size||560;
  const rRatio=0.28;
  const lbDist=isTablet?136:80;
  const mxDist=isTablet?37:22;
  const lbFS=isTablet?30:18;
  const mxFS=isTablet?29:17;
  const lbDy=isTablet?34:21;
  const adjScale=isTablet?1.7:1;
  const cx2=S/2,cy2=S/2,R=S*rRatio;const n=6;
  const ang=i=>-Math.PI/2+i*(2*Math.PI/n);
  const pt=(i,r)=>({x:cx2+r*Math.cos(ang(i)),y:cy2+r*Math.sin(ang(i))});
  const grid=[0.25,0.5,0.75,1].map(f=>Array.from({length:n},(_,i)=>pt(i,R*f)).map(p=>p.x+","+p.y).join(" "));
  const axes=Array.from({length:n},(_,i)=>({x1:cx2,y1:cy2,x2:pt(i,R).x,y2:pt(i,R).y}));
  const labels=RADAR_LABELS.map((l,i)=>{const p=pt(i,R+lbDist);return{x:p.x+LB_ADJ[i].dx*adjScale,y:p.y+LB_ADJ[i].dy*adjScale,t:l};});
  const maxPts=RADAR_MAX.map((m,i)=>{const p=pt(i,R+mxDist);return{x:p.x+MX_ADJ[i].dx*adjScale,y:p.y+MX_ADJ[i].dy*adjScale,t:m};});
  const mSize=R*1.4;
  const fnt="'Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif";
  return(<svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
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
  return(<div style={{background:"#fff",borderRadius:14,padding:16,border:"1px solid #ddd",marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <button onClick={prevMonth} style={{width:36,height:36,border:"1px solid #ddd",borderRadius:8,background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <button onClick={()=>{if(mode==="range")handleYearTap();else setShowYearPicker(p=>!p);}} style={{fontSize:20,fontWeight:800,color:mode==="range"?"#2b7de9":"#14365a",background:"transparent",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,textDecoration:mode==="range"?"underline":"none",textDecorationStyle:"dotted",textUnderlineOffset:4}}>{year}年</button>
        <button onClick={handleMonthTap} style={{fontSize:20,fontWeight:800,color:"#2b7de9",background:"transparent",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6,textDecoration:"underline",textDecorationStyle:"dotted",textUnderlineOffset:4}}>{String(month+1).padStart(2,"0")}月</button>
      </div>
      <button onClick={nextMonth} style={{width:36,height:36,border:"1px solid #ddd",borderRadius:8,background:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
    </div>
    {showYearPicker&&(<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10,justifyContent:"center"}}>{availableYears.map(y=>(<button key={y} onClick={()=>{setViewDate(new Date(y,month,1));setShowYearPicker(false);}} style={{padding:"6px 14px",border:y===year?"2px solid #2b7de9":"1px solid #ddd",borderRadius:8,background:y===year?"#2b7de9":"#fff",color:y===year?"#fff":"#14365a",fontSize:14,fontWeight:700,cursor:"pointer"}}>{y}</button>))}</div>)}
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
      {dayNames.map((dn,i)=>(<div key={dn} style={{textAlign:"center",fontSize:13,fontWeight:700,color:i===0?"#d93a5e":i===6?"#2b7de9":"#888",padding:"4px 0"}}>{dn}</div>))}
      {cells.map((d,i)=>{
        const inR=isInRange(d);const isSt=isStart(d);const isEn=isEnd(d);const gd=isGameDay(d);const td=isToday(d);
        return(<div key={i} onClick={()=>handleClick(d)} style={{textAlign:"center",padding:"8px 2px",cursor:d?"pointer":"default",position:"relative",borderRadius:isSt&&isEn?10:isSt?"10px 0 0 10px":isEn?"0 10px 10px 0":0,background:inR?"#2b7de9":"transparent",color:inR?"#fff":!d?"transparent":td?"#2b7de9":"#333",fontWeight:td||inR?800:500,fontSize:15,transition:"background 0.15s"}}>
          {d||""}{gd&&!inR&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:5,height:5,borderRadius:"50%",background:"#2b7de9"}}/>}{gd&&inR&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:5,height:5,borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>}
        </div>);
      })}
    </div>
    {selectedStart&&(<div style={{marginTop:8,fontSize:13,fontWeight:600,color:"#14365a",textAlign:"center"}}>
      期間: {fmtMD(new Date(selectedStart))}
      {selectedEnd&&selectedStart.getTime()!==selectedEnd.getTime()?" 〜 "+fmtMD(new Date(selectedEnd)):""}
    </div>)}
  </div>);
}

/* ═══ Score Distribution Component ═══ */
function ScoreDistribution({playersData}){
  const hasSV=playersData.some(pd=>pd.metrics.scoreValues&&pd.metrics.scoreValues.length>0);
  if(!hasSV)return(<div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:14,border:"1px solid #ddd"}}>
    <div style={{fontSize:16,fontWeight:800,color:"#14365a",marginBottom:8}}>🎯 スコア分布分析</div>
    <div style={{textAlign:"center",padding:20,color:"#aaa",fontSize:14}}>スコア分布データがありません</div>
  </div>);
  const SCORE_COLORS=["#e8e8e8","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a","#f59e0b","#ef4444"];
  return(<div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:14,border:"1px solid #ddd"}}>
    <div style={{fontSize:16,fontWeight:800,color:"#14365a",marginBottom:12}}>🎯 スコア分布分析</div>
    {playersData.map(pd=>{
      const sv=pd.metrics.scoreValues||[];if(!sv.length)return null;
      const dist=Array(12).fill(0);sv.forEach(s=>{if(s>=1&&s<=12)dist[s-1]++;});
      const maxC=Math.max(...dist,1);
      const sorted=[...dist.map((c,i)=>({score:i+1,count:c}))].sort((a,b)=>b.count-a.count);
      const top3=sorted.filter(s=>s.count>0).slice(0,3);
      const highCount=sv.filter(s=>s>=10).length;const lowCount=sv.filter(s=>s<=3).length;
      let pattern="バランス型のスタイルです";
      if(highCount/sv.length>0.3)pattern="高得点を狙う積極的なスタイルです";
      else if(lowCount/sv.length>0.4)pattern="確実に倒す堅実なスタイルです";
      else if(sv.length>0){const avg=sv.reduce((a,b)=>a+b,0)/sv.length;if(avg>=7)pattern="中〜高得点を安定して狙うスタイルです";else if(avg<=4)pattern="手堅く点を重ねるスタイルです";}
      return(<div key={pd.name} style={{marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:800,color:pd.color,marginBottom:8}}>{pd.name}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:10}}>
          {dist.map((c,i)=>{const ratio=maxC>0?c/maxC:0;return(<div key={i} onClick={()=>{}} style={{textAlign:"center",padding:"10px 4px",borderRadius:8,background:c>0?SCORE_COLORS[i]:"#f5f5f5",color:c>0?(i>=6?"#fff":"#333"):"#ccc",fontWeight:700,fontSize:16,position:"relative",cursor:"default",border:c>0?"none":"1px solid #e8e8e8",opacity:c>0?0.5+ratio*0.5:0.4}}>
            {i+1}<div style={{fontSize:10,fontWeight:500,marginTop:2}}>{c>0?c+"回":"-"}</div>
          </div>);})}
        </div>
        <div style={{background:"#f8f9fa",borderRadius:8,padding:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#14365a",marginBottom:4}}>分析結果</div>
          <div style={{fontSize:13,color:"#555"}}>よく獲得するスコア: {top3.length>0?top3.map(s=>s.score+"点").join(", "):"−"}</div>
          <div style={{fontSize:13,color:"#555",marginTop:2}}>得点パターン: {pattern}</div>
        </div>
      </div>);
    })}
  </div>);
}

/* ═══ Game List Item ═══ */
function GameListItem({game,checked,onToggle,isTab}){
  const dt=new Date(game.d);
  const timeStr=fmtHM(dt);
  const dateStr=(dt.getMonth()+1)+"/"+dt.getDate();
  const ftLabel=game.ft==="50finish"?"50点決着":game.ft==="dq"?"失格決着":"不明";
  const ftColor=game.ft==="50finish"?"#22b566":"#c0392b";
  /* E: Labels depend on finish type */
  const winLabel=game.ft==="50finish"?"上がり者":"勝者";
  const hasTeam=(game.winnerMembers||[]).length>=2;
  return(<div onClick={onToggle} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:checked?"#e6f0fb":"#fff",borderRadius:10,border:checked?"2px solid #2b7de9":"1px solid #e0e0e0",marginBottom:6,cursor:"pointer",transition:"all 0.15s"}}>
    <div style={{width:22,height:22,borderRadius:6,border:checked?"none":"2px solid #ccc",background:checked?"#2b7de9":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
      {checked&&<span style={{color:"#fff",fontSize:14,fontWeight:900}}>✓</span>}
    </div>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:isTab?18:15,fontWeight:800,color:"#14365a"}}>{dateStr} {timeStr}</span>
        <span style={{fontSize:isTab?14:12,fontWeight:700,color:ftColor,background:ftColor+"18",padding:"2px 8px",borderRadius:4}}>{ftLabel}</span>
      </div>
      <div style={{fontSize:isTab?15:13,color:"#555",marginTop:3}}>
        {game.players.length}人戦　参加者: {game.players.join(", ")}
      </div>
      {game.winnerName&&<div style={{fontSize:isTab?14:12,color:"#22b566",fontWeight:700,marginTop:2}}>{winLabel}: {game.winnerName}</div>}
      {hasTeam&&<div style={{fontSize:isTab?13:11,color:"#2b7de9",fontWeight:600,marginTop:1}}>勝利チームのメンバー: {game.winnerMembers.join(", ")}</div>}
    </div>
  </div>);
}

/* ═══ Stats Modal — with Calendar/Recent tabs + Score Distribution ═══ */
function StatsModal({onClose,currentGameRecords,initialDelete,source}){
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

  const currentNames=(currentGameRecords||[]).map(r=>r.nm);
  const allNames=favs.filter(n=>(stats[n]&&stats[n].length>0)||currentNames.includes(n));
  const names=viewMode==="current"?allNames.filter(n=>currentNames.includes(n)):allNames;
  const[selected,setSelected]=useState(()=>allNames.slice(0,4));
  const effectiveSelected=viewMode==="current"?selected.filter(n=>currentNames.includes(n)):selected;
  const toggleSel=n=>{setSelected(p=>p.includes(n)?p.filter(x=>x!==n):[...p,n].slice(0,6));};

  const allGames=getAvailableGames(stats,names);
  const gameDateSet=getGameDates(stats,names);

  /* Calendar date selection */
  const handleCalSelect=(dt)=>{
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

  const tabBtnStyle=(k)=>({padding:isTab?"10px 24px":"8px 16px",border:"none",borderBottom:tab===k?"3px solid #2b7de9":"3px solid transparent",background:"transparent",color:tab===k?"#14365a":"#888",fontSize:isTab?20:15,fontWeight:tab===k?800:600,cursor:"pointer"});

  /* Games filtered for display in calendar tab */
  const calFilteredGames=(calStart&&calEnd)?filterGamesByDates(allGames,calStart,calEnd):calStart?filterGamesByDates(allGames,calStart,calStart):[];

  return(<div style={{position:"fixed",inset:0,background:"#f0f3f8",zIndex:150,display:"flex",flexDirection:"column",overflow:"hidden",overscrollBehavior:"none"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(10px + env(safe-area-inset-top, 0px)) 20px 10px",background:"#14365a",flexShrink:0}}>
      <h2 style={{fontSize:isTab?32:24,fontWeight:900,color:"#fff",margin:0}}>📊 {source==="setup"?"累計スタッツ":"プレイヤースタッツ"}</h2>
      <button onClick={onClose} style={{padding:"8px 18px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"transparent",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>✕ 閉じる</button>
    </div>
    <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"12px 20px",overscrollBehavior:"contain"}}>
      {names.length===0?<div style={{textAlign:"center",padding:40,color:"#888",fontSize:18}}>⭐ お気に入り登録プレイヤーのデータなし</div>:(<>
        {/* View mode toggle: cumulative vs current game (only from game result) */}
        {source!=="setup"&&currentGameRecords&&currentGameRecords.length>0&&(
          <div style={{display:"flex",gap:6,marginBottom:10}}>{[["cumulative","累計データ"],["current","この試合"]].map(([k,l])=>(<button key={k} onClick={()=>{setViewMode(k);}} style={{flex:1,padding:"10px 0",border:"2px solid "+(viewMode===k?"#14365a":"#ddd"),borderRadius:10,background:viewMode===k?"#14365a":"#fff",color:viewMode===k?"#fff":"#14365a",fontSize:16,fontWeight:700,cursor:"pointer"}}>{l}</button>))}</div>
        )}
        {/* Tabs (only for cumulative mode) */}
        {viewMode==="cumulative"&&(
          <div style={{display:"flex",borderBottom:"1px solid #ddd",marginBottom:10}}>
            <button onClick={()=>{setTab("calendar");setSelectedGameKeys(new Set());}} style={tabBtnStyle("calendar")}>カレンダー</button>
            <button onClick={()=>{setTab("recent");setSelectedGameKeys(new Set());}} style={tabBtnStyle("recent")}>直近の試合</button>
            <button onClick={()=>{setTab("all");}} style={tabBtnStyle("all")}>累計</button>
          </div>
        )}
        {/* Calendar Tab */}
        {viewMode==="cumulative"&&tab==="calendar"&&(<>
          <div style={{display:"flex",gap:6,marginBottom:8}}>
            {[["single","単一日付"],["range","期間選択"]].map(([k,l])=>(<button key={k} onClick={()=>{setCalMode(k);setCalStart(null);setCalEnd(null);setSelectedGameKeys(new Set());}} style={{flex:1,padding:"8px 0",border:"2px solid "+(calMode===k?"#2b7de9":"#ddd"),borderRadius:8,background:calMode===k?"#2b7de9":"#fff",color:calMode===k?"#fff":"#14365a",fontSize:14,fontWeight:700,cursor:"pointer"}}>{l}</button>))}
          </div>
          <CalendarPicker gameDates={gameDateSet} onSelect={handleCalSelect} onSelectMonth={handleMonthSelect} onSelectYear={handleYearSelect} mode={calMode} selectedStart={calStart} selectedEnd={calEnd}/>
          {calFilteredGames.length>0&&(<div style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:14,fontWeight:700,color:"#14365a"}}>{selectedGameKeys.size}/{calFilteredGames.length} セット選択中</span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>setSelectedGameKeys(new Set(calFilteredGames.map(g=>g.d)))} style={{padding:"4px 12px",border:"1px solid #2b7de9",borderRadius:6,background:"#fff",color:"#2b7de9",fontSize:12,fontWeight:700,cursor:"pointer"}}>全選択</button>
                <button onClick={()=>setSelectedGameKeys(new Set())} style={{padding:"4px 12px",border:"1px solid #ccc",borderRadius:6,background:"#fff",color:"#888",fontSize:12,fontWeight:700,cursor:"pointer"}}>全解除</button>
              </div>
            </div>
            {calFilteredGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab}/>))}
          </div>)}
        </>)}
        {/* Recent Tab */}
        {viewMode==="cumulative"&&tab==="recent"&&(<div style={{marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:14,fontWeight:700,color:"#14365a"}}>{selectedGameKeys.size}/{recentGamesAll.length} セット選択中</span>
            <div style={{display:"flex",gap:6}}>
              <button onClick={selectAllRecent} style={{padding:"4px 12px",border:"1px solid #2b7de9",borderRadius:6,background:"#fff",color:"#2b7de9",fontSize:12,fontWeight:700,cursor:"pointer"}}>全選択</button>
              <button onClick={deselectAllRecent} style={{padding:"4px 12px",border:"1px solid #ccc",borderRadius:6,background:"#fff",color:"#888",fontSize:12,fontWeight:700,cursor:"pointer"}}>全解除</button>
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
              return(<button key={k} onClick={applyPreset} style={{padding:"6px 12px",border:"1px solid #2b7de9",borderRadius:8,background:"#f0f6ff",color:"#2b7de9",fontSize:13,fontWeight:700,cursor:"pointer"}}>{label}</button>);
            })}
          </div>
          {recentGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab}/>))}
          {/* F: Pagination */}
          {totalPages>1&&(<div style={{display:"flex",justifyContent:"center",gap:8,marginTop:10}}>
            {Array.from({length:totalPages},(_,i)=>(<button key={i} onClick={()=>setRecentPage(i)} style={{width:36,height:36,border:recentPage===i?"2px solid #2b7de9":"1px solid #ddd",borderRadius:8,background:recentPage===i?"#2b7de9":"#fff",color:recentPage===i?"#fff":"#14365a",fontSize:14,fontWeight:700,cursor:"pointer"}}>{i+1}</button>))}
          </div>)}
        </div>)}
        {/* Player select chips */}
        <div style={{display:"flex",gap:isTab?12:6,marginBottom:10,flexWrap:"wrap",marginTop:6}}>{names.map((nm,i)=>(<button key={nm} onClick={()=>toggleSel(nm)} style={{padding:isTab?"12px 28px":"6px 14px",border:"2px solid "+(effectiveSelected.includes(nm)?PC[effectiveSelected.indexOf(nm)%PC.length]:"#ddd"),borderRadius:isTab?36:20,background:effectiveSelected.includes(nm)?PC[effectiveSelected.indexOf(nm)%PC.length]+"22":"#fff",color:effectiveSelected.includes(nm)?PC[effectiveSelected.indexOf(nm)%PC.length]:"#888",fontSize:isTab?28:14,fontWeight:700,cursor:"pointer"}}>{nm}</button>))}</div>
        {playersData.length>0&&(<>
          <div style={{display:"flex",justifyContent:"center",marginBottom:8}}><RadarChart playersData={playersData} size={560}/></div>
          <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:16,flexWrap:"wrap"}}>{playersData.map(pd=>(<div key={pd.name} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:12,height:12,borderRadius:6,background:pd.color}}/><span style={{fontSize:13,fontWeight:700,color:"#333"}}>{pd.name}</span></div>))}</div>
          {/* Summary table */}
          <div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:14,border:"1px solid #ddd"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{background:"#14365a",color:"#fff"}}><th style={{padding:"8px",textAlign:"left"}}>プレイヤー</th><th style={{padding:"8px"}}>試合</th><th style={{padding:"8px"}}>勝利</th><th style={{padding:"8px"}}>ターン</th><th style={{padding:"8px"}}>ミス</th><th style={{padding:"8px"}}>ミス率</th><th style={{padding:"8px"}}>上がり率</th><th style={{padding:"8px"}}>お邪魔</th></tr></thead>
            <tbody>{playersData.map(pd=>{const m=pd.metrics;return(<tr key={pd.name} style={{borderBottom:"1px solid #eee"}}><td style={{padding:"8px",fontWeight:700,color:pd.color}}>{pd.name}</td><td style={{padding:"8px",textAlign:"center"}}>{m.gameCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.winCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.turnCount}</td><td style={{padding:"8px",textAlign:"center",color:"#bf6900"}}>{m.missCount}</td><td style={{padding:"8px",textAlign:"center"}}>{(m.missRate*100).toFixed(1)}%</td><td style={{padding:"8px",textAlign:"center"}}>{(m.finishRate*100).toFixed(1)}%</td><td style={{padding:"8px",textAlign:"center",color:"#22b566",fontWeight:800}}>{m.ojamaCount}</td></tr>);})}</tbody></table>
          </div>
          {/* Score Distribution */}
          <ScoreDistribution playersData={playersData}/>
          {/* Detailed metrics */}
          <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #ddd",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:800,color:"#14365a",marginBottom:8}}>📈 詳細指標</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"#f0f3f8"}}><th style={{padding:"6px",textAlign:"left"}}>指標</th>{playersData.map(pd=><th key={pd.name} style={{padding:"6px",textAlign:"center",color:pd.color,fontWeight:800}}>{pd.name}</th>)}</tr></thead>
            <tbody>{[["投擲平均点",pd=>pd.metrics.avgPts.toFixed(2)],["ブレイク平均",pd=>pd.metrics.breakAvg.toFixed(2)],["お邪魔成功率",pd=>(pd.metrics.ojamaRate*100).toFixed(1)+"%"],["2ミス後平均",pd=>pd.metrics.recAvg.toFixed(2)],["上がり決定率",pd=>(pd.metrics.finishRate*100).toFixed(1)+"%"],["ミス率",pd=>(pd.metrics.missRate*100).toFixed(1)+"%"],["最短投擲",pd=>fmtSec(pd.metrics.throwMin)],["最長投擲",pd=>fmtSec(pd.metrics.throwMax)],["平均投擲",pd=>fmtSec(pd.metrics.throwAvg)]].map(([label,fn])=>(<tr key={label} style={{borderBottom:"1px solid #eee"}}><td style={{padding:"6px",fontWeight:700}}>{label}</td>{playersData.map(pd=><td key={pd.name} style={{padding:"6px",textAlign:"center"}}>{fn(pd)}</td>)}</tr>))}</tbody></table>
          </div>
          {/* Turn-by-turn performance (bar chart placeholder) */}
          <div style={{background:"#fff",borderRadius:14,padding:14,border:"1px solid #ddd",marginBottom:14}}>
            <div style={{fontSize:16,fontWeight:800,color:"#14365a",marginBottom:8}}>📊 ターン別パフォーマンス分析</div>
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
    {/* Delete dialogs */}
    {delStep===1&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:800,color:"#c0392b",marginBottom:12}}>⚠️ スタッツを削除しますか？</div>
      <div style={{display:"flex",gap:8}}><button onClick={()=>setDelStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#c0392b",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>する</button><button onClick={()=>setDelStep(0)} style={{flex:1,padding:"12px 0",border:"2px solid #ccc",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
    </div></div>}
    {delStep===2&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:400,width:"90%",textAlign:"center"}}>
      <div style={{fontSize:18,fontWeight:800,color:"#c0392b",marginBottom:12}}>削除する期間を選択</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{[["day","今日"],["week","今週"],["month","今月"],["year","今年"],["all","全期間"]].map(([k,l])=>(<button key={k} onClick={()=>doDelete(k)} style={{padding:"12px 0",border:"none",borderRadius:10,background:"#c0392b",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>{l}のデータを削除</button>))}<button onClick={()=>setDelStep(0)} style={{padding:"12px 0",border:"2px solid #ccc",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
    </div></div>}
  </div>);
}

/* ═══ Game Result — with stats toggle + long-press delete ═══ */
function GameResult({teams,history,teamOrder,winner,gameWins,bestOf,numGames,gameNumber,onNext,onBack,onExtend,timestamps}){
  const[comment,setComment]=useState("");const[comments,setComments]=useState([]);
  const[ordMode,setOrdMode]=useState("reverse");const[ordVal,setOrdVal]=useState([...teamOrder].reverse());
  const[saving,setSaving]=useState(false);const[showStats,setShowStats]=useState(false);
  const statsLPRef=useRef(null);
  const tw=gameWins||teams.map(()=>0);const matchWin=bestOf>0?tw.findIndex(w=>w>=bestOf):-1;
  const isMatchOver=matchWin>=0;const isLastGame=numGames>0&&gameNumber>=numGames&&!isMatchOver;
  const isAllDone=isMatchOver||isLastGame;const canContinue=!isAllDone;
  const addC=()=>{if(comment.trim()){setComments(p=>[...p,comment.trim()]);setComment("");}};
  const teamStats=teamOrder.map(ti=>{const th=history.filter(h=>h.teamIndex===ti);const sc=th.filter(h=>h.type==="score");return{ti,name:teams[ti].name,final:scoreOf(history,ti),totalPts:sc.reduce((s2,h)=>s2+h.score,0),misses:th.filter(h=>h.type==="miss").length,faults:th.filter(h=>h.type==="fault").length,turns:th.length};});
  const handleOrd=(m,v)=>{setOrdMode(m);setOrdVal(v);};
  const doSave=async()=>{setSaving(true);try{const canvas=drawScoreImage(teams,history,teamOrder,comments,gameNumber);await saveImage(canvas);}catch(e){console.error(e);}setSaving(false);};
  /* Build current game records for per-game stats view */
  const favs=loadFavs();
  const currentGameRecords=buildGameRecord(teams,history,teamOrder,winner,timestamps||[],favs);
  const startLP=()=>{statsLPRef.current=setTimeout(()=>{setShowStats("delete");},600);};
  const cancelLP=()=>{if(statsLPRef.current)clearTimeout(statsLPRef.current);};
  return(
    <div style={{position:"fixed",inset:0,background:"#f0f3f8",zIndex:100,display:"flex",flexDirection:"column",overflow:"hidden",overscrollBehavior:"none"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(10px + env(safe-area-inset-top, 0px)) 20px 10px",background:"#14365a",flexShrink:0}}>
        <h2 style={{fontSize:24,fontWeight:900,color:"#fff",margin:0}}>🏆 Game {gameNumber} 結果</h2>
        <button onPointerDown={startLP} onPointerUp={cancelLP} onPointerLeave={cancelLP} onClick={()=>{if(showStats!=="delete")setShowStats(true);}} style={{padding:"8px 18px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer"}}>📊 スタッツ</button>
      </div>
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"14px 20px",overscrollBehavior:"contain"}}>
        <div style={{textAlign:"center",marginBottom:12}}><h2 style={{fontSize:30,fontWeight:900,color:C[winner]?.ac||"#14365a",margin:0}}>{teams[winner]?.name} 勝利！</h2>{isMatchOver&&<div style={{fontSize:32,fontWeight:900,color:"#22b566",marginTop:4}}>🎊 {teams[matchWin].name} {bestOf}先取達成！</div>}</div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>{teamOrder.map(ti=>(<div key={ti} style={{textAlign:"center",padding:"12px 24px",borderRadius:16,background:ti===winner?C[ti].lt:"#fff",border:ti===winner?"3px solid "+C[ti].ac:"2px solid #e0e0e0"}}><div style={{fontSize:17,fontWeight:700,color:C[ti].tx}}>{teams[ti].name}</div><div style={{fontSize:44,fontWeight:900,color:C[ti].ac,lineHeight:1.1}}>{tw[ti]}</div><div style={{fontSize:13,fontWeight:800,color:"#888"}}>勝</div></div>))}</div>
        <button onClick={doSave} disabled={saving} style={{width:"100%",padding:"14px 0",border:"none",borderRadius:10,background:"#22b566",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",marginBottom:10,opacity:saving?0.5:1}}>{saving?"保存中...":"📸 スコア表を画像保存"}</button>
        <div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:14,border:"1px solid #ddd"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:8}}>📋 スコア表</div>
          <div style={{overflow:"auto",WebkitOverflowScrolling:"touch"}}><ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={false} fontSize={16} colW={50} roundW={36} nameH={90} forCapture={true}/></div>
          <div style={{marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:15}}><thead><tr style={{background:"#14365a",color:"#fff"}}><th style={{padding:"7px 8px",textAlign:"left"}}>チーム</th><th style={{padding:"7px"}}>最終</th><th style={{padding:"7px"}}>得点計</th><th style={{padding:"7px"}}>ミス</th><th style={{padding:"7px"}}>フォルト</th><th style={{padding:"7px"}}>ターン</th></tr></thead><tbody>{teamStats.map((ts,i)=>(<tr key={i} style={{background:ts.ti===winner?"#fffde6":"#fff",borderBottom:"1px solid #eee"}}><td style={{padding:"7px 8px",fontWeight:700,color:C[ts.ti].tx}}>{ts.ti===winner?"🏆":""}{ts.name}</td><td style={{padding:"7px",textAlign:"center",fontWeight:800,color:C[ts.ti].ac}}>{ts.final}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.totalPts}</td><td style={{padding:"7px",textAlign:"center",color:"#bf6900"}}>{ts.misses}</td><td style={{padding:"7px",textAlign:"center",color:"#c0392b"}}>{ts.faults}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.turns}</td></tr>))}</tbody></table></div>
          {comments.length>0&&<div style={{marginTop:10,borderTop:"1px solid #eee",paddingTop:8}}><div style={{fontSize:15,fontWeight:700,color:"#14365a",marginBottom:4}}>💬 コメント</div>{comments.map((c2,i)=><div key={i} style={{padding:"5px 10px",background:"#f8f9fa",borderRadius:6,marginBottom:3,fontSize:14,color:"#444"}}>{c2}</div>)}</div>}
        </div>
        <div style={{marginBottom:14}}><div style={{fontSize:17,fontWeight:800,color:"#14365a",marginBottom:5}}>💬 コメント追加</div><div style={{display:"flex",gap:6}}><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="コメント..." onKeyDown={e=>{if(e.key==="Enter")addC();}} style={{flex:1,padding:"12px 14px",border:"1px solid #ddd",borderRadius:10,fontSize:17,outline:"none"}}/><button onClick={addC} style={{padding:"12px 20px",border:"none",borderRadius:10,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",opacity:comment.trim()?1:0.3}}>追加</button></div></div>
        {canContinue&&(<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #ddd"}}><div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:8}}>次ゲームの投げ順</div><OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder}/><button onClick={()=>onNext(ordVal)} style={{width:"100%",padding:"16px 0",border:"none",borderRadius:12,background:"#14365a",color:"#fff",fontSize:19,fontWeight:700,cursor:"pointer",marginTop:6}}>次のゲーム開始</button></div>)}
        {isAllDone&&(<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #d0dff0"}}><div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:5}}>🔄 ゲーム継続・延長</div><OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder}/><div style={{display:"flex",gap:8,marginTop:6}}><button onClick={()=>onExtend("game",ordVal)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"#2b7de9",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1ゲーム追加</button>{isMatchOver&&<button onClick={()=>onExtend("set",ordVal)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"#22b566",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1セット延長</button>}</div></div>)}
        <button onClick={onBack} style={{width:"100%",padding:"16px 0",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:19,fontWeight:700,cursor:"pointer",marginBottom:24}}>設定に戻る</button>
      </div>
      {showStats===true&&<StatsModal onClose={()=>setShowStats(false)} currentGameRecords={currentGameRecords} source="game"/>}
      {showStats==="delete"&&<StatsModal onClose={()=>setShowStats(false)} currentGameRecords={currentGameRecords} initialDelete={true} source="game"/>}
    </div>
  );
}

/* ═══ Game Screen — with timing ═══ */
function GameScreen({initialTeams,initialOrder,bestOf:iBo,numGames:iNg,dqEnd,goBack,saveToStatsProp,recoverData}){
  const init=recoverData?{
    teams:recoverData.teams.map(t=>({...t,players:t.players.map(p=>typeof p==="string"?{name:p,active:true}:p)})),
    history:recoverData.history,currentOrderIdx:recoverData.currentOrderIdx,currentTurn:recoverData.currentTurn,
    teamOrder:recoverData.teamOrder,eliminated:recoverData.eliminated,
    winner:null,gameNumber:recoverData.gameNumber||1,dqEndGame:recoverData.dqEndGame!==undefined?recoverData.dqEndGame:dqEnd,
    autoEnd:false,turnStartTime:Date.now(),plOffsets:recoverData.plOffsets||recoverData.teams.map(()=>0)
  }:{teams:initialTeams.map(t=>({...t,players:t.players.map(n=>({name:n,active:true}))})),history:[],currentOrderIdx:0,currentTurn:1,teamOrder:initialOrder,eliminated:initialTeams.map(()=>false),winner:null,gameNumber:1,dqEndGame:dqEnd,autoEnd:false,turnStartTime:Date.now(),plOffsets:initialTeams.map(()=>0)};
  const[st,dispatch]=useReducer(reducer,init);const{teams,history,currentOrderIdx,currentTurn,teamOrder,eliminated,winner,gameNumber,plOffsets}=st;
  const[showPl,setShowPl]=useState(false);const[showRes,setShowRes]=useState(false);
  const[view,setView]=useState("both");const[conf,setConf]=useState(null);
  const[gW,setGW]=useState(()=>initialTeams.map(()=>0));
  const[numGames,setNumGames]=useState(iNg);const[bestOf,setBestOf]=useState(iBo);
  const[saveDialog,setSaveDialog]=useState(false);const[inputMin,setInputMin]=useState(false);
  const[timestamps,setTimestamps]=useState([]);
  const turnStartRef=useRef(Date.now());
  const ti=teamOrder[currentOrderIdx];const score=scoreOf(history,ti);const fails=failsOf(history,ti);
  const{ap:_ap,pi:cpIdx}=teams[ti]?getPI(teams,history,ti,plOffsets):{ap:[],pi:0};
  const ap=_ap;const cp=ap.length>0?ap[cpIdx]:null;
  const activeCell=winner===null?{teamIndex:ti,playerIndex:cpIdx,turn:currentTurn}:null;
  const statsSavedRef=useRef({});
  /* Record timestamp when score is entered */
  const prevHistLen=useRef(0);
  useEffect(()=>{
    if(history.length>prevHistLen.current){
      const dur=(Date.now()-turnStartRef.current)/1000;
      const hIdx=history.length-1;
      setTimestamps(p=>[...p,{histIdx:hIdx,ts:Date.now(),dur}]);
      turnStartRef.current=Date.now();
    } else if(history.length<prevHistLen.current){
      /* undo - remove last timestamp, reset timer */
      setTimestamps(p=>p.slice(0,-1));
      turnStartRef.current=Date.now();
    }
    prevHistLen.current=history.length;
  },[history.length]);

  /* Auto-save progress for crash recovery */
  useEffect(()=>{
    if(winner!==null){try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}return;}
    if(history.length===0)return;
    try{
      const snapshot={teams:teams.map(t=>({name:t.name,players:t.players.map(p=>({name:p.name,active:p.active}))})),history,teamOrder,currentOrderIdx,currentTurn,eliminated,gameNumber,plOffsets,dqEndGame:dqEnd,savedAt:Date.now()};
      localStorage.setItem(PROGRESS_KEY,JSON.stringify(snapshot));
    }catch(e){console.warn("Progress save failed:",e);}
  },[history,eliminated,currentTurn,winner]);

  useEffect(()=>{if(winner!==null&&!showRes){
    setGW(p=>{const n=[...p];n[winner]++;return n;});setShowRes(true);
    if(saveToStatsProp){const key=gameNumber+"-"+history.length;
    if(!statsSavedRef.current[key]){statsSavedRef.current[key]=true;const favs=loadFavs();const records=buildGameRecord(teams,history,teamOrder,winner,timestamps,favs);saveGameStatsToDB(records);}}
  }},[winner]);

  const execConf=()=>{if(!conf)return;if(conf.t==="score")dispatch({type:"SCORE",score:conf.s});else if(conf.t==="miss")dispatch({type:"MISS"});else dispatch({type:"FAULT"});setConf(null);};
  const handleNext=order=>{dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);turnStartRef.current=Date.now();};
  const handleExtend=(type,order)=>{if(type==="game")setNumGames(p=>p+1);else if(type==="set")setBestOf(p=>p+1);dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);setTimestamps([]);turnStartRef.current=Date.now();};
  const extractTeamInfo=()=>teams.map(t=>({name:t.name,players:t.players.map(p=>p.name)}));
  const handleBack=()=>setSaveDialog(true);const doBack=save=>{setSaveDialog(false);setShowRes(false);goBack(save?extractTeamInfo():null);};
  const TeamBar=()=>(<div style={{display:"flex",background:"#fff",borderBottom:"2px solid #e0e0e0",flexShrink:0,overflow:"auto"}}>{teamOrder.map((tIdx,oi)=>{const t=teams[tIdx];const sc=scoreOf(history,tIdx);const f=failsOf(history,tIdx);const act=tIdx===ti;const el=eliminated[tIdx];const{ap:tap,pi:tpi}=getPI(teams,history,tIdx,plOffsets);const tcp=tap.length>0?tap[tpi]:null;
    return(<div key={oi} style={{flex:1,minWidth:0,padding:"6px 10px 4px",textAlign:"center",borderLeft:oi>0?"1px solid #e8e8e8":"none",background:act?C[tIdx].lt:"transparent",opacity:el?0.25:1,position:"relative"}}>
      {act&&<div style={{position:"absolute",top:0,left:0,right:0,height:4,background:C[tIdx].ac,borderRadius:"0 0 2px 2px"}}/>}
      <div style={{fontSize:14,fontWeight:700,color:C[tIdx].tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}{el?" ✕":""}{(bestOf>0||numGames>1)?" ["+gW[tIdx]+"勝]":""}</div>
      <div style={{fontSize:48,fontWeight:900,color:C[tIdx].ac,lineHeight:1}}>{sc}</div>
      <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:4}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:18,height:18,borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,background:j<f?"#e74c3c":"#e0e0e0",color:j<f?"#fff":"transparent"}}>✕</span>))}</div>
      {tcp&&<div style={{fontSize:13,fontWeight:700,color:act?"#444":"#aaa",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{act?"🎯":""}{tcp.name}</div>}
    </div>);})}</div>);
  return(
    <div style={SS.gW}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",background:"#14365a",flexShrink:0,gap:6}}>
        <div style={{display:"flex",gap:5,flexShrink:0}}><button style={SS.tBtn} onClick={handleBack}>◀</button><button style={SS.tBtn} onClick={()=>setShowPl(true)}>👥</button></div>
        <span style={{fontSize:32,fontWeight:900,color:"#fff",letterSpacing:0,textAlign:"center",flex:1,lineHeight:1.2}}>{gameNumber}試合目、{currentTurn}ターン{cp?"("+cp.name+")":""}{bestOf>0?" "+bestOf+"先取":""}</span>
        <div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:7,padding:2,gap:2,flexShrink:0}}>{[["both","両方"],["sheet","表"],["input","入力"]].map(([k,l])=>(<button key={k} onClick={()=>setView(k)} style={{padding:"5px 11px",border:"none",borderRadius:5,background:view===k?"rgba(255,255,255,0.2)":"transparent",color:view===k?"#fff":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:600,cursor:"pointer"}}>{l}</button>))}</div>
      </div>
      <TeamBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {(view==="both"||view==="sheet")&&(<div style={{flex:1,minHeight:0,overflow:"hidden"}}><GameSheet teams={teams} history={history} currentTurn={currentTurn} teamOrder={teamOrder} activeCell={activeCell}/></div>)}
        {(view==="both"||view==="input")&&(<ScoreInput dispatch={dispatch} canUndo={history.length>0} teamName={teams[ti].name} teamScore={score} teamColor={C[ti].ac} playerName={cp?.name} fails={fails} onConfirm={(t,s,m)=>setConf({t,s,msg:m})} minimized={inputMin} onToggleMin={()=>setInputMin(p=>!p)}/>)}
      </div>
      {showPl&&<PlModal teams={teams} dispatch={dispatch} onClose={()=>setShowPl(false)}/>}
      {conf&&<Confirm msg={conf.msg} onOk={execConf} onCancel={()=>setConf(null)}/>}
      {showRes&&winner!==null&&<GameResult teams={teams} history={history} teamOrder={teamOrder} winner={winner} gameWins={gW} bestOf={bestOf} numGames={numGames} gameNumber={gameNumber} onNext={handleNext} onBack={handleBack} onExtend={handleExtend} timestamps={timestamps}/>}
      {saveDialog&&<Confirm msg={"チーム・プレイヤー情報を\n設定画面に保存しますか？"} sub={"保存すると次のゲームで\n同じメンバーをすぐ使えます"} okLabel="保存する" cancelLabel="保存しない" thirdLabel="キャンセル（試合に戻る）" onOk={()=>doBack(true)} onCancel={()=>doBack(false)} onThird={()=>setSaveDialog(false)}/>}
    </div>);
}

export default function App(){
  const[scr,setScr]=useState(()=>{try{const p=JSON.parse(localStorage.getItem(PROGRESS_KEY));if(p&&p.history&&p.history.length>0)return"recover";}catch(e){}return"setup";});
  const[cfg,setCfg]=useState(null);const[saved,setSaved]=useState(null);const[recovery,setRecovery]=useState(null);
  useEffect(()=>{if(scr==="recover"){try{const p=JSON.parse(localStorage.getItem(PROGRESS_KEY));setRecovery(p);}catch(e){setScr("setup");}};},[]);
  const doRecover=()=>{if(!recovery)return;const r=recovery;setCfg({t:r.teams,o:r.teamOrder,ng:1,bo:0,dq:r.dqEndGame!==undefined?r.dqEndGame:true,sts:true,recover:r});setScr("game");};
  const dismissRecover=()=>{try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}setRecovery(null);setScr("setup");};
  if(scr==="recover"&&recovery){return(<div style={{width:"100%",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(170deg,#0f1f30,#14365a)",padding:20}}>
    <div style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 10px 36px rgba(0,0,0,0.25)"}}>
      <div style={{fontSize:44,marginBottom:8}}>🔄</div>
      <div style={{fontSize:22,fontWeight:800,color:"#14365a",marginBottom:6}}>未完了の試合があります</div>
      <div style={{fontSize:16,color:"#888",marginBottom:14}}>Game {recovery.gameNumber}、{recovery.currentTurn}ターン目まで記録があります。<br/>続きから再開しますか？</div>
      <div style={{display:"flex",gap:10}}><button onClick={doRecover} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"#14365a",color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer"}}>再開する</button><button onClick={dismissRecover} style={{flex:1,padding:"16px 0",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:18,fontWeight:700,cursor:"pointer"}}>破棄する</button></div>
    </div>
  </div>);}
  return(<div style={{width:"100%",height:"100dvh"}}>{scr==="setup"?<SetupScreen savedTeams={saved} onStart={(t,o,ng,bo,dq,sts)=>{setCfg({t,o,ng,bo,dq,sts});setScr("game");}}/>:<GameScreen initialTeams={cfg.t} initialOrder={cfg.o} bestOf={cfg.bo} numGames={cfg.ng} dqEnd={cfg.dq} saveToStatsProp={cfg.sts!==false} recoverData={cfg.recover||null} goBack={saveData=>{try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}if(saveData)setSaved(saveData);setScr("setup");setCfg(null);}}/>}</div>);
}

const SS={
  gW:{height:"100dvh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden",overscrollBehavior:"none"},
  tBtn:{padding:"6px 12px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,background:"transparent",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:12},
  mod:{background:"#fff",borderRadius:18,padding:20,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"auto",WebkitOverflowScrolling:"touch"},
  clsB:{width:38,height:38,border:"none",borderRadius:8,background:"#f0f0f0",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
};
