import { BLINK_ID, WIN, RST, PEN, MF } from "./constants.js";

// ═══ UI Utility ═══
export function ensureBlink(){if(document.getElementById(BLINK_ID))return;const s=document.createElement("style");s.id=BLINK_ID;s.textContent="@keyframes mk-blink{0%,100%{background:rgba(43,125,233,0.12)}50%{background:rgba(43,125,233,0.45)}}";document.head.appendChild(s);}

// ═══ Helpers ═══
export const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
export const arrEq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
export const scoreOf=(h,t)=>{for(let i=h.length-1;i>=0;i--)if(h[i].teamIndex===t)return h[i].runningTotal;return 0;};
export const failsOf=(h,t)=>{let c=0;for(let i=h.length-1;i>=0;i--){if(h[i].teamIndex===t){if(h[i].type==="miss"||h[i].type==="fault")c++;else break;}}return c;};
export const getFA=(hist,tIdx,turn)=>{let c=0;const th=hist.filter(h=>h.teamIndex===tIdx&&h.turn<=turn);for(let i=th.length-1;i>=0;i--){if(th[i].type==="miss"||th[i].type==="fault")c++;else break;}return c;};
export function smartShuf(arr,prev,n){n=n||20;if(arr.length<=1)return[...arr];for(let i=0;i<n;i++){const s=shuf(arr);if(!prev||!arrEq(s,prev))return s;}return shuf(arr);}

// ═══ Reducer (with timestamp support + player rotation offset) ═══
function adv(s){let oi=(s.currentOrderIdx+1)%s.teamOrder.length,t=s.currentTurn;if(oi===0)t++;let x=0;while(s.eliminated[s.teamOrder[oi]]&&x<s.teamOrder.length){oi=(oi+1)%s.teamOrder.length;if(oi===0)t++;x++;}const alive=s.teamOrder.filter(ti=>!s.eliminated[ti]);if(alive.length<=1)return{...s,currentOrderIdx:oi,currentTurn:t,winner:alive.length===1?alive[0]:null,autoEnd:true};return{...s,currentOrderIdx:oi,currentTurn:t};}
export function getPI(teams,history,ti,plOffsets){
const ap=teams[ti].players.filter(p=>p.active);
const td=history.filter(h=>h.teamIndex===ti).length;
const off=(plOffsets&&plOffsets[ti])||0;
const pi=ap.length>0?((td+off)%ap.length+ap.length)%ap.length:0;
return{ap,pi};
}
export function reducer(s,a){
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
