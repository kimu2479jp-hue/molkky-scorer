import { useState, useReducer, useRef, useEffect } from "react";

const MAX_TEAMS=4,MAX_PL=5,MAX_SHUF=20,MAX_NAME=7,WIN=50,RST=25,PEN=37,MF=3;
const COL_W=34;
const C=[
  {bg:"#14365a",lt:"#e6f0fb",ac:"#2b7de9",tx:"#14365a"},
  {bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30"},
  {bg:"#1a5c3a",lt:"#e6faf0",ac:"#22b566",tx:"#1a5c3a"},
  {bg:"#6b5a1d",lt:"#fbf5e6",ac:"#d9a83a",tx:"#6b5a1d"},
];

/* ═══ Favorites ═══ */
const LS_KEY="mk-fav";
function loadFavs(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):[];}catch(e){return[];}}
function saveFavs(l){try{localStorage.setItem(LS_KEY,JSON.stringify(l));}catch(e){}}
function useFavs(){
  const[f,sF]=useState(()=>loadFavs());
  const addF=n=>{const x=n.trim().slice(0,MAX_NAME);if(x&&!f.includes(x)){const u=[...f,x];sF(u);saveFavs(u);}};
  const rmF=n=>{const u=f.filter(v=>v!==n);sF(u);saveFavs(u);};
  return{favs:f,addF,rmF};
}

/* ═══ Helpers ═══ */
const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const scoreOf=(h,t)=>{for(let i=h.length-1;i>=0;i--)if(h[i].teamIndex===t)return h[i].runningTotal;return 0;};
const failsOf=(h,t)=>{let c=0;for(let i=h.length-1;i>=0;i--){if(h[i].teamIndex===t){if(h[i].type==="miss"||h[i].type==="fault")c++;else break;}}return c;};
const getFA=(hist,tIdx,turn)=>{let c=0;const th=hist.filter(h=>h.teamIndex===tIdx&&h.turn<=turn);for(let i=th.length-1;i>=0;i--){if(th[i].type==="miss"||th[i].type==="fault")c++;else break;}return c;};

/* ═══ Reducer ═══ */
function adv(s){
  let oi=(s.currentOrderIdx+1)%s.teamOrder.length,t=s.currentTurn;
  if(oi===0)t++;
  let x=0;while(s.eliminated[s.teamOrder[oi]]&&x<s.teamOrder.length){oi=(oi+1)%s.teamOrder.length;if(oi===0)t++;x++;}
  const alive=s.teamOrder.filter(ti=>!s.eliminated[ti]);
  if(alive.length<=1)return{...s,currentOrderIdx:oi,currentTurn:t,winner:alive.length===1?alive[0]:null,autoEnd:true};
  return{...s,currentOrderIdx:oi,currentTurn:t};
}
function reducer(s,a){
  const ti=s.teamOrder[s.currentOrderIdx];
  const gPI=()=>{const ap=s.teams[ti].players.filter(p=>p.active);const td=s.history.filter(h=>h.teamIndex===ti).length;return{ap,pi:ap.length>0?td%ap.length:0};};
  switch(a.type){
    case "SCORE":{
      if(s.eliminated[ti])return adv(s);
      const pv=scoreOf(s.history,ti);let ns=pv+a.score,r25=false;
      if(ns>WIN){ns=RST;r25=true;}
      const{ap,pi}=gPI();
      const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"score",score:a.score,runningTotal:ns,prevScore:pv,reset25:r25,faultReset:false};
      const nh=[...s.history,e];
      if(ns===WIN)return{...s,history:nh,winner:ti};
      return adv({...s,history:nh});
    }
    case "MISS":{
      if(s.eliminated[ti])return adv(s);
      const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv;
      let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}
      const{ap,pi}=gPI();
      const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"miss",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:false,consecutiveFails:cf};
      const ns2={...s,history:[...s.history,e],eliminated:ne};
      if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}
      return adv(ns2);
    }
    case "FAULT":{
      if(s.eliminated[ti])return adv(s);
      const pv=scoreOf(s.history,ti);const cf=failsOf(s.history,ti)+1;const ne=[...s.eliminated];let rt=pv,fr=false;
      if(pv>=PEN){rt=RST;fr=true;}let jE=false;if(cf>=MF){ne[ti]=true;rt=0;jE=true;}
      const{ap,pi}=gPI();
      const e={turn:s.currentTurn,teamIndex:ti,playerIndex:pi,playerName:ap[pi]?.name||"",type:"fault",score:0,runningTotal:rt,prevScore:pv,reset25:false,faultReset:fr,consecutiveFails:cf};
      const ns2={...s,history:[...s.history,e],eliminated:ne};
      if(jE&&s.dqEndGame){const al=s.teamOrder.filter(i=>!ne[i]);if(al.length<=1)return{...ns2,winner:al.length===1?al[0]:null,autoEnd:true};}
      return adv(ns2);
    }
    case "UNDO":{
      if(!s.history.length)return s;const last=s.history[s.history.length-1];const nh=s.history.slice(0,-1);
      const ne=[...s.eliminated];if(s.eliminated[last.teamIndex])ne[last.teamIndex]=false;
      const oi=s.teamOrder.indexOf(last.teamIndex);
      return{...s,history:nh,currentOrderIdx:oi>=0?oi:0,currentTurn:last.turn,eliminated:ne,winner:null,autoEnd:false};
    }
    case "SET_TEAMS":return{...s,teams:a.teams};
    case "RESET_GAME":return{...s,history:[],currentOrderIdx:0,currentTurn:1,eliminated:s.teams.map(()=>false),winner:null,autoEnd:false,teamOrder:a.teamOrder||s.teamOrder,gameNumber:(s.gameNumber||1)+1};
    default:return s;
  }
}

