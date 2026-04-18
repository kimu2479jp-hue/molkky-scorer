# Step 4 第2弾B 事前確認レポート v1

**作成日**: 2026-04-17
**調査対象コミット**: 782a8fc9a61bf...（`git rev-parse HEAD` の結果: `782a8fc`、main）
**調査実行者**: Claude Code

---

## 1. 変数使用箇所 grep 調査結果

### 1.1 --border-lighter

- 定義箇所: `src/styles.css:22` 定義値 `#eee`
- 使用箇所総数: 9 件（4 ファイル）
- 使用箇所一覧:

  | # | file:line | 文脈要約 |
  |---|---|---|
  | 1 | `src/components/common.jsx:35` | お気に入りリストの行間 `borderBottom`（FavoriteModal 各項目の区切り線） |
  | 2 | `src/components/common.jsx:39` | FavoriteModal フッター上端の `borderTop`（操作ボタン群との区切り） |
  | 3 | `src/components/common.jsx:401` | ScoreTable 空状態 `<td>` の下線（「スコアを入力してください」行の `borderBottom`） |
  | 4 | `src/components/common.jsx:411` | ScoreTable 各セル `borderLeft` のフォールバック（プレイヤー列の非先頭側、pi!==0 時） |
  | 5 | `src/components/GameResult.jsx:80` | GameResult サマリーテーブル各行の `borderBottom`（チーム行区切り） |
  | 6 | `src/components/GameResult.jsx:81` | GameResult コメント欄上端の `borderTop` |
  | 7 | `src/components/GameScreen.jsx:261` | OrderPicker 表示リスト行の `borderBottom`（i<disp.length-1 時の区切り線） |
  | 8 | `src/components/StatsModal.jsx:1112` | Summary テーブル `<tr>` の `borderBottom`（プレイヤー毎の区切り） |
  | 9 | `src/components/StatsModal.jsx:1120` | 詳細指標テーブル `<tr>` の `borderBottom`（指標行毎の区切り） |

- 用途カテゴリ: **薄い水平区切り線（リスト項目・テーブル行・パネル上下端の divider）** に統一

### 1.2 --border-input

