import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, Star, Lock, Settings, Cloud, Upload, BarChart3 } from "lucide-react";

import { MAX_FAV, MAX_NAME, WIN, MF, H1, C, SS, DEV_MASTER_LIST, ANALYSIS_DAILY_MAX, LEVEL_NAMES } from "../constants.js";
import { ensureBlink, shuf, getFA } from "../gameLogic.js";
import { getSyncCode, setSyncCodeLS, maskSyncCode, pushToServer, pullFromServer, getPinLockout, incPinAttempt, clearPinLockout, setPinAuthTs, verifyPinOnServer, createPinOnServer, checkServerHasPin, getPinAuthTs } from "../sync.js";
import { getAnalysisTotal } from "../analysis.js";
import { loadPlayerLevels, savePlayerLevel } from "../db.js";

export function Confirm({msg,sub,okLabel,cancelLabel,thirdLabel,onOk,onCancel,onThird}){
return(<div style={SS.ov}><div className="mk-fade-scale-in" style={{background:"var(--bg-surface)",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"var(--shadow-lg)"}}>
<div style={{marginBottom:8}}><AlertTriangle size={44} color="var(--accent-yellow)"/></div>
<div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",marginBottom:6,whiteSpace:"pre-line"}}>{msg}</div>
{sub&&<div style={{fontSize:16,color:"var(--text-secondary)",marginBottom:14,whiteSpace:"pre-line"}}>{sub}</div>}
<div style={{display:"flex",gap:10,flexDirection:"column"}}><div style={{display:"flex",gap:10}}>
<button onClick={onOk} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:18,fontWeight:700,cursor:"pointer"}}>{okLabel||"確定"}</button>
<button onClick={onCancel} style={{flex:1,padding:"16px 0",border:"2px solid var(--bg-secondary)",borderRadius:12,background:"transparent",color:"var(--text-primary)",fontSize:18,fontWeight:700,cursor:"pointer"}}>{cancelLabel||"キャンセル"}</button>
</div>{onThird&&<button onClick={onThird} style={{padding:"14px 0",border:"2px solid var(--border-input)",borderRadius:12,background:"transparent",color:"var(--text-secondary)",fontSize:16,fontWeight:600,cursor:"pointer"}}>{thirdLabel||"戻る"}</button>}</div>

  </div></div>);
}

