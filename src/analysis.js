import { AI_ENABLED_KEY, ANALYSIS_LIMIT_KEY, ANALYSIS_TOTAL_KEY, ANALYSIS_CACHE_DAYS, ANALYSIS_DAILY_MAX } from "./constants.js";
import { _db, _cache, idbSet } from "./db.js";

/* ═══ 新規算出指標（スコア推移から動的計算） ═══ */

/** バースト回数: 累計が50を超えた回数 */
export function countBursts(scoreArray){
  let total=0,bursts=0;
  for(const score of scoreArray){
    total+=score;
    if(total>50){bursts++;total=25;}
  }
  return bursts;
}

/** 得点の標準偏差: 1投ごとの得点のばらつき */
export function calcScoreStdDev(scoreArray){
  if(!scoreArray||scoreArray.length<2)return null;
  const mean=scoreArray.reduce((a,b)=>a+b,0)/scoreArray.length;
  const variance=scoreArray.reduce((sum,s)=>sum+(s-mean)*(s-mean),0)/scoreArray.length;
  return Math.sqrt(variance);
}

/**
 * ゾロ目狙い回数: 特定累計点数から関連スキットル単品を倒した回数
 *
 * ゾロ目ルートとは、同じ番号のスキットルを2回連続で倒して上がるルートのこと。
 * 3つのルートが存在する:
 *   12ルート: 累計26点→12を倒す(→38点)→12を倒す(→50点上がり)
 *   11ルート: 累計28点→11を倒す(→39点)→11を倒す(→50点上がり)
 *   10ルート: 累計30点→10を倒す(→40点)→10を倒す(→50点上がり)
 *
 * カウント対象（各1回ずつカウント）:
 *   累計26点で得点12 → +1
 *   累計38点で得点12 → +1
 *   累計28点で得点11 → +1
 *   累計39点で得点11 → +1
 *   累計30点で得点10 → +1
 *   累計40点で得点10 → +1
 *
 * 中盤以降の得点10・11・12はほぼ確実に単品狙い（ガシャで10〜12本倒すのは極めて稀）。
 * そのため推定ロジックとして「得点10/11/12 = 単品狙い」と断定する。
 */
const ZOROME_MAP=new Map([
  // [累計点数, 期待する得点]
  [26,12],[38,12],
  [28,11],[39,11],
  [30,10],[40,10]
]);
export function countZoromeHits(scoreArray){
  let total=0,count=0;
  for(const score of scoreArray){
    const before=total;
    total+=score;
    if(total>50)total=25;
    if(ZOROME_MAP.has(before)&&ZOROME_MAP.get(before)===score){
      count++;
    }
  }
  return count;
}

/** 上がり効率: 38点以上到達→50点ぴったりまでの投擲数（1試合分）
 *  38点起点の理由: 38点から12番スキットルで1投上がりが可能なため
 */
export function calcFinishEfficiency(scoreArray){
  let total=0,inFinishPhase=false,finishThrows=0;
  const efficiencies=[];
  for(const score of scoreArray){
    total+=score;
    if(total>50){total=25;inFinishPhase=false;finishThrows=0;}
    if(total>=38&&!inFinishPhase){inFinishPhase=true;finishThrows=0;}
    if(inFinishPhase){
      finishThrows++;
      if(total===50){efficiencies.push(finishThrows);inFinishPhase=false;finishThrows=0;}
    }
  }
  return efficiencies.length>0
    ?efficiencies.reduce((a,b)=>a+b,0)/efficiencies.length
    :null;
}

/**
 * 全試合のstatsレコード配列から4指標を集計する
 * @param {Array} games - プレイヤーのゲームレコード配列（各要素に sv フィールドがある）
 * @returns {Object} { burstCount, burstPer10, scoreStdDev, zoromeHits, finishEfficiency, gamesWithSv }
 */
export function calcNewIndicators(games){
  let burstTotal=0,zoromeTotal=0;
  const allScores=[];
  const efficiencies=[];
  let gamesWithSv=0;
  for(const g of games){
    if(!g.sv||!Array.isArray(g.sv)||g.sv.length===0)continue;
    gamesWithSv++;
    burstTotal+=countBursts(g.sv);
    zoromeTotal+=countZoromeHits(g.sv);
    allScores.push(...g.sv);
    const eff=calcFinishEfficiency(g.sv);
    if(eff!==null)efficiencies.push(eff);
  }
  return{
    burstCount:burstTotal,
    burstPer10:gamesWithSv>0?Math.round(burstTotal/gamesWithSv*10*10)/10:0,
    scoreStdDev:calcScoreStdDev(allScores),
    zoromeHits:zoromeTotal,
    finishEfficiency:efficiencies.length>0
      ?Math.round(efficiencies.reduce((a,b)=>a+b,0)/efficiencies.length*10)/10
      :null,
    gamesWithSv
  };
}