- 定義箇所: `src/styles.css:23` 定義値 `#ddd`
- 使用箇所総数: 68 件（5 ファイル）
- 使用箇所一覧（file:line、文脈カテゴリ）:

  | # | file:line | 文脈要約 |
  |---|---|---|
  | 1 | `src/components/common.jsx:19` | 3 ボタン並び Third ボタンの `border`（キャンセル系） |
  | 2 | `src/components/common.jsx:40` | お気に入り新規追加 `<input>` の `border` |
  | 3 | `src/components/common.jsx:47` | お気に入り削除確認のキャンセルボタン `border` |
  | 4 | `src/components/common.jsx:52` | お気に入り名編集 `<input>` の `border` |
  | 5 | `src/components/common.jsx:56` | 編集ダイアログのキャンセルボタン `border` |
  | 6 | `src/components/common.jsx:405` | ScoreTable Round 番号セルの `borderBottom` |
  | 7 | `src/components/common.jsx:411` | ScoreTable 各プレイヤーセルの `borderBottom` |
  | 8 | `src/components/common.jsx:414` | ScoreTable チーム合計セル（右端）の `borderBottom` |
  | 9 | `src/components/common.jsx:470` | AdminPIN 入力 `<input>` の通常時 `border`（エラー/ロック時は他色） |
  | 10 | `src/components/common.jsx:475` | AdminPIN ダイアログのキャンセルボタン `border` |
  | 11 | `src/components/common.jsx:607` | 同期コード入力 `<input>` の `border` |
  | 12 | `src/components/common.jsx:621` | 同期コード設定済み表示 `<div>` の `border`（マスク表示枠） |
  | 13 | `src/components/common.jsx:624` | 手動アップロードボタン `border` |
  | 14 | `src/components/common.jsx:665` | 場所検索 `<input>` の `border`（「公園名で検索...」） |
  | 15 | `src/components/common.jsx:677` | 「手動で入力する」ボタン `border` |
  | 16 | `src/components/common.jsx:683` | 場所名入力 `<input>` の `border` |
  | 17 | `src/components/common.jsx:687` | サブ名入力 `<input>` の `border` |
  | 18 | `src/components/common.jsx:706` | 緯度入力 `<input>` の `border` |
  | 19 | `src/components/common.jsx:710` | 経度入力 `<input>` の `border` |
  | 20 | `src/components/common.jsx:716` | 場所登録フロー「戻る」ボタン `border` |
  | 21 | `src/components/common.jsx:718` | 場所編集「キャンセル」ボタン `border` |
  | 22 | `src/components/common.jsx:730` | 場所削除確認「キャンセル」ボタン `border` |
  | 23 | `src/components/GameResult.jsx:77` | スコア表カード `border`（「スコア表」セクション枠） |
  | 24 | `src/components/GameResult.jsx:83` | コメント追加 `<input>` の `border` |
  | 25 | `src/components/GameResult.jsx:84` | 次ゲーム投げ順カード `border` |
  | 26 | `src/components/GameScreen.jsx:86` | チーム折りたたみトグルボタン `border`（▼） |
  | 27 | `src/components/GameScreen.jsx:96` | UNDO「戻る」ボタン `border` |
  | 28 | `src/components/GameScreen.jsx:213` | AddTeamModal チーム選択 `<select>` の `border` |
  | 29 | `src/components/GameScreen.jsx:214` | AddTeamModal 名前入力 `<input>` の `border` |
  | 30 | `src/components/GameScreen.jsx:229` | メンバー削除確認「キャンセル」ボタン `border` |
  | 31 | `src/components/GameScreen.jsx:259` | OrderPicker 5 モード切替ボタン `border`（非選択時） |
  | 32 | `src/components/GameScreen.jsx:261` | OrderPicker 手動並び替え「▲」ボタン `border` |
  | 33 | `src/components/SetupScreen.jsx:338` | TIN 共通スタイルの `borderBottom`（プレイヤー名インライン入力） |
  | 34 | `src/components/SetupScreen.jsx:384` | 風速計 Pi アドレス `<input>` の `border` |
  | 35 | `src/components/SetupScreen.jsx:423` | 「＋ 追加」ダッシュボタン（通常コート）`border: 2px dashed` |
  | 36 | `src/components/SetupScreen.jsx:439` | 「＋ 追加」ダッシュボタン（アクティブコート）`border: 2px dashed` |
  | 37 | `src/components/SetupScreen.jsx:452` | 「＋」シャッフル追加ダッシュボタン `border: 2px dashed` |
  | 38 | `src/components/StatsModal.jsx:79` | カレンダーカード `border` |
  | 39 | `src/components/StatsModal.jsx:81` | 月「‹」ボタン `border` |
  | 40 | `src/components/StatsModal.jsx:86` | 月「›」ボタン `border` |
  | 41 | `src/components/StatsModal.jsx:88` | 年選択ボタン `border`（非選択年） |
  | 42 | `src/components/StatsModal.jsx:111` | `hasSV` false 時のプレースホルダカード `border` |
  | 43 | `src/components/StatsModal.jsx:118` | AI 分析セクションカード `border` |
  | 44 | `src/components/StatsModal.jsx:186` | 「再分析」ボタン `border` |
  | 45 | `src/components/StatsModal.jsx:332` | KPI カード（4 指標タイル）`border`（累計） |
  | 46 | `src/components/StatsModal.jsx:339` | テーブル外枠 `border`（スクロールコンテナ枠） |
  | 47 | `src/components/StatsModal.jsx:532` | KPI カード（4 指標タイル）`border`（試合別） |
  | 48 | `src/components/StatsModal.jsx:826` | レーダーチャート用カード `border` |
  | 49 | `src/components/StatsModal.jsx:994` | viewMode 切替ボタン `border`（累計/この試合、非選択） |
  | 50 | `src/components/StatsModal.jsx:998` | タブバー `borderBottom`（カレンダー/直近/累計） |
  | 51 | `src/components/StatsModal.jsx:1008` | 期間切替ボタン `border`（非選択） |
  | 52 | `src/components/StatsModal.jsx:1015` | CalMode 切替ボタン `border`（単一/範囲、非選択） |
  | 53 | `src/components/StatsModal.jsx:1023` | 「全解除」ボタン `border`（カレンダータブ） |
  | 54 | `src/components/StatsModal.jsx:1029` | カレンダータブページネーションボタン `border`（非選択） |
  | 55 | `src/components/StatsModal.jsx:1040` | 「全解除」ボタン `border`（直近タブ） |
  | 56 | `src/components/StatsModal.jsx:1059` | 直近タブページネーションボタン `border`（非選択） |
  | 57 | `src/components/StatsModal.jsx:1063` | SetupScreen からのプレイヤー選択カード外枠 `border` |
  | 58 | `src/components/StatsModal.jsx:1066` | 「全解除」ボタン `border`（プレイヤー選択） |
  | 59 | `src/components/StatsModal.jsx:1068` | プレイヤー選択タイル `border`（非選択、setup ルート） |
  | 60 | `src/components/StatsModal.jsx:1072` | プレイヤー選択ピル `border`（非選択、非 setup ルート） |
  | 61 | `src/components/StatsModal.jsx:1105` | （前後から推測）メインカード `border` |
  | 62 | `src/components/StatsModal.jsx:1110` | Summary テーブルカード `border` |
  | 63 | `src/components/StatsModal.jsx:1117` | 詳細指標テーブルカード `border` |
  | 64 | `src/components/StatsModal.jsx:1123` | ターン別パフォーマンスカード `border` |
  | 65 | `src/components/StatsModal.jsx:1149` | スタッツ削除確認「キャンセル」ボタン `border` |
  | 66 | `src/components/StatsModal.jsx:1154` | 非管理者モーダル「閉じる」ボタン `border` |
  | 67 | `src/components/StatsModal.jsx:1159` | 期間別削除「キャンセル」ボタン `border` |
  | 68 | `src/components/StatsModal.jsx:1171` | 試合データ削除「キャンセル」ボタン `border` |

