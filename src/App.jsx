import React, { useState, useEffect } from "react";
import { Target, RefreshCw, Trophy } from "lucide-react";

import { PROGRESS_KEY } from "./constants.js";
import { _db, _cache, idbGet, idbSet, idbDel, initDB, getShufAnim, setShufAnimLS } from "./db.js";
import { getSyncCode, pullFromServer } from "./sync.js";
import { getAIEnabled, setAIEnabledLS } from "./analysis.js";
import { SetupScreen } from "./components/SetupScreen.jsx";
import { GameScreen, useFavs } from "./components/GameScreen.jsx";
import { GameResult } from "./components/GameResult.jsx";
import { StatsModal } from "./components/StatsModal.jsx";
import { WindDebugOverlay } from "./components/WindDebugOverlay.jsx";
/* C: Prevent iOS context menu on buttons */
if(typeof document!=="undefined"){document.addEventListener("contextmenu",e=>{if(e.target&&!e.target.matches("input,textarea,a[href]"))e.preventDefault();},{passive:false});}

/* ═══ App ═══ */
export default function App(){
const{favs,addF,rmF,editF}=useFavs();
const windDebugEnabled=typeof window!=="undefined"&&new URLSearchParams(window.location.search).has("wind-debug");
const[windDebugLogs,setWindDebugLogs]=useState([]);
const[windDebugConnected,setWindDebugConnected]=useState(false);
const[windDebugPiAddress,setWindDebugPiAddress]=useState(null);
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
const doRecover=()=>{if(!recovery)return;const r=recovery;const cc=courtAllocation?courtAllocation.courtCount:1;setCfg({t:r.teams,o:r.teamOrder,ng:r.numGames||1,bo:r.bestOf||0,dq:r.dqEndGame!==undefined?r.dqEndGame:true,sts:true,recover:r,courtCount:cc,loc:r.selectedLocation||null});setScr("game");};
const dismissRecover=()=>{if(_db)idbDel(_db,"game-progress").catch(e=>console.error("progress delete error",e));try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}setRecovery(null);setScr("setup");};
if(!dbReady||scr==="loading"||(scr==="recover"&&!recovery)){return(<div style={{width:"100%",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))"}}>
<div style={{textAlign:"center"}}><div style={{marginBottom:12}}><Target size={48} color="var(--text-inverse)"/></div><div style={{fontSize:20,fontWeight:700,color:"var(--text-inverse)"}}>データ読み込み中...</div></div>

  </div>);}
  if(scr==="recover"&&recovery){return(<div style={{width:"100%",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))",padding:20}}>
    <div style={{background:"var(--bg-surface)",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"var(--shadow-lg)"}}>
      <div style={{marginBottom:8}}>{recovery.winner!=null?<Trophy size={44} color="var(--text-success)"/>:<RefreshCw size={44} color="var(--blue-500)"/>}</div>
      <div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",marginBottom:6}}>{recovery.winner!=null?"試合結果があります":"未完了の試合があります"}</div>
      <div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:14}}>{recovery.winner!=null?"Game "+recovery.gameNumber+"の結果を表示しますか？":((recovery.history||[]).length>0?"Game "+recovery.gameNumber+"、"+recovery.currentTurn+"ターン目まで記録があります。\n続きから再開しますか？":"Game "+recovery.gameNumber+"を開始しています。\n続きから再開しますか？")}</div>
      <div style={{display:"flex",gap:10}}><button onClick={doRecover} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:18,fontWeight:700,cursor:"pointer"}}>{recovery.winner!=null?"表示する":"再開する"}</button><button onClick={dismissRecover} style={{flex:1,padding:"16px 0",border:"2px solid var(--bg-secondary)",borderRadius:12,background:"transparent",color:"var(--text-primary)",fontSize:18,fontWeight:700,cursor:"pointer"}}>破棄する</button></div>
    </div>
  </div>);}
  return(<div style={{width:"100%",height:"100dvh"}}>{(scr==="setup"||!cfg)?<SetupScreen savedTeams={saved} isAdmin={isAdmin} onAdminToggle={setIsAdmin} aiEnabled={aiEnabled} onAIToggle={handleAIToggle} shufAnim={shufAnim} onShufAnimToggle={handleShufAnimToggle} courtAllocation={courtAllocation} onClearCourtAllocation={()=>{setCourtAllocation(null);if(_db)idbDel(_db,"court-allocation").catch(e=>console.error(e));}} setupDraft={setupDraft} onClearSetupDraft={()=>{setSetupDraft(null);if(_db)idbDel(_db,"setup-draft").catch(e=>{});}} autoReshuffleMode={autoReshuffleMode} onClearAutoReshuffle={()=>setAutoReshuffleMode(null)} onStart={(t,o,ng,bo,dq,sts,cc,caData,loc,piAddr)=>{setSetupDraft(null);if(_db)idbDel(_db,"setup-draft").catch(e=>{});if(caData)setCourtAllocation(caData);setCfg({t,o,ng,bo,dq,sts,courtCount:cc||1,loc:loc||null,piAddress:piAddr||null});setScr("game");}} favs={favs} addF={addF} rmF={rmF} editF={editF} StatsModal={StatsModal} windDebugEnabled={windDebugEnabled} onWindDebugLog={setWindDebugLogs} onWindDebugPiAddress={setWindDebugPiAddress}/>:<GameScreen initialTeams={cfg.t} initialOrder={cfg.o} bestOf={cfg.bo} numGames={cfg.ng} dqEnd={cfg.dq} saveToStatsProp={cfg.sts!==false} recoverData={cfg.recover||null} selectedLocation={cfg.loc||null} piAddress={cfg.piAddress||null} isAdmin={isAdmin} aiEnabled={aiEnabled} shufAnim={shufAnim} hasCourtAllocation={!!courtAllocation} clearCourtAllocation={()=>{setCourtAllocation(null);if(_db)idbDel(_db,"court-allocation").catch(e=>console.error(e));}} courtCount={cfg.courtCount||1} courtAllocation={courtAllocation} onUpdateCourtAllocation={(updatedData)=>{setCourtAllocation(updatedData);if(_db)idbSet(_db,"court-allocation",{...updatedData,savedAt:new Date().toISOString()}).catch(e=>console.error(e));}} goBack={(saveData,reshuffleType)=>{if(_db)idbDel(_db,"game-progress").catch(e=>console.error("progress delete error",e));try{localStorage.removeItem(PROGRESS_KEY);}catch(e){}if(saveData)setSaved(saveData);if(reshuffleType)setAutoReshuffleMode(reshuffleType);setScr("setup");setCfg(null);if(_db)idbGet(_db,"court-allocation").then(data=>{if(data&&data.courtData&&data.courtCount>=2)setCourtAllocation(data);}).catch(e=>console.error(e));}} GameResult={GameResult} StatsModal={StatsModal} windDebugEnabled={windDebugEnabled} onWindDebugLog={setWindDebugLogs} onWindDebugConnected={setWindDebugConnected}/>}{windDebugEnabled&&<WindDebugOverlay logs={windDebugLogs} connected={windDebugConnected} piAddress={cfg?.piAddress||windDebugPiAddress||null}/>}</div>);
}
