import { WIN, MAX_GAMES, MAX_REPLAYS, LEVEL_WEIGHTS, LEVEL_BENCHMARKS, LEVEL_INVERTED, SECOND_TURN_BONUS, DEFAULT_PERIOD_MS, MIN_GAMES_FOR_LEVEL, CONFIDENCE_LEVELS } from "./constants.js";
import { _cache, _persistStats, _persistReplays, loadReplays, renamePlayerLevel } from "./db.js";
import { _debouncedSync, pushToServer } from "./sync.js";

// ═══ Stats Storage Helpers ═══
function _countTotalGames(stats){
let c=0;for(const nm in stats)c+=stats[nm].length;return c;
}
function _trimOldestStats(stats,maxGames){
/* Collect all dates, find oldest to remove */
const allDates=[];
for(const nm in stats)stats[nm].forEach((g,i)=>allDates.push({nm,i,d:g.d}));
allDates.sort((a,b)=>a.d.localeCompare(b.d));
const excess=allDates.length-maxGames;
if(excess<=0)return;
/* Remove oldest entries */
const toRemove=allDates.slice(0,excess);
const removeMap={};
toRemove.forEach(r=>{if(!removeMap[r.nm])removeMap[r.nm]=new Set();removeMap[r.nm].add(r.i);});
for(const nm in removeMap){
stats[nm]=stats[nm].filter((_,i)=>!removeMap[nm].has(i));
if(!stats[nm].length)delete stats[nm];
}
}

export function saveGameStatsToDB(records){
const stats=_cache.stats;
records.forEach(({nm,data})=>{if(!stats[nm])stats[nm]=[];stats[nm].push(data);});
/* Trim if over limit */
if(_countTotalGames(stats)>MAX_GAMES)_trimOldestStats(stats,MAX_GAMES);
_persistStats();
_debouncedSync();
}
export function deleteStatsByPeriod(period){
if(period==="all"){_cache.stats={};_persistStats();
/* Also clear replays when deleting all */
_cache.replays={};_persistReplays();_debouncedSync();return;}
const stats=_cache.stats;const now=new Date();let start;
if(period==="day"){start=new Date(now);start.setHours(0,0,0,0);}
else if(period==="week"){start=new Date(now);const dow=start.getDay();start.setDate(start.getDate()-(dow===0?6:dow-1));start.setHours(0,0,0,0);}
else if(period==="month"){start=new Date(now.getFullYear(),now.getMonth(),1);}
else if(period==="year"){start=new Date(now.getFullYear(),0,1);}
for(const nm in stats){stats[nm]=stats[nm].filter(g=>new Date(g.d)<start);if(!stats[nm].length)delete stats[nm];}
_persistStats();
/* Also clean replays in the same period */
const replays=_cache.replays;
for(const key in replays){if(new Date(key)>=start)delete replays[key];}
_persistReplays();
_debouncedSync();
}

export async function deleteGameByKey(gameKey){
const stats=_cache.stats;
let deleted=false;
for(const nm in stats){
const before=stats[nm].length;
stats[nm]=stats[nm].filter(g=>g.d!==gameKey);
if(stats[nm].length<before)deleted=true;
if(!stats[nm].length)delete stats[nm];
}
if(deleted)_persistStats();
const replays=_cache.replays;
if(replays[gameKey]){
delete replays[gameKey];
_persistReplays();
}
/* 即時pushでサーバーのデータを更新（削除データの復活を防止） */
await pushToServer().catch(e=>console.error("delete sync error",e));
return deleted;
}

export function renamePlayerData(oldName,newName){
/* スタッツデータのキー名変更 */
const stats=_cache.stats;
if(stats[oldName]){
if(stats[newName]){
/* 万が一新名前のデータが既に存在する場合はマージ */
stats[newName]=[...stats[newName],...stats[oldName]];
}else{
stats[newName]=stats[oldName];
}
delete stats[oldName];
_persistStats();
}
/* リプレイデータ内のプレイヤー名変更 */
const replays=_cache.replays;
for(const key in replays){
const rp=replays[key];
if(rp&&rp.teams){
rp.teams.forEach(t=>{
if(t.players){
t.players.forEach(p=>{
if(typeof p==="object"&&p.name===oldName)p.name=newName;
});
}
});
}
if(rp&&rp.history){
rp.history.forEach(h=>{
if(h.playerName===oldName)h.playerName=newName;
});
}
}
_persistReplays();
/* レベル設定のリネーム */
renamePlayerLevel(oldName,newName);
_debouncedSync();
}

