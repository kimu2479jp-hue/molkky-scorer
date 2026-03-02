import React, { useState, useReducer, useRef, useEffect, useCallback } from "react";

const MAX_TEAMS=4,MAX_PL=5,MAX_SHUF=20,MAX_NAME=7,WIN=50,RST=25,PEN=37,MF=3;
const C=[
  {bg:"#14365a",lt:"#e6f0fb",ac:"#2b7de9",tx:"#14365a",nm:"#c8dfff"},
  {bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30",nm:"#ffc8d6"},
  {bg:"#1a5c3a",lt:"#e6faf0",ac:"#22b566",tx:"#1a5c3a",nm:"#b8ffd8"},
  {bg:"#6b5a1d",lt:"#fbf5e6",ac:"#d9a83a",tx:"#6b5a1d",nm:"#ffe8a0"},
];
const H1=30;
const BLINK_ID="mk-blink-style";
function ensureBlink(){if(document.getElementById(BLINK_ID))return;const s=document.createElement("style");s.id=BLINK_ID;s.textContent="@keyframes mk-blink{0%,100%{background:rgba(43,125,233,0.12)}50%{background:rgba(43,125,233,0.45)}}";document.head.appendChild(s);}

const LS_KEY="mk-fav";
function loadFavs(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):[];}catch(e){return[];}}
function saveFavs(l){try{localStorage.setItem(LS_KEY,JSON.stringify(l));}catch(e){}}
function useFavs(){const[f,sF]=useState(()=>loadFavs());return{favs:f,addF:n=>{const x=n.trim().slice(0,MAX_NAME);if(x&&!f.includes(x)){const u=[...f,x];sF(u);saveFavs(u);}},rmF:n=>{const u=f.filter(v=>v!==n);sF(u);saveFavs(u);}};}

const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const arrEq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
const scoreOf=(h,t)=>{for(let i=h.length-1;i>=0;i--)if(h[i].teamIndex===t)return h[i].runningTotal;return 0;};
const failsOf=(h,t)=>{let c=0;for(let i=h.length-1;i>=0;i--){if(h[i].teamIndex===t){if(h[i].type==="miss"||h[i].type==="fault")c++;else break;}}return c;};
const getFA=(hist,tIdx,turn)=>{let c=0;const th=hist.filter(h=>h.teamIndex===tIdx&&h.turn<=turn);for(let i=th.length-1;i>=0;i--){if(th[i].type==="miss"||th[i].type==="fault")c++;else break;}return c;};
function smartShuf(arr,prev,n){n=n||20;if(arr.length<=1)return[...arr];for(let i=0;i<n;i++){const s=shuf(arr);if(!prev||!arrEq(s,prev))return s;}return shuf(arr);}

/* ═══ Reducer ═══ */
function adv(s){let oi=(s.currentOrderIdx+1)%s.teamOrder.length,t=s.currentTurn;if(oi===0)t++;let x=0;while(s.eliminated[s.teamOrder[oi]]&&x<s.teamOrder.length){oi=(oi+1)%s.teamOrder.length;if(oi===0)t++;x++;}const alive=s.teamOrder.filter(ti=>!s.eliminated[ti]);if(alive.length<=1)return{...s,currentOrderIdx:oi,currentTurn:t,winner:alive.length===1?alive[0]:null,autoEnd:true};return{...s,currentOrderIdx:oi,currentTurn:t};}
function reducer(s,a){
  const ti=s.teamOrder[s.currentOrderIdx];
  const gPI=()=>{const ap=s.teams[ti].players.filter(p=>p.active);const td=s.history.filter(h=>h.teamIndex===ti).length;return{ap,pi:ap.length>0?td%ap.length:0};};
  switch(a.type){
    case "SCORE":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);let ns=pv+a.score,r25=false;if(ns>WIN){ns=RST;r25=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"score",score:a.score,runningTotal:ns,prevScore:pv,reset25:r25,faultReset:false};const nh=[...s.history,e];if(ns===WIN)return{...s,history:nh,winner:ti};return adv({...s,history:nh});}
    case "MISS":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv;let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"miss",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:false,consecutiveFails:cf};const ns2={...s,history:[...s.history,e],eliminated:ne};if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}return adv(ns2);}
    case "FAULT":{if(s.eliminated[ti])return adv(s);const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv,fr=false;if(pv>=PEN){rt=RST;fr=true;}let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}const{ap,pi}=gPI();const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"fault",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:fr,consecutiveFails:cf};const ns2={...s,history:[...s.history,e],eliminated:ne};if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}return adv(ns2);}
    case "UNDO":{if(!s.history.length)return s;const last=s.history[s.history.length-1];const nh=s.history.slice(0,-1);const ne=[...s.eliminated];if(s.eliminated[last.teamIndex])ne[last.teamIndex]=false;const oi=s.teamOrder.indexOf(last.teamIndex);return{...s,history:nh,currentOrderIdx:oi>=0?oi:0,currentTurn:last.turn,eliminated:ne,winner:null,autoEnd:false};}
    case "SET_TEAMS":return{...s,teams:a.teams};
    case "RESET_GAME":return{...s,history:[],currentOrderIdx:0,currentTurn:1,eliminated:s.teams.map(()=>false),winner:null,autoEnd:false,teamOrder:a.teamOrder||s.teamOrder,gameNumber:(s.gameNumber||1)+1};
    default:return s;
  }
}

function Confirm({msg,sub,okLabel,cancelLabel,thirdLabel,onOk,onCancel,onThird}){
  return(<div style={SS.ov}><div style={{background:"#fff",borderRadius:20,padding:"32px 28px",maxWidth:480,width:"100%",textAlign:"center",boxShadow:"0 10px 36px rgba(0,0,0,0.25)"}}>
    <div style={{fontSize:44,marginBottom:8}}>⚠️</div>
    <div style={{fontSize:22,fontWeight:800,color:"#14365a",marginBottom:6,whiteSpace:"pre-line"}}>{msg}</div>
    {sub&&<div style={{fontSize:16,color:"#888",marginBottom:14,whiteSpace:"pre-line"}}>{sub}</div>}
    <div style={{display:"flex",gap:10,flexDirection:"column"}}>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onOk} style={{flex:1,padding:"16px 0",border:"none",borderRadius:12,background:"#14365a",color:"#fff",fontSize:18,fontWeight:700,cursor:"pointer"}}>{okLabel||"確定"}</button>
        <button onClick={onCancel} style={{flex:1,padding:"16px 0",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:18,fontWeight:700,cursor:"pointer"}}>{cancelLabel||"キャンセル"}</button>
      </div>
      {onThird&&<button onClick={onThird} style={{padding:"14px 0",border:"2px solid #ccc",borderRadius:12,background:"transparent",color:"#888",fontSize:16,fontWeight:600,cursor:"pointer"}}>{thirdLabel||"戻る"}</button>}
    </div>
  </div></div>);
}