- 用途カテゴリ: **(a) 入力系（`<input>`, `<select>`）の枠線**、**(b) セカンダリ/キャンセル系ボタンの枠線**、**(c) 情報カード外枠**、**(d) セグメント/タブの非選択状態**、**(e) ページネーションボタンの非選択状態**、**(f) テーブルセル水平罫線**、**(g) ダッシュボタン（2px dashed）** の 7 系統。使用頻度が最も高く、UI 全体の「静的な枠線色」の実質的な標準トークン。

### 1.3 --bg-surface-alt

- 定義箇所: `src/styles.css:6` 定義値 `#f0f3f8`
- 使用箇所総数: 3 件（2 ファイル）
- 使用箇所一覧:

  | # | file:line | 文脈要約 |
  |---|---|---|
  | 1 | `src/components/GameResult.jsx:68` | GameResult ルートコンテナ全画面 `background`（`mk-slide-up` で表示される結果画面の下地） |
  | 2 | `src/components/StatsModal.jsx:985` | StatsModal ルートコンテナ全画面 `background`（`mk-fade-scale-in` で表示されるスタッツモーダルの下地） |
  | 3 | `src/components/StatsModal.jsx:1119` | 詳細指標テーブルのヘッダー行 `<tr>` `background`（「指標」列ヘッダー行） |

- 用途カテゴリ: **(a) 全画面モーダル/画面遷移の最下層背景**（2 件）、**(b) テーブルヘッダー行の薄背景**（1 件）の 2 系統。

### 1.4 --text-warning

- 定義箇所: `src/styles.css:14` 定義値 `#e67700`
- 使用箇所総数: 1 件（1 ファイル）
- 使用箇所一覧:

  | # | file:line | 文脈要約 |
  |---|---|---|
  | 1 | `src/components/GameScreen.jsx:88` | アクティブチームヘッダー内の `<AlertTriangle/> フォルト=25点` 警告ラベルの `color`（スコア >= PEN 時の表示） |

- 用途カテゴリ: **ペナルティ警告テキストの色** として 1 箇所のみ使用。極めて限定的。

---

## 2. hex #ffd700 直書き箇所

### 2.1 src/components/GameResult.jsx:26

