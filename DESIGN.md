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

**既存エイリアス変更（Step 4 第2弾以降で実施予定）**:
- `--accent-red` の定義値を `#d93a5e` → `#e74c3c` に変更（`--danger` と統一）

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

### 2.6 Wind Monitor 追加トークン

WindMonitor（Phase 3）のダーク Industrial 美学専用。

| トークン | 値 | 用途 |
|---|---|---|
| `--wind-bg-base` | `var(--neutral-950)` 相当 | WindMonitor 画面全体背景 |
| `--wind-bg-card` | `var(--neutral-900)` 相当 | 統計カード・コンパス背景 |
| `--wind-grid-major` | `rgba(255,255,255,0.18)` | コンパス・グラフの主グリッド |
| `--wind-grid-minor` | `rgba(255,255,255,0.08)` | 副グリッド・細線 |
| `--wind-text-primary` | `var(--neutral-0)` | 主要数値・Hero表示 |
| `--wind-text-label` | `rgba(255,255,255,0.6)` | 軸ラベル・単位・補助テキスト |

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

グラフ・データ可視化の補助色。現状は `src/constants.js` の `PC` 配列で定義されている値を、本ファイルで CSS 変数として正典化する。

**重要**: 本セクションは DESIGN.md 側での正典定義のみ。実コード側の CSS 変数定義は Step 4 第2弾以降で実施される（Step 4 第1弾では視覚変化ゼロ。詳細は §2.10 参照）。

**設計上の警告**: 現状の `PC[0]`〜`PC[3]` は Team Colors の accent 色と完全同値で、§10.2「プレイヤー色を識別以外の用途に使う」の禁止事項に該当する違反状態。Step 4 第2弾以降で独自の Chart 色体系に置換予定。

| 変数名 | 値 | PC 配列対応 | Team Colors との重複 |
|---|---|---|---|
| `--chart-1` | `#2b7de9` | `PC[0]` | `--team-1-accent` と同値（§10.2 違反状態） |
| `--chart-2` | `#d93a5e` | `PC[1]` | `--team-2-accent` と同値（§10.2 違反状態） |
| `--chart-3` | `#22b566` | `PC[2]` | `--team-3-accent` と同値（§10.2 違反状態） |
| `--chart-4` | `#d9a83a` | `PC[3]` | `--team-4-accent` と同値（§10.2 違反状態） |
| `--chart-5` | `#9b59b6` | `PC[4]` | 独自色 |
| `--chart-6` | `#e67e22` | `PC[5]` | 独自色 |
| `--chart-7` | `#1abc9c` | `PC[6]` | 独自色 |
| `--chart-8` | `#e74c3c` | `PC[7]` | `--danger` と同値 |

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
| `--text-inverse` | `#fff` | 73 | `--neutral-0` | 現状維持 | 値一致 |
| `--border-input` | `#ddd` | 68 | `--neutral-200` | 現状維持 | 値一致 |
| `--accent-blue` | `#2b7de9` | 65 | `--blue-500` | 現状維持 | 値一致 |
| `--bg-surface` | `#fff` | 56 | `--neutral-0` | 現状維持 | 値一致 |
| `--text-primary` | `#14365a` | 55 | `--neutral-800` | 現状維持 | 値一致（意味論は別途検討） |
| `--text-secondary` | `#888` | 40 | `--neutral-500` | 現状維持 | 値一致 |
| `--text-danger` | `#c0392b` | 30 | `--text-danger` | 現状維持 | 値一致（§2.4 で正典化） |
| `--bg-secondary` | `#14365a` | 29 | `--neutral-800` | 現状維持 | 値一致 |
| `--text-muted` | `#aaa` | 11 | `--neutral-400` | 現状維持 | 値一致 |
| `--text-success` | `#22b566` | 9 | `--success` | 現状維持 | 値一致 |
| `--border-lighter` | `#eee` | 9 | `--neutral-100` | 現状維持 | 値一致 |
| `--accent-green` | `#22b566` | 6 | `--success` | 現状維持 | 値一致 |
| `--bg-tertiary` | `#0f1f30` | 5 | なし（中間色） | 現状維持 | Neutral Scale の 900 (`#0f1a2e`) と 950 (`#0b1526`) の中間。Step 4 第2弾で統合判断 |
| `--bg-surface-dim` | `#f8f9fa` | 5 | `--neutral-50` | 現状維持 | 値一致 |
| `--accent-yellow` | `#e6a817` | 5 | `--warning` | 現状維持 | 値一致 |
| `--accent-orange` | `#bf6900` | 4 | `--warning-dark` | 現状維持 | 値一致 |
| `--bg-surface-alt` | `#f0f3f8` | 3 | なし（独自値） | 現状維持 | Step 4 第2弾で統合判断 |
| `--shadow-lg` | `0 10px 36px rgba(0,0,0,0.25)` | 2 | §5 要確認 | 現状維持 | DESIGN.md §5 との整合性を第2弾で確認 |
| `--bg-primary` | `#0b1526` | 1 | `--neutral-950` | 現状維持 | 値一致 |
| `--bg-overlay` | `rgba(0,0,0,0.55)` | 1 | なし（独自値） | 現状維持 | オーバーレイ専用。§6 との整合性を第2弾で確認 |
| `--text-warning` | `#e67700` | 2 | `--warning` に近似（微差） | 独立維持で確定（第2弾B-β） | `--warning` (`#e6a817`) と微差だがテキスト可読性を優先した専用色。§2.4 に正典化済み |
| `--border-light` | `#e0e0e0` | 1 | `--neutral-200` に近似（微差） | 現状維持 | `--neutral-200` (`#ddd`) と微妙に異なる。Step 4 第2弾で統合判断 |