function FavDropdown({favs,addF,rmF,onPick,usedNames}){
  const[open,setOpen]=useState(false);const[newN,setNewN]=useState("");const[delTarget,setDelTarget]=useState(null);
  const longRef=useRef(null);const wrapRef=useRef(null);
  const available=favs.filter(f=>!(usedNames||[]).includes(f));
  useEffect(()=>{if(!open)return;const h=e=>{if(wrapRef.current&&!wrapRef.current.contains(e.target))setOpen(false);};document.addEventListener("pointerdown",h);return()=>document.removeEventListener("pointerdown",h);},[open]);
  const startLP=name=>{longRef.current=setTimeout(()=>setDelTarget(name),600);};
  const cancelLP=()=>{if(longRef.current)clearTimeout(longRef.current);};
  return(
    <div ref={wrapRef} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>{setOpen(!open);setDelTarget(null);}} style={{width:40,height:40,border:"1px solid #d0dff0",borderRadius:8,background:open?"#2b7de9":"#f0f6ff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:open?"#fff":"#d9a83a"}}>⭐</button>
      {open&&(<div style={{position:"absolute",top:"100%",right:0,marginTop:4,background:"#fff",border:"1px solid #ccc",borderRadius:12,boxShadow:"0 6px 20px rgba(0,0,0,0.18)",zIndex:50,minWidth:220,maxWidth:300,padding:10}}>
        {available.length===0&&<div style={{padding:12,textAlign:"center",color:"#aaa",fontSize:16}}>{favs.length===0?"登録なし":"全員配置済み"}</div>}
        <div style={{maxHeight:220,overflow:"auto"}}>{available.map(f=>(<div key={f}><button onPointerDown={()=>startLP(f)} onPointerUp={cancelLP} onPointerLeave={cancelLP} onClick={()=>{if(delTarget===f)setDelTarget(null);else{onPick(f);setOpen(false);}}} style={{width:"100%",padding:"12px 16px",border:"none",borderBottom:"1px solid #f0f0f0",background:delTarget===f?"#fde8e8":"transparent",fontSize:18,fontWeight:600,color:"#14365a",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span>{f}</span>{delTarget===f&&<span onClick={e=>{e.stopPropagation();rmF(f);setDelTarget(null);}} style={{padding:"5px 12px",background:"#e74c3c",color:"#fff",borderRadius:6,fontSize:13,fontWeight:700}}>削除</span>}</button></div>))}</div>
        <div style={{borderTop:"1px solid #eee",paddingTop:10,marginTop:4}}><div style={{display:"flex",gap:6}}>
          <input value={newN} onChange={e=>setNewN(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder={"新規登録("+MAX_NAME+"文字)"} style={{flex:1,padding:"10px 12px",border:"1px solid #ddd",borderRadius:8,fontSize:16,outline:"none"}}/>
          <button onClick={()=>{if(newN.trim()){addF(newN.trim());setNewN("");}}} style={{padding:"10px 16px",border:"none",borderRadius:8,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",opacity:newN.trim()?1:0.3}}>登録</button>
        </div></div>
      </div>)}
    </div>
  );
}

const VT={writingMode:"vertical-rl",WebkitWritingMode:"vertical-rl",textOrientation:"upright",WebkitTextOrientation:"upright",letterSpacing:"-1px",lineHeight:1,margin:"0 auto",whiteSpace:"nowrap",overflow:"hidden",display:"inline-block"};

/* ═══ SCORE TABLE ═══ */
function ScoreTable({teams,history,teamOrder,highlightLast,fontSize,colW,roundW,nameH,activeCell,forCapture}){
  const fs=fontSize||18;const cw=colW||60;const rw=roundW||44;const nh=nameH||100;
  const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
  const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
  const totalCols=1+ordered.reduce((s,o)=>s+o.ap.length+1,0);
  const showRows=activeCell&&activeCell.turn>maxT?activeCell.turn:maxT;
  useEffect(()=>{ensureBlink();},[]);
  return(
    <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",borderSpacing:0}}>
      <colgroup><col style={{width:rw}}/>{ordered.map(o=><React.Fragment key={o.idx}>{o.ap.map((_,pi)=><col key={pi} style={{width:cw}}/>)}<col style={{width:cw}}/></React.Fragment>)}</colgroup>
      <thead>
        <tr style={{height:H1}}>
          <th style={{background:"#14365a",color:"#fff",fontWeight:700,fontSize:fs*0.8,textAlign:"center",position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none"}}>R</th>
          {ordered.map(o=>(<th key={o.idx} colSpan={o.ap.length+1} style={{background:C[o.idx].bg,color:"#fff",fontWeight:700,fontSize:fs*0.75,textAlign:"center",borderLeft:"3px solid "+C[o.idx].ac,position:forCapture?"static":"sticky",top:0,zIndex:7,padding:0,lineHeight:H1+"px",borderBottom:"none",whiteSpace:"nowrap",overflow:"hidden"}}>{o.team.name}</th>))}
        </tr>
        <tr>
          <th style={{background:"#1e4a72",position:forCapture?"static":"sticky",top:H1,zIndex:7,padding:0,borderTop:"none",borderBottom:"2px solid #0d2a48"}}/>
          {ordered.map(o=><React.Fragment key={o.idx}>
            {o.ap.map((p,pi)=>(<th key={pi} style={{background:"linear-gradient(180deg,"+C[o.idx].bg+",#1e4a72)",color:C[o.idx].nm,fontWeight:800,fontSize:fs*0.78,textAlign:"center",verticalAlign:"top",borderLeft:pi===0?"3px solid "+C[o.idx].ac:"1px solid rgba(255,255,255,0.15)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:"5px 2px",letterSpacing:1,textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:800}}>{p.name.slice(0,MAX_NAME)}</span></th>))}
            <th style={{background:"#0d2a48",color:"#ffd700",fontWeight:900,textAlign:"center",verticalAlign:"top",borderLeft:"1px solid rgba(255,255,255,0.2)",position:forCapture?"static":"sticky",top:H1,zIndex:7,borderTop:"none",borderBottom:"2px solid #0d2a48",padding:"5px 2px",textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}><span style={{...VT,fontSize:fs*0.78,maxHeight:nh,fontWeight:900}}>計</span></th>
          </React.Fragment>)}
        </tr>
      </thead>
      <tbody>
        {showRows===0?(<tr><td colSpan={totalCols} style={{color:"#bbb",padding:24,fontSize:fs*0.8,textAlign:"center",borderBottom:"1px solid #eee"}}>スコアを入力してください</td></tr>):(
          Array.from({length:showRows},(_,i)=>i+1).map(turn=>{
            const isLast=highlightLast&&turn===maxT&&turn<=maxT;
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
        )}
      </tbody>
    </table>
  );
}

function GameSheet({teams,history,currentTurn,teamOrder,activeCell}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)setTimeout(()=>{ref.current.scrollTop=ref.current.scrollHeight;},50);},[history.length,currentTurn]);
  return(<div ref={ref} style={{height:"100%",overflow:"auto",WebkitOverflowScrolling:"touch"}}><ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={true} fontSize={20} colW={0} roundW={48} nameH={110} activeCell={activeCell}/></div>);
}

/* ═══ Setup — 1.5x bigger ═══ */
function SetupScreen({onStart,savedTeams}){
  const{favs,addF,rmF}=useFavs();
  const[mode,setMode]=useState("manual");const[tc,setTc]=useState(savedTeams?savedTeams.length:2);
  const[om,setOm]=useState("normal");const[numGames,setNumGames]=useState(1);const[bestOf,setBestOf]=useState(0);const[dqEnd,setDqEnd]=useState(true);
  const[teams,setTeams]=useState(()=>{if(savedTeams){const base=savedTeams.map(t=>({name:t.name,players:t.players.length>0?t.players:[""]}));while(base.length<MAX_TEAMS)base.push({name:"チーム"+(base.length+1),players:[""]});return base.slice(0,MAX_TEAMS);}return Array.from({length:MAX_TEAMS},(_,i)=>({name:"チーム"+(i+1),players:[""]}));});
  const[mems,setMems]=useState(Array(4).fill(""));const[sp,setSp]=useState(null);
  const uN=(i,v)=>setTeams(p=>p.map((t,j)=>j===i?{...t,name:v}:t));
  const uP=(ti,pi,v)=>setTeams(p=>p.map((t,i)=>i===ti?{...t,players:t.players.map((pl,j)=>j===pi?v.slice(0,MAX_NAME):pl)}:t));
  const aP=ti=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length<MAX_PL?{...t,players:[...t.players,""]}:t));
  const rP=(ti,pi)=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length>1?{...t,players:t.players.filter((_,j)=>j!==pi)}:t));
  const uM=(i,v)=>setMems(p=>p.map((m,j)=>j===i?v.slice(0,MAX_NAME):m));
  const aM=()=>{if(mems.length<MAX_SHUF)setMems(p=>[...p,""]);};
  const rM=i=>{if(mems.length>2)setMems(p=>p.filter((_,j)=>j!==i));};
  const doShuf=()=>{const names=mems.filter(m=>m.trim());if(names.length<tc)return;const s=shuf(names);const r=Array.from({length:tc},(_,i)=>({name:"チーム"+(i+1),players:[]}));s.forEach((n,i)=>r[i%tc].players.push(n));setSp(r);};
  const okM=teams.slice(0,tc).every(t=>t.name.trim()&&t.players.some(p=>p.trim()));
  const okS=mems.filter(m=>m.trim()).length>=tc;
  const go=()=>{let ft;if(mode==="manual")ft=teams.slice(0,tc).map(t=>({...t,players:t.players.filter(p=>p.trim())}));else{if(!sp)return;ft=sp;}let ord=Array.from({length:ft.length},(_,i)=>i);if(om==="random")ord=shuf(ord);onStart(ft,ord,numGames,bestOf,dqEnd);};
  const usedManual=teams.slice(0,tc).flatMap(t=>t.players).filter(p=>p.trim()).map(p=>p.trim());
  const usedShuffle=mems.filter(m=>m.trim()).map(m=>m.trim());
  const used=mode==="manual"?usedManual:usedShuffle;
  /* 1.5x styles */
  const SL={display:"block",fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",letterSpacing:3,marginBottom:8};
  const CH={flex:1,padding:"16px 0",border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"transparent",color:"#fff",fontSize:20,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"};
  const CHA={background:"#2b7de9",borderColor:"#2b7de9"};
  const SEL={width:"100%",padding:"14px 16px",border:"1px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.92)",color:"#14365a",fontSize:18,fontWeight:600,cursor:"pointer",outline:"none",WebkitAppearance:"none",appearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7'%3E%3Cpath d='M0 0l6 7 6-7z' fill='%23999'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:"34px"};
  const CARD={background:"rgba(255,255,255,0.96)",borderRadius:14,padding:"16px 18px 14px",marginBottom:12};
  const PIN={flex:1,border:"1px solid #e0e0e0",borderRadius:10,padding:"12px 14px",fontSize:20,outline:"none",background:"#fafafa"};
  const TIN={flex:1,border:"none",borderBottom:"2px solid #ddd",padding:"6px 4px",fontSize:22,fontWeight:700,outline:"none",background:"transparent"};
  return(
    <div style={{height:"100dvh",display:"flex",flexDirection:"column",overflow:"auto",background:"linear-gradient(170deg,#0f1f30,#14365a)",WebkitOverflowScrolling:"touch"}}>
      <div style={{padding:"36px 20px 8px",textAlign:"center"}}>
        <div style={{fontSize:56}}>🪵</div>
        <h1 style={{fontSize:38,fontWeight:900,color:"#fff",letterSpacing:4}}>モルック スコアラー</h1>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.3)",fontWeight:600,letterSpacing:5}}>MÖLKKY SCORER</div>
      </div>
      <div style={{flex:1,padding:"0 20px 36px",maxWidth:720,margin:"0 auto",width:"100%"}}>
        <div style={{marginBottom:14}}><label style={SL}>入力モード</label><div style={{display:"flex",gap:8}}>{[["manual","✏️ 手動"],["shuffle","🎲 ランダム"]].map(([k,l])=>(<button key={k} onClick={()=>{setMode(k);setSp(null);}} style={{...CH,...(mode===k?CHA:{})}}>{l}</button>))}</div></div>
        <div style={{display:"flex",gap:14,marginBottom:14}}>
          <div style={{flex:1}}><label style={SL}>チーム数</label><div style={{display:"flex",gap:8}}>{[2,3,4].map(n=>(<button key={n} onClick={()=>{setTc(n);setSp(null);}} style={{...CH,...(tc===n?CHA:{}),padding:"16px 0"}}>{n}</button>))}</div></div>
          <div style={{flex:1}}><label style={SL}>投げ順</label><div style={{display:"flex",gap:8}}>{[["normal","通常"],["random","ランダム"]].map(([k,l])=>(<button key={k} onClick={()=>setOm(k)} style={{...CH,...(om===k?CHA:{})}}>{l}</button>))}</div></div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <div style={{flex:"1 1 0"}}><label style={SL}>ゲーム数</label><select value={numGames} onChange={e=>setNumGames(+e.target.value)} style={SEL}>{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}ゲーム</option>)}</select></div>
          <div style={{flex:"1 1 0"}}><label style={SL}>先取機能</label><select value={bestOf} onChange={e=>setBestOf(+e.target.value)} style={SEL}><option value={0}>なし</option>{Array.from({length:11},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}先取</option>)}</select></div>
          <div style={{flex:"1 1 0"}}><label style={SL}>失格時</label><select value={dqEnd?"end":"cont"} onChange={e=>setDqEnd(e.target.value==="end")} style={SEL}><option value="end">即終了</option><option value="cont">継続</option></select></div>
        </div>
        <div style={{padding:"12px 16px",background:"rgba(43,125,233,0.12)",borderRadius:12,border:"1px solid rgba(43,125,233,0.2)",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:16,color:"#fff",marginBottom:3}}>📋 公式ルール</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.6)",lineHeight:1.8}}>50点で勝利 / 超過→25点 / 37点以上でフォルト→25点 / ミス＝倒れず / フォルト＝反則 / 3連続→失格</div>
        </div>
        {mode==="manual"&&(<>{teams.slice(0,tc).map((team,ti)=>(
          <div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:34,height:34,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:18,flexShrink:0,background:C[ti].ac}}>{ti+1}</div>
              <input value={team.name} onChange={e=>uN(ti,e.target.value)} style={TIN} placeholder={"チーム"+(ti+1)}/>
            </div>
            <div style={{paddingLeft:44}}>
              {team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
                <span style={{width:20,fontSize:16,color:"#aaa",fontWeight:700,textAlign:"center"}}>{pi+1}</span>
                <input value={p} onChange={e=>uP(ti,pi,e.target.value)} maxLength={MAX_NAME} style={PIN} placeholder={"名前("+MAX_NAME+"文字)"}/>
                <FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={name=>uP(ti,pi,name)} usedNames={used}/>
              </div>))}
              {team.players.length<MAX_PL&&<button style={{width:"100%",padding:10,border:"2px dashed #ddd",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer"}} onClick={()=>aP(ti)}>＋ 追加</button>}
              {team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"#c0392b",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rP(ti,team.players.length-1)}>− 最後を削除</button>}
            </div>
          </div>))}
          <button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:22,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:6,boxShadow:"0 3px 16px rgba(43,125,233,0.3)"}} onClick={okM?go:undefined} disabled={!okM}>🎯 ゲーム開始</button>
        </>)}
        {mode==="shuffle"&&(<>
          <div style={CARD}>
            <div style={{fontWeight:700,fontSize:18,marginBottom:6,color:"#14365a"}}>参加メンバー（最大{MAX_SHUF}人）</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>{mems.map((m,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{width:20,fontSize:14,color:"#aaa",fontWeight:700,textAlign:"right"}}>{i+1}</span>
              <input value={m} onChange={e=>uM(i,e.target.value)} maxLength={MAX_NAME} style={{...PIN,padding:"10px 12px",fontSize:18}} placeholder="メンバー"/>
              <FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={name=>uM(i,name)} usedNames={used}/>
            </div>))}</div>
            {mems.length<MAX_SHUF&&<button style={{width:"100%",padding:10,border:"2px dashed #ddd",borderRadius:8,background:"transparent",color:"#999",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:6}} onClick={aM}>＋</button>}
            {mems.length>2&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"#c0392b",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rM(mems.length-1)}>− 最後を削除</button>}
          </div>
          <button style={{width:"100%",padding:16,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:20,fontWeight:800,cursor:"pointer",opacity:okS?1:0.3}} onClick={okS?doShuf:undefined}>🎲 シャッフル</button>
          {sp&&(<div style={{marginTop:8}}>
            {sp.map((t,ti)=>(<div key={ti} style={{...CARD,borderLeft:"6px solid "+C[ti].ac,padding:"10px 16px",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:14,background:C[ti].ac}}>{ti+1}</div><input value={t.name} onChange={e=>setSp(p=>p.map((x,i)=>i===ti?{...x,name:e.target.value}:x))} style={{...TIN,fontSize:18}}/></div>
              <div style={{paddingLeft:34,fontSize:16,color:"#555"}}>{t.players.join("、")}</div>
            </div>))}
            <button style={{width:"100%",padding:20,border:"none",borderRadius:14,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:22,fontWeight:900,cursor:"pointer",letterSpacing:3,marginTop:4}} onClick={go}>🎯 開始</button>
            <button style={{width:"100%",padding:14,border:"2px solid rgba(255,255,255,0.25)",borderRadius:12,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",marginTop:6}} onClick={doShuf}>🔄 再シャッフル</button>
          </div>)}
        </>)}
      </div>
    </div>
  );
}

/* ═══ Score Input — NEW LAYOUT: numpad left, big buttons right ═══ */
function ScoreInput({dispatch,canUndo,teamName,teamScore,teamColor,playerName,fails,onConfirm,minimized,onToggleMin}){
  const[sel,setSel]=useState(null);
  const pv=sel!=null?teamScore+sel:null;const over=pv!=null&&pv>WIN;const win=pv===WIN;
  const doScore=()=>{if(sel==null)return;if(win){onConfirm("score",sel,teamName+"が50点で上がりです。\n確定しますか？");setSel(null);return;}dispatch({type:"SCORE",score:sel});setSel(null);};
  const doMiss=()=>{if(fails>=MF-1){onConfirm("miss",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}dispatch({type:"MISS"});setSel(null);};
  const doFault=()=>{if(fails>=MF-1){onConfirm("fault",0,teamName+"の"+MF+"回連続です。\n失格になります。確定しますか？");setSel(null);return;}if(teamScore>=PEN){onConfirm("fault",0,teamName+"は"+teamScore+"点（37点以上）。\nフォルトで25点に戻ります。確定しますか？");setSel(null);return;}dispatch({type:"FAULT"});setSel(null);};
  if(minimized){return(
    <div onClick={onToggleMin} style={{background:"#14365a",padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20,fontWeight:900,color:teamColor}}>{teamName}</span>
        <span style={{fontSize:32,fontWeight:900,color:"#fff"}}>{teamScore}点</span>
        {playerName&&<span style={{fontSize:16,fontWeight:600,color:"rgba(255,255,255,0.6)"}}>▶{playerName}</span>}
        <div style={{display:"flex",gap:3}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:16,height:16,borderRadius:8,background:j<fails?"#e74c3c":"rgba(255,255,255,0.2)"}}/>))}</div>
      </div>
      <span style={{fontSize:26,color:"#fff",fontWeight:900}}>▲ 入力</span>
    </div>);}
  return(
    <div style={{background:"#fff",borderTop:"3px solid #dde1e6",padding:"8px 12px 10px",flexShrink:0}}>
      {/* Header: player info + minimize */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:20,fontWeight:900,color:teamColor}}>(プレーヤー：{playerName||"−"})</span>
          <span style={{fontSize:44,fontWeight:900,color:"#14365a",lineHeight:1}}>{teamScore}</span>
          <span style={{fontSize:20,fontWeight:900,color:"#14365a"}}>点</span>
          {fails>0&&<div style={{display:"flex",gap:4,alignItems:"center"}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:20,height:20,borderRadius:10,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,background:j<fails?"#e74c3c":"#ddd",color:j<fails?"#fff":"#999"}}>{j<fails?"✕":""}</span>))}</div>}
        </div>
        <button onClick={onToggleMin} style={{padding:"6px 14px",border:"2px solid #14365a",borderRadius:8,background:"transparent",color:"#14365a",fontSize:15,fontWeight:800,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>▼ 最小化</button>
      </div>
      {sel!=null&&<div style={{fontSize:16,fontWeight:700,marginBottom:2,color:over?"#d93a5e":win?"#22b566":"#14365a"}}>+{sel} → {over?"超過！25点に戻る":win?"🎉50点勝利！":pv+"点"}</div>}
      {teamScore>=PEN&&<div style={{fontSize:13,fontWeight:700,color:"#e67700",marginBottom:2}}>⚠ フォルトで25点に戻ります</div>}
      {/* Two-column layout: numpad left, action buttons right */}
      <div style={{display:"flex",gap:10}}>
        {/* Left: numpad + undo */}
        <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"center"}}>
          {[[7,9,8],[5,11,12,6],[3,10,4],[1,2]].map((row,ri)=>(<div key={ri} style={{display:"flex",gap:6,justifyContent:"center"}}>{row.map(n=>{const isSel=sel===n;return(<button key={n} onClick={()=>setSel(sel===n?null:n)} style={{width:76,height:76,borderRadius:38,border:isSel?"4px solid #14365a":"3px solid #b0bec5",background:isSel?"#14365a":"#fff",color:isSel?"#fff":"#14365a",fontSize:32,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.1s",boxShadow:isSel?"0 4px 16px rgba(20,54,90,0.3)":"none"}}>{n}</button>);})}</div>))}
          <button style={{width:"100%",maxWidth:260,padding:"10px 0",border:"2px solid #ccc",borderRadius:10,background:"#f5f5f5",color:"#666",fontSize:16,fontWeight:800,cursor:"pointer",opacity:canUndo?1:0.2,marginTop:2}} onClick={canUndo?()=>dispatch({type:"UNDO"}):undefined}>↩ 戻る</button>
        </div>
        {/* Right: miss, fault, decide */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,minWidth:0}}>
          <button style={{flex:1,minHeight:80,border:"2px solid #f0d4a0",borderRadius:14,background:"#fff3e0",color:"#bf6900",fontSize:28,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doMiss}>〇 ミス</button>
          <button style={{padding:"12px 0",border:"2px solid #f0b0b0",borderRadius:10,background:"#fde8e8",color:"#c0392b",fontSize:16,fontWeight:800,cursor:"pointer"}} onClick={doFault}>✕ フォルト</button>
          <button style={{flex:1.3,minHeight:100,border:"none",borderRadius:14,background:sel!=null?"#14365a":"#ccc",color:"#fff",fontSize:32,fontWeight:900,cursor:"pointer",boxShadow:sel!=null?"0 4px 16px rgba(20,54,90,0.3)":"none",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={doScore}>決定</button>
        </div>
      </div>
    </div>
  );
}

function PlModal({teams,dispatch,onClose}){
  const{favs,addF,rmF}=useFavs();const[name,setName]=useState("");
  const sizes=teams.map(t=>t.players.filter(p=>p.active).length);const mi=sizes.indexOf(Math.min(...sizes));const[sel,setSel]=useState(mi);
  const tog=(ti,pi,a)=>{const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.map((p,j)=>j===pi?{...p,active:a}:p)}:t);dispatch({type:"SET_TEAMS",teams:nt});};
  const addN=(n,tI)=>{const nm=(n||name).trim().slice(0,MAX_NAME);const tg=tI??sel;if(!nm||teams[tg].players.length>=MAX_PL)return;const nt=teams.map((t,i)=>i===tg?{...t,players:[...t.players,{name:nm,active:true}]}:t);dispatch({type:"SET_TEAMS",teams:nt});setName("");};
  const allUsed=teams.flatMap(t=>t.players.filter(p=>p.active).map(p=>p.name));
  return(<div style={SS.ov} onClick={onClose}><div style={SS.mod} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h2 style={{fontSize:22,fontWeight:900,color:"#14365a"}}>👥 メンバー</h2><button style={SS.clsB} onClick={onClose}>✕</button></div>
    {teams.map((team,ti)=>(<div key={ti} style={{marginBottom:12}}>
      <div style={{fontSize:18,fontWeight:700,color:C[ti].tx,borderBottom:"2px solid "+C[ti].ac,paddingBottom:4,marginBottom:5}}>{team.name}（{team.players.filter(p=>p.active).length}人）</div>
      {team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",padding:"6px 12px",background:p.active?"#f8f9fa":"#f0f0f0",borderRadius:8,marginBottom:4,opacity:p.active?1:0.4}}>
        <span style={{flex:1,fontSize:17}}>{p.name}</span>
        <button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"6px 16px",border:"none",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"#fff"}}>{p.active?"退出":"復帰"}</button>
      </div>))}
    </div>))}
    <div style={{background:"#e6f0fb",borderRadius:10,padding:14,marginTop:8}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>➕追加</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        <select value={sel} onChange={e=>setSel(+e.target.value)} style={{padding:8,borderRadius:8,border:"1px solid #ccc",fontSize:16}}>{teams.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select>
        <input value={name} onChange={e=>setName(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder="名前" style={{flex:1,padding:8,borderRadius:8,border:"1px solid #ccc",fontSize:16}}/>
        <button onClick={()=>addN()} style={{padding:"8px 14px",borderRadius:8,border:"none",background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",opacity:name.trim()?1:0.3}}>追加</button>
        <FavDropdown favs={favs} addF={addF} rmF={rmF} onPick={n=>addN(n)} usedNames={allUsed}/>
      </div>
    </div>
  </div></div>);
}

function OrderPicker({teams,teamOrder,value,onChangeOrd,prevOrder}){
  const rev=[...teamOrder].reverse();const[man,setMan]=useState([...teamOrder]);const[randOrd,setRandOrd]=useState(()=>smartShuf([...teamOrder],prevOrder));
  const mvUp=i=>{if(i===0)return;const m=[...man];[m[i-1],m[i]]=[m[i],m[i-1]];setMan(m);onChangeOrd("manual",m);};
  const doRand=()=>{const r=smartShuf([...teamOrder],prevOrder);setRandOrd(r);onChangeOrd("random",r);};
  const pick=v=>{if(v==="same")onChangeOrd("same",[...teamOrder]);else if(v==="reverse")onChangeOrd("reverse",rev);else if(v==="random")doRand();else onChangeOrd("manual",man);};
  const disp=value==="reverse"?rev:value==="manual"?man:value==="same"?[...teamOrder]:value==="random"?randOrd:null;
  return(<>
    <div style={{display:"flex",gap:6,marginBottom:6}}>{[["same","🔁同順"],["reverse","🔄裏"],["random","🎲ランダム"],["manual","✏️手動"]].map(([k,l])=>(<button key={k} onClick={()=>pick(k)} style={{flex:1,padding:"8px 0",border:"1px solid #ddd",borderRadius:8,background:value===k?"#14365a":"#fff",color:value===k?"#fff":"#14365a",fontSize:14,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}}>{l}</button>))}</div>
    {disp&&(<div style={{background:"#f8f9fa",borderRadius:8,padding:8,marginBottom:6}}>
      {disp.map((ti,i)=>{const t=teams[ti];const ap=t?.players?t.players.filter(p=>typeof p==="object"?p.active:true):[];
        return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<disp.length-1?"1px solid #eee":"none"}}>
          <span style={{fontSize:16,fontWeight:800,color:C[ti]?.ac||"#aaa",width:24,textAlign:"center"}}>{i+1}</span>
          <span style={{fontSize:17,fontWeight:700,color:C[ti]?.tx||"#333"}}>{t?.name||""}</span>
          <span style={{fontSize:13,color:"#888",marginLeft:2}}>{ap.map(p=>typeof p==="object"?p.name:p).join("・")}</span>
          {value==="manual"&&i>0&&<button onClick={()=>mvUp(i)} style={{marginLeft:"auto",padding:"4px 10px",border:"1px solid #ddd",borderRadius:5,background:"#fff",fontSize:12,cursor:"pointer"}}>▲</button>}
        </div>);
      })}
      {value==="random"&&<button onClick={doRand} style={{width:"100%",marginTop:6,padding:"8px 0",border:"2px dashed #2b7de9",borderRadius:8,background:"transparent",color:"#2b7de9",fontSize:14,fontWeight:700,cursor:"pointer"}}>🔄 再シャッフル</button>}
    </div>)}
  </>);
}

/* ═══ Canvas-based image save for iOS ═══ */
function drawScoreImage(teams,history,teamOrder,comments,gameNumber){
  const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));
  const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
  const CW=52,RW=36,RH=32,HDR=28,NMH=80,PAD=16;
  const totalW=RW+ordered.reduce((s,o)=>s+(o.ap.length+1)*CW,0)+PAD*2;
  const tableH=HDR+NMH+Math.max(maxT,1)*RH+4;
  const commentH=comments.length>0?(30+comments.length*26+10):0;
  const totalH=PAD+32+8+tableH+commentH+PAD;
  const c=document.createElement("canvas");c.width=totalW*2;c.height=totalH*2;
  const ctx=c.getContext("2d");ctx.scale(2,2);
  ctx.fillStyle="#fff";ctx.fillRect(0,0,totalW,totalH);
  ctx.fillStyle="#14365a";ctx.font="bold 18px sans-serif";ctx.textAlign="center";
  ctx.fillText("Game "+gameNumber+" スコア表",totalW/2,PAD+20);
  let y=PAD+32+8,x=PAD;
  /* Team name row */
  ctx.fillStyle="#14365a";ctx.fillRect(x,y,RW,HDR);ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText("R",x+RW/2,y+19);
  let cx=x+RW;
  ordered.forEach(o=>{const w=(o.ap.length+1)*CW;ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,w,HDR);ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.fillText(o.team.name,cx+w/2,y+19);cx+=w;});
  y+=HDR;
  /* Player names row */
  ctx.fillStyle="#1e4a72";ctx.fillRect(x,y,RW,NMH);
  cx=x+RW;
  ordered.forEach(o=>{
    o.ap.forEach((p,pi)=>{ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle=C[o.idx].nm;ctx.font="bold 12px sans-serif";ctx.textAlign="center";
      const chars=p.name.slice(0,MAX_NAME).split("");chars.forEach((ch,ci)=>{ctx.fillText(ch,cx+CW/2,y+14+ci*12);});cx+=CW;});
    ctx.fillStyle="#0d2a48";ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle="#ffd700";ctx.font="bold 12px sans-serif";ctx.fillText("計",cx+CW/2,y+14);cx+=CW;
  });
  y+=NMH;
  /* Data rows */
  for(let turn=1;turn<=Math.max(maxT,1);turn++){
    ctx.fillStyle=turn%2===0?"#f8f9fb":"#fff";ctx.fillRect(x,y,totalW-PAD*2,RH);
    ctx.strokeStyle="#ddd";ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,y+RH);ctx.lineTo(x+totalW-PAD*2,y+RH);ctx.stroke();
    ctx.fillStyle="#666";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(""+turn,x+RW/2,y+21);
    cx=x+RW;
    ordered.forEach(o=>{
      const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);
      o.ap.forEach((p,pi)=>{
        const isP=e&&e.playerIndex===pi;let txt="";
        if(isP){if(e.type==="miss")txt="−";else if(e.type==="fault")txt=e.faultReset?"F↓":"F";else txt=e.reset25?e.score+"↓":""+e.score;if(e.consecutiveFails>=MF)txt+="✕";}
        ctx.fillStyle=isP?(e.type==="miss"?"#bf6900":e.type==="fault"?"#c0392b":C[o.idx].tx):"#333";
        ctx.font=(isP?"bold ":"")+"12px sans-serif";ctx.fillText(txt,cx+CW/2,y+21);cx+=CW;
      });
      ctx.fillStyle=e?C[o.idx].tx:"#ccc";ctx.font="bold 13px sans-serif";ctx.fillText(e?""+e.runningTotal:"",cx+CW/2,y+21);cx+=CW;
    });
    y+=RH;
  }
  /* Comments */
  if(comments.length>0){
    y+=10;ctx.fillStyle="#14365a";ctx.font="bold 14px sans-serif";ctx.textAlign="left";ctx.fillText("💬 コメント",x,y+16);y+=28;
    comments.forEach(c2=>{ctx.fillStyle="#444";ctx.font="13px sans-serif";ctx.fillText("• "+c2,x+4,y+14);y+=24;});
  }
  return c;
}

async function saveImage(canvas){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(async blob=>{
      if(!blob)return reject("blob failed");
      const file=new File([blob],"molkky-score.png",{type:"image/png"});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:"モルック スコア"});resolve("shared");}catch(e){if(e.name!=="AbortError")reject(e);else resolve("cancelled");}
      }else{
        const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="molkky-score.png";a.click();URL.revokeObjectURL(url);resolve("downloaded");
      }
    },"image/png");
  });
}