```jsx
20	const c=document.createElement("canvas");c.width=totalW*2;c.height=totalH*2;
21	const ctx=c.getContext("2d");ctx.scale(2,2);ctx.fillStyle="#fff";ctx.fillRect(0,0,totalW,totalH);
22	ctx.fillStyle="#14365a";ctx.font="bold 20px sans-serif";ctx.textAlign="center";ctx.fillText("Game "+gameNumber+" スコア表",totalW/2,PAD+24);
23	let y=PAD+36+10,x=PAD;ctx.fillStyle="#14365a";ctx.fillRect(x,y,RW,HDR);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText("R",x+RW/2,y+20);let cx=x+RW;
24	ordered.forEach(o=>{const w=(o.ap.length+1)*CW;ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,w,HDR);ctx.fillStyle="#fff";ctx.font="bold 13px sans-serif";ctx.fillText(o.team.name,cx+w/2,y+20);cx+=w;});y+=HDR;
25	ctx.fillStyle="#1e4a72";ctx.fillRect(x,y,RW,NMH);cx=x+RW;
26	ordered.forEach(o=>{o.ap.forEach(p=>{ctx.fillStyle=C[o.idx].bg;ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle=C[o.idx].nm;ctx.font="bold 13px sans-serif";ctx.textAlign="center";p.name.slice(0,MAX_NAME).split("").forEach((ch,ci)=>{ctx.fillText(ch,cx+CW/2,y+16+ci*13);});cx+=CW;});ctx.fillStyle="#0d2a48";ctx.fillRect(cx,y,CW,NMH);ctx.fillStyle="#ffd700";ctx.font="bold 13px sans-serif";ctx.fillText("計",cx+CW/2,y+16);cx+=CW;});y+=NMH;
27	for(let turn=1;turn<=Math.max(maxT,1);turn++){ctx.fillStyle=turn%2===0?"#f8f9fb":"#fff";ctx.fillRect(x,y,totalW-PAD*2,RH);ctx.strokeStyle="#ddd";ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(x,y+RH);ctx.lineTo(x+totalW-PAD*2,y+RH);ctx.stroke();ctx.fillStyle="#666";ctx.font="bold 13px sans-serif";ctx.textAlign="center";ctx.fillText(""+turn,x+RW/2,y+23);cx=x+RW;
28	ordered.forEach(o=>{const e=history.find(h=>h.turn===turn&&h.teamIndex===o.idx);o.ap.forEach((p,pi)=>{const isP=e&&e.playerIndex===pi;let txt="";if(isP){if(e.type==="miss")txt="−";else if(e.type==="fault")txt=(e.faultReset&&!(e.consecutiveFails>=MF))?"F↓":"F";else txt=e.reset25?e.score+"↓":""+e.score;if(e.consecutiveFails>=MF)txt+="✕";}ctx.fillStyle=isP?(e.type==="miss"?"#bf6900":e.type==="fault"?"#c0392b":C[o.idx].tx):"#333";ctx.font=(isP?"bold ":"")+"13px sans-serif";ctx.fillText(txt,cx+CW/2,y+23);cx+=CW;});ctx.fillStyle=e?C[o.idx].tx:"#ccc";ctx.font="bold 14px sans-serif";const totalV=e?(dqWinLastTurn!=null&&o.idx===winner&&turn===dqWinLastTurn?50:e.runningTotal):"";ctx.fillText(""+totalV,cx+CW/2,y+23);cx+=CW;});y+=RH;}
29	if(comments.length>0){y+=10;ctx.fillStyle="#14365a";ctx.font="bold 15px sans-serif";ctx.textAlign="left";ctx.fillText("💬 メモ",x,y+18);y+=30;comments.forEach(c2=>{ctx.fillStyle="#444";ctx.font="14px sans-serif";ctx.fillText("• "+c2,x+6,y+16);y+=26;});}
30	return c;
```

用途: Canvas 画像エクスポート（画像としてスコア表を保存する機能）内、各チーム行右端の「計」欄の文字色として `#ffd700`（金色）を直書き。直前で `ctx.fillStyle="#0d2a48"` （濃紺）で矩形塗りした上に金色文字を載せる構造。**近傍の他 hex 直書き**: `#fff`（L21, L24, L29）、`#14365a`（L22, L23, L29）、`#1e4a72`（L25）、`#0d2a48`（L26）、`#f8f9fb`（L27）、`#ddd`（L27）、`#666`（L27）、`#bf6900`（L28）、`#c0392b`（L28）、`#333`（L28）、`#ccc`（L28）、`#444`（L29）。Canvas API は CSS 変数を直接使えないため、この関数群は全体として hex 直書き構成。

### 2.2 src/components/common.jsx:63

