# STEP4 Phase C-1 データ収集結果

**作成日**: 2026-04-18
**対応指示書**: STEP4_PHASE_C1_DATA_COLLECTION_INSTRUCTION.md
**実行環境**: Windows 11 Home / bash / Claude Code Grep ツール（ripgrep ベース、`-n` 行番号付き、`--include="*.{jsx,css,js}"` 相当のグロブ指定）

**注記**: Claude Code の Grep ツールは ripgrep ベースで `grep -rn` と等価な出力を返すが、長い行に対して `[Omitted long matching line]` と省略することがある。本指示書は「省略禁止」のため、省略された行は Read ツールで個別に取得して原文を復元した。復元した行は該当ブロック内で元の位置に差し込んでいる（行末のコロン注記で明示）。

---

## 1. grep クエリ実行結果

### 1.A ブロック A: --success 系

#### A-1: `grep -rn "success" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 19 件

```
src/components/GameResult.jsx:75:<div style={{textAlign:"center",marginBottom:12}}><h2 style={{fontSize:30,fontWeight:900,color:C[winner]?.ac||"var(--text-primary)",margin:0}}>{teams[winner]?.name} 勝利！</h2>{isMatchOver&&<div style={{fontSize:32,fontWeight:900,color:"var(--text-success)",marginTop:4}}><Trophy size={28} style={{display:"inline",verticalAlign:"middle",marginRight:6}}/> {teams[matchWin].name} {bestOf}先取達成！</div>}</div>
src/components/common.jsx:489:const[syncConfirmed,setSyncConfirmed]=useState(!!savedCode);/* was a sync ever successful? */
src/components/common.jsx:593:<span style={{fontSize:14,color:syncConfirmed?"var(--text-success)":"rgba(255,255,255,0.4)",fontWeight:700,display:"flex",alignItems:"center",gap:4}}><Cloud size={14}/> {syncConfirmed?"同期済":"未設定"}</span>
src/components/common.jsx:624:<span style={{fontSize:13,color:"var(--text-success)",fontWeight:700}}>設定済み</span>
src/components/common.jsx:629:{syncStatus&&<div style={{fontSize:14,color:syncStatus.startsWith("✅")?"var(--text-success)":syncStatus.startsWith("❌")?"var(--text-danger)":"var(--accent-blue)",fontWeight:600,marginTop:6}}>{syncStatus}</div>}
src/db.js:19:req.onsuccess=()=>res(req.result);
src/db.js:27:req.onsuccess=()=>res(req.result);
src/db.js:35:req.onsuccess=()=>res();
src/db.js:43:req.onsuccess=()=>res();
src/App.jsx:44:      <div style={{marginBottom:8}}>{recovery.winner!=null?<Trophy size={44} color="var(--text-success)"/>:<RefreshCw size={44} color="var(--accent-blue)"/>}</div>
src/components/SetupScreen.jsx:366:<span style={{color:saveToStats?"var(--text-success)":"rgba(255,255,255,0.5)",fontSize:15,fontWeight:700}}>スタッツ反映</span>
src/components/SetupScreen.jsx:377:<span style={{fontSize:15,fontWeight:700,color:windSensorEnabled?"var(--text-success)":"rgba(255,255,255,0.5)"}}>風速計連携</span>
src/styles.css:15:  --text-success: #22b566;
src/components/StatsModal.jsx:774:const ftColor=game.ft==="50finish"?"var(--text-success)":"var(--text-danger)";
src/components/StatsModal.jsx:799:{game.winnerName&&<div style={{fontSize:isTab?14:12,color:"var(--text-success)",fontWeight:700,marginTop:2}}>{winLabel}: {game.winnerName}</div>}
src/stats.js:115:let success=0,attempts=0;
src/stats.js:130:else{success++;}
src/stats.js:135:return{success,attempts};
src/stats.js:200:records.push({nm,data:{d,de:gameEnd,t:turns.length,s:totalPts,m:misses,f:faults,w:won?1:0,o:ojama.success,oa:ojama.attempts,fa:finA,fs:finS,hs:highScores,rc:rec,br:breakScore,tMin,tMax,tAvg,ft:finishType,sv:scoreValues,fo:isFirstOrder?1:0,tv:turnValues,ap:allPlayerNames,wn:gameWinnerName,wm:gameWinnerMembers,env:env?{fi:env.field||null,rf:env.roof||null,wc:env.weatherCode??null,wl:env.weather||null,tp:env.temp??null,ws:env.windSpeed??null,ln:env.locationName||null,li:env.locationId||null,fn:env.fieldName||null,vt:env.venueType||null}:null}});
```