/* ═══ Confirm ═══ */
function Confirm({msg,sub,okLabel,cancelLabel,onOk,onCancel}){
  return(<div style={SS.ov}><div style={{background:"#fff",borderRadius:18,padding:"22px 18px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 10px 36px rgba(0,0,0,0.25)"}}>
    <div style={{fontSize:34,marginBottom:5}}>⚠️</div>
    <div style={{fontSize:15,fontWeight:800,color:"#14365a",marginBottom:4,whiteSpace:"pre-line"}}>{msg}</div>
    {sub&&<div style={{fontSize:11,color:"#888",marginBottom:10,whiteSpace:"pre-line"}}>{sub}</div>}
    <div style={{display:"flex",gap:8}}>
      <button onClick={onCancel} style={{flex:1,padding:"10px 0",border:"2px solid #14365a",borderRadius:9,background:"transparent",color:"#14365a",fontSize:13,fontWeight:700,cursor:"pointer"}}>{cancelLabel||"キャンセル"}</button>
      <button onClick={onOk} style={{flex:1,padding:"10px 0",border:"none",borderRadius:9,background:"#14365a",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>{okLabel||"確定"}</button>
    </div>
  </div></div>);
}

/* ═══ FavPicker ═══ */
function FavPick({favs,onPick,onClose,addF,rmF}){
  const[n,sN]=useState("");
  return(<div style={SS.ov} onClick={onClose}><div style={{...SS.mod,maxWidth:380}} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
      <h3 style={{fontSize:15,fontWeight:900,color:"#14365a"}}>⭐ 登録プレイヤー</h3>
      <button style={SS.clsB} onClick={onClose}>✕</button></div>
    {favs.length===0&&<div style={{padding:10,textAlign:"center",color:"#aaa",fontSize:11}}>登録なし</div>}
    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
      {favs.map(f=><div key={f} style={{display:"flex",background:"#f0f6ff",borderRadius:6,overflow:"hidden",border:"1px solid #d0dff0"}}>
        <button onClick={()=>{onPick(f);onClose();}} style={{padding:"6px 9px",border:"none",background:"transparent",fontSize:12,fontWeight:600,color:"#14365a",cursor:"pointer"}}>{f}</button>
        <button onClick={()=>rmF(f)} style={{padding:"6px 5px",border:"none",borderLeft:"1px solid #d0dff0",background:"transparent",color:"#c0392b",fontSize:10,fontWeight:700,cursor:"pointer"}}>✕</button>
      </div>)}</div>
    <div style={{borderTop:"1px solid #eee",paddingTop:8}}>
      <div style={{fontSize:11,fontWeight:700,color:"#555",marginBottom:4}}>新規登録（{MAX_NAME}文字）</div>
      <div style={{display:"flex",gap:4}}>
        <input value={n} onChange={e=>sN(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder="名前" style={{flex:1,padding:"6px 7px",border:"1px solid #ddd",borderRadius:6,fontSize:12,outline:"none"}}/>
        <button onClick={()=>{if(n.trim()){addF(n.trim());sN("");}}} style={{padding:"6px 12px",border:"none",borderRadius:6,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer",opacity:n.trim()?1:0.3}}>登録</button>
      </div></div>
  </div></div>);
}

/* ═══ Vertical name style (shared constant) ═══ */
const VT={writingMode:"vertical-rl",WebkitWritingMode:"vertical-rl",textOrientation:"upright",WebkitTextOrientation:"upright",letterSpacing:"-1px",lineHeight:1,margin:"0 auto",whiteSpace:"nowrap",overflow:"hidden",display:"inline-block",maxHeight:75,fontSize:9};

/* ═══ UNIFIED SCORE TABLE ═══ */
function ScoreTable({teams,history,teamOrder,highlightLast}){
  const maxT=history.length>0?Math.max(...history.map(h=>h.turn)):0;
  if(maxT===0)return <div style={{padding:16,textAlign:"center",color:"#aaa",fontSize:12}}>データなし</div>;
  const ordered=teamOrder.map(i=>({team:teams[i],idx:i,ap:teams[i].players.filter(p=>p.active)}));

  return(
    <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}>
      <colgroup>
        <col style={{width:28}}/>
        {ordered.map(o=><React.Fragment key={o.idx}>{o.ap.map((_,pi)=><col key={pi} style={{width:COL_W}}/>)}<col style={{width:COL_W}}/></React.Fragment>)}
      </colgroup>
      <thead>
        <tr>
          <th rowSpan={2} style={{...SS.th,position:"sticky",top:0,zIndex:6,width:28}}>R</th>
          {ordered.map(o=><th key={o.idx} colSpan={o.ap.length+1} style={{...SS.th,background:C[o.idx].bg,borderLeft:`2px solid ${C[o.idx].ac}`,position:"sticky",top:0,zIndex:6}}>{o.team.name}</th>)}
        </tr>
        <tr>
          {ordered.map(o=><React.Fragment key={o.idx}>
            {o.ap.map((p,pi)=><th key={pi} style={{...SS.thP,borderLeft:pi===0?`2px solid ${C[o.idx].ac}`:"1px solid rgba(255,255,255,0.12)",position:"sticky",top:20,zIndex:6}}>
              <span style={VT}>{p.name.slice(0,MAX_NAME)}</span></th>)}
            <th style={{...SS.thP,fontWeight:800,background:"#0d2a48",borderLeft:"1px solid rgba(255,255,255,0.15)",position:"sticky",top:20,zIndex:6}}>
              <span style={VT}>計</span></th>
          </React.Fragment>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({length:maxT},(_,i)=>i+1).map(turn=>{
          const isLast=highlightLast&&turn===maxT;
          return(<tr key={turn} style={isLast?{background:"#fffde6"}:{}}>
            <td style={{...SS.td,fontWeight:700,color:"#aaa",fontSize:9}}>{turn}</td>
            {ordered.map(o=>{
              const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);
              const cf=e?getFA(history,o.idx,turn):0;
              return(<React.Fragment key={o.idx}>
                {o.ap.map((p,pi)=>{
                  const isP=e&&e.playerIndex===pi;
                  let txt="",clr="#333",bg="transparent",fw=400;
                  if(isP){
                    if((e.type==="miss"||e.type==="fault")&&cf===1)bg="#fff9db";
                    if((e.type==="miss"||e.type==="fault")&&cf>=2)bg="#ffe0e0";
                    if(e.type==="miss"){txt="M";clr="#bf6900";fw=800;}
                    else if(e.type==="fault"&&e.faultReset){txt="F↓";clr="#c0392b";fw=800;}
                    else if(e.type==="fault"){txt="F";clr="#c0392b";fw=800;}
                    else if(e.reset25){txt=`${e.score}↓`;clr="#d93a5e";fw=800;}
                    else{txt=e.score;clr=C[o.idx].tx;fw=700;}
                    if(e.consecutiveFails>=MF)txt+="✕";
                  }
                  return <td key={pi} style={{...SS.td,color:clr,fontWeight:fw,background:bg,borderLeft:pi===0?`2px solid ${C[o.idx].ac}33`:"1px solid #f0f0f0"}}>{txt}</td>;
                })}
                <td style={{...SS.td,fontWeight:800,color:C[o.idx].tx,background:e?"#f8f9fb":"transparent",borderLeft:"1px solid #e0e0e0"}}>{e?e.runningTotal:""}</td>
              </React.Fragment>);
            })}
          </tr>);
        })}
      </tbody>
    </table>
  );
}

/* ═══ Game Sheet (auto-scroll) ═══ */
function GameSheet({teams,history,currentTurn,teamOrder}){
  const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[history.length]);
  return(<div ref={ref} style={{height:"100%",overflow:"auto",WebkitOverflowScrolling:"touch"}}>
    <ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={true}/>
  </div>);
}

/* ═══ Setup ═══ */
function SetupScreen({onStart,savedTeams}){
  const{favs,addF,rmF}=useFavs();
  const[mode,setMode]=useState("manual");
  const[tc,setTc]=useState(savedTeams?savedTeams.length:2);
  const[om,setOm]=useState("normal");
  const[numGames,setNumGames]=useState(1);
  const[bestOf,setBestOf]=useState(0);
  const[dqEnd,setDqEnd]=useState(true);
  const[teams,setTeams]=useState(()=>{
    if(savedTeams){const base=savedTeams.map(t=>({name:t.name,players:t.players.length>0?t.players:[""]}));while(base.length<MAX_TEAMS)base.push({name:`チーム${base.length+1}`,players:[""]});return base.slice(0,MAX_TEAMS);}
    return Array.from({length:MAX_TEAMS},(_,i)=>({name:`チーム${i+1}`,players:[""]}));
  });
  const[mems,setMems]=useState(Array(4).fill(""));
  const[sp,setSp]=useState(null);
  const[showFav,setShowFav]=useState(null);

  const uN=(i,v)=>setTeams(p=>p.map((t,j)=>j===i?{...t,name:v}:t));
  const uP=(ti,pi,v)=>setTeams(p=>p.map((t,i)=>i===ti?{...t,players:t.players.map((pl,j)=>j===pi?v.slice(0,MAX_NAME):pl)}:t));
  const aP=ti=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length<MAX_PL?{...t,players:[...t.players,""]}:t));
  const rP=(ti,pi)=>setTeams(p=>p.map((t,i)=>i===ti&&t.players.length>1?{...t,players:t.players.filter((_,j)=>j!==pi)}:t));
  const uM=(i,v)=>setMems(p=>p.map((m,j)=>j===i?v.slice(0,MAX_NAME):m));
  const aM=()=>{if(mems.length<MAX_SHUF)setMems(p=>[...p,""]);};
  const rM=i=>{if(mems.length>2)setMems(p=>p.filter((_,j)=>j!==i));};
  const doShuf=()=>{const names=mems.filter(m=>m.trim());if(names.length<tc)return;const s=shuf(names);const r=Array.from({length:tc},(_,i)=>({name:`チーム${i+1}`,players:[]}));s.forEach((n,i)=>r[i%tc].players.push(n));setSp(r);};
  const okM=teams.slice(0,tc).every(t=>t.name.trim()&&t.players.some(p=>p.trim()));
  const okS=mems.filter(m=>m.trim()).length>=tc;
  const go=()=>{let ft;if(mode==="manual")ft=teams.slice(0,tc).map(t=>({...t,players:t.players.filter(p=>p.trim())}));else{if(!sp)return;ft=sp;}let ord=Array.from({length:ft.length},(_,i)=>i);if(om==="random")ord=shuf(ord);onStart(ft,ord,numGames,bestOf,dqEnd);};
  const pickFav=name=>{if(!showFav)return;if(showFav.m==="manual")uP(showFav.ti,showFav.pi,name);else uM(showFav.idx,name);};

  const Bdg=({c,children})=><div style={{width:24,height:24,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:12,flexShrink:0,background:c}}>{children}</div>;

  return(
    <div style={SS.setupW}>
      <div style={{padding:"22px 16px 4px",textAlign:"center"}}>
        <div style={{fontSize:40}}>🪵</div>
        <h1 style={{fontSize:24,fontWeight:900,color:"#fff",letterSpacing:3}}>モルック スコアラー</h1>
        <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontWeight:600,letterSpacing:4}}>MÖLKKY SCORER</div>
      </div>
      <div style={SS.setupB}>
        <div style={SS.sec}><label style={SS.sL}>入力モード</label>
          <div style={{display:"flex",gap:5}}>{[["manual","✏️ 手動"],["shuffle","🎲 ランダム"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setMode(k);setSp(null);}} style={{...SS.ch,...(mode===k?SS.chA:{})}}>{l}</button>))}</div></div>

        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1}}><label style={SS.sL}>チーム数</label>
            <div style={{display:"flex",gap:5}}>{[2,3,4].map(n=>(
              <button key={n} onClick={()=>{setTc(n);setSp(null);}} style={{...SS.ch,...(tc===n?SS.chA:{}),padding:"8px 0"}}>{n}</button>))}</div></div>
          <div style={{flex:1}}><label style={SS.sL}>投げ順</label>
            <div style={{display:"flex",gap:5}}>{[["normal","通常"],["random","ランダム"]].map(([k,l])=>(
              <button key={k} onClick={()=>setOm(k)} style={{...SS.ch,...(om===k?SS.chA:{})}}>{l}</button>))}</div></div>
        </div>

        <div style={{display:"flex",gap:5,marginBottom:8}}>
          <div style={{flex:"1 1 0"}}><label style={SS.sL}>ゲーム数</label>
            <select value={numGames} onChange={e=>setNumGames(+e.target.value)} style={SS.sel}>
              {Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}ゲーム</option>)}</select></div>
          <div style={{flex:"1 1 0"}}><label style={SS.sL}>先取機能</label>
            <select value={bestOf} onChange={e=>setBestOf(+e.target.value)} style={SS.sel}>
              <option value={0}>なし</option>
              {Array.from({length:11},(_,i)=>i+2).map(n=><option key={n} value={n}>{n}先取</option>)}</select></div>
          <div style={{flex:"1 1 0"}}><label style={SS.sL}>失格時</label>
            <select value={dqEnd?"end":"cont"} onChange={e=>setDqEnd(e.target.value==="end")} style={SS.sel}>
              <option value="end">即終了</option><option value="cont">継続</option></select></div>
        </div>

        <div style={{padding:"7px 10px",background:"rgba(43,125,233,0.12)",borderRadius:7,border:"1px solid rgba(43,125,233,0.2)",marginBottom:8}}>
          <div style={{fontWeight:800,fontSize:11,color:"#fff",marginBottom:2}}>📋 公式ルール</div>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",lineHeight:1.6}}>50点で勝利/超過→25点/37点以上でフォルト→25点/ミス＝倒れず(戻らない)/フォルト＝反則/3連続→失格</div></div>

        {mode==="manual"&&(<>
          {teams.slice(0,tc).map((team,ti)=>(
            <div key={ti} style={{...SS.card,borderLeft:`4px solid ${C[ti].ac}`}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <Bdg c={C[ti].ac}>{ti+1}</Bdg>
                <input value={team.name} onChange={e=>uN(ti,e.target.value)} style={SS.tIn} placeholder={`チーム${ti+1}`}/>
              </div>
              <div style={{paddingLeft:36}}>
                {team.players.map((p,pi)=>(
                  <div key={pi} style={{display:"flex",alignItems:"center",gap:3,marginBottom:3}}>
                    <span style={{width:13,fontSize:9,color:"#aaa",fontWeight:700,textAlign:"center"}}>{pi+1}</span>
                    <input value={p} onChange={e=>uP(ti,pi,e.target.value)} maxLength={MAX_NAME} style={SS.pIn} placeholder={`名前(${MAX_NAME}文字)`}/>
                    <button style={SS.favB} onClick={()=>setShowFav({m:"manual",ti,pi})}>⭐</button>
                    {team.players.length>1&&<button style={SS.pRm} onClick={()=>rP(ti,pi)}>✕</button>}
                  </div>))}
                {team.players.length<MAX_PL&&<button style={SS.pAdd} onClick={()=>aP(ti)}>＋ 追加</button>}
              </div>
            </div>))}
          <button style={{...SS.stBtn,opacity:okM?1:0.3}} onClick={okM?go:undefined}>🎯 ゲーム開始</button>
        </>)}

        {mode==="shuffle"&&(<>
          <div style={SS.card}>
            <div style={{fontWeight:700,fontSize:12,marginBottom:3,color:"#14365a"}}>参加メンバー（最大{MAX_SHUF}人）</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3}}>
              {mems.map((m,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:2}}>
                  <span style={{width:14,fontSize:8,color:"#aaa",fontWeight:700,textAlign:"right"}}>{i+1}</span>
                  <input value={m} onChange={e=>uM(i,e.target.value)} maxLength={MAX_NAME} style={{...SS.pIn,padding:"4px 5px",fontSize:11}} placeholder="メンバー"/>
                  <button style={{...SS.favB,width:18,height:18,fontSize:8}} onClick={()=>setShowFav({m:"shuffle",idx:i})}>⭐</button>
                  {mems.length>2&&<button style={{...SS.pRm,width:18,height:18,fontSize:8}} onClick={()=>rM(i)}>✕</button>}
                </div>))}
            </div>
            {mems.length<MAX_SHUF&&<button style={{...SS.pAdd,marginTop:2}} onClick={aM}>＋</button>}
          </div>
          <button style={{...SS.shBtn,opacity:okS?1:0.3}} onClick={okS?doShuf:undefined}>🎲 シャッフル</button>
          {sp&&(<div style={{marginTop:5}}>
            {sp.map((t,ti)=>(<div key={ti} style={{...SS.card,borderLeft:`4px solid ${C[ti].ac}`,padding:"6px 10px",marginBottom:3}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}>
                <Bdg c={C[ti].ac}>{ti+1}</Bdg>
                <input value={t.name} onChange={e=>setSp(p=>p.map((x,i)=>i===ti?{...x,name:e.target.value}:x))} style={{...SS.tIn,fontSize:12}}/></div>
              <div style={{paddingLeft:24,fontSize:10,color:"#555"}}>{t.players.join("、")}</div>
            </div>))}
            <button style={SS.stBtn} onClick={go}>🎯 開始</button>
            <button style={{...SS.shBtn,marginTop:3}} onClick={doShuf}>🔄 再シャッフル</button>
          </div>)}
        </>)}
      </div>
      {showFav&&<FavPick favs={favs} onPick={pickFav} onClose={()=>setShowFav(null)} addF={addF} rmF={rmF}/>}
    </div>
  );
}