```jsx
58	</div></div>}
59	
60	  </div>);
61	}
62	
63	export function CSSConfetti(){const colors=["#2b7de9","#d93a5e","#22b566","#d9a83a","#9b59b6","#e67e22","#1abc9c","#e74c3c","#ffd700","#ff69b4"];const pieces=Array.from({length:25},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,color:colors[i%colors.length],size:8+Math.random()*12,shape:Math.random()>0.5?"50%":"0"}));return(<div className="mk-confetti-container">{pieces.map(p=>(<div key={p.id} className="mk-confetti-piece" style={{left:p.left+"%",width:p.size,height:p.size,background:p.color,borderRadius:p.shape,animationDelay:p.delay+"s"}}/>))}</div>);}
64	
65	/* ═══ Shuffle Card Animation ═══ */
66	export function ShuffleAnimation({names,teams,onDone,skipIntro,remainingDeck,isLastCourt,courtLabel,isMultiCourt,onSkipThisCourt,onSkipAll,onStartGame,onReshuffle}){
67	const nCards=names.length;const nTeams=teams.length;
68	const shufDur=nCards<=4?2:nCards<=6?3:nCards<=8?3.5:4;
69	const perCard=2.8;const dealDur=nCards*perCard;
70	const SUITS=["#2660","#2665","#2666","#2663"].map(x=>String.fromCharCode(parseInt(x.slice(1),16))); // (直後の SUITS 配列は参考)
```

用途: `CSSConfetti` コンポーネント内の紙吹雪色 10 色配列の第 9 要素（index 8）。10 色は `#2b7de9, #d93a5e, #22b566, #d9a83a, #9b59b6, #e67e22, #1abc9c, #e74c3c, #ffd700, #ff69b4` で、各紙吹雪ピースにラウンドロビンで割り当てられる。**近傍の他 hex 直書き**: 同配列内の 9 色すべて（ブランドブルー、アクセントレッド、グリーン、アンバー、パープル、オレンジ、ターコイズ、赤、マゼンタ）。

### 2.3 src/components/common.jsx:268

```jsx
263	const[deselected,setDeselected]=useState(()=>new Set());
264	const showDevMaster=(()=>{try{if(localStorage.getItem("mk-dev-master")==="1")return true;const params=new URLSearchParams(window.location.search);if(params.get("dev")==="1")return true;return false;}catch(e){return false;}})();
265	const classify=(name)=>{if(showDevMaster&&DEV_MASTER_LIST.includes(name))return"master";if(!showDevMaster&&DEV_MASTER_LIST.includes(name))return"regular";const gs=stats[name]||[];const gc=gs.length;if(gc===0)return"never";const lastDate=gs.reduce((lat,g)=>{const d=new Date(g.d);return d>lat?d:lat;},new Date(0));const days=Math.floor((new Date()-lastDate)/(1000*60*60*24));if(days<=14&&gc>=5)return"regular";if(days<=30&&gc>=2)return"semi";return"occasional";};
266	const grouped={};favs.forEach(name=>{const g=classify(name);if(!grouped[g])grouped[g]=[];const gs=stats[name]||[];grouped[g].push({name,gameCount:gs.length});});
267	Object.values(grouped).forEach(arr=>arr.sort((a,b)=>b.gameCount-a.gameCount));
268	const GC=[{key:"master",label:"master",color:"#1a1a2e",accent:"#ffd700",show:showDevMaster},{key:"regular",label:"常連",color:"#22b566"},{key:"semi",label:"準レギュラー",color:"#2b7de9"},{key:"occasional",label:"たまに参加",color:"#f0a030"},{key:"never",label:"未参加",color:"#999"}];
269	const toggle=(name)=>{if(usedSet.has(name)){setDeselected(p=>{const n=new Set(p);if(n.has(name))n.delete(name);else n.add(name);return n;});return;}setSelected(p=>{const n=new Set(p);if(n.has(name))n.delete(name);else n.add(name);return n;});};
270	const toggleGroup=(members)=>{const selectable=members.filter(f=>!usedSet.has(f.name)).map(f=>f.name);const allSel=selectable.length>0&&selectable.every(n=>selected.has(n));setSelected(p=>{const n=new Set(p);if(allSel)selectable.forEach(nm=>n.delete(nm));else selectable.forEach(nm=>n.add(nm));return n;});const addedInGroup=members.filter(f=>usedSet.has(f.name)).map(f=>f.name);const allDesel=addedInGroup.length>0&&addedInGroup.every(n=>deselected.has(n));setDeselected(p=>{const n=new Set(p);if(allDesel)selectable.forEach(nm=>n.delete(nm));else selectable.forEach(nm=>n.add(nm));return n;});};
271	return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
272	<div style={{background:"#fff",borderRadius:16,padding:16,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto"}}>
273	<div style={{background:"#fff",borderRadius:16,padding:16,maxWidth:500,width:"100%",maxHeight:"85vh",overflow:"auto"}}>
274	<div style={{fontSize:18,fontWeight:800,color:"#14365a"}}>{"☆"} お気に入り選択</div>
```

