# DESIGN.md

モルックスコアラーのデザイン正典。UIの設計・実装・改修時に参照する**単一の真実源**。

---

## 1. Overview & Role Separation

### 1.1 このファイルの役割

このファイル（`DESIGN.md`）は、モルックスコアラーのUI設計に関する**トークン値・コンポーネント仕様・画面別実装方針**を集約した機械可読な正典。Claude Code が UI生成・改修・レビュー時に最初に参照すべき単一のドキュメント。

- デザイントークン（色・タイポ・余白・角丸・影・モーション）の具体値
- コンポーネント・スタイリング仕様
- 画面別レイアウト・質感ガイダンス
- 禁止事項（Don'ts）

### 1.2 他ファイルとの関係

モルックスコアラーのデザイン資産は3つのファイル/ディレクトリに分散配置されており、それぞれが異なる抽象レベルを担当する。

| ファイル | 抽象レベル | 内容 |
|---|---|---|
| `DESIGN_PHILOSOPHY.md` | 哲学 | なぜこの設計にするか、v3設計思想の背景 |
| **`DESIGN.md`（本ファイル）** | **仕様** | **何をどう実装するか、トークン値と実装仕様** |
| `.claude/skills/molkky-ui-design/SKILL.md` | 実装ガイドライン | 実装時の判断基準、コードパターン |

3者は併存し、役割で分離される。**本ファイルは仕様層に集中**する。背景となる哲学や、実装判断のノウハウは重複させず、該当ファイルへのリンクで参照する。

### 1.3 更新ルール

- トークン値・コンポーネント仕様の変更は本ファイルを直接更新する
- 設計思想の変更は `DESIGN_PHILOSOPHY.md` を先に更新し、結果として本ファイルのトークン/仕様を追従させる
- 実装パターンの追加は `.claude/skills/molkky-ui-design/` 配下に記述する
- トークン定義の変更時は既存CSS変数との互換性を考慮（エイリアス維持の原則）

### 1.4 参照先クイックリファレンス

- デザイン哲学・v3思想: [`DESIGN_PHILOSOPHY.md`](./DESIGN_PHILOSOPHY.md)
- 実装ガイドライン: [`.claude/skills/molkky-ui-design/SKILL.md`](./.claude/skills/molkky-ui-design/SKILL.md)
- 既存コードの値監査: [`DESIGN_AUDIT.md`](./DESIGN_AUDIT.md)（`chore/design-audit` ブランチ）

### 1.5 改善提案時の出典明記ルール

**このファイルを参照してUI改善案・実装指示書・レビュー結果を出力する際、必ず根拠の出典を明記する**。太一さんが提案の妥当性を検証しやすくし、将来のセッションが判断の背景を追跡できるようにするため。

#### 明記すべき出典カテゴリ

| カテゴリ | 明記形式の例 |
|---|---|
| DESIGN.md の章・節 | 「§9.4.9 スコア分布ヒートマップに基づき」「§2.5 Wind Sensor Colors の閾値を使用」 |
| DESIGN_PHILOSOPHY.md の哲学 | 「v3 設計思想『機能とデザインの両立』に基づき」 |
| `.claude/skills/molkky-ui-design` の実装指針 | 「molkky-ui-design スキルの◯◯原則に従い」 |
| 既存コードの現状（Audit） | 「DESIGN_AUDIT.md に記録された現状値 #XXX を基準とし」 |
| 外部デザイン参照 | 「Apple Watch Ultra Wayfinder 文字盤を参照」「Strava のアクティビティカード構造を参考」 |
| 過去の議論・決定 | 「`<decision_id>` の議論で確定した方針に基づき」「前セッションで太一さんが b) を選択したことに基づき」 |
| 現状実装の観察 | 「IMG_0244.jpeg のスクリーンショットに基づく現状分析」「src/components/GameScreen.jsx の現状実装を正典化」 |

#### 明記のフォーマット例

```markdown
## 提案: Wind Vector Widget の矢印サイズを 24px に拡大

### 根拠
- **§9.2.5 Wind Vector Widget**: 既に矢印サイズ 24×24px と定義済み、現状の 16px 相当からの拡大
- **§3.2 Font Size Scale**: 風速数値は `--text-xl`（20px）に昇格、現状の `--text-sm` 相当からの拡大
- **§2.5 Wind Sensor Colors**: CALM/MODERATE/STRONG/SEVERE の閾値で色変化、§9.2.5 Wind Ramp 色変化に従う
- **現状実装**: IMG_0244.jpeg 緑丸箇所の視認性が不足との太一さん指摘（2026-04-17 セッション）
- **v3 設計思想**: 直射日光視認性は装備で解決済みだが、GameScreen の計器的精度感は視認性が前提

### 変更箇所
- `src/components/GameScreen/WindVectorWidget.jsx` ...
```

#### ✗ 出典明記の禁止パターン

- 根拠なく「デザイン的にこちらが良い」と主観で判断
- 「一般的なUIデザインでは」といった抽象的根拠
- DESIGN.md の章・節番号を省略して「デザイン原則に従い」とだけ書く
- 複数の出典が競合する場合に優先順位を示さない（1章「他ファイルとの関係」の抽象レベル順を優先）

#### ✓ 出典明記の推奨パターン

- **章・節番号は必ず具体的に**（§9.4.9 のように）
- **複数出典は箇条書きで並列**し、どれが決定的根拠かを明確化
- **外部デザイン参照時は何を参照したか具体的に**（「Apple風」ではなく「Apple Watch Ultra Wayfinder 文字盤のコンパス盤面」）
- **過去の議論は日付/セッションで識別**（memory 参照なら memory 項目名も）
- **現状実装からの差分**は「現状X → 提案Y」の形式で明記

---

## 2. Color Palette

### 2.1 設計原則

- **役割分離**: 1つの色に複数の意味を持たせない（ブランド色・操作色・状態色・注意色を明確に分離）
- **単一の真実源**: 色は本ファイルで定義されたトークンのみ使用。インラインでの生値（#xxxxxx）の直書きは原則禁止
- **既存エイリアス維持**: `--text-primary`, `--accent-red` 等の既存CSS変数は破壊せず、定義値を本ファイルのトークンに揃える
- **Tailwind系グレー統合**: `#6b7280` 等の Tailwind デフォルトグレーは全て Neutral Scale に統合される

---

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

### 2.3 Brand Blue（4段階）

アプリのブランド識別・主要操作・アクティブ状態に使用。

| トークン | 値 | 主な用途 |
|---|---|---|
| `--blue-50` | `#e6f0fb` | hover薄背景、選択行背景（ライト） |
| `--blue-100` | `#d0dff0` | 選択時の薄背景、情報バッジ |
| `--blue-500` | `#2b7de9` | プライマリボタン、アクティブタブ、セグメントアクティブ |
| `--blue-700` | `#1a6dd4` | hover時のプライマリ、リンクhover |

### 2.4 Semantic Colors

状態表現・前進アクションに使用。汎用装飾・強調目的での使用は禁止（色の役割分離原則）。

| トークン | 値 | 主な用途 |
|---|---|---|
| `--success` | `#22b566` | 成功状態、ONトグル、完了バッジ、前進アクションボタン |
| `--success-dark` | `#1a9d52` | 成功hover、濃色文字 |
| `--success-bg` | `#e6faf0` | 成功薄背景、通知背景 |
| `--warning` | `#e6a817` | 警告、注意、お気に入り星 |
| `--warning-dark` | `#bf6900` | 警告文字、強調 |
| `--warning-bg` | `#fff3e0` | 警告薄背景 |
| `--text-warning` | `#e67700` | 警告文字色（上限超過警告、フォルト=25点警告等） |
| `--danger` | `#e74c3c` | エラー、削除、ミス列、NGバッジ |
| `--danger-bg` | `#fde8e8` | エラー薄背景、NGバッジ背景 |
| `--text-danger` | `#c0392b` | 削除確認・エラー文言・MissDots f>=2 塗り色 |