/* ═══ Score Input ═══ */
function ScoreInput({dispatch,canUndo,teamName,teamScore,teamColor,playerName,fails,onConfirm}){
  const[sel,setSel]=useState(null);
  const pv=sel!=null?teamScore+sel:null;const over=pv!=null&&pv>WIN;const win=pv===WIN;
  const doScore=()=>{if(sel==null)return;if(win){onConfirm("score",sel,`${teamName}が50点で上がりです。\n確定しますか？`);setSel(null);return;}dispatch({type:"SCORE",score:sel});setSel(null);};
  const doMiss=()=>{if(fails>=MF-1){onConfirm("miss",0,`${teamName}の${MF}回連続です。\n失格になります。確定しますか？`);setSel(null);return;}dispatch({type:"MISS"});setSel(null);};
  const doFault=()=>{if(fails>=MF-1){onConfirm("fault",0,`${teamName}の${MF}回連続です。\n失格になります。確定しますか？`);setSel(null);return;}if(teamScore>=PEN){onConfirm("fault",0,`${teamName}は${teamScore}点（37点以上）。\nフォルトで25点に戻ります。確定しますか？`);setSel(null);return;}dispatch({type:"FAULT"});setSel(null);};
  return(<div style={SS.inW}>
    <div style={{marginBottom:4,padding:"0 2px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
        <span style={{fontSize:14,fontWeight:900,color:teamColor}}>{teamName}</span>
        <span style={{fontSize:18,fontWeight:900,color:"#14365a"}}>{teamScore}点</span>
        {playerName&&<span style={{fontSize:9,fontWeight:600,color:"#888",background:"#f0f0f0",padding:"1px 5px",borderRadius:3}}>▶{playerName}</span>}
        {fails>0&&<span style={{fontSize:8,fontWeight:700,color:"#c0392b",background:"#fde8e8",padding:"1px 4px",borderRadius:3}}>連続{fails}回</span>}
      </div>
      {sel!=null&&<div style={{fontSize:12,fontWeight:700,marginTop:2,color:over?"#d93a5e":win?"#22b566":"#14365a"}}>+{sel}→{over?"超過！25点に戻る":win?"🎉50点勝利！":`${pv}点`}</div>}
      {teamScore>=PEN&&<div style={{fontSize:9,fontWeight:700,color:"#e67700",marginTop:1}}>⚠フォルトで25点に戻ります</div>}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:6}}>
      {[[1,2,3,4],[5,6,7,8],[9,10,11,12]].map((row,ri)=>(
        <div key={ri} style={{display:"flex",gap:5,justifyContent:"center"}}>
          {row.map(n=><button key={n} onClick={()=>setSel(sel===n?null:n)} style={{...SS.nB,...(sel===n?SS.nBA:{})}}>{n}</button>)}</div>))}
    </div>
    <div style={{display:"flex",gap:4}}>
      <button style={{...SS.aB,background:"#eef1f5",color:"#666",opacity:canUndo?1:0.2}} onClick={canUndo?()=>dispatch({type:"UNDO"}):undefined}>↩戻る</button>
      <button style={{...SS.aB,background:"#fff3e0",color:"#bf6900",border:"2px solid #f0d4a0"}} onClick={doMiss}>〇ミス</button>
      <button style={{...SS.aB,background:"#fde8e8",color:"#c0392b",border:"2px solid #f0b0b0"}} onClick={doFault}>✕フォルト</button>
      <button style={{...SS.aB,background:"#14365a",color:"#fff",flex:1.3,opacity:sel!=null?1:0.2,border:"2px solid #14365a"}} onClick={doScore}>決定</button>
    </div>
  </div>);
}