// ═══ Game Record Building ═══
/* local copy of scoreOf to avoid circular dependency with App.jsx */
const scoreOf=(h,t)=>{for(let i=h.length-1;i>=0;i--)if(h[i].teamIndex===t)return h[i].runningTotal;return 0;};

export function calcOjama(history,playerName,playerTeamIdx){
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
export function buildGameRecord(teams,history,teamOrder,winner,timestamps,favs,overrideD){
const records=[];const d=overrideD||new Date().toISOString();
const gameStart=timestamps.length>0?timestamps[0].ts:null;
const gameEnd=timestamps.length>0?timestamps[timestamps.length-1].ts:null;
/* Determine finish type */
const finishType=(()=>{
if(winner===null)return"unknown";
const ws=scoreOf(history,winner);
if(ws===WIN)return"50finish";
return"dq";
})();
/* Game-wide info: all player names, winner name, winner team members */
const allPlayerNames=[];
teams.forEach(t=>{t.players.forEach(p=>{const nm=typeof p==="object"?p.name:p;if(!allPlayerNames.includes(nm))allPlayerNames.push(nm);});});
let gameWinnerName=null;
const gameWinnerMembers=[];
if(winner!==null){
const wTeam=teams[winner];
if(wTeam){
wTeam.players.forEach(p=>{const nm=typeof p==="object"?p.name:p;gameWinnerMembers.push(nm);});
const wturns=history.filter(h=>h.teamIndex===winner);
const lastThrow=wturns.length>0?wturns[wturns.length-1]:null;
if(lastThrow){const wp=wTeam.players[lastThrow.playerIndex];gameWinnerName=wp?(typeof wp==="object"?wp.name:wp):null;}
}
}
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
const isFirstOrder=teamOrder[0]===ti;
const times=[];
/* Build turn values: positive=score, 0=miss, -1=fault */
const turnValues=turns.map(h=>h.type==="score"?h.score:h.type==="fault"?-1:0);
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
records.push({nm,data:{d,de:gameEnd,t:turns.length,s:totalPts,m:misses,f:faults,w:won?1:0,o:ojama.success,oa:ojama.attempts,fa:finA,fs:finS,hs:highScores,rc:rec,br:breakScore,tMin,tMax,tAvg,ft:finishType,sv:scoreValues,fo:isFirstOrder?1:0,tv:turnValues,ap:allPlayerNames,wn:gameWinnerName,wm:gameWinnerMembers}});
});});
return records;
}

/* ═══ Game Replay Storage ═══ */
export function saveReplay(d,teams,history,teamOrder,winner,autoEnd,dqEndGame){
try{
const replays=_cache.replays;
const slimTeams=teams.map(t=>({name:t.name,players:t.players.map(p=>({name:typeof p==="object"?p.name:p,active:typeof p==="object"?p.active:true}))}));
const slimHistory=history.map(h=>({turn:h.turn,teamIndex:h.teamIndex,playerIndex:h.playerIndex,playerName:h.playerName,type:h.type,score:h.score,runningTotal:h.runningTotal,prevScore:h.prevScore,reset25:h.reset25,faultReset:h.faultReset,consecutiveFails:h.consecutiveFails}));
replays[d]={teams:slimTeams,history:slimHistory,teamOrder,winner,autoEnd:!!autoEnd,dqEndGame:!!dqEndGame};
/* Keep max MAX_REPLAYS, remove oldest */
const keys=Object.keys(replays).sort();
while(keys.length>MAX_REPLAYS){delete replays[keys.shift()];}
_persistReplays();
_debouncedSync();
}catch(e){console.error("replay save error",e);}
}

// ═══ Period Helpers ═══
export function getMondayOfWeek(d){const dt=new Date(d);const dow=dt.getDay();dt.setDate(dt.getDate()-(dow===0?6:dow-1));dt.setHours(0,0,0,0);return dt;}
export function fmtMD(d){return(d.getMonth()+1)+"/"+d.getDate();}
export function fmtHM(d){return d.getHours()+":"+String(d.getMinutes()).padStart(2,"0");}

// ═══ Stats Query / Filter ═══
export function getAvailableSessions(stats,names){
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

export function getAvailableWeeks(stats,names){
const all=[];names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{all.push(new Date(g.d));});});
const weeks=new Map();
all.forEach(d=>{const mon=getMondayOfWeek(d);const key=mon.toISOString().slice(0,10);if(!weeks.has(key))weeks.set(key,mon);});
return[...weeks.values()].sort((a,b)=>b-a);
}