#### A-2: `grep -rn "#10b981\|#059669\|#d1fae5" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 0 件（ヒットなし）

```
(0 件、該当なし)
```

#### A-3: `grep -rn "#4caf50\|#45a049\|#e8f5e9" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 0 件（ヒットなし）

```
(0 件、該当なし)
```

#### A-4: `grep -rn "#22c55e\|#16a34a" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 2 件

```
src/constants.js:209:  tailwind: "#22c55e", tail_right: "#7dd3fc", right_cross: "#38bdf8", head_right: "#fb923c",
src/components/StatsModal.jsx:200:["#22c55e","#4ade80","#86efac","#16a34a"],
```

### 1.B ブロック B: --danger 系

#### B-1: `grep -rn "danger" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 32 件

```
src/styles.css:13:  --text-danger: #c0392b;
src/styles.css:73:@keyframes mk-danger-flash {
src/components/common.jsx:42:</div>{favs.length>=MAX_FAV&&<div style={{fontSize:12,color:"var(--text-danger)",marginTop:4,textAlign:"center"}}>登録上限({MAX_FAV}人)に達しています</div>}</div>
src/components/common.jsx:45:<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> お気に入り削除</div>
src/components/common.jsx:47:<div style={{display:"flex",gap:8}}><button onClick={()=>{rmF(delConf);setDelConf(null);setDelTarget(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button><button onClick={()=>setDelConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--neutral-200)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
src/components/common.jsx:53:{editName.trim()&&editName.trim()!==editTarget&&favs.includes(editName.trim())&&<div style={{fontSize:13,color:"var(--text-danger)",marginBottom:8}}>この名前は既に登録されています</div>}
src/components/common.jsx:412:if(isP){if((e.type==="miss"||e.type==="fault")&&cf===1)bg="#fff9db";if((e.type==="miss"||e.type==="fault")&&cf>=2)bg="#ffe0e0";if(e.type==="miss"){txt="−";clr="var(--accent-orange)";fw=800;}else if(e.type==="fault"&&e.faultReset){txt=e.consecutiveFails>=MF?"F":"F↓";clr="var(--text-danger)";fw=800;}else if(e.type==="fault"){txt="F";clr="var(--text-danger)";fw=800;}else if(e.reset25){txt=e.score+"↓";clr="#d93a5e";fw=800;}else{txt=e.score;clr=C[o.idx].tx;fw=700;}if(e.consecutiveFails>=MF)txt+="✕";}
src/components/common.jsx:472:<input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={step===2?pin2:pin} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,6);step===2?setPin2(v):setPin(v);setErr("");}} placeholder="●●●●" disabled={isLocked||busy} style={{width:"100%",padding:"16px",border:"2px solid "+(err?"var(--text-danger)":isLocked?"var(--accent-yellow)":"var(--neutral-200)"),borderRadius:12,fontSize:28,fontWeight:700,textAlign:"center",letterSpacing:12,outline:"none",marginBottom:8,opacity:isLocked?0.4:1}}/>
src/components/common.jsx:473:{err&&<div style={{color:"var(--text-danger)",fontSize:14,fontWeight:600,marginBottom:8}}>{err}</div>}
src/components/common.jsx:629:{syncStatus&&<div style={{fontSize:14,color:syncStatus.startsWith("✅")?"var(--text-success)":syncStatus.startsWith("❌")?"var(--text-danger)":"var(--accent-blue)",fontWeight:600,marginTop:6}}>{syncStatus}</div>}
src/components/common.jsx:649:<button onClick={()=>setDelConfirm(loc)} style={{width:32,height:32,border:"none",borderRadius:6,background:"rgba(231,76,60,0.1)",color:"var(--text-danger)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Trash2 size={14}/></button>
src/components/common.jsx:652:{locErr&&<div style={{color:"var(--text-danger)",fontSize:13,fontWeight:600,marginTop:8}}>{locErr}</div>}
src/components/common.jsx:671:{searchErr&&<div style={{fontSize:13,color:"var(--text-danger)",marginBottom:8}}>{searchErr}</div>}
src/components/common.jsx:716:{locErr&&<div style={{color:"var(--text-danger)",fontSize:13,fontWeight:600,marginBottom:8}}>{locErr}</div>}
src/components/common.jsx:731:<button onClick={()=>handleLocDelete(delConfirm.id)} disabled={locBusy} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",opacity:locBusy?0.5:1}}>{locBusy?"削除中...":"削除する"}</button>
src/components/StatsModal.jsx:180::aiError?<span style={{color:"var(--text-danger)"}}>{aiError}</span>
src/components/StatsModal.jsx:774:const ftColor=game.ft==="50finish"?"var(--text-success)":"var(--text-danger)";
src/components/StatsModal.jsx:1148:<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> スタッツを削除しますか？</div>
src/components/StatsModal.jsx:1149:<div style={{display:"flex",gap:8}}><button onClick={()=>setDelStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>する</button><button onClick={()=>setDelStep(0)} style={{flex:1,padding:"12px 0",border:"2px solid var(--neutral-200)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
src/components/StatsModal.jsx:1158:<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:12}}>削除する期間を選択</div>
src/components/StatsModal.jsx:1159:<div style={{display:"flex",flexDirection:"column",gap:6}}>{[["day","今日"],["week","今週"],["month","今月"],["year","今年"],["all","全期間"]].map(([k,l])=>(<button key={k} onClick={()=>doDelete(k)} style={{padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>{l}のデータを削除</button>))}<button onClick={()=>setDelStep(0)} style={{padding:"12px 0",border:"2px solid var(--neutral-200)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
src/components/StatsModal.jsx:1162:<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}><AlertTriangle size={18}/> 試合データを削除
src/components/StatsModal.jsx:1168:<div style={{fontSize:13,color:"var(--text-danger)",marginBottom:16}}>この操作は元に戻せません。参加者全員のスタッツとスコア表データが削除されます。</div>
src/components/StatsModal.jsx:1170:<button onClick={async()=>{await deleteGameByKey(deleteConf.d);setStats({...loadStats()});setDeleteConf(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button>
src/components/GameScreen.jsx:102:<button style={{padding:isNarrow?"10px 0":(isTabletSI?"16px 0":"12px 0"),border:"2px solid #f0b0b0",borderRadius:isNarrow?8:(isTabletSI?12:10),background:"#fde8e8",color:"var(--text-danger)",fontSize:isNarrow?13:(isTabletSI?20:15),fontWeight:900,cursor:"pointer",flexShrink:0}} onPointerDown={doFault}>x フォルト</button>
src/components/GameScreen.jsx:227:<div style={{fontSize:18,fontWeight:800,color:"var(--text-danger)",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><AlertTriangle size={18}/> メンバー削除</div>
src/components/GameScreen.jsx:229:<div style={{display:"flex",gap:8}}><button onClick={()=>{if(delConf.court===1){rmPlayer(delConf.ti,delConf.pi);}else{removeFromPaperCourt(delConf.court,delConf.ti,delConf.pi);setDelConf(null);}}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"var(--text-danger)",color:"var(--text-inverse)",fontSize:16,fontWeight:700,cursor:"pointer"}}>削除する</button><button onClick={()=>setDelConf(null)} style={{flex:1,padding:"12px 0",border:"2px solid var(--neutral-200)",borderRadius:10,background:"transparent",color:"#666",fontSize:16,fontWeight:700,cursor:"pointer"}}>キャンセル</button></div>
src/components/GameScreen.jsx:431:const anim=isShake&&isFlash?"mk-shake 0.5s ease,mk-danger-flash 0.6s ease":isShake?"mk-shake 0.5s ease":isWarn?"mk-warn-pulse 0.5s ease 2":isFlash?"mk-danger-flash 0.6s ease":"none";
src/components/SetupScreen.jsx:424:{!editMode&&team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rP(ti,team.players.length-1)}>− 最後を削除</button>}
src/components/SetupScreen.jsx:440:{!editMode&&team.players.length>1&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>ctRp(activeCourt,ti,team.players.length-1)}>− 最後を削除</button>}
src/components/SetupScreen.jsx:454:{!editMode&&mems.length>2&&<button style={{width:"100%",padding:10,border:"2px dashed #f0b0b0",borderRadius:8,background:"transparent",color:"var(--text-danger)",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}} onClick={()=>rM(mems.length-1)}>− 最後を削除</button>}
src/components/GameResult.jsx:81:<div style={{marginTop:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:15}}><thead><tr style={{background:"var(--bg-secondary)",color:"var(--text-inverse)"}}><th style={{padding:"7px 8px",textAlign:"left"}}>チーム</th><th style={{padding:"7px"}}>最終</th><th style={{padding:"7px"}}>得点計</th><th style={{padding:"7px"}}>ミス</th><th style={{padding:"7px"}}>フォルト</th><th style={{padding:"7px"}}>ターン</th></tr></thead><tbody>{teamStats.map((ts,i)=>(<tr key={i} style={{background:ts.ti===winner?"#fffde6":"#fff",borderBottom:"1px solid var(--neutral-100)"}}><td style={{padding:"7px 8px",fontWeight:700,color:C[ts.ti].tx}}>{ts.ti===winner?<Trophy size={14} style={{display:"inline",verticalAlign:"middle",marginRight:2}}/>:""}{ts.name}</td><td style={{padding:"7px",textAlign:"center",fontWeight:800,color:C[ts.ti].ac}}>{ts.final}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.totalPts}</td><td style={{padding:"7px",textAlign:"center",color:"var(--accent-orange)"}}>{ts.misses}</td><td style={{padding:"7px",textAlign:"center",color:"var(--text-danger)"}}>{ts.faults}</td><td style={{padding:"7px",textAlign:"center"}}>{ts.turns}</td></tr>))}</tbody></table></div>
```