/* ═══ Player Modal ═══ */
function PlModal({teams,dispatch,onClose}){
  const{favs,addF,rmF}=useFavs();const[name,setName]=useState("");const[sf,setSf]=useState(null);
  const sizes=teams.map(t=>t.players.filter(p=>p.active).length);const mi=sizes.indexOf(Math.min(...sizes));const[sel,setSel]=useState(mi);
  const tog=(ti,pi,a)=>{const nt=teams.map((t,i)=>i===ti?{...t,players:t.players.map((p,j)=>j===pi?{...p,active:a}:p)}:t);dispatch({type:"SET_TEAMS",teams:nt});};
  const addN=(n,tI)=>{const nm=(n||name).trim().slice(0,MAX_NAME);const tg=tI??sel;if(!nm||teams[tg].players.length>=MAX_PL)return;const nt=teams.map((t,i)=>i===tg?{...t,players:[...t.players,{name:nm,active:true}]}:t);dispatch({type:"SET_TEAMS",teams:nt});setName("");};
  return(<div style={SS.ov} onClick={onClose}><div style={SS.mod} onClick={e=>e.stopPropagation()}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><h2 style={{fontSize:16,fontWeight:900,color:"#14365a"}}>👥 メンバー</h2><button style={SS.clsB} onClick={onClose}>✕</button></div>
    {teams.map((team,ti)=>(<div key={ti} style={{marginBottom:7}}>
      <div style={{fontSize:12,fontWeight:700,color:C[ti].tx,borderBottom:`2px solid ${C[ti].ac}`,paddingBottom:2,marginBottom:2}}>{team.name}（{team.players.filter(p=>p.active).length}人）</div>
      {team.players.map((p,pi)=>(<div key={pi} style={{display:"flex",alignItems:"center",padding:"3px 6px",background:p.active?"#f8f9fa":"#f0f0f0",borderRadius:4,marginBottom:1,opacity:p.active?1:0.4}}>
        <span style={{flex:1,fontSize:11}}>{p.name}</span>
        <button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"2px 8px",border:"none",borderRadius:3,fontSize:9,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"#fff"}}>{p.active?"退出":"復帰"}</button>
      </div>))}</div>))}
    <div style={{background:"#e6f0fb",borderRadius:7,padding:8,marginTop:4}}>
      <div style={{fontSize:11,fontWeight:700,marginBottom:3}}>➕追加</div>
      <div style={{display:"flex",gap:3}}>
        <select value={sel} onChange={e=>setSel(+e.target.value)} style={{padding:4,borderRadius:4,border:"1px solid #ccc",fontSize:10}}>{teams.map((t,i)=><option key={i} value={i}>{t.name}</option>)}</select>
        <input value={name} onChange={e=>setName(e.target.value.slice(0,MAX_NAME))} maxLength={MAX_NAME} placeholder="名前" style={{flex:1,padding:4,borderRadius:4,border:"1px solid #ccc",fontSize:10}}/>
        <button onClick={()=>addN()} style={{padding:"4px 8px",borderRadius:4,border:"none",background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:10,cursor:"pointer",opacity:name.trim()?1:0.3}}>追加</button>
        <button onClick={()=>setSf(sel)} style={{padding:"4px 6px",borderRadius:4,border:"1px solid #d0dff0",background:"#f0f6ff",fontSize:10,cursor:"pointer"}}>⭐</button>
      </div>
      {sf!==null&&(<div style={{marginTop:4,padding:5,background:"#fff",borderRadius:5,border:"1px solid #ddd"}}>
        {favs.length===0?<div style={{fontSize:9,color:"#aaa"}}>登録なし</div>:
        <div style={{display:"flex",flexWrap:"wrap",gap:2}}>{favs.map(f=>(<button key={f} onClick={()=>{addN(f,sf);setSf(null);}} style={{padding:"3px 6px",border:"1px solid #d0dff0",borderRadius:4,background:"#f0f6ff",fontSize:10,fontWeight:600,color:"#14365a",cursor:"pointer"}}>{f}</button>))}</div>}
        <button onClick={()=>setSf(null)} style={{marginTop:2,padding:"1px 6px",border:"none",borderRadius:2,background:"#eee",fontSize:8,cursor:"pointer"}}>閉じる</button>
      </div>)}
    </div>
  </div></div>);
}