export function getAvailableMonths(stats,names){
const all=[];names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{all.push(g.d);});});
const months=new Set(all.map(d=>d.slice(0,7)));
return[...months].sort().reverse();
}

export function filterGames(games,period,subSel){
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

export function calcMetrics(games){
if(!games.length)return null;
const tot={t:0,s:0,m:0,f:0,w:0,o:0,oa:0,fa:0,fs:0,hs:0,rc:[],br:[],tMin:[],tMax:[],tAvg:[],sv:[],foW:0,foG:0,loW:0,loG:0};
games.forEach(g=>{tot.t+=g.t;tot.s+=g.s;tot.m+=g.m;tot.f+=g.f;tot.w+=g.w;tot.o+=g.o;tot.oa+=(g.oa||0);tot.fa+=g.fa;tot.fs+=g.fs;tot.hs+=g.hs;if(g.rc)tot.rc.push(...g.rc);if(g.br!=null)tot.br.push(g.br);if(g.tMin!=null)tot.tMin.push(g.tMin);if(g.tMax!=null)tot.tMax.push(g.tMax);if(g.tAvg!=null)tot.tAvg.push(g.tAvg);if(g.sv)tot.sv.push(...g.sv);
if(g.fo===1){tot.foG++;if(g.w)tot.foW++;}else if(g.fo===0){tot.loG++;if(g.w)tot.loW++;}
});
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
const winRate=games.length>0?tot.w/games.length:0;
const firstWinRate=tot.foG>0?tot.foW/tot.foG:null;
const lastWinRate=tot.loG>0?tot.loW/tot.loG:null;
return{
missRate,finishRate,avgPts,recAvg,highRate,breakAvg,ojamaRate,throwMin,throwMax,throwAvg,
missCount:tot.m,turnCount:tot.t,ojamaCount:tot.o,ojamaAttempts:tot.oa,winCount:tot.w,gameCount:games.length,
scoreValues:tot.sv,winRate,firstWinRate,lastWinRate,firstGames:tot.foG,lastGames:tot.loG,
r:[(1-missRate)*100,finishRate*100,(avgPts/12)*100,(recAvg/12)*100,(breakAvg/12)*100,winRate*100]
};
}

// ═══ Game-level Helpers ═══
export function getAvailableGames(stats,names){
const gameMap=new Map();
const replays=loadReplays();
names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{
const key=g.d;
if(!gameMap.has(key)){gameMap.set(key,{d:g.d,de:g.de,players:[],records:[],ft:g.ft||"unknown",winnerMembers:[],hasReplay:!!replays[g.d]});}
const gm=gameMap.get(key);
/* Use ap (all players) field if available, otherwise fallback to fav name */
if(g.ap&&g.ap.length>0){g.ap.forEach(p=>{if(!gm.players.includes(p))gm.players.push(p);});}
else{if(!gm.players.includes(nm))gm.players.push(nm);}
gm.records.push({nm,data:g});
/* Use wn/wm fields if available, otherwise fallback to fav-based detection */
if(g.wn&&!gm.winnerName)gm.winnerName=g.wn;
if(g.wm&&g.wm.length>0){g.wm.forEach(m=>{if(!gm.winnerMembers.includes(m))gm.winnerMembers.push(m);});}
else if(g.w===1){
if(!gm.winnerName)gm.winnerName=nm;
if(!gm.winnerMembers.includes(nm))gm.winnerMembers.push(nm);
}
if(g.ft&&g.ft!=="unknown")gm.ft=g.ft;
});});
return[...gameMap.values()].sort((a,b)=>new Date(b.d)-new Date(a.d));
}
export function getGameDates(stats,names){
const dates=new Set();
names.forEach(nm=>{(stats[nm]||[]).forEach(g=>{dates.add(g.d.slice(0,10));});});
return dates;
}
export function filterGamesByDates(games,startDate,endDate){
const s=new Date(startDate);s.setHours(0,0,0,0);
const e=new Date(endDate);e.setHours(23,59,59,999);
return games.filter(g=>{const d=new Date(g.d);return d>=s&&d<=e;});
}
export function filterGamesByKeys(games,selectedKeys){
return games.filter(g=>selectedKeys.has(g.d));
}
export function getGamesForNames(stats,names,selectedKeys){
const result={};
names.forEach(nm=>{
const all=stats[nm]||[];
result[nm]=selectedKeys?all.filter(g=>selectedKeys.has(g.d)):all;
});
return result;
}