#### B-2: `grep -rn "#ef4444\|#dc2626\|#fee2e2" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 15 件

```
src/windSensor.js:406:    "#ef4444", // 向（赤）
src/constants.js:210:  headwind: "#ef4444", head_left: "#f97316", left_cross: "#38bdf8", tail_left: "#7dd3fc",
src/components/WindMonitorModal.jsx:14:  { angle: 180, text: "向",   color: "#ef4444" },
src/components/WindMonitorModal.jsx:48:  if (pct < 20) return "#ef4444";
src/components/WindMonitorModal.jsx:342:              background: connected ? "#34d399" : "#ef4444",
src/components/WindMonitorModal.jsx:351:              color: connected ? "#34d399" : "#ef4444",
src/components/StatsModal.jsx:116:  const SCORE_COLORS=["#e8e8e8","#dbeafe","#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8","#1e40af","#1e3a8a","#f59e0b","#ef4444"];
src/components/StatsModal.jsx:201:["#ef4444","#f87171","#fca5a5","#dc2626"],
src/components/StatsModal.jsx:455:{popup.isMiss?<span style={{background:"#ef4444",color:"#fff",padding:"1px 8px",borderRadius:5,fontSize:12,fontWeight:700}}>F</span>
src/components/StatsModal.jsx:740:{popup.isMiss?<span style={{background:"#ef4444",color:"#fff",padding:"1px 6px",borderRadius:4,fontSize:12,fontWeight:700}}>F</span>
src/components/GameScreen.jsx:469:{windSensorEnabled&&<span style={{fontSize:isTablet?14:11,fontWeight:700,padding:isTablet?"4px 10px":"2px 6px",borderRadius:6,background:windConnected?"rgba(34,181,102,0.2)":"rgba(239,68,68,0.2)",color:windConnected?"#22b566":"#ef4444",whiteSpace:"nowrap"}}>{windConnected?"風速計OK":"風速計..."}</span>}
src/components/SetupScreen.jsx:402:      <span style={{fontSize:13,color:compassOk?"#333":"#ef4444",fontWeight:700}}>🧭 {compassOk?"OK":"NG"}</span>
src/components/SetupScreen.jsx:408:{windTestStatus==="fail"&&<div style={{marginTop:6,padding:"8px 12px",borderRadius:8,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)"}}><span style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>NG</span><span style={{fontSize:13,color:"#333",marginLeft:8}}>{windTestError}</span></div>}
src/components/CalibrationModal.jsx:318:                border: "2px solid #ef4444",
src/components/CalibrationModal.jsx:323:                color: "#ef4444",
```