※ `--danger-dark` は新設しない。既存の `--text-danger` (#c0392b) が同値であり、重複を避けるため `--text-danger` で代用する。`--text-danger` は削除確認テキスト・エラー文言・MissDots の f>=2 時塗り色等のユーザーへの警告文字色として使用される既存トークン。

※ `--gold` (#ffd700) は以前の定義から削除。実使用箇所（Canvas描画の GameResult.jsx:27 / CSSConfetti多色配列 common.jsx:64 / Masterグループ意図的ハードコード common.jsx:269-270）はいずれも CSS 変数化不適のため、トークン化せず hex 直書きのまま維持する。

#### 緑 = 成功/前進アクション（セマンティック定義）

緑は、単なる成功状態の通知（トースト、成功バッジ、チェックマーク等）だけでなく、ユーザーが「次へ進む／確定する／有効化する／保存する」意図を持つアクション要素にも適用する。

ただし以下の用途には **使用しない**:
- キャンセル・削除・戻る等の後退/否定アクション
- 装飾目的のみの背景色・枠線
- 状態変化を伴わない純粋な画面遷移（この場合は Brand Blue を維持する）

#### 緑 = 前進アクションの適用例（現行 production 実装追認）

| 箇所 | 色使い | セマンティック根拠 |
|---|---|---|
| トグルスイッチの ON 状態（スタッツ反映・風速計連携） | 緑 | 機能の「有効化」という前進アクション |
| ゲーム開始ボタン（SetupScreen） | 青→緑グラデーション | 「設定完了→ゲーム開始」への前進 |
| スコア表を画像保存ボタン（ResultScreen） | 緑 | 成果物の「確定保存」アクション |
| 試合開始確定ボタン | 緑 | 試合の「確定開始」アクション |
| 未完了試合の「再開する」ボタン | 緑 | 中断状態からの「前進」アクション |

このリストは「個別の例外」ではなく「前進アクションのセマンティックに該当する具体例」として位置づける。今後同じセマンティックを持つ新規要素には緑を使用してよい。

**既存エイリアス変更（Step 4 第2弾C で実施済み）**:
- `--accent-red` の定義値を `#d93a5e` → `#e74c3c` に変更済み（`--danger` と値統一、第2弾C C-b1）

**注意**: Step 4 第1弾では実コードの定義値変更は行わない。視覚変化を伴う変更のため、別途モックアップ検証を経て第2弾以降で適用する。現状値と理想値の差分は §2.10.2 および §2.10.3 を参照。

**背景系独立トークン（Neutral Scale 外・Step 4 第2弾B で継続判断）**:

- `--bg-surface-alt` (`#f0f3f8`): 全画面モーダル下地（主用途、`GameResult` / `StatsModal` ルート）、および特定テーブルヘッダー背景（例外用途、`StatsModal` 詳細指標テーブルヘッダー行）。青寄りの値で Neutral Scale にマップ不可のため独立継続とする。

#### カラートークンの役割分離

装飾・ブランド色（`--accent-*`）と状態色（`--warning` / `--success` / `--danger` / `--text-danger`）は、同値を持つ場合があっても意味が異なるため別変数として扱う。

**装飾・ブランド色**
- `--accent-yellow` (`#e6a817`): アクセント装飾、管理者バッジ等
- `--accent-orange` (`#bf6900`): アクセント装飾、一部UI要素の文字色
- `--stats-highlight-gold` (`#c9a227`): Stats 領域の棒グラフで 11〜12点（モルック上がり得点）バーを強調する装飾色。`--gold` (#ffd700) は α で廃止済み、本トークンが派生の後継。styles.css への `:root` 定義は β で Stats 棒グラフ実装時に追加する。
- 用途: 機能的な「状態」ではなく、UIの装飾・ブランドトーンに属する要素

**状態色（Semantic Colors）**
- `--warning` (`#e6a817`) / `--warning-dark` (`#bf6900`) / `--warning-bg` (`#fff3e0`): ユーザー警告表示。ミス表示、上限超過警告、注意喚起
- `--text-warning` (`#e67700`): 警告文字色（上限超過警告パネル、フォルト=25点警告等）。`--warning` (`#e6a817`) と近似する微差値で、テキスト可読性を優先した専用色として独立維持
- `--success` (`#22b566`) / `--success-dark` (`#1a9d52`) / `--success-bg` (`#e6faf0`): 成功・前進アクション
- `--danger` (`#e74c3c`) / `--danger-bg` (`#fde8e8`): 危険・削除・破壊的アクション
- `--text-danger` (`#c0392b`): 警告文字色（`--danger` の濃色版に相当、削除確認・エラー文言に使用）

**`--text-*` プレフィックスのルール**

状態色のテキスト表示用トークンに `--text-*` プレフィックスを付与する。背景色・塗り色と文字色を明確に分離する目的で、`--text-danger` / `--text-warning` が対称形式で機能する。今後同系統の警告文字色を追加する場合は本ルールに従う。

※ `--accent-yellow` と `--warning` は現在同値 (`#e6a817`) だが、将来のデザイン変更で意味的に分岐する余地を保つため両方維持する。

※ 本ルールに従った実コードの `var()` 置換作業は第2弾B-β で実施する。現時点では定義のみ整理。

### 2.5 Wind Sensor Colors（独立カテゴリ）

風速カテゴリの視覚化専用。**スコアヒートマップ等への流用禁止**（意味論衝突のため）。

| トークン | 値 | 閾値 | 主な用途 |
|---|---|---|---|
| `--wind-calm` | `#34d399` | 0.0〜2.0 m/s | 穏やか、接続成功ドット |
| `--wind-calm-light` | `#6ee7b7` | — | CALMの薄色派生、グラデ |
| `--wind-moderate` | `#fbbf24` | 2.0〜4.0 m/s | 軽〜中の風 |
| `--wind-strong` | `#f97316` | 4.0〜6.0 m/s | 明確な補正必要 |
| `--wind-severe` | `#ef4444` | 6.0 m/s〜 | 戦略大幅変更レベル |

閾値は GameScreen の Wind Vector Widget・WindMonitor で共通使用。変更する場合は両方に波及するため、本ファイルを単一の真実源とする。

### 2.6 Wind Monitor Industrial Palette

Apple Watch Ultra Industrial 美学（Wayfinder 文字盤 + Modular Ultra 文字盤参照）の WindMonitorModal 専用 12 トークン。PR β X-2（PR #91、2026-04-24）で `src/styles.css` に追加、PR β X-3（PR #92、2026-04-24）で `src/components/WindMonitorModal.jsx` に全面適用済み。既存の `--wind-bg-base` / `--wind-bg-card` / `--wind-grid-*` / `--wind-text-*` の 6 トークン定義（2025 年時点）は本節の書き換えで廃止され、新 12 トークン体系に置き換わる。

| トークン | 値 | 役割 | 系統 |
|---|---|---|---|
| `--wind-bg-base` | `#0a0f1a` | WindMonitor ページ背景最下層、モーダルルート背景 | slate 950 系（`--neutral-950` とは別系統の独立 slate） |
| `--wind-bg-surface` | `#0f172a` | BezelPanel 内部背景、パネル内カード、iPad / iPhone レイアウトの radial-gradient 起点 | slate 900 系 |
| `--wind-bg-panel` | `#111827` | DeckHeader 背景、CompassGauge face radial gradient 起点、BezelPanel radial gradient 起点 | slate 900 系より微明 |
| `--wind-edge` | `#1e293b` | パネルボーダー（`border: 1px solid`）、グリッド線、tick major、コンパス外周リング、BezelPanel ボーダー、シェブロン末尾 | slate 800 系 |
| `--wind-accent` | `#67e8f9` | cyan accent 本体（BEARING 数値、コンパスセクター中間塗り、シェブロン矢印、ハブ外周リング stroke） | cyan |
| `--wind-accent-hi` | `#a5f3fc` | cyan accent 明部（BLADE NEEDLE 明部、ハブ中央ハイライト、BLADE 内部ライン） | cyan 明 |
| `--wind-accent-lo` | `#0e7490` | cyan accent 暗部（BLADE NEEDLE 暗部、ハブ内部リング、BezelPanel リベット stroke） | cyan 暗 |
| `--wind-text-primary` | `#e2e8f0` | 主要テキスト（INK、TIMELINE タイトル、方向ラベル強調時、コンパス tick cardinal） | INK |
| `--wind-text-slate` | `#94a3b8` | SLATE、閉じるボタン文字、方向ラベル通常色、ラベルテキスト、BezelPanel タイトル切り欠き文字 | SLATE |
| `--wind-text-muted` | `#64748b` | MUTED 統合（コーナーラベル、BEARING ラベル上側、補助テキスト、Hero 数値の「m/s」、PEAK/AVG/BAT カードの単位・サブ） | MUTED |
| `--wind-text-dim` | `#475569` | 最淡テキスト（軸ラベル、フッター、tick minor、数値ラベル、BezelPanel リベット stroke 内側） | DIM |
| `--wind-linked` | `#34d399` | LINKED 緑（接続中ドット、LINKED ラベル文字色、`--wind-calm` と hex 同値の意図的エイリアス、§ 2.11.2 で正典承認） | Wind Monitor Status（Wind Sensor Colors とエイリアス関係） |

**補足記述**:

- Wind Monitor Industrial Palette は既存 `--neutral-*` スケールとは別系統の独立 slate であり、`--neutral-950`（`#0b1526`）とは微差で意図的に分離されている（`#0a0f1a` は slate 950 系、`#0b1526` は独自 navy 系）。この分離により、WindMonitor 画面全体が「計器盤としての独自世界観」を持ち、他画面（GameScreen / Stats / Settings / SetupScreen）と混ざらないことを保証する。
- `--wind-linked` は Wind Sensor Colors（§ 2.5）の `--wind-calm` と hex 完全同値（`#34d399`）だが、意味論が異なるため別トークンとして独立保持する（§ 2.11.2 で正典承認）。`--wind-calm` は「風速カテゴリの穏やか」を表し、`--wind-linked` は「WebSocket 接続状態の LINKED（接続中）」を表す。
- 既存 6 トークン（`--wind-bg-card` / `--wind-grid-major` / `--wind-grid-minor` / `--wind-text-label`）は新体系で使用されない。代替: `--wind-bg-card` → 用途廃止（BezelPanel 構造に変更）、`--wind-grid-*` → `--wind-edge` に統合、`--wind-text-label` → `--wind-text-slate` / `--wind-text-muted` / `--wind-text-dim` の 3 トークンに細分化。

#### § 10.2 非抵触の追認

Wind Monitor Industrial Palette（新 12 トークン）は PR β X-2（PR #91、2026-04-24）で新規導入された WindMonitor 専用配色体系で、§ 10.2「モルックスコアラー固有の禁止事項」の既存項目と抵触しないことを追認する。

- **「プレイヤー色を識別以外の用途に使う」禁止事項との関係**: Wind Monitor Industrial Palette は Team Colors（§ 2.7）とは完全に独立した配色（slate 系 + cyan accent + green LINKED）であり、プレイヤー色の流用は発生しない。
- **「Wind Ramp 色をスコアヒートマップに流用」禁止事項との関係**: Wind Monitor Industrial Palette は Wind Sensor Colors（§ 2.5）とは意味論が異なる独立カテゴリである。`--wind-linked` と `--wind-calm` が hex 同値であることは § 2.11.2 で意図的エイリアスとして正典承認済みだが、これは「WindMonitor 内部の接続状態表現」であり、スコアヒートマップへの流用ではない。

### 2.7 Team Colors（プレイヤー識別専用）

4 チーム × 5 属性の識別色。現状は `src/constants.js` の `C` 配列で定義されている値を、本ファイルで CSS 変数として正典化する。

**重要**: 本セクションは DESIGN.md 側での正典定義のみ。実コード側の CSS 変数定義は Step 4 第2弾以降で実施される（Step 4 第1弾では視覚変化ゼロ。詳細は §2.10 参照）。

#### 2.7.1 命名規則

- 形式: `--team-{番号}-{属性}`
- 番号: 1〜4（`src/constants.js` の `C[0]`〜`C[3]` に対応）
- 属性:
  - `deep`: 濃色背景、ヘッダー背景、プロフィール枠（`C[i].bg` に対応）
  - `light`: 淡色背景、hover 背景、選択行背景（`C[i].lt` に対応）
  - `accent`: アクセント色、主要強調、バッジ（`C[i].ac` に対応）
  - `text`: テキスト表示色、通常は `deep` と同値（`C[i].tx` に対応）
  - `name-bg`: プレイヤー名バッジの薄背景（`C[i].nm` に対応）

#### 2.7.2 Team 1（青系）

| 変数名 | 値 | C 配列対応 |
|---|---|---|
| `--team-1-deep` | `#14365a` | `C[0].bg` |
| `--team-1-light` | `#e6f0fb` | `C[0].lt` |
| `--team-1-accent` | `#2b7de9` | `C[0].ac` |
| `--team-1-text` | `#14365a` | `C[0].tx` |
| `--team-1-name-bg` | `#c8dfff` | `C[0].nm` |

#### 2.7.3 Team 2（赤系）

| 変数名 | 値 | C 配列対応 |
|---|---|---|
| `--team-2-deep` | `#6b1d30` | `C[1].bg` |
| `--team-2-light` | `#fbe6ec` | `C[1].lt` |
| `--team-2-accent` | `#d93a5e` | `C[1].ac` |
| `--team-2-text` | `#6b1d30` | `C[1].tx` |
| `--team-2-name-bg` | `#ffc8d6` | `C[1].nm` |

#### 2.7.4 Team 3（緑系）

| 変数名 | 値 | C 配列対応 |
|---|---|---|
| `--team-3-deep` | `#1a5c3a` | `C[2].bg` |
| `--team-3-light` | `#e6faf0` | `C[2].lt` |
| `--team-3-accent` | `#22b566` | `C[2].ac` |
| `--team-3-text` | `#1a5c3a` | `C[2].tx` |
| `--team-3-name-bg` | `#b8ffd8` | `C[2].nm` |

#### 2.7.5 Team 4（金系）

| 変数名 | 値 | C 配列対応 |
|---|---|---|
| `--team-4-deep` | `#6b5a1d` | `C[3].bg` |
| `--team-4-light` | `#fbf5e6` | `C[3].lt` |
| `--team-4-accent` | `#d9a83a` | `C[3].ac` |
| `--team-4-text` | `#6b5a1d` | `C[3].tx` |
| `--team-4-name-bg` | `#ffe8a0` | `C[3].nm` |

**プレイヤー色は識別専用**: UI 要素（ボタン・背景・状態色）への流用禁止。§10.2「プレイヤー色を識別以外の用途に使う」参照。

### 2.8 Chart & Debug Colors

#### 2.8.1 Chart Colors

グラフ・データ可視化の補助色。`src/styles.css` に `--chart-1` 〜 `--chart-8` として CSS 変数化され、`src/constants.js` の `PC` 配列がその値を担持する。

**パレット構成（η hybrid palette、2026-04-21 確定）**: β アース 5 色（テラコッタ / ブロンズ / オリーブ / ラスト / コーヒーブラウン）を軸に背景 `--bg-surface-alt` (`#f0f3f8`) に馴染ませつつ、寒色 3 枠（サファイア / ターコイズダーク / アメジスト）を γ の深色で締めることで、暖寒で明度差のリズムを作り 6 プレイヤー重畳時の識別性を確保する。色相候補 5 案（α 工学的 D3 / β アース / γ ジュエル / δ パステル / ε 空き領域限定）と β / γ ハイブリッド 2 案（ζ γ 寄り / η β 寄り）の比較検証を経て η で確定。

**§10.2 違反解消の経緯**: 第2弾D D-tokens 実施前の `PC[0]`〜`PC[3]` は Team Colors の accent 色と完全同値（`#2b7de9` / `#d93a5e` / `#22b566` / `#d9a83a`）で、§10.2「プレイヤー色を識別以外の用途に使う」の禁止事項に該当する違反状態だった。η hybrid palette への置換により違反解消済み（8 色全てが Team Colors accent および `--danger` と異なる独自値）。

| 変数名 | 値 | 色名 | 系統（由来） |
|---|---|---|---|
| `--chart-1` | `#c8553d` | テラコッタ | β（暖色） |
| `--chart-2` | `#b08847` | ブロンズ | β（暖色） |
| `--chart-3` | `#7a8450` | オリーブ | β（中間緑） |
| `--chart-4` | `#a86e3e` | ラスト | β（暖色） |
| `--chart-5` | `#2b3a78` | サファイア | γ（寒色深色） |
| `--chart-6` | `#1e5968` | ターコイズダーク | γ（寒色深色） |
| `--chart-7` | `#4a1f68` | アメジスト | γ（寒色深色） |
| `--chart-8` | `#6b4b3e` | コーヒーブラウン | β（暖色） |

**実装メモ**: 第2弾D D-tokens（2026-04-21、PR #88）で `src/styles.css` に CSS 変数を新規定義、D-apply（2026-04-21、PR #89）で `src/constants.js` の `PC` 配列を η パレット値に書き換え、D-cleanup（2026-04-21、PR #90）で `src/components/StatsModal.jsx` 内のデッドコード 3 関数（`hexToHsl` / `hslToHex` / `generatePlayerColors`）の削除実施済み。第2弾D 全 3 PR 完了。

#### 2.8.2 Debug Colors

開発時のデバッグ表示専用。本番 UI 使用禁止。

現状 `src/constants.js` には Debug 専用定数定義はなく、`src/components/WindDebugOverlay.jsx` に inline で埋め込まれている hex 値を本セクションで正典化する。

| 変数名 | 値 | 抽出元 | 用途 |
|---|---|---|---|
| `--debug-log-url` | `#ffff00` | `WindDebugOverlay.jsx:24` | URL ログ行ハイライト（`url:` を含む行） |
| `--debug-log-error` | `#ff4444` | `WindDebugOverlay.jsx:24, 61` | エラー・切断ログ行、切断状態インジケータドット |
| `--debug-log-connected` | `#44ff44` | `WindDebugOverlay.jsx:25, 61` | 接続成功ログ行、接続状態インジケータドット |
| `--debug-log-default` | `#00ff00` | `WindDebugOverlay.jsx:26, 38, 69, 71, 75, 81, 83, 88` | デフォルトログ色、枠線、ボタン文字色（ターミナル風 CRT グリーン） |
| `--debug-info-muted` | `#aaaaaa` | `WindDebugOverlay.jsx:99` | ヘッダー下の情報テキスト（SW / Proto / Pi 表示） |

**備考**: `WindDebugOverlay.jsx:101` の 3 桁 hex `#333`（ボーダー色）は抽出対象パターン `#[0-9a-fA-F]{6}` に該当しないため本表から除外。Step 4 第2弾以降で 6 桁表記（`#333333`）への正規化と統合判断を行う。

**重要**: 本セクションは DESIGN.md 側での正典定義のみ。実コード側の CSS 変数定義・inline hex の変数化置換は Step 4 第N弾以降で実施される（Step 4 第1弾では視覚変化ゼロ）。

### 2.9 色使用の原則

#### ✗ 禁止パターン

- インラインで生値（`#xxxxxx`, `rgb(...)`）を直書き
- プレイヤー色をUI要素（ボタン・背景）に流用
- Wind Ramp色をスコア分布・他の可視化に流用
- 赤をエラー・重要強調・アクセント・アクティブに同時使用（役割混在）
- Tailwind系グレー（`bg-gray-500` 等）の新規使用

#### ✓ 推奨パターン

- 役割で色を選ぶ（ブランド色/操作色/状態色/識別色/注意色）
- 新しい色が必要な場合は本ファイルに追加してから使用
- hover・active・disabled は同系統の濃淡で表現
- 背景色と文字色のコントラストを WCAG AA 以上で確保

### 2.10 既存エイリアス一覧（現状コード監査）

現状の `src/styles.css` の `:root` に定義されている全 34 CSS 変数の現状記録。DESIGN.md §2.2〜§2.9 と実コードの乖離を可視化し、Step 4 第2弾以降の統合作業の参照元とする。

**出典**: `DESIGN_AUDIT.md §6.2 CSS変数（カスタムプロパティ）使用状況`（生成日: 2026-04-16）

#### 2.10.1 使用中のエイリアス（22変数）

DESIGN_AUDIT.md で「定義され、使用箇所数 1 以上」と分類されたもの。

| 変数名 | 現状値 | 使用数 | DESIGN.md マップ先 | Step 4 第1弾の扱い | 備考 |
|---|---|---|---|---|---|
| `--text-inverse` | `#fff` | 73 | `--neutral-0` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--border-input` | `#ddd` | 68 | `--neutral-200` | 現状維持 | 値一致 |
| `--blue-500`（旧 `--accent-blue`） | `#2b7de9` | 57 | `--blue-500`（§ 2.3） | 解消済み（PR α、リネーム） | 値一致（2026-04-25 PR α でリネーム） |
| `--bg-surface` | `#fff` | 56 | `--neutral-0` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--text-primary` | `#14365a` | 55 | `--neutral-800` | 解消済み（§2.11.4、var() 参照化） | 値一致（意味論は別途検討） |
| `--text-secondary` | `#888` | 40 | `--neutral-500` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--text-danger` | `#c0392b` | 30 | `--text-danger` | 現状維持 | 値一致（§2.4 で正典化） |
| `--bg-secondary` | `#14365a` | 29 | `--neutral-800` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--text-muted` | `#aaa` | 11 | `--neutral-400` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--text-success` | `#22b566` | 9 | `--success` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--border-lighter` | `#eee` | 9 | `--neutral-100` | 現状維持 | 値一致 |
| `--accent-green` | `#22b566` | 6 | `--success` | 現状維持 | 値一致 |
| `--bg-tertiary` | `#0f1f30` | 5 | なし（中間色） | 現状維持 | Neutral Scale の 900 (`#0f1a2e`) と 950 (`#0b1526`) の中間。Step 4 第2弾で統合判断 |
| `--bg-surface-dim` | `#f8f9fa` | 5 | `--neutral-50` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--accent-yellow` | `#e6a817` | 5 | `--warning` | 現状維持 | 値一致 |
| `--accent-orange` | `#bf6900` | 4 | `--warning-dark` | 現状維持 | 値一致 |
| `--bg-surface-alt` | `#f0f3f8` | 3 | なし（独自値） | 現状維持 | Step 4 第2弾で統合判断 |
| `--shadow-lg` | `0 10px 36px rgba(0,0,0,0.25)` | 2 | §5 要確認 | 現状維持 | DESIGN.md §5 との整合性を第2弾で確認 |
| `--bg-primary` | `#0b1526` | 1 | `--neutral-950` | 解消済み（§2.11.4、var() 参照化） | 値一致 |
| `--bg-overlay` | `rgba(0,0,0,0.55)` | 1 | なし（独自値） | 現状維持 | オーバーレイ専用。§6 との整合性を第2弾で確認 |
| `--text-warning` | `#e67700` | 2 | `--warning` に近似（微差） | 独立維持で確定（第2弾B-β） | `--warning` (`#e6a817`) と微差だがテキスト可読性を優先した専用色。§2.4 に正典化済み |
| `--border-light` | `#e0e0e0` | 1 | `--neutral-200` に近似（微差） | 現状維持 | `--neutral-200` (`#ddd`) と微妙に異なる。Step 4 第2弾で統合判断 |

※ `--warning` / `--warning-dark` / `--danger` / `--danger-bg` は第2弾B-α/β で追加された変数のため、本 Audit 表（2026-04-16 時点の DESIGN_AUDIT.md に基づく）には含まれていない。§2.10 全体の再 Audit は別タスクとして積み残す。

#### 2.10.2 現在未使用 / 統合済みの変数

DESIGN_AUDIT.md で「定義されているが使用箇所数 0」と分類されたもの、および Step 4 第2弾以降で統合・削除された変数。Step 4 第2弾以降で削除・統合・定義値変更の対象。

| 変数名 | 現状値 | DESIGN.md マップ先 | Step 4 第1弾の扱い | 第2弾以降の計画 | 統合済み |
|---|---|---|---|---|---|
| `--accent-red` | `#d93a5e` | → `--danger` (`#e74c3c`) | 現状維持 | 定義値変更 `#d93a5e` → `#e74c3c`（視覚変化あり、第2弾C） | 値変更済み `#e74c3c`（C-b1） |
| `--border-focus` | `#2b7de9` | `--blue-500` | 現状維持 | `--blue-500` への統合（第2弾B 以降） | - |
| `--radius-sm` | `6px` | → `8px`（§5 参照） | 現状維持 | 定義値変更 `6px` → `8px`（視覚変化あり、第2弾C） | 値変更済み `8px`（C-c2） |
| `--radius-md` | `10px` | §5 要確認 | 現状維持 | 使用0件確認済、第2弾C で削除予定 | 削除済み（C-c1） |
| `--radius-lg` | `14px` | → `12px`（§5 参照） | 現状維持 | 定義値変更 `14px` → `12px`（視覚変化あり、第2弾C） | 値変更済み `12px`（C-c2） |
| `--radius-xl` | `18px` | → `16px`（§5 参照） | 現状維持 | 定義値変更 `18px` → `16px`（視覚変化あり、第2弾C） | 値変更済み `16px`（C-c2） |
| `--shadow-md` | `0 6px 20px rgba(0,0,0,0.18)` | §5 で正典値 `0 2px 8px rgba(0,0,0,0.18)` | 現状維持 | 定義値変更（視覚変化あり：offset 3倍・blur 2.5倍、第2弾C） | 値変更済み `0 2px 8px rgba(0,0,0,0.18)`（C-b2） |
| `--transition-fast` | `0.15s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--transition-normal` | `0.2s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--transition-slow` | `0.3s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--border-lighter` | `#eee` | → `--neutral-100` | 現状維持 | `--neutral-100` への統合（第2弾B） | → `--neutral-100` (B-2a) |
| `--border-light` | `#e0e0e0` | → `--neutral-200` | 現状維持 | `--neutral-200` への統合（第2弾B） | → `--neutral-200` (B-2a) |
| `--border-input` | `#ddd` | → `--neutral-200` | 現状維持 | `--neutral-200` への統合（第2弾B） | → `--neutral-200` (B-2b) |

#### 2.10.3 Step 4 第1弾の作業範囲外

以下の変更はすべて **視覚変化を伴う** ため、Step 4 第2弾以降で別途モックアップ検証を経て適用する（本セクションは記録のみ、実コードの定義値変更はしない）:

- 既存エイリアスの未使用変数削除・統合

**解消済み項目**:

- `--accent-red: #d93a5e → #e74c3c` は第2弾C C-b1 で実施済み（`--danger` と値統一）
- `--radius-sm: 6px → 8px` は第2弾C C-c2 で実施済み（DESIGN.md §5.2 正典値に追従）
- `--radius-lg: 14px → 12px` は第2弾C C-c2 で実施済み（DESIGN.md §5.2 正典値に追従）
- `--radius-xl: 18px → 16px` は第2弾C C-c2 で実施済み（DESIGN.md §5.2 正典値に追従）

- 微差エイリアス（`--text-warning`, `--border-light` など）の統合
  - `--text-warning` (#e67700) は §2.4 および §2.10.1 の既存記述で独立維持として正典化済み。`--warning` (#e6a817) との微差だがテキスト可読性を優先した専用色として維持する旨が明記されている。また `--warning-dark` (#bf6900) とは RGB 差 32/16/0 で明確に別色で、実使用箇所でも役割分離済み（`--text-warning`: フォルト警告テキスト／上限超過メッセージ、`--warning-dark`: ミスボタン文字色）
  - `--border-light` は第 2 弾 B で `--neutral-200` へ別経路統合済み（`:root` からは削除済み）
  - Color トークン全般の命名思想と Primitive/Semantic の二層構造は §2.11「Color トークンの階層設計」で明文化（2-c で新設）

---

### 2.11 Color トークンの階層設計

`molkky-scorer` の Color トークンは「Primitive（原始値）」と「Semantic（用途）」の 2 層構造で設計されている。本節はその命名思想と使い分けルールを明文化する。

#### 2.11.1 二層構造の定義

**Primitive（原始値）**: カラーパレットとしての色値を表すトークン。用途に縛られない。

- `--neutral-0` 〜 `--neutral-950`（グレースケール、12 段階）
- `--accent-red`、`--accent-orange`、`--accent-yellow`、`--accent-green`、`--blue-500`（ブランド・装飾系）

**Semantic（用途）**: UI 上の役割を表すトークン。Primitive と同値を指すことがある。

- `--text-*`（文字色）
- `--bg-*`（背景色）
- `--border-*`（ボーダー色）
- `--danger-*` / `--warning-*` / `--success-*` / `--text-danger` / `--text-warning` / `--text-success`（状態色）

#### 2.11.2 完全重複ペアの承認（2026-04-19 スナップショット）

2-c（2026-04-19）の `:root` 全変数棚卸しで、以下の完全重複（または等価値）ペア／グループが確認された。これらは Primitive と Semantic が同値を指す**意図的なエイリアス関係**として承認する（将来の色味調整時に独立変更できるよう両方保持）。

> **注記**: 本表は **2026-04-19 時点のスナップショット** である。トークンの追加・削除・値変更を行った場合は本表も同時更新すること。更新履歴は表下部の「改定履歴」欄に記載する。
>
> 一部 Semantic トークンは実 CSS 上で 3 桁短縮 hex 表記（`#fff`、`#888`、`#aaa`）で定義されており、本表の 6 桁表記とは文字列としては不一致だが CSS 的には等価。表記統一は本タスクのスコープ外で、Primitive を `var()` 参照化する将来タスクで同時整理される（§2.11.4 参照）。

| 値 | Primitive | Semantic |
|---|---|---|
| `#bf6900` | `--accent-orange` | `--warning-dark` |
| `#e6a817` | `--accent-yellow` | `--warning` |
| `#22b566` | `--accent-green` | `--text-success` |
| `#2b7de9` | `--blue-500` | `--border-focus` |
| `#14365a` | `--neutral-800` | `--text-primary`、`--bg-secondary` |
| `#0b1526` | `--neutral-950` | `--bg-primary` |
| `#ffffff` | `--neutral-0` | `--bg-surface`、`--text-inverse` |
| `#f8f9fa` | `--neutral-50` | `--bg-surface-dim` |
| `#888888` | `--neutral-500` | `--text-secondary` |
| `#aaaaaa` | `--neutral-400` | `--text-muted` |
| `#34d399` | `--wind-calm`（Wind Sensor Colors 独立カテゴリ、§ 2.5） | `--wind-linked`（Wind Monitor Industrial Palette、§ 2.6） |

※ 本表の9組（`--border-focus` ペアを除く）は「Semantic → Primitive var() 参照化」PR（2026-04-19）により、Semantic 側が `var(--primitive)` を参照する形へ書き換え済み。`--border-focus` ペアのみ、§2.10.2 の「`--blue-500` への統合」方針検討待ちのため参照化を保留している。

※ `#34d399` 行について: 表の列ラベル「Primitive | Semantic」は維持するが、本行は厳密には Primitive ↔ Semantic の二層構造ではなく、「Wind Sensor Colors（独立カテゴリ）↔ Wind Monitor Industrial Palette（独立パレット内の意味論別トークン）」のエイリアス関係である。風速カテゴリ表現（穏やか）と接続状態表現（LINKED）という意味論の違いを保持するため、両者を別トークンとして独立維持する。

**改定履歴**:

- 2026-04-19: 初版作成（2-c 棚卸し結果）
- 2026-04-19: 9組を var() 参照化（§2.11.4 解消）
- 2026-04-24: `--wind-calm` ⇔ `--wind-linked` エイリアスを追加（PR β X-2 / PR #91、PR β X-3 / PR #92）
- 2026-04-25: `--accent-blue` を `--blue-500` にリネーム（PR α、派生：§ 7.2 Buttons 全面実装）

#### 2.11.3 使い分けルール

コンポーネント実装では以下の優先順位に従う:

1. **Semantic を優先使用**: `color: var(--text-primary)` と書く（`color: var(--neutral-800)` と書かない）
    - 意味論的な意図がコードから読み取れる
    - 将来 Semantic 側だけ値を変えた時に影響範囲が限定される
2. **Primitive の直接使用は例外**: 「文字色でも背景色でも状態色でもない、純粋に配色パレットとしての使用」に限る。該当ケースは極めて少ない（現状ほぼない）
3. **微差トークン新規作成の禁止**: RGB 各成分 ±16 以内の微差で新トークンを作ることは禁止。真に意味が異なる場合（RGB 差が各成分 ±16 超、または用途が明確に分離する場合）のみ別トークン化する
4. **新規トークン追加時のフロー**は `.claude/rules/known-pitfalls.md` の「デザイントークン整理 > セマンティックカラー」セクションを参照

#### 2.11.4 解消済み履歴（Semantic → Primitive var() 参照化）

§2.11.2 の表に掲げた完全重複ペアのうち、`--border-focus` ペアを除く9組（11 Semantic 行）について、Semantic トークンが Primitive を `var()` 参照する形への書き換えを実施済み（2026-04-19、「Semantic → Primitive var() 参照化」PR にて）。

- 書き換え前: `--text-primary: #14365a;`
- 書き換え後: `--text-primary: var(--neutral-800);`

これにより Primitive 側の値変更が Semantic 側へ自動反映される保守性の高い構造となった。3 桁／6 桁 hex 表記ゆれも本書き換えにより解消（Semantic 側の `#fff`, `#888`, `#aaa` がすべて `var(--primitive)` に置換されたため）。

`--border-focus` ペアは §2.10.2 で予告されている「`--blue-500` への統合」方針の検討待ちのため、本タスクでは参照化を保留とした（§2.11.2 の注記を参照）。

#### 2.11.5 Wind Direction Palette（独立パレット）

WindMonitor の方位識別専用の独立パレット（5 トークン）。§ 2.5 Wind Sensor Colors（暖色：緑〜黄〜オレンジ〜赤）と色相で完全分離されたティール→パープルの寒色グラデとして設計されており、同一画面に共存しても意味論衝突が発生しない構造を持つ。

##### トークン定義

| トークン | 値 | 対応方位 | 角度 |
|---|---|---|---|
| `--wind-dir-calm` | `#5eead4` | 追（追い風） | 0° |
| `--wind-dir-near` | `#67e8f9` | 追右・追左 | 45° / 315° |
| `--wind-dir-side` | `#60a5fa` | 右・左 | 90° / 270° |
| `--wind-dir-far` | `#818cf8` | 向右・向左 | 135° / 225° |
| `--wind-dir-head` | `#c084fc` | 向（向かい風） | 180° |

##### 配色設計の意図

- 中心の「追」（追い風 = 戦略影響軽微）を清涼なティール
- 反対側の「向」（向かい風 = 戦略影響大）を警戒感のあるパープル
- 左右対称に寒色グラデで色相遷移
- Wind Sensor Colors（暖色）が風速強度を担い、Wind Direction Palette（寒色）が方位識別を担う
- 両パレットの色相分離により、WindMonitor 画面で風速数値（暖色で風速カテゴリ表現）と方位コンパス（寒色で方位表現）が同時表示されても意味論衝突なし

##### § 10.2 との整合（第2弾C C-a で違反解消済み、2026-04-21）

DIRECTION_ITEMS は 2026-04-20 時点で § 2.5 Wind Sensor Colors と hex 完全同一（暖色系）であったため、§ 10.2「Wind Ramp 色をスコアヒートマップに流用禁止」の原則に抵触していた。第2弾C C-a（PR #81）にて寒色系独立パレットへ移行し、Wind Sensor Colors（暖色）と色相で完全分離。CompassGauge 中央矢印・中央テキスト・サブタイトル・Timeline グラフ下色帯はすべて DIRECTION パレットに切り替わった。詳細は § 9.3.5 参照。

##### 使用範囲

- WindMonitor CompassGauge: 8 方位ラベル色、BEARING 数値色、セクター放射グラデ色（ただし PR β X-3 実装では CompassGauge のセクター塗りは `--wind-accent`（cyan）に変更され、DIRECTION パレットの使用は 8 方位ラベル強調時のみに縮小）
- WindMonitor WindChart: タイムライン下部の風向色帯（`calcRelativeWind(sample).color`）
- InstrumentDeckPad / InstrumentDeckPhone: サブタイトル / SKITTLE DIRECTION ラベル色（接続時に相対風向の方位色を使用）
- GameScreen: 使用禁止（Wind Vector Widget は Wind Ramp 色のみ使用）

---

## 3. Typography

### 3.1 設計原則

- **2-axis scale**: サイズとウェイトの2軸で階層を作る
- **本文デフォルトは bold**: 屋外iPad視認性の名残として、本文デフォルトウェイトは `700`（bold）。通常のWebアプリの 400/500 デフォルトとは異なる
- **数値タイポは専用フォント**: 主要数値には `--font-instrument`（JetBrains Mono）を使い、計器的な精度感を演出
- **中間値の排除**: `13px` / `15px` / `17px` 等の微妙な中間サイズは廃止。スケールの一貫性を優先

---

### 3.2 Font Size Scale（12段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--text-xs` | `11px` | 最小ラベル、バッジ内テキスト、補助説明 |
| `--text-sm` | `12px` | 小ラベル、補足テキスト、単位 |
| `--text-base` | `14px` | 本文標準、テーブル数値セル |
| `--text-md` | `16px` | ボタンテキスト、入力欄、強調本文 |
| `--text-lg` | `18px` | サブ見出し、小カードタイトル |
| `--text-xl` | `20px` | セクション見出し、Wind Vector Widget数値 |
| `--text-2xl` | `24px` | 画面見出し、Modalタイトル |
| `--text-3xl` | `30px` | 統計カードの主要数値 |
| `--text-4xl` | `38px` | Stats KPI |
| `--text-5xl` | `48px` | アプリタイトル、GameScreenの現在点数 |
| `--text-6xl` | `72px` | WindMonitorのHero数値、主役最大値 |
| `--text-7xl` | `88px` | 最大級ディスプレイ用（現状未使用、将来予約） |

**中間サイズ（廃止）**: `13px`, `15px`, `17px`, `22px`, `26px`, `36px` 等は新規コードで使用禁止。既存コードで発見された場合は最近接のトークン値に寄せる。

### 3.3 Font Weight（5段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--weight-medium` | `500` | 補助テキスト、キャプション、ソフトな強調 |
| `--weight-semibold` | `600` | テーブル数値、ラベル強調、サブ見出し |
| `--weight-bold` | `700` | **本文デフォルト**、方向ラベル、見出し標準 |
| `--weight-extrabold` | `800` | 主役見出し、ページタイトル |
| `--weight-black` | `900` | 最大強調、Hero数値、勝利演出 |

**注意**: `400`（normal）は原則使用しない。`500`（medium）以上が本アプリの下限。

### 3.4 Font Family

| トークン | 値 | 用途 |
|---|---|---|
| `--font-sans` | `'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, sans-serif` | 本文・見出し・UI全般 |
| `--font-mono` | `ui-monospace, 'SF Mono', Menlo, monospace` | コード表示、等幅が必要な表組み |
| `--font-instrument` | `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` | 主要数値・計器的テキスト |

#### `--font-instrument` の Webフォント導入

`JetBrains Mono` はシステムフォントにないため、Webフォント読み込みが必要。`index.html` に以下の link タグを配置する方式で導入済み（Step 4 第2弾E、2026-04-20）:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap">
```

self-host は採用しなかった（実装コスト最小化と外部依存許容の判断による）。

### 3.5 `--font-instrument` の使用範囲

モルックスコアラーでは、**特定の主要数値テキスト**に限定して使用する。無差別使用は禁止。

#### ✓ 使用対象

- **Stats**: KPIブロックの大型数値、レーダーチャート軸ラベル、試合カードのスコア「50」、プレイヤーテーブル/詳細指標テーブルの数値セル
- **GameScreen**: Wind Vector Widget の風速数値と単位
- **WindMonitor**: Hero風速数値、統計カード数値、軸ラベル、単位
- **SetupScreen**: サブタイトル「MÖLKKY SCORER」、Raspberry Pi アドレス入力値
- **Settings**: 同期コード入力値、デバイス同期式

**実装状況（2026-04-24 時点）**: Step 4 第2弾E で GameScreen Wind Vector Widget 風速数値・単位に `var(--font-instrument)` 適用済み（4 要素構成、第2弾C C-d / C-e 経由）。PR β X-3（PR #92、2026-04-24）で WindMonitor（`src/components/WindMonitorModal.jsx`）の以下の箇所にも `'JetBrains Mono', monospace` / `var(--font-instrument)` 相当を全面適用済み:

- Hero 風速数値（InstrumentDeckPhone 88px / InstrumentDeckPad 120px）
- Hero 単位「m/s」（Phone 16px / Pad 22px）
- BEARING 数値ラベル（CompassGauge 内、cyan accent）
- CompassGauge 度数ラベル（030° / 060° / 120° / 150° / 210° / 240° / 300° / 330°）
- BezelPanel タイトル切り欠き（WIND · NOW / COMPASS · 045° / PEAK / AVG / BAT / TIMELINE · 5 MIN）
- BezelPanel コーナーラベル（m/s / 5min / OK / R.S-7 / `0.0 m/s →` 等）
- DeckHeader の WIND · MONITOR / T+ タイマー / LINKED · DISCONNECTED
- DeckFooter の `WX-02 ▪ FW 1.4.2` / `SIG -- dBm` / `1 Hz`
- PEAK / AVG / BAT 統計カード数値・ラベル
- WindChart Y 軸数値ラベル（yMax / yMax/2 / 0.0）
- レンジゲージ上の CALM / MODERATE / STRONG / SEVERE ラベル
- レンジゲージ目盛り（0 / 2 / 3.5 / 5+）

Stats / SetupScreen / Settings への適用は後続の独立タスクで段階移行する。

#### ✗ 使用禁止

- 本文・通常テキスト
- セクション見出し・サブ見出し
- ボタンラベル・ナビゲーションラベル
- 日本語文字列（等幅英文用のため、日本語との混在で可読性が落ちる）

**設計パターン例（日本語の扱い）**: CompassGauge の 8 方向ラベル（追 / 追右 / 右 / 向右 / 向 / 向左 / 左 / 追左）は `fontFamily="-apple-system, 'Hiragino Sans', sans-serif"` を使用し、`--font-instrument` を適用しない。同じ CompassGauge 内で度数ラベル（030° / 060° / ... / 330°）と BEARING 数値は `'JetBrains Mono', monospace`（= `--font-instrument`）を使用しており、**英数字と日本語で font-family を明示的に分岐させる**ことで本原則を実装する。WindMonitorModal では多くの要素でこのパターンが使われている（例: DeckHeader 閉じるボタンは `-apple-system, 'Hiragino Sans'` + 日本語テキスト「← 閉じる」、WIND · MONITOR / T+ タイマー / LINKED は `'JetBrains Mono', monospace`）。

### 3.6 タイポグラフィ組み合わせ原則

#### 階層表現の4パターン

| 階層 | サイズ | ウェイト | 色 | 用途 |
|---|---|---|---|---|
| 主役 | `--text-5xl` 以上 | `--weight-extrabold` | 最高コントラスト | ページの唯一の主役 |
| 主要 | `--text-xl`〜`--text-3xl` | `--weight-bold` | 高コントラスト | 見出し、主要数値 |
| 標準 | `--text-base`〜`--text-md` | `--weight-bold` | 標準コントラスト | 本文、ラベル |
| 補助 | `--text-xs`〜`--text-sm` | `--weight-medium` | 低コントラスト | 補足、単位、キャプション |

#### ✗ 禁止パターン

- 1画面内に主役階層を配置（主役は原則1つ。例外として「ダブル主役」が明示的に指定された場合は最大2つまで許容、自主判断での増加は禁止）
- `--weight-medium` を本文で使用（本アプリの本文下限は `--weight-bold`）
- 日本語テキストに `--font-instrument` を適用
- サイズスケール外の値（`13px`, `15px` 等）を新規使用

#### ✓ 推奨パターン

- 主役階層は1画面1箇所限定（例外: WindMonitor の「風速数値×コンパス」のようにダブル主役が本ファイルで明示的に指定されている場合は最大2つ）
- 数値は `--font-instrument`、説明文は `--font-sans` で対比
- letter-spacing は英字の小文字ラベル（例: `MÖLKKY SCORER`）で 0.2〜0.3em 取ると計器的な高級感が出る

---

## 4. Spacing Scale

### 4.1 設計原則

- **Tailwind互換命名**: `--space-2`, `--space-4` 等。数値は `0.25rem = 4px` 単位のTailwind慣例を踏襲
- **基本単位は 8px（`--space-2`）**: 多くの要素間マージン・パディングの出発点
- **中間値（.5系）の位置づけ**: 公式に許容。ただし新規コードでは整数系を優先し、`.5` は微調整が本質的に必要な場合のみ使用
- **タッチターゲット下限 44px**: `--space-11` 相当。これ以下のサイズはインタラクティブ要素に使わない

---

### 4.2 Spacing Scale（16段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--space-px` | `1px` | ボーダー、ヘアライン、分離線 |
| `--space-0.5` | `2px` | 極小ギャップ、バッジ内上下余白 |
| `--space-1` | `4px` | アイコンと文字の間、密集要素のギャップ |
| `--space-1.5` | `6px` | 小バッジ内パディング |
| `--space-2` | `8px` | **基本単位**、標準ギャップ、ボタン内上下パディング |
| `--space-2.5` | `10px` | やや広めのギャップ、スモールカード内パディング |
| `--space-3` | `12px` | 要素間ギャップ標準、チップ内パディング |
| `--space-3.5` | `14px` | 中間サイズ、ラベルとインプット間 |
| `--space-4` | `16px` | カード内パディング、セクション内要素間 |
| `--space-4.5` | `18px` | 若干広めのセクション区切り |
| `--space-5` | `20px` | 中カード内パディング、見出しと本文間 |
| `--space-6` | `24px` | 主要カード内パディング、画面端マージン |
| `--space-7` | `28px` | セクション区切り |
| `--space-8` | `32px` | 大きめセクション区切り、主要ブロック間 |
| `--space-10` | `40px` | 画面の大区切り |
| `--space-11` | `44px` | **タッチターゲット下限** |
| `--space-12` | `48px` | ページヘッダー高さ、主役ブロック周囲 |

### 4.3 タッチターゲット

インタラクティブ要素（ボタン・トグル・リンク・チェックボックス・セグメントボタン）の**最小サイズは 44×44px** (`--space-11`)。視覚的サイズが小さい場合も、タップ判定エリアをパディングで 44px 以上に拡張する。

```css
/* 視覚的に小さいアイコンボタンでも、タップエリアは44px確保 */
.icon-button {
  width: var(--space-11);
  height: var(--space-11);
  padding: var(--space-2);  /* アイコン自体は 28×28 程度 */
}
```

### 4.4 余白の4つの役割

余白は単なる空白ではなく、情報設計における4つの役割を持つ。

| 役割 | 説明 | 使用例 |
|---|---|---|
| **近接** | 関連する要素を同じグループと認識させる | ラベル下の小さな余白 (`--space-1`) |
| **分離** | 異なるグループを視覚的に分ける | セクション間の余白 (`--space-6`〜`--space-8`) |
| **呼吸** | 画面全体の密度を調整、品位を作る | カード内のゆとり (`--space-5`〜`--space-6`) |
| **強調** | 主役の周囲に余白を多く取ることで浮かび上がらせる | Hero要素の周囲 (`--space-10`〜`--space-12`) |

設計時は「この余白はどの役割か？」を問い、適切なトークンを選ぶ。

### 4.5 画面構成での余白

- ページ左右マージン: `--space-6`（24px）標準、iPad横向きは `--space-8` 以上
- カード同士の垂直間隔: `--space-4`〜`--space-6`
- カード内のセクション間: `--space-4`〜`--space-5`
- ラベルと入力要素の間: `--space-2`〜`--space-3`
- 同じグループ内の要素間: `--space-2`〜`--space-3`
- 異なるグループの境界: `--space-6` 以上

### 4.6 ✗ 禁止パターン

- スケール外の値（`7px`, `13px`, `27px` 等）の新規使用
- インタラクティブ要素に44px未満のタッチターゲット
- `--space-px` `--space-0.5` をインタラクティブ要素のパディングに使用
- 余白の役割を考えずに「なんとなく」で値を決める

### 4.7 ✓ 推奨パターン

- 基本単位 `--space-2` (8px) から出発し、必要に応じて倍数で増やす
- 同じ役割の余白は同じトークンで統一する（一貫性）
- 主役要素は周囲に余裕のある余白（`--space-8` 以上）で際立たせる
- iPad横向き・縦向き・iPhone縦向きでの表示を確認して余白を調整

---

## 5. Radius & Shadow

### 5.1 設計原則

- **Radius は要素の性格を表現**: 鋭利な角（`xs`）は硬質・技術的、丸い角（`2xl`）は柔らか・親しみ
- **Shadow は奥行きを作る**: 背景との距離感、主役/脇役の階層、インタラクション応答の表現
- **Shadow は過剰に使わない**: ダーク背景上では特に控えめに（白シャドウは逆効果）
- **既存エイリアス維持**: 既存のCSS変数は定義値のみ更新し、参照コード側は破壊しない

---

### 5.2 Border Radius（7段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--radius-xs` | `4px` | 小バッジ、棒グラフ棒、タグ |
| `--radius-sm` | `8px` | 小カード、インプット、ドロップダウン |
| `--radius-md` | `10px` | ~~ボタン、セグメントボタン、中カード~~ 廃止済み（C-c1、使用 0 件により） |
| `--radius-lg` | `12px` | 標準カード、Modal、テーブル |
| `--radius-xl` | `16px` | 主役カード、大きめ Modal |
| `--radius-2xl` | `20px` | Hero要素、特別なブロック |
| `--radius-full` | `9999px` | pill、円形ボタン、ドット、トグル |

**既存エイリアス変更（第2弾C C-c2 で実施済み）**:
- `--radius-sm` の定義値を `6px` → `8px` に変更済み（C-c2）
- `--radius-lg` の定義値を `14px` → `12px` に変更済み（C-c2）
- `--radius-xl` の定義値を `18px` → `16px` に変更済み（C-c2）

**注意（履歴）**: Step 4 第1弾では実コードの `--radius-*` 定義値変更は行わなかった。視覚変化を伴う変更のため、別途モックアップ検証を経て第2弾C C-c2 で適用済み。変更履歴は §2.10.2 および §2.10.3 を参照。

### 5.3 Radius 選定ガイド

| 要素の性格 | 推奨Radius |
|---|---|
| 計器的・技術的・硬質（WindMonitor統計カード、棒グラフ棒） | `--radius-xs`〜`--radius-sm` |
| 標準UI要素（ボタン、インプット、通常カード） | `--radius-sm`〜`--radius-lg` |
| 主役・特別扱い（Tier 1カード、Hero） | `--radius-xl`〜`--radius-2xl` |
| 完全円形（ドット、pill、トグル、スキットルボタン） | `--radius-full` |

### 5.4 Box Shadow（8段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--shadow-none` | `none` | 平坦な要素、ダーク背景の埋め込み要素 |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.2)` | 軽い浮き、Tier 3要素、hover前 |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.18)` | **標準カード**、Tier 2要素 |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.3)` | 主役カード、Tier 1要素 |
| `--shadow-xl` | `0 10px 36px rgba(0,0,0,0.25)` | Modal、オーバーレイ、ポップオーバー |
| `--shadow-glow-blue` | `0 3px 12px rgba(43,125,233,0.3)` | 風速計連携カード、青系強調 |
| `--shadow-glow-green` | `0 3px 12px rgba(52,211,153,0.28)` | クラウド同期ステータス、成功系強調 |
| `--shadow-glow-yellow` | `0 4px 18px rgba(255,193,7,0.25)` | ゴールド系強調、勝利演出 |

### 5.5 Shadow 階層原則

画面内の Shadow 強度は情報階層と一致させる。

| 情報階層 | Shadow |
|---|---|
| 主役（Tier 1） | `--shadow-lg` |
| 独立カード（Tier 2） | `--shadow-md` |
| サブ要素（Tier 3） | `--shadow-sm` or `--shadow-none` |
| Modal・オーバーレイ | `--shadow-xl` |
| 特別強調（呼吸・接続成功） | `--shadow-glow-*` |

**重要**: Shadow の強度が情報階層を反映していない（Tier 3にTier 1より強い影が付いているなど）と、視線誘導が崩壊する。

### 5.6 Glow Shadow の使い方

Glow系シャドウ（`--shadow-glow-*`）は**特定の意味を持つ要素にのみ**使用する。装飾目的での流用は禁止。

| Glow | 使用対象 |
|---|---|
| `--shadow-glow-blue` | 風速計連携カード（WindMonitor世界観）、接続テスト中のインジケーター |
| `--shadow-glow-green` | クラウド同期済みステータス、接続成功ドット |
| `--shadow-glow-yellow` | 11・12点の棒グラフ強調、勝利時の演出 |

### 5.7 ダーク背景での Shadow

ダーク背景（`--neutral-900`, `--neutral-950`）上では通常の黒シャドウは効果が薄い。代わりに:

- **Glow シャドウ**で色による浮き上がりを表現
- **内側シャドウ**（`inset`）で凹感を表現
- **微グラデーション**（上端2%明化）で立体感を補完

```css
/* ダークカードの浮遊感表現例 */
.tier-1-card-dark {
  background: linear-gradient(to bottom, rgba(255,255,255,0.02), transparent 40%), var(--neutral-900);
  box-shadow: var(--shadow-lg);
  border-radius: var(--radius-xl);
}
```

### 5.8 ✗ 禁止パターン

- Tier 3要素に Tier 1 相当の強いシャドウを使う（階層破壊）
- Glow シャドウを装飾目的で濫用
- ダーク背景上で黒シャドウを強く効かせる（効果が薄く、ノイズになる）
- スケール外の独自シャドウ値をインラインで定義（例: `box-shadow: 0 5px 15px black;`）
- 1画面内に4種類以上のシャドウを混在させる（視覚的混乱）

### 5.9 ✓ 推奨パターン

- 情報階層と Shadow 強度を一致させる
- Glow は意味を持つ要素にのみ限定
- ダーク背景ではグラデーションと Glow を組み合わせて奥行きを作る
- 同じ階層の要素は同じシャドウトークンで統一

---

## 6. Motion

### 6.1 設計原則

- **3段階のトランジション**: fast / normal / slow の3種で統一。中間値の無差別使用を禁止
- **Whoop的な微動**: 派手なアニメーションではなく、控えめで一貫した規則的な振る舞いで「生きている感じ」「計器的な精度感」を演出
- **パルス/脈動は1画面に1〜2箇所限定**: 呼吸は「最も注目すべき1点」に集中させる
- **イージングは `ease` を基本**: 自然な減速感。特殊な表現が必要な場合のみ `cubic-bezier()` を使う

---

### 6.2 Transition Timing（3段階）

| トークン | 値 | 主な用途 |
|---|---|---|
| `--transition-fast` | `0.15s ease` | 微細な反応（hover色変化、ボタン押下） |
| `--transition-normal` | `0.2s ease` | **標準**、大部分のインタラクション |
| `--transition-slow` | `0.3s ease` | 大きな状態変化（モーダル開閉、タブ切替） |

**原則**: 新規実装では上記3トークンのみ使用。0.25s や 0.4s などの独自値は避ける。

### 6.3 特殊イージング

スライド遷移など、より自然な減速感が必要な場合:

```css
/* Apple的なスライド遷移 */
transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
```

使用対象: タブ切替のスライド、Modal のスライドイン、スクロール連動アニメ。

### 6.4 マイクロアニメーション6種

Stats画面で採用されるフル展開セットを、他画面も参照可能な共通アニメ語彙として定義する。

| 種類 | 説明 | 推奨パラメータ |
|---|---|---|
| **初回描画** | グラフ・チャートの初期描画 | 0.6〜1.0秒、stagger（段差）あり |
| **カウントアップ** | 数値が0から実値まで上昇 | 0.4〜0.8秒、ease-out |
| **hover反応** | 要素に触れた時の応答 | `scale(1.01〜1.05)` + 影深化、0.2秒 |
| **in-view フェードイン** | スクロールで画面に入った瞬間 | 下から20px + 透明度、0.4秒 |
| **パルス/脈動** | 呼吸感、規則的な注目誘導 | 2〜3秒周期、`scale(1.0→1.015〜1.15→1.0)` |
| **スライド遷移** | タブ切替・Modal出現 | 0.25〜0.35秒、`cubic-bezier(0.4, 0, 0.2, 1)` |

### 6.5 Whoop的な動きの定義

「Whoop的な動き」とは以下の特徴を持つ:

#### ✓ Whoop的な動きの特徴

- **控えめ**: スケール変化 1.01〜1.05倍程度、透明度変化 0.2〜0.3程度
- **規則的**: パルスは明確な周期（2秒または3秒）、心拍のような安定感
- **短い**: 大部分が 0.2〜0.3秒で完結
- **目的を持つ**: 計測完了の演出、状態変化の通知、注目誘導など意味がある
- **連動する**: スケールと影、透明度とグロウを組み合わせて自然な厚みを作る

#### ✗ Whoop的でない動き（避ける）

- **バウンス**: 跳ねる、おもちゃっぽい
- **ズーム**: 画面切替で派手に拡大/縮小
- **パーティクル**: 紙吹雪、星の散らばり、爆発系エフェクト
- **速すぎ/遅すぎ**: 0.15秒未満は視認困難、0.6秒超は待たされ感

### 6.6 パルス/脈動の使用ルール

呼吸は情報的意味を持つため、使用場所を厳しく限定する。

#### ✓ 使用対象

| 画面 | 対象 | 周期 | 意味 |
|---|---|---|---|
| WindMonitor | 現在風速の Hero数値 | 3秒 | リアルタイム計測中 |
| Settings | クラウド同期済み緑ドット | 2秒 | 同期アクティブ |
| SetupScreen | 接続成功時の風速計ドット | 2秒 | 接続OK |
| Stats | 最頻スコア or 最優秀指標 | 3秒 | 画面内1箇所限定 |

#### ✗ 禁止事項

- 1画面に2箇所以上のパルス同時適用（呼吸の意味希釈）
- 装飾目的のパルス（意味のない呼吸）
- 1秒未満の速いパルス（心拍として速すぎ、不安を煽る）
- 5秒超の遅いパルス（呼吸として鈍く、停止と区別できない）

### 6.7 prefers-reduced-motion 対応

ユーザーが OS レベルで動きを抑える設定をしている場合、マイクロアニメは無効化する。

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01s !important;
  }
}
```

ただしトランジション（色変化等）は極短時間で保持する（完全停止はUIの応答性を損なう）。

### 6.8 ✗ 禁止パターン

- 独自の秒数（0.25秒、0.4秒等）を新規コードで多用
- パルスを装飾目的で複数配置
- バウンス・ズーム・パーティクル系のおもちゃっぽい動き
- タブ切替・モーダル開閉をアニメなしで瞬間切替（品位低下）

### 6.9 ✓ 推奨パターン

- 3トークン（fast/normal/slow）で統一
- インタラクティブ要素には必ず 0.2秒のトランジションを付ける
- 初回描画は in-view + stagger で段階的に見せる
- パルスは1画面1箇所の主役にのみ

---

## 7. Component Stylings

### 7.1 設計原則

- **トークン組み合わせで定義**: 各コンポーネントは色・タイポ・余白・角丸・影のトークン組み合わせで記述
- **状態の網羅**: 通常・hover・active・disabled・focus を明示
- **バリアント最小化**: Button なら Primary/Secondary/Danger/Ghost の4つで足りる。むやみに増やさない
- **使用例コード付き**: 実装時のコピペ元として、インラインstyle記法で例を併記

---

### 7.2 Button

#### Primary（主要操作）

```jsx
<button style={{
  background: 'var(--blue-500)',
  color: 'var(--neutral-0)',
  padding: 'var(--space-3) var(--space-6)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--text-md)',
  fontWeight: 'var(--weight-bold)',
  boxShadow: 'var(--shadow-sm)',
  transition: 'var(--transition-normal)',
  minHeight: 'var(--space-11)',
}}>
  接続テスト
</button>
```

| 状態 | スタイル |
|---|---|
| 通常 | 背景 `--blue-500`、文字 `--neutral-0`、`--shadow-sm` |
| hover | 背景 `--blue-700`、`--shadow-md` |
| active | 背景 `--blue-700`、`transform: scale(0.98)` |
| disabled | 背景 `--neutral-300`、文字 `--neutral-500`、`--shadow-none` |
| focus | 外周に `--blue-500` 2px outline（2pxオフセット） |

#### Secondary（補助操作）

| 状態 | スタイル |
|---|---|
| 通常 | 背景 `--neutral-0`、文字 `--blue-500`、ボーダー `--blue-500` 1px |
| hover | 背景 `--blue-50` |
| active | 背景 `--blue-100` |
| disabled | 背景 `--neutral-100`、文字 `--neutral-400` |

#### Danger（削除・破壊的操作）

| 状態 | スタイル |
|---|---|
| 通常 | 背景 `--danger`、文字 `--neutral-0` |
| hover | Primary/Secondary と整合させ固定トークン方式を採用する方針（具体値は将来タスクで確定、下記注記参照） |
| active | `transform: scale(0.98)` |

**hover 設計方針（第2弾B-β 確定）**: Primary/Secondary と整合させ固定トークン方式を採用する方針。具体値（`--danger-hover` 新設 or `--danger-dark` 再定義）と hover 実装方式は β 完遂後の独立タスク『ボタン hover 実装統一』で確定する。現時点では Danger ボタンに hover 実装は存在しない（全てインラインスタイル）。

**使用制限**: 削除・リセット・不可逆的な操作にのみ使用。キャンセル・閉じる等の通常操作に使わない。

#### Ghost（テキストボタン）

| 状態 | スタイル |
|---|---|
| 通常 | 背景 transparent、文字 `--text-primary`、ボーダーなし |
| hover | 背景 `--neutral-100` |
| active | 背景 `--neutral-200` |

#### ✗ ボタン使用禁止

- 同じ画面に Primary ボタンを3つ以上配置（主従関係が曖昧になる）
- 全ボタンを Primary にする（全てが主役＝主役なし）
- タッチターゲット 44px 未満（`--space-11` 以上を確保）
- Team Color をボタン背景に流用

---

### 7.3 Card / 情報ブロック

#### 標準カード（ライト）

```jsx
<div style={{
  background: 'var(--neutral-0)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
  boxShadow: 'var(--shadow-md)',
}}>
  {/* content */}
</div>
```

#### 標準カード（ダーク）

```jsx
<div style={{
  background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent 40%), var(--neutral-900)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-5)',
  boxShadow: 'var(--shadow-md)',
}}>
  {/* content */}