// ═══ Level Estimation ═══

/**
 * Filter games by time period.
 * @param {Array} games - per-player game record array
 * @param {number|null} periodMs - period in ms, null = all
 */
export function filterGamesByPeriod(games,periodMs){
if(periodMs===null)return games;
const cutoff=Date.now()-periodMs;
return games.filter(g=>{
const t=new Date(g.d).getTime();
return t>=cutoff;
});
}

/**
 * Convert a single indicator value to 1.0-5.0 score via linear interpolation.
 * @param {number} value - actual indicator value
 * @param {number[]} benchmarks - [Lv1,Lv2,Lv3,Lv4,Lv5] typical values
 * @param {boolean} inverted - true if lower value = higher level
 */
export function calcIndicatorScore(value,benchmarks,inverted){
if(value==null||isNaN(value))return 3.0;
if(!inverted){
if(value<=benchmarks[0])return 1.0;
if(value>=benchmarks[4])return 5.0;
for(let i=0;i<4;i++){
if(value<=benchmarks[i+1]){
const ratio=(value-benchmarks[i])/(benchmarks[i+1]-benchmarks[i]);
return(i+1)+ratio;
}
}
return 5.0;
}else{
/* inverted: benchmarks are descending [Lv1(high),Lv2,...,Lv5(low)] */
if(value>=benchmarks[0])return 1.0;
if(value<=benchmarks[4])return 5.0;
for(let i=0;i<4;i++){
if(value>=benchmarks[i+1]){
const ratio=(benchmarks[i]-value)/(benchmarks[i]-benchmarks[i+1]);
return(i+1)+ratio;
}
}
return 5.0;
}
}

/**
 * Estimate opponent level from same-game players' stats.
 * Uses d (date key) to find opponent records in allStats.
 */
function estimateOpponentLevel(game,playerName,allStats){
const opponents=(game.ap||[]).filter(n=>n!==playerName);
if(opponents.length===0)return null;
let totalScore=0,count=0;
for(const opp of opponents){
const oppGames=allStats[opp];
if(!oppGames)continue;
const oppGame=oppGames.find(g=>g.d===game.d);
if(!oppGame)continue;
const turns=oppGame.t||0;
if(turns===0)continue;
const hitRate=(1-oppGame.m/turns)*100;
const avgScore=oppGame.s/turns;
const hs=calcIndicatorScore(hitRate,LEVEL_BENCHMARKS.hitRate,false);
const as=calcIndicatorScore(avgScore,LEVEL_BENCHMARKS.avgScore,false);
totalScore+=(hs+as)/2;
count++;
}
return count>0?Math.round(totalScore/count):null;
}

/**
 * Calculate adjusted win rate with first/second turn bonus and opponent level consideration.
 * @param {Array} games - player's game records (period-filtered)
 * @param {string} playerName - player name
 * @param {number} currentLevelEstimate - preliminary level (1-5)
 * @param {object} allStats - full _cache.stats for opponent lookup
 */
export function calcAdjustedWinRate(games,playerName,currentLevelEstimate,allStats){
const bonus=currentLevelEstimate>=4?SECOND_TURN_BONUS.high:SECOND_TURN_BONUS.low;
let adjWins=0,adjTotal=0;
for(const g of games){
const isFirst=g.fo===1;
const won=g.w===1;
const opponentLevel=estimateOpponentLevel(g,playerName,allStats);
let matchWeight=1.0;
if(opponentLevel!==null){
const levelDiff=opponentLevel-currentLevelEstimate;
if(won){matchWeight=1.0+levelDiff*0.1;}
else{matchWeight=1.0-levelDiff*0.1;}
matchWeight=Math.max(0.5,Math.min(1.5,matchWeight));
}
if(isFirst){
adjWins+=won?matchWeight:0;
adjTotal+=matchWeight;
}else{
adjWins+=won?(matchWeight*bonus):0;
adjTotal+=matchWeight*bonus;
}
}
return adjTotal>0?(adjWins/adjTotal)*100:0;
}

/**
 * Main level estimation function.
 * @param {string} playerName
 * @param {Array} playerGames - this player's game records
 * @param {object} allStats - full _cache.stats for opponent lookup
 * @param {number|null} periodMs - filter period in ms
 */