/* ═══ OrderPicker ═══ */
function OrderPicker({teams,teamOrder,value,onChangeOrd}){
  const rev=[...teamOrder].reverse();
  const[man,setMan]=useState([...teamOrder]);
  const mvUp=i=>{if(i===0)return;const m=[...man];[m[i-1],m[i]]=[m[i],m[i-1]];setMan(m);onChangeOrd("manual",m);};
  const pick=v=>{if(v==="same")onChangeOrd("same",[...teamOrder]);else if(v==="reverse")onChangeOrd("reverse",rev);else if(v==="random")onChangeOrd("random",shuf([...teamOrder]));else onChangeOrd("manual",man);};
  const disp=value==="reverse"?rev:value==="manual"?man:value==="same"?[...teamOrder]:null;
  return(<>
    <div style={{display:"flex",gap:3,marginBottom:4}}>
      {[["same","🔁同順"],["reverse","🔄裏"],["random","🎲ランダム"],["manual","✏️手動"]].map(([k,l])=>(
        <button key={k} onClick={()=>pick(k)} style={{flex:1,padding:"5px 0",border:"1px solid #ddd",borderRadius:5,background:value===k?"#14365a":"#fff",color:value===k?"#fff":"#14365a",fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"}}>{l}</button>))}
    </div>
    {disp&&(<div style={{background:"#f8f9fa",borderRadius:5,padding:4,marginBottom:4}}>
      {disp.map((ti,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"1px 0"}}>
        <span style={{fontSize:10,fontWeight:800,color:"#aaa",width:14}}>{i+1}.</span>
        <span style={{fontSize:11,fontWeight:700,color:C[ti]?.tx||"#333"}}>{teams[ti]?.name||""}</span>
        {value==="manual"&&i>0&&<button onClick={()=>mvUp(i)} style={{marginLeft:"auto",padding:"1px 5px",border:"1px solid #ddd",borderRadius:3,background:"#fff",fontSize:8,cursor:"pointer"}}>▲</button>}
      </div>))}
    </div>)}
  </>);
}

/* ═══ Game Result ═══ */
function GameResult({teams,history,teamOrder,winner,gameWins,bestOf,numGames,gameNumber,onNext,onBack,onExtend}){
  const[comment,setComment]=useState("");const[comments,setComments]=useState([]);
  const[ordMode,setOrdMode]=useState("reverse");const[ordVal,setOrdVal]=useState([...teamOrder].reverse());
  const tw=gameWins||teams.map(()=>0);
  const matchWin=bestOf>0?tw.findIndex(w=>w>=bestOf):-1;
  const isMatchOver=matchWin>=0;const isLastGame=numGames>0&&gameNumber>=numGames&&!isMatchOver;
  const isAllDone=isMatchOver||isLastGame;const canContinue=!isAllDone;
  const addC=()=>{if(comment.trim()){setComments(p=>[...p,comment.trim()]);setComment("");}};
  const teamStats=teamOrder.map(ti=>{const th=history.filter(h=>h.teamIndex===ti);const sc=th.filter(h=>h.type==="score");return{ti,name:teams[ti].name,final:scoreOf(history,ti),totalPts:sc.reduce((s,h)=>s+h.score,0),misses:th.filter(h=>h.type==="miss").length,faults:th.filter(h=>h.type==="fault").length,turns:th.length};});
  const handleOrd=(m,v)=>{setOrdMode(m);setOrdVal(v);};

  return(<div style={SS.ov}><div style={{...SS.mod,maxWidth:520,maxHeight:"93vh"}} onClick={e=>e.stopPropagation()}>
    <div style={{textAlign:"center",marginBottom:6}}>
      <div style={{fontSize:40,marginBottom:2}}>🏆</div>
      <h2 style={{fontSize:20,fontWeight:900,color:C[winner]?.ac||"#14365a"}}>{teams[winner]?.name} 勝利！</h2>
      {isMatchOver&&<div style={{fontSize:15,fontWeight:900,color:"#22b566",marginTop:2}}>🎊 {teams[matchWin].name} {bestOf}先取達成！</div>}
    </div>
    <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
      {teamOrder.map(ti=>(<div key={ti} style={{textAlign:"center",padding:"5px 12px",borderRadius:9,background:ti===winner?C[ti].lt:"#f5f6f8",border:ti===winner?`2px solid ${C[ti].ac}`:"2px solid transparent"}}>
        <div style={{fontSize:9,fontWeight:700,color:C[ti].tx}}>{teams[ti].name}</div>
        <div style={{fontSize:26,fontWeight:900,color:C[ti].ac,lineHeight:1.1}}>{tw[ti]}</div>
        <div style={{fontSize:9,fontWeight:800,color:"#888"}}>勝</div>
      </div>))}
    </div>
    <div style={{marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:800,color:"#14365a",marginBottom:2}}>📋 スコア表</div>
      <div style={{maxHeight:250,overflow:"auto",border:"1px solid #ddd",borderRadius:7,WebkitOverflowScrolling:"touch"}}>
        <ScoreTable teams={teams} history={history} teamOrder={teamOrder} highlightLast={false}/>
      </div>
    </div>
    <div style={{marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:800,color:"#14365a",marginBottom:2}}>📊 スタッツ</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}><thead><tr style={{background:"#14365a",color:"#fff"}}>
        <th style={{padding:"3px 4px",textAlign:"left"}}>チーム</th><th style={{padding:"3px"}}>最終</th><th style={{padding:"3px"}}>得点計</th><th style={{padding:"3px"}}>ミス</th><th style={{padding:"3px"}}>フォルト</th><th style={{padding:"3px"}}>ターン</th>
      </tr></thead><tbody>{teamStats.map((ts,i)=>(
        <tr key={i} style={{background:ts.ti===winner?"#fffde6":"#fff",borderBottom:"1px solid #eee"}}>
          <td style={{padding:"3px 4px",fontWeight:700,color:C[ts.ti].tx,fontSize:10}}>{ts.ti===winner?"🏆":""}{ts.name}</td>
          <td style={{padding:"3px",textAlign:"center",fontWeight:800,color:C[ts.ti].ac}}>{ts.final}</td>
          <td style={{padding:"3px",textAlign:"center"}}>{ts.totalPts}</td>
          <td style={{padding:"3px",textAlign:"center",color:"#bf6900"}}>{ts.misses}</td>
          <td style={{padding:"3px",textAlign:"center",color:"#c0392b"}}>{ts.faults}</td>
          <td style={{padding:"3px",textAlign:"center"}}>{ts.turns}</td>
        </tr>))}</tbody></table>
    </div>
    <div style={{marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:800,color:"#14365a",marginBottom:2}}>💬 コメント</div>
      {comments.map((c,i)=><div key={i} style={{padding:"3px 6px",background:"#f8f9fa",borderRadius:4,marginBottom:1,fontSize:10,color:"#444"}}>{c}</div>)}
      <div style={{display:"flex",gap:3,marginTop:2}}>
        <input value={comment} onChange={e=>setComment(e.target.value)} placeholder="コメント..." onKeyDown={e=>{if(e.key==="Enter")addC();}}
          style={{flex:1,padding:"5px 6px",border:"1px solid #ddd",borderRadius:5,fontSize:10,outline:"none"}}/>
        <button onClick={addC} style={{padding:"5px 9px",border:"none",borderRadius:5,background:"#2b7de9",color:"#fff",fontWeight:700,fontSize:9,cursor:"pointer",opacity:comment.trim()?1:0.3}}>追加</button>
      </div>
    </div>
    {canContinue&&(<div style={{marginBottom:5}}>
      <div style={{fontSize:11,fontWeight:800,color:"#14365a",marginBottom:2}}>次ゲームの投げ順</div>
      <OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd}/>
      <button onClick={()=>onNext(ordVal)} style={{width:"100%",padding:"9px 0",border:"none",borderRadius:8,background:"#14365a",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>次のゲーム開始</button>
    </div>)}
    {isAllDone&&(<div style={{background:"#f0f6ff",borderRadius:8,padding:10,marginBottom:6,border:"1px solid #d0dff0"}}>
      <div style={{fontSize:12,fontWeight:800,color:"#14365a",marginBottom:3}}>🔄 ゲーム継続・延長</div>
      <div style={{fontSize:10,color:"#666",marginBottom:5}}>{isMatchOver?`${bestOf}先取完了。追加ゲームやセット延長が可能です。`:`${numGames}ゲーム終了。追加ゲームが可能です。`}</div>
      <div style={{fontSize:10,fontWeight:700,color:"#14365a",marginBottom:2}}>投げ順</div>
      <OrderPicker teams={teams} teamOrder={teamOrder} value={ordMode} onChangeOrd={handleOrd}/>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>onExtend("game",ordVal)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:7,background:"#2b7de9",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>＋1ゲーム追加</button>
        {isMatchOver&&<button onClick={()=>onExtend("set",ordVal)} style={{flex:1,padding:"8px 0",border:"none",borderRadius:7,background:"#22b566",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>＋1セット延長</button>}
      </div>
    </div>)}
    <button onClick={onBack} style={{width:"100%",padding:"9px 0",border:"2px solid #14365a",borderRadius:8,background:"transparent",color:"#14365a",fontSize:12,fontWeight:700,cursor:"pointer"}}>設定に戻る</button>
  </div></div>);
}

/* ═══ Game Screen ═══ */
function GameScreen({initialTeams,initialOrder,bestOf:iBo,numGames:iNg,dqEnd,goBack}){
  const init={teams:initialTeams.map(t=>({...t,players:t.players.map(n=>({name:n,active:true}))})),history:[],currentOrderIdx:0,currentTurn:1,teamOrder:initialOrder,eliminated:initialTeams.map(()=>false),winner:null,gameNumber:1,dqEndGame:dqEnd,autoEnd:false};
  const[st,dispatch]=useReducer(reducer,init);
  const{teams,history,currentOrderIdx,currentTurn,teamOrder,eliminated,winner,gameNumber}=st;
  const[showPl,setShowPl]=useState(false);const[showRes,setShowRes]=useState(false);
  const[view,setView]=useState("both");const[conf,setConf]=useState(null);
  const[gW,setGW]=useState(()=>initialTeams.map(()=>0));
  const[numGames,setNumGames]=useState(iNg);const[bestOf,setBestOf]=useState(iBo);
  const[saveDialog,setSaveDialog]=useState(false);

  const ti=teamOrder[currentOrderIdx];const score=scoreOf(history,ti);const fails=failsOf(history,ti);
  const ap=teams[ti]?.players.filter(p=>p.active)||[];const td=history.filter(h=>h.teamIndex===ti).length;
  const cp=ap.length>0?ap[td%ap.length]:null;

  useEffect(()=>{if(winner!==null&&!showRes){setGW(p=>{const n=[...p];n[winner]++;return n;});setShowRes(true);}},[winner]);

  const execConf=()=>{if(!conf)return;if(conf.t==="score")dispatch({type:"SCORE",score:conf.s});else if(conf.t==="miss")dispatch({type:"MISS"});else dispatch({type:"FAULT"});setConf(null);};
  const handleNext=order=>{dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);};
  const handleExtend=(type,order)=>{if(type==="game")setNumGames(p=>p+1);else if(type==="set")setBestOf(p=>p+1);dispatch({type:"RESET_GAME",teamOrder:order});setShowRes(false);};
  const extractTeamInfo=()=>teams.map(t=>({name:t.name,players:t.players.map(p=>p.name)}));
  const handleBack=()=>setSaveDialog(true);
  const doBack=save=>{setSaveDialog(false);setShowRes(false);goBack(save?extractTeamInfo():null);};

  return(<div style={SS.gW}>
    <div style={SS.topB}>
      <div style={{display:"flex",gap:3}}>
        <button style={SS.tBtn} onClick={handleBack}>◀</button>
        <button style={SS.tBtn} onClick={()=>setShowPl(true)}>👥</button>
      </div>
      <div style={{textAlign:"center"}}>
        <span style={{fontSize:12,fontWeight:800,color:"#fff"}}>G{gameNumber} R{currentTurn}</span>
        {bestOf>0&&<span style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginLeft:3}}>{bestOf}先取</span>}
        {numGames>1&&<span style={{fontSize:9,color:"rgba(255,255,255,0.4)",marginLeft:3}}>/{numGames}G</span>}
      </div>
      <div style={{display:"flex",background:"rgba(255,255,255,0.12)",borderRadius:5,padding:1,gap:1}}>
        {[["both","両方"],["sheet","表"],["input","入力"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{padding:"3px 7px",border:"none",borderRadius:3,background:view===k?"rgba(255,255,255,0.2)":"transparent",color:view===k?"#fff":"rgba(255,255,255,0.4)",fontSize:9,fontWeight:600,cursor:"pointer"}}>{l}</button>))}
      </div>
    </div>
    <div style={SS.tR}>
      {teamOrder.map((tIdx,oi)=>{const t=teams[tIdx];const sc=scoreOf(history,tIdx);const f=failsOf(history,tIdx);
        const act=tIdx===ti;const el=eliminated[tIdx];
        const tap=t.players.filter(p=>p.active);const ttd=history.filter(h=>h.teamIndex===tIdx).length;
        const tcp=tap.length>0?tap[ttd%tap.length]:null;
        return(<div key={oi} style={{flex:1,minWidth:0,padding:"4px 6px 3px",borderRadius:7,textAlign:"center",border:act?`3px solid ${C[tIdx].ac}`:"3px solid transparent",background:act?C[tIdx].lt:"#f5f6f8",opacity:el?0.25:1}}>
          <div style={{fontSize:9,fontWeight:700,color:C[tIdx].tx,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.name}{el?" ✕":""}{(bestOf>0||numGames>1)?` [${gW[tIdx]}勝]`:""}</div>
          <div style={{fontSize:26,fontWeight:900,color:C[tIdx].ac,lineHeight:1}}>{sc}</div>
          <div style={{display:"flex",gap:2,justifyContent:"center",marginTop:2}}>
            {Array.from({length:MF},(_,j)=><span key={j} style={{width:7,height:7,borderRadius:4,background:j<f?"#e74c3c":"#ddd"}}/>)}</div>
          {act&&tcp&&<div style={{fontSize:8,fontWeight:600,color:"#666",marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>🎯{tcp.name}</div>}
        </div>);
      })}
    </div>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0}}>
      {(view==="both"||view==="sheet")&&<div style={{flex:1,minHeight:0,overflow:"hidden"}}><GameSheet teams={teams} history={history} currentTurn={currentTurn} teamOrder={teamOrder}/></div>}
      {(view==="both"||view==="input")&&<div style={{flexShrink:0}}><ScoreInput dispatch={dispatch} canUndo={history.length>0} teamName={teams[ti].name} teamScore={score} teamColor={C[ti].ac} playerName={cp?.name} fails={fails} onConfirm={(t,s,m)=>setConf({t,s,msg:m})}/></div>}
    </div>
    {showPl&&<PlModal teams={teams} dispatch={dispatch} onClose={()=>setShowPl(false)}/>}
    {conf&&<Confirm msg={conf.msg} onOk={execConf} onCancel={()=>setConf(null)}/>}
    {showRes&&winner!==null&&<GameResult teams={teams} history={history} teamOrder={teamOrder} winner={winner} gameWins={gW} bestOf={bestOf} numGames={numGames} gameNumber={gameNumber} onNext={handleNext} onBack={handleBack} onExtend={handleExtend}/>}
    {saveDialog&&<Confirm msg="チーム・プレイヤー情報を\n設定画面に保存しますか？" sub="保存すると次のゲームで\n同じメンバーをすぐ使えます" okLabel="保存する" cancelLabel="保存しない" onOk={()=>doBack(true)} onCancel={()=>doBack(false)}/>}
  </div>);
}

/* ═══ App ═══ */
export default function App(){
  const[scr,setScr]=useState("setup");const[cfg,setCfg]=useState(null);const[saved,setSaved]=useState(null);
  return(<div style={{width:"100%",height:"100dvh"}}>
    {scr==="setup"?<SetupScreen savedTeams={saved} onStart={(t,o,ng,bo,dq)=>{setCfg({t,o,ng,bo,dq});setScr("game");}}/>:
    <GameScreen initialTeams={cfg.t} initialOrder={cfg.o} bestOf={cfg.bo} numGames={cfg.ng} dqEnd={cfg.dq} goBack={saveData=>{if(saveData)setSaved(saveData);setScr("setup");setCfg(null);}}/>}
  </div>);
}

/* ═══ Styles ═══ */
const SS={
  setupW:{height:"100dvh",display:"flex",flexDirection:"column",overflow:"auto",background:"linear-gradient(170deg,#0f1f30,#14365a)",WebkitOverflowScrolling:"touch"},
  setupB:{flex:1,padding:"0 12px 24px",maxWidth:600,margin:"0 auto",width:"100%"},
  sec:{marginBottom:8},
  sL:{display:"block",fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:2,marginBottom:4},
  ch:{flex:1,padding:"8px 0",border:"2px solid rgba(255,255,255,0.2)",borderRadius:7,background:"transparent",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",textAlign:"center"},
  chA:{background:"#2b7de9",borderColor:"#2b7de9"},
  sel:{width:"100%",padding:"7px 10px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:7,background:"rgba(255,255,255,0.92)",color:"#14365a",fontSize:11,fontWeight:600,cursor:"pointer",outline:"none"},
  card:{background:"rgba(255,255,255,0.96)",borderRadius:9,padding:"9px 10px 7px",marginBottom:7},
  tIn:{flex:1,border:"none",borderBottom:"2px solid #ddd",padding:"3px 2px",fontSize:14,fontWeight:700,outline:"none",background:"transparent"},
  pIn:{flex:1,border:"1px solid #e0e0e0",borderRadius:5,padding:"5px 6px",fontSize:11,outline:"none",background:"#fafafa"},
  pRm:{width:22,height:22,border:"none",borderRadius:4,background:"#fee",color:"#c00",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  pAdd:{width:"100%",padding:4,border:"2px dashed #ddd",borderRadius:5,background:"transparent",color:"#999",fontSize:10,fontWeight:600,cursor:"pointer"},
  favB:{width:22,height:22,border:"1px solid #d0dff0",borderRadius:4,background:"#f0f6ff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#d9a83a"},
  stBtn:{width:"100%",padding:12,border:"none",borderRadius:10,background:"linear-gradient(135deg,#2b7de9,#22b566)",color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",letterSpacing:2,marginTop:4,boxShadow:"0 2px 12px rgba(43,125,233,0.25)"},
  shBtn:{width:"100%",padding:9,border:"2px solid rgba(255,255,255,0.2)",borderRadius:9,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer"},
  gW:{height:"100dvh",display:"flex",flexDirection:"column",background:"#eef1f5",overflow:"hidden"},
  topB:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"3px 6px",background:"#14365a",flexShrink:0},
  tBtn:{padding:"4px 8px",border:"1px solid rgba(255,255,255,0.2)",borderRadius:4,background:"transparent",color:"#fff",fontSize:10,fontWeight:600,cursor:"pointer"},
  tR:{display:"flex",gap:3,padding:"4px 5px",background:"#fff",borderBottom:"1px solid #e0e0e0",flexShrink:0,overflowX:"auto"},
  inW:{background:"#fff",borderTop:"2px solid #dde1e6",padding:"6px 8px 9px"},
  nB:{width:62,height:50,border:"2.5px solid #14365a",borderRadius:10,background:"#fff",color:"#14365a",fontSize:20,fontWeight:900,cursor:"pointer",transition:"all 0.1s",display:"flex",alignItems:"center",justifyContent:"center"},
  nBA:{background:"#14365a",color:"#fff",transform:"scale(1.05)",boxShadow:"0 3px 12px rgba(20,54,90,0.3)"},
  aB:{flex:1,padding:"10px 0",border:"2px solid transparent",borderRadius:8,fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:1,whiteSpace:"nowrap"},
  ov:{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:8},
  mod:{background:"#fff",borderRadius:13,padding:12,width:"100%",maxWidth:500,maxHeight:"85vh",overflow:"auto",WebkitOverflowScrolling:"touch"},
  clsB:{width:28,height:28,border:"none",borderRadius:5,background:"#f0f0f0",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  // table
  th:{padding:"3px 2px",fontWeight:700,fontSize:9,background:"#14365a",color:"#fff",textAlign:"center",whiteSpace:"nowrap"},
  thP:{padding:"2px 1px",fontWeight:600,fontSize:8,background:"#1e4a72",color:"rgba(255,255,255,0.75)",textAlign:"center",verticalAlign:"top"},
  td:{padding:"3px 2px",textAlign:"center",borderBottom:"1px solid #eee",fontSize:11},
};