</div>
```

#### Active カード（選択状態）

- 外周にアクセント色の帯（左端 4px）または光輪（`box-shadow: 0 0 0 3px rgba(color, 0.25)`）
- 背景は通常時と大きく変えない（過剰な強調を避ける）

#### 情報ブロック原則

カードは単なる視覚的区切りではなく「同じ物事を語る情報のまとまり」。1つのカード内に複数の主題を詰め込まない。

- チーム情報ブロック = チーム名 + プレイヤー名 + 点数 + ミス（4要素で1つのまとまり）
- 風速計連携カード = トグル + アドレス + キャリブ + テスト（接続設定の1つのまとまり）

#### ✗ カード使用禁止

- 関係のない情報を1カードに詰め込む（情報ブロックの原則違反）
- Shadow 階層を情報階層と不一致にする（Tier破壊）
- ダーク背景上で白シャドウを使う

---

### 7.4 Input / Form

#### Text Input（ライト）

```jsx
<input style={{
  background: 'var(--neutral-0)',
  color: 'var(--text-primary)',
  border: '1px solid var(--neutral-300)',
  borderRadius: 'var(--radius-sm)',
  padding: 'var(--space-3) var(--space-4)',
  fontSize: 'var(--text-md)',
  minHeight: 'var(--space-11)',
  transition: 'var(--transition-normal)',
}} />
```

| 状態 | スタイル |
|---|---|
| 通常 | 背景 `--neutral-0`、ボーダー `--neutral-300` |
| focus | ボーダー `--blue-500`、outline なし |
| error | ボーダー `--danger`、背景 `--danger-bg` |
| disabled | 背景 `--neutral-100`、文字 `--neutral-400` |
| placeholder | 文字 `--neutral-400` |

#### Text Input（ダーク）

| 状態 | スタイル |
|---|---|
| 通常 | 背景 `--neutral-800`、文字 `--neutral-0`、ボーダー `--neutral-700` |
| focus | ボーダー `--blue-500` |
| placeholder | 文字 rgba(255,255,255,0.4) |

#### Select / Dropdown

- Input と同じ背景・ボーダー・高さ
- 右端に下向き矢印アイコン（ライト: `--neutral-500`、ダーク: `--neutral-0` 60%）
- 開いた時のオプションリスト: 同じ背景色、選択項目 hover は `--blue-50`（ライト）/ `--neutral-700`（ダーク）

#### Toggle Switch

```jsx
{/* ON状態 */}
<div style={{
  width: 48,
  height: 28,
  borderRadius: 'var(--radius-full)',
  background: 'var(--blue-500)',  // ON色
  padding: 2,
  transition: 'var(--transition-normal)',
}}>
  <div style={{
    width: 24,
    height: 24,
    borderRadius: 'var(--radius-full)',
    background: 'var(--neutral-0)',
    transform: 'translateX(20px)',  // 右端
    transition: 'var(--transition-normal)',
  }} />
</div>
```

| 状態 | ON色 | OFF色 |
|---|---|---|
| 標準トグル | `--blue-500` | `--neutral-300`（ライト）/ `--neutral-700`（ダーク） |
| 成功系トグル | `--success` | 同上 |

---

### 7.5 Modal

#### Overlay + Container

```jsx
{/* Overlay */}
<div style={{
  position: 'fixed',
  inset: 0,
  background: 'var(--bg-overlay)',
  zIndex: 1000,
}}>
  {/* Container */}
  <div style={{
    background: 'var(--neutral-0)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--space-6)',
    boxShadow: 'var(--shadow-xl)',
    maxWidth: 600,
    margin: 'auto',
  }}>
    {/* content */}
  </div>
</div>
```

| 要素 | スタイル |
|---|---|
| Overlay | `rgba(0,0,0,0.55)`（`--bg-overlay`）、`backdrop-filter: blur(4px)` 任意 |
| Container | 背景 `--neutral-0` / `--neutral-900`、`--radius-xl`、`--shadow-xl` |
| スライドイン | 下から20px + フェード、0.3秒 |

#### Modal Header

- タイトル: `--text-2xl` / `--weight-bold`
- 閉じるボタン: 右端、Ghost ボタン、アイコン × + ラベル「閉じる」
- 下にボーダー `--neutral-100` 1px または余白 `--space-6`

#### 実装状態（2026-04-18 時点）

※ 実装注記: モーダル実装は現状 `style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)'}}` の直書きで、`--bg-overlay` は将来的な統一用途として保持。実コードからの参照はゼロ（2026-04-18時点）。

---

### 7.6 Page Header

GameScreen / Stats / SetupScreen のような画面遷移最上位のヘッダー。

```jsx
<header style={{
  background: 'var(--neutral-900)',
  color: 'var(--neutral-0)',
  padding: 'var(--space-4) var(--space-6)',
  minHeight: 'var(--space-12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}}>
  <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
    累計スタッツ
  </h1>
  <button>{/* 閉じるボタン */}</button>
</header>
```

- 背景: `--neutral-900`（ダーク固定、ライト画面でもヘッダーはダーク）
- テキスト: `--neutral-0`
- 左側: 戻るボタン or タイトル
- 右側: 閉じるボタン or アクションボタン
- 高さ: 最低 `--space-12`（48px）

---

### 7.7 Badge / Tag

#### 状態バッジ（成功・警告・エラー）

| 種類 | 背景 | 文字 |
|---|---|---|
| 成功 | `--success-bg` | `--success-dark` |
| 警告 | `--warning-bg` | `--warning-dark` |
| エラー | `--danger-bg` | `--text-danger` |
| 情報 | `--blue-50` | `--blue-700` |