#### B-3: `grep -rn "#e74c3c\|#c0392b\|#fadbd8" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 33 件

```
src/styles.css:13:  --text-danger: #c0392b;
src/styles.css:82:  25% { color: #e74c3c; }
src/styles.css:84:  75% { color: #e74c3c; }
src/constants.js:16:export const PC=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c"];
src/components/common.jsx:37:<span onClick={()=>{setDelConf(f);}} style={{padding:"5px 10px",background:"#e74c3c",color:"var(--text-inverse)",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer"}}>削除</span>
src/components/common.jsx:64:export function CSSConfetti(){const colors=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c","#ffd700","#ff69b4"];const pieces=Array.from({length:25},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],size:8+Math.random()*12,shape:Math.random()>0.5?"50%":"0"}));return(<div className="mk-confetti-container">{pieces.map(p=>(<div key={p.id} className="mk-confetti-piece" style={{left:p.left+"%",width:p.size,height:p.size,background:p.color,borderRadius:p.shape,animationDelay:p.delay+"s"}}/>))}</div>);}
src/components/common.jsx:295:<div style={{fontSize:14,fontWeight:700,color:"#1a1a2e"}}>選択中: <span style={{color:"#2b7de9"}}>{selected.size}人</span>{deselected.size>0&&<span style={{color:"#e74c3c",marginLeft:8}}>解除: {deselected.size}人</span>}</div>
src/components/SetupScreen.jsx:351:<button onClick={()=>setCaDiscardStep(1)} style={{flex:"0 0 auto",padding:"10px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄</button>
src/components/SetupScreen.jsx:357:<button onClick={()=>{setDraftRestored(true);if(onClearSetupDraft)onClearSetupDraft();}} style={{flex:"0 0 auto",padding:"12px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄する</button>
src/components/SetupScreen.jsx:418:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:421:{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{rP(ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:434:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:437:{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{ctRp(activeCourt,ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:447:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:24,height:24,borderRadius:12,border:"none",background:"#e74c3c",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:450:{editMode&&isExp&&mems.length>2&&<button onClick={()=>{rM(i);setExpandedDel(null);}} style={{padding:"4px 14px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:455:{!okS&&okSReason&&<div style={{fontSize:13,fontWeight:700,color:"#e74c3c",textAlign:"center",marginBottom:4}}>{okSReason}</div>}
src/components/SetupScreen.jsx:475:<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>現在<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled}人</span>入力済みですが、変更後の上限は<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.newMax}人</span>です。超過分の<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>が末尾から削除されます。続けますか？</div>
src/components/SetupScreen.jsx:477:<button onClick={()=>setTrimConfirm(p=>({...p,step:2}))} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/SetupScreen.jsx:482:<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>この操作は取り消せません。<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>のメンバーが削除されます。</div>
src/components/SetupScreen.jsx:484:<button onClick={trimDialogExec} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>変更する</button>
src/components/SetupScreen.jsx:494:<button onClick={()=>setCaDiscardStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/SetupScreen.jsx:500:<button onClick={()=>{setCaDiscardStep(0);if(onClearCourtAllocation)onClearCourtAllocation();}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
src/components/GameScreen.jsx:84:<div style={{display:"flex",gap:isTabletSI?6:3,alignItems:"center",marginTop:isTabletSI?6:2}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:isTabletSI?30:(isNarrow?10:13),height:isTabletSI?30:(isNarrow?10:13),borderRadius:"50%",display:"inline-block",background:j<fails?"#e74c3c":"#ddd"}}/>))}</div>
src/components/GameScreen.jsx:192:<button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"var(--text-inverse)"}}>{p.active?"退出":"復帰"}</button>
src/components/GameScreen.jsx:427:const MissDots=({f,size})=>{const s=size||8;return(<div style={{display:"flex",gap:2,alignItems:"center"}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:s,height:s,borderRadius:"50%",display:"inline-block",background:j<f?(f>=2?"#c0392b":"#e6a817"):"rgba(120,120,120,0.25)",border:j>=f?"1px solid rgba(120,120,120,0.3)":"none"}}/>))}</div>);};
src/components/GameScreen.jsx:439:<span style={{fontSize:isTablet?38:20,fontWeight:900,color:isReset?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",lineHeight:1,flexShrink:0,animation:scAnim}}>{sc}<span style={{fontSize:isTablet?20:11,fontWeight:700}}>点</span></span>
src/components/GameScreen.jsx:457:<span style={{fontSize:isTablet?24:13,fontWeight:900,color:isReset2?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",flexShrink:0,animation:scAnim2}}>{sc}</span>
src/components/GameScreen.jsx:501:<button onClick={()=>setCaKeepDiscard(1)} style={{padding:"14px 0",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:15,fontWeight:800,cursor:"pointer"}}>コート割り当ても破棄する</button>
src/components/GameScreen.jsx:507:<button onClick={()=>setCaKeepDiscard(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/GameScreen.jsx:513:<button onClick={()=>{setCaKeepDialog(false);setCaKeepDiscard(0);if(clearCourtAllocation)clearCourtAllocation();setShowRes(false);goBack(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
src/components/GameResult.jsx:29:ordered.forEach(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);o.ap.forEach((p,pi)=>{const isP=e&&e.playerIndex===pi;let txt="";if(isP){if(e.type==="miss")txt="−";else if(e.type==="fault")txt=(e.faultReset&&!(e.consecutiveFails>=MF))?"F↓":"F";else txt=e.reset25?e.score+"↓":""+e.score;if(e.consecutiveFails>=MF)txt+="✕";}ctx.fillStyle=isP?(e.type==="miss"?"#bf6900":e.type==="fault"?"#c0392b":C[o.idx].tx):"#333";ctx.font=(isP?"bold ":"")+"13px sans-serif";ctx.fillText(txt,cx+CW/2,y+23);cx+=CW;});ctx.fillStyle=e?C[o.idx].tx:"#ccc";ctx.font="bold 14px sans-serif";const totalV=e?(dqWinLastTurn!=null&&o.idx===winner&&turn===dqWinLastTurn?50:e.runningTotal):"";ctx.fillText(""+totalV,cx+CW/2,y+23);cx+=CW;});y+=RH;}
src/components/StatsModal.jsx:804:{isAdmin&&onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(game.d,game);}} style={{padding:"6px 10px",border:"1px solid #e74c3c",borderRadius:8,background:"#fef2f2",color:"#e74c3c",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><Trash2 size={14}/></button>}
```