用途: FavoriteSelectModal 内 `GC` 配列（Group Config の 5 段階：master/regular/semi/occasional/never）における、最上位 `"master"`（開発者《𝕸𝖆𝖘𝖙𝖊𝖗》グループ）の `accent` プロパティ。`color:"#1a1a2e"`（濃紺黒）と組み合わせて金色アクセントで識別する隠し機能表示。**近傍の他 hex 直書き**: `#1a1a2e`（master color）、`#22b566`（regular）、`#2b7de9`（semi）、`#f0a030`（occasional）、`#999`（never）。その先は `rgba(0,0,0,0.5)`, `#fff`, `#14365a` などのモーダル装飾。

### 2.4 その他 #ffd700 追加出現

追加出現なし。`src/` 全体（大文字小文字区別なし）で `#ffd700` は上記 3 箇所のみ。

---

## 3. DESIGN.md §2 Neutral セクション現状

### 3.1 §2 サブセクション見出し一覧

- §2.1 設計原則（L94）
- §2.2 Neutral Scale（12段階）（L103）
- §2.3 Brand Blue（4段階）（L122）
- §2.4 Semantic Colors（L133）
- §2.5 Wind Sensor Colors（独立カテゴリ）（L155）
- §2.6 Wind Monitor 追加トークン（L169）
- §2.7 Team Colors（プレイヤー識別専用）（L182）
  - §2.7.1 命名規則（L188）
  - §2.7.2 Team 1（青系）（L199）
  - §2.7.3 Team 2（赤系）（L209）
  - §2.7.4 Team 3（緑系）（L219）
  - §2.7.5 Team 4（金系）（L229）
- §2.8 Chart & Debug Colors（L241）
  - §2.8.1 Chart Colors（L243）
  - §2.8.2 Debug Colors（L262）
- §2.9 色使用の原則（L280）
- §2.10 既存エイリアス一覧（現状コード監査）（L297）
  - §2.10.1 使用中のエイリアス（22変数）（L303）
  - §2.10.2 現在未使用の 10 変数（L332）
  - §2.10.3 Step 4 第1弾の作業範囲外（L349）

### 3.2 Neutral サブセクション存在有無

- 存在: **Yes**（§2.2 Neutral Scale（12段階）、L103-L120）

### 3.3 Neutral 10 変数記載状況

| 変数 | 記載 | 値 |
|---|---|---|
| `--neutral-50` | あり | `#f8f9fa` |
| `--neutral-100` | あり | `#eeeeee` |
| `--neutral-200` | あり | `#dddddd` |
| `--neutral-300` | あり | `#cccccc` |
| `--neutral-400` | あり | `#aaaaaa` |
| `--neutral-500` | あり | `#888888` |
| `--neutral-600` | あり | `#666666` |
| `--neutral-700` | あり | `#3d5a80` |
| `--neutral-800` | あり | `#14365a` |
| `--neutral-900` | あり | `#0f1a2e` |

**補足**: §2.2 は「12段階」として定義されており、上記 10 変数に加え `--neutral-0`（`#ffffff`）と `--neutral-950`（`#0b1526`）も記載されている。

### 3.4 Neutral サブセクション全文引用