#### 2.10.2 現在未使用 / 統合済みの変数

DESIGN_AUDIT.md で「定義されているが使用箇所数 0」と分類されたもの、および Step 4 第2弾以降で統合・削除された変数。Step 4 第2弾以降で削除・統合・定義値変更の対象。

| 変数名 | 現状値 | DESIGN.md マップ先 | Step 4 第1弾の扱い | 第2弾以降の計画 | 統合済み |
|---|---|---|---|---|---|
| `--accent-red` | `#d93a5e` | → `--danger` (`#e74c3c`) | 現状維持 | 定義値変更 `#d93a5e` → `#e74c3c`（視覚変化あり、第2弾C） | - |
| `--border-focus` | `#2b7de9` | `--blue-500` | 現状維持 | `--blue-500` への統合（第2弾B 以降） | - |
| `--radius-sm` | `6px` | → `8px`（§5 参照） | 現状維持 | 定義値変更 `6px` → `8px`（視覚変化あり、第2弾C） | - |
| `--radius-md` | `10px` | §5 要確認 | 現状維持 | 使用0件確認済、第2弾C で削除予定 | - |
| `--radius-lg` | `14px` | → `12px`（§5 参照） | 現状維持 | 定義値変更 `14px` → `12px`（視覚変化あり、第2弾C） | - |
| `--radius-xl` | `18px` | → `16px`（§5 参照） | 現状維持 | 定義値変更 `18px` → `16px`（視覚変化あり、第2弾C） | - |
| `--shadow-md` | `0 6px 20px rgba(0,0,0,0.18)` | §5 で正典値 `0 2px 8px rgba(0,0,0,0.18)` | 現状維持 | 定義値変更（視覚変化あり：offset 3倍・blur 2.5倍、第2弾C） | - |
| `--transition-fast` | `0.15s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--transition-normal` | `0.2s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--transition-slow` | `0.3s ease` | §6.2 で値一致確認済 | 現状維持 | 計画なし（維持） | - |
| `--border-lighter` | `#eee` | → `--neutral-100` | 現状維持 | `--neutral-100` への統合（第2弾B） | → `--neutral-100` (B-2a) |
| `--border-light` | `#e0e0e0` | → `--neutral-200` | 現状維持 | `--neutral-200` への統合（第2弾B） | → `--neutral-200` (B-2a) |
| `--border-input` | `#ddd` | → `--neutral-200` | 現状維持 | `--neutral-200` への統合（第2弾B） | → `--neutral-200` (B-2b) |

#### 2.10.3 Step 4 第1弾の作業範囲外

以下の変更はすべて **視覚変化を伴う** ため、Step 4 第2弾以降で別途モックアップ検証を経て適用する（本セクションは記録のみ、実コードの定義値変更はしない）:

- `--accent-red: #d93a5e → #e74c3c`（§2.4 参照）
- `--radius-sm: 6px → 8px`（§6 参照）
- `--radius-lg: 14px → 12px`（§6 参照）
- `--radius-xl: 18px → 16px`（§6 参照）
- 既存エイリアスの未使用変数削除・統合
- 微差エイリアス（`--text-warning`, `--border-light` など）の統合

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
| `--font-instrument` | `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` | 主要数値・計器的テキスト（Webフォント要追加） |