// ═══ AI Enabled Setting ═══
export function getAIEnabled(){try{const v=localStorage.getItem(AI_ENABLED_KEY);return v===null?true:v==="true";}catch(e){return true;}}
export function setAIEnabledLS(v){try{localStorage.setItem(AI_ENABLED_KEY,v?"true":"false");}catch(e){}}

// ═══ Analysis Rate Limit (per-player per-day) ═══
export function getPlayerAnalysisCount(name){
try{const d=JSON.parse(localStorage.getItem(ANALYSIS_LIMIT_KEY)||"{}");
const today=new Date().toISOString().slice(0,10);
if(d.date!==today)return 0;return(d.players&&d.players[name])||0;}catch(e){return 0;}
}
export function incPlayerAnalysisCount(name){
try{const today=new Date().toISOString().slice(0,10);
const d=JSON.parse(localStorage.getItem(ANALYSIS_LIMIT_KEY)||"{}");
if(d.date!==today){d.date=today;d.players={};}
if(!d.players)d.players={};
d.players[name]=(d.players[name]||0)+1;
localStorage.setItem(ANALYSIS_LIMIT_KEY,JSON.stringify(d));
return d.players[name];}catch(e){return 999;}
}

// ═══ Analysis Total Counter ═══
export function getAnalysisTotal(){try{return parseInt(localStorage.getItem(ANALYSIS_TOTAL_KEY)||"0",10);}catch(e){return 0;}}
export function incAnalysisTotal(){try{const c=getAnalysisTotal()+1;localStorage.setItem(ANALYSIS_TOTAL_KEY,String(c));return c;}catch(e){return 0;}}

// ═══ Analysis Persistent Cache (IndexedDB) ═══
export function _persistAnalysis(){if(_db)idbSet(_db,"analysisCache",_cache.analysis).catch(e=>console.error("analysis persist error",e));}
export function getAnalysisCached(key){const e=_cache.analysis[key];if(!e)return null;if(Date.now()-e.t>ANALYSIS_CACHE_DAYS*86400000){delete _cache.analysis[key];_persistAnalysis();return null;}return e.text;}
export function setAnalysisCached(key,text){_cache.analysis[key]={text,t:Date.now()};_persistAnalysis();}
export function makeAnalysisKey(name,gc,m,newIndicators){const sf=(v,d)=>(typeof v==="number"&&!isNaN(v))?v.toFixed(d):"0";return name+"|"+gc+"|"+sf(m.missRate,3)+"|"+sf(m.finishRate,3)+"|"+sf(m.ojamaRate,3)+"|"+sf(m.winRate,3)+"|"+sf(m.avgPts,2)+"|b"+(newIndicators?.burstCount??"")+"|sd"+(newIndicators?.scoreStdDev!=null?newIndicators.scoreStdDev.toFixed(1):"")+"|fe"+(newIndicators?.finishEfficiency??"");}

// ═══ Analysis API ═══
const _analysisPending=new Set();
export async function fetchPlayerAnalysis(name,m,isAdminMode,newIndicators){
const gc=m?m.gameCount:0;
if(!m||gc<3)return{text:null,error:"3試合以上必要"};
/* Rate limit (per-player per-day, admin exempt) */
if(!isAdminMode){const used=getPlayerAnalysisCount(name);if(used>=ANALYSIS_DAILY_MAX)return{text:null,error:"本日の分析上限("+ANALYSIS_DAILY_MAX+"回/人)に達しました"};}
const key=makeAnalysisKey(name,gc,m,newIndicators);
if(_analysisPending.has(key))return{text:null,error:"分析中..."};
_analysisPending.add(key);
try{
const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({gameCount:gc,winRate:m.winRate||0,missRate:m.missRate||0,finishRate:m.finishRate||0,avgPts:m.avgPts||0,breakAvg:m.breakAvg||0,ojamaRate:m.ojamaRate||0,ojamaAttempts:m.ojamaAttempts||0,recAvg:m.recAvg||0,firstWinRate:m.firstWinRate!=null?m.firstWinRate:null,lastWinRate:m.lastWinRate!=null?m.lastWinRate:null,burstCount:newIndicators?.burstCount??null,burstPer10:newIndicators?.burstPer10??null,scoreStdDev:newIndicators?.scoreStdDev!=null?Math.round(newIndicators.scoreStdDev*100)/100:null,zoromeHits:newIndicators?.zoromeHits??null,finishEfficiency:newIndicators?.finishEfficiency??null})});
if(!res.ok){let errMsg="API "+res.status;try{const raw=await res.text();try{const ej=JSON.parse(raw);if(ej.error)errMsg=typeof ej.error==="string"?ej.error:ej.error.message||errMsg;}catch(_){if(raw)errMsg+=": "+raw.slice(0,120);}}catch(_2){}return{text:null,error:errMsg};}
const data=await res.json();
if(data.text){setAnalysisCached(key,data.text);incPlayerAnalysisCount(name);incAnalysisTotal();return{text:data.text,error:null};}
return{text:null,error:data.error||"空のレスポンス"};
}catch(e){return{text:null,error:e.message||"通信エラー"};}
finally{_analysisPending.delete(key);}
}
