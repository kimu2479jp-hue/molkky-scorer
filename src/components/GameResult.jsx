import React, { useState, useRef, useEffect } from "react";
import { Trophy, BarChart3, Camera, ClipboardList, MessageCircle, RefreshCw } from "lucide-react";

import { WIN, MF, C, MAX_NAME } from "../constants.js";
import { loadFavs, saveWindData } from "../db.js";
import { pushWindData } from "../sync.js";
import { buildGameRecord } from "../stats.js";
import { scoreOf } from "../gameLogic.js";
import { ScoreTable } from "./common.jsx";
import { OrderPicker } from "./GameScreen.jsx";

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

export function GameResult({teams,history,teamOrder,winner,gameWins,bestOf,numGames,gameNumber,onNext,onBack,onExtend,onReshuffle,hasCourtAllocation,courtCount,timestamps,isAdmin,aiEnabled,autoEnd,dqEndGame,shufAnim,StatsModal,windSensorEnabled,piAddress,turnWindData,gameDateKey,windManagerRef}){
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
const startLP=()=>{statsLPRef.current=setTimeout(()=>{setShowStats("delete");},450);};
const cancelLP=()=>{if(statsLPRef.current)clearTimeout(statsLPRef.current);};
/* Save wind data to IndexedDB */
const windSavedRef=useRef(false);
useEffect(()=>{
if(!windSensorEnabled||!turnWindData||turnWindData.length===0||windSavedRef.current)return;
windSavedRef.current=true;
const gameId=gameDateKey||new Date().toISOString();
const manager=windManagerRef&&windManagerRef.current;
const windDataToSave={
windSensor:{enabled:true,piAddress:piAddress||null,compassHeadingInitial:manager?manager.compassHeadingInitial:null},
turnWindData:turnWindData,
windSummary:manager?manager.calcSummary(turnWindData):null,
};
saveWindData(gameId,windDataToSave).catch(e=>console.error("wind save error",e));
pushWindData(gameId,windDataToSave).catch(e=>console.warn("wind sync error",e));
},[]);
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
