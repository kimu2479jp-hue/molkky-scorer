import React, { useState, useEffect, useCallback } from "react";
import { Target, BarChart3, Lock, Bot, RefreshCw, Star, ClipboardList, AlertTriangle, Trash2 } from "lucide-react";

import { PC, MASCOT_R, ANALYSIS_DAILY_MAX, LEVEL_NAMES, CONFIDENCE_LEVELS, PERIOD_OPTIONS, DEFAULT_PERIOD_MS, getWeatherInfo, FIELD_TYPES, ROOF_TYPES, FIELD_TYPE_BADGE_COLORS, VENUE_TYPES, VENUE_TYPE_BADGE_COLORS, WIND_CATEGORY_COLORS, WIND_CATEGORY_LABELS, ABSOLUTE_DIRECTION_LABELS, WIND_SPEED_CAP, getWindDirectionLabel } from "../constants.js";
import { loadStats, loadReplays, loadFavs, loadPlayerLevels, loadWindData, saveWindData } from "../db.js";
import { pullWindData } from "../sync.js";
import { deleteStatsByPeriod, deleteGameByKey, getAvailableGames, getGameDates, filterGamesByDates, filterGamesByPeriod, calcMetrics, fmtMD, fmtHM, estimatePlayerLevel } from "../stats.js";
import { makeAnalysisKey, getAnalysisCached, fetchPlayerAnalysis, getPlayerAnalysisCount, calcNewIndicators, getTopScores } from "../analysis.js";
import { ScoreTable } from "./common.jsx";

/* ═══ Radar Chart SVG ═══ */
const RADAR_LABELS=["ミス率\n(低い程◎)","上がり\n決定率","投擲\n平均点","2ミス後\n平均点","ブレイク\n平均点","勝率"];
const RADAR_MAX=["0%","100%","12pt","12pt","12pt","100%"];
/* Per-vertex nudge for 6-gon */
const LB_ADJ=[{dx:0,dy:-20},{dx:28,dy:-2},{dx:28,dy:10},{dx:0,dy:20},{dx:-28,dy:10},{dx:-28,dy:-2}];
const MX_ADJ=[{dx:0,dy:6},{dx:16,dy:2},{dx:16,dy:-2},{dx:0,dy:-6},{dx:-16,dy:-2},{dx:-16,dy:2}];
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
const cx2=S/2,cy2=S/2,R=S*rRatio;const n=6;
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
function ScoreDistribution({playersData,favs,isAdmin,aiEnabled,getGames}){
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
    {playersData.map(pd=>(<ScoreDistPlayer key={pd.name} pd={pd} SCORE_COLORS={SCORE_COLORS} isFav={(favs||[]).includes(pd.name)} isAdmin={isAdmin} aiEnabled={aiEnabled} triggerAll={analyzeAll} analyzeKey={analyzeKey} playerGames={getGames(pd.name)}/>))}
  </div>);
}

function ScoreDistPlayer({pd,SCORE_COLORS,isFav,isAdmin,aiEnabled,triggerAll,analyzeKey,playerGames}){
const sv=pd.metrics.scoreValues||[];
const gc=pd.metrics.gameCount||0;
const canAnalyze=isFav&&gc>=3;
const newInd=React.useMemo(()=>calcNewIndicators(playerGames||[]),[playerGames]);
const recentScores=React.useMemo(()=>{const games=playerGames||[];return games.slice().sort((a,b)=>new Date(b.d)-new Date(a.d)).slice(0,10).map(g=>({date:g.d?g.d.slice(0,10):null,scores:g.sv||[],won:g.w===1,dq:g.dq===true})).filter(g=>g.scores.length>0);},[playerGames]);
if(pd.metrics&&pd.metrics.scoreValues&&!pd.metrics.topScores){pd.metrics.topScores=getTopScores(pd.metrics.scoreValues);}
const[aiText,setAiText]=useState(()=>{if(!canAnalyze)return null;const key=makeAnalysisKey(pd.name,gc,pd.metrics,newInd,recentScores);return getAnalysisCached(key);});
const[aiLoading,setAiLoading]=useState(false);
const[aiError,setAiError]=useState(null);
const remaining=ANALYSIS_DAILY_MAX-getPlayerAnalysisCount(pd.name);

const latestEnv=React.useMemo(()=>{
const games=playerGames||[];
const latest=games.slice().sort((a,b)=>new Date(b.d)-new Date(a.d))[0];
if(!latest||!latest.env)return null;
const e=latest.env;
return{field:e.fi,roof:e.rf,weather:e.wl,temp:e.tp,windSpeed:e.ws};
},[playerGames]);
const doAnalyze=useCallback(async(force)=>{
if(!canAnalyze)return;
const key=makeAnalysisKey(pd.name,gc,pd.metrics,newInd,recentScores);
if(!force){const cached=getAnalysisCached(key);if(cached){setAiText(cached);setAiError(null);return;}}
setAiLoading(true);setAiError(null);
const r=await fetchPlayerAnalysis(pd.name,pd.metrics,isAdmin,newInd,recentScores,pd.name,latestEnv);
setAiLoading(false);
if(r.text){setAiText(r.text);setAiError(null);}else{setAiError(r.error);}
},[pd.name,gc,isAdmin,canAnalyze,newInd,recentScores,latestEnv]);

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

/* ═══ Team colors for score lines ═══ */
const TEAM_LINE_COLORS=["#f97316","#a78bfa","#22d3ee","#f472b6"];
const TEAM_PLAYER_PALETTE=[
["#f97316","#fb923c","#fdba74","#ea580c"],
["#3b82f6","#60a5fa","#93c5fd","#2563eb"],
["#22c55e","#4ade80","#86efac","#16a34a"],
["#ef4444","#f87171","#fca5a5","#dc2626"],
];

/* ═══ HSL utilities for player color generation ═══ */
function hexToHsl(hex){
const r=parseInt(hex.slice(1,3),16)/255,g=parseInt(hex.slice(3,5),16)/255,b=parseInt(hex.slice(5,7),16)/255;
const max=Math.max(r,g,b),min=Math.min(r,g,b);
let h=0,s=0,l=(max+min)/2;
if(max!==min){const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);
if(max===r)h=((g-b)/d+(g<b?6:0))/6;else if(max===g)h=((b-r)/d+2)/6;else h=((r-g)/d+4)/6;}
return[h*360,s*100,l*100];
}
function hslToHex(h,s,l){
s/=100;l/=100;const a=s*Math.min(l,1-l);
const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,"0");};
return"#"+f(0)+f(8)+f(4);
}
function generatePlayerColors(teamHex,count){
if(count<=1)return[teamHex];
const[h,s,l]=hexToHsl(teamHex);
const offsets=[{dh:0,dl:0},{dh:30,dl:10},{dh:-25,dl:-8},{dh:55,dl:5}];
const colors=[];
for(let i=0;i<count;i++){const o=offsets[i%offsets.length];colors.push(hslToHex((h+o.dh+360)%360,Math.max(40,Math.min(100,s)),Math.max(30,Math.min(75,l+o.dl))));}
return colors;
}