export function estimatePlayerLevel(playerName,playerGames,allStats,periodMs){
if(periodMs===undefined)periodMs=DEFAULT_PERIOD_MS;
const games=filterGamesByPeriod(playerGames,periodMs);
const gameCount=games.length;
if(gameCount<MIN_GAMES_FOR_LEVEL){
return{level:null,rawLevel:null,confidence:CONFIDENCE_LEVELS.NONE.label,scores:null,indicators:null,adjWinRate:null,gameCount};
}
/* Compute metrics from filtered games */
const m=calcMetrics(games);
if(!m)return{level:null,rawLevel:null,confidence:CONFIDENCE_LEVELS.NONE.label,scores:null,indicators:null,adjWinRate:null,gameCount};

/* Extract 8 indicators */
const hitRate=(1-m.missRate)*100;
const avgScore=m.avgPts;
const finishRate=m.finishRate*100;
const recAvg=m.recAvg;

/* Burst rate: count bursts from sv arrays */
let burstCount=0,gamesWithSv=0;
const allScores=[];
const efficiencies=[];
for(const g of games){
if(!g.sv||!Array.isArray(g.sv)||g.sv.length===0)continue;
gamesWithSv++;
let total=0;
for(const s of g.sv){total+=s;if(total>50){burstCount++;total=25;}}
allScores.push(...g.sv);
/* finish efficiency per game */
let inFP=false,fThrows=0;
const eff=[];
let t2=0;
for(const s of g.sv){
t2+=s;if(t2>50){t2=25;inFP=false;fThrows=0;}
if(t2>=38&&!inFP){inFP=true;fThrows=0;}
if(inFP){fThrows++;if(t2===50){eff.push(fThrows);inFP=false;fThrows=0;}}
}
if(eff.length>0)efficiencies.push(eff.reduce((a,b)=>a+b,0)/eff.length);
}
const burstRate=gamesWithSv>0?(burstCount/gamesWithSv)*100:0;
const finishEfficiency=efficiencies.length>0?efficiencies.reduce((a,b)=>a+b,0)/efficiencies.length:null;
/* Score std dev */
let scoreStdDev=null;
if(allScores.length>=2){
const mean=allScores.reduce((a,b)=>a+b,0)/allScores.length;
const variance=allScores.reduce((sum,s)=>sum+(s-mean)*(s-mean),0)/allScores.length;
scoreStdDev=Math.sqrt(variance);
}

const values={hitRate,avgScore,finishRate,burstRate,finishEfficiency,afterDoubleMiss:recAvg,scoreStdDev};

/* Preliminary level (without winRate) for win rate correction */
const prelimKeys=["hitRate","avgScore","finishRate","burstRate","finishEfficiency","afterDoubleMiss","scoreStdDev"];
const prelimScores={};
let prelimSum=0,prelimWeightSum=0;
for(const key of prelimKeys){
const v=values[key];
const score=calcIndicatorScore(v,LEVEL_BENCHMARKS[key],LEVEL_INVERTED[key]);
prelimScores[key]=score;
prelimSum+=score*LEVEL_WEIGHTS[key];
prelimWeightSum+=LEVEL_WEIGHTS[key];
}
const prelimLevel=Math.max(1,Math.min(5,Math.round(prelimSum/prelimWeightSum)));

/* Adjusted win rate */
const adjWinRate=calcAdjustedWinRate(games,playerName,prelimLevel,allStats||{});

/* All scores including winRate */
const allIndicatorScores={...prelimScores};
allIndicatorScores.winRate=calcIndicatorScore(adjWinRate,LEVEL_BENCHMARKS.winRate,false);

/* Weighted average for final level */
let totalWeighted=0;
for(const[key,weight]of Object.entries(LEVEL_WEIGHTS)){
totalWeighted+=allIndicatorScores[key]*weight;
}
const rawLevel=totalWeighted;
const level=Math.max(1,Math.min(5,Math.round(rawLevel)));

/* Confidence */
let confidence="";
if(gameCount<10)confidence=CONFIDENCE_LEVELS.NONE.label;
else if(gameCount<30)confidence=CONFIDENCE_LEVELS.PROVISIONAL.label;
else if(gameCount<100)confidence=CONFIDENCE_LEVELS.NORMAL.label;
else confidence=CONFIDENCE_LEVELS.HIGH.label;

return{
level,
rawLevel:Math.round(rawLevel*10)/10,
confidence,
scores:allIndicatorScores,
indicators:values,
adjWinRate,
gameCount,
};
}