/* ═══ Game Result — iPad full screen ═══ */
function GameResult({teams,history,teamOrder,winner,gameWins,bestOf,numGames,gameNumber,onNext,onBack,onExtend}){
  const[comment,setComment]=useState("");const[comments,setComments]=useState([]);
  const[ordMode,setOrdMode]=useState("reverse");const[ordVal,setOrdVal]=useState([...teamOrder].reverse());
  const[saving,setSaving]=useState(false);
  const tw=gameWins||teams.map(()=>0);
  const matchWin=bestOf>0?tw.findIndex(w=>w>=bestOf):-1;
  const isMatchOver=matchWin>=0;const isLastGame=numGames>0&&gameNumber>=numGames&&!isMatchOver;
  const isAllDone=isMatchOver||isLastGame;const canContinue=!isAllDone;
  const addC=()=>{if(comment.trim()){setComments(p=>[...p,comment.trim()]);setComment("");}};
  const teamStats=teamOrder.map(ti=>{const th=history.filter(h=>h.teamIndex===ti);const sc=th.filter(h=>h.type==="score");return{ti,name:teams[ti].name,final:scoreOf(history,ti),totalPts:sc.reduce((s,h)=>s+h.score,0),misses:th.filter(h=>h.type==="miss").length,faults:th.filter(h=>h.type==="fault").length,turns:th.length};});
  const handleOrd=(m,v)=>{setOrdMode(m);setOrdVal(v);};
  const doSave=async()=>{setSaving(true);try{const canvas=drawScoreImage(teams,history,teamOrder,comments,gameNumber);await saveImage(canvas);}catch(e){console.error(e);}setSaving(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"#f0f3f8",zIndex:100,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",background:"#14365a",flexShrink:0}}>
        <h2 style={{fontSize:24,fontWeight:900,color:"#fff",margin:0}}>🏆 Game {gameNumber} 結果</h2>
        <div/>
      </div>
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",padding:"14px 20px"}}>
        <div style={{textAlign:"center",marginBottom:12}}>
          <h2 style={{fontSize:30,fontWeight:900,color:C[winner]?.ac||"#14365a",margin:0}}>{teams[winner]?.name} 勝利！</h2>
          {isMatchOver&&<div style={{fontSize:22,fontWeight:900,color:"#22b566",marginTop:4}}>🎊 {teams[matchWin].name} {bestOf}先取達成！</div>}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>{teamOrder.map(ti=>(<div key={ti} style={{textAlign:"center",padding:"12px 24px",borderRadius:16,background:ti===winner?C[ti].lt:"#fff",border:ti===winner?"3px solid "+C[ti].ac:"2px solid #e0e0e0"}}>
          <div style={{fontSize:17,fontWeight:700,color:C[ti].tx}}>{teams[ti].name}</div>
          <div style={{fontSize:44,fontWeight:900,color:C[ti].ac,lineHeight:1.1}}>{tw[ti]}</div>
          <div style={{fontSize:13,fontWeight:800,color:"#888"}}>勝</div>
        </div>))}</div>

        {/* Save button above score table */}
        <button onClick={doSave} disabled={saving} style={{width:"100%",padding:"14px 0",border:"none",borderRadius:10,background:"#22b566",color:"#fff",fontSize:18,fontWeight:800,cursor:"pointer",marginBottom:10,opacity:saving?0.5:1}}>{saving?"保存中...":"📸 スコア表を画像保存"}</button>

        <div style={{background:"#fff",borderRadius:14,padding:14,marginBottom:14,border:"1px solid #ddd"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:8}}>📋 スコア表</div>
          <div style={{overflow:"auto",WebkitOverflowScrolling:"touch"}}>
            <ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={false} fontSize={16} colW={50} roundW={36} nameH={90} forCapture={true}/>
          </div>
          <div style={{marginTop:10}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:15}}><thead><tr style={{background:"#14365a",color:"#fff"}}><th style={{padding:"7px 8px",textAlign:"left"}}>チーム</th><th style={{padding:"7px"}}>最終</th><th style={{padding:"7px"}}>得点計</th><th style={{padding:"7px"}}>ミス</th><th style={{padding:"7px"}}>フォルト</th><th style={{padding:"7px"}}>ターン</th></tr></thead><tbody>{teamStats.map((ts,i)=>(<tr key={i} style={{background:ts.ti===winner?"#fffde6":"#fff",borderBottom:"1px solid #eee"}}><td style={{padding:"7px 8px",fontWeight:700,color:C[ts.ti].tx}}>{ts.ti===winner?"🏆":""}{ts.name}</td><td style={{padding:"7px",textAlign:"center",fontWeight:800,color:C[ts.ti].ac}}>{ts.final}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.totalPts}</td><td style={{padding:"7px",textAlign:"center",color:"#bf6900"}}>{ts.misses}</td><td style={{padding:"7px",textAlign:"center",color:"#c0392b"}}>{ts.faults}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.turns}</td></tr>))}</tbody></table>
          </div>
          {comments.length>0&&<div style={{marginTop:10,borderTop:"1px solid #eee",paddingTop:8}}>
            <div style={{fontSize:15,fontWeight:700,color:"#14365a",marginBottom:4}}>💬 コメント</div>
            {comments.map((c2,i)=><div key={i} style={{padding:"5px 10px",background:"#f8f9fa",borderRadius:6,marginBottom:3,fontSize:14,color:"#444"}}>{c2}</div>)}
          </div>}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:17,fontWeight:800,color:"#14365a",marginBottom:5}}>💬 コメント追加</div>
          <div style={{display:"flex",gap:6}}>
            <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="コメント..." onKeyDown={e=>{if(e.key==="Enter")addC();}} style={{flex:1,padding:"12px 14px",border:"1px solid #ddd",borderRadius:10,fontSize:17,outline:"none"}}/>
            <button onClick={addC} style={{padding:"12px 20px",border:"none",borderRadius:10,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:16,cursor:"pointer",opacity:comment.trim()?1:0.3}}>追加</button>
          </div>
        </div>
        {canContinue&&(<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #ddd"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:8}}>次ゲームの投げ順</div>
          <OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder}/>
          <button onClick={()=>onNext(ordVal)} style={{width:"100%",padding:"16px 0",border:"none",borderRadius:12,background:"#14365a",color:"#fff",fontSize:19,fontWeight:700,cursor:"pointer",marginTop:6}}>次のゲーム開始</button>
        </div>)}
        {isAllDone&&(<div style={{background:"#fff",borderRadius:14,padding:16,marginBottom:12,border:"1px solid #d0dff0"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#14365a",marginBottom:5}}>🔄 ゲーム継続・延長</div>
          <OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd} prevOrder={teamOrder}/>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <button onClick={()=>onExtend("game",ordVal)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"#2b7de9",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1ゲーム追加</button>
            {isMatchOver&&<button onClick={()=>onExtend("set",ordVal)} style={{flex:1,padding:"14px 0",border:"none",borderRadius:10,background:"#22b566",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>＋1セット延長</button>}
          </div>
        </div>)}
        <button onClick={onBack} style={{width:"100%",padding:"16px 0",border:"2px solid #14365a",borderRadius:12,background:"transparent",color:"#14365a",fontSize:19,fontWeight:700,cursor:"pointer",marginBottom:24}}>設定に戻る</button>
      </div>
    </div>
  );
}

function GameScreen({initialTeams,initialOrder,bestOf:iBo,numGames:iNg,dqEnd,goBack}){
  const init={teams:initialTeams.map(t=>({...t,players:t.players.map(n=>({name:n,active:true}))})),history:[],currentOrderIdx:0,currentTurn:1,teamOrder:initialOrder,eliminated:initialTeams.map(()=>false),winner:null,gameNumber:1,dqEndGame:dqEnd,autoEnd:false};
  const[st,dispatch]=useReducer(reducer,init);
  const{teams,history,currentOrderIdx,currentTurn,teamOrder,eliminated,winner,gameNumber}=st;
  const[showPl,setShowPl]=useState(false);const[showRes,setShowRes]=useState(false);
  const[view,setView]=useState("both");const[conf,setConf]=useState(null);
  const[gW,setGW]=useState(()=>initialTeams.map(()=>0));
  const[numGames,setNumGames]=useState(iNg);const[bestOf,setBestOf]=useState(iBo);
  const[saveDialog,setSaveDialog]=useState(false);const[inputMin,setInputMin]=useState(false);
  const ti=teamOrder[currentOrderIdx];const score=scoreOf(history,ti);const fails=failsOf(history,ti);
  const ap=teams[ti]?.players.filter(p=>p.active)||[];const td=history.filter(h=>h.teamIndex===ti).length;
  const cp=ap.length>0?ap[td%ap.length]:null;const cpIdx=ap.length>0?td%ap.length:0;
  const activeCell=winner===null?{teamIndex:ti,playerIndex:cpIdx,turn:currentTurn}:null;
  useEffect(()=>{if(winner!==null&&!showRes){setGW(p=>{const n=[...p];n[winner]++;return n;});setShowRes(true);}},[winner]);
  const execConf=()=>{if(!conf)return;if(conf.t==="score")dispatch({type:"SCORE",score:conf.s});else if(conf.t==="miss")dispatch({type:"MISS"});else dispatch({type:"FAULT"});setConf(null);};
  const handleNext=order=>{dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);};
  const handleExtend=(type,order)=>{if(type==="game")setNumGames(p=>p+1);else if(type==="set")setBestOf(p=>p+1);dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);};
  const extractTeamInfo=()=>teams.map(t=>({name:t.name,players:t.players.map(p=>p.name)}));
  const handleBack=()=>setSaveDialog(true);
  const doBack=save=>{setSaveDialog(false);setShowRes(false);goBack(save?extractTeamInfo():null);};
  const TeamBar=()=>(<div style={{display:"flex",background:"#fff",borderBottom:"2px solid #e0e0e0",flexShrink:0,overflow:"auto"}}>{teamOrder.map((tIdx,oi)=>{
    const t=teams[tIdx];const sc=scoreOf(history,tIdx);const f=failsOf(history,tIdx);const act=tIdx===ti;const el=eliminated[tIdx];
    const tap=t.players.filter(p=>p.active);const ttd=history.filter(h=>h.teamIndex===tIdx).length;const tcp=tap.length>0?tap[ttd%tap.length]:null;
    return(<div key={oi} style={{flex:1,minWidth:0,padding:"6px 10px 4px",textAlign:"center",borderLeft:oi>0?"1px solid #e8e8e8":"none",background:act?C[tIdx].lt:"transparent",opacity:el?0.25:1,position:"relative"}}>
      {act&&<div style={{position:"absolute",top:0,left:0,right:0,height:4,background:C[tIdx].ac,borderRadius:"0 0 2px 2px"}}/>}
      <div style={{fontSize:14,fontWeight:700,color:C[tIdx].tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}{el?" ✕":""}{(bestOf>0||numGames>1)?" ["+gW[tIdx]+"勝]":""}</div>
      <div style={{fontSize:48,fontWeight:900,color:C[tIdx].ac,lineHeight:1}}>{sc}</div>
      <div style={{display:"flex",gap:4,justifyContent:"center",marginTop:4}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:18,height:18,borderRadius:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,background:j<f?"#e74c3c":"#e0e0e0",color:j<f?"#fff":"transparent"}}>✕</span>))}</div>
      {tcp&&<div style={{fontSize:13,fontWeight:700,color:act?"#444":"#aaa",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{act?"🎯":""}{tcp.name}</div>}
    </div>);
  })}</div>);
  return(
    <div style={SS.gW}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 10px",background:"#14365a",flexShrink:0}}>
        <div style={{display:"flex",gap:5}}><button style={SS.tBtn} onClick={handleBack}>◀</button><button style={SS.tBtn} onClick={()=>setShowPl(true)}>👥</button></div>
        <span style={{fontSize:16,fontWeight:800,color:"#fff"}}>G{gameNumber} R{currentTurn}{bestOf>0?" "+bestOf+"先取":""}{numGames>1?" /"+numGames+"G":""}</span>
        <div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:7,padding:2,gap:2}}>
          {[["both","両方"],["sheet","表"],["input","入力"]].map(([k,l])=>(<button key={k} onClick={()=>setView(k)} style={{padding:"5px 11px",border:"none",borderRadius:5,background:view===k?"rgba(255,255,255,0.2)":"transparent",color:view===k?"#fff":"rgba(255,255,255,0.4)",fontSize:13,fontWeight:600,cursor:"pointer"}}>{l}</button>))}
        </div>
      </div>
      <TeamBar/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
        {(view==="both"||view==="sheet")&&(<div style={{flex:1,minHeight:0,overflow:"hidden"}}><GameSheet teams={teams} history={history} currentTurn={currentTurn} teamOrder={teamOrder} activeCell={activeCell}/></div>)}
        {(view==="both"||view==="input")&&(<ScoreInput dispatch={dispatch} canUndo={history.length>0} teamName={teams[ti].name} teamScore={score} teamColor={C[ti].ac} playerName={cp?.name} fails={fails} onConfirm={(t,s,m)=>setConf({t,s,msg:m})} minimized={inputMin} onToggleMin={()=>setInputMin(p=>!p)}/>)}
      </div>
      {showPl&&<PlModal teams={teams} dispatch={dispatch} onClose={()=>setShowPl(false)}/>}
      {conf&&<Confirm msg={conf.msg} onOk={execConf} onCancel={()=>setConf(null)}/>}
      {showRes&&winner!==null&&<GameResult teams={teams} history={history} teamOrder={teamOrder} winner={winner} gameWins={gW} bestOf={bestOf} numGames={numGames} gameNumber={gameNumber} onNext={handleNext} onBack={handleBack} onExtend={handleExtend}/>}
      {saveDialog&&<Confirm msg={"チーム・プレイヤー情報を\n設定画面に保存しますか？"} sub={"保存すると次のゲームで\n同じメンバーをすぐ使えます"} okLabel="保存する" cancelLabel="保存しない" thirdLabel="キャンセル（試合に戻る）" onOk={()=>doBack(true)} onCancel={()=>doBack(false)} onThird={()=>setSaveDialog(false)}/>}
    </div>
  );
}

export default function App(){
  const[scr,setScr]=useState("setup");const[cfg,setCfg]=useState(null);const[saved,setSaved]=useState(null);
  return(<div style={{width:"100%",height:"100dvh"}}>
    {scr==="setup"?<SetupScreen savedTeams={saved} onStart={(t,o,ng,bo,dq)=>{setCfg({t,o,ng,bo,dq});setScr("game");}}/>:
    <GameScreen initialTeams={cfg.t} initialOrder={cfg.o} bestOf={cfg.bo} numGames={cfg.ng} dqEnd={cfg.dq} goBack={saveData=>{if(saveData)setSaved(saveData);setScr("setup");setCfg(null);}}/>}
  </div>);
}

const SS={
  gW:{height:"100dvh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden"},
  tBtn:{padding:"6px 12px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:6,background:"transparent",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:12},
  mod:{background:"#fff",borderRadius:18,padding:20,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"auto",WebkitOverflowScrolling:"touch"},
  clsB:{width:38,height:38,border:"none",borderRadius:8,background:"#f0f0f0",fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
};