#### `--font-instrument` の Webフォント導入

`JetBrains Mono` はシステムフォントにないため、Webフォント読み込みが必要。

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap">
```

または self-host の場合は `/public/fonts/` 配下に woff2 を配置し、`@font-face` で読み込む。

### 3.5 `--font-instrument` の使用範囲

モルックスコアラーでは、**特定の主要数値テキスト**に限定して使用する。無差別使用は禁止。

#### ✓ 使用対象

- **Stats**: KPIブロックの大型数値、レーダーチャート軸ラベル、試合カードのスコア「50」、プレイヤーテーブル/詳細指標テーブルの数値セル
- **GameScreen**: Wind Vector Widget の風速数値と単位
- **WindMonitor**: Hero風速数値、統計カード数値、軸ラベル、単位
- **SetupScreen**: サブタイトル「MÖLKKY SCORER」、Raspberry Pi アドレス入力値
- **Settings**: 同期コード入力値、デバイス同期式

#### ✗ 使用禁止

- 本文・通常テキスト
- セクション見出し・サブ見出し
- ボタンラベル・ナビゲーションラベル
- 日本語文字列（等幅英文用のため、日本語との混在で可読性が落ちる）

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
| `--radius-md` | `10px` | ボタン、セグメントボタン、中カード |
| `--radius-lg` | `12px` | 標準カード、Modal、テーブル |
| `--radius-xl` | `16px` | 主役カード、大きめ Modal |
| `--radius-2xl` | `20px` | Hero要素、特別なブロック |
| `--radius-full` | `9999px` | pill、円形ボタン、ドット、トグル |

**既存エイリアス変更（Step 4 第2弾以降で実施予定）**:
- `--radius-sm` の定義値を `6px` → `8px` に変更
- `--radius-lg` の定義値を `14px` → `12px` に変更
- `--radius-xl` の定義値を `18px` → `16px` に変更

**注意（Step 4 第1弾の範囲）**: Step 4 第1弾では実コードの `--radius-*` 定義値変更は行わない。視覚変化を伴う変更のため、別途モックアップ検証を経て第2弾以降で適用する。現状値と理想値の差分は §2.10.2 および §2.10.3 を参照。

### 5.3 Radius 選定ガイド

| 要素の性格 | 推奨Radius |
|---|---|
| 計器的・技術的・硬質（WindMonitor統計カード、棒グラフ棒） | `--radius-xs`〜`--radius-sm` |
| 標準UI要素（ボタン、インプット、通常カード） | `--radius-md`〜`--radius-lg` |
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
  borderRadius: 'var(--radius-md)',
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
| hover | 背景 `--danger-dark` |
| active | `transform: scale(0.98)` |

※ `--danger-dark` は α で §2.4 から廃止されたが、本行は β での Danger ボタン hover 設計決定まで暫定的に記述を残す。β未確定事項として扱う。（候補: --text-danger 流用 / --danger-dark 再設 / color-mix() 代替 / hover表現変更）

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

チーム固有色は廃止し、**アクティブ/非アクティブの対比**で識別する。

| 状態 | 表現 |
|---|---|
| アクティブ | 背景 `--neutral-900` 強調、文字 `--neutral-0`、左端にアクセント帯 4px |
| 非アクティブ | 背景 `--neutral-800` 退色、文字 rgba(255,255,255,0.6) |

#### 9.2.4 ヘッダー仕様

- 背景: `--neutral-900`、高さ `--space-12`（48px）以上
- 左側: 戻るボタン + メンバーアイコン（Ghost）
- 中央: 「N試合目 Nターン目」表示（`--text-base`、白70%）
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

- チーム固有色を背景や識別に使う（アクティブ/非アクティブの対比で識別）
- Wind Vector Widget を GameScreen 以外で使用
- スキットル番号ボタンの配置・形状改変
- 入力エリアをダーク化（ライト基調の視認性を守る）

---

### 9.3 WindMonitor

#### 9.3.1 質感アイデンティティ

**Apple Watch Ultra Industrial 美学**。Apple Watch Ultra の Wayfinder 文字盤（コンパス）と Modular Ultra 文字盤（数値・統計）を参照基準とする、暗闇に浮かぶ計器盤としての風速モニター画面。

#### 9.3.2 主役（ダブル主役の例外）

**ダブル主役**:
1. 現在風速の Hero 数値
2. 風向コンパス

この2つは垂直方向に均等分割され、どちらかが主役でどちらかが脇役、という関係ではない。「計器盤」として両立する。

#### 9.3.3 背景と全体配色

- 画面背景: `--wind-bg-base`（`--neutral-950` 相当）
- 統計カード背景: `--wind-bg-card`（`--neutral-900` 相当）
- 主グリッド: `--wind-grid-major`（rgba(255,255,255,0.18)）
- 副グリッド: `--wind-grid-minor`（rgba(255,255,255,0.08)）
- 主要テキスト: `--wind-text-primary`（白）
- 補助テキスト: `--wind-text-label`（白60%）

#### 9.3.4 主役エリア — 風速数値

- 数値: `--text-6xl`（72px）/ `--font-instrument` / `--weight-black`
- 単位 `m/s`: `--text-xl` / `--font-instrument` / `--weight-medium` / 白60%
- **Wind Ramp ゲージバー**: 数値下に水平バー、現在風速位置に縦線マーカー
  - バー: CALM→MODERATE→STRONG→SEVERE のグラデーション
  - 現在位置マーカー: 白線 2px + 微グロウ
- **パルス**: 3秒周期、`scale(1.0→1.015→1.0)` + 数値の `text-shadow` 微拡張

#### 9.3.5 主役エリア — 風向コンパス

**構成**: 2層同心円 + 8方位ラベル + 中央 Hero 矢印

- 外側円: 8方位（N/NE/E/SE/S/SW/W/NW）ラベル、`--wind-text-label`、`--font-instrument`
- 内側円: 主グリッドライン 8分割
- 中央矢印: 現在風向を示す大型矢印
  - 塗り: Wind Ramp 色（風速カテゴリに応じて変化）
  - サイズ: コンパス半径の 70%
  - **アニメ**: 風向変化時に 0.5秒で新方向へ回転（`cubic-bezier(0.4, 0, 0.2, 1)`）

#### 9.3.6 統計カード（円形ゲージ）

最大風速・平均風速・バッテリー残量などを示す統計カード。SVG で円形ゲージを徹底実装して Industrial 美学の核を作る。

- 形状: 正方形カード、`--radius-lg`、背景 `--wind-bg-card`
- ゲージ: SVG 円形プログレス、外周 270°（上端を開く）
  - 背景リング: `--wind-grid-minor`
  - 進行リング: Wind Ramp 色、太さ 8〜12px、端は丸
  - アニメ: 初期描画時に 0.8秒でゼロから現在値まで埋まる
- 中央数値: `--text-3xl` / `--font-instrument` / `--weight-bold`
- ラベル: カード上部、`--text-sm` / 白60%

#### 9.3.7 時系列グラフ

過去数分〜数十分の風速推移をライングラフで表示。

- 背景: `--wind-bg-card`、`--radius-lg`
- 主グリッド: 水平線 5〜6本、`--wind-grid-major`
- 副グリッド: `--wind-grid-minor`
- ライン: 白、太さ 2px
- 現在値マーカー: 右端にドット（Wind Ramp 色）+ **パルス** 2秒周期
- Y軸ラベル: `--font-instrument` / 白60%

#### 9.3.8 マイクロアニメーション 4種

| 種類 | 対象 | タイミング |
|---|---|---|
| Hero 数値パルス | 主役風速数値 | 3秒周期、scale + text-shadow |
| 矢印回転 | コンパス中央矢印 | 風向変化時 0.5秒、cubic-bezier |
| 円形ゲージ初期描画 | 統計カード3枚 | 表示時 0.8秒、stagger 150ms |
| 現在値マーカーパルス | 時系列グラフ右端ドット | 2秒周期 |

#### 9.3.9 ✗ 使用禁止

- ライト基調への切替（Industrial 美学が崩壊）
- 統計カードに円形ゲージ以外の実装（棒グラフ等）
- パルスの追加（4種以上への拡張禁止、1画面1〜2箇所原則）
- 装飾アイコン・イラストの追加（Whoop的ストイックさ崩壊）

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

- 背景: `--neutral-900` + `--radius-md`
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

**該当章**: §2.5 / §9.4.9

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