export function FavDropdown({favs,addF,rmF,editF,onPick,usedNames,isAdmin:isAdminProp}){
const[open,setOpen]=useState(false);const[newN,setNewN]=useState("");const[delTarget,setDelTarget]=useState(null);const[delConf,setDelConf]=useState(null);const[editTarget,setEditTarget]=useState(null);const[editName,setEditName]=useState("");
const longRef=useRef(null);const wrapRef=useRef(null);
const available=favs.filter(f=>!(usedNames||[]).includes(f));
const startLP=name=>{if(!isAdminProp)return;longRef.current=setTimeout(()=>setDelTarget(name),600);};const cancelLP=()=>{if(longRef.current)clearTimeout(longRef.current);};
return(<div ref={wrapRef} style={{position:"relative",display:"inline-block"}}>
<button onTouchEnd={e=>{e.preventDefault();setOpen(!open);setDelTarget(null);}} onClick={e=>{if(e.detail===0)return;setOpen(!open);setDelTarget(null);}} style={{width:40,height:40,border:"1px solid #d0dff0",borderRadius:8,background:open?"var(--accent-blue)":"#f0f6ff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:open?"#fff":"#d9a83a",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}><Star size={18}/></button>
{open&&(<div style={SS.ov} onClick={()=>{setOpen(false);setDelTarget(null);}}>
<div className="mk-fade-scale-in" style={{...SS.mod,maxWidth:360}} onClick={e=>e.stopPropagation()}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:18,fontWeight:800,color:"var(--text-primary)"}}>お気に入り</span><button onClick={()=>{setOpen(false);setDelTarget(null);}} style={SS.clsB}>✕</button></div>
{available.length===0&&<div style={{padding:12,textAlign:"center",color:"var(--text-muted)",fontSize:16}}>{favs.length===0?"登録なし":"全員配置済み"}</div>}
<div style={{maxHeight:300,overflow:"auto",WebkitOverflowScrolling:"touch"}}>{available.map(f=>(<div key={f}><button onPointerDown={()=>startLP(f)} onPointerUp={cancelLP} onPointerLeave={cancelLP} onClick={()=>{if(delTarget===f)setDelTarget(null);else{onPick(f);setOpen(false);}}} style={{width:"100%",padding:"12px 16px",border:"none",borderBottom:"1px solid var(--border-lighter)",background:delTarget===f?"#fde8e8":"transparent",fontSize:18,fontWeight:600,color:"var(--text-primary)",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span>{f}</span>{delTarget===f&&<div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
<span onClick={()=>{setEditTarget(f);setEditName(f);setDelTarget(null);}} style={{padding:"5px 10px",background:"var(--accent-blue)",color:"var(--text-inverse)",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer"}}>編集</span>
<span onClick={()=>{setDelConf(f);}} style={{padding:"5px 10px",background:"#e74c3c",color:"var(--text-inverse)",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer"}}>削除</span>
</div>}</button></div>))}</div>
<div style={{borderTop:"1px solid var(--border-lighter)",paddingTop:10,marginTop:4,flexShrink:0}}><div style={{display:"flex",gap:6}}>
<input value={newN} onChange={e=>setNewN(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder={"新規("+MAX_NAME+"文字)"} style={{flex:1,padding:"10px 12px",border:"1px solid var(--border-input)",borderRadius:8,fontSize:16,outline:"none"}}/>
<button onClick={()=>{if(newN.trim()&&favs.length<MAX_FAV){addF(newN.trim());setNewN("");}}} style={{padding:"10px 16px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"var(--text-inverse)",fontWeight:700,fontSize:15,cursor:"pointer",opacity:newN.trim()?1:0.3}}>登録</button>
</div>{favs.length>=MAX_FAV&&<div style={{fontSize:12,color:"var(--text-danger)",marginTop:4,textAlign:"center"}}>登録上限({MAX_FAV}人)に達しています</div>}</div>
</div></div>)}
{delConf&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setDelConf(null)}><div className="mk-fade-scale-in" style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:360,width:"90%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> お気に入り削除</div>
<div style={{fontSize:16,marginBottom:16}}>「{delConf}」をお気に入りから削除しますか？</div>
<div style={{display:"flex",gap:8}}><button onClick={()=>{rmF(delConf);setDelConf(null);setDelTarget(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button><button onClick={()=>setDelConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
</div></div>}
{editTarget&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setEditTarget(null)}><div className="mk-fade-scale-in" style={{background:"var(--bg-surface)",borderRadius:16,padding:24,maxWidth:360,width:"90%"}} onClick={e=>e.stopPropagation()}>
<div style={{fontSize:18,fontWeight:800,color:"var(--text-primary)",marginBottom:12}}>名前を編集</div>
<div style={{fontSize:14,color:"var(--text-muted)",marginBottom:8}}>{"\u300C"}{editTarget}{"\u300D\u2192"}</div>
<input value={editName} onChange={e=>setEditName(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} style={{width:"100%",padding:"12px",border:"1px solid var(--border-input)",borderRadius:8,fontSize:18,outline:"none",marginBottom:12,boxSizing:"border-box"}} autoFocus/>
{editName.trim()&&editName.trim()!==editTarget&&favs.includes(editName.trim())&&<div style={{fontSize:13,color:"var(--text-danger)",marginBottom:8}}>この名前は既に登録されています</div>}
<div style={{display:"flex",gap:8}}>
<button onClick={()=>{const ok=editF(editTarget,editName);if(ok){setEditTarget(null);setDelTarget(null);}}} disabled={!editName.trim()||editName.trim()===editTarget||favs.includes(editName.trim())} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--accent-blue)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer",opacity:(!editName.trim()||editName.trim()===editTarget||favs.includes(editName.trim()))?0.3:1}}>変更する</button>
<button onClick={()=>setEditTarget(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--border-input)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button>
</div>
</div></div>}

  </div>);
}

export function CSSConfetti(){const colors=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c","#ffd700","#ff69b4"];const pieces=Array.from({length:50},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],size:6+Math.random()*8,shape:Math.random()>0.5?"50%":"0"}));return(<div className="mk-confetti-container">{pieces.map(p=>(<div key={p.id} className="mk-confetti-piece" style={{left:p.left+"%",width:p.size,height:p.size,background:p.color,borderRadius:p.shape,animationDelay:p.delay+"s"}}/>))}</div>);}

/* ═══ Shuffle Card Animation ═══ */
export function ShuffleAnimation({names,teams,onDone,skipIntro,remainingDeck,isLastCourt,courtLabel,isMultiCourt,onSkipThisCourt,onSkipAll,onStartGame,onReshuffle}){
const nCards=names.length;const nTeams=teams.length;
const shufDur=nCards<=4?2:nCards<=6?3:nCards<=8?3.5:4;
const perCard=2.8;const dealDur=nCards*perCard;
const SUITS=["♠","♥","♦","♣"];
const vwSA=typeof window!=="undefined"?window.innerWidth:375;const isTabletSA=vwSA>=768;
const viewH=typeof window!=="undefined"?window.innerHeight:700;
const maxPT=Math.max(...teams.map(tm=>tm.players.length));
/* Dynamic card sizing: ratio 1:1.375 (card_back.JPG aspect) */
const margin=isTabletSA?32:16;const cardAreaTop=viewH*(isTabletSA?0.24:0.32);const cardAreaBot=viewH-15;
const availW=vwSA-margin*2;const availH2=cardAreaBot-cardAreaTop;
const colW2=availW/nTeams;const cardGap=isTabletSA?8:4;
const maxCW=colW2-cardGap*2;const maxCH=(availH2-(maxPT-1)*cardGap-40)/maxPT;
const rawW=Math.min(maxCW,maxCH/1.375);
const shrink=isTabletSA?(maxPT>=4?0.9:0.84):1;
const cardW=isTabletSA?Math.max(60,Math.min(220,Math.floor(rawW*shrink))):75;
const cardH=isTabletSA?Math.round(cardW*1.375):103;
const cx=vwSA/2;const deckCx=isTabletSA?margin+colW2*(nTeams-1)+colW2/2:cx;const cy=viewH*(isTabletSA?0.20:0.18)-(isTabletSA?cardH/5:0);
const actualCardHeight=maxPT*(cardH+cardGap)-cardGap+40;const availSpace=cardAreaBot-cardAreaTop;const bottomGap=availSpace-actualCardHeight;const cardAreaTopAdj=bottomGap>0?cardAreaTop+bottomGap*0.5:cardAreaTop;
/* Timing */
const T=skipIntro?{p0:0,p1:0,p1e:0,p2:0,p2e:0,p3:0,p3e:dealDur,p4:dealDur}:{p0:0,p1:2,p1e:2.5,p2:2.5,p2e:2.5+shufDur,p3:2.5+shufDur,p3e:2.5+shufDur+dealDur,p4:2.5+shufDur+dealDur};
const[phase,setPhase]=useState(0);const[t,setT]=useState(0);const startRef=useRef(null);const frameRef=useRef(null);
const[flash,setFlash]=useState(false);const dealIdxRef=useRef(-1);const revealTeamRef=useRef(-1);
const[closing,setClosing]=useState(false);const closingActionRef=useRef(null);const closeTRef=useRef(null);const[skipConfirm,setSkipConfirm]=useState(false);
const revealPos=useRef(shuf(names.map((_,i)=>i))).current;
const lastActivityRef=useRef(Date.now());
/* Team slot positions: columns for dealt cards */
const teamSlots=teams.map((_,i)=>({x:margin+colW2*i+colW2/2,yStart:cardAreaTopAdj+24}));
/* Initial card positions: scattered */
const spreadX=isTabletSA?240:130;const spreadY=isTabletSA?180:80;
const initPos=useRef(names.map((_,i)=>({x:cx-cardW/2+((i%3)-1)*spreadX,y:(isTabletSA?40:30)+Math.floor(i/3)*spreadY}))).current;
/* Animation loop */
useEffect(()=>{const animate=()=>{if(!startRef.current)startRef.current=Date.now();const el=(Date.now()-startRef.current)/1000;setT(el);
if(el<T.p1)setPhase(0);
else if(el<T.p1e)setPhase(1);
else if(el<T.p2e){setPhase(2);const shufT=el-T.p2;if(shufT>0.3&&shufT<shufDur-0.3&&Math.random()<0.04)setFlash(true);}
else if(el<T.p3e){setPhase(3);const dT=el-T.p3;const di=Math.floor(dT/perCard);if(di!==dealIdxRef.current&&di<nCards){dealIdxRef.current=di;lastActivityRef.current=Date.now();}}
else{setPhase(4);lastActivityRef.current=Date.now();const rT=el-T.p4;const ri=Math.floor(rT/(0.8/nTeams));if(ri!==revealTeamRef.current&&ri<nTeams){revealTeamRef.current=ri;}}
frameRef.current=requestAnimationFrame(animate);};
frameRef.current=requestAnimationFrame(animate);
return()=>{if(frameRef.current)cancelAnimationFrame(frameRef.current);};
},[]);
useEffect(()=>{if(flash){const tid=setTimeout(()=>setFlash(false),100);return()=>clearTimeout(tid);}},[flash]);
useEffect(()=>{if(closing){closeTRef.current=setTimeout(()=>{const action=closingActionRef.current;if(action==="start"&&onStartGame)onStartGame();else if(action==="reshuffle"&&onReshuffle)onReshuffle();else onDone();},400);return()=>clearTimeout(closeTRef.current);}},[closing]);
/* Safety valve: update activity on phase change + timeout based on total duration */
useEffect(()=>{lastActivityRef.current=Date.now();},[phase]);
useEffect(()=>{const totalDuration=(T.p4+5)*1000;const safetyId=setInterval(()=>{if(Date.now()-lastActivityRef.current>Math.max(totalDuration,15000)&&!closing){try{onDone();}catch(e){}}},3000);return()=>clearInterval(safetyId);},[closing]);
/* Card team lookup */
const getCardTeam=(idx)=>{let count=0;for(let ti=0;ti<nTeams;ti++){for(let pi=0;pi<teams[ti].players.length;pi++){if(count===idx)return{teamIdx:ti,inTeamIdx:pi};count++;}}return{teamIdx:0,inTeamIdx:0};};
/* Compute card outer position/scale/opacity (not flip) */
const getCardOuter=(idx)=>{
const ct=getCardTeam(idx);const ti2=ct.teamIdx;const inT=ct.inTeamIdx;
const target=teamSlots[ti2];const targetX=target.x-cardW/2;const targetY=target.yStart+inT*(cardH+cardGap);
const deckPos=revealPos[idx];const currentDealOrd=phase===3?Math.floor((t-T.p3)/perCard):-1;
if(phase===0){const prog=Math.min((t-T.p0)/2,1);const ease=1-Math.pow(1-prog,3);
const ix=initPos[idx].x;const iy=initPos[idx].y;const tx=cx-cardW/2;const ty=cy-cardH/2;
return{left:ix+(tx-ix)*ease,top:iy+(ty-iy)*ease,scale:0.6+0.4*ease,opacity:Math.min(prog*3,1),zIndex:9001+idx,rotate:0};}
if(phase===1){const prog=Math.min((t-T.p1)/0.5,1);const ease=1-Math.pow(1-prog,2);const stackOff=idx*2;
return{left:cx-cardW/2+stackOff*(1-ease),top:cy-cardH/2-stackOff*(1-ease),scale:1,opacity:1,zIndex:9001+idx,rotate:0};}
if(phase===2){const shufT=t-T.p2;const speed=8+idx*1.5;const ampBase=isTabletSA?200:90;const ampIdx2=isTabletSA?30:15;const amp=ampBase+idx*ampIdx2;
const offX=Math.sin(shufT*speed)*amp;const offY=Math.cos(shufT*speed*0.7)*(isTabletSA?70:30);const rot=Math.sin(shufT*speed)*45;
return{left:cx-cardW/2+offX,top:cy-cardH/2+offY,scale:1,opacity:1,zIndex:9001+idx,rotate:rot};}
if(phase===3){const cardDealTime=T.p3+deckPos*perCard;const tLocal=t-cardDealTime;
const liftD=0.3,flipD=0.5,holdD=1.0,moveD=0.5,landD=0.5;
if(t<cardDealTime){const stackIdx=deckPos-Math.max(0,currentDealOrd+1);const sOff=Math.min(Math.max(0,stackIdx),10);
return{left:deckCx-cardW/2+sOff,top:cy-cardH/2+sOff,scale:1,opacity:1,zIndex:9010+nCards-deckPos,rotate:0};}
if(tLocal<liftD){const prog=tLocal/liftD;
return{left:deckCx-cardW/2,top:cy-cardH/2-prog*30,scale:1,opacity:1,zIndex:9100,rotate:0};}
if(tLocal<liftD+flipD){return{left:deckCx-cardW/2,top:cy-cardH/2-30,scale:1,opacity:1,zIndex:9100,rotate:0};}
if(tLocal<liftD+flipD+holdD){const hp=(tLocal-liftD-flipD)/holdD;const sc=1+0.12*Math.sin(hp*Math.PI);
return{left:deckCx-cardW/2,top:cy-cardH/2-30,scale:sc,opacity:1,zIndex:9100,rotate:0};}
if(tLocal<liftD+flipD+holdD+moveD){const prog=(tLocal-liftD-flipD-holdD)/moveD;const ease=1-Math.pow(1-prog,3);
const fromX=deckCx-cardW/2,fromY=cy-cardH/2-30;const sc=1-0.7*ease;
return{left:fromX+(targetX-fromX)*ease,top:fromY+(targetY-fromY)*ease,scale:sc,opacity:1,zIndex:9100-Math.floor(prog*50),rotate:0};}
if(tLocal<perCard){const prog=(tLocal-liftD-flipD-holdD-moveD)/landD;
const sc=prog<0.6?0.3+0.75*(prog/0.6):1.05-0.05*((prog-0.6)/0.4);
return{left:targetX,top:targetY,scale:sc,opacity:1,zIndex:9001+idx,rotate:0};}
return{left:targetX,top:targetY,scale:1,opacity:1,zIndex:9001+idx,rotate:0};}
if(phase===4){return{left:targetX,top:targetY,scale:1,opacity:0,zIndex:9001+idx,rotate:0};}
return{left:cx-cardW/2,top:cy-cardH/2,scale:1,opacity:0,zIndex:9001,rotate:0};
};
/* Compute flip degree for CSS 3D card rotation */
const getFlipDeg=(idx)=>{
if(phase<=2)return 0;if(phase>=4)return 180;
const cardDealTime=T.p3+revealPos[idx]*perCard;const tLocal=t-cardDealTime;
const liftD=0.3,flipD=0.5;
if(tLocal<liftD)return 0;if(tLocal<liftD+flipD){return((tLocal-liftD)/flipD)*180;}return 180;
};
/* Dealer position and size */
const dealerY=phase>=3?viewH*(isTabletSA?0.18:0.05):viewH*(isTabletSA?0.18:0.10);
const dealerScale=phase===0?1+Math.min(t/2,1)*0.8:1.8;
const dealerOp=phase>=4?0.4:Math.min(t*2,1);
const overlayOp=closing?0:1;
/* Corner number/suit font sizes proportional to card */
const cornerNum=isTabletSA?Math.round(cardH*0.18):17;const cornerSuit=isTabletSA?Math.round(cardH*0.16):15;
try{
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,"+(0.85*overlayOp)+")",zIndex:9000,pointerEvents:"auto",transition:closing?"opacity 0.4s ease":"none",opacity:closing?0:1}}>
{/* Dealer character image */}
<div style={{position:"fixed",left:cx-(isTabletSA?80:50),top:dealerY-(isTabletSA?100:70),opacity:phase===0?Math.min(t*2,1):phase===1?1:phase===2?0.7:phase>=4?0.4:0.85,transform:"scale("+dealerScale+")",transformOrigin:"50% 80%",transition:"none",willChange:"transform",zIndex:8999,pointerEvents:"none"}}>
<img src="/dealer-character.png" alt="" style={{width:isTabletSA?160:100,height:isTabletSA?160:100,objectFit:"contain",pointerEvents:"none",filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.5))"}}/>
</div>
{/* Flash effect */}
{flash&&<div style={{position:"fixed",inset:0,background:"rgba(255,255,255,0.2)",zIndex:9050,pointerEvents:"none"}}/>}
{/* Team labels at top of columns (phase 3+) */}
{phase>=3&&teamSlots.map((sl,ti)=>(<div key={ti} style={{position:"fixed",left:sl.x-(colW2/2),top:sl.yStart-24,width:colW2,textAlign:"center",zIndex:9001,opacity:0.9,pointerEvents:"none"}}>
<div style={{fontSize:isTabletSA?24:14,fontWeight:900,color:C[ti].ac,textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{teams[ti].name}</div>
</div>))}
{/* Cards (all phases) - CSS 3D flip */}
{names.map((name,idx)=>{const ct=getCardTeam(idx);const ac=C[ct.teamIdx]?C[ct.teamIdx].ac:"#888";const suit=SUITS[ct.teamIdx]||SUITS[0];const orderNum=ct.inTeamIdx+1;
const outer=getCardOuter(idx);const flipDeg=getFlipDeg(idx);const br=isTabletSA?16:12;
const vName=name.length>7?name.slice(0,7):name;const nl=vName.length;
const vFs=isTabletSA?(nl<=2?41:nl<=3?36:nl<=4?34:nl<=5?29:nl<=6?26:24):(nl<=2?19:nl<=3?16:nl<=4?14:nl<=5?13:nl<=6?12:11);
const vLs=nl<=2?"6px":nl<=3?"4px":"2px";
const cardDealTime2=T.p3+revealPos[idx]*perCard;const holdStart2=cardDealTime2+0.8;const holdEnd2=holdStart2+1.0;
const isHolding=phase===3&&t>=holdStart2&&t<holdEnd2;const holdProg2=isHolding?(t-holdStart2)/1.0:0;
const glowSh=isHolding?", 0 0 30px "+ac+"66":"";
return(<div key={idx} style={{position:"fixed",left:outer.left,top:outer.top,width:cardW,height:cardH,
perspective:"800px",WebkitPerspective:"800px",zIndex:outer.zIndex,opacity:outer.opacity,
transform:"scale("+outer.scale+")"+(outer.rotate?" rotate("+outer.rotate+"deg)":""),transition:"none",willChange:"transform"}}>
<div style={{width:"100%",height:"100%",transformStyle:"preserve-3d",WebkitTransformStyle:"preserve-3d",
transform:"rotateY("+Math.round(flipDeg)+"deg)",transition:"none",position:"relative"}}>
{/* Back face */}
<div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",
borderRadius:br,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
<img src="/card_back.JPG" alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:br,pointerEvents:"none"}}/>
</div>
{/* Front face */}
<div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",WebkitBackfaceVisibility:"hidden",
transform:"rotateY(180deg)",borderRadius:br,background:"#fff",overflow:"hidden",
boxShadow:"0 4px 20px rgba(0,0,0,0.3)"+glowSh,display:"flex",alignItems:"center",justifyContent:"center"}}>
<div style={{position:"absolute",top:0,left:0,right:0,height:3,borderRadius:br+" "+br+" 0 0",background:ac}}/>
<div style={{position:"absolute",inset:"6px 6px 6px 6px",border:"1px solid "+ac+"4d",borderRadius:6}}/>
<div style={{position:"absolute",top:4,left:5,textAlign:"center",lineHeight:1}}>
<div style={{fontSize:cornerNum,fontWeight:900,color:ac}}>{orderNum}</div>
<div style={{fontSize:cornerSuit,color:ac,marginTop:-2}}>{suit}</div>
</div>
<div style={{position:"absolute",bottom:4,right:5,textAlign:"center",lineHeight:1,transform:"rotate(180deg)"}}>
<div style={{fontSize:cornerNum,fontWeight:900,color:ac}}>{orderNum}</div>
<div style={{fontSize:cornerSuit,color:ac,marginTop:-2}}>{suit}</div>
</div>
<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100% - "+(cornerNum*3+16)+"px)"}}>
<div style={{writingMode:"vertical-rl",WebkitWritingMode:"vertical-rl",textOrientation:"upright",WebkitTextOrientation:"upright",fontSize:vFs,fontWeight:800,color:"#1a1a2e",letterSpacing:vLs,lineHeight:1,whiteSpace:"nowrap"}}>{vName}</div>
</div>
{isHolding&&<div style={{position:"absolute",top:0,bottom:0,width:40,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)",borderRadius:10,left:-40+(holdProg2*(cardW+80)),pointerEvents:"none"}}/>}
</div>
</div>
</div>);})}
{/* Remaining deck cards for multi-court */}
{remainingDeck>0&&phase>=3&&Array.from({length:Math.min(remainingDeck,8)},(_,i)=>(<div key={"rem"+i} style={{position:"fixed",left:deckCx-cardW/2+i*1,top:cy-cardH/2-i*1,width:cardW,height:cardH,borderRadius:isTabletSA?16:12,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.3)",zIndex:9000+i,opacity:dealIdxRef.current>=nCards-1?0.7:1}}><img src="/card_back.JPG" alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:isTabletSA?16:12,pointerEvents:"none"}}/></div>))}
{/* Phase 4: team reveal panel overlay */}
{phase===4&&(<div style={{position:"fixed",inset:0,zIndex:9050,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isTabletSA?24:16,opacity:Math.min(1,(t-T.p4)/0.3)}}>
<div style={{display:isTabletSA&&nTeams>=3?"grid":"flex",gridTemplateColumns:isTabletSA&&nTeams>=3?"1fr 1fr":undefined,gap:isTabletSA?20:12,justifyContent:"center",flexWrap:"wrap",maxWidth:"100%",width:isTabletSA?"90%":undefined}}>
{teams.map((tm,ti)=>(<div key={ti} style={{background:"rgba(0,0,0,0.6)",border:(isTabletSA?4:3)+"px solid "+C[ti].ac,borderRadius:isTabletSA?20:16,padding:isTabletSA?"20px 28px":"16px 20px",minWidth:isTabletSA?undefined:140,maxWidth:isTabletSA?undefined:200,minHeight:isTabletSA?280:undefined,flex:isTabletSA&&nTeams>=3?undefined:"1 1 0",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",transform:"scale("+(Math.min(1,(t-T.p4-ti*0.15)/0.3))+")",transition:"none"}}>
<div style={{fontSize:isTabletSA?26:13,fontWeight:700,color:"rgba(255,255,255,0.7)",textAlign:"center",marginBottom:isTabletSA?4:2}}>{ti+1}番目</div>
<div style={{fontSize:isTabletSA?38:22,fontWeight:900,color:C[ti].ac,textAlign:"center",marginBottom:isTabletSA?14:8,textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{tm.name}</div>
<div style={{borderTop:(isTabletSA?3:2)+"px solid "+C[ti].ac+"66",paddingTop:isTabletSA?12:8}}>
{tm.players.map((p,pi)=>(<div key={pi} style={{fontSize:isTabletSA?30:18,fontWeight:700,color:"#fff",textAlign:"center",padding:isTabletSA?"6px 0":"4px 0",textShadow:"0 1px 2px rgba(0,0,0,0.4)"}}>{p}</div>))}
</div>
</div>))}
</div>
{!isMultiCourt&&onStartGame&&onReshuffle?(
<div style={{display:"flex",flexDirection:"column",gap:isTabletSA?12:8,marginTop:isTabletSA?28:20,width:"100%",maxWidth:isTabletSA?400:280,alignItems:"center"}}>
<button onClick={()=>{closingActionRef.current="start";setClosing(true);}} style={{width:"100%",padding:isTabletSA?"16px 0":"14px 0",border:"none",borderRadius:isTabletSA?14:12,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:isTabletSA?24:18,fontWeight:900,cursor:"pointer",letterSpacing:2}}>試合開始</button>
<div style={{display:"flex",gap:isTabletSA?12:8,width:"100%"}}>
<button onClick={()=>{closingActionRef.current="reshuffle";setClosing(true);}} style={{flex:1,padding:isTabletSA?"14px 0":"12px 0",border:"2px solid rgba(255,255,255,0.5)",borderRadius:isTabletSA?14:12,background:"transparent",color:"#fff",fontSize:isTabletSA?20:15,fontWeight:800,cursor:"pointer"}}>再シャッフル</button>
<button onClick={()=>{closingActionRef.current=null;setClosing(true);}} style={{flex:1,padding:isTabletSA?"14px 0":"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:isTabletSA?14:12,background:"transparent",color:"rgba(255,255,255,0.7)",fontSize:isTabletSA?20:15,fontWeight:700,cursor:"pointer"}}>戻る</button>
</div>
</div>
):(
<button onClick={()=>{closingActionRef.current=null;setClosing(true);}} style={{marginTop:isTabletSA?28:20,padding:isTabletSA?"16px 40px":"14px 48px",border:"2px solid rgba(255,255,255,0.5)",borderRadius:isTabletSA?14:12,background:"transparent",color:"#fff",fontSize:isTabletSA?28:18,fontWeight:800,cursor:"pointer",opacity:Math.min(1,Math.max(0,(t-T.p4-0.5)/0.3)),transition:"opacity 0.2s"}}>{isMultiCourt&&!isLastCourt?"次のコートへ ▶":isMultiCourt&&isLastCourt?"コート一覧へ ▶":"閉じる"}</button>
)}
</div>)}
{/* Court label for multi-court */}
{courtLabel&&<div style={{position:"fixed",top:"calc(16px + env(safe-area-inset-top, 0px))",left:isTabletSA?32:16,zIndex:9200,pointerEvents:"none"}}><span style={{fontSize:isTabletSA?22:16,fontWeight:900,color:"rgba(255,255,255,0.9)",background:"rgba(0,0,0,0.5)",padding:isTabletSA?"8px 24px":"6px 16px",borderRadius:12,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>{courtLabel}</span></div>}
{/* Skip button during animation */}
{phase<4&&!closing&&!skipConfirm&&<button onClick={()=>setSkipConfirm(true)} style={{position:"fixed",bottom:"calc(24px + env(safe-area-inset-bottom, 0px))",right:20,padding:"8px 16px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:20,background:"rgba(0,0,0,0.4)",color:"rgba(255,255,255,0.7)",fontSize:13,fontWeight:600,cursor:"pointer",zIndex:9200,backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>スキップ ⏭</button>}
{/* Skip confirm dialog */}
{skipConfirm&&<div style={{position:"fixed",inset:0,zIndex:9300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>
<div style={{background:"#1a1a2e",border:"1px solid rgba(255,255,255,0.2)",borderRadius:16,padding:"24px 28px",textAlign:"center",maxWidth:isMultiCourt?320:280}}>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>スキップしますか？</div>
{isMultiCourt?(<div style={{display:"flex",flexDirection:"column",gap:8}}>
<button onClick={()=>{setSkipConfirm(false);if(onSkipThisCourt)onSkipThisCourt();}} style={{padding:"12px 0",border:"none",borderRadius:10,background:"var(--accent-blue,#2b7de9)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>このコートはスキップ</button>
<button onClick={()=>{setSkipConfirm(false);if(onSkipAll)onSkipAll();}} style={{padding:"12px 0",border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>全てスキップ</button>
<button onClick={()=>setSkipConfirm(false)} style={{padding:"12px 0",border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:14,fontWeight:600,cursor:"pointer"}}>いいえ</button>
</div>):(<div style={{display:"flex",gap:10,justifyContent:"center"}}>
<button onClick={()=>{setSkipConfirm(false);startRef.current=performance.now()/1000-T.p4-0.5;}} style={{flex:1,padding:"10px 0",border:"none",borderRadius:10,background:"var(--accent-blue,#2b7de9)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>はい</button>
<button onClick={()=>setSkipConfirm(false)} style={{flex:1,padding:"10px 0",border:"1px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>いいえ</button>
</div>)}
</div>
</div>}
</div>);
}catch(e){console.error("ShuffleAnimation error:",e);try{onDone();}catch(e2){}return null;}
}

export function SmartFavPicker({favs,stats,usedNames,onAdd,onClose,maxMembers,currentCount,minMembers}){
const usedSet=new Set(Array.isArray(usedNames)?usedNames:[]);
const[selected,setSelected]=useState(()=>{const s=new Set();const showDev=(()=>{try{if(localStorage.getItem("mk-dev-master")==="1")return true;const params=new URLSearchParams(window.location.search);if(params.get("dev")==="1")return true;return false;}catch(e){return false;}})();if(showDev){DEV_MASTER_LIST.forEach(n=>{if(favs.includes(n)&&!usedSet.has(n))s.add(n);});}return s;});
const[deselected,setDeselected]=useState(()=>new Set());
const showDevMaster=(()=>{try{if(localStorage.getItem("mk-dev-master")==="1")return true;const params=new URLSearchParams(window.location.search);if(params.get("dev")==="1")return true;return false;}catch(e){return false;}})();
const classify=(name)=>{if(showDevMaster&&DEV_MASTER_LIST.includes(name))return"master";if(!showDevMaster&&DEV_MASTER_LIST.includes(name))return"regular";const gs=stats[name]||[];const gc=gs.length;if(gc===0)return"never";const lastDate=gs.reduce((lat,g)=>{const d=new Date(g.d);return d>lat?d:lat;},new Date(0));const days=Math.floor((new Date()-lastDate)/(1000*60*60*24));if(days<=14&&gc>=5)return"regular";if(days<=30&&gc>=2)return"semi";return"occasional";};
const grouped={};favs.forEach(name=>{const g=classify(name);if(!grouped[g])grouped[g]=[];const gs=stats[name]||[];grouped[g].push({name,gameCount:gs.length});});
Object.values(grouped).forEach(arr=>arr.sort((a,b)=>b.gameCount-a.gameCount));
const GC=[{key:"master",label:"master",color:"#1a1a2e",accent:"#ffd700",show:showDevMaster},{key:"regular",label:"常連",color:"#22b566"},{key:"semi",label:"準レギュラー",color:"#2b7de9"},{key:"occasional",label:"たまに参加",color:"#f0a030"},{key:"never",label:"未参加",color:"#999"}];
const toggle=(name)=>{if(usedSet.has(name)){setDeselected(p=>{const n=new Set(p);if(n.has(name))n.delete(name);else n.add(name);return n;});return;}setSelected(p=>{const n=new Set(p);if(n.has(name))n.delete(name);else n.add(name);return n;});};
const toggleGroup=(members)=>{const selectable=members.filter(f=>!usedSet.has(f.name)).map(f=>f.name);const allSel=selectable.length>0&&selectable.every(n=>selected.has(n));setSelected(p=>{const n=new Set(p);if(allSel)selectable.forEach(nm=>n.delete(nm));else selectable.forEach(nm=>n.add(nm));return n;});const addedInGroup=members.filter(f=>usedSet.has(f.name)).map(f=>f.name);const allDesel=addedInGroup.length>0&&addedInGroup.every(n=>deselected.has(n));setDeselected(p=>{const n=new Set(p);if(allDesel)addedInGroup.forEach(nm=>n.delete(nm));else addedInGroup.forEach(nm=>n.add(nm));return n;});};
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#fff",borderRadius:16,padding:16,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
<div style={{fontSize:18,fontWeight:800,color:"#14365a"}}>{"☆"} お気に入りから選択</div>
<button onClick={onClose} style={{padding:"4px 12px",border:"1px solid #ddd",borderRadius:8,background:"transparent",color:"#666",fontSize:18,fontWeight:700,cursor:"pointer"}}>{"✕"}</button>
</div>
{GC.filter(g=>g.show!==false).map(gc=>{const members=grouped[gc.key]||[];if(members.length===0)return null;
const selectable=members.filter(f=>!usedSet.has(f.name)).map(f=>f.name);const allSel=selectable.length>0&&selectable.every(n=>selected.has(n));
return(<div key={gc.key} style={{marginBottom:10}}>
<div onClick={()=>toggleGroup(members)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,background:(gc.accent||gc.color)+"11",border:"1px solid "+(gc.accent||gc.color)+"33",cursor:"pointer",marginBottom:4}}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<div style={{width:18,height:18,borderRadius:4,border:allSel?"none":"2px solid "+(gc.accent||gc.color)+"66",background:allSel?(gc.accent||gc.color):"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:900}}>{allSel&&"✓"}</div>
{gc.key==="master"?<span style={{fontSize:14,fontWeight:800,color:gc.color}}>{"◤"} 開発者{"《"}<span style={{fontStyle:"italic",fontWeight:900}}>Master</span>{"》◢"}</span>:<span style={{fontSize:14,fontWeight:800,color:gc.color}}>{gc.label}</span>}
</div>
<span style={{fontSize:12,color:(gc.accent||gc.color)+"99"}}>{members.length}人</span>
</div>
<div style={{display:"flex",flexWrap:"wrap",gap:5,paddingLeft:4}}>
{members.map(fav=>{const isAdded=usedSet.has(fav.name);const isDesel=deselected.has(fav.name);const isSel=selected.has(fav.name);return(
<button key={fav.name} onClick={()=>toggle(fav.name)} style={{padding:"6px 14px",borderRadius:20,border:isSel?"2px solid "+gc.color:isAdded&&!isDesel?"2px solid "+gc.color+"66":"1px solid #ddd",background:isAdded&&isDesel?"#fee":isAdded?gc.color+"10":isSel?gc.color+"15":"#fff",color:isAdded&&isDesel?"#c00":isAdded?gc.color:isSel?gc.color:"#1a1a2e",fontSize:14,fontWeight:isSel||isAdded?800:600,cursor:"pointer",opacity:isAdded&&isDesel?0.6:1,textDecoration:isAdded&&isDesel?"line-through":"none"}}>{fav.name}{isAdded&&!isDesel&&<span style={{fontSize:9,marginLeft:4,color:gc.color+"88"}}>追加済</span>}<span style={{fontSize:10,marginLeft:4,color:isAdded?"#ccc":"#aaa"}}>{fav.gameCount}</span></button>);})}
</div></div>);})}
{maxMembers&&(selected.size+(currentCount||0)-deselected.size)>maxMembers&&<div style={{padding:"8px 12px",background:"#fff3e0",borderRadius:8,marginTop:6,fontSize:13,fontWeight:700,color:"#e65100"}}>上限を超えています（最大{maxMembers}人）</div>}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid #eee",paddingTop:12,marginTop:10}}>
<div style={{fontSize:14,fontWeight:700,color:"#1a1a2e"}}>選択中: <span style={{color:"#2b7de9"}}>{selected.size}人</span>{deselected.size>0&&<span style={{color:"#e74c3c",marginLeft:8}}>解除: {deselected.size}人</span>}</div>
<button onClick={()=>{const toAdd=[...selected];const toRemove=[...deselected];onAdd({toAdd,toRemove});onClose();}} disabled={maxMembers&&(selected.size+(currentCount||0)-deselected.size)>maxMembers} style={{padding:"10px 24px",border:"none",borderRadius:10,background:(selected.size>0||deselected.size>0)&&!(maxMembers&&(selected.size+(currentCount||0)-deselected.size)>maxMembers)?"#2b7de9":"#ccc",color:"#fff",fontSize:15,fontWeight:800,cursor:(selected.size>0||deselected.size>0)?"pointer":"default",opacity:maxMembers&&(selected.size+(currentCount||0)-deselected.size)>maxMembers?0.3:1}}>追加する</button>
</div></div></div>);
}

export function CourtRevealPanel({teams,courtLabel,isLast,onNext}){
const vwSA=typeof window!=="undefined"?window.innerWidth:375;const isTabletSA=vwSA>=768;const nTeams=teams.length;
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:isTabletSA?24:16}}>
{courtLabel&&<div style={{position:"fixed",top:"calc(16px + env(safe-area-inset-top, 0px))",left:isTabletSA?32:16,zIndex:9200}}><span style={{fontSize:isTabletSA?22:16,fontWeight:900,color:"rgba(255,255,255,0.9)",background:"rgba(0,0,0,0.5)",padding:isTabletSA?"8px 24px":"6px 16px",borderRadius:12}}>{courtLabel}</span></div>}
<div style={{display:isTabletSA&&nTeams>=3?"grid":"flex",gridTemplateColumns:isTabletSA&&nTeams>=3?"1fr 1fr":undefined,gap:isTabletSA?20:12,justifyContent:"center",flexWrap:"wrap",maxWidth:"100%",width:isTabletSA?"90%":undefined}}>
{teams.map((tm,ti)=>(<div key={ti} style={{background:"rgba(0,0,0,0.6)",border:(isTabletSA?4:3)+"px solid "+C[ti].ac,borderRadius:isTabletSA?20:16,padding:isTabletSA?"20px 28px":"16px 20px",minWidth:isTabletSA?undefined:140,maxWidth:isTabletSA?undefined:200,minHeight:isTabletSA?280:undefined,flex:isTabletSA&&nTeams>=3?undefined:"1 1 0",backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)"}}>
<div style={{fontSize:isTabletSA?26:13,fontWeight:700,color:"rgba(255,255,255,0.7)",textAlign:"center",marginBottom:isTabletSA?4:2}}>{ti+1}番目</div>
<div style={{fontSize:isTabletSA?38:22,fontWeight:900,color:C[ti].ac,textAlign:"center",marginBottom:isTabletSA?14:8,textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{tm.name}</div>
<div style={{borderTop:(isTabletSA?3:2)+"px solid "+C[ti].ac+"66",paddingTop:isTabletSA?12:8}}>
{tm.players.map((p,pi)=>(<div key={pi} style={{fontSize:isTabletSA?30:18,fontWeight:700,color:"#fff",textAlign:"center",padding:isTabletSA?"6px 0":"4px 0",textShadow:"0 1px 2px rgba(0,0,0,0.4)"}}>{p}</div>))}
</div></div>))}
</div>
<button onClick={onNext} style={{marginTop:isTabletSA?28:20,padding:isTabletSA?"16px 40px":"14px 48px",border:"2px solid rgba(255,255,255,0.5)",borderRadius:isTabletSA?14:12,background:"transparent",color:"#fff",fontSize:isTabletSA?28:18,fontWeight:800,cursor:"pointer"}}>{isLast?"閉じる":"次のコートへ ▶"}</button>
</div>);
}

export function CourtOverview({courtData,courtCount,courtTeamCounts,numGames,bestOf,dqEnd,saveToStats,onStartGame,onBack}){
const isTab=typeof window!=="undefined"&&window.innerWidth>=768;
const[backConfirm,setBackConfirm]=useState(false);
const handleStartGame=()=>{const teams=courtData[1];const order=Array.from({length:teams.length},(_,i)=>i);onStartGame(teams,order);};
return(<div style={{position:"fixed",inset:0,zIndex:8000,height:"100dvh",display:"flex",flexDirection:"column",overflow:"auto",background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))",WebkitOverflowScrolling:"touch",overscrollBehavior:"none"}}>
<div style={{padding:"calc(16px + env(safe-area-inset-top, 0px)) 20px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{fontSize:22,fontWeight:900,color:"var(--text-inverse)"}}>全コート メンバー一覧</div>
<button onClick={()=>setBackConfirm(true)} style={{padding:"10px 20px",border:"2px solid rgba(255,255,255,0.4)",borderRadius:12,background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)"}}>{"←"} 戻る</button>
</div>
<div style={{flex:1,padding:"0 16px 16px",overflow:"auto"}}>
{[1,2,3].filter(c=>c<=courtCount).map(cNum=>{const teams=courtData[cNum]||[];const nTeams=teams.length;const icon=cNum===1?"📱":"📋";const label=cNum===1?cNum+"コート（端末）":cNum+"コート（紙）";
return(<div key={cNum} style={{background:cNum===1?"rgba(43,125,233,0.08)":"rgba(255,255,255,0.04)",border:cNum===1?"2px solid rgba(43,125,233,0.3)":"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
<div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{icon} {label}</div>
</div>
<div style={{display:"grid",gridTemplateColumns:nTeams>=2?"1fr 1fr":"1fr",gap:10,marginTop:10}}>
{teams.map((t,ti)=>(<div key={ti} style={{background:"rgba(255,255,255,0.95)",borderRadius:12,padding:"12px 14px",borderLeft:"5px solid "+C[ti%4].ac}}>
<div style={{display:"flex",alignItems:"center",gap:6}}>
<div style={{width:22,height:22,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:12,background:C[ti%4].ac}}>{ti+1}</div>
<div style={{fontSize:16,fontWeight:800,color:C[ti%4].ac}}>{t.name}</div>
</div>
<div style={{paddingLeft:28,marginTop:4}}>{t.players.map((p,pi)=>(<div key={pi} style={{fontSize:15,fontWeight:600,color:"#333",lineHeight:1.6}}>{p}</div>))}</div>
</div>))}
</div></div>);
})}
<button onClick={handleStartGame} style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"var(--text-inverse)",fontSize:28,fontWeight:900,cursor:"pointer",letterSpacing:3,boxShadow:"0 3px 16px rgba(43,125,233,0.3)",marginTop:8}}>{"📱"} 1コートで試合開始</button>
</div>
{backConfirm&&(<div style={{position:"fixed",inset:0,zIndex:9500,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",WebkitBackdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
<div style={{background:"#1a1a2e",borderRadius:16,padding:"24px 28px",maxWidth:360,width:"100%"}}>
<div style={{fontSize:16,fontWeight:700,color:"#fff",marginBottom:16}}>セットアップに戻りますか？</div>
<div style={{display:"flex",gap:10}}>
<button onClick={()=>{setBackConfirm(false);onBack();}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--accent-blue)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
<button onClick={()=>setBackConfirm(false)} style={{flex:1,padding:"12px 0",border:"2px solid rgba(255,255,255,0.3)",borderRadius:10,background:"transparent",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>いいえ</button>
</div></div></div>)}
</div>);
}

export function MultiCourtShuffleManager({courtData,courtCount,courtOrder,onAllDone,onSkipAll}){
const[currentCourtIdx,setCurrentCourtIdx]=useState(0);
const[skipToReveal,setSkipToReveal]=useState(false);
const lastIdxRef=useRef(0);
if(currentCourtIdx>=0)lastIdxRef.current=currentCourtIdx;
const safeIdx=currentCourtIdx>=0?currentCourtIdx:lastIdxRef.current;
const currentCourtNum=courtOrder[safeIdx];
const isFirst=safeIdx===0;
const isLast=safeIdx===courtOrder.length-1;
const currentTeams=courtData[currentCourtNum];
const currentNames=currentTeams.flatMap(t=>t.players);
const remainingCards=courtOrder.slice(safeIdx+1).reduce((sum,cn)=>sum+courtData[cn].flatMap(t=>t.players).length,0);
const courtLabel=currentCourtNum===1?"📱 1コート（端末）":"📋 "+currentCourtNum+"コート（紙）";
const handleCourtDone=()=>{setCurrentCourtIdx(-1);setSkipToReveal(false);setTimeout(()=>{if(isLast){onAllDone(courtData);}else{setCurrentCourtIdx(safeIdx+1);}},50);};
const handleSkipThisCourt=()=>{setSkipToReveal(true);};
if(currentCourtIdx<0)return null;
return(<>{skipToReveal?(<CourtRevealPanel teams={currentTeams} courtLabel={courtLabel} isLast={isLast} onNext={handleCourtDone}/>):(<ShuffleAnimation names={currentNames} teams={currentTeams} onDone={handleCourtDone} skipIntro={!isFirst} remainingDeck={remainingCards} isLastCourt={isLast} courtLabel={courtLabel} isMultiCourt={true} onSkipThisCourt={handleSkipThisCourt} onSkipAll={()=>onSkipAll(courtData)}/>)}</>);
}

export const VT={writingMode:"vertical-rl",WebkitWritingMode:"vertical-rl",textOrientation:"upright",WebkitTextOrientation:"upright",letterSpacing:"-1px",lineHeight:1,margin:"0 auto",whiteSpace:"nowrap",overflow:"hidden",display:"inline-block"};

export function ScoreTable({teams,history,teamOrder,highlightLast,fontSize,colW,roundW,nameH,activeCell,forCapture,dqWinnerIdx}){
const fs=fontSize||18;const cw=colW||60;const rw=roundW||44;const nh=nameH||100;
const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
/* For dqWin: find last turn for winner to override 計 to 50 */
const dqWinLastTurn=dqWinnerIdx!=null?Math.max(0,...history.filter(h=>h.teamIndex===dqWinnerIdx).map(h=>h.turn)):null;
/* iPhone collapse: hide non-active player cols when total players >= 6 */
const vwST=typeof window!=="undefined"?window.innerWidth:375;const isTabletST=vwST>=768;
const totalPlST=ordered.reduce((s,o)=>s+o.ap.length,0);const useCollapse=!isTabletST&&!forCapture&&totalPlST>=6;
const[expandedTeam,setExpandedTeam]=useState(null);
const prevAcRef=useRef(activeCell&&activeCell.teamIndex);
useEffect(()=>{const cur=activeCell&&activeCell.teamIndex;if(cur!==prevAcRef.current){setExpandedTeam(null);prevAcRef.current=cur;}},[activeCell]);
const isCollapsed=(oIdx)=>useCollapse&&!(activeCell&&activeCell.teamIndex===oIdx)&&expandedTeam!==oIdx;
const totalCols=1+ordered.reduce((s,o)=>s+(isCollapsed(o.idx)?1:o.ap.length+1),0);
const showRows=activeCell&&activeCell.turn>maxT?activeCell.turn:maxT;
useEffect(()=>{ensureBlink();},[]);
const cp=fs<=11?"2px 1px":"5px 3px";const hp=fs<=11?"2px 1px":"5px 2px";const bl=fs<=11?"2px solid ":"3px solid ";
return(<table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",borderSpacing:0}}>
<colgroup><col style={{width:rw}}/>{ordered.map(o=><React.Fragment key={o.idx}>{!isCollapsed(o.idx)&&o.ap.map((_,pi)=><col key={pi}/>)}<col style={{minWidth:28}}/></React.Fragment>)}</colgroup>
<thead><tr style={{height:H1}}>
<th style={{background:"var(--bg-secondary)",color:"var(--text-inverse)",fontWeight:700,fontSize:fs*0.8,textAlign:"center",position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none"}}>R</th>
{ordered.map(o=>{const isAcTeam=activeCell&&activeCell.teamIndex===o.idx;const col=isCollapsed(o.idx);return(<th key={o.idx} colSpan={col?1:o.ap.length+1} style={{background:isAcTeam?"#14365a":"#3d5a80",color:"#fff",fontWeight:700,fontSize:fs*0.75,textAlign:"center",borderLeft:bl+(isAcTeam?"#ffc107":"#4b5563"),position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none",whiteSpace:"nowrap",overflow:"hidden",cursor:col?"pointer":"default"}} onClick={col?()=>setExpandedTeam(expandedTeam===o.idx?null:o.idx):undefined}>{o.team.name}</th>);})}
</tr><tr>
<th style={{background:"#1e4a72",position:forCapture?"static":"sticky",top:H1,zIndex:7,padding:0,borderTop:"none",borderBottom:"2px solid #0d2a48"}}/>
{ordered.map(o=>{const isAcTeam=activeCell&&activeCell.teamIndex===o.idx;const col=isCollapsed(o.idx);return(<React.Fragment key={o.idx}>
{!col&&o.ap.map((p,pi)=>(<th key={pi} style={{background:isAcTeam?"#14365a":"#3d5a80",color:"#fff",fontWeight:800,fontSize:fs*0.78,textAlign:"center",verticalAlign:"top",borderLeft:pi===0?bl+(isAcTeam?"#ffc107":"#4b5563"):"1px solid rgba(255,255,255,0.15)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:hp,letterSpacing:fs<=11?0:1,textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:900}}>{p.name.slice(0,MAX_NAME)}</span></th>))}
<th style={{background:col?"#3d5a80":"#0d2a48",color:col?"#fff":"#ffd700",fontWeight:900,textAlign:"center",verticalAlign:"top",borderLeft:col?bl+"#4b5563":"1px solid rgba(255,255,255,0.2)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:hp,textShadow:"0 1px 3px rgba(0,0,0,0.4)",cursor:col?"pointer":"default"}} onClick={col?()=>setExpandedTeam(expandedTeam===o.idx?null:o.idx):undefined}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:900}}>{col?o.team.name.slice(0,3):"計"}</span></th>
</React.Fragment>);})}
</tr></thead>
<tbody>{showRows===0?(<tr><td colSpan={totalCols} style={{color:"#bbb",padding:24,fontSize:fs*0.8,textAlign:"center",borderBottom:"1px solid var(--border-lighter)"}}>スコアを入力してください</td></tr>):(
Array.from({length:showRows},(_,i)=>i+1).map(turn=>{
const isLast=highlightLast&&turn===maxT;
return(<tr key={turn} style={isLast?{background:"#fffde6"}:{}}>
<td style={{padding:cp,textAlign:"center",borderBottom:"1px solid var(--border-input)",fontWeight:800,color:"#666",fontSize:fs*0.85}}>{turn}</td>
{ordered.map(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);const cf=e?getFA(history,o.idx,turn):0;const col=isCollapsed(o.idx);
return(<React.Fragment key={o.idx}>{!col&&o.ap.map((p,pi)=>{
const isP=e&&e.playerIndex===pi;const isAct=activeCell&&activeCell.turn===turn&&activeCell.teamIndex===o.idx&&activeCell.playerIndex===pi&&!e;
let txt="",clr="#333",bg="transparent",fw=600;
if(isP){if((e.type==="miss"||e.type==="fault")&&cf===1)bg="#fff9db";if((e.type==="miss"||e.type==="fault")&&cf>=2)bg="#ffe0e0";if(e.type==="miss"){txt="−";clr="var(--accent-orange)";fw=800;}else if(e.type==="fault"&&e.faultReset){txt=e.consecutiveFails>=MF?"F":"F↓";clr="var(--text-danger)";fw=800;}else if(e.type==="fault"){txt="F";clr="var(--text-danger)";fw=800;}else if(e.reset25){txt=e.score+"↓";clr="#d93a5e";fw=800;}else{txt=e.score;clr=C[o.idx].tx;fw=700;}if(e.consecutiveFails>=MF)txt+="✕";}
const cs={padding:cp,textAlign:"center",borderBottom:"1px solid var(--border-input)",color:clr,fontWeight:fw,background:bg,borderLeft:pi===0?bl+C[o.idx].ac+"33":"1px solid var(--border-lighter)",fontSize:fs};
if(isAct)cs.animation="mk-blink 1s ease-in-out infinite";
return <td key={pi} style={cs}>{txt}</td>;
})}<td style={{padding:cp,textAlign:"center",borderBottom:"1px solid var(--border-input)",fontWeight:900,color:C[o.idx].tx,background:e?"#f0f3f8":"transparent",borderLeft:col?bl+"#4b5563":"2px solid #d0d0d0",fontSize:fs}}>{e?(dqWinnerIdx!=null&&o.idx===dqWinnerIdx&&turn===dqWinLastTurn?WIN:e.runningTotal):""}</td></React.Fragment>);
})}
</tr>);
})
)}</tbody>

  </table>);
}

export function GameSheet({teams,history,currentTurn,teamOrder,activeCell}){
const ref=useRef(null);
useEffect(()=>{if(ref.current)setTimeout(()=>{ref.current.scrollTop=ref.current.scrollHeight;},50);},[history.length,currentTurn]);
const vw=typeof window!=="undefined"?window.innerWidth:375;
const isTabletGS=vw>=768;
const totalPlayers=teamOrder.reduce((s,i)=>s+teams[i].players.filter(p=>p.active).length,0);
const dataCols=totalPlayers+teamOrder.length;/* player cols + total cols */
/* Scale font size: iPad uses larger base, iPhone same as before */
const fs=isTabletGS?Math.max(13,Math.min(24,Math.floor(vw/(dataCols*2.4)))):Math.max(9,Math.min(18,Math.floor(vw/(dataCols*3.2))));
const rw=isTabletGS?Math.max(36,Math.min(56,Math.floor(vw*0.08))):Math.max(24,Math.min(48,Math.floor(vw*0.08)));
const nh=fs<=11?60:fs<=14?80:fs<=18?110:130;
return(<div ref={ref} style={{height:"100%",overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"}}><ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={true} fontSize={fs} colW={0} roundW={rw} nameH={nh} activeCell={activeCell}/></div>);
}

/* ═══ Setup — 1.5x bigger + stats toggle ═══ */
/* ═══ Admin PIN Modal — server-verified with lockout ═══ */
export function AdminPinModal({mode,onSuccess,onCancel,syncCode}){
const[pin,setPin]=useState("");const[pin2,setPin2]=useState("");const[err,setErr]=useState("");const[busy,setBusy]=useState(false);
const[step,setStep]=useState(mode==="create"?1:0);
const[lockInfo,setLockInfo]=useState(()=>getPinLockout());
/* Lockout countdown */
useEffect(()=>{if(!lockInfo.locked)return;const t=setInterval(()=>{const li=getPinLockout();setLockInfo(li);if(!li.locked)clearInterval(t);},1000);return()=>clearInterval(t);},[lockInfo.locked]);

const submit=async()=>{
if(busy)return;
/* Check lockout */
const lo=getPinLockout();if(lo.locked){setErr("ロック中（残"+Math.ceil(lo.remaining)+"秒）");return;}
if(mode==="create"){
  if(step===1){if(pin.length<4||pin.length>6){setErr("4〜6桁で入力");return;}setStep(2);setErr("");return;}
  if(step===2){if(pin!==pin2){setErr("PINが一致しません");setPin2("");return;}
    setBusy(true);const r=await createPinOnServer(syncCode,pin);setBusy(false);
    if(r.ok){setPinAuthTs(r.pin_updated_at);clearPinLockout();onSuccess();}
    else{setErr(r.error||"作成に失敗しました");}
  }
}else{
  setBusy(true);const r=await verifyPinOnServer(syncCode,pin);setBusy(false);
  if(r.ok){setPinAuthTs(r.pin_updated_at);clearPinLockout();onSuccess();}
  else{const lo2=incPinAttempt();setLockInfo(lo2);
    if(lo2.until){setErr("5回失敗のため10分間ロック");setPin("");}
    else{setErr("PINが違います（残"+String(5-(lo2.attempts||0))+"回）");setPin("");}
  }
}};
const isLocked=lockInfo.locked;
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div className="mk-fade-scale-in" style={{background:"var(--bg-surface)",borderRadius:18,padding:28,maxWidth:340,width:"100%",textAlign:"center"}}>
<div style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",marginBottom:6}}>{mode==="create"?<><Lock size={20} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 管理者PINを作成</>:<><Lock size={20} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 管理者PIN入力</>}</div>
<div style={{fontSize:14,color:"var(--text-secondary)",marginBottom:16}}>{mode==="create"?(step===1?"4〜6桁の数字を設定":"もう一度入力してください"):(isLocked?"ロック中です":"PINを入力してください")}</div>
<input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={step===2?pin2:pin} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,6);step===2?setPin2(v):setPin(v);setErr("");}} placeholder="●●●●" disabled={isLocked||busy} style={{width:"100%",padding:"16px",border:"2px solid "+(err?"var(--text-danger)":isLocked?"var(--accent-yellow)":"var(--border-input)"),borderRadius:12,fontSize:28,fontWeight:700,textAlign:"center",letterSpacing:12,outline:"none",marginBottom:8,opacity:isLocked?0.4:1}}/>
{err&&<div style={{color:"var(--text-danger)",fontSize:14,fontWeight:600,marginBottom:8}}>{err}</div>}
{isLocked&&<div style={{color:"var(--accent-yellow)",fontSize:13,fontWeight:600,marginBottom:8}}><Lock size={13} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/> 残り{Math.ceil(lockInfo.remaining)}秒でロック解除</div>}
<div style={{display:"flex",gap:8,marginTop:8}}>
<button onClick={submit} disabled={isLocked||busy} style={{flex:1,padding:"14px 0",border:"none",borderRadius:12,background:isLocked?"#ccc":"var(--bg-secondary)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:isLocked?"not-allowed":"pointer"}}>{busy?"確認中...":mode==="create"?(step===1?"次へ":"設定する"):"解除"}</button>
<button onClick={onCancel} style={{flex:1,padding:"14px 0",border:"2px solid var(--border-input)",borderRadius:12,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button>
</div></div></div>);
}

/* ═══ Settings Page ═══ */
export function SettingsPage({onClose,isAdmin,onAdminToggle,aiEnabled,onAIToggle,shufAnim,onShufAnimToggle,favs}){
const[showAdminPin,setShowAdminPin]=useState(false);
const[playerLevels,setPlayerLevels]=useState(()=>loadPlayerLevels());
const[serverHasPin,setServerHasPin]=useState(null);
const savedCode=getSyncCode();/* from localStorage — may be stale */
const[syncInput,setSyncInput]=useState(savedCode);/* input field value */
const[syncConfirmed,setSyncConfirmed]=useState(!!savedCode);/* was a sync ever successful? */
const[syncStatus,setSyncStatus]=useState("");
const total=getAnalysisTotal();const totalDisplay=total>=10000?"∞":total;
const costYen=(total*0.1).toFixed(1);
/* On mount: verify saved code is actually valid on server */
useEffect(()=>{if(savedCode){checkServerHasPin(savedCode).then(r=>{setServerHasPin(r.has_pin);setSyncConfirmed(r.exists);if(!r.exists){setSyncInput("");setSyncCodeLS("");}});}else{setServerHasPin(false);setSyncConfirmed(false);}},[]);
/* Remote kick */
useEffect(()=>{if(isAdmin&&savedCode){checkServerHasPin(savedCode).then(r=>{
const storedTs=getPinAuthTs();
if(r.pin_updated_at&&storedTs&&r.pin_updated_at!==storedTs){onAdminToggle(false);}
});}},[isAdmin]);
const SW=({on,onToggle,label,color})=>(<div onClick={onToggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 18px",background:on?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",border:"2px solid "+(on?(color||"var(--accent-blue)")+"44":"rgba(255,255,255,0.1)"),borderRadius:14,cursor:"pointer",marginBottom:10}}>
<span style={{color:on?(color||"var(--accent-blue)"):"rgba(255,255,255,0.5)",fontSize:16,fontWeight:700}}>{label}</span>
<div style={{width:52,height:30,borderRadius:15,padding:2,background:on?(color||"var(--accent-blue)"):"rgba(255,255,255,0.25)",transition:"background 0.2s",display:"flex",alignItems:"center",justifyContent:on?"flex-end":"flex-start"}}>
<div style={{width:26,height:26,borderRadius:13,background:"var(--bg-surface)",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"all 0.2s"}}/></div></div>);
return(<div className="mk-fade-scale-in" style={{position:"fixed",inset:0,background:"linear-gradient(170deg,var(--bg-tertiary),var(--bg-secondary))",zIndex:200,display:"flex",flexDirection:"column",overflow:"hidden"}}>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(14px + env(safe-area-inset-top, 0px)) 20px 14px",borderBottom:"1px solid rgba(255,255,255,0.1)",flexShrink:0}}>
<h2 style={{fontSize:24,fontWeight:900,color:"var(--text-inverse)",margin:0,display:"flex",alignItems:"center",gap:6}}><Settings size={22}/> 詳細設定</h2>
<button onClick={onClose} style={{padding:"8px 18px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"transparent",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>✕ 閉じる</button>
</div>
<div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"16px 20px",paddingBottom:"calc(16px + env(safe-area-inset-bottom, 0px))",overscrollBehavior:"contain"}}>
{/* Status overview */}
<div style={{display:"flex",gap:8,marginBottom:16}}>
<div style={{flex:1,padding:"10px 14px",border:"2px solid "+(isAdmin?"#e6a81744":"rgba(255,255,255,0.1)"),borderRadius:12,background:isAdmin?"rgba(230,168,23,0.08)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",gap:6}}>
<span style={{fontSize:14,color:isAdmin?"var(--accent-yellow)":"rgba(255,255,255,0.4)",fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Lock size={14}/> {isAdmin?"管理者":"メンバー"}</span>
</div>
<div style={{flex:1,padding:"10px 14px",border:"2px solid "+(syncConfirmed?"#22b56644":"rgba(255,255,255,0.1)"),borderRadius:12,background:syncConfirmed?"rgba(34,181,102,0.08)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",gap:6}}>
<span style={{fontSize:14,color:syncConfirmed?"var(--text-success)":"rgba(255,255,255,0.4)",fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Cloud size={14}/> {syncConfirmed?"同期済":"未設定"}</span>
</div>
</div>
{/* Admin mode */}
<div style={{marginBottom:20}}>
<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8}}>権限管理</div>
<SW on={isAdmin} onToggle={()=>{setSyncStatus("");if(isAdmin){onAdminToggle(false);}else if(!syncConfirmed){setSyncStatus("❌ 先にクラウド同期を設定してください");}else{const sc=getSyncCode();if(serverHasPin===null){checkServerHasPin(sc).then(r=>{setServerHasPin(r.has_pin);setShowAdminPin(true);});}else{setShowAdminPin(true);}}}} label={"管理者モード "+(isAdmin?"(ON)":"(OFF)")} color="var(--accent-yellow)"/>
<div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:-4,marginBottom:12,paddingLeft:4}}>{!syncConfirmed?"クラウド同期を先に設定してください":"スタッツ削除・同期コード編集・AI無制限"}</div>
</div>
{/* Cloud sync */}
<div style={{marginBottom:20}}>
<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8}}>クラウド同期</div>
<div style={{background:"rgba(255,255,255,0.96)",borderRadius:14,padding:16}}>
{!syncConfirmed?(<>
<div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:10}}>初回セットアップ: 同期コードを入力してください。</div>
<div style={{display:"flex",gap:8,marginBottom:8}}>
<input value={syncInput} onChange={e=>setSyncInput(e.target.value.trim().slice(0,30))} placeholder="同期コード（3文字以上）" style={{flex:1,border:"1px solid var(--border-input)",borderRadius:8,padding:"10px 12px",fontSize:16,outline:"none"}}/>
<button onClick={()=>{
if(syncInput.length<3){setSyncStatus("❌ 3文字以上");return;}
setSyncCodeLS(syncInput);setSyncStatus("⏳ 同期中...");
pullFromServer().then(r=>{
if(r.merged){setSyncStatus("✅ 同期完了"+(r.added>0?" (+"+r.added+"件)":""));setSyncConfirmed(true);
checkServerHasPin(syncInput).then(p=>setServerHasPin(p.has_pin));}
else{setSyncStatus("❌ "+(r.error||"同期失敗"));}
});
}} style={{padding:"10px 18px",border:"none",borderRadius:8,background:"var(--accent-blue)",color:"var(--text-inverse)",fontSize:15,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>同期</button>
</div>
<div style={{fontSize:12,color:"#bbb",marginTop:4}}>同期コードを入力して同期ボタンを押してください。</div>
</>):(<>
<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
<div style={{flex:1,padding:"10px 12px",border:"1px solid var(--border-input)",borderRadius:8,fontSize:16,color:"var(--text-secondary)",background:"var(--bg-surface-dim)",letterSpacing:2}}>{maskSyncCode(savedCode)}</div>
<span style={{fontSize:13,color:"var(--text-success)",fontWeight:700}}>設定済み</span>
</div>
{isAdmin&&<button onClick={()=>{setSyncStatus("⏳ アップロード中...");pushToServer().then(r=>{setSyncStatus(r.ok?"✅ アップロード完了":"❌ "+(r.error||"失敗"));});}} style={{width:"100%",padding:"10px",border:"1px solid var(--border-input)",borderRadius:8,background:"var(--bg-surface-dim)",color:"#555",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:8}}><Upload size={14} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 手動アップロード</button>}
<div style={{fontSize:12,color:"#bbb"}}>{isAdmin?"同期コードの変更はSupabaseダッシュボードから行えます。":"同じコードを全端末で設定してください。"}</div>
</>)}
{syncStatus&&<div style={{fontSize:14,color:syncStatus.startsWith("✅")?"var(--text-success)":syncStatus.startsWith("❌")?"var(--text-danger)":"var(--accent-blue)",fontWeight:600,marginTop:6}}>{syncStatus}</div>}
</div>
</div>
{/* Shuffle animation */}
<div style={{marginBottom:20}}>
<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8}}>演出</div>
<SW on={shufAnim} onToggle={()=>onShufAnimToggle(!shufAnim)} label={"シャッフル演出 "+(shufAnim?"(ON)":"(OFF)")} color="var(--accent-green)"/>
<div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:-4,marginBottom:12,paddingLeft:4}}>{shufAnim?"カードシャッフルアニメーションを表示":"アニメーションなしで即座に結果表示"}</div>
</div>
{/* AI analysis */}
<div style={{marginBottom:20}}>
<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8}}>AI分析</div>
<SW on={aiEnabled} onToggle={()=>onAIToggle(!aiEnabled)} label={"プレイスタイルAI分析 "+(aiEnabled?"(ON)":"(OFF)")} color="var(--accent-blue)"/>
<div style={{background:"rgba(255,255,255,0.06)",borderRadius:14,padding:16,border:"1px solid rgba(255,255,255,0.08)"}}>
<div style={{fontSize:14,fontWeight:700,color:"var(--text-inverse)",marginBottom:10,display:"flex",alignItems:"center",gap:4}}><BarChart3 size={16}/> 累計使用量</div>
<div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:6}}>
<span style={{fontSize:36,fontWeight:900,color:"var(--accent-blue)"}}>{totalDisplay}</span>
<span style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>回使用</span>
</div>
<div style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>推定コスト: 約{costYen}円</div>
<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>1回 ≈ 250トークン（Claude Sonnet）</div>
<div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:2}}>メンバー: 1人あたり{ANALYSIS_DAILY_MAX}回/日、管理者: 無制限</div>
{isAdmin&&<a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,padding:"8px 16px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,background:"rgba(255,255,255,0.06)",color:"var(--accent-blue)",fontSize:13,fontWeight:700,textDecoration:"none"}}>🔗 Anthropicコンソールで残高確認</a>}
</div>
</div>
{/* Player Level Setting (admin only) */}
{isAdmin&&favs&&favs.length>0&&(
<div style={{marginBottom:20}}>
<div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:3,marginBottom:8}}>プレイヤーレベル設定</div>
<div style={{background:"rgba(255,255,255,0.96)",borderRadius:14,padding:16}}>
<div style={{fontSize:13,color:"var(--text-secondary)",marginBottom:12}}>AI分析に使用するプレイヤーの実力レベルを設定できます。未設定の場合はスタッツから自動推定されます。</div>
{favs.map(name=>{
const current=playerLevels[name]||null;
const options=[{value:null,label:"自動推定"},...[1,2,3,4,5].map(v=>({value:v,label:"Lv"+v+" "+LEVEL_NAMES[v]}))];
return(<div key={name} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid #eee"}}>
<div style={{fontSize:15,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>{name}</div>
<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
{options.map(opt=>{
const isActive=(current===opt.value)||(current==null&&opt.value===null);
return(<button key={opt.value===null?"auto":opt.value} onClick={()=>{savePlayerLevel(name,opt.value);setPlayerLevels(loadPlayerLevels());}} style={{padding:"5px 10px",border:"2px solid "+(isActive?"var(--accent-blue)":"#ddd"),borderRadius:8,background:isActive?"var(--accent-blue)":"var(--bg-surface)",color:isActive?"var(--text-inverse)":"var(--text-secondary)",fontSize:12,fontWeight:isActive?700:500,cursor:"pointer"}}>{opt.label}</button>);
})}
</div>
</div>);
})}
</div>
</div>
)}
</div>
{showAdminPin&&<AdminPinModal mode={serverHasPin?"verify":"create"} syncCode={getSyncCode()} onSuccess={()=>{setShowAdminPin(false);onAdminToggle(true);setServerHasPin(true);}} onCancel={()=>setShowAdminPin(false)}/>}
</div>);
}