```
### 2.2 Neutral Scale（12段階）

背景・テキスト・ボーダー・サーフェスに使用する中立色。

| トークン | 値 | 主な用途 |
|---|---|---|
| `--neutral-0` | `#ffffff` | カード背景（ライト）、主要テキスト（ダーク上） |
| `--neutral-50` | `#f8f9fa` | ページ背景（ライト） |
| `--neutral-100` | `#eeeeee` | テーブルヘッダー背景、境界線（強） |
| `--neutral-200` | `#dddddd` | 境界線（標準） |
| `--neutral-300` | `#cccccc` | 境界線（弱）、無効化要素 |
| `--neutral-400` | `#aaaaaa` | プレースホルダー、補助テキスト（ライト上） |
| `--neutral-500` | `#888888` | 補助テキスト |
| `--neutral-600` | `#666666` | セカンダリテキスト |
| `--neutral-700` | `#3d5a80` | ダーク時のボーダー、セグメント非アクティブ背景 |
| `--neutral-800` | `#14365a` | インプット背景（ダーク）、ヒートマップ単色 |
| `--neutral-900` | `#0f1a2e` | ダークカード背景、ヘッダー背景 |
| `--neutral-950` | `#0b1526` | ページ背景（ダーク）、最下層 |
```

---

## 4. スコープ外候補の残存確認

### 4.1 --bg-overlay 値確認

- 定義: `src/styles.css:8`  `  --bg-overlay: rgba(0,0,0,0.55);`
- 期待値 `rgba(0, 0, 0, 0.55)` との一致: **一致**（カンマ後スペースの有無のみの表記差。CSS 上は完全等価。実体値 rgba(0,0,0,0.55) 同一）
- その他の出現: `src/styles.css:8`（定義のみ）。`var(--bg-overlay)` 形式の参照は `src/` 以下で **0 件**（grep 確認済み、使用箇所なし）。定義はあるが未参照の状態。

### 4.2 L62 章番号なし見出し残存

- 残存: **Yes**（ただしフォーマット例示のコードブロック内に存在）
- 行番号: DESIGN.md L62
- 前後 5 行引用（L59-L73）:

```
59  #### 明記のフォーマット例
60
61  ```markdown
62  ## 提案: Wind Vector Widget の矢印サイズを 24px に拡大
63
64  ### 根拠
65  - **§9.2.5 Wind Vector Widget**: 既に矢印サイズ 24×24px と定義済み、現状の 16px 相当からの拡大
66  - **§3.2 Font Size Scale**: 風速数値は `--text-xl`（20px）に昇格、現状の `--text-sm` 相当からの拡大
67  - **§2.5 Wind Sensor Colors**: CALM/MODERATE/STRONG/SEVERE の閾値で色変化、§9.2.5 Wind Ramp 色変化に従う
68  - **現状実装**: IMG_0244.jpeg 緑丸箇所の視認性が不足との太一さん指摘（2026-04-17 セッション）
69  - **v3 設計思想**: 直射日光視認性は装備で解決済みだが、GameScreen の計器的精度感は視認性が前提
70
71  ### 変更箇所
72  - `src/components/GameScreen/WindVectorWidget.jsx` ...
73  ```
```

**特記**: L62 の `## 提案: ...` は §1.5.2「明記のフォーマット例」の中で、L61 の ```` ```markdown ```` と L73 の ```` ``` ```` に挟まれた **コードブロック（fenced code）内部の例示テキスト**。独立した「章番号なし見出し」として Markdown レンダラが見出しに昇格させる対象ではない（プリフォーマット化されるため目次や見出し階層には影響しない）。ただし、純粋な「行内のテキスト文字列」としては `## 提案: Wind Vector Widget の矢印サイズを 24px に拡大` が残存しており、引き継ぎドキュメントが想定する「章番号なし見出しの残存」という表現と字面上は一致する。**B 本指示書で「削除対象か保持対象か」の判断が必要**。

---

## 5. 総括

### 5.1 判明事項（5 項目）