### 1.C ブロック C: --accent-red 統一

#### C-1: `grep -rn "accent-red" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 1 件

```
src/styles.css:17:  --accent-red: #d93a5e;
```

#### C-2: `grep -rn "#d93a5e" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 6 件

```
src/styles.css:17:  --accent-red: #d93a5e;
src/constants.js:12:{bg:"#6b1d30",lt:"#fbe6ec",ac:"#d93a5e",tx:"#6b1d30",nm:"#ffc8d6"},
src/constants.js:16:export const PC=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c"];
src/components/StatsModal.jsx:90:{dayNames.map((dn,i)=>(<div key={dn} style={{textAlign:"center",fontSize:13,fontWeight:700,color:i===0?"#d93a5e":i===6?"var(--accent-blue)":"var(--text-secondary)",padding:"4px 0"}}>{dn}</div>))}
src/components/common.jsx:64:export function CSSConfetti(){const colors=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c","#ffd700","#ff69b4"];const pieces=Array.from({length:25},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],size:8+Math.random()*12,shape:Math.random()>0.5?"50%":"0"}));return(<div className="mk-confetti-container">{pieces.map(p=>(<div key={p.id} className="mk-confetti-piece" style={{left:p.left+"%",width:p.size,height:p.size,background:p.color,borderRadius:p.shape,animationDelay:p.delay+"s"}}/>))}</div>);}
src/components/common.jsx:412:if(isP){if((e.type==="miss"||e.type==="fault")&&cf===1)bg="#fff9db";if((e.type==="miss"||e.type==="fault")&&cf>=2)bg="#ffe0e0";if(e.type==="miss"){txt="−";clr="var(--accent-orange)";fw=800;}else if(e.type==="fault"&&e.faultReset){txt=e.consecutiveFails>=MF?"F":"F↓";clr="var(--text-danger)";fw=800;}else if(e.reset25){txt=e.score+"↓";clr="#d93a5e";fw=800;}else{txt=e.score;clr=C[o.idx].tx;fw=700;}if(e.consecutiveFails>=MF)txt+="✕";}
```