※ エラー列の文字色は `--text-danger` (#c0392b) を使用する。`--success-dark` / `--warning-dark` と命名対称ではないが、#c0392b が DESIGN.md §2.4 で `--text-danger` として正典化されているため、重複トークン（`--danger-dark`）新設を避ける設計判断。詳細は §2.4 参照。

```jsx
<span style={{
  background: 'var(--success-bg)',
  color: 'var(--success-dark)',
  padding: 'var(--space-0.5) var(--space-2)',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-semibold)',
}}>
  設定済み
</span>
```

#### Pill バッジ（Wind Vector Widget 等）

- `--radius-full`
- 高さ `--space-11`（44px、タッチターゲット）
- アイコン + 数値 + ラベルの組み合わせ
- 詳細は 9.2 GameScreen 参照

#### Player Color バッジ

- プレイヤー色を薄背景（透明度0.15）+ プレイヤー色文字
- プレイヤー識別以外の目的で流用禁止

#### ✗ Badge 使用禁止

- Semantic Colors を装飾目的で流用
- 同じ画面に4種以上のバッジ色を混在（視覚的混乱）
- 本文中に大量のバッジを埋め込む（可読性低下）

---

### 7.8 Hex 配列スキットル番号ボタン（モルック固有）

モルックスコアラーのアイデンティティの一部として**永続化される独自コンポーネント**。番号配置・形状・6角形レイアウトは改変禁止。

- 円形ボタン（`--radius-full`）
- 番号: `--font-sans` / `--text-3xl`〜`--text-4xl` / `--weight-bold`
- 配置: 6角形レイアウト（上から 3-4-3-2 または類似の配列）
- 番号配置: 中央から外側へ数字順、モルックの戦略的視認性に最適化

詳細仕様は 9.2 GameScreen 参照。

---

### 7.9 ✗ コンポーネント全体の禁止事項

- 同じ用途のバリアントを無制限に増やす（Primary ボタンが5種類、など）
- トークンを使わずインラインで生値を記述
- 状態（hover/disabled/focus）を考慮しない実装
- タッチターゲット 44px 未満のインタラクティブ要素

### 7.10 ✓ 推奨パターン

- トークンの組み合わせで状態まで明示的に定義する
- バリアントは必要最小限、用途で分ける（Primary/Secondary/Danger/Ghost）
- 状態変化には必ずトランジションを付ける
- 同じコンポーネントは画面横断で同じ仕様を使う

---

## 8. Layout Principles

### 8.1 設計原則

- **情報ブロック単位で設計**: 画面を要素単位ではなく「同じ物事を語る情報のまとまり」で分割して設計する
- **視線誘導はレイアウト・位置・サイズが主軸**: 色は補助。屋外視認性・ダーク/ライトを問わず使える普遍的手法
- **余白で階層を作る**: 要素間の距離そのものが情報階層を表す
- **画面は必ず実機で検証**: iPad横向き・iPad縦向き・iPhone縦向きの3パターンで必ず確認

---

### 8.2 情報ブロック（Information Block）

#### 定義

「同じ物事を語る要素のまとまり」を1つの視覚的単位として扱う設計概念。モルックスコアラーの全画面設計の基底となる。

#### 代表例

| 画面 | 情報ブロック例 | 構成要素 |
|---|---|---|
| GameScreen | チーム情報ブロック | チーム名 + プレイヤー名 + 点数 + ミスインジケーター |
| GameScreen | Wind Vector Widget | 矢印 + 風速 + 単位 + 方向 |
| Stats | プレイヤー選択カード | チェックボックス + 名前 + プレイヤー色帯 |
| Stats | スコア分布プレイヤー行 | プレイヤー名 + 12マスヒートマップ + 分析結果 |
| SetupScreen | 風速計連携カード | トグル + アドレス + キャリブ + テストボタン |

#### 情報ブロックの4原則

1. **近接**: 同じブロック内の要素は近く（`--space-2`〜`--space-3`）、ブロック間は離す（`--space-4` 以上）
2. **整列**: ブロック内の要素は1つの軸（左揃え or 中央揃え）で揃える
3. **完結**: 1ブロックは他ブロックに依存せず単独で意味が通る
4. **単一主題**: 1ブロックに複数の主題を詰め込まない

#### ✗ 禁止パターン

- 関係ない情報を1ブロックに混在させる（例: 風速情報とプレイヤー情報を同じカード内に）
- 情報ブロック内で整列軸が複数混在する
- ブロック境界が曖昧（余白が近すぎて隣と癒着）

---

### 8.3 視線誘導の主軸

視線誘導は以下の優先順位で設計する:

1. **レイアウト** (最優先) — 画面全体の構造・配置
2. **位置** — 画面上のどこに置くか（上部/中央/下部）
3. **サイズ** — 要素の大きさ・余白
4. **色** (補助) — 最後の調整

**色を主軸にしない**理由:
- 色覚多様性への配慮
- ダーク/ライトモード切替時の破綻回避
- 屋外視認性の劣化耐性

---

### 8.4 余白の役割（再掲・詳細）

6.4 で定義した4つの役割を、具体的なレイアウト設計に適用する。

| 役割 | 推奨値 | 使用例 |
|---|---|---|
| 近接（同グループ） | `--space-1`〜`--space-3` | ラベルと入力欄、アイコンと文字 |
| 分離（異グループ） | `--space-4`〜`--space-6` | カード間、セクション間 |
| 呼吸（密度調整） | `--space-5`〜`--space-6` | カード内パディング、画面端マージン |
| 強調（主役周囲） | `--space-8`〜`--space-12` | Hero要素、主役ブロック周囲 |

---

### 8.5 情報階層の4段（再掲・組み合わせ表）

タイポ・色・余白・シャドウの4要素を階層に応じて組み合わせる。

| 階層 | サイズ | ウェイト | 色（ライト） | 色（ダーク） | 影 | 周囲余白 |
|---|---|---|---|---|---|---|
| 主役 | `--text-5xl` 以上 | extrabold/black | 最高コントラスト | `--neutral-0` | `--shadow-lg` | `--space-8` 以上 |
| 主要 | `--text-xl`〜`--text-3xl` | bold | 高コントラスト | rgba(255,255,255,0.9) | `--shadow-md` | `--space-5`〜`--space-6` |
| 標準 | `--text-base`〜`--text-md` | bold | 標準コントラスト | rgba(255,255,255,0.8) | `--shadow-sm` or none | `--space-3`〜`--space-4` |
| 補助 | `--text-xs`〜`--text-sm` | medium | 低コントラスト | rgba(255,255,255,0.5) | none | `--space-2` |

---

### 8.6 背景の段階

画面内の背景レイヤーは情報階層と一致させる。

#### ライトモード

| レイヤー | 背景 | 用途 |
|---|---|---|
| ページ | `--neutral-50` | 最下層 |
| カード | `--neutral-0` | 標準要素 |
| 強調カード | `--neutral-0` + `--shadow-lg` | Tier 1 |
| 選択・hover | `--blue-50` | インタラクション応答 |

#### ダークモード

| レイヤー | 背景 | 用途 |
|---|---|---|
| ページ最下層 | `--neutral-950` | 画面背景 |
| ページ | `--neutral-950` + 微グラデ → `--neutral-900` | SetupScreen, Settings, WindMonitor |
| カード | `--neutral-900` + 上端2%明化の微グラデ | 標準ダークカード |
| 入力・セグメント非アクティブ | `--neutral-800` | インプット、非アクティブ状態 |
| ボーダー | `--neutral-700` | ダークカード内の境界 |

---

### 8.7 画面構成パターン（3種）

#### パターンA: iPad 横向き（1024px以上）

- メインコンテンツは 2カラム or 3カラム構成が可能
- サイドナビゲーション or タブ切替が横並び配置できる
- GameScreen は上下2分割（上: スコア表、下: 入力エリア）
- 画面端マージン: `--space-8`（32px）以上

#### パターンB: iPad 縦向き（768〜1024px）

- メインコンテンツは 1カラム or 2カラム
- タブ切替は横並び（ただし詰まる場合あり）
- GameScreen は左右2分割 or 上下2分割を切替
- 画面端マージン: `--space-6`（24px）

#### パターンC: iPhone 縦向き（max-width 480px）

- 1カラム強制
- 情報ブロックは縦積み
- Wind Vector Widget は簡略版（矢印 + 数値のみ）に切替
- 画面端マージン: `--space-4`（16px）

---

### 8.8 レスポンシブ方針

#### ブレイクポイント

| 名称 | 範囲 | 対象デバイス |
|---|---|---|
| `sm` | `max-width: 480px` | iPhone 縦向き |
| `md` | `481px` 〜 `1024px` | iPad 縦向き、iPhone 横向き |
| `lg` | `1025px` 以上 | iPad 横向き、デスクトップ |

#### 主要コンポーネントのレスポンシブ仕様

- **Wind Vector Widget**: `sm` で簡略版（矢印+数値のみ）、`md/lg` でフル表示
- **GameScreen スコア表**: `sm` で縦積み、`md` で横並び縮小、`lg` でフル表示
- **Stats レーダーチャート**: `sm` で幅100%、`md/lg` でアスペクト比維持
- **SetupScreen Tier 1 カード**: `sm` で縦積み、`md/lg` で2カラム配置可能

#### ✗ レスポンシブ禁止パターン

- `lg` 用レイアウトを `sm` に無理に詰め込む
- フォントサイズを画面幅で極端に縮小（本文は最低 `--text-base` 14px 維持）
- タッチターゲットを画面幅で 44px 未満に縮小
- iPad 横向き専用の UI を作り込み、他デバイスで破綻

### 8.9 安全領域（Safe Area）

iOS のノッチ・ホームインジケーター対応:

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

全画面表示の PWA として、最外周には必ず safe-area を考慮する。

---

### 8.10 ✗ レイアウト全体の禁止事項

- 情報ブロックの原則を無視した要素配置
- 色を視線誘導の主軸に据える
- 余白の役割を意識せず「なんとなく」で決める
- 実機での3パターン検証を省略する
- Tailwind系ブレイクポイント（`sm`, `md`, `lg`）のデフォルト値に無批判に従う（本ファイル定義値を優先）

### 8.11 ✓ 推奨パターン

- 情報ブロック単位で画面を設計する
- レイアウト・位置・サイズで視線を誘導し、色は補助に回す
- 余白の役割（近接/分離/呼吸/強調）を意識する
- 3デバイスパターンで必ず実機検証する

---

## 9. Screen-Specific Guidance

### 9.1 章の設計原則

- **画面は「最も求められる要素 × デザイン性」で設計**: 画面ごとに第一目的が異なる。その目的を最優先しつつ、高いデザイン性で仕上げる
- **ハイブリッド基調は画面単位で選ぶ**: 全画面ダークや全画面ライトに統一しない。各画面の性格で選択
- **画面別の質感アイデンティティを持つ**: 各画面に固有の「質感テーマ」を設定し、画面ごとの個性と全体の統一感を両立

#### 画面別方針サマリ

| 画面 | 最も求められる要素 | 基調 | 質感アイデンティティ |
|---|---|---|---|
| GameScreen | 視認性 | ダーク + 入力エリアはライト | 静謐な品位 × 視認性 |
| WindMonitor | 視認性 | ダーク | Apple Watch Ultra Industrial 美学 |
| Stats | 分析性 | ハイブリッド（ライト基調 + 可視化ブロックのみダーク） | 濃厚質感 × Strava/Whoop的ストイックさ |
| SetupScreen | 操作性 | ダーク | 世界観の入り口、計器盤のブランド刻印 |
| Settings | 操作性 | ダーク（SetupScreen と共通） | SetupScreen と連続性を保つ |

#### 本章の位置づけ（重要）

§9.2〜§9.6 は、現状の production 実装を正典化した記述である。
新規デザイン提案ではない。

参照順:
1. 第一正典: 実装コード本体（`src/components/GameScreen.jsx`, `src/components/WindMonitor.jsx` 等）と実機スクリーンショット
2. 第二正典: 本章（§9.2〜§9.6）の記述

本章の記述と実装が矛盾する場合、**実装が優先される**。
本章の記述を先に修正する PR を出してから、実装を追従させる方針は採らない。

---

### 9.2 GameScreen

#### 9.2.1 質感アイデンティティ

静謐な品位 × 視認性。試合の進行を妨げない落ち着きと、屋外iPadでの情報把握を両立する。ダーク基調のスコア表 + ライト基調の入力エリアという上下2層構成で、情報参照と操作を空間的に分離する。

#### 9.2.2 主役と情報階層

**主役**: アクティブチームの現在点数（1画面1箇所）

**4階層構成**:

| 階層 | 要素 | 表現 |
|---|---|---|
| 主役 | アクティブチームの点数 | `--text-5xl` / extrabold / 最高コントラスト |
| 主要 | アクティブチーム情報ブロック全体（名前・点数・ミス・Wind Vector Widget） | 帯状の強調背景 |
| 標準 | 非アクティブチーム情報、スコア表 | 標準コントラスト |
| 補助 | ヘッダーの試合目/ターン目表示、ナビゲーション | 低コントラスト |

#### 9.2.3 アクティブ/非アクティブの表現

**チーム色（§2.7 Team Colors）を使った識別**を正典とする。チーム色は「誰の情報か」を示す識別専用という §10.2 の原則に従い、GameScreen においてもこの枠組みでアクティブ/非アクティブを表現する。

| 状態 | 表現 |
|---|---|
| アクティブ | 背景 `--team-N-deep` 強調、文字 `--neutral-0`、左端にチーム色アクセント帯 4px（`--team-N-accent`） |
| 非アクティブ | 背景 `--team-N-light` 退色、文字 `--team-N-text` |

具体的な帯幅・退色度合い・枠の有無など詳細仕様は、現行 `src/components/GameScreen.jsx` の実装を正典とする（§9.1 の位置づけに基づく）。

#### 9.2.4 ヘッダー仕様

- 背景: `--neutral-900`、高さ `--space-12`（48px）以上
- 左側: 戻るボタン + メンバーアイコン（Ghost）
- 中央: **【必須】「N試合目 Nターン目」表示**（`--text-base`、白70%）。省略・別表示への置換禁止
- 右側: 両方/表/入力 のビューセグメントボタン
- **風速計接続時**: アクティブチーム情報ブロック内に Wind Vector Widget を表示
- **風速計未接続時**: Wind Vector Widget 非表示（接続OKサインとしての役割を兼務）
- **風速計エラー時**: 同位置に「風速計NG」バッジを代替表示（`--danger-bg` + `--text-danger`）

#### 9.2.5 Wind Vector Widget（モルック固有コンポーネント）

GameScreen ヘッダーに常時表示される pill 型風速ウィジェット。WindMonitor の Industrial 美学を縮約形で GameScreen に持ち込み、視認性とモルック固有の戦略情報を両立させる計器的な情報ブロック。

**配置**: アクティブチーム情報ブロック内、点数・ミスインジケータの右側に併置。点数との距離 `--space-3`。

**形状・サイズ**:
- pill 形状（`--radius-full`）
- 高さ: 44px（`--space-11`、タッチターゲット下限）
- 背景: `--neutral-900` 固定
- パディング: 縦 `--space-2` / 横 `--space-3`
- 要素間ギャップ: `--space-2`

**構成要素（左→右）**:
1. 方向矢印（SVG、風の吹いてくる方向を指す、24×24px）
2. 風速数値
3. 単位ラベル `m/s`
4. 方向ラベル（前/後/左/右/左前/右前/左後/右後）

**タイポグラフィ**:
- 風速数値: `--text-xl` / `--font-instrument` / `--weight-semibold`
- 単位 `m/s`: `--text-sm` / `--font-instrument` / `--weight-medium`
- 方向ラベル: `--text-sm` / `--font-sans` / `--weight-bold`

**Wind Ramp 色変化**:

矢印色と風速数値色が風速カテゴリに応じて連動変化。背景は `--neutral-900` 固定（pill背景の赤化はアラート過剰のため禁止）。単位と方向ラベルは `--wind-text-label` 固定。

| カテゴリ | 色トークン | 閾値 |
|---|---|---|
| CALM | `--wind-calm` | 0.0〜2.0 m/s |
| MODERATE | `--wind-moderate` | 2.0〜4.0 m/s |
| STRONG | `--wind-strong` | 4.0〜6.0 m/s |
| SEVERE | `--wind-severe` | 6.0 m/s〜 |

閾値は 9.3 WindMonitor 章と共通 → 単一の真実源。

**iPhone縦向き簡略版**（`max-width: 480px`）:
- 構成: 矢印 + 風速数値のみ（単位と方向ラベルを省略）
- 高さ 44px 維持、最小幅 72px
- Wind Ramp 色変化は同様に適用

**実装メモ**: Wind Ramp 色分岐は `src/windSensor.js` の `getWindRampColor(windSpeed)` に集約（第2弾C C-e、2026-04-21）。§9.3.4 WindMonitor Hero 数値と同一関数を流用し、`--wind-*` 5 トークン（`--wind-calm` / `--wind-calm-light` / `--wind-moderate` / `--wind-strong` / `--wind-severe`、§2.5 および styles.css で正典定義済み）を単一の真実源とする構造が完成した。閾値は §2.5 Wind Sensor Colors と共通（`<` 未満方式、境界値 2.0 / 4.0 / 6.0 は上位カテゴリに属する）。`getWindRampColor` が `null` を返した場合（NaN / Infinity 混入時のみ、通常運用では発生しない）は `#fff` へフォールバック。

方向ラベル色は C-a 路線 B（DIRECTION パレット維持）から §9.2.5 正典の `rgba(255,255,255,0.6)` へ C-e で切替した。C-a 路線 B の当初根拠（矢印色と方向ラベル色を DIRECTION パレットで視覚的に統一し方位識別を優先する）は、C-e で矢印色が Wind Ramp 連動に移行したことにより失効した（矢印色が風速カテゴリで変化し方向ラベル色が方位で変化する状態では両者の色相関係が切断される）ため、正典追従へ回帰した形となる。

単位 `m/s` 色と方向ラベル色は `--wind-text-label` トークン（§2.6 Wind Monitor 追加トークン）ではなく `rgba(255,255,255,0.6)` 直書きで実装している。§9.3.3 末尾で §2.6 の 6 トークン全体を「未使用のまま積み残し、WindMonitor 改良時に一括再設計」する方針が規定されているため、`--wind-text-label` のみを C-e で先行追加することは §2.6 全体方針との矛盾となる。C-d の単位 `m/s` 実装（hex 直書き）と整合する形で C-e も直書きを維持した。

**✗ 使用禁止**:
- GameScreen 以外への転用
- 色を Team Color に連動させる
- pill背景色を Wind Ramp 色に変化させる

#### 9.2.6 スコア表

- 背景: ヘッダーと同じ `--neutral-900`、ボーダー `--neutral-700`
- ヘッダー行: チーム名 + 「計」列、`--weight-semibold`
- 行: プレイヤー名は縦書き、スコア列は数値セル
- アクティブラウンド行: 背景薄グラデで強調
- ミス表示: `--danger` 色
- フォルト表示: `--warning` 色

#### 9.2.7 入力エリア（下半分、ライト基調）

- 背景: `--neutral-0`、`--neutral-100` ボーダー（上端のみ）
- 左側: 現在のプレイヤー情報（名前 + 点数 + ミスインジケーター）
- 中央: **ヘキサゴン配列スキットル番号ボタン**（モルック固有・永続化）
- 右側: アクション階層（決定/フォルト/ミス）

#### 9.2.8 ヘキサゴン配列スキットル番号ボタン

モルックスコアラーのアイデンティティの一部として**永続化される**独自コンポーネント。

**配置（上から4行）**:
```
  7   9   8
5  11  12  6
  3  10   4
    1   2
```

(※ 実装コード側の現行配置を正典とする)

**スタイル**:
- 円形 (`--radius-full`)
- サイズ: iPad で 72〜88px、iPhone で 56〜64px
- 番号: `--font-sans` / `--text-3xl`〜`--text-4xl` / `--weight-bold`
- ボーダー: `--neutral-300` 1.5px
- hover: 背景 `--blue-50`、`transform: scale(1.03)`
- active: 背景 `--blue-100`、`transform: scale(0.98)`

**✗ 改変禁止事項**:
- 番号配置の変更
- 形状を6角形以外に変更
- 円形を四角形・ピル形状に変更

#### 9.2.9 アクション階層（決定/フォルト/ミス）

| ボタン | 色 | 意味 |
|---|---|---|
| 決定 | `--neutral-100` 背景 / `--neutral-700` 文字 | 通常終了 |
| フォルト | `--danger-bg` / `--text-danger` | 違反・失格 |
| ミス | `--warning-bg` / `--warning-dark` | 投擲失敗 |
| 戻る | Ghost ボタン | 操作取消 |

これら3アクションは意味論が独立しているため、色の役割分離原則に従って異なる Semantic Color を割り当てる。

#### 9.2.10 使用禁止ケース

- トップに「SETUP / GAME / RESULT / WIND」等の独立ナビを設置する（現行のモーダル + 画面遷移構造を崩す）
- ヘッダー中央「N試合目 Nターン目」表示の省略・簡略化（§9.2.4 参照）
- Wind Vector Widget を GameScreen 以外で使用
- スキットル番号ボタンの配置・形状改変
- 入力エリアをダーク化（ライト基調の視認性を守る）

---

### 9.3 WindMonitor

#### 9.3.1 質感アイデンティティ

**Apple Watch Ultra Industrial 美学**。Apple Watch Ultra の Wayfinder 文字盤（コンパス）と Modular Ultra 文字盤（数値・統計）を参照基準とする、暗闇に浮かぶ計器盤としての風速モニター画面。

**モルック固有の主題**: コンパスは絶対風向（N/NE/E/SE/...）ではなく、**スキットル方向を基準とした相対風向（追・追右・右・向右・向・向左・左・追左）** を表示する。プレイヤーの投擲方向に対して風がどちらから吹いているかを一目で読み取れることが、この画面の戦略的価値の中核である。

**Type B 実装（PR β X-3、PR #92、2026-04-24）の構造要素**: 以下の 3 つの構造要素が Industrial 美学を体現する。各要素の完全仕様は §9.3.10 を参照。

1. **BezelPanel**: リベット付き金属パネル（4 隅リベット + 左上切り欠き title + 右上 corner + radial-gradient 背景）で全セクションを統一
2. **CompassGauge**: 三重リング金属ベゼル + 72 本階層ティック + BLADE NEEDLE + セクター放射グラデ + BEARING 数値表示 + ハブディテール（Wayfinder 文字盤参照）
3. **DeckHeader / DeckFooter**: 計器盤ブランド刻印風のヘッダー（閉じるボタン + WIND · MONITOR + T+ タイマー + LINKED / DISCONNECTED ステータス）とフッター（WX-02 ▪ FW 1.4.2 / SIG -- dBm / 1 Hz）

#### 9.3.2 画面構成と情報階層

**画面上から下への構成（固定順、iPhone / iPad 共通）**:

1. DeckHeader（閉じるボタン + WIND · MONITOR + T+ タイマー + LINKED ステータス）
2. BezelPanel WIND · NOW（Hero 風速数値 + 単位「m/s」+ シェブロン + レンジラベル + レンジゲージ + 目盛り）
3. BezelPanel COMPASS（CompassGauge、iPad では SKITTLE DIRECTION ラベル含む）
4. BezelPanel PEAK / AVG / BAT（統計カード 3 列、iPad のみ ticks 20 本バー付き）
5. BezelPanel TIMELINE · 5 MIN（WindChart）
6. DeckFooter（WX-02 ▪ FW 1.4.2 / SIG -- dBm / 1 Hz）

##### 情報階層（ダブル主役）

**ダブル主役**:
1. BezelPanel WIND · NOW 内の Hero 風速数値
2. BezelPanel COMPASS 内の CompassGauge

この 2 つは「計器盤」として両立する。InstrumentDeckPhone（縦積みレイアウト）では Hero 数値の下にコンパスが配置され、InstrumentDeckPad（2 カラムレイアウト）では左カラムにコンパス、右カラム上段に Hero 数値が配置される。

##### レイアウト分岐（`isTablet`）

`window.innerWidth >= 768` で分岐し、コンポーネント層で `InstrumentDeckPad` と `InstrumentDeckPhone` に切り替わる。リサイズ / orientationchange イベントで `isTablet` が更新される。

| 項目 | InstrumentDeckPhone | InstrumentDeckPad |
|---|---|---|
| ルート `maxWidth` | 420px | 880px |
| ルート `padding` | 12px | 22px |
| セクション間 `gap` | 12px | 18px |
| DeckHeader `scale` | 1.0 | 1.35 |
| DeckFooter `scale` | 1.0 | 1.3 |
| CompassGauge `size` | 330px | 420px |
| Hero 数値 `fontSize` | 88px | 120px |
| Hero 単位 `fontSize` | 16px | 22px |
| 統計カード数値 `fontSize` | 30px | 42px |
| 統計カード `ticks` 20 本バー | なし | あり |
| SKITTLE DIRECTION ラベル | なし | BezelPanel COMPASS 内に表示 |
| WindChart `width × height` | 356 × 120 | 736 × 280 |
| 背景グリッド pattern | `32 × 32px` | `40 × 40px` |

##### 背景グリッド

両レイアウト共通で、SVG pattern による薄いグリッドを全面に敷く。

- `opacity: 0.05`
- stroke: `var(--wind-text-slate)` (#94a3b8)、strokeWidth 0.5
- pattern: InstrumentDeckPhone は `32 × 32px`、InstrumentDeckPad は `40 × 40px`
- `pointerEvents: none`（インタラクションを妨げない）
- SVG は `position: absolute; inset: 0` でルート全面を覆う

#### 9.3.3 背景と全体配色

**実装方針**: PR β X-3（PR #92、2026-04-24）の書き換えにより、Wind Monitor Industrial Palette（§2.6）の 12 トークンが全面適用された。直書き hex は §9.3.11 に棚卸し済みの残余装飾のみ。既存 6 トークン（`--wind-bg-card` / `--wind-grid-major` / `--wind-grid-minor` / `--wind-text-label`）は新体系で使用されず、§2.6 で用途廃止または他トークンへの統合が明記されている。

**トークン使用マップ**:

| 要素 | 値 | 備考 |
|---|---|---|
| モーダルルート背景 | `var(--wind-bg-base)` (#0a0f1a) | `position: fixed; inset: 0; zIndex: 9999` の最下層 |
| モーダル内ルート radial-gradient | `radial-gradient(ellipse at 30% 0%, var(--wind-bg-surface) 0%, var(--wind-bg-base) 55%, #020617 100%)` | `#020617` は §9.3.11 残余承認 |
| BezelPanel 背景 radial-gradient | `radial-gradient(ellipse at top, var(--wind-bg-panel) 0%, var(--wind-bg-base) 60%, #050914 100%)` | `#050914` は §9.3.11 残余承認 |
| BezelPanel ボーダー | `1px solid var(--wind-edge)` (#1e293b) | |
| BezelPanel 影 | `inset 0 1px 0 rgba(148,163,184,0.08), inset 0 0 0 1px #020617, 0 8px 24px rgba(0,0,0,0.5)` | rgba 値と `#020617` は §9.3.11 残余承認 |
| BezelPanel リベット（4 隅） | `background: #020617`、`boxShadow: inset 0 0 0 0.5px var(--wind-text-dim)` | `#020617` は §9.3.11 残余承認 |
| DeckHeader 背景 | `linear-gradient(180deg, var(--wind-bg-panel) 0%, #0b1220 100%)` | `#0b1220` は §9.3.11 残余承認 |
| DeckHeader ボーダー | `1px solid var(--wind-edge)` | |
| DeckHeader 影 | `inset 0 1px 0 rgba(148,163,184,0.1), inset 0 -1px 0 #020617` | rgba 値と `#020617` は §9.3.11 残余承認 |
| 背景グリッド stroke | `var(--wind-text-slate)` (#94a3b8)、opacity 0.05 | |

**ルート背景レイヤ構成**:

モーダルルート（fixed）→ `var(--wind-bg-base)` → InstrumentDeckPhone / InstrumentDeckPad → モーダル内 radial-gradient → 各 BezelPanel の radial-gradient（ellipse at top）という 4 層構造で、中央から上方に向けて微明、縁に向けて深く沈む計器盤の立体感を表現する。

**§2.6 トークンの全適用実績**: PR β X-3 で 12 トークンすべてが `src/components/WindMonitorModal.jsx` 内で参照されており、未使用トークンはゼロ。詳細は §9.3.10 の各コンポーネント仕様内で明示する。

#### 9.3.4 主役エリア — 風速数値

BezelPanel WIND · NOW（title「WIND · NOW」切り欠き、corner「m/s」）に包まれた、Hero 風速数値 + 単位 + シェブロン + レンジラベル + レンジゲージ + 目盛りの 6 要素構成。

##### Hero 数値

- 配置: BezelPanel 内、`display: flex; alignItems: baseline; justifyContent: center`、`gap: 4px`（Phone）/ `6px`（Pad）、`padding: 10px 0 4px`（Phone）/ `14px 0 4px`（Pad）
- `fontFamily`: `'JetBrains Mono', monospace`（= `--font-instrument`）
- `fontSize`: 88px（Phone）/ 120px（Pad）
- `fontWeight`: 700
- `letterSpacing`: `-2px`（Phone）/ `-3px`（Pad）
- `lineHeight`: 1
- `display: inline-block`、`transformOrigin: center`
- **色（状態分岐）**:
  - `hasWindSpeed === true` のとき: `getWindRampColor(currentData.wind_speed)` の戻り値（§2.5 Wind Sensor Colors の CALM / MODERATE / STRONG / SEVERE、閾値 2.0 / 4.0 / 6.0）、`null` 返却時は `var(--wind-text-muted)` にフォールバック
  - それ以外（未接続 / 数値未受信）: `var(--wind-text-muted)` (#64748b)
- 表示値: `currentData.wind_speed.toFixed(1)`、未受信時は `"---"`
- **textShadow**（InstrumentDeckPad のみ）: `0 0 40px rgba(251,191,36,0.25)`（§9.3.11 残余承認）
- **アニメーション**: `wind-monitor-hero-pulse 3s ease-in-out infinite`（`hasWindSpeed === true` のときのみ、§9.3.8 参照）。scale 1.0 ⇄ 1.015 の呼吸

##### 単位「m/s」

- `fontSize`: 16px（Phone）/ 22px（Pad）
- `fontWeight`: 600
- `fontFamily`: `'JetBrains Mono', monospace`
- 色: `var(--wind-text-muted)` 固定（状態に関わらず）

##### シェブロン（左右 SVG）

Hero 数値下の装飾 SVG。左右対称に配置され、中央にレンジラベル text を埋め込む。

- InstrumentDeckPhone: `viewBox="0 0 260 18"`、`width: 100%`、`height: 14`、`marginTop: 2`
  - 左シェブロン path: `d="M 4 9 L 14 9 M 10 3 L 10 15"`、strokeWidth 1.5
  - 右シェブロン path: `d="M 256 9 L 246 9 M 250 3 L 250 15"`、strokeWidth 1.5
- InstrumentDeckPad: `viewBox="0 0 320 24"`、`width: 100%`、`height: 20`、`marginTop: 8`
  - 左シェブロン path: `d="M 6 12 L 22 12 M 14 4 L 14 20"`、strokeWidth 1.8
  - 右シェブロン path: `d="M 314 12 L 298 12 M 306 4 L 306 20"`、strokeWidth 1.8
- 共通 stroke: `var(--wind-accent)` (#67e8f9)、fill: none

##### レンジラベル（CALM / MODERATE / STRONG / SEVERE）

シェブロン SVG の中央に text として配置。風速カテゴリを文字で明示。

- `textAnchor: middle`
- `fontSize`: 10px（Phone、`y="13"`）/ 13px（Pad、`y="17"`）
- `fontWeight`: 700
- `fontFamily`: `'JetBrains Mono', monospace`
- `letterSpacing`: 2（Phone）/ 3（Pad）
- 色: `hasWindSpeed` のとき `getWindRampColor(wind_speed)`、そうでないとき `var(--wind-text-muted)`
- 表示値: `getWindRampLabel(wind_speed)` の戻り値（`"CALM"` / `"MODERATE"` / `"STRONG"` / `"SEVERE"` / `"---"`）

##### レンジゲージ

シェブロン下に配置される水平バー。風速 0〜5+ m/s をビジュアルで示す。

- 外枠 div: `height: 6px`（Phone）/ `8px`（Pad）
  - `background: #0b1220`（§9.3.11 残余承認）
  - `border: 1px solid var(--wind-edge)`
  - `borderRadius: 3`（Phone）/ `4`（Pad）
  - `position: relative`
- CALM 帯（0〜40%）: `var(--wind-calm)` (#34d399)、`height: 4px`（Phone）/ `6px`（Pad）、`margin: 1`、`borderRadius: 2`（Phone）/ `3`（Pad）
- MODERATE 帯（40〜70%）: `var(--wind-moderate)` (#fbbf24)、同サイズ、`margin: 1`
- STRONG 帯（70〜100%）: `#f87171`（§9.3.11 残余承認）、同サイズ、`margin: 1`、`borderRadius: 2`（Phone）/ `3`（Pad）
- 現在位置マーカー（`gaugeShow === true` のときのみ描画）: `width: 2px`（Phone）/ `2.5px`（Pad）、`height: 12px`（Phone）/ `16px`（Pad）、`background: var(--wind-text-primary)` (#e2e8f0)
  - `position: absolute; left: ${gaugePct}%; top: -3px`（Phone）/ `top: -4px`（Pad）
  - `gaugePct = clamp((wind_speed / 5) * 100, 0, 100)`

##### 目盛りラベル

レンジゲージの下に配置される 4 点目盛り（0 / 2 / 3.5 / 5+）。

- `display: flex; justifyContent: space-between`
- `marginTop: 3`（Phone）/ `5`（Pad）
- `fontFamily`: `'JetBrains Mono', monospace`
- `fontSize`: 8px（Phone）/ 10px（Pad）
- 色: `var(--wind-text-dim)` (#475569)
- 表示値: `0` / `2` / `3.5` / `5+`

##### 実装メモ

- Wind Ramp 色分岐は `src/windSensor.js` の `getWindRampColor(windSpeed)` に集約（第2弾C C-f、2026-04-21）。閾値は §2.5 Wind Sensor Colors と共通（`<` 未満方式、境界値は上位カテゴリに属する）。
- Wind Ramp ラベルは `src/components/WindMonitorModal.jsx` 内の `getWindRampLabel(windSpeed)` に集約（§9.3.10.1 参照）。`getWindRampColor` と同じ閾値を使い、戻り値は文字列（`"CALM"` / `"MODERATE"` / `"STRONG"` / `"SEVERE"`、無効値は `"---"`）。
- Hero 数値 + 単位 + シェブロン + レンジラベル + レンジゲージ + 目盛りの 6 要素構成が「現在風速の計器盤」を成す。

#### 9.3.5 主役エリア — 風向コンパス

BezelPanel COMPASS（title `COMPASS · ${bearing}°` 切り欠き、corner は InstrumentDeckPhone で `relativeWind.label` 等、InstrumentDeckPad で `"R.S-7"` 固定）に包まれた CompassGauge コンポーネント。詳細な SVG 構造・座標系・色適用・描画順序は §9.3.10.2 を参照し、本節ではユーザー視点の仕様のみ記述する。

##### サイズとスケール

- InstrumentDeckPhone: `size: 330px`
- InstrumentDeckPad: `size: 420px`
- 内部スケール係数 `k = size / 340` で全要素（半径・ティック長・フォントサイズ）を係数倍する

##### 構成要素（描画順）

1. **三重リング金属ベゼル**: face radial-gradient（`var(--wind-bg-panel)` → `var(--wind-bg-base)` → `#020617`）+ ベゼル外周 stroke（`var(--wind-text-dim)` → `var(--wind-edge)` → `var(--wind-bg-surface)` の linearGradient）+ face 内縁 + ring 円 stroke（`#334155`、§9.3.11 残余承認）
2. **セクター放射グラデ**: BEARING ± 12° の扇形、`var(--wind-accent)` radialGradient（中心 opacity 0 → 外周 opacity 0.32）
3. **72 本階層ティック**（4 階層）: cardinal（90° 毎）/ major（30° 毎）/ medium（15° 毎）/ minor（残り）、詳細は §9.3.10.2
4. **セパレータリング**: 点線円（`var(--wind-edge)`、`strokeDasharray: "1 3"`）
5. **8 度数ラベル**: `[30, 60, 120, 150, 210, 240, 300, 330]`、3 桁 0 埋め + `°`、`'JetBrains Mono', monospace`、`var(--wind-text-muted)`
6. **8 方向日本語ラベル**: 追 / 追右 / 右 / 向右 / 向 / 向左 / 左 / 追左、`-apple-system, 'Hiragino Sans', sans-serif`
7. **内周リング**: `var(--wind-edge)` stroke、face 境界 stroke（`var(--wind-bg-surface)`）
8. **上部シェブロン**: 12 時位置の小三角（`var(--wind-text-primary)`）、静的
9. **BEARING ラベル + 数値**: ハブ上部、`var(--wind-text-dim)` ラベル + `var(--wind-accent)` 数値（3 桁 0 埋め + `°`）
10. **BLADE NEEDLE グループ**: tail（台形）+ blade 明部（三角、`--wind-accent-hi` → `--wind-accent` → `--wind-accent-lo` の linearGradient）+ blade 暗部（右半、`fillOpacity: 0.55`）+ 内部ライン（`--wind-accent-hi`）+ 先端ドット（`#ffffff`、§9.3.11 残余承認）+ ハブ（5 層の同心円 + 左右小ドット）

##### 回転

BLADE NEEDLE グループ全体に `transform: rotate(${bearing}deg); transformOrigin: ${CX}px ${CY}px` を適用。bearing が変化したときに `transition: transform 0.3s ease` で回転（§9.3.8 参照）。

##### bearing の決定

- `bearing = relativeWind ? Math.round(relativeWind.angle) : 0`
- `relativeWind` は `calcRelativeWind(currentData)` の戻り値。計算不可時（`compass_valid === false` 等）は `null` を返し、bearing は 0° で静止

##### 8 方向ラベルの強調

現在の `bearing` に一致する方位ラベルのみ、通常状態と強調状態の 2 段階で表示。

| 状態 | fontSize | fontWeight | fill |
|---|---|---|---|
| 通常（`d.angle !== bearing`） | `11 * k` | 600 | `var(--wind-text-slate)` (#94a3b8) |
| 強調（`d.angle === bearing`） | `13 * k` | 800 | `var(--wind-accent)` (#67e8f9) |

PR β X-3 実装では、8 方向ラベルは **Wind Direction Palette（§2.11.5）を使わず** slate / cyan の 2 色で表現する（セクター塗りを `--wind-accent` に統一したため、方向ラベルも cyan 系に揃えて視覚的一貫性を確保）。DIRECTION パレットは BezelPanel COMPASS のコーナー表示（InstrumentDeckPhone）と SKITTLE DIRECTION ラベル（InstrumentDeckPad）、および WindChart 下部の風向色帯でのみ使用される。

##### BezelPanel COMPASS の title / corner

- **title**（BezelPanel 左上切り欠き）:
  - 接続済み + `relativeWind` 計算成功: `COMPASS · ${String(bearing).padStart(3, "0")}°`（例: `COMPASS · 045°`）
  - それ以外: `COMPASS · ---`
- **corner**（BezelPanel 右上）:
  - **InstrumentDeckPhone**:
    - 未接続 → `"---"`
    - `currentData.compass_valid === false` → `"⚠"`
    - `currentData.throw_direction == null` → `"未設定"`
    - `relativeWind` 計算成功 → `relativeWind.label`（追 / 追右 / 等、色は DIRECTION パレット）
    - 他 → `"---"`
  - **InstrumentDeckPad**: `"R.S-7"` 固定（装飾的な測定機器型番風文字列）。相対風向ラベルは BezelPanel 下部の SKITTLE DIRECTION 行に配置される（§9.3.10.8 参照）

##### 中央状態テキストの廃止

PR β X-3 以前（Phase 3 初期実装）ではコンパス中心に状態テキスト（「切断中」「⚠ コンパス異常」「基準方向未設定」等）を描画していたが、Type B 実装（PR β X-3）で廃止。状態表現は BezelPanel の title / corner および SKITTLE DIRECTION ラベル（InstrumentDeckPad）に分離された。CompassGauge 中心にはハブディテール（5 層同心円 + 左右小ドット）のみ配置される。

##### 相対風向計算ロジック（`calcRelativeWind`）

PR β X-3 以前と同一。`src/components/WindMonitorModal.jsx` のトップレベル関数として定義。

**入力**: `data` オブジェクト
- `compass_valid`（真偽）
- `throw_direction`（number、スキットル方向の絶対角度）
- `wind_direction`（number、センサーローカル座標での風向き）
- `compass_heading`（number、センサーの地理方位）

**前提条件**（いずれか 1 つでも満たさなければ `null` を返す）:
- `data` が truthy
- `data.compass_valid === true`
- `data.throw_direction != null`
- `data.wind_direction` が number
- `data.compass_heading` が number

**計算式**:

```
absoluteWindFrom   = ((wind_direction + compass_heading) mod 360 + 360) mod 360
windFlowDirection  = (absoluteWindFrom + 180) mod 360
relativeAngle      = ((windFlowDirection - throw_direction) mod 360 + 360) mod 360
index              = Math.round(relativeAngle / 45) mod 8
```

**出力**: `{ label, color, angle, index, absoluteWindFrom }`（`label` と `color` は `DIRECTION_ITEMS[index]` から取得、`angle` は `relativeAngle` 値）

##### Wind Direction Palette の使用箇所（§2.11.5 参照）

- **WindChart タイムライン下部の風向色帯**: 各サンプルの `calcRelativeWind(sample).color`（§9.3.10.4 参照）
- **InstrumentDeckPhone の BezelPanel COMPASS corner**: `relativeWind.color`（接続時のみ、§9.3.10.7 参照）
- **InstrumentDeckPad の SKITTLE DIRECTION ラベル**: `relativeWind.color`（接続時のみ、§9.3.10.8 参照）
- **CompassGauge の 8 方向ラベル**: **使用しない**（slate / cyan の 2 色表現に変更、前述）
- **CompassGauge の中央矢印**: BLADE NEEDLE に置き換わり、DIRECTION 連動色は廃止（代わりに `--wind-accent` 系 cyan で統一）

#### 9.3.6 統計カード（BezelPanel 3 列）

PEAK / AVG / BAT の 3 項目を横 3 列で表示する統計カード群。PR β X-3（PR #92、2026-04-24）で従来のフラット角丸カードから **BezelPanel**（§9.3.10.3 参照）で包む構造に変更された（L8 判断）。InstrumentDeckPad では各カード下部に ticks 20 本バーが追加される。

##### レイアウト

- 横 3 列、均等分割（`display: grid; gridTemplateColumns: "1fr 1fr 1fr"`）
- gap: 8px（InstrumentDeckPhone）/ 10px（InstrumentDeckPad）
- **配置場所**:
  - InstrumentDeckPhone: BezelPanel COMPASS の直下に縦積み配置
  - InstrumentDeckPad: 2 カラムレイアウト右カラムの下段（上段は BezelPanel WIND · NOW）
- **各カード**: BezelPanel で包む
  - padding: `14px 8px 10px`（Phone）/ `18px 10px 12px`（Pad）

##### BezelPanel の title / corner

- **title**（Phone / Pad 共通）: `"PEAK"` / `"AVG"` / `"BAT"`（BezelPanel 左上切り欠きに配置）
- **corner**（InstrumentDeckPad のみ）: `"5min"`（PEAK）/ `"5min"`（AVG）/ `"OK"`（BAT）
- InstrumentDeckPhone では corner なし（スペース制約のため）

##### カード内容（中央揃え）

縦方向に [数値（大）] → [単位 · サブ行（小）] → [ticks 20 本バー（iPad のみ）] の 3 層構造。

###### 数値行

- fontSize: 30px（Phone）/ 42px（Pad）
- fontFamily: `'JetBrains Mono', monospace`
- fontWeight: 700
- letterSpacing: `-1px`
- lineHeight: 1
- 色: 項目別分岐（§「各カードの値とサブ行」参照）

###### 単位・サブ行

- fontSize: 9px（Phone）/ 10px（Pad）
- fontFamily: `'JetBrains Mono', monospace`
- 色: `var(--wind-text-muted)` (#64748b)
- marginTop: 3px（Phone）/ 4px（Pad）
- letterSpacing: 1.5
- フォーマット: `{unit} · {sub}`（例: `m/s · 16:42`、`m/s · σ 0.82`、`% · n 180`）

##### 各カードの値とサブ行

###### PEAK カード

- 数値: `stats.maxSpeed != null ? stats.maxSpeed.toFixed(1) : "---"`
- unit: `"m/s"`
- sub: `formatTimestamp(stats.maxSpeedTimestamp)`（HH:MM 形式）/ 未取得時 `"--:--"`
- 色: `stats.maxSpeed != null ? (getWindRampColor(stats.maxSpeed) || var(--wind-text-muted)) : var(--wind-text-muted)`

###### AVG カード

- 数値: `stats.avgSpeed != null ? stats.avgSpeed.toFixed(1) : "---"`
- unit: `"m/s"`
- sub: `stats.stdDev != null ? \`σ ${stats.stdDev.toFixed(2)}\` : "σ --"`
- 色: `stats.avgSpeed != null ? (getWindRampColor(stats.avgSpeed) || var(--wind-text-muted)) : var(--wind-text-muted)`

###### BAT カード

- 数値: `hasBattery ? Math.round(currentData.battery).toString() : "---"`
- unit: `"%"`
- sub: `` `n ${stats.sampleCount}` ``（常に描画、履歴サンプル数）
- 色: `hasBattery ? batteryColor(currentData.battery) : var(--wind-text-muted)`

##### `batteryColor()` 関数の戻り値

`src/components/WindMonitorModal.jsx` のトップレベル関数として定義（§9.3.10.1 参照）。

| 入力 | 戻り値 |
|---|---|
| `pct == null` | `"#6b7280"`（§9.3.11 残余承認） |
| `pct < 20` | `"var(--wind-severe)"` (#ef4444) |
| `pct < 50` | `"#eab308"`（§9.3.11 残余承認、warning 系） |
| `pct >= 50` | `"var(--wind-calm)"` (#34d399) |

##### ticks 20 本バー（InstrumentDeckPad のみ）

各カード下部に配置される 20 本の垂直バー。風速値 / バッテリー値を 20 段階のレベルゲージで可視化する。

- 配置: `display: flex; gap: 2; marginTop: 12; justifyContent: center`
- 各バー（`width: 2`）:
  - 高さ: 活性時 `12`、非活性時 `6`
  - 色: 活性時 `tickColor`、非活性時 `var(--wind-text-muted)`
  - opacity: 活性時 `0.6 + i * 0.02`、非活性時 `0.4`
- **`ticks`（活性バー数）計算**:
  - PEAK: `Math.round(Math.min(stats.maxSpeed / 10.0, 1.0) * 20)`
  - AVG: `Math.round(Math.min(stats.avgSpeed / 10.0, 1.0) * 20)`
  - BAT: `Math.round(Math.min(currentData.battery / 100, 1.0) * 20)`
- **`tickColor`**: 各カードの数値色と同じ（未取得時は `var(--wind-text-muted)`）

##### アニメーション

統計カード固有の初期描画アニメーションは持たない。数値更新時の transition も不要（`wind_data` 受信のたびに即時切替）。唯一の例外は BAT 色が 20% / 50% 閾値をまたぐ時の色変化で、これも即時切替。

##### トークン化の課題（メモ）

PR β X-3 Type B 実装で § 2.5 Wind Sensor Colors と hex 完全同値だった 3 箇所（AVG / BAT 50% 以上 → `--wind-calm`、BAT 20% 未満 → `--wind-severe`）は `var()` 参照化済み（第2弾C C-g、2026-04-21）。PR β X-3 では PEAK カード色を Wind Ramp 連動（`getWindRampColor`）に変更したため、旧実装の `#f59e0b` 直書きは削除された。

残る hex 直書きは以下 2 箇所。§9.3.11 に棚卸し済み:

- `#eab308`: `batteryColor()` 内 pct < 50 の warning 系
- `#6b7280`: `batteryColor()` 内 pct == null の未取得色

これらは将来の WindMonitor 美学棚卸しタスクで、warning/success/danger 系既存トークンに寄せるか Wind 専用派生トークン（例 `--wind-battery-mid` / `--wind-stat-null`）を新設するかを一括判断する。

#### 9.3.7 時系列グラフ

WindChart コンポーネント（§9.3.10.4 で SVG 構造の完全仕様を定義）による風速推移折れ線 + 風向色帯の時系列表示。本節ではユーザー視点の仕様のみを記述する。

##### 配置と BezelPanel

- **BezelPanel TIMELINE · 5 MIN** で包む
  - title: `"TIMELINE · 5 MIN"`（左上切り欠き）
  - corner: `` `${currentData.wind_speed.toFixed(1)} m/s →` `` / 未受信時 `"--- m/s →"`（右上、現在風速値を矢印と共に表示）
  - padding: `14px 10px 10px`（Phone）/ `20`（Pad）
- BezelPanel 内部は `flex: 1; minHeight: 0; display: flex; flexDirection: column`（残余高さを埋める）
- InstrumentDeckPhone では縦積み最下段、InstrumentDeckPad では 2 カラムレイアウト外側の下段にフルワイドで配置（`flex: 1; zIndex: 1`）

##### SVG サイズ

| レイアウト | width × height |
|---|---|
| InstrumentDeckPhone | 356 × 120 |
| InstrumentDeckPad | 736 × 280 |

- `preserveAspectRatio="none"`（横方向のみ自動スケール）
- viewBox: `0 0 ${width} ${height}`

##### ウィンドウとサンプリング

- **時間ウィンドウ**: 直近 5 分固定（`WINDOW_MS = 5 * 60 * 1000`）
- **履歴蓄積**: 1Hz で `wind_data` 受信ごとに `history` 配列に push、最大 300 件（= 5 分）を超えると最古サンプルを削除
- **サンプリング**: `history` から 3 秒間隔で間引き（`for (let i = 0; i < history.length; i += 3)`）、末尾の最新サンプルは必ず含める
- **`validSamples`**: `samples` のうち `timestamp` が有効（`isFinite(new Date(timestamp).getTime())`）なもののみ

##### マージン計算

| 項目 | 値 |
|---|---|
| `marginL` | 36（Pad）/ 32（Phone） |
| `marginR` | 12（固定） |
| `marginT` | 12（固定） |
| `marginB` | 24（固定） |
| `chartH` | 280（Pad）/ 120（Phone） |
| `chartW` | 736（Pad）/ 356（Phone） |
| `plotW` | `chartW - marginL - 12` |
| `plotH` | `chartH - marginT - marginB` |

##### Y 軸

- **スケール**: `yMax = max(3.0, maxObservedSpeed * 1.2)`（最小 3.0 m/s、観測最大値の 1.2 倍で上方拡張）
- **グリッド線**: 水平線 3 本（上端 `y=marginT` / 中央 `y=marginT + plotH/2` / 下端 `y=marginT + plotH`）
  - stroke: `var(--wind-edge)`
  - strokeDasharray: `"2 4"`
- **ラベル**: 3 点（PR β X-3 で 2 点 → 3 点に拡張）
  - 上端（`yMax.toFixed(1)`）: `textAnchor=end`、`dominantBaseline=hanging`
  - 中央（`(yMax / 2).toFixed(1)`）: `textAnchor=end`、`dominantBaseline=middle`
  - 下端（`"0.0"`）: `textAnchor=end`、`dominantBaseline=baseline`
  - 共通: `x=marginL - 4`、`fill="var(--wind-text-dim)"` (#475569)、`fontSize: 9`、`fontFamily: 'JetBrains Mono', monospace`

##### 折れ線と塗り

`validSamples.length >= 2` のときのみ描画。

- **clipPath**: `<clipPath id="${prefix}_clip">` で plot 領域に切り抜き（`rect x=marginL, y=marginT, width=plotW, height=plotH`）
- **折れ線 path**:
  - `d`: 各サンプル点を `"M x y L x y ..."` 形式で連結
  - stroke: accent（引数、通常 `"#34d399"`）
  - strokeWidth: 1.6（PR β X-3 で 2 → 1.6 に微減）
  - strokeLinecap: round、strokeLinejoin: round
  - fill: none
- **塗りつぶし path**:
  - `d`: 折れ線の末尾に `" L lastX plotBottom L firstX plotBottom Z"` を追加して閉じた形状
  - fill: `url(#${prefix}_grad)`
  - `<linearGradient id="${prefix}_grad" x1="0" y1="0" x2="0" y2="1">`:
    - stop 0%: accent opacity 0.25
    - stop 100%: accent opacity 0
- **データ点**: 各 `validSample` 位置に circle（`r=1.6`、fill=accent）

##### 風向色帯（タイムライン下部）

- **Y 位置**: `chartH - 24 - 4`（X 軸ラベル上方 4px）
- **高さ**: 4px
- **clipPath**: `<clipPath id="${prefix}_band">` で plot X 範囲に切り抜き（`rect x=marginL, y=chartH - 24 - 4, width=plotW, height=4`）
- **各セグメント**: サンプル i から i+1 までの X 範囲を rect で塗る
  - `x`: `sample[i].x`
  - `y`: `chartH - 24 - 4`
  - `width`: `max(0, sample[i+1].x - sample[i].x)`（最終サンプルは `marginL + plotW` まで）
  - `height`: 4
  - `fill`: `calcRelativeWind(sample).color`（§2.11.5 Wind Direction Palette の 5 色のいずれか）、計算不可なら `var(--wind-edge)`

##### X 軸ラベル（固定 4 点）

サンプル数に関わらず常に固定位置に描画。

| 位置 | テキスト | textAnchor |
|---|---|---|
| `x=marginL`（左端） | 「5分前」 | `start` |
| `x=marginL + plotW * 0.4` | 「3分前」 | `middle` |
| `x=marginL + plotW * 0.8` | 「1分前」 | `middle` |
| `x=marginL + plotW`（右端） | 「今」 | `end` |

- 共通: `y = chartH - 6`
- fill: `var(--wind-text-dim)` (#475569)
- fontSize: 9
- fontFamily: `-apple-system, 'Hiragino Sans', sans-serif`（日本語のため Hiragino Sans を明示）

##### データ未取得時のフォールバック

`validSamples.length < 2` のとき、plot 領域中央に単一テキストを表示:

| 状態 | テキスト |
|---|---|
| `connected === true` | 「データ収集中...」 |
| `connected === false` | 「未接続」 |

- 位置: `x = marginL + plotW / 2`、`y = marginT + plotH / 2`
- fill: `var(--wind-text-dim)`
- fontSize: 12
- textAnchor: middle
- dominantBaseline: middle

##### 現在値マーカー（実装なし）

PR β X-3 Type B 実装では、グラフ右端に現在値を示すパルスマーカー（ドット等）は実装されていない。Hero 風速数値自体がリアルタイム表示を担うため、二重表示を避ける設計判断。

##### prefix 引数による SVG ID 衝突回避

同一ページ内に複数の WindChart が描画される場合（ただし現状は InstrumentDeckPhone か InstrumentDeckPad のどちらか一方のみ）の SVG ID 衝突を避けるため、`prefix` 引数（InstrumentDeckPhone は `"idp_ch"`、InstrumentDeckPad は `"idp2_ch"`）で clipPath / linearGradient の id を名前空間分離する。

#### 9.3.8 マイクロアニメーション 3 種

| 種類 | 対象 | タイミング | 条件 |
|---|---|---|---|
| **矢印回転** | CompassGauge BLADE NEEDLE | `transition: transform 0.3s ease` | bearing 変化時 |
| **切断時ドット blink** | DeckHeader 接続状態ドット | `wind-monitor-blink 3s ease-in-out infinite` | `connected === false` のときのみ |
| **Hero pulse**（新規、PR β X-3 追加） | Hero 風速数値 | `wind-monitor-hero-pulse 3s ease-in-out infinite` | `hasWindSpeed === true` のときのみ |

##### キーフレーム定義

`src/styles.css` の Stage 4 Keyframe Animations セクションに配置:

```css
@keyframes wind-monitor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes wind-monitor-hero-pulse {
  0%, 100% { transform: scale(1.0); }
  50% { transform: scale(1.015); }
}
```

##### 接続中ドットの静的仕様

接続中（`connected === true`）のドットはアニメーションなし。代わりに `box-shadow: 0 0 8px rgba(52,211,153,0.8)` の微グロウのみ（§9.3.11 残余承認の rgba）。切断時（`connected === false`）は `box-shadow: 0 0 8px rgba(239,68,68,0.5)`（§9.3.11 残余承認）+ blink アニメーション。

##### Hero pulse の呼吸値

- scale 1.0 ⇄ 1.015: わずかに膨張する呼吸感（1.5% の拡大）
- 周期 3 秒: 心拍より遅い、「生きている計器」を表現
- `transformOrigin: center`: 中央を軸に等方スケール
- 接続中かつ `currentData.wind_speed` が number のときのみ適用、それ以外は静止

##### 実装配置メモ

- `@keyframes wind-monitor-blink` は第2弾C C-g（2026-04-21）で `src/styles.css` の Stage 4 Keyframe Animations セクション末尾（`mk-shake` の直後）に配置
- `@keyframes wind-monitor-hero-pulse` は PR β X-3 で追加（`wind-monitor-blink` の直後）
- `WindMonitorModal.jsx` 内のインライン `<style>` 定義は削除済み（全 keyframes が `styles.css` に集約）

##### 1 画面 1〜2 箇所原則との整合

WindMonitor は「ダブル主役（Hero 風速数値 + CompassGauge）」を持つため、マイクロアニメーションも 2 箇所（矢印回転 + Hero pulse）に配置される。3 本目の blink は「切断状態の注意喚起」という明確な機能的意味を持ち、装飾目的のアニメーションとは区別される。新規アニメーションの追加は §9.3.9 使用禁止で明示的に禁止される。

#### 9.3.9 ✗ 使用禁止

##### 既存項目（維持）

- **ライト基調への切替**（Industrial 美学が崩壊）
- **アニメーションの新規追加**（§9.3.8 の 3 種以外、1 画面 1〜2 箇所原則）
- **装飾アイコン・イラストの追加**（Whoop 的ストイックさ崩壊）

##### Type B 実装に合わせた追加項目

- **Wind Monitor Industrial Palette（§2.6）の他画面への流用**: 12 トークンは WindMonitor 専用。GameScreen / Stats / SetupScreen / Settings での使用禁止
- **構成要素コンポーネントの WindMonitor 外への転用**: CompassGauge / BezelPanel / WindChart / DeckHeader / DeckFooter / InstrumentDeckPhone / InstrumentDeckPad はすべて WindMonitor 専用（§9.3.10 で内部実装を正典化）。他画面に持ち出さない
- **`--wind-accent`（cyan）を Brand Blue の代替として使用**: `--blue-500` と意味論が異なる（計器盤の cyan vs ブランドの青）。混用禁止
- **`--wind-linked` を WindMonitor 外で使用**: GameScreen で接続状態を示す用途等に流用しない。接続状態表現は WindMonitor モーダル内でのみ意味を持つ（§2.11.2 の意図的エイリアス設計）

#### 9.3.10 Apple Watch Ultra Industrial 美学の構成要素仕様

`src/components/WindMonitorModal.jsx` で定義される **7 新規内部コンポーネント + 3 ユーティリティ関数**の完全仕様。本節は Claude Code / Claude AI が WindMonitor を再実装・拡張する際の正典ドキュメントとして機能する。SVG 構造・座標系・色適用・描画順序・状態分岐を網羅する。

PR β X-3（PR #92、2026-04-24）での全面書き換えで追加された 7 コンポーネント（記述順）:

1. `CompassGauge`（§9.3.10.2）
2. `BezelPanel`（§9.3.10.3）
3. `WindChart`（§9.3.10.4）
4. `DeckHeader`（§9.3.10.5）
5. `DeckFooter`（§9.3.10.6）
6. `InstrumentDeckPhone`（§9.3.10.7）
7. `InstrumentDeckPad`（§9.3.10.8）

および 3 ユーティリティ関数:

1. `formatElapsed(sec)`（§9.3.10.1）
2. `formatTimestamp(isoOrDate)`（§9.3.10.1）
3. `getWindRampLabel(windSpeed)`（§9.3.10.1）

エクスポート本体は `WindMonitorModal`（§9.3.10.9）。

##### 9.3.10.1 ユーティリティ関数 3 種

コンポーネント間で共有される純粋関数。`src/components/WindMonitorModal.jsx` のトップレベルで定義される。

###### `formatElapsed(sec)`

セッション経過秒を時刻形式にフォーマット。

- **入力**: `sec`（非負整数、0 以上の経過秒数）
- **出力**:
  - 1 時間未満（`h === 0`）: `MM:SS` 形式（例: `12:34`）
  - 1 時間以上（`h > 0`）: `HH:MM:SS` 形式（例: `01:23:45`）
- **実装**:
  ```javascript
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  ```
- **用途**: `DeckHeader` の `T+ タイマー` 表示（§9.3.10.5）

###### `formatTimestamp(isoOrDate)`

ISO 文字列または Date オブジェクトを `HH:MM` にフォーマット。

- **入力**:
  - 文字列（ISO 形式、例: `"2026-04-24T16:42:00Z"`）
  - または Date オブジェクト
  - または無効値（`null` / `undefined` / parse 失敗）
- **出力**:
  - 有効入力: `HH:MM` 形式（例: `"16:42"`）、ローカルタイムゾーンでの時刻
  - 無効入力（falsy / `Date` インスタンスでない / `isNaN(getTime())`）: `"--:--"`
- **実装**:
  ```javascript
  if (!isoOrDate) return "--:--";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "--:--";
  const pad = (n) => String(n).padStart(2, "0");
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
  ```
- **用途**: 統計カード PEAK の sub 行（`stats.maxSpeedTimestamp` の表示、§9.3.6）

###### `getWindRampLabel(windSpeed)`

風速から Wind Ramp カテゴリのラベル文字列を返す。

- **入力**: `windSpeed`（number または無効値）
- **出力**:
  - `windSpeed < 2.0`: `"CALM"`
  - `windSpeed < 4.0`: `"MODERATE"`
  - `windSpeed < 6.0`: `"STRONG"`
  - `windSpeed >= 6.0`: `"SEVERE"`
  - 無効値（非 number / `!isFinite()` / `NaN`）: `"---"`
- **実装**:
  ```javascript
  if (typeof windSpeed !== "number" || !isFinite(windSpeed)) return "---";
  if (windSpeed < 2.0) return "CALM";
  if (windSpeed < 4.0) return "MODERATE";
  if (windSpeed < 6.0) return "STRONG";
  return "SEVERE";
  ```
- **閾値**: `src/windSensor.js` の `getWindRampColor` と完全一致（§2.5 Wind Sensor Colors 準拠、`<` 未満方式で境界値は上位カテゴリに属する）
- **用途**: Hero 数値下のレンジラベル表示（§9.3.4）

###### 参考: 既出のトップレベル関数

以下は本節より前のセクションで仕様が完結している関数。本節では参照のみ:

- `calcRelativeWind(data)`: § 9.3.5 で完全仕様化済み。相対風向計算、8 方位インデックスと色の決定
- `batteryColor(pct)`: § 9.3.6 で完全仕様化済み。バッテリー残量の動的色分岐
- `getWindRampColor(windSpeed)`: `src/windSensor.js` でエクスポート、`WindMonitorModal.jsx` が import 使用

###### `polarToSvg(degree, r, cx, cy)`

極座標から SVG 直交座標への変換ヘルパー。トップレベルに定義されているが、PR β X-3 時点では実装内で未使用（将来拡張用として維持）。

- **入力**: `degree`（角度、12 時方向を 0°、時計回り）、`r`（半径）、`cx` / `cy`（中心座標）
- **出力**: `{ x, y }` オブジェクト
- **計算式**:
  ```
  rad = (degree - 90) * Math.PI / 180
  x   = cx + r * Math.cos(rad)
  y   = cy + r * Math.sin(rad)
  ```
- **備考**: `CompassGauge` 内部では同じロジックが `p(r, d)` ヘルパーとして再定義されている。将来的に `polarToSvg` に統合可能。

##### 9.3.10.2 CompassGauge

三重リング金属ベゼル + 72 本階層ティック + BLADE NEEDLE + セクター放射グラデ + BEARING 数値 + ハブディテールで構成される、Apple Watch Ultra Wayfinder 文字盤参照のコンパス SVG コンポーネント。

###### 引数

```javascript
const CompassGauge = ({ prefix, size = 260, bearing = 45 }) => { ... }
```

| 引数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `prefix` | string | なし（必須） | SVG ID 衝突回避用の接頭辞。`"idp_c"`（InstrumentDeckPhone）/ `"idp2_c"`（InstrumentDeckPad） |
| `size` | number | 260 | 描画サイズ（px）。実際は Phone 330 / Pad 420 で渡される |
| `bearing` | number | 45 | BLADE NEEDLE の向き（度、0 = 北に相当、時計回り） |

戻り値は `<svg>` 要素（`width`, `height`, `viewBox` 設定済み）。

###### 内部変数と座標系

```javascript
const CX = size / 2;
const CY = size / 2;
const k = size / 340;  // スケール係数
```

- `CX`, `CY`: 中心座標（px）
- `k`: スケール係数（size 340 を基準として全要素を比例拡縮）
  - Phone（size=330）: `k ≈ 0.971`
  - Pad（size=420）: `k ≈ 1.235`

###### 半径定数

| 変数 | 式 | 用途 |
|---|---|---|
| `rOuter` | `156 * k` | 最外周円半径（金属ベゼル外縁） |
| `rRing` | `150 * k` | 外周リング半径（ティック終点） |
| `rSep` | `128 * k` | セパレータリング半径（点線） |
| `rInner` | `100 * k` | 内周リング半径 |
| `rFace` | `94 * k` | face 内側の境界線半径 |
| `rDegText` | `137 * k` | 度数ラベル配置半径（rRing と rSep の間） |
| `rDirText` | `112 * k` | 方向ラベル配置半径（rSep と rInner の間） |

###### 配列定義

```javascript
const tickAngles = Array.from({ length: 72 }, (_, i) => i * 5);
const degLabels = [30, 60, 120, 150, 210, 240, 300, 330];
const directions = [
  { angle: 0, text: "追" }, { angle: 45, text: "追右" },
  { angle: 90, text: "右" }, { angle: 135, text: "向右" },
  { angle: 180, text: "向" }, { angle: 225, text: "向左" },
  { angle: 270, text: "左" }, { angle: 315, text: "追左" },
];
```

- `tickAngles`: `[0, 5, 10, ..., 355]` の 72 角度（5° 刻み）
- `degLabels`: cardinal（0 / 90 / 180 / 270）を除く 8 点
- `directions`: 8 方向日本語ラベル配列。§2.11.5 の `--wind-dir-*` とは**色を使わず、angle / text のみ**を保持（本コンポーネント内では slate / cyan の 2 色表現）

###### ヘルパー関数と SVG ID

```javascript
const rad = (d) => ((d - 90) * Math.PI) / 180;
const p = (r, d) => ({ x: CX + r * Math.cos(rad(d)), y: CY + r * Math.sin(rad(d)) });
const idF = `${prefix}_face`, idB = `${prefix}_bez`, idS = `${prefix}_sec`;
const idBL = `${prefix}_bl`, idBD = `${prefix}_bd`, idT = `${prefix}_tail`, idH = `${prefix}_hub`;
```

- `rad(d)`: 度をラジアンに変換（12 時方向を 0° に調整）
- `p(r, d)`: 極座標から SVG 座標への変換
- 7 つの SVG id: face / bez / sec / bl / bd / tail / hub

###### セクター放射パス計算

BEARING ± 12° の扇形領域を SVG path で定義。

```javascript
const half = 12;
const a1 = p(rRing - 1, bearing - half);
const a2 = p(rRing - 1, bearing + half);
const b2 = p(rSep + 1, bearing + half);
const b1 = p(rSep + 1, bearing - half);
const secD =
  `M ${a1.x} ${a1.y} ` +
  `A ${rRing - 1} ${rRing - 1} 0 0 1 ${a2.x} ${a2.y} ` +
  `L ${b2.x} ${b2.y} ` +
  `A ${rSep + 1} ${rSep + 1} 0 0 0 ${b1.x} ${b1.y} Z`;
```

- 外周側は `rRing - 1` の円弧（`a1 → a2`）
- 内周側は `rSep + 1` の円弧（`b2 → b1`、逆回り）
- 四角形状の扇形で、中心から外に向かって放射するグラデで塗る

###### SVG `<defs>` 内 gradient 定義（7 つ）

**`${prefix}_face`（face radial-gradient）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-bg-panel)` (#111827) |
| 1 | 70% | `var(--wind-bg-base)` (#0a0f1a) |
| 2 | 100% | `#020617`（§9.3.11 残余承認） |

属性: `cx="0.5"`, `cy="0.42"`, `r="0.65"`（中心から上寄りの楕円）

**`${prefix}_bez`（ベゼル linearGradient、金属調、縦方向）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-text-dim)` (#475569) |
| 1 | 50% | `var(--wind-edge)` (#1e293b) |
| 2 | 100% | `var(--wind-bg-surface)` (#0f172a) |

属性: `x1="0"`, `y1="0"`, `x2="0"`, `y2="1"`

**`${prefix}_sec`（セクター放射グラデ）**:

| stop | offset | stopColor | stopOpacity |
|---|---|---|---|
| 0 | 0% | `var(--wind-accent)` (#67e8f9) | 0 |
| 1 | 60% | `var(--wind-accent)` | 0.12 |
| 2 | 100% | `var(--wind-accent)` | 0.32 |

属性: `cx="0.5"`, `cy="0.5"`, `r="0.5"`

**`${prefix}_bl`（BLADE 明部 linearGradient、水平方向）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-accent-hi)` (#a5f3fc) |
| 1 | 45% | `var(--wind-accent)` (#67e8f9) |
| 2 | 100% | `var(--wind-accent-lo)` (#0e7490) |

属性: `x1="0"`, `y1="0"`, `x2="1"`, `y2="0"`

**`${prefix}_bd`（BLADE 暗部 linearGradient、水平方向）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-text-dim)` (#475569) |
| 1 | 100% | `var(--wind-edge)` (#1e293b) |

属性: `x1="0"`, `y1="0"`, `x2="1"`, `y2="0"`

**`${prefix}_tail`（NEEDLE 尾部 linearGradient、縦方向）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-text-dim)` (#475569) |
| 1 | 100% | `var(--wind-edge)` (#1e293b) |

属性: `x1="0"`, `y1="0"`, `x2="0"`, `y2="1"`

**`${prefix}_hub`（ハブ radial-gradient）**:

| stop | offset | stopColor |
|---|---|---|
| 0 | 0% | `var(--wind-edge)` (#1e293b) |
| 1 | 100% | `#020617`（§9.3.11 残余承認） |

属性: `cx="0.5"`, `cy="0.5"`, `r="0.5"`

###### 描画順序（14 段階、レイヤー重ね順）

**1. face 円**: 最下層のコンパス盤面

- `<circle cx=CX cy=CY r=rOuter fill="url(#${prefix}_face)" />`

**2. ベゼル外周 stroke**: 金属調の外縁

- `<circle cx=CX cy=CY r=rOuter stroke="url(#${prefix}_bez)" strokeWidth={3 * k} fill="none" />`

**3. face 内縁 stroke**: ベゼル内側の境界線（暗色）

- `<circle cx=CX cy=CY r={rOuter - 3 * k} stroke="#020617" strokeWidth="1" fill="none" />`
- `#020617` は §9.3.11 残余承認

**4. ring 円 stroke**: ティック外周リング

- `<circle cx=CX cy=CY r=rRing stroke="#334155" strokeWidth="1" fill="none" />`
- `#334155` は §9.3.11 残余承認

**5. セクター放射パス**: BEARING ± 12° の扇形塗り

- `<path d={secD} fill="url(#${prefix}_sec)" />`
- 「現在の方位を示す淡い光の扇」として機能

**6. 72 本階層ティック**（4 階層で分岐）:

`tickAngles.map((a) => { ... })` で全 72 本を描画。各ティックは `inset`（rRing からの内側オフセット）、`stroke` 色、`sw`（strokeWidth）で階層分けされる:

| 階層 | 条件 | inset | stroke | strokeWidth |
|---|---|---|---|---|
| cardinal | `a % 90 === 0`（0 / 90 / 180 / 270） | `18 * k` | `var(--wind-text-primary)` (#e2e8f0) | 2.4 |
| major | `a % 30 === 0`（cardinal 除く） | `14 * k` | `#cbd5e1`（§9.3.11 残余承認） | 1.8 |
| medium | `a % 15 === 0`（上記除く） | `10 * k` | `var(--wind-text-slate)` (#94a3b8) | 1.2 |
| minor | その他 | `6 * k` | `var(--wind-text-dim)` (#475569) | 0.9 |

各ティックは `r1 = rRing - inset` から `rRing` まで放射状に描画:

```jsx
<line
  x1={CX + r1 * Math.cos(rad(a))} y1={CY + r1 * Math.sin(rad(a))}
  x2={CX + rRing * Math.cos(rad(a))} y2={CY + rRing * Math.sin(rad(a))}
  stroke={stroke} strokeWidth={sw}
/>
```

**7. sep 円 stroke（点線）**: セパレータリング

- `<circle cx=CX cy=CY r=rSep stroke="var(--wind-edge)" strokeWidth="0.8" strokeDasharray="1 3" fill="none" />`

**8. 8 度数ラベル**: 030° / 060° / 120° / 150° / 210° / 240° / 300° / 330°

- `degLabels.map((a) => { ... })` で 8 点描画
- 位置: `p(rDegText, a)` = rDegText 半径上
- `<text x={pt.x} y={pt.y} fill="var(--wind-text-muted)" fontSize={9 * k} fontWeight={600} textAnchor="middle" dominantBaseline="middle" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.5">{String(a).padStart(3, "0")}</text>`
- 表示は 3 桁 0 埋め（`030` / `060` / ...）

**9. 8 方向ラベル**: 追 / 追右 / 右 / 向右 / 向 / 向左 / 左 / 追左

- `directions.map((d) => { ... })` で 8 点描画
- 位置: `p(rDirText, d.angle)`
- 強調条件: `em = d.angle === bearing`
- `<text x={pt.x} y={pt.y} fill={em ? "var(--wind-accent)" : "var(--wind-text-slate)"} fontSize={em ? 13 * k : 11 * k} fontWeight={em ? 800 : 600} textAnchor="middle" dominantBaseline="middle" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">{d.text}</text>`
- 日本語のため `Hiragino Sans` ファミリ（§3.5 L4 設計パターン参照）

**10. inner 円 stroke**: 内周リング

- `<circle cx=CX cy=CY r=rInner stroke="var(--wind-edge)" strokeWidth="0.8" fill="none" />`

**11. face 境界 stroke**: face 内縁

- `<circle cx=CX cy=CY r=rFace stroke="var(--wind-bg-surface)" strokeWidth="0.6" fill="none" />`

**12. 上部シェブロン**: 12 時位置の静的三角マーカー

- `<polygon points="${CX - 6 * k},${CY - rOuter - 8 * k} ${CX + 6 * k},${CY - rOuter - 8 * k} ${CX},${CY - rOuter + 2 * k}" fill="var(--wind-text-primary)" />`
- コンパス外側にせり出す小さな矢印、基準点マーカーの役割

**13. BEARING ラベル + 数値**: ハブ上部の方位数値

- BEARING 文字（`y=CY - 42 * k`）:
  - `<text x=CX y={CY - 42 * k} fill="var(--wind-text-dim)" fontSize={9 * k} fontWeight={700} textAnchor="middle" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">BEARING</text>`
- 数値（`y=CY - 26 * k`、3 桁 0 埋め + `°`）:
  - `<text x=CX y={CY - 26 * k} fill="var(--wind-accent)" fontSize={18 * k} fontWeight={700} textAnchor="middle" fontFamily="'JetBrains Mono', monospace">{String(bearing).padStart(3, "0")}°</text>`

**14. BLADE NEEDLE グループ**: 回転する矢印本体

ルートに `transform: rotate(${bearing}deg); transformOrigin: ${CX}px ${CY}px` を適用した `<g>` 要素として定義。`transition: transform 0.3s ease`（§9.3.8 参照）で変化時にアニメーション。

内部は 8 サブパスで構成:

**14-1. Tail path（尾部、台形）**:

- `d = "M {CX - 7 * k} {CY + 4 * k} L {CX + 7 * k} {CY + 4 * k} L {CX + 4 * k} {CY + 44 * k} L {CX - 4 * k} {CY + 44 * k} Z"`
- fill: `url(#${prefix}_tail)`

**14-2. BLADE 明部 path（三角、全面）**:

- `d = "M {CX} {CY - 118 * k} L {CX + 7 * k} {CY - 4 * k} L {CX - 7 * k} {CY - 4 * k} Z"`
- fill: `url(#${prefix}_bl)`

**14-3. BLADE 暗部 path（右半三角、fillOpacity 0.55）**:

- `d = "M {CX} {CY - 118 * k} L {CX + 7 * k} {CY - 4 * k} L {CX + 3 * k} {CY - 4 * k} Z"`
- fill: `url(#${prefix}_bd)`
- fillOpacity: `0.55`

**14-4. 内部 line（中心軸）**:

- `<line x1=CX y1={CY - 114 * k} x2=CX y2={CY - 4 * k} stroke="var(--wind-accent-hi)" strokeWidth="1" strokeOpacity="0.9" />`

**14-5. 先端ドット**:

- `<circle cx=CX cy={CY - 112 * k} r={1.4 * k} fill="#ffffff" fillOpacity="0.9" />`
- `#ffffff` は §9.3.11 残余承認（pure white）

**14-6. ハブ大円**:

- `<circle cx=CX cy=CY r={16 * k} fill="url(#${prefix}_hub)" stroke="var(--wind-accent)" strokeWidth="1.5" />`

**14-7. ハブ中円（内部リング、fill なし）**:

- `<circle cx=CX cy=CY r={11 * k} fill="none" stroke="var(--wind-accent-lo)" strokeWidth="1" />`

**14-8. ハブ中心円 + ハイライト + 左右小ドット**:

- ハブ中心円: `<circle cx=CX cy=CY r={6 * k} fill="#020617" />`（§9.3.11 残余承認）
- ハイライト: `<circle cx=CX cy=CY r={2.4 * k} fill="var(--wind-accent-hi)" />`
- 左小ドット: `<circle cx={CX - 12 * k} cy=CY r={1.2 * k} fill="#020617" stroke="var(--wind-accent-lo)" strokeWidth="0.6" />`
- 右小ドット: `<circle cx={CX + 12 * k} cy=CY r={1.2 * k} fill="#020617" stroke="var(--wind-accent-lo)" strokeWidth="0.6" />`

###### 回転とトランジション

BLADE NEEDLE グループ全体に適用:

```jsx
<g style={{
  transform: `rotate(${bearing}deg)`,
  transformOrigin: `${CX}px ${CY}px`,
}}>
  {/* 14-1 〜 14-8 */}
</g>
```

- `transition: transform 0.3s ease` は §9.3.8 で定義される外側の CSS（SVG `<g>` の style 経由で effect 可能）
- bearing が変化すると 0.3 秒かけて滑らかに回転
- 他の 13 要素（静的なコンパス盤面）は回転しない

###### §9.3.5 との分担

本節（§9.3.10.2）は CompassGauge の **内部実装**（SVG 構造・座標・色適用・描画順序）を正典化する。§9.3.5 は CompassGauge の **ユーザー視点仕様**（サイズ・構成要素の概要・状態依存挙動）を記述する。両節は相互補完関係にあり、矛盾があれば実装（`src/components/WindMonitorModal.jsx`）が優先される（§9.1 原則）。

##### 9.3.10.3 BezelPanel

リベット付き金属パネル。WindMonitor 内のほぼ全セクション（WIND · NOW / COMPASS / PEAK / AVG / BAT / TIMELINE · 5 MIN）を包む統一された質感の箱として機能する。4 隅のリベット + 左上切り欠き title + 右上 corner ラベル + radial-gradient 背景で Industrial 美学の基底を作る。

###### 引数

```javascript
const BezelPanel = ({ children, style, title, corner }) => { ... }
```

| 引数 | 型 | 必須 | 説明 |
|---|---|---|---|
| `children` | ReactNode | 必須 | パネル内部に配置するコンテンツ |
| `style` | CSSProperties | 任意 | ルート div の style を上書き（`padding` や `flex` 等を個別調整する用途） |
| `title` | string | 任意 | 左上切り欠きに表示するタイトル文字列。truthy 時のみ描画 |
| `corner` | string | 任意 | 右上に表示するコーナーラベル文字列。truthy 時のみ描画 |

戻り値はルート `<div>` 要素。

###### 構造

4 つの子要素を `position: absolute` で重ね、children を通常フローで配置する構成。

**ルート div の style**:

```javascript
{
  position: "relative",
  background: "radial-gradient(ellipse at top, var(--wind-bg-panel) 0%, var(--wind-bg-base) 60%, #050914 100%)",
  border: "1px solid var(--wind-edge)",
  boxShadow: "inset 0 1px 0 rgba(148,163,184,0.08), inset 0 0 0 1px #020617, 0 8px 24px rgba(0,0,0,0.5)",
  borderRadius: 10,
  padding: 14,
  ...style,  // 呼び出し側の style で上書き可能
}
```

- `background`: 上部明るく下部暗い radial-gradient
  - `var(--wind-bg-panel)` (#111827) → `var(--wind-bg-base)` (#0a0f1a) → `#050914`（§9.3.11 残余承認）
- `border`: `1px solid var(--wind-edge)` (#1e293b)
- `boxShadow`: 3 層のシャドウ（inset 上端ハイライト / inset 全面縁取り / 外側ドロップシャドウ）
  - `rgba(148,163,184,0.08)`: §9.3.11 残余承認（slate 系 8% ハイライト）
  - `#020617`: §9.3.11 残余承認（最深色の inset 縁取り）
  - `rgba(0,0,0,0.5)`: §9.3.11 残余承認（外側のドロップシャドウ）
- `borderRadius: 10`
- `padding: 14`（呼び出し側で style に padding を渡すと上書きされる）

###### 4 隅のリベット（4 つの子 div）

ルートの 4 隅に配置される小さな正方形のリベット装飾。各 4×4px、`borderRadius: 2` で角丸の金属ねじ頭を模す。

```javascript
[
  ["tl", { top: 6, left: 6 }],
  ["tr", { top: 6, right: 6 }],
  ["bl", { bottom: 6, left: 6 }],
  ["br", { bottom: 6, right: 6 }],
].map(([k, pos]) => (
  <div key={k} style={{
    position: "absolute",
    width: 4, height: 4, borderRadius: 2,
    background: "#020617",
    boxShadow: "inset 0 0 0 0.5px var(--wind-text-dim)",
    ...pos,
  }} />
))
```

各リベットの style:

- `position: absolute`
- `width: 4`、`height: 4`、`borderRadius: 2`
- `background: "#020617"`（§9.3.11 残余承認、最深色）
- `boxShadow: "inset 0 0 0 0.5px var(--wind-text-dim)"`（#475569 の 0.5px inset、金属縁の光沢表現）
- 位置: top-left / top-right / bottom-left / bottom-right の 4 パターン、各 6px インセット

###### title（左上切り欠き、条件付き描画）

`title` プロパティが truthy なときのみ描画。パネル左上の border を「切り欠く」形で小さなラベルボックスを浮かべる。

```jsx
{title && (
  <div style={{
    position: "absolute", top: -9, left: 12, padding: "2px 8px",
    background: "var(--wind-bg-base)",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 700,
    color: "var(--wind-text-slate)",
    letterSpacing: 2,
  }}>{title}</div>
)}
```

style 詳細:

- `position: absolute`、`top: -9`（border の 1px を上方に貫く）、`left: 12`
- `padding: "2px 8px"`
- `background: "var(--wind-bg-base)"` (#0a0f1a)（モーダル背景と同色で border を「切り欠き」に見せる）
- `fontFamily: "'JetBrains Mono', monospace"`
- `fontSize: 9`、`fontWeight: 700`
- `color: "var(--wind-text-slate)"` (#94a3b8)
- `letterSpacing: 2`

渡される title の例: `"WIND · NOW"` / `"COMPASS · 045°"` / `"PEAK"` / `"AVG"` / `"BAT"` / `"TIMELINE · 5 MIN"`

###### corner（右上コーナーラベル、条件付き描画）

`corner` プロパティが truthy なときのみ描画。パネル右上の内側に小さな補助ラベルを配置。

```jsx
{corner && (
  <div style={{
    position: "absolute", top: 8, right: 12,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9, fontWeight: 700,
    color: "var(--wind-text-muted)",
    letterSpacing: 1.5,
  }}>{corner}</div>
)}
```

style 詳細:

- `position: absolute`、`top: 8`、`right: 12`（border 内側に配置）
- `fontFamily: "'JetBrains Mono', monospace"`
- `fontSize: 9`、`fontWeight: 700`
- `color: "var(--wind-text-muted)"` (#64748b)（title より暗色）
- `letterSpacing: 1.5`

渡される corner の例: `"m/s"` / `"5min"` / `"OK"` / `"R.S-7"` / `"0.0 m/s →"` / `"追"` / `"⚠"` / `"未設定"` / `"---"`

###### 描画順序

JSX で記述された順序のとおり、後で定義した要素が上に重なる:

1. ルート div（radial-gradient 背景 + ボーダー + 影）
2. 4 隅リベット × 4 個（`position: absolute`）
3. title 切り欠き（`position: absolute`、条件付き）
4. corner ラベル（`position: absolute`、条件付き）
5. children（通常フロー、パネル内部コンテンツ）

children は `position: absolute` の子要素より下の z-index を持つが、通常フローで配置されるため、リベット・title・corner と視覚的に重なることはない（リベットは 4 隅の 6px 内側、title は上端、corner は右上の 8px 下に配置）。

###### style 上書きの典型例

- Hero カード: `style={{ padding: "20px 20px 18px" }}`（統計カードより深いパディング）
- 統計カード（Phone）: `style={{ padding: "14px 8px 10px" }}`
- 統計カード（Pad）: `style={{ padding: "18px 10px 12px" }}`
- TIMELINE: `style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}`（残余高さを埋める）

##### 9.3.10.4 WindChart

風速推移折れ線 + 風向色帯の SVG コンポーネント。直近 5 分のサンプルを折れ線グラフで描画し、下部に相対風向の色帯を表示する。

###### 引数

```javascript
const WindChart = ({
  width, height, accent = "#34d399", prefix = "wc",
  validSamples, xOfSample, yOf,
  marginL, marginT, plotW, plotH, chartH, yMax,
  connected,
}) => { ... }
```

| 引数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `width` | number | 必須 | SVG viewBox 幅（Phone 356 / Pad 736） |
| `height` | number | 必須 | SVG viewBox 高さ（Phone 120 / Pad 280） |
| `accent` | string | `"#34d399"` | 折れ線と塗りのアクセントカラー |
| `prefix` | string | `"wc"` | SVG ID 衝突回避用の接頭辞（Phone `"idp_ch"` / Pad `"idp2_ch"`） |
| `validSamples` | Array | 必須 | タイムスタンプが有効なサンプル配列 |
| `xOfSample` | function | 必須 | サンプルを X 座標に変換する関数 |
| `yOf` | function | 必須 | 風速を Y 座標に変換する関数 |
| `marginL` | number | 必須 | 左マージン（Phone 32 / Pad 36） |
| `marginT` | number | 必須 | 上マージン（固定 12） |
| `plotW` | number | 必須 | プロット領域幅（`chartW - marginL - 12`） |
| `plotH` | number | 必須 | プロット領域高さ（`chartH - marginT - marginB`） |
| `chartH` | number | 必須 | SVG 高さ全体（= `height`） |
| `yMax` | number | 必須 | Y 軸最大値 |
| `connected` | boolean | 必須 | 接続状態（フォールバックテキスト分岐用） |

###### SVG ルート

```jsx
<svg
  width="100%"
  height={height}
  viewBox={`0 0 ${width} ${height}`}
  preserveAspectRatio="none"
  style={{ display: "block" }}
>
  {/* defs → 描画内容 */}
</svg>
```

- `width="100%"`: コンテナに対してフル幅
- `height`: 引数からの固定値
- `viewBox`: `0 0 ${width} ${height}`
- `preserveAspectRatio="none"`: 横方向の自動スケール（縦は保持）
- `style={{ display: "block" }}`: 下部の余白を除去

###### `<defs>` 内の id 定義（3 つ）

```jsx
<defs>
  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
    <stop offset="100%" stopColor={accent} stopOpacity="0" />
  </linearGradient>
  <clipPath id={clipId}>
    <rect x={marginL} y={marginT} width={plotW} height={plotH} />
  </clipPath>
  <clipPath id={bandClipId}>
    <rect x={marginL} y={chartH - 24 - 4} width={plotW} height={4} />
  </clipPath>
</defs>
```

内部変数（関数冒頭で定義）:

- `gradId = `${prefix}_grad``
- `clipId = `${prefix}_clip``
- `bandClipId = `${prefix}_band``

**gradient（折れ線塗り用、縦方向）**:

| stop | offset | stopColor | stopOpacity |
|---|---|---|---|
| 0 | 0% | `accent`（引数） | 0.25 |
| 1 | 100% | `accent` | 0 |

**clipPath（plot 領域用）**: `x=marginL, y=marginT, width=plotW, height=plotH` の矩形

**clipPath（band 領域用）**: `x=marginL, y=chartH - 24 - 4, width=plotW, height=4` の矩形（X 軸ラベル上方 4px の帯）

###### Y 軸グリッド線（水平 3 本）

```jsx
<line x1={marginL} y1={marginT} x2={marginL + plotW} y2={marginT}
  stroke="var(--wind-edge)" strokeDasharray="2 4" />
<line x1={marginL} y1={marginT + plotH / 2} x2={marginL + plotW} y2={marginT + plotH / 2}
  stroke="var(--wind-edge)" strokeDasharray="2 4" />
<line x1={marginL} y1={marginT + plotH} x2={marginL + plotW} y2={marginT + plotH}
  stroke="var(--wind-edge)" strokeDasharray="2 4" />
```

- 上端（`y=marginT`、値 `yMax`）
- 中央（`y=marginT + plotH/2`、値 `yMax/2`）
- 下端（`y=marginT + plotH`、値 `0`）
- 共通 stroke: `var(--wind-edge)` (#1e293b)、`strokeDasharray: "2 4"`

###### Y 軸ラベル（3 点）

```jsx
<text x={marginL - 4} y={marginT} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="end" dominantBaseline="hanging"
  fontFamily="'JetBrains Mono', monospace">
  {yMax.toFixed(1)}
</text>
<text x={marginL - 4} y={marginT + plotH / 2} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="end" dominantBaseline="middle"
  fontFamily="'JetBrains Mono', monospace">
  {(yMax / 2).toFixed(1)}
</text>
<text x={marginL - 4} y={marginT + plotH} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="end" dominantBaseline="baseline"
  fontFamily="'JetBrains Mono', monospace">
  0.0
</text>
```

| 位置 | y | 表示値 | dominantBaseline |
|---|---|---|---|
| 上端 | `marginT` | `yMax.toFixed(1)` | `hanging` |
| 中央 | `marginT + plotH / 2` | `(yMax / 2).toFixed(1)` | `middle` |
| 下端 | `marginT + plotH` | `"0.0"` | `baseline` |

- 共通: `x=marginL - 4`（グリッド左外側 4px）、`fill="var(--wind-text-dim)"` (#475569)、`fontSize=9`、`textAnchor="end"`、`fontFamily="'JetBrains Mono', monospace"`

###### 折れ線と塗り（条件付き描画）

`validSamples.length >= 2` のときのみ描画。

**lineD と fillD の計算（コンポーネント冒頭）**:

```javascript
let lineD = "";
let fillD = "";
if (validSamples.length >= 2) {
  const points = validSamples.map((s) => ({
    x: xOfSample(s),
    y: yOf(typeof s.wind_speed === "number" ? s.wind_speed : 0),
  }));
  lineD = points
    .map((p, i) => (i === 0 ? "M " : "L ") + p.x.toFixed(1) + " " + p.y.toFixed(1))
    .join(" ");
  const lastX = points[points.length - 1].x;
  const firstX = points[0].x;
  fillD = lineD
    + " L " + lastX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
    + " L " + firstX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
    + " Z";
}
```

- `lineD`: 各サンプル点を `M x y L x y ...` 形式で連結（最初のみ `M`、以降 `L`）
- `fillD`: `lineD` + `" L lastX plotBottom L firstX plotBottom Z"`（下部を閉じて塗りつぶし領域を作る）

**JSX 描画**:

```jsx
{validSamples.length >= 2 ? (
  <g clipPath={`url(#${clipId})`}>
    <path d={fillD} fill={`url(#${gradId})`} />
    <path d={lineD} fill="none" stroke={accent} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" />
    {validSamples.map((s, i) => {
      const x = xOfSample(s);
      const y = yOf(typeof s.wind_speed === "number" ? s.wind_speed : 0);
      return <circle key={i} cx={x} cy={y} r={1.6} fill={accent} />;
    })}
  </g>
) : (
  <text x={marginL + plotW / 2} y={marginT + plotH / 2}
    fill="var(--wind-text-dim)" fontSize={12}
    textAnchor="middle" dominantBaseline="middle">
    {connected ? "データ収集中..." : "未接続"}
  </text>
)}
```

**描画順序（validSamples.length >= 2 のとき）**:

1. `<g clipPath="url(#clip)">` で plot 領域にクリップ
2. 塗りつぶし path: `fill=url(#grad)`（gradient）
3. 折れ線 path: `stroke=accent`、`strokeWidth=1.6`、`strokeLinecap=round`、`strokeLinejoin=round`、`fill=none`
4. データ点: 各 validSample 位置に circle（`r=1.6`、`fill=accent`）

**フォールバックテキスト（validSamples.length < 2 のとき）**:

- 位置: plot 領域中央（`x=marginL + plotW/2`、`y=marginT + plotH/2`）
- fill: `var(--wind-text-dim)`
- fontSize: 12
- textAnchor: `middle`、dominantBaseline: `middle`
- テキスト:
  - `connected === true`: `"データ収集中..."`
  - `connected === false`: `"未接続"`

###### 風向色帯（タイムライン下部、条件付き描画）

`validSamples.length >= 2` のときのみ描画。`calcRelativeWind()`（§9.3.5）で計算した各サンプルの相対風向色を rect で横並びにする。

```jsx
{validSamples.length >= 2 && (() => {
  const bandY = chartH - 24 - 4;
  const rightEdge = marginL + plotW;
  const points = validSamples.map((s) => ({
    x: xOfSample(s),
    color: (() => {
      const rw = calcRelativeWind(s);
      return rw ? rw.color : "var(--wind-edge)";
    })(),
  }));
  return (
    <g clipPath={`url(#${bandClipId})`}>
      {points.map((pt, i) => {
        const x1 = pt.x;
        const x2 = i < points.length - 1 ? points[i + 1].x : rightEdge;
        const w = Math.max(0, x2 - x1);
        return (
          <rect key={`band-${i}`} x={x1} y={bandY} width={w} height={4} fill={pt.color} />
        );
      })}
    </g>
  );
})()}
```

- `bandY = chartH - 24 - 4`（X 軸ラベル上方 4px）
- 各セグメント:
  - `x1`: `pt.x`（サンプル i の X 座標）
  - `x2`: 次サンプルの X 座標、または最終サンプルは `rightEdge = marginL + plotW`
  - `w`: `max(0, x2 - x1)`
  - `y`: `bandY`（固定）
  - `height`: 4
  - `fill`: `calcRelativeWind(sample).color`（§2.11.5 Wind Direction Palette の 5 色のいずれか）、計算不可なら `var(--wind-edge)` (#1e293b)

###### X 軸ラベル（固定 4 点）

サンプル数に関わらず常に固定位置に描画。

```jsx
<text x={marginL} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="start" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
  5分前
</text>
<text x={marginL + plotW * 0.4} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="middle" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
  3分前
</text>
<text x={marginL + plotW * 0.8} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="middle" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
  1分前
</text>
<text x={marginL + plotW} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
  textAnchor="end" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
  今
</text>
```

| x | 表示値 | textAnchor |
|---|---|---|
| `marginL`（左端） | `"5分前"` | `start` |
| `marginL + plotW * 0.4` | `"3分前"` | `middle` |
| `marginL + plotW * 0.8` | `"1分前"` | `middle` |
| `marginL + plotW`（右端） | `"今"` | `end` |

- 共通: `y=chartH - 6`、`fill="var(--wind-text-dim)"` (#475569)、`fontSize=9`、`fontFamily="-apple-system, 'Hiragino Sans', sans-serif"`（日本語のため、§3.5 L4 設計パターン参照）

###### 全描画順序のまとめ

SVG 内部の要素順（z-index と同等）:

1. `<defs>`（不可視定義）
2. Y 軸グリッド線 × 3
3. Y 軸ラベル × 3
4. 折れ線エリア（clipPath=clip 内）: 塗りつぶし → 折れ線 → データ点 × N
   - または validSamples < 2 のときはフォールバックテキスト 1 つ
5. 風向色帯（clipPath=band 内）: rect × N（condition 付き）
6. X 軸ラベル × 4

###### §9.3.7 との分担

§9.3.7 は WindChart の **ユーザー視点仕様**（ウィンドウ / サンプリング / SVG サイズ / マージン計算等）を記述する。本節（§9.3.10.4）は WindChart の **内部実装**（引数 / defs / 描画順序 / lineD・fillD 計算式 / 風向色帯ロジック）を正典化する。両節は相互補完関係にあり、矛盾があれば実装（`src/components/WindMonitorModal.jsx`）が優先される（§9.1 原則）。

##### 9.3.10.5 DeckHeader

WindMonitor 画面最上部の「計器盤ヘッダーバー」。閉じるボタン + WIND · MONITOR ラベル（左グループ）+ T+ タイマー + LINKED ステータス（右グループ）で構成される、Industrial 美学の入口となる要素。

###### 引数

```javascript
const DeckHeader = ({ scale = 1, session = "00:00", connected = false, onClose }) => { ... }
```

| 引数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `scale` | number | 1 | 全体拡縮係数（Phone: 1.0 / Pad: 1.35）。padding / fontSize / gap / minHeight に乗算される |
| `session` | string | `"00:00"` | T+ タイマー表示用の経過時刻文字列（`formatElapsed(sessionElapsed)` の戻り値） |
| `connected` | boolean | false | WebSocket 接続状態。ドット色 / ラベル色 / animation 分岐に使用 |
| `onClose` | function | 任意 | 閉じるボタンの `onClick` ハンドラ |

###### ルート構造

```javascript
{
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: `${8 * scale}px ${12 * scale}px`,
  background: "linear-gradient(180deg, var(--wind-bg-panel) 0%, #0b1220 100%)",
  border: "1px solid var(--wind-edge)",
  boxShadow: "inset 0 1px 0 rgba(148,163,184,0.1), inset 0 -1px 0 #020617",
  borderRadius: 8,
}
```

- `padding`: `scale` 連動（Phone: 8×12 / Pad: 10.8×16.2）
- `background`: 縦方向 linear-gradient（`var(--wind-bg-panel)` → `#0b1220`、§9.3.11 残余承認）
- `border`: `1px solid var(--wind-edge)`
- `boxShadow`: 2 層の inset（上端ハイライト + 下端最深色）
  - `rgba(148,163,184,0.1)`: §9.3.11 残余承認
  - `#020617`: §9.3.11 残余承認
- `borderRadius: 8`

###### 左グループ（閉じる + WIND · MONITOR）

```javascript
{ display: "flex", alignItems: "center", gap: 10 * scale }
```

**閉じるボタン**:

```javascript
<button type="button" onClick={onClose} style={{
  padding: `${5 * scale}px ${10 * scale}px`,
  border: "1px solid #334155",
  borderRadius: 6,
  background: "transparent",
  color: "var(--wind-text-slate)",
  fontSize: 11 * scale,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  minHeight: 32 * scale,
}}>
  ← 閉じる
</button>
```

- `padding`: `scale` 連動
- `border: 1px solid #334155`（§9.3.11 残余承認）
- `borderRadius: 6`
- `background: transparent`（ヘッダー背景が透ける）
- `color: var(--wind-text-slate)` (#94a3b8)
- `fontSize: 11 * scale`、`fontWeight: 700`
- `fontFamily: "inherit"`（親の Hiragino Sans を継承、日本語のため）
- `minHeight: 32 * scale`（タッチターゲット確保、§4.3）
- テキスト: `"← 閉じる"`

**WIND · MONITOR ラベル**:

```javascript
{
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10 * scale, fontWeight: 700,
  color: "var(--wind-text-muted)", letterSpacing: 2,
}
```

- テキスト: `"WIND · MONITOR"`（固定文字列）

###### 右グループ（T+ タイマー + LINKED ステータス）

```javascript
{ display: "flex", gap: 12 * scale, alignItems: "center" }
```

**T+ タイマー**:

```javascript
{
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10 * scale, color: "var(--wind-text-muted)", letterSpacing: 1.5,
}
```

- テキスト: `` `T+ ${session}` ``（例: `T+ 12:34`）

**LINKED ステータス**（ドット + ラベル、`gap: 5`）:

**ドット**:

```javascript
{
  width: 7, height: 7, borderRadius: 4,
  background: connected ? "var(--wind-linked)" : "var(--wind-severe)",
  boxShadow: connected
    ? "0 0 8px rgba(52,211,153,0.8)"
    : "0 0 8px rgba(239,68,68,0.5)",
  animation: connected ? "none" : "wind-monitor-blink 3s ease-in-out infinite",
}
```

| 状態 | background | boxShadow | animation |
|---|---|---|---|
| 接続中（`connected === true`） | `var(--wind-linked)` (#34d399) | `0 0 8px rgba(52,211,153,0.8)`（§9.3.11 残余） | `"none"`（静的） |
| 切断中（`connected === false`） | `var(--wind-severe)` (#ef4444) | `0 0 8px rgba(239,68,68,0.5)`（§9.3.11 残余） | `wind-monitor-blink 3s ease-in-out infinite`（§9.3.8） |

**ラベル**:

```javascript
{
  fontSize: 10 * scale, fontWeight: 700,
  color: connected ? "var(--wind-linked)" : "var(--wind-severe)",
  letterSpacing: 1.5,
  fontFamily: "'JetBrains Mono', monospace",
}
```

- テキスト: `connected ? "LINKED" : "DISCONNECTED"`
- 色はドットと同色で動的分岐

##### 9.3.10.6 DeckFooter

WindMonitor 画面最下部の「計器盤フッター」。3 項目の装飾文字列を `flex: space-between` で横並び配置する、機能なしの純装飾要素。

###### 引数

```javascript
const DeckFooter = ({ scale = 1 }) => { ... }
```

| 引数 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `scale` | number | 1 | 拡縮係数（Phone: 1.0 / Pad: 1.3）。fontSize に乗算 |

###### 構造

```javascript
{
  display: "flex", justifyContent: "space-between", padding: "0 6px",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 9 * scale, color: "var(--wind-text-dim)", letterSpacing: 1.5,
}
```

- `display: flex`、`justifyContent: "space-between"`
- `padding: "0 6px"`（固定、scale 非連動）
- `fontSize: 9 * scale`
- `color: var(--wind-text-dim)` (#475569)
- `letterSpacing: 1.5`

###### 3 項目（`<span>` ×3）

| 位置 | テキスト |
|---|---|
| 左 | `"WX-02 ▪ FW 1.4.2"` |
| 中央 | `"SIG -- dBm"` |
| 右 | `"1 Hz"` |

- `▪` は黒四角（U+25AA）、コードポイントに注意
- テキストは固定（実装上は変数化されていない装飾文字列）

##### 9.3.10.7 InstrumentDeckPhone

iPhone 縦向きレイアウト（`window.innerWidth < 768`）用の WindMonitor 画面本体。DeckHeader → BezelPanel WIND · NOW → BezelPanel COMPASS → 統計カード 3 列 → BezelPanel TIMELINE → DeckFooter の 6 要素を縦積みする。

###### 引数

```javascript
const InstrumentDeckPhone = ({
  connected, currentData, stats, relativeWind,
  validSamples, xOfSample, yOf,
  marginL, marginT, plotW, plotH, chartH, yMax,
  sessionElapsed, onClose,
}) => { ... }
```

WindMonitorModal 本体（§9.3.10.9）から計算済みの値をすべて受け取る。

###### 派生変数（関数冒頭で定義）

```javascript
const hasWindSpeed = connected && currentData && typeof currentData.wind_speed === "number";
const heroText = hasWindSpeed ? currentData.wind_speed.toFixed(1) : "---";
const heroColor = hasWindSpeed
  ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
  : "var(--wind-text-muted)";
const heroAnimation = hasWindSpeed ? "wind-monitor-hero-pulse 3s ease-in-out infinite" : "none";
const rampLabel = hasWindSpeed ? getWindRampLabel(currentData.wind_speed) : "---";
const rampColor = hasWindSpeed
  ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
  : "var(--wind-text-muted)";
const gaugePctRaw = hasWindSpeed ? (currentData.wind_speed / 5) * 100 : 0;
const gaugePct = Math.max(0, Math.min(100, gaugePctRaw));
const gaugeShow = hasWindSpeed;
const bearing = relativeWind ? Math.round(relativeWind.angle) : 0;
const compassTitle = (connected && relativeWind)
  ? `COMPASS · ${String(bearing).padStart(3, "0")}°`
  : "COMPASS · ---";

let compassCorner;
if (!connected) compassCorner = "---";
else if (currentData && currentData.compass_valid === false) compassCorner = "⚠";
else if (currentData && currentData.throw_direction == null) compassCorner = "未設定";
else if (relativeWind) compassCorner = relativeWind.label;
else compassCorner = "---";
```

PEAK / AVG / BAT カードの派生変数は § 9.3.6 の仕様に準拠。

```javascript
const timelineCorner = hasWindSpeed
  ? `${currentData.wind_speed.toFixed(1)} m/s →`
  : "--- m/s →";
```

###### ルート div

```javascript
{
  maxWidth: 420, margin: "0 auto", minHeight: "100vh",
  background: "radial-gradient(ellipse at 30% 0%, var(--wind-bg-surface) 0%, var(--wind-bg-base) 55%, #020617 100%)",
  color: "var(--wind-text-primary)",
  fontFamily: "-apple-system, 'Hiragino Sans', sans-serif",
  padding: 12, boxSizing: "border-box",
  position: "relative", overflow: "hidden",
  display: "flex", flexDirection: "column", gap: 12,
}
```

- `maxWidth: 420`、`margin: "0 auto"`（中央寄せ）
- `minHeight: "100vh"`
- `background`: 3 stop の radial-gradient（`#020617` は §9.3.11 残余）
- `fontFamily`: Hiragino Sans（日本語）
- `padding: 12`、`gap: 12`（セクション間）

###### 構造（縦積み 7 要素）

1. **背景グリッド SVG**: 全面 `position: absolute; inset: 0; opacity: 0.05; pointerEvents: none`
   - `<pattern id="idp_grid" width="32" height="32" patternUnits="userSpaceOnUse">`
   - `<path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--wind-text-slate)" strokeWidth="0.5" />`
2. **DeckHeader**: `scale=1`、`session=formatElapsed(sessionElapsed)`、`connected={connected}`、`onClose={onClose}`
3. **BezelPanel WIND · NOW**（title `"WIND · NOW"`、corner `"m/s"`）:
   - Hero 数値行（`flex; alignItems: baseline; justifyContent: center; gap: 4; padding: "10px 0 4px"`）:
     - 数値 span（fontSize 88、color `heroColor`、animation `heroAnimation`、letterSpacing -2、lineHeight 1、JetBrains Mono 700）
     - 単位 span（fontSize 16、color `var(--wind-text-muted)`、fontWeight 600、JetBrains Mono、テキスト `"m/s"`）
   - シェブロン SVG（§9.3.4 参照、`viewBox="0 0 260 18"`、height 14、marginTop 2）
   - レンジゲージ（§9.3.4 参照、高さ 6、背景 `#0b1220`、現在位置マーカー）
4. **BezelPanel COMPASS**（title `compassTitle`、corner `compassCorner`）:
   - `<CompassGauge prefix="idp_c" size={330} bearing={bearing} />`
5. **統計カード 3 列**（`display: grid; gridTemplateColumns: "1fr 1fr 1fr"; gap: 8`）:
   - PEAK / AVG / BAT 各 BezelPanel（title、padding `"14px 8px 10px"`）
   - 中央揃え（数値 fontSize 30、単位・サブ行 fontSize 9、§9.3.6 参照）
6. **BezelPanel TIMELINE · 5 MIN**（title `"TIMELINE · 5 MIN"`、corner `timelineCorner`、padding `"14px 10px 10px"`、`flex: 1; minHeight: 0; display: flex; flexDirection: column`）:
   - `<WindChart width={356} height={120} accent="#34d399" prefix="idp_ch" {...rest} />`
7. **DeckFooter**: `scale=1`

##### 9.3.10.8 InstrumentDeckPad

iPad 縦向きレイアウト（`window.innerWidth >= 768`）用の WindMonitor 画面本体。**InstrumentDeckPhone との差分のみ**を記述する。

###### Phone との共通仕様

- 引数は同一（`connected` / `currentData` / `stats` / `relativeWind` / `validSamples` / 座標変換関数 / `sessionElapsed` / `onClose`）
- 派生変数は同一（Hero + コンパス + PEAK / AVG / BAT 同じ計算ロジック）
- CompassGauge / BezelPanel / WindChart / DeckHeader / DeckFooter のコンポーネント利用は同一

###### Phone との差分

**Pad 独自の派生変数**（ticks 20 本バー用、§9.3.6 参照）:

```javascript
const peakTicks = stats.maxSpeed != null
  ? Math.round(Math.min(stats.maxSpeed / 10.0, 1.0) * 20) : 0;
const peakTickColor = stats.maxSpeed != null
  ? (getWindRampColor(stats.maxSpeed) || "var(--wind-text-muted)")
  : "var(--wind-text-muted)";
// avgTicks / avgTickColor / batTicks / batTickColor も同様

const cards = [
  { title: "PEAK", value: peakValue, unit: "m/s", sub: peakSub, corner: "5min", color: peakColor, ticks: peakTicks, tickColor: peakTickColor },
  { title: "AVG",  value: avgValue,  unit: "m/s", sub: avgSub,  corner: "5min", color: avgColor,  ticks: avgTicks,  tickColor: avgTickColor },
  { title: "BAT",  value: batValue,  unit: "%",   sub: batSub,  corner: "OK",   color: batColor,  ticks: batTicks,  tickColor: batTickColor },
];
```

**SKITTLE DIRECTION ラベル**（Phone 未実装、Pad 独自）:

```javascript
let skittleLabel;
if (!connected) skittleLabel = "SKITTLE DIRECTION · ---";
else if (currentData && currentData.compass_valid === false) skittleLabel = "SKITTLE DIRECTION · ⚠ コンパス異常";
else if (currentData && currentData.throw_direction == null) skittleLabel = "SKITTLE DIRECTION · 未設定";
else if (relativeWind) skittleLabel = `SKITTLE DIRECTION · ${relativeWind.label}`;
else skittleLabel = "SKITTLE DIRECTION · ---";
```

**ルート div の差分**:

- `maxWidth: 880`（Phone 420 の約 2 倍）
- `padding: 22`（Phone 12）
- `gap: 18`（Phone 12）
- 背景グリッド: `pattern width/height: 40`（Phone: 32）、pattern id: `idp2_grid`

**レイアウト構造の差分**:

Phone は縦積み単一列、Pad は **2 カラム grid**:

```javascript
{
  display: "grid",
  gridTemplateColumns: "1.15fr 1fr",
  gap: 18,
  position: "relative", zIndex: 1,
}
```

- **左カラム**（1.15fr）: BezelPanel COMPASS のみ（`padding: 20`、corner `"R.S-7"` 固定装飾）
  - `<CompassGauge prefix="idp2_c" size={420} bearing={bearing} />`（size 420、Phone 330）
  - SKITTLE DIRECTION ラベル（CompassGauge 下、`marginTop: 12; textAlign: center; fontFamily: 'JetBrains Mono', monospace; fontSize: 11; color: var(--wind-text-muted); letterSpacing: 3`）
- **右カラム**（1fr）: 2 行 grid（`gridTemplateRows: "1.1fr 1fr"; gap: 18`）
  - **上行**: BezelPanel WIND · NOW（`padding: "20px 20px 18px"`）
    - Hero 数値: fontSize 120（Phone 88）、letterSpacing -3（Phone -2）、`textShadow: "0 0 40px rgba(251,191,36,0.25)"`（§9.3.11 残余、Phone なし）
    - 単位: fontSize 22（Phone 16）
    - シェブロン: `viewBox="0 0 320 24"`、height 20、strokeWidth 1.8（Phone 260×18、1.5）
    - レンジラベル: fontSize 13、letterSpacing 3（Phone 10、2）
    - レンジゲージ: 外枠 height 8（Phone 6）、帯 height 6（Phone 4）、マーカー 2.5×16（Phone 2×12）
    - 目盛りラベル: fontSize 10（Phone 8）
  - **下行**: 統計カード 3 列（`gridTemplateColumns: "1fr 1fr 1fr"; gap: 10`、Phone `gap: 8`）
    - 各 BezelPanel: `padding: "18px 10px 12px"`（Phone `"14px 8px 10px"`）、**`corner` プロパティあり**（Phone なし）
    - カード内容:
      - 数値: fontSize 42（Phone 30）
      - 単位・サブ: fontSize 10（Phone 9）、marginTop 4（Phone 3）
      - **ticks 20 本バー**（Phone 未実装）:
        - `display: flex; gap: 2; marginTop: 12; justifyContent: center`
        - 各バー `width: 2`、`height: i < ticks ? 12 : 6`、`background: i < ticks ? tickColor : var(--wind-text-muted)`、`opacity: i < ticks ? 0.6 + i * 0.02 : 0.4`

**TIMELINE**: 2 カラム grid の外側、下段にフルワイド配置

```javascript
<BezelPanel title="TIMELINE · 5 MIN" corner={timelineCorner} style={{
  padding: 20, flex: 1, minHeight: 0,
  display: "flex", flexDirection: "column",
  position: "relative", zIndex: 1,
}}>
  <WindChart width={736} height={280} accent="#34d399" prefix="idp2_ch" {...rest} />
</BezelPanel>
```

- WindChart: width 736（Phone 356）、height 280（Phone 120）

**DeckHeader / DeckFooter のスケール**:

- DeckHeader: `scale={1.35}`（Phone: 1.0）
- DeckFooter: `scale={1.3}`（Phone: 1.0）

##### 9.3.10.9 WindMonitorModal（エクスポート本体）

WindMonitor モーダルのトップレベルコンポーネント。WebSocket 接続ライフサイクル管理、履歴蓄積、統計計算、タブレット判定、isTablet 分岐で InstrumentDeckPad / InstrumentDeckPhone を切替える。

###### Props

```javascript
export function WindMonitorModal({
  isOpen, onClose, piAddress, windDebugEnabled, onWindDebugLog
}) { ... }
```

| Props | 型 | 説明 |
|---|---|---|
| `isOpen` | boolean | モーダル開閉状態。false のとき `null` を返却 |
| `onClose` | function | 閉じるハンドラ、DeckHeader の閉じるボタン経由 |
| `piAddress` | string | Raspberry Pi の WebSocket 接続先アドレス |
| `windDebugEnabled` | boolean | debug ログ出力有効フラグ |
| `onWindDebugLog` | function | debug ログコールバック |

###### State（useState）

- `connected: boolean`: WebSocket 接続状態
- `currentData: object | null`: 最新の `wind_data` メッセージ
- `history: Array`: 風速履歴配列（最大 300 件、1Hz 蓄積）
- `isTablet: boolean`: `window.innerWidth >= 768` 判定
- `sessionElapsed: number`: T+ タイマー経過秒

###### Ref

- `managerRef: useRef(null)`: `WindSensorManager` インスタンス保持

###### useEffect（3 個）

**1. T+ タイマー**（依存: `[isOpen]`）:

- isOpen=true で 1 秒間隔の `setInterval` 開始（`startTime = Date.now()` を基準）
- cleanup で clearInterval
- isOpen=false で `sessionElapsed` を 0 にリセット

**2. WebSocket 接続ライフサイクル**（依存: `[isOpen, piAddress]`）:

- isOpen + piAddress.trim() が truthy のときのみ接続開始
- `new WindSensorManager()` → `managerRef.current = manager`
- 3 つのコールバック設定: `onDataCallback` / `onStatusCallback` / `onDebugLogCallback`（`windDebugEnabled` + `onWindDebugLog` が両方あるとき）
- `onDataCallback`: `wind_data` タイプ受信時に `setCurrentData(data)` + `history` に push（300 件超で最古削除）
- cleanup: callback を null 化、`manager.disconnect()` 呼び出し、state リセット
- `onWindDebugLog` / `windDebugEnabled` は依存配列から除外（親再レンダーで再接続されるのを防ぐ、`eslint-disable-next-line` で抑制）

**3. リサイズリスナー**（依存: `[]`、マウント時 1 回）:

- `onResize = () => setIsTablet(window.innerWidth >= 768)`
- `window.addEventListener("resize", onResize)`
- `window.addEventListener("orientationchange", onResize)`
- cleanup で両方 removeEventListener

###### useMemo（3 個）

**1. `stats`**（依存: `[history]`）:

`maxSpeed` / `maxSpeedTimestamp` / `avgSpeed` / `stdDev` / `sampleCount` を履歴から計算。`history.length === 0` のとき全て null / 0。

**2. `relativeWind`**（依存: `[currentData]`）:

`calcRelativeWind(currentData)` の戻り値（§9.3.5 参照）。

**3. `samples`**（依存: `[history]`）:

`history` を 3 秒間隔で間引き（`i += 3`）、末尾サンプルを必ず含める（`(history.length - 1) % 3 !== 0` のとき追加）。

###### 描画ロジック

1. `isOpen === false` のとき `return null`
2. タイムライン描画用の座標計算:
   - `chartH = isTablet ? 280 : 120`
   - `marginL = isTablet ? 36 : 32`
   - `marginT = 12`、`marginB = 24`（固定）
   - `chartW = isTablet ? 736 : 356`
   - `plotW = chartW - marginL - 12`
   - `plotH = chartH - marginT - marginB`
3. Y 軸スケール計算:
   - `maxObservedSpeed = history.length > 0 ? Math.max(...) : 0`
   - `yMax = Math.max(3.0, maxObservedSpeed * 1.2)`
   - `yOf = (speed) => marginT + plotH * (1 - Math.min(Math.max(speed, 0), yMax) / yMax)`
4. X 軸スケール計算:
   - `WINDOW_MS = 5 * 60 * 1000`
   - `nowMs = Date.now()`
   - `xMin = nowMs - WINDOW_MS`
   - `xOfSample = (sample) => { ... return marginL + ((t - xMin) / WINDOW_MS) * plotW; }`
5. `validSamples`: `samples.filter(s => isFinite(new Date(s.timestamp).getTime()))`
6. `deckProps`: 上記すべてをまとめたオブジェクト
7. ルート div を return:
   - `{ position: "fixed", inset: 0, zIndex: 9999, background: "var(--wind-bg-base)", overflowY: "auto", color: "var(--wind-text-primary)", WebkitOverflowScrolling: "touch" }`
   - 内側: `isTablet ? <InstrumentDeckPad {...deckProps} /> : <InstrumentDeckPhone {...deckProps} />`

###### エクスポート

- 名前付き: `export function WindMonitorModal(...)` （関数宣言）
- デフォルト: `export default WindMonitorModal;`（ファイル末尾）

###### §9.3 全体との分担

§9.3.1〜§9.3.9 は WindMonitor のユーザー視点仕様と正典化、§9.3.10 は Type B 実装の内部実装を正典化、§9.3.11（次節）は未トークン化の残余 hex を棚卸しする構造。本節（§9.3.10.9）は WindMonitor エクスポート本体の実装仕様であり、`src/components/WindMonitorModal.jsx` のファイル末尾の関数宣言 + default export を追認する。

#### 9.3.11 WindMonitor 残余 hex 棚卸し

PR β X-3 Type B 実装で未トークン化のまま残った装飾色 / rgba の一覧。**A 案採択により、全て特殊用途として承認**し、本 PR（PR β X-1）および前段の PR β X-2 / X-3 ではコード変更ゼロとする。将来の「WindMonitor 美学棚卸し」タスクで実装全体を俯瞰してから命名・トークン化を一括判断する。

##### A 案採択の根拠

- PR β X-3 実装では Wind Monitor Industrial Palette（§2.6、12 トークン）が全面適用されており、12 トークンで表現可能な色はすべてトークン化済み
- 残余 hex は **微差のバリエーション**（`#6b7280` vs `--wind-text-muted` #64748b 等）または **独立した装飾固定値**（`#ffffff` / `#050914` / `#020617` 等）に分類される
- 微差バリエーションを新トークン化すると、既存トークンとの意味論衝突（`--wind-text-muted` と新トークンの使い分け基準が曖昧化）が発生するリスクがある
- 装飾固定値は「WindMonitor Industrial 美学の特殊表現」として hex 直書きを残す方が実装と仕様の整合が取りやすい
- 以上により、現時点ではトークン化せず、全体俯瞰後の一括判断とする

##### 残余 hex / rgba 一覧（12 項目）

| # | 箇所 | hex / rgba | 既存トークン候補 | 差分 | 扱い確定 |
|---|---|---|---|---|---|
| 1 | `batteryColor()` 内: null 時 | `#6b7280` | `--wind-text-muted` (#64748b) | 微差（RGB 各 ±3〜9） | 特殊用途として承認 |
| 2 | `batteryColor()` 内: 中間（< 50%） | `#eab308` | `--wind-moderate` (#fbbf24) | 微差（RGB 各 ±5〜22） | 特殊用途として承認（warning 系） |
| 3 | レンジゲージ STRONG 帯（Phone / Pad） | `#f87171` | `--wind-strong` (#f97316) | 微差（RGB 各 ±7〜13） | 特殊用途として承認 |
| 4 | CompassGauge ティック major（30° 毎の太めティック） | `#cbd5e1` | なし | - | 新トークン `--wind-tick-major` 候補、hex 直書き承認 |
| 5 | 最深背景・CompassGauge face radial 終点・ハブ中心・BezelPanel リベット fill・BezelPanel boxShadow inset・DeckHeader boxShadow inset・InstrumentDeckPhone / Pad ルート radial-gradient 終点 ほか多数 | `#020617` | `--neutral-950` (#0b1526) | 大差（RGB 各 ±6〜18） | 特殊用途 `--wind-shadow-deep` 候補、hex 直書き承認 |
| 6 | CompassGauge ring 円 stroke・閉じるボタン border | `#334155` | `--wind-text-dim` (#475569) | 微差 | 特殊用途として承認 |
| 7 | DeckHeader gradient 下端・レンジゲージ背景 | `#0b1220` | なし | - | 特殊用途として承認 |
| 8 | BLADE 先端ドット | `#ffffff` | なし（pure white） | - | 装飾固定として承認 |
| 9 | BezelPanel radial-gradient 終点 | `#050914` | なし | - | 装飾固定として承認 |
| 10 | BezelPanel boxShadow inset（上端ハイライト）・DeckHeader boxShadow inset（上端ハイライト）・BezelPanel boxShadow outer（外側ドロップシャドウ） | `rgba(148,163,184,0.08)` / `rgba(148,163,184,0.1)` / `rgba(0,0,0,0.5)` | なし | - | 装飾固定として承認 |
| 11 | InstrumentDeckPad Hero 数値 textShadow | `rgba(251,191,36,0.25)` | なし（amber 250 系 25% 透過） | - | 装飾固定として承認 |
| 12 | DeckHeader LINKED ドット boxShadow（接続時 green 80% グロウ / 切断時 red 50% グロウ） | `rgba(52,211,153,0.8)` / `rgba(239,68,68,0.5)` | なし | - | 装飾固定として承認 |

##### C-g（PR #87）先例との整合

本節の方針は第2弾C C-g（PR #87、2026-04-21）で確立された「WindMonitor 残余 hex は美学棚卸しタスクで一括判断」ルールに従う。C-g では `#f59e0b`（当時の PEAK 数値、PR β X-3 で Wind Ramp 連動に変更されて実質廃止）、`#eab308`（BAT < 50%）、`#6b7280`（値未取得時）が hex 直書き維持されており、PR β X-3 新規残余もこの先例に沿って同じ扱いとする。

##### 将来タスク予告（WindMonitor 美学棚卸し）

将来の「WindMonitor 美学棚卸し」タスクで以下を一括判断する:

- **新トークン候補 8 本の追加案**:
  - `--wind-shadow-deep`（`#020617` 複数箇所参照、一括置換で大きな効果）
  - `--wind-tick-major`（`#cbd5e1`、CompassGauge ティック major 専用）
  - `--wind-border-subtle`（`#334155`、ring stroke / ボタン border 専用）
  - `--wind-panel-gradient-end`（`#050914`、BezelPanel 終点専用）
  - `--wind-header-gradient-end`（`#0b1220`、DeckHeader 終点専用）
  - `--wind-range-strong`（`#f87171`、レンジゲージ STRONG 帯専用）
  - `--wind-battery-mid`（`#eab308`、batteryColor < 50% 専用）
  - `--wind-battery-null`（`#6b7280`、batteryColor null 時専用）
- **もしくは全面再設計案**: 実装全体を再設計し、Wind Monitor Industrial Palette を 12 本 → 20 本程度に拡張する案
- 判断は WindMonitor 美学棚卸しタスクで太一さんの承認のもとで確定

##### 本節の位置づけ

§9.3.11 は DESIGN.md と実装の乖離を **明示的に記録する棚卸し表**であり、「実装優先」原則（§9.1）のもとで乖離を許容することを正典化する。将来の美学棚卸しタスクで本表の各項目をトークン化 or 承認維持のどちらかに確定させた時点で、本節は更新または廃止される。

---

### 9.4 Stats

#### 9.4.1 質感アイデンティティ

分析性 × デザイン性。モルックスコアラーで最も装飾的自由度が高い画面。Strava/Whoop の美学を参照し、データそのものが計測結果として美しく見える世界観。

**基調**: ハイブリッド。ライト全体 + 主役ダーク化。データ可視化ブロックのみ `--neutral-900` に沈めて没入感を作り、ユーティリティ部（タブ/ボタン/テーブル）はライト維持で視認性を確保。

#### 9.4.2 情報階層（累計タブ）

1. プレイヤー選択（フィルタ）
2. レーダーチャート（全体傾向の俯瞰）
3. プレイヤーテーブル（個別実績の概要）
4. スコア分布ヒートマップ（戦術傾向）
5. 分析結果ブロック + AI分析ボタン
6. 詳細指標テーブル（深堀り）
7. ターン別パフォーマンス棒グラフ（時系列）

#### 9.4.3 配色と背景の段階

| 要素 | 背景 | 効果 |
|---|---|---|
| ページ背景 | `--neutral-50` | ライト基調 |
| ライトカード | `--neutral-0` + `--shadow-md` + `--radius-lg` | プレイヤー選択、テーブル、試合カード |
| ダーク可視化ブロック | `--neutral-900` + 上→下 2%暗化の微グラデ + `--radius-xl` | レーダー/ヒートマップ/棒グラフ |

ダーク部の画面内比率は過半数を超えないよう制御する（ライト維持優先）。

#### 9.4.4 タイポグラフィ特別指定

- レーダー軸ラベル: `--font-instrument` / `--text-base` / 白80%
- テーブル数値セル: `--font-instrument` / `--text-base` / `--weight-semibold`
- 試合カードのスコア値: `--font-instrument` / `--text-xl` / `--weight-bold`
- 見出し・通常テキスト: `--font-sans` 維持

#### 9.4.5 プレイヤー選択カード

- 白背景、左端にプレイヤー色の選択帯 4px
- 選択時背景: `rgba(player-color, 0.04)` 薄色、テキストはプレイヤー色
- hover: `transform: scale(1.015)` + `--shadow-sm` 深化、0.2秒
- 選択時の追加動作: 外周にプレイヤー色の光輪 `box-shadow: 0 0 0 3px rgba(player-color, 0.25)` 0.3秒展開
- チェックマーク出現: 0.2秒フェード + 微スケール 0→1.0

#### 9.4.6 期間切替セグメントボタン

- アクティブ: `--blue-500` 背景 + 白文字
- 非アクティブ: 白背景 + `--text-secondary`
- 切替: 0.2秒カラー変化

#### 9.4.7 レーダーチャート（ダーク化）

- 背景: `--neutral-900` + 微グラデ + `--radius-xl`
- モルックキャラ背景: `filter: grayscale(100%); opacity: 0.15;` で幽玄に溶け込ませる
  - **正典化**: モルックスコアラーのアイデンティティとして永続化、削除禁止
- グリッド: 6層多角形、白15%、1px
- 軸ラベル: 白80%、`--font-instrument`、`--text-base`
- 軸目盛り数値: 白60%、`--font-instrument`、`--text-sm`
- **ポリゴン描画**: 各プレイヤー色ライン 2.5px、塗り 10%不透明（硬質な線画、Whoop的、線が主役）
- 初回描画: 中心から外へ 0.8秒でポリゴン成長
- hover: 該当プレイヤーのライン 4px/塗り 15%に強調、他は 2px に退く
- 凡例: 下部、`--neutral-900` 上に白文字 + プレイヤー色ドット

#### 9.4.8 プレイヤーテーブル・詳細指標テーブル

- 白背景 + `--shadow-md` + `--radius-lg`
- ヘッダー行: `--neutral-100` 背景、`--weight-semibold`
- 奇数行: `--neutral-50` 微ストライプ
- プレイヤー名: プレイヤー色 + `--weight-semibold`
- 数値セル: `--font-instrument` / `--weight-semibold`
- ミス列: `--warning-dark` で軽い警告色
- hover行: `--blue-50` 薄く変化、0.2秒
- 最優秀値（詳細指標表）: `--weight-bold` + `--blue-50` 微背景強調

#### 9.4.9 スコア分布ヒートマップ（ダーク化）

**意味論**: スコア番号は「戦略的重要度」、獲得回数は「頻度」。Wind Ramp色との共通化は禁止（意味論衝突）。

- ブロック背景: `--neutral-900`、`--radius-lg`
- プレイヤーヘッダー: プレイヤー色 + プレイヤー色帯 4px 下線
- マス: 正方形 48〜56px、`--neutral-800`（#14365a）単色、やや青味強めで淡いスコアも表示しやすい
- **濃度5段階（プレイヤー内相対）**:
  - 最頻スコア = 100%
  - 75%位置 = 75%
  - 50%位置 = 50%
  - 25%位置 = 25%
  - 10%未満 = 10%
  - 0回 = 3%（ほぼ透明）
- マス内テキスト: スコア番号（大）+ 回数（小、`--font-instrument` / `--text-xs`）
- **文字色動的切替**: 濃度50%超=白、以下=白60%
- hover: `transform: scale(1.05)` + `--shadow-glow-blue` 微光輪
- 初回描画: 左→右、0.6秒で濃度段階的に上がる
- 外枠: プレイヤー色 2px（ハイブリッド識別）

#### 9.4.10 ターン別パフォーマンス棒グラフ（ダーク化）

- 背景: `--neutral-900` + 微グラデ
- 棒: 1本 12px 幅、間隔 2px、角丸 `--radius-xs`
- 1〜10点 + ミス: プレイヤー色ソリッド
- **11〜12点のみゴールド強調**: `--stats-highlight-gold`
  - 意味論: 「上がり得点の輝き」を演出
- ミス（0点）: `--neutral-300` 高さ4px 固定の極低バー
- hover: 微スケール + 数値ツールチップ
- 初回描画: in-view で下→上に立ち上がり、左→右に stagger 20ms

#### 9.4.11 試合カード（直近の試合タブ）

- 白背景 + `--shadow-sm` + `--radius-lg`
- 天候バッジ: 絵文字 + 気温、`--radius-full`、微シャドウ
- 風速バッジ: 緑背景（`--success-bg`）、値 + `m/s`、`--radius-sm`
- 上がり者・勝利チームメンバー名: プレイヤー色
- 試合スコア「50」: `--font-instrument`
- hover: `transform: scale(1.01)` + `--shadow-md` 深化
- チェック時: 左端にプレイヤー色帯

#### 9.4.12 カレンダー（カレンダータブ）

- 白背景
- 曜日ヘッダー: 日=赤、土=青、他 `--text-secondary`
- 試合あり日: `--blue-500` 小ドット
- 選択日: `--blue-500` 丸背景 + 白文字
- 本日: 太字 + `--blue-500` 文字色（塗り潰さない）
- hover: セル背景 `--neutral-100`

#### 9.4.13 マイクロアニメーション（フル展開セット）

| 種類 | 対象 | タイミング |
|---|---|---|
| 初回描画 | レーダー/ヒートマップ/棒グラフ | in-view、0.5〜1.0秒、stagger |
| 数値カウントアップ | テーブル数値/KPI値 | 表示時、0→実値へ 0.5秒 |
| hover反応 | カード/セル/行 | `scale(1.01〜1.05)` + 影深化、0.2秒 |
| in-view フェードイン | 各ブロック | 画面20%入った瞬間、0.4秒、下から20px |
| パルス/脈動 | 最頻スコア or 最優秀指標（1画面1箇所） | 3秒周期、`scale(1.0→1.015→1.0)` + box-shadow微拡張 |
| タブ切替 | 累計/直近/カレンダー | 左右スライド、0.25秒 `cubic-bezier(0.4, 0, 0.2, 1)` |

#### 9.4.14 タブ切替遷移

- 前進（カレンダー→直近→累計）: 新コンテンツが右からイン、旧が左へアウト
- 後退: 逆方向
- スクロール位置はタブごとに維持

#### 9.4.15 ✗ 使用禁止ケース

- ライト部への `--neutral-900` 背景適用（ハイブリッド崩壊）
- ダークブロック内の白以外の色テキスト
- パルス/脈動の2箇所超同時適用
- 11・12点以外の棒にゴールド適用（意味論破壊）
- プレイヤー色以外の識別色をヒートマップ・レーダー追加（情報密度過多）
- Wind Ramp色のスコア分布への流用（意味論衝突）
- モルックキャラ背景の削除

---

### 9.5 SetupScreen

#### 9.5.1 質感アイデンティティ

操作性 × デザイン性。モルックスコアラーの**世界観の入り口**として機能するダーク基調。GameScreen・WindMonitor と連続性を持たせ、アプリを起動した瞬間に「これから試合が始まる」という期待感を演出する。

#### 9.5.2 配色と背景の段階

- ページ背景: `--neutral-950` + 上→下の微グラデ（`--neutral-950` → `--neutral-900`）
- Tier 1 カード: `--neutral-900` + `--shadow-lg` + `--radius-xl` + 微グラデ
- Tier 2 カード: `--neutral-900` + `--shadow-md` + `--radius-lg`
- Tier 3 要素: 背景なし（埋め込み）、ラベル + インプットのみ
- テキスト: 白（主要）/ 白70%（ラベル）/ 白50%（補助）

#### 9.5.3 タイポグラフィ特別指定

- アプリタイトル「モルック スコアラー」: `--font-sans` / `--text-5xl` / `--weight-bold` / 白
- サブタイトル「MÖLKKY SCORER」: `--font-instrument` / `--text-sm` / letter-spacing 0.3em / 白50%
  - 計器盤のブランド刻印風
- Tier 1 セクションラベル: `--font-sans` / `--text-base` / `--weight-semibold` / 白80%
- Tier 2 セクションラベル: `--font-sans` / `--text-sm` / `--weight-medium` / 白70%
- Tier 3 セクションラベル: `--font-sans` / `--text-sm` / 白60%

#### 9.5.4 情報階層と Tier 構造

**Tier 1 — 主役カード（浮遊・強存在感）**
1. チーム数・コート数（1カード内に2セクション併置）
2. 参加メンバー（最大8人、お気に入り機能含む）

**Tier 2 — 独立カード（同等・中存在感）**
3. 場所選択
4. 風速計連携（Industrial 美学、特別扱い）
5. スタッツ反映 + スタッツボタン

**Tier 3 — サブ設定（埋め込み・薄存在感）**
6. 入力モード（手動/ランダム）
7. ゲーム数 / 先取機能 / 失格時（3ドロップダウン横並び）

#### 9.5.5 ヘッダー部

- 背景: `--neutral-950` + 上→下グラデ
- タイトル中央寄せ、上下余白 `--space-8`
- サブタイトル `MÖLKKY SCORER` はタイトル下、letter-spacing 広く取って「計器盤のブランド刻印」風

#### 9.5.6 Tier 1 カード

- 背景: `--neutral-900` + 上端2%明化の微グラデ
- パディング: `--space-6`
- `--shadow-lg`（周囲ダークのため実質的な浮遊感は控えめだが、`--radius-xl` と組み合わせて物体感を出す）
- セクションラベル: カード上端、下方に `--space-3` 余白後コンテンツ

#### 9.5.7 チーム数・コート数セグメントボタン

- Tier 1 カード内
- ボタン単体: 縦 44px（`--space-11`）、背景 `--neutral-800`、白文字
- アクティブ: `--blue-500` 背景 + 白文字 + 内側に微光（`inset 0 0 0 1px rgba(255,255,255,0.1)`）
- 非アクティブ hover: `--neutral-700` 変化、0.2秒

#### 9.5.8 参加メンバー入力（Tier 1）

- 入力欄: `--neutral-800` 背景 + 白文字 + `--neutral-700` ボーダー
- お気に入り星アイコン: 右端、未登録=白30%、登録済=`--warning` 黄
- 「+」追加ボタン: 点線ボーダー `--neutral-600`、白60%文字、hover時 `--blue-500` ボーダー変化
- 「お気に入りから選択追加」「最後を削除」: サブボタン、薄い縁取り

#### 9.5.9 場所選択カード（Tier 2）

- 背景 `--neutral-900` + `--shadow-md` + `--radius-lg`
- ラジオボタン行: 白文字 + 路面バッジ（芝/土/砂 色分け）+ 屋根バッジ
  - 芝: `rgba(52,211,153,0.2)` 背景、`--wind-calm` 文字
  - 土: `rgba(251,191,36,0.2)` 背景、`--warning` 文字
  - 砂: `rgba(249,115,22,0.2)` 背景、`--wind-strong` 文字
  - 屋根あり: `--blue-500` 系、屋根なし: `--danger` 系
- 選択時: 行全体に `--blue-500` 薄背景 + 左端に帯 4px

#### 9.5.10 風速計連携カード（Tier 2、Industrial 特別扱い）

**方針**: 色とフォントだけで Industrial 表現、装飾最小限（Whoop的）。

- 背景: `--neutral-900` + 上→下の青みグラデ（`--neutral-900` → rgba(26,109,212,0.08) 混色）
- 枠: なし（装飾最小限）、`--radius-lg`
- `--shadow-md` + `--shadow-glow-blue` 微合成で「青い呼吸」
- トグル（風速計連携 ON/OFF）:
  - ON時: `--blue-500` 背景 + 白丸 + 左側に淡い青グロウ
  - OFF時: `--neutral-700` 背景 + `--neutral-500` 丸
- アドレス入力欄:
  - 背景 `--neutral-800` + 白文字
  - `--font-instrument` / `--text-base`（技術的テキスト感）
  - プレースホルダー 白40%
- キャリブレーションボタン: `--neutral-800` 背景 + 白文字 + `--neutral-700` ボーダー
- 接続テストボタン: `--blue-500` 背景 + 白文字
- **接続状態表現**:
  - 接続成功時にアドレス入力欄の右端に `--wind-calm` 小ドット（2秒脈動）
  - 接続失敗時は `--danger` 小ドット（点滅なし、静的）
- OFF時: カード全体を opacity 0.5 に退かせる（クリックはできる）

#### 9.5.11 スタッツ関連カード（Tier 2）

- 2カラム: スタッツ反映トグル（左）+ スタッツボタン（右）
- スタッツ反映トグル:
  - 背景 `--neutral-900` + `--shadow-md`
  - ON時: `--success` 背景グラデ（緑 20%→8%）+ 白文字 + 右端 `--success` トグル
- スタッツボタン:
  - 背景 `--neutral-900` + `--shadow-md` + 白文字 + `--neutral-700` ボーダー
  - hover: `--blue-500` 薄背景

#### 9.5.12 Tier 3 ドロップダウン群（ゲーム数 / 先取機能 / 失格時）

- 3カラム横並び、ラベルは白60%
- インプット: `--neutral-800` 背景 + 白文字 + `--neutral-700` ボーダー + `--radius-sm`
- 高さ 44px
- 矢印アイコン: 白60%

#### 9.5.13 入力モード（Tier 3）

- 2カラム（手動 / ランダム）
- 非アクティブ: `--neutral-800` 背景 + 白70%文字 + `--neutral-700` ボーダー
- アクティブ: `--blue-500` 背景 + 白文字
- アイコン（✏️/🎲）: ボタン内左、文字と並ぶ

#### 9.5.14 マイクロアニメーション

| 種類 | 対象 | タイミング |
|---|---|---|
| 初回フェードイン | 各カード | 上から20pxイン + フェード、stagger 80ms、計0.8秒 |
| ボタン切替 | セグメントボタン全般 | 0.2秒カラー + 内側光変化 |
| トグル切替 | 各トグル | 0.25秒スライド + 色遷移 |
| 接続成功時 | 風速計カードの成功ドット | 2秒周期脈動（`scale(1.0→1.2→1.0)` + opacity 0.8→1.0→0.8） |
| 接続テスト中 | 接続テストボタン | 0.8秒周期の内部シマー（微光の左→右スイープ） |

#### 9.5.15 ✗ 使用禁止ケース

- Tier境界の崩壊（Tier 1のシャドウ強度がTier 2を上回る、Tier 3に影付与など）
- 風速計カードへの過剰装飾（アイコン多用、イラスト、背景パターン）
- 白以外の文字色を Tier 1/3 で使用（ブランド統一の観点、バッジ・エラー時のみ例外）
- ページ背景に明るい色の適用（ライト化）

---

### 9.6 Settings

#### 9.6.1 質感アイデンティティ

操作性 × デザイン性。SetupScreen と同じダーク基調・同じコンポーネント質感で、アプリ全体の「試合前の世界観」の一部として連続性を保つ。項目が少ないため密度よりも各設定の存在感を丁寧に表現する。

#### 9.6.2 配色と背景の段階

SetupScreen と完全共通:
- ページ背景: `--neutral-950` + 上→下の微グラデ
- カード: `--neutral-900` + `--shadow-md` + `--radius-lg`
- テキスト階層も共通（白・白70%・白50%）

#### 9.6.3 情報階層

1. タブ切替: メンバー / 同期済（ページ最上部）
2. 権限管理: 管理者モード
3. クラウド同期: 独立ステータスエリア（特別扱い）
4. 演出: シャッフル演出
5. AI分析: プレイスタイルAI分析

#### 9.6.4 タブ切替（ページ最上部）

- 背景: `--neutral-900` + `--radius-sm`
- 2カラム（メンバー / 同期済）
- アクティブ: `--blue-500` 薄背景 + 白文字 + 左端 3px プレイヤー色帯
- 非アクティブ: 白70%文字
- 「同期済」タブには右端に微小な `--wind-calm` 緑ドット（常時表示、静的）

#### 9.6.5 権限管理カード

- SetupScreen のトグル仕様を完全継承
- ラベル「権限管理」（白70%、`--text-sm`）
- 管理者モードトグル: 他トグルと同じ色（ON=`--blue-500` 背景）
- 補足テキスト「スタッツ削除・同期コード編集・AI無制限」: 白50%、`--text-xs`、トグル下に `--space-2` 空けて配置

#### 9.6.6 クラウド同期ステータスエリア（特別扱い）

**方針**: 独立ステータスエリアとして浮かび上がらせ、同期成功時は「呼吸する緑ドット」とデバイス同期式で状態を視覚化。

- 背景: `--neutral-900` + 上→下の緑微グラデ（`--neutral-900` → `rgba(52,211,153,0.06)`）
- `--shadow-md` + `--shadow-glow-green` 微合成で呼吸感
- パディング: `--space-6`
- 構成:
  - **最上段**: ステータス行（左: 緑呼吸ドット 12px + 「同期済」白文字 / 右: デバイス同期式）
  - **中段**: 同期コード入力欄
  - **下段**: 補足テキスト
- **緑呼吸ドット**:
  - サイズ 12px、`--wind-calm` 色
  - 外側にハロー（16px、`--wind-calm` 30%透過）
  - 2秒周期のパルス（`scale(1.0→1.15→1.0)` + ハロー opacity 0.3→0.6→0.3）
- 「同期済」ラベル: 白、`--text-base`、`--weight-semibold`
- **デバイス同期式**: `--font-instrument` / `--text-sm` / 白70%
  - 表示例: `iPad · iPhone · Mac ⇌ Cloud`
  - セパレータ `⇌` は白50%で淡く
- 同期コード入力欄:
  - 背景 `--neutral-800` + 白文字
  - `--font-instrument` / `--text-base`（技術的テキスト感）
  - 値は `Mo••••••••` のマスク表示
  - 右端に「設定済み」小バッジ（`--success-bg` ダーク反転背景 + `--wind-calm` 文字 + `--radius-sm`）
- 補足テキスト「同じコードを全端末で設定してください。」: 白50%、`--text-xs`
- **未同期時**:
  - 緑グラデが消え、背景は `--neutral-900` 単色
  - 緑ドットが赤ドット（`--danger`、脈動なし）に切替
  - 「同期済」ラベルが「未同期」に切替、白60%
  - シャドウグローも消える

#### 9.6.7 演出カード（シャッフル演出）

- SetupScreen のトグルカードと完全同質
- ラベル「演出」（セクション見出し、白70%）
- トグル行: 「シャッフル演出 (ON)」白文字 + 右端トグル
- 補足テキスト「カードシャッフルアニメーションを表示」: 白50%、`--text-xs`

#### 9.6.8 AI分析カード（プレイスタイルAI分析）

- 演出カードと同質
- トグル行: 「プレイスタイルAI分析 (ON)」白文字 + 右端トグル
- 補足なし

#### 9.6.9 マイクロアニメーション

SetupScreen と共通:

| 種類 | 対象 | タイミング |
|---|---|---|
| 初回フェードイン | 各カード | 上から20pxイン + フェード、stagger 80ms |
| トグル切替 | 各トグル | 0.25秒スライド + 色遷移 |
| 緑呼吸ドット | クラウド同期ステータス | 2秒周期、scale + ハローopacity連動 |
| タブ切替 | メンバー/同期済 | 左右スライド 0.25秒 |

#### 9.6.10 ✗ 使用禁止ケース

- クラウド同期エリアの演出を他カードに転用（特別扱いの希釈化）
- SetupScreenと異なるトーン（基調違反）
- 管理者モードトグルへの別色適用
- 呼吸ドットの常時以外の使用（意味論の濫用）

---

## 10. Don'ts

### 10.1 共通原則（AI生成UI回避チェックリスト）

各章の「使用禁止ケース」とは別レイヤーの、UI設計全般に適用する**上位原則**。デザインがAI生成っぽい凡庸さに陥ることを防ぐため、全画面・全コンポーネントの設計時に参照する。

---

#### 原則1 — 主役情報を1つに絞り、優先順位にメリハリをつける

画面内の全要素が同じ視覚的重さを持つと、ユーザーの視線はどこにも着地せず「AIが生成したっぽい均質さ」になる。必ず**その画面で最も見てほしい情報1つ**を決め、サイズ・位置・色で他より明確に強調する。

例外として、本ファイルで明示的に「ダブル主役」を指定した画面（WindMonitor の風速数値×コンパス等）では最大2つまで許容される。ただし自主判断での主役増加は禁止。

**✗ やりがちなアンチパターン**

```
[KPI 48px bold] [KPI 48px bold] [KPI 48px bold] [KPI 48px bold]
```

全KPIが同じ大きさで横並び。どれが重要か判別不能。

**✓ 正しい適用**

```
[最重要KPI 72px extrabold + glow]
[補助KPI 32px semibold] [補助KPI 32px semibold] [補助KPI 32px semibold]
```

最重要指標が主役、補助KPIは主役を引き立てる脇役として配置。

---

#### 原則2 — テンプレ寄せ集めでなく、文脈・体験の本質から設計する

「ダッシュボードだからカード並べる」「分析画面だからグラフ置く」という型から始めると、AI生成っぽい凡庸なUIになる。**このアプリのこの画面で、ユーザーが何を感じてほしいか**から設計する。

**✗ やりがちなアンチパターン**

- Stats画面に「Recharts ドロップで標準ダッシュボード」を当てはめる
- WindMonitor に「天気アプリの定番レイアウト」を流用する
- SetupScreen に「汎用フォームウィザード」を適用する

**✓ 正しい適用**

- Stats画面は「100試合分析プロジェクトの成果が読み取れる密度感」を軸に構成
- WindMonitor は「Apple Watch Ultra Industrial美学 × 戦略判断の計器盤」として再解釈
- SetupScreen は「試合前の世界観への入り口、計器盤のブランド刻印」として設計

---

#### 原則3 — 色に役割とルールを与え、1つの色に複数の意味を持たせない

**色の役割分離**:
- **ブランド色**: アプリの識別（`--blue-500` 等）
- **操作色**: インタラクティブ要素（ボタン、リンク）
- **状態色**: success/warning/danger
- **注意色**: 警告・エラー専用
- **識別色**: プレイヤー色（識別のみ、UI流用禁止）
- **専用色**: Wind Sensor Colors（風速専用、他用途流用禁止）

**✗ やりがちなアンチパターン**

- 赤をエラー表示・重要バッジ・ミス列・アクティブタブに全部使う
- プレイヤー色をグラフ・ボタン・背景に混在させる
- Wind Ramp色をスコア分布ヒートマップに流用する

**✓ 正しい適用**

- 赤は `danger` 状態のみ。重要強調はサイズ・位置で
- プレイヤー色は識別専用。ボタンやUI要素には使わない
- Wind Rampは風速専用。他の可視化は独自の色体系

---

#### 原則4 — 実データ・長文・0件・異常値・重複で検証する

モックデータは常にキレイで、短く、整合的。しかし実データは長い名前・0件・巨大値・同姓同名などで簡単に崩れる。必ず**実運用で起こりうる最悪ケース**で検証する。

**✗ やりがちなアンチパターン**

- プレイヤー名3文字想定で固定幅 → 「🔥マツモリ」のような絵文字込み長名で崩れる
- 試合数100件想定 → 1件しかない新規ユーザー画面で空白だらけ
- 風速 0.0〜10.0 想定 → 負の値や `--` 表示時にレイアウト破綻
- 全プレイヤー同じ濃度の射撃傾向想定 → 最頻スコア 2点のプレイヤーと 11点のプレイヤーで視覚的バランスが崩れる

**✓ 正しい適用**

- 長名・絵文字・0件・異常値すべてでテスト
- テストデータを `実データ + 最悪ケース` の組み合わせで用意
- 実データを使ったモックアップ生成・実機動作確認を必ず経由する

---

#### 原則5 — 最後に削る

実装が進むにつれ、情報・色・装飾は必ず増える。機能追加のたびに「それも表示したい」が積み重なり、最終的に画面が雑音で埋まる。**完成直前に一度全てを見直し、削れるものを削る**工程が必須。

**太一さん補足**: 装飾増えすぎには特に注意。

**✗ やりがちなアンチパターン**

- アイコン・バッジ・境界線・シャドウ・装飾フレームが全要素に付いている
- 補助的な統計値がKPI並みのスペースを占めている
- 装飾的な区切り線・アクセント色が至る所にある
- hover効果・トランジションが要素ごとに異なる時間/カーブで実装されている

**✓ 正しい適用**

- 最後に「この要素がなくても画面は成立するか？」を全要素に問う
- 成立するなら削る。迷ったら削る
- トランジションは `--transition-fast/normal/slow` の3種に統一

---

### 10.2 モルックスコアラー固有の禁止事項

共通原則の上に、モルックスコアラーの設計思想・アイデンティティに由来する具体的な禁止事項。各章の個別禁止ケースを横断的にまとめた上位規範。

---

#### ✗ プレイヤー色を識別以外の用途に使う

プレイヤー色は「誰の情報か」を示すための識別専用。ボタン・UI要素・状態色に流用しない。

**該当章**: §2.7 / §9.4.5 / §9.4.9

---

#### ✗ Wind Ramp色をスコアヒートマップに流用

風速は「悪化の度合い」、スコアは「戦略的重要度」。意味論が衝突するため色共通化は禁止。構造（階層の概念）だけを借りるのはOK。

WindMonitor の方位識別（DIRECTION パレット、`--wind-dir-*`）は Wind Sensor Colors と色相で完全分離済み（第2弾C C-a、2026-04-21）。詳細は §9.3.5 参照。

**該当章**: §2.5 / §9.4.9 / §9.3.5

---

#### ✗ ダーク化対象をハイブリッド方針から逸脱させる

Stats画面でライト全体 + データ可視化のみダーク化のハイブリッドが正典。テーブル全体・カード全体をダーク化すると画面バランスが崩壊する。

**該当章**: §9.4.3

---

#### ✗ パルス/脈動を1画面2箇所以上に同時適用

呼吸は「最も注目すべき1点」に限定。複数同時は目障りで意味を失う。

**該当章**: §6.6 / §9.3 / §9.4.13 / §9.5.14 / §9.6.9

---

#### ✗ GameScreenヘッダーの Wind Vector Widget を他画面へ転用

Wind Vector Widget は GameScreen専用。WindMonitor は独自コンパス設計で、デザインが混在すると役割が曖昧になる。

**該当章**: §9.2.5

---

#### ✗ ヘキサゴン配列スキットルボタンの改変

モルックスコアラーのアイデンティティの一部。番号配置・形状・6角形レイアウトは永続的に守る。

**該当章**: §7.8 / §9.2.8

---

#### ✗ 11・12点以外の棒にゴールド強調を適用

「上がり得点の輝き」という意味論が破壊される。Stats棒グラフのゴールドは11・12点専用。

**該当章**: §9.4.10

---

#### ✗ 直射日光視認性を絶対条件として扱う

v3以降、装備で大部分解決済み。UI側で「直射日光下で読める」を絶対優先にすると、デザインの自由度が過剰に制約される。一定の配慮は維持しつつ、最優先の設計条件ではない。

**該当章**: §9.1（画面別方針サマリ） / DESIGN_PHILOSOPHY.md

---

#### ✗ レーダーチャートのモルックキャラ背景を削除

モルックスコアラーのアイデンティティ。削除せず、ダーク化時はグレースケール+透過0.15で溶け込ませる。

**該当章**: §9.4.7

---

#### ✗ `--font-instrument` の無差別使用

主要数値（KPI・レーダー軸・試合スコア・風速数値・同期コード・Piアドレス）専用。本文・セクション見出し・ラベルには使わない。日本語テキストにも適用禁止（等幅英文用のため可読性が落ちる）。

**該当章**: §3.4 / §3.5

---

#### ✗ Tier 境界の崩壊

SetupScreen / Settings の Tier 構造（Tier 1/2/3）は情報階層と視覚階層を一致させるための設計。Tier 3 に Tier 1 相当のシャドウを付与する、Tier 1 のシャドウを弱めるなど、階層を破綻させる実装は禁止。

**該当章**: §5.5 / §9.5.15

---

#### ✗ クラウド同期エリアの特別演出を他カードに転用

緑グラデ + 呼吸ドット + デバイス同期式の組み合わせは「同期成功」という意味を持つ独立ステータスエリアの表現。他の設定カードに転用すると特別扱いが希釈化される。

**該当章**: §9.6.6 / §9.6.10