/* Convert Supabase row (snake_case) to IndexedDB format (camelCase) */
function normalizeWindData(raw){
if(!raw)return null;
/* Already in camelCase (from IndexedDB) */
if(raw.windSensor||raw.turnWindData)return raw;
/* Supabase row format */
if(raw.wind_sensor||raw.turn_wind_data){
return{windSensor:raw.wind_sensor||null,turnWindData:raw.turn_wind_data||null,windSummary:raw.wind_summary||null};
}
return null;
}

/* Load wind data with Supabase fallback */
async function loadWindDataWithFallback(gameKey){
let d=await loadWindData(gameKey);
if(d)return d;
try{
const pulled=await pullWindData(gameKey);
const normalized=normalizeWindData(pulled);
if(normalized&&normalized.turnWindData&&normalized.turnWindData.length>0){
await saveWindData(gameKey,normalized);
return normalized;
}
}catch(e){console.warn("wind pull error",e);}
return null;
}

/* ═══ Wind Chart Component ═══ */
function WindChart({windData,history,teams}){
const isTab=typeof window!=="undefined"&&window.innerWidth>=768;
const turnWind=windData.turnWindData||[];
const summary=windData.windSummary||{};
const totalTurns=history.length;
if(totalTurns===0)return null;

const[selectedIdx,setSelectedIdx]=useState(null);

/* Layout constants */
const marginL=44,marginR=16,marginT=8,marginB=28;
const gapBetween=12;
const upperH=140,lowerH=100;
const totalH=marginT+upperH+gapBetween+lowerH+marginB;

/* Horizontal scroll: >=40 turns */
const useScroll=totalTurns>=40;
const minPxPerTurn=useScroll?10:0;
const chartInnerW=useScroll?totalTurns*minPxPerTurn:Math.max(280,totalTurns*8);
const svgW=marginL+chartInnerW+marginR;

/* Y axis: upper (wind speed) */
const maxWind=turnWind.reduce((mx,w)=>w?Math.max(mx,w.windSpeed||0):mx,0);
const yWindMax=Math.min(Math.ceil(maxWind+0.5),WIND_SPEED_CAP);
const yWindTicks=[];
const yWindStep=yWindMax<=4?1:yWindMax<=10?2:yWindMax<=20?4:5;
for(let v=0;v<=yWindMax;v+=yWindStep)yWindTicks.push(v);

/* Y axis: lower (score 0-50) */
const yScoreMax=50;

/* Mapping helpers */
const xForTurn=i=>marginL+(i+0.5)*(chartInnerW/totalTurns);
const yWindForVal=v=>{const capped=Math.min(v,WIND_SPEED_CAP);return marginT+upperH-(capped/yWindMax)*upperH;};
const yScoreForVal=v=>marginT+upperH+gapBetween+lowerH-(v/yScoreMax)*lowerH;

/* Cumulative scores per team at each turn */
const teamCount=teams.length;
const cumScores=[];
const runningScores=new Array(teamCount).fill(0);
for(let i=0;i<totalTurns;i++){
const t=history[i];
if(t.type==="score"||t.score>0){
runningScores[t.teamIndex]+=t.score;
if(runningScores[t.teamIndex]>50)runningScores[t.teamIndex]=25;
}
cumScores.push([...runningScores]);
}

/* X axis label thinning */
const xLabelStep=totalTurns<=20?1:totalTurns<=40?5:10;

/* Arrow path for wind direction inside dot */
const arrowPath="M0,-4 L2,2 L0,1 L-2,2 Z";

const handleTap=(idx)=>{setSelectedIdx(prev=>prev===idx?null:idx);};
const handleBgTap=()=>{setSelectedIdx(null);};

/* Popup content */
const popup=selectedIdx!==null?(() => {
const turn=history[selectedIdx];
const wind=turnWind[selectedIdx];
const ti=turn.teamIndex;
const teamName=teams[ti]?.name||("Team "+(ti+1));
const playerName=teams[ti]?.players?.[turn.playerIndex]?.name||teams[ti]?.players?.[turn.playerIndex]||"";
const scores=cumScores[selectedIdx];
const isMiss=turn.type==="miss"||turn.type==="fault"||turn.score===0;
return{turn,wind,ti,teamName,playerName,scores,isMiss,x:xForTurn(selectedIdx)};
})():null;

return(<div style={{marginBottom:14}}>
{/* Summary bar */}
<div style={{display:"flex",gap:8,marginBottom:10}}>
{[
{label:"平均風速",value:(summary.avgWindSpeed||0).toFixed(1)+" m/s",color:"#3b82f6"},
{label:"最大風速",value:(summary.maxWindSpeed||0).toFixed(1)+" m/s",color:"#f97316"},
{label:"投擲数",value:String(summary.sampleCount||turnWind.length),color:"#6b7280"},
].map(item=>(<div key={item.label} style={{flex:1,textAlign:"center",background:"var(--bg-surface)",borderRadius:10,padding:"8px 4px",border:"1px solid var(--border-input)"}}>
<div style={{fontSize:11,fontWeight:600,color:"#9ca3af"}}>{item.label}</div>
<div style={{fontSize:isTab?20:17,fontWeight:800,color:item.color,marginTop:2}}>{item.value}</div>
</div>))}
</div>

{/* Chart */}
<div style={{overflowX:useScroll?"auto":"hidden",WebkitOverflowScrolling:"touch",borderRadius:12,border:"1px solid var(--border-input)",background:"var(--bg-surface)"}}>
<svg width={useScroll?svgW:"100%"} height={totalH} viewBox={useScroll?undefined:`0 0 ${svgW} ${totalH}`} style={{display:"block"}} onClick={handleBgTap}>

{/* Upper: wind speed dots */}
{/* Grid lines */}
{yWindTicks.map(v=>(<line key={"wg"+v} x1={marginL} x2={marginL+chartInnerW} y1={yWindForVal(v)} y2={yWindForVal(v)} stroke="#e5e7eb" strokeWidth={0.5}/>))}
{/* Y axis labels */}
{yWindTicks.map(v=>(<text key={"wl"+v} x={marginL-6} y={yWindForVal(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#9ca3af">{v}</text>))}
{/* Y axis title */}
<text x={8} y={marginT+upperH/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#9ca3af" transform={`rotate(-90,8,${marginT+upperH/2})`}>m/s</text>

{/* Average wind line */}
{summary.avgWindSpeed>0&&<line x1={marginL} x2={marginL+chartInnerW} y1={yWindForVal(summary.avgWindSpeed)} y2={yWindForVal(summary.avgWindSpeed)} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3"/>}

{/* Wind dots */}
{history.map((turn,i)=>{
const wind=turnWind[i];
if(!wind||wind.windSpeed==null)return null;
const cx=xForTurn(i);
const cy=yWindForVal(wind.windSpeed);
const r=4+(wind.windSpeed/yWindMax)*7;
const color=wind.compassValid===false?"#9ca3af":(WIND_CATEGORY_COLORS[wind.windCategory]||"#9ca3af");
const isSelected=selectedIdx===i;
return(<g key={"wd"+i} onClick={e=>{e.stopPropagation();handleTap(i);}} style={{cursor:"pointer"}}>
<circle cx={cx} cy={cy} r={r} fill={color} opacity={isSelected?1:0.8} stroke={isSelected?"#fff":"none"} strokeWidth={isSelected?2:0}/>
{wind.compassValid!==false&&wind.relativeDirection!=null&&r>=5&&(
<g transform={`translate(${cx},${cy}) rotate(${wind.relativeDirection})`}>
<path d={arrowPath} fill="rgba(255,255,255,0.85)" stroke="none"/>
</g>
)}
</g>);
})}

{/* Lower: cumulative score lines */}
{/* Grid lines */}
{[0,10,20,30,40,50].map(v=>(<line key={"sg"+v} x1={marginL} x2={marginL+chartInnerW} y1={yScoreForVal(v)} y2={yScoreForVal(v)} stroke="#e5e7eb" strokeWidth={v===50?0:0.5}/>))}
{/* 50 goal line */}
<line x1={marginL} x2={marginL+chartInnerW} y1={yScoreForVal(50)} y2={yScoreForVal(50)} stroke="#eab308" strokeWidth={1.5} strokeDasharray="6,3"/>
{/* Y axis labels */}
{[0,10,20,30,40,50].map(v=>(<text key={"sl"+v} x={marginL-6} y={yScoreForVal(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#9ca3af">{v}</text>))}
<text x={8} y={marginT+upperH+gapBetween+lowerH/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#9ca3af" transform={`rotate(-90,8,${marginT+upperH+gapBetween+lowerH/2})`}>点</text>

{/* Score lines per team */}
{Array.from({length:teamCount}).map((_,ti)=>{
const points=[];
let lastY=null;
for(let i=0;i<totalTurns;i++){
const x=xForTurn(i);
const y=yScoreForVal(cumScores[i][ti]);
if(history[i].teamIndex===ti){
if(lastY!==null&&points.length>0){
/* extend horizontal from prev point to this x */
points.push(`${x},${lastY}`);
}
points.push(`${x},${y}`);
lastY=y;
}else{
/* not this team's turn, extend horizontal */
if(lastY!==null)points.push(`${x},${lastY}`);
}
}
if(points.length<2)return null;
return(<polyline key={"tl"+ti} points={points.join(" ")} fill="none" stroke={TEAM_LINE_COLORS[ti%4]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>);
})}

{/* Score dots at team's own turns */}
{history.map((turn,i)=>{
const x=xForTurn(i);
const y=yScoreForVal(cumScores[i][turn.teamIndex]);
const isSelected=selectedIdx===i;
return(<circle key={"sd"+i} cx={x} cy={y} r={isSelected?4:2.5} fill={TEAM_LINE_COLORS[turn.teamIndex%4]} stroke={isSelected?"#fff":"none"} strokeWidth={isSelected?1.5:0} onClick={e=>{e.stopPropagation();handleTap(i);}} style={{cursor:"pointer"}}/>);
})}

{/* Connector line for selected */}
{selectedIdx!==null&&turnWind[selectedIdx]&&turnWind[selectedIdx].windSpeed!=null&&(()=>{
const x=xForTurn(selectedIdx);
const yTop=yWindForVal(turnWind[selectedIdx].windSpeed);
const yBot=yScoreForVal(cumScores[selectedIdx][history[selectedIdx].teamIndex]);
return(<line x1={x} x2={x} y1={yTop} y2={yBot} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,2"/>);
})()}

{/* X axis labels */}
{history.map((_,i)=>{
if((i+1)%xLabelStep!==0&&i!==0)return null;
return(<text key={"xl"+i} x={xForTurn(i)} y={totalH-4} textAnchor="middle" fontSize={9} fill="#9ca3af">{i+1}</text>);
})}

{/* Separator between upper and lower */}
<line x1={marginL} x2={marginL+chartInnerW} y1={marginT+upperH+gapBetween/2} y2={marginT+upperH+gapBetween/2} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="2,2"/>

</svg>
</div>

{/* Team legend */}
<div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:6}}>
{teams.map((team,ti)=>(<div key={ti} style={{display:"flex",alignItems:"center",gap:4}}>
<div style={{width:10,height:10,borderRadius:5,background:TEAM_LINE_COLORS[ti%4]}}/>
<span style={{fontSize:11,fontWeight:700,color:"#555"}}>{team.name||("Team "+(ti+1))}</span>
</div>))}
</div>

{/* Popup */}
{popup&&(<div style={{position:"relative",marginTop:8}}>
<div style={{background:"#1a1a2e",borderRadius:12,padding:12,color:"#fff",fontSize:13,maxWidth:320,margin:"0 auto"}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
<span style={{background:TEAM_LINE_COLORS[popup.ti%4],color:"#fff",padding:"2px 8px",borderRadius:6,fontSize:12,fontWeight:700}}>{popup.teamName}</span>
<span style={{fontWeight:700,fontSize:14}}>{typeof popup.playerName==="string"?popup.playerName:(popup.playerName?.name||"")}</span>
</div>
{popup.wind&&popup.wind.windSpeed!=null&&(<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
<span style={{fontWeight:700}}>{popup.wind.windSpeed.toFixed(1)} m/s</span>
{popup.wind.compassValid!==false?
<span style={{background:WIND_CATEGORY_COLORS[popup.wind.windCategory]||"#9ca3af",color:"#fff",padding:"1px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>{WIND_CATEGORY_LABELS[popup.wind.windCategory]||"不明"}</span>
:<span style={{background:"#9ca3af",color:"#fff",padding:"1px 8px",borderRadius:5,fontSize:11,fontWeight:700}}>風向き: データなし</span>}
</div>)}
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
<span style={{fontSize:12,color:"#ccc"}}>得点:</span>
{popup.isMiss?<span style={{background:"#ef4444",color:"#fff",padding:"1px 8px",borderRadius:5,fontSize:12,fontWeight:700}}>F</span>
:<span style={{background:"#eab308",color:"#000",padding:"1px 8px",borderRadius:5,fontSize:12,fontWeight:700}}>{popup.turn.score}</span>}
</div>
<div style={{fontSize:11,color:"#aaa",marginTop:4}}>
{teams.map((team,ti)=>(<span key={ti} style={{marginRight:8}}><span style={{color:TEAM_LINE_COLORS[ti%4],fontWeight:700}}>{team.name||("T"+(ti+1))}</span>: {popup.scores[ti]}点</span>))}
</div>
</div>
</div>)}
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

/* ═══ Wind Data Modal (full-screen, same layout as GameScoreModal) ═══ */
function WindDataModal({gameKey,onClose}){
const isTab=typeof window!=="undefined"&&window.innerWidth>=768;
const[windData,setWindData]=useState(null);
const[replay,setReplay]=useState(null);
const[loaded,setLoaded]=useState(false);
useEffect(()=>{
setLoaded(false);setWindData(null);setReplay(null);
if(!gameKey)return;
const replays=loadReplays();
const r=replays[gameKey]||null;
setReplay(r);
loadWindData(gameKey).then(d=>{setWindData(d);setLoaded(true);});
},[gameKey]);
if(!gameKey||!loaded)return null;
if(!windData||!windData.windSensor||!windData.windSensor.enabled)return null;
if(!windData.turnWindData||windData.turnWindData.length===0)return null;
if(!replay||!replay.history||replay.history.length===0)return null;
const dt=new Date(gameKey);
const dateStr=(dt.getMonth()+1)+"/"+dt.getDate()+" "+fmtHM(dt);
const summary=windData.windSummary||{};
/* Calculate available chart height: viewport - header - summary - padding - legend */
const vh=typeof window!=="undefined"?window.innerHeight:800;
const headerH=isTab?52:48;
const summaryH=isTab?72:64;
const legendH=80;
const padV=12;
const chartH=Math.max(300,vh-headerH-summaryH-legendH-padV);
return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={onClose}>
{/* Header */}
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"calc(8px + env(safe-area-inset-top, 0px)) 12px 6px",background:"var(--bg-secondary)",flexShrink:0}} onClick={e=>e.stopPropagation()}>
<div style={{display:"flex",alignItems:"center",gap:8}}>
<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
<span style={{fontSize:isTab?22:18,fontWeight:800,color:"var(--text-inverse)"}}>風速データ</span>
</div>
<div style={{fontSize:14,color:"rgba(255,255,255,0.7)"}}>{dateStr}</div>
<button onClick={onClose} style={{padding:"6px 14px",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,background:"transparent",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>✕ 閉じる</button>
</div>
{/* Content */}
<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"var(--bg-surface)",padding:"4px 0 0"}} onClick={e=>e.stopPropagation()}>
{/* Summary row */}
<div style={{display:"flex",gap:6,marginBottom:4,padding:"0 2px",flexShrink:0}}>
{[
{label:"平均風速",value:(summary.avgWindSpeed||0).toFixed(1)+" m/s",color:"#3b82f6"},
{label:"最大風速",value:(summary.maxWindSpeed||0).toFixed(1)+" m/s",color:"#f97316"},
{label:"投擲数",value:String(summary.sampleCount||windData.turnWindData.length),color:"#6b7280"},
].map(item=>(<div key={item.label} style={{flex:1,textAlign:"center",background:"var(--bg-surface)",borderRadius:8,padding:"6px 4px",border:"1px solid var(--border-input)"}}>
<div style={{fontSize:isTab?13:11,fontWeight:600,color:"#9ca3af"}}>{item.label}</div>
<div style={{fontSize:isTab?24:20,fontWeight:800,color:item.color,marginTop:2}}>{item.value}</div>
</div>))}
</div>
{/* Large Wind Chart */}
<WindChartLarge windData={windData} history={replay.history} teams={replay.teams} isTab={isTab} chartH={chartH}/>
</div>
</div>);
}

/* ═══ Wind Chart Large (for modal - expanded sizes) ═══ */
function WindChartLarge({windData,history,teams,isTab,chartH}){
const turnWind=windData.turnWindData||[];
const summary=windData.windSummary||{};
const totalTurns=history.length;
if(totalTurns===0)return null;

const[selectedIdx,setSelectedIdx]=useState(null);

/* Layout constants - dynamic height from viewport */
const marginL=20,marginR=1,marginT=6,marginB=20;
const gapBetween=10;
const svgAvail=(chartH||500)-marginT-marginB-gapBetween;
const upperH=Math.max(150,Math.floor(svgAvail*0.75));
const lowerH=Math.max(80,Math.floor(svgAvail*0.25));
const totalH=marginT+upperH+gapBetween+lowerH+marginB;

/* Horizontal scroll: >=40 turns */
const useScroll=totalTurns>=40;
const minPxPerTurn=useScroll?(isTab?16:12):0;
const chartInnerW=useScroll?totalTurns*minPxPerTurn:Math.max(280,totalTurns*(isTab?20:16));
const svgW=marginL+chartInnerW+marginR;

/* Y axis: upper (wind speed) */
const maxWind=turnWind.reduce((mx,w)=>w?Math.max(mx,w.windSpeed||0):mx,0);
const yWindMax=Math.min(Math.ceil(maxWind+0.5),WIND_SPEED_CAP);
const yWindTicks=[];
const yWindStep=yWindMax<=4?1:yWindMax<=10?2:yWindMax<=20?4:5;
for(let v=0;v<=yWindMax;v+=yWindStep)yWindTicks.push(v);

/* Y axis: lower (score 0-50) */
const yScoreMax=50;

/* Mapping helpers */
const xForTurn=i=>marginL+(i+0.5)*(chartInnerW/totalTurns);
const yWindForVal=v=>{const capped=Math.min(v,WIND_SPEED_CAP);return marginT+upperH-(capped/yWindMax)*upperH;};
const yScoreForVal=v=>marginT+upperH+gapBetween+lowerH-(v/yScoreMax)*lowerH;

/* Cumulative scores per team at each turn */
const teamCount=teams.length;
const cumScores=[];
const runningScores=new Array(teamCount).fill(0);
for(let i=0;i<totalTurns;i++){
const t=history[i];
if(t.type==="score"||t.score>0){
runningScores[t.teamIndex]+=t.score;
if(runningScores[t.teamIndex]>50)runningScores[t.teamIndex]=25;
}
cumScores.push([...runningScores]);
}

/* X axis label thinning */
const xLabelStep=totalTurns<=20?1:totalTurns<=40?5:10;

/* Arrow path for wind direction inside dot */
const arrowPath="M0,-4 L2,2 L0,1 L-2,2 Z";

const handleTap=(idx)=>{setSelectedIdx(prev=>prev===idx?null:idx);};
const handleBgTap=()=>{setSelectedIdx(null);};

/* Popup content */
const popup=selectedIdx!==null?(() => {
const turn=history[selectedIdx];
const wind=turnWind[selectedIdx];
const ti=turn.teamIndex;
const teamName=teams[ti]?.name||("Team "+(ti+1));
const playerName=teams[ti]?.players?.[turn.playerIndex]?.name||teams[ti]?.players?.[turn.playerIndex]||"";
const scores=cumScores[selectedIdx];
const isMiss=turn.type==="miss"||turn.type==="fault"||turn.score===0;
return{turn,wind,ti,teamName,playerName,scores,isMiss,x:xForTurn(selectedIdx)};
})():null;

/* Player colors per team */
const playerColorsMap=teams.map((team,ti)=>{const palette=TEAM_PLAYER_PALETTE[ti%4];return(team.players||[]).map((_,pi)=>palette[pi%4]);});

return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
{/* Chart */}
<div style={{flex:1,overflowX:useScroll?"auto":"hidden",overflowY:"hidden",WebkitOverflowScrolling:"touch",background:"var(--bg-surface)"}}>
<svg width={useScroll?svgW:"100%"} height={totalH} viewBox={useScroll?undefined:`0 0 ${svgW} ${totalH}`} style={{display:"block"}} onClick={handleBgTap}>

{/* Upper: wind speed dots */}
{yWindTicks.map(v=>(<line key={"wg"+v} x1={marginL} x2={marginL+chartInnerW} y1={yWindForVal(v)} y2={yWindForVal(v)} stroke="#e5e7eb" strokeWidth={0.5}/>))}
{yWindTicks.map(v=>(<text key={"wl"+v} x={marginL-6} y={yWindForVal(v)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#9ca3af">{v}</text>))}
<text x={8} y={marginT+upperH/2} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill="#9ca3af" transform={`rotate(-90,8,${marginT+upperH/2})`}>m/s</text>

{/* Average wind line */}
{summary.avgWindSpeed>0&&<line x1={marginL} x2={marginL+chartInnerW} y1={yWindForVal(summary.avgWindSpeed)} y2={yWindForVal(summary.avgWindSpeed)} stroke="#9ca3af" strokeWidth={1} strokeDasharray="4,3"/>}

{/* Wind dots */}
{history.map((turn,i)=>{
const wind=turnWind[i];
if(!wind||wind.windSpeed==null)return null;
const cx=xForTurn(i);
const cy=yWindForVal(wind.windSpeed);
const r=16+(wind.windSpeed/yWindMax)*19;
const arrowScale=(r/5).toFixed(2);
const color=playerColorsMap[turn.teamIndex]?.[turn.playerIndex]||TEAM_PLAYER_PALETTE[turn.teamIndex%4][0];
const isSelected=selectedIdx===i;
return(<g key={"wd"+i} onClick={e=>{e.stopPropagation();handleTap(i);}} style={{cursor:"pointer"}}>
<circle cx={cx} cy={cy} r={r} fill={color} opacity={isSelected?1:0.8} stroke={isSelected?"#fff":"none"} strokeWidth={isSelected?2:0}/>
{wind.compassValid!==false&&wind.relativeDirection!=null&&(
<g transform={`translate(${cx},${cy}) rotate(${wind.relativeDirection}) scale(${arrowScale})`}>
<path d={arrowPath} fill="rgba(255,255,255,0.85)" stroke="none"/>
</g>
)}
</g>);
})}

{/* Lower: cumulative score lines */}
{[0,25,50].map(v=>(<line key={"sg"+v} x1={marginL} x2={marginL+chartInnerW} y1={yScoreForVal(v)} y2={yScoreForVal(v)} stroke="#e5e7eb" strokeWidth={0.5}/>))}
<line x1={marginL} x2={marginL+chartInnerW} y1={yScoreForVal(50)} y2={yScoreForVal(50)} stroke="#eab308" strokeWidth={1.5} strokeDasharray="6,3"/>
{[0,50].map(v=>(<text key={"sl"+v} x={marginL-6} y={yScoreForVal(v)} textAnchor="end" dominantBaseline="middle" fontSize={9} fill="#9ca3af">{v}</text>))}
<text x={8} y={marginT+upperH+gapBetween+lowerH/2} textAnchor="middle" dominantBaseline="middle" fontSize={9} fill="#9ca3af" transform={`rotate(-90,8,${marginT+upperH+gapBetween+lowerH/2})`}>点</text>

{/* Score lines per team */}
{Array.from({length:teamCount}).map((_,ti)=>{
const points=[];
let lastY=null;
for(let i=0;i<totalTurns;i++){
const x=xForTurn(i);
const y=yScoreForVal(cumScores[i][ti]);
if(history[i].teamIndex===ti){
if(lastY!==null&&points.length>0){points.push(`${x},${lastY}`);}
points.push(`${x},${y}`);
lastY=y;
}else{
if(lastY!==null)points.push(`${x},${lastY}`);
}
}
if(points.length<2)return null;
return(<polyline key={"tl"+ti} points={points.join(" ")} fill="none" stroke={TEAM_PLAYER_PALETTE[ti%4][0]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" opacity={0.85}/>);
})}

{/* Score dots at team's own turns */}
{history.map((turn,i)=>{
const x=xForTurn(i);
const y=yScoreForVal(cumScores[i][turn.teamIndex]);
const isSelected=selectedIdx===i;
const dotColor=playerColorsMap[turn.teamIndex]?.[turn.playerIndex]||TEAM_PLAYER_PALETTE[turn.teamIndex%4][0];
return(<circle key={"sd"+i} cx={x} cy={y} r={isSelected?8:6} fill={dotColor} stroke={isSelected?"#fff":"none"} strokeWidth={isSelected?2:0} onClick={e=>{e.stopPropagation();handleTap(i);}} style={{cursor:"pointer"}}/>);
})}

{/* Connector line for selected */}
{selectedIdx!==null&&turnWind[selectedIdx]&&turnWind[selectedIdx].windSpeed!=null&&(()=>{
const x=xForTurn(selectedIdx);
const yTop=yWindForVal(turnWind[selectedIdx].windSpeed);
const yBot=yScoreForVal(cumScores[selectedIdx][history[selectedIdx].teamIndex]);
return(<line x1={x} x2={x} y1={yTop} y2={yBot} stroke="#9ca3af" strokeWidth={1} strokeDasharray="3,2"/>);
})()}

{/* X axis labels */}
{history.map((_,i)=>{
if((i+1)%xLabelStep!==0&&i!==0)return null;
return(<text key={"xl"+i} x={xForTurn(i)} y={totalH-4} textAnchor="middle" fontSize={9} fill="#9ca3af">{i+1}</text>);
})}

{/* Separator between upper and lower */}
<line x1={marginL} x2={marginL+chartInnerW} y1={marginT+upperH+gapBetween/2} y2={marginT+upperH+gapBetween/2} stroke="#d1d5db" strokeWidth={0.5} strokeDasharray="2,2"/>

</svg>
</div>

{/* Team legend with player colors */}
<div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",padding:"6px 4px",flexShrink:0}}>
{teams.map((team,ti)=>{
const pColors=playerColorsMap[ti]||[];
const players=team.players||[];
return(<div key={ti} style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
<span style={{fontSize:22,fontWeight:700,color:"#555"}}>{team.name||("Team "+(ti+1))}</span>
{players.map((p,pi)=>{
const pName=typeof p==="string"?p:(p&&p.name?p.name:"");
return(<span key={pi} style={{display:"inline-flex",alignItems:"center",gap:4,marginLeft:4}}>
<span style={{width:16,height:16,borderRadius:8,background:pColors[pi]||TEAM_PLAYER_PALETTE[ti%4][0],display:"inline-block"}}/>
<span style={{fontSize:20,fontWeight:600,color:"#666"}}>{pName}</span>
</span>);
})}
</div>);
})}
</div>

{/* Popup overlay */}
{popup&&(<div style={{position:"absolute",bottom:30,left:0,right:0,zIndex:10,display:"flex",justifyContent:"center",pointerEvents:"none"}}>
<div style={{background:"rgba(26,26,46,0.95)",borderRadius:10,padding:"10px 14px",color:"#fff",fontSize:13,maxWidth:340,pointerEvents:"auto",boxShadow:"0 4px 16px rgba(0,0,0,0.3)"}}>
<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
<span style={{background:TEAM_PLAYER_PALETTE[popup.ti%4][0],color:"#fff",padding:"2px 8px",borderRadius:5,fontSize:12,fontWeight:700}}>{popup.teamName}</span>
<span style={{fontWeight:700,fontSize:14}}>{typeof popup.playerName==="string"?popup.playerName:(popup.playerName?.name||"")}</span>
</div>
<div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
{popup.wind&&popup.wind.windSpeed!=null&&(<>
<span style={{fontWeight:700}}>{popup.wind.windSpeed.toFixed(1)} m/s</span>
{popup.wind.compassValid!==false?
<span style={{background:"#6b7280",color:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11,fontWeight:700}}>{WIND_CATEGORY_LABELS[popup.wind.windCategory]||"不明"}</span>
:<span style={{background:"#9ca3af",color:"#fff",padding:"1px 6px",borderRadius:4,fontSize:11,fontWeight:700}}>風向き: データなし</span>}
</>)}
{popup.isMiss?<span style={{background:"#ef4444",color:"#fff",padding:"1px 6px",borderRadius:4,fontSize:12,fontWeight:700}}>F</span>
:<span style={{background:"#eab308",color:"#000",padding:"1px 6px",borderRadius:4,fontSize:12,fontWeight:700}}>{popup.turn.score}点</span>}
</div>
<div style={{fontSize:11,color:"#aaa",marginTop:3}}>
{teams.map((team,ti)=>(<span key={ti} style={{marginRight:6}}><span style={{color:TEAM_PLAYER_PALETTE[ti%4][0],fontWeight:700}}>{team.name||("T"+(ti+1))}</span>:{popup.scores[ti]}</span>))}
</div>
</div>
</div>)}
</div>);
}

/* ═══ Game List Item ═══ */
function getFieldLabel(env){
if(!env||!env.fi)return null;
const ft=FIELD_TYPES.find(f=>f.value===env.fi);
return ft?ft.label:env.fi;
}
function getWindDisplay(gameEnv,windData){
if(windData&&windData.windSensor&&windData.windSensor.enabled&&windData.windSummary){
const s=windData.windSummary;
if(s.compassValidCount>0&&s.dominantAbsoluteDirection){
const dirLabel=ABSOLUTE_DIRECTION_LABELS[s.dominantAbsoluteDirection]||"";
return dirLabel+" "+(s.avgWindSpeed||0).toFixed(1)+"m/s";
}
return (s.avgWindSpeed||0).toFixed(1)+"m/s";
}
if(gameEnv&&gameEnv.ws!=null){const dirLabel=(gameEnv.wd!=null)?getWindDirectionLabel(gameEnv.wd):"";return dirLabel?(dirLabel+" "+gameEnv.ws+"m/s"):(gameEnv.ws+"m/s");}
return null;
}
function GameListItem({game,checked,onToggle,isTab,onShowScore,onShowWind,onDelete,isAdmin,windData}){
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
{game.env&&game.env.ln&&<span style={{fontSize:isTab?14:12,fontWeight:800,color:"var(--text-primary)"}}>{"📍"}{game.env.ln}</span>}
{game.env&&(<span style={{fontSize:isTab?13:11,display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
{game.env.wc!=null&&<span>{getWeatherInfo(game.env.wc).icon}</span>}
{(game.env.tp!=null||game.env.ws!=null||windData)&&(()=>{const wd=getWindDisplay(game.env,windData);return <span style={{fontWeight:800,color:"var(--text-primary)",fontSize:isTab?14:12}}>{game.env.tp!=null?(game.env.tp+"℃"):""}{game.env.tp!=null&&wd?" ":""}{wd||""}</span>;})()}
{(()=>{const fl=getFieldLabel(game.env);return fl?<span style={{padding:"1px 7px",borderRadius:5,fontSize:isTab?12:10,fontWeight:700,color:"#fff",background:FIELD_TYPE_BADGE_COLORS[game.env.fi]||"#6b7280"}}>{fl}</span>:null;})()}
{game.env.vt&&game.env.vt!=="outdoor"&&<span style={{padding:"1px 7px",borderRadius:5,fontSize:isTab?12:10,fontWeight:700,color:"#fff",background:VENUE_TYPE_BADGE_COLORS[game.env.vt]||"#9b59b6"}}>{(VENUE_TYPES.find(v=>v.value===game.env.vt)||{}).label||game.env.vt}</span>}
</span>)}
{!game.env&&<span style={{fontSize:isTab?13:11,color:"var(--text-secondary)"}}>不明</span>}
</div>
<div style={{fontSize:isTab?15:13,color:"#555",marginTop:3}}>
{game.players.length}人戦　参加者: {game.players.join(", ")}
</div>
{game.winnerName&&<div style={{fontSize:isTab?14:12,color:"var(--text-success)",fontWeight:700,marginTop:2}}>{winLabel}: {game.winnerName}</div>}
{hasTeam&&<div style={{fontSize:isTab?13:11,color:"var(--accent-blue)",fontWeight:600,marginTop:1}}>勝利チームのメンバー: {game.winnerMembers.join(", ")}</div>}
</div>
{hasReplay&&<button onClick={e=>{e.stopPropagation();onShowScore&&onShowScore(game.d);}} style={{padding:"6px 10px",border:"1px solid #2b7de9",borderRadius:8,background:"#f0f6ff",color:"var(--accent-blue)",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><ClipboardList size={14}/></button>}
{windData&&windData.turnWindData&&windData.turnWindData.length>0&&<button onClick={e=>{e.stopPropagation();onShowWind&&onShowWind(game.d);}} style={{padding:"6px 10px",border:"1px solid #0d9488",borderRadius:8,background:"#f0fdfa",color:"#0d9488",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>風</button>}
{isAdmin&&onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(game.d,game);}} style={{padding:"6px 10px",border:"1px solid #e74c3c",borderRadius:8,background:"#fef2f2",color:"#e74c3c",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><Trash2 size={14}/></button>}
  </div>);
}

/* ═══ Wind Chart Loader ═══ */
function WindChartLoader({gameKey}){
const[windData,setWindData]=useState(null);
const[replay,setReplay]=useState(null);
const[loaded,setLoaded]=useState(false);
useEffect(()=>{
setLoaded(false);setWindData(null);setReplay(null);
if(!gameKey)return;
const replays=loadReplays();
const r=replays[gameKey]||null;
setReplay(r);
loadWindDataWithFallback(gameKey).then(d=>{setWindData(d);setLoaded(true);});
},[gameKey]);
if(!loaded)return null;
/* Only show if wind data exists with enabled sensor and turnWindData */
if(!windData||!windData.windSensor||!windData.windSensor.enabled)return null;
if(!windData.turnWindData||windData.turnWindData.length===0)return null;
if(!replay||!replay.history||replay.history.length===0)return null;
return(<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>
風速データ
</div>
<WindChart windData={windData} history={replay.history} teams={replay.teams}/>
</div>);
}

/* ═══ Stats Modal — with Calendar/Recent tabs + Score Distribution ═══ */
export function StatsModal({onClose,currentGameRecords,initialDelete,source,isAdmin,aiEnabled}){
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
/* Wind data cache for game cards */
const[windDataCache,setWindDataCache]=useState({});
/* Wind chart: selected game for detail view */
const[windChartGame,setWindChartGame]=useState(null);
const[windChartData,setWindChartData]=useState(null);
/* A: Game delete confirmation */
const[deleteConf,setDeleteConf]=useState(null);
/* E: Calendar pagination */
const[calPage,setCalPage]=useState(0);
/* Period filter state (cumulative "all" tab) */
const[selectedPeriod,setSelectedPeriod]=useState(DEFAULT_PERIOD_MS);

const currentNames=(currentGameRecords||[]).map(r=>r.nm);
const allNames=favs.filter(n=>(stats[n]&&stats[n].length>0)||currentNames.includes(n));
/* Fix 6: game source shows only participating fav members */
const gameParticipants=source==="game"?allNames.filter(n=>currentNames.includes(n)):allNames;
const names=viewMode==="current"?gameParticipants:allNames;
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
if(tab==="all")return filterGamesByPeriod(stats[nm]||[],selectedPeriod);
const playerGames=stats[nm]||[];
return playerGames.filter(g=>selectedGameKeys.has(g.d));
};
const manualLevels=loadPlayerLevels();
const playersData=effectiveSelected.map((nm,i)=>{const g=getPlayerGames(nm);const m=calcMetrics(g);
/* Level estimation */
let levelInfo=null;
const ml=manualLevels[nm]||null;
if(ml!==null){levelInfo={level:ml,rawLevel:ml,confidence:"",gameCount:m?m.gameCount:0,source:"manual"};}
else if(viewMode!=="current"){const est=estimatePlayerLevel(nm,stats[nm]||[],stats,tab==="all"?selectedPeriod:null);levelInfo={...est,source:"auto"};}
return{name:nm,color:PC[i%PC.length],metrics:m,r:m?m.r:[0,0,0,0,0,0],levelInfo};}).filter(p=>p.metrics);

const doDelete=(p)=>{deleteStatsByPeriod(p);setStats(loadStats());setDelStep(0);};

const tabBtnStyle=(k)=>({padding:isTab?"10px 24px":"8px 16px",border:"none",borderBottom:tab===k?"3px solid #2b7de9":"3px solid transparent",background:"transparent",color:tab===k?"var(--text-primary)":"var(--text-secondary)",fontSize:isTab?20:15,fontWeight:tab===k?800:600,cursor:"pointer"});

/* Games filtered for display in calendar tab */
const calFilteredGames=(calStart&&calEnd)?filterGamesByDates(allGames,calStart,calEnd):calStart?filterGamesByDates(allGames,calStart,calStart):[];

/* Load wind data for visible games (lazy) */
const visibleGameKeys=React.useMemo(()=>{
const keys=new Set();
if(tab==="calendar"){calFilteredGames.forEach(g=>keys.add(g.d));}
else if(tab==="recent"){recentGamesAll.forEach(g=>keys.add(g.d));}
return keys;
},[tab,calFilteredGames,recentGamesAll]);
useEffect(()=>{
let cancelled=false;
const toLoad=[...visibleGameKeys].filter(k=>!(k in windDataCache));
if(toLoad.length===0)return;
Promise.all(toLoad.map(k=>loadWindDataWithFallback(k).then(d=>({k,d})))).then(results=>{
if(cancelled)return;
const patch={};
results.forEach(({k,d})=>{patch[k]=d||null;});
setWindDataCache(prev=>({...prev,...patch}));
});
return()=>{cancelled=true;};
},[visibleGameKeys]);

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
{/* Period switcher (cumulative "all" tab only) */}
{viewMode==="cumulative"&&tab==="all"&&(
<div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
{PERIOD_OPTIONS.map(opt=>{const active=(selectedPeriod===opt.value);return(
<button key={opt.label} onClick={()=>setSelectedPeriod(opt.value)} style={{padding:isTab?"8px 16px":"6px 10px",border:active?"2px solid var(--accent-blue)":"1px solid var(--border-input)",borderRadius:8,background:active?"var(--accent-blue)":"var(--bg-surface)",color:active?"var(--text-inverse)":"var(--text-secondary)",fontSize:isTab?15:12,fontWeight:active?800:600,cursor:"pointer"}}>{opt.label}</button>
);})}
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
{calPagedGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab} onShowScore={setScoreGame} onShowWind={setWindChartGame} onDelete={(key,game)=>setDeleteConf(game)} isAdmin={isAdmin} windData={windDataCache[g.d]}/>))}
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
{recentGames.map(g=>(<GameListItem key={g.d} game={g} checked={selectedGameKeys.has(g.d)} onToggle={()=>toggleGameKey(g.d)} isTab={isTab} onShowScore={setScoreGame} onShowWind={setWindChartGame} onDelete={(key,game)=>setDeleteConf(game)} isAdmin={isAdmin} windData={windDataCache[g.d]}/>))}
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
{/* Level badges - admin only */}
{isAdmin&&viewMode!=="current"&&playersData.some(pd=>pd.levelInfo)&&(
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
{playersData.map(pd=>{
const li=pd.levelInfo;
if(!li)return null;
let label,color;
if(li.source==="manual"){
label="Lv"+li.level+" "+LEVEL_NAMES[li.level]+"(手動設定)";
color=pd.color;
}else if(li.level===null){
label="データ蓄積中";
color="#999";
}else if(li.confidence===CONFIDENCE_LEVELS.PROVISIONAL.label){
label="推定 Lv"+li.level+" "+LEVEL_NAMES[li.level]+"(暫定)";
color=pd.color;
}else if(li.confidence===CONFIDENCE_LEVELS.HIGH.label){
label="Lv"+li.level+" "+LEVEL_NAMES[li.level];
color=pd.color;
}else{
label="推定 Lv"+li.level+" "+LEVEL_NAMES[li.level];
color=pd.color;
}
return(<div key={pd.name} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:color+"12",border:"1px solid "+color+"33",borderRadius:8}}>
<span style={{fontSize:13,fontWeight:800,color:pd.color}}>{pd.name}</span>
<span style={{fontSize:12,fontWeight:600,color:li.level===null?"#999":color}}>{label}</span>
</div>);
})}
</div>
)}
{/* SVG Radar (7-axis) - full width */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{display:"flex",justifyContent:"center",width:"100%"}}><RadarChart playersData={playersData} size={isTab?600:340}/></div>
<div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:4}}>{playersData.map(pd=>(<div key={pd.name} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:5,background:pd.color}}/><span style={{fontSize:12,fontWeight:700,color:"#333"}}>{pd.name}</span></div>))}</div>
</div>
{/* Summary table */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,marginBottom:14,border:"1px solid var(--border-input)"}}>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}><thead><tr style={{background:"var(--bg-secondary)",color:"var(--text-inverse)"}}><th style={{padding:"8px",textAlign:"left"}}>プレイヤー</th><th style={{padding:"8px"}}>試合</th><th style={{padding:"8px"}}>勝利</th><th style={{padding:"8px"}}>ターン</th><th style={{padding:"8px"}}>ミス</th><th style={{padding:"8px"}}>ミス率</th><th style={{padding:"8px"}}>上がり率</th></tr></thead>
<tbody>{playersData.map(pd=>{const m=pd.metrics;return(<tr key={pd.name} style={{borderBottom:"1px solid var(--border-lighter)"}}><td style={{padding:"8px",fontWeight:700,color:pd.color}}>{pd.name}</td><td style={{padding:"8px",textAlign:"center"}}>{m.gameCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.winCount}</td><td style={{padding:"8px",textAlign:"center"}}>{m.turnCount}</td><td style={{padding:"8px",textAlign:"center",color:"var(--accent-orange)"}}>{m.missCount}</td><td style={{padding:"8px",textAlign:"center"}}>{(m.missRate*100).toFixed(1)}%</td><td style={{padding:"8px",textAlign:"center"}}>{(m.finishRate*100).toFixed(1)}%</td></tr>);})}</tbody></table>
</div>
{/* Score Distribution */}
<ScoreDistribution playersData={playersData} favs={favs} isAdmin={isAdmin} aiEnabled={aiEnabled!==false} getGames={getPlayerGames}/>
{/* Detailed metrics */}
<div style={{background:"var(--bg-surface)",borderRadius:14,padding:14,border:"1px solid var(--border-input)",marginBottom:14}}>
<div style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:8}}><BarChart3 size={16} style={{display:"inline",verticalAlign:"middle",marginRight:4}}/> 詳細指標</div>
<table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"var(--bg-surface-alt)"}}><th style={{padding:"6px",textAlign:"left"}}>指標</th>{playersData.map(pd=><th key={pd.name} style={{padding:"6px",textAlign:"center",color:pd.color,fontWeight:800}}>{pd.name}</th>)}</tr></thead>
<tbody>{[["先攻勝率",pd=>pd.metrics.firstWinRate!=null?(pd.metrics.firstWinRate*100).toFixed(1)+"% ("+pd.metrics.firstGames+"試合)":"-"],["後攻勝率",pd=>pd.metrics.lastWinRate!=null?(pd.metrics.lastWinRate*100).toFixed(1)+"% ("+pd.metrics.lastGames+"試合)":"-"],["投擲平均点",pd=>pd.metrics.avgPts.toFixed(2)],["ブレイク平均",pd=>pd.metrics.breakAvg.toFixed(2)],["2ミス後平均",pd=>pd.metrics.recAvg.toFixed(2)],["上がり決定率",pd=>(pd.metrics.finishRate*100).toFixed(1)+"%"],["ミス率",pd=>(pd.metrics.missRate*100).toFixed(1)+"%"],["最短投擲",pd=>fmtSec(pd.metrics.throwMin)],["最長投擲",pd=>fmtSec(pd.metrics.throwMax)],["平均投擲",pd=>fmtSec(pd.metrics.throwAvg)]].map(([label,fn])=>(<tr key={label} style={{borderBottom:"1px solid var(--border-lighter)"}}><td style={{padding:"6px",fontWeight:700}}>{label}</td>{playersData.map(pd=><td key={pd.name} style={{padding:"6px",textAlign:"center"}}>{fn(pd)}</td>)}</tr>))}</tbody></table>
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
{windChartGame&&<WindDataModal gameKey={windChartGame} onClose={()=>setWindChartGame(null)}/>}
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