#### C-3: `grep -rn "#e74c3c" src/ --include="*.jsx" --include="*.css" --include="*.js"`

**ヒット件数**: 29 件

```
src/styles.css:82:  25% { color: #e74c3c; }
src/styles.css:84:  75% { color: #e74c3c; }
src/constants.js:16:export const PC=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c"];
src/components/SetupScreen.jsx:351:<button onClick={()=>setCaDiscardStep(1)} style={{flex:"0 0 auto",padding:"10px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄</button>
src/components/SetupScreen.jsx:357:<button onClick={()=>{setDraftRestored(true);if(onClearSetupDraft)onClearSetupDraft();}} style={{flex:"0 0 auto",padding:"12px 16px",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:14,fontWeight:700,cursor:"pointer"}}>{"🗑"} 破棄する</button>
src/components/SetupScreen.jsx:418:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:421:{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{rP(ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:434:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:26,height:26,borderRadius:13,border:"none",background:"#e74c3c",color:"#fff",fontSize:18,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:437:{editMode&&isExp&&team.players.length>1&&<button onClick={()=>{ctRp(activeCourt,ti,pi);setExpandedDel(null);}} style={{padding:"6px 16px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:447:{editMode&&<button onClick={()=>setExpandedDel(isExp?null:delKey)} style={{width:24,height:24,borderRadius:12,border:"none",background:"#e74c3c",color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0}}>{"−"}</button>}
src/components/SetupScreen.jsx:450:{editMode&&isExp&&mems.length>2&&<button onClick={()=>{rM(i);setExpandedDel(null);}} style={{padding:"4px 14px",border:"none",borderRadius:8,background:"#e74c3c",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>削除</button>}
src/components/SetupScreen.jsx:455:{!okS&&okSReason&&<div style={{fontSize:13,fontWeight:700,color:"#e74c3c",textAlign:"center",marginBottom:4}}>{okSReason}</div>}
src/components/SetupScreen.jsx:475:<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>現在<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled}人</span>入力済みですが、変更後の上限は<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.newMax}人</span>です。超過分の<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>が末尾から削除されます。続けますか？</div>
src/components/SetupScreen.jsx:477:<button onClick={()=>setTrimConfirm(p=>({...p,step:2}))} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/SetupScreen.jsx:482:<div style={{fontSize:14,color:"rgba(255,255,255,0.7)",marginBottom:16,lineHeight:1.6}}>この操作は取り消せません。<span style={{color:"#e74c3c",fontWeight:800}}>{trimConfirm.filled-trimConfirm.newMax}人</span>のメンバーが削除されます。</div>
src/components/SetupScreen.jsx:484:<button onClick={trimDialogExec} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>変更する</button>
src/components/SetupScreen.jsx:494:<button onClick={()=>setCaDiscardStep(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/SetupScreen.jsx:500:<button onClick={()=>{setCaDiscardStep(0);if(onClearCourtAllocation)onClearCourtAllocation();}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
src/components/GameScreen.jsx:84:<div style={{display:"flex",gap:isTabletSI?6:3,alignItems:"center",marginTop:isTabletSI?6:2}}>{Array.from({length:MF},(_,j)=>(<span key={j} style={{width:isTabletSI?30:(isNarrow?10:13),height:isTabletSI?30:(isNarrow?10:13),borderRadius:"50%",display:"inline-block",background:j<fails?"#e74c3c":"#ddd"}}/>))}</div>
src/components/GameScreen.jsx:192:<button onClick={()=>tog(ti,pi,!p.active)} style={{padding:"6px 14px",border:"none",borderRadius:6,fontSize:14,fontWeight:700,cursor:"pointer",background:p.active?"#e74c3c":"#27ae60",color:"var(--text-inverse)"}}>{p.active?"退出":"復帰"}</button>
src/components/GameScreen.jsx:439:<span style={{fontSize:isTablet?38:20,fontWeight:900,color:isReset?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",lineHeight:1,flexShrink:0,animation:scAnim}}>{sc}<span style={{fontSize:isTablet?20:11,fontWeight:700}}>点</span></span>
src/components/GameScreen.jsx:457:<span style={{fontSize:isTablet?24:13,fontWeight:900,color:isReset2?"#e74c3c":"#fff",fontVariantNumeric:"tabular-nums",flexShrink:0,animation:scAnim2}}>{sc}</span>
src/components/GameScreen.jsx:501:<button onClick={()=>setCaKeepDiscard(1)} style={{padding:"14px 0",border:"2px solid rgba(231,76,60,0.4)",borderRadius:10,background:"rgba(231,76,60,0.1)",color:"#e74c3c",fontSize:15,fontWeight:800,cursor:"pointer"}}>コート割り当ても破棄する</button>
src/components/GameScreen.jsx:507:<button onClick={()=>setCaKeepDiscard(2)} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>はい</button>
src/components/GameScreen.jsx:513:<button onClick={()=>{setCaKeepDialog(false);setCaKeepDiscard(0);if(clearCourtAllocation)clearCourtAllocation();setShowRes(false);goBack(null);}} style={{flex:1,padding:"12px 0",border:"none",borderRadius:10,background:"#e74c3c",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>破棄する</button>
src/components/StatsModal.jsx:804:{isAdmin&&onDelete&&<button onClick={e=>{e.stopPropagation();onDelete(game.d,game);}} style={{padding:"6px 10px",border:"1px solid #e74c3c",borderRadius:8,background:"#fef2f2",color:"#e74c3c",fontSize:isTab?14:12,fontWeight:700,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}><Trash2 size={14}/></button>}
src/components/common.jsx:37:<span onClick={()=>{setDelConf(f);}} style={{padding:"5px 10px",background:"#e74c3c",color:"var(--text-inverse)",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer"}}>削除</span>
src/components/common.jsx:64:export function CSSConfetti(){const colors=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c","#ffd700","#ff69b4"];const pieces=Array.from({length:25},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],size:8+Math.random()*12,shape:Math.random()>0.5?"50%":"0"}));return(<div className="mk-confetti-container">{pieces.map(p=>(<div key={p.id} className="mk-confetti-piece" style={{left:p.left+"%",width:p.size,height:p.size,background:p.color,borderRadius:p.shape,animationDelay:p.delay+"s"}}/>))}</div>);}
src/components/common.jsx:295:<div style={{fontSize:14,fontWeight:700,color:"#1a1a2e"}}>選択中: <span style={{color:"#2b7de9"}}>{selected.size}人</span>{deselected.size>0&&<span style={{color:"#e74c3c",marginLeft:8}}>解除: {deselected.size}人</span>}</div>
```