1. **`--border-input` (68 件) は事実上の標準枠線トークン** — 入力系・ボタン系・カード外枠・セグメント非選択など 7 系統に広く浸透している。統合/リネームすると影響ファイル数が 5（全主要コンポーネント）、変更行数が 68 行に達する。単純な `var(--border-input)` → 別トークンへの sed 置換が最も安全。
2. **`--border-lighter` (9 件) は区切り線専用トークン** — 水平 divider（リスト/テーブル行区切り、パネル上下端）のみに使用されており、意味論的に `--border-input` と役割分離されている。Neutral Scale で表現するなら `--neutral-100` (`#eeeeee`) にマップ可能（定義値が完全一致）。
3. **`--bg-surface-alt` (3 件) は 2 系統の用途が混在** — 全画面モーダル背景 (2 件) とテーブルヘッダー行背景 (1 件)。前者は `--bg-overlay` や新規トークンへ、後者は `--neutral-100` 等へ分離検討する余地。
4. **`--text-warning` (1 件) は使用極小** — `GameScreen.jsx:88` のフォルト警告ラベル 1 箇所のみ。`--warning` 新設時にテキスト版/背景版の役割分担を明確化すべき。DESIGN.md §2.4 に「Semantic Colors」節があるため、そちらへ統合する設計判断が自然。
5. **hex `#ffd700` は 3 箇所とも異なる文脈** — (1) Canvas 画像エクスポートのゴールド文字、(2) お祝い紙吹雪の色配列要素、(3) 開発者 "master" グループの金色アクセント。いずれも「金色の装飾・強調」という点で共通するが、Canvas は CSS 変数が使えない制約があり、残り 2 箇所もそれぞれ独自の意味論を持つ。単一トークン化する場合、Canvas は対象外とせざるを得ない。

### 5.2 次セッション（B 本指示書作成）で判断すべき論点

1. **Neutral Scale 10 変数（50〜900）の実コード定義** — DESIGN.md §2.2 には既に 12 段階定義があるが、`src/styles.css` への実装は未着手。どの値を採用するか（DESIGN.md の値をそのまま使うか、現コードの `--border-lighter=#eee`、`--border-input=#ddd`、`--bg-surface-alt=#f0f3f8` の実値との整合をどう取るか）。
2. **統合マッピング** — 以下の想定される対応関係を確定する：
   - `--border-lighter` (`#eee`) → `--neutral-100` (`#eeeeee`) ？（DESIGN.md 既定値と完全一致）
   - `--border-input` (`#ddd`) → `--neutral-200` (`#dddddd`) ？（DESIGN.md 既定値と完全一致）
   - `--bg-surface-alt` (`#f0f3f8`) → ？（Neutral 50 `#f8f9fa` とは微差、独立トークン継続も検討可）
   - `--text-warning` (`#e67700`) → `--warning` 新設 or §2.4 Semantic Colors に追加？
3. **hex `#ffd700` の処置方針** — 3 箇所それぞれ：
   - GameResult.jsx:26 (Canvas)：CSS 変数が使えないため hex 直書き継続が合理的（技術的制約）
   - common.jsx:63 (CSSConfetti)：10 色配列の一部。配列全体をトークン化するか否か
   - common.jsx:268 (GC master accent)：隠し機能の装飾色。`--accent-gold` 等新設するか、ハードコード継続か
4. **L62 章番号なし見出しの扱い** — コードブロック内の例示であり削除不要という判断もありうる。B 本指示書で「削除する／保持する／別の例示に差し替える」のいずれにするか確定する。
5. **`--bg-overlay` の未参照状態** — 定義はあるが `var(--bg-overlay)` 参照が 0 件。これは「将来使用予定」か「既に使われなくなった残骸」か。B 本指示書着手前にどちらか明示する必要がある。

### 5.3 追加調査提案（任意）

1. **`--border-strong` / `--border-weak` など、他の border 系変数の有無** — Neutral Scale へ統合する際、既存 border 系トークン全体を俯瞰したい。調査範囲: `src/styles.css` の `--border-*` 全変数列挙 + `var(--border-*)` 全参照の grep。
2. **`--accent-yellow` / `--accent-gold` など、ゴールド系変数の既存定義確認** — `#ffd700` 関連の処置方針を決める際、既に近い変数があれば再利用可能。調査範囲: `styles.css` で `yellow|gold|amber` を含む変数定義と、`common.jsx:30` の `color:open?"var(--accent-blue)":"#f0f6ff"` 等、`--accent-yellow` の参照有無。
3. **`--border-lighter` と `--border-input` の意味論の再確認** — DESIGN.md §2.2 の「境界線（強）= `--neutral-100`」「境界線（標準）= `--neutral-200`」定義は、現コードでの使用実態（lighter=divider/input=frame+inputs）と一致しない可能性がある。DESIGN.md 側を実コードの意味論に合わせるか、コード側を DESIGN.md の意味論に合わせるかの判断が必要。調査範囲: DESIGN.md §2.2 の用途欄と実コード用途カテゴリの突き合わせ。