---

## 2. DESIGN.md §2.4 Semantic Colors 原文抽出

**ファイルパス**: DESIGN.md
**抽出範囲**: 行 133 〜 行 158
**§2.4 の直後セクション**: §2.5 Wind Sensor Colors（独立カテゴリ）（開始行 159）。境界判断根拠は `grep -n "^### 2\.[0-9]|^## 2\.|^## 3\." DESIGN.md` の結果で §2.4 = 行 133、§2.5 = 行 159 を確認。§2.4 の末尾は §2.5 の 1 行前 = 行 158。

```markdown
133: ### 2.4 Semantic Colors
134: 
135: 状態表現専用。汎用装飾・強調目的での使用は禁止（色の役割分離原則）。
136: 
137: | トークン | 値 | 主な用途 |
138: |---|---|---|
139: | `--success` | `#22b566` | 成功状態、ONトグル、完了バッジ |
140: | `--success-dark` | `#1a9d52` | 成功hover、濃色文字 |
141: | `--success-bg` | `#e6faf0` | 成功薄背景、通知背景 |
142: | `--warning` | `#e6a817` | 警告、注意、お気に入り星 |
143: | `--warning-dark` | `#bf6900` | 警告文字、強調 |
144: | `--warning-bg` | `#fff3e0` | 警告薄背景 |
145: | `--danger` | `#e74c3c` | エラー、削除、ミス列、NGバッジ |
146: | `--danger-dark` | `#c0392b` | エラー文字、hover |
147: | `--danger-bg` | `#fde8e8` | エラー薄背景、NGバッジ背景 |
148: | `--gold` | `#ffd700` | 上がり得点（11・12点）強調、勝利演出 |
149: 
150: **既存エイリアス変更（Step 4 第2弾以降で実施予定）**:
151: - `--accent-red` の定義値を `#d93a5e` → `#e74c3c` に変更（`--danger` と統一）
152: 
153: **注意**: Step 4 第1弾では実コードの定義値変更は行わない。視覚変化を伴う変更のため、別途モックアップ検証を経て第2弾以降で適用する。現状値と理想値の差分は §2.10.2 および §2.10.3 を参照。
154: 
155: **背景系独立トークン（Neutral Scale 外・Step 4 第2弾B で継続判断）**:
156: 
157: - `--bg-surface-alt` (`#f0f3f8`): 全画面モーダル下地（主用途、`GameResult` / `StatsModal` ルート）、および特定テーブルヘッダー背景（例外用途、`StatsModal` 詳細指標テーブルヘッダー行）。青寄りの値で Neutral Scale にマップ不可のため独立継続とする。
158: 
```

---

## 3. 補足情報・気づき

- Claude Code の Grep ツールは長い行に対して `[Omitted long matching line]` と表示することがあり、以下の行については Read ツールで個別に原文を取得して差し込んだ:
  - src/stats.js:200 (A-1)
  - src/components/common.jsx:47, 64, 412, 472 (B-1 / B-3 / C-2 / C-3 のいずれかに該当)
  - src/components/StatsModal.jsx:1159 (B-1)
  - src/components/GameScreen.jsx:229 (B-1)
  - src/components/GameResult.jsx:29, 81 (B-3 / B-1 に該当)
- ファイルパスは実行環境の都合で `C:\Users\USER\molkky-scorer\` プレフィックスが付いた形で Grep から返ったが、指示書記載の `grep -rn` 出力形式に合わせ、本結果ファイルでは `src/` からの相対パスに統一し、Windows バックスラッシュを Unix スラッシュに正規化した。
- ブロック B の B-3 (`#e74c3c|#c0392b|#fadbd8`) と ブロック C の C-3 (`#e74c3c` のみ) は検索対象のパターン範囲が異なる（B-3 は `#c0392b` と `#fadbd8` を含む）。したがって B-3 は 33 件、C-3 は 29 件で差分は 4 件（`#c0392b` 関連: styles.css:13、GameScreen.jsx:427、GameResult.jsx:29、および `#fadbd8` 関連 0 件）。指示書の注記通り、両ブロックの結果をそれぞれ省略なく記録した。
- `#fadbd8` は B-3 クエリに含まれるが、ヒットした行は 0 行（src 配下に該当なし）。
- DESIGN.md は現状プロジェクトルート直下に配置されており、`find` による追加探索は不要だった。
- `src/components/WindMonitorModal.jsx` は B-2 で 4 件ヒットしたが、Wind Sensor 専用のため DESIGN.md §2.5 管轄領域。ブロック B の集計には含める。

---

## 4. ファイル作成完了チェック

- [x] 作業 1: grep クエリ 11 件すべて実行・結果記録完了
- [x] 作業 2: DESIGN.md §2.4 抽出完了
- [x] 作業 3: 本ファイル作成完了
- [x] Unicode エスケープなし、日本語直書きで記述
- [x] 省略・要約・分析・判断を含んでいない

以上
