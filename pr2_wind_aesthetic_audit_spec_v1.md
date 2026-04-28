# WindMonitor 美学棚卸し PR 2: #f87171 → --wind-strong 統合（視覚変化あり）

**発行日**: 2026-04-28
**前提**: PR 1（WindMonitor 美学棚卸し PR 1、新トークン 4 本追加）が main にマージ済み（commit `4f76077214617e831f0b0d1e59d173fc406743d8`）
**対象 main HEAD（事前検証時点）**: `4f76077214617e831f0b0d1e59d173fc406743d8`
**確度**: 全記述「実ファイル確認済み」（GitHub MCP で `WindMonitorModal.jsx` SHA `dd8ae448741c13c93f83a06d3fdad71b47acac78`、`DESIGN.md` SHA `c623a36c1672b04f34269703feaaf9a73cb0cded`、いずれも引き継ぎドキュメント §6 と完全一致を確認済み）

---

## 【Claude Code 共通ルール】

- 確認事項、質問、コミットメッセージ、PR の説明文はすべて日本語で表現すること
- 英語でのやり取りは禁止。すべてのコミュニケーションを日本語で行うこと
- 不明点がある場合は日本語で質問すること
- 作業開始前に `git checkout main && git pull` で main を最新にしてからブランチを作成すること

## 【鉄則】

- 求められていないリファクタリング・改善・フォーマット変更はしない
- 日本語テキストは直接日本語文字で記述する。Unicode エスケープシーケンス禁止
- スコープ外の hex への侵食を絶対に行わない（DIRECTION_ITEMS の 5 色、`#0b1220`、`#cbd5e1`、`#ffffff`、`#050914`、`#34d399` 直書き 3 箇所、各種 rgba は今回の対象外。詳細は本書「スコープ侵食の絶対禁止」参照）

## ブランチ

`feat/wind-aesthetic-audit-pr2`

## PR タイトル

`feat(wind): WindMonitor 美学棚卸し PR 2 - #f87171 → --wind-strong 統合（視覚変化あり）`

---

## 背景・目的

PR β X-1（PR #94、2026-04-25 マージ）で DESIGN.md §9.3.11 に「A 案採択」のまま積み残されていた残余 hex 12 項目のうち、唯一視覚変化を伴う #3 項目（`#f87171` → `--wind-strong` 統合）を実装する。

PR 1（2026-04-28 マージ）で他 11 項目は処理済み（4 トークン化 + 7 項目は直書き維持確定）。本 PR をもって WindMonitor 美学棚卸しタスク（観点 2、2026-04-26 確定方針）が完結する。

### 設計意図（視覚変化の根拠）

STRONG 帯は風速 4.0〜6.0 m/s（明確な補正必要レベル）を表す。Wind Ramp の他帯（CALM `#34d399` / MODERATE `#fbbf24` / SEVERE `#ef4444`）と整合する hex を使うことで、レンジゲージ全体が「Wind Ramp の縮約表現」として意味論的に統一される。

`#f87171`（red 400 系）は SEVERE `#ef4444`（red 500 系）と色相が近く、「STRONG」と「SEVERE」の視覚的差別化が弱かった。`#f97316`（orange 500 系）への変更で 4 段階の階調が緑→黄→橙→赤と明確になり、温度勾配的に直感的な構造になる。

### 視覚変化の事前計算

| 項目 | Before（`#f87171`） | After（`--wind-strong` = `#f97316`） | 差分 |
|---|---|---|---|
| RGB | (248, 113, 113) | (249, 115, 22) | R +1 / G +2 / B -91 |
| 色相系統 | red 400（柔らかい朱赤、ピンクみ） | orange 500（はっきりしたオレンジ） | red → orange へ系統移動 |
| 印象 | 柔和、警戒感低め | 明瞭、警戒感あり、CALM/MODERATE との階調がより明快 |

本変更は太一さんが Phase 1 のモック画像で Before/After 比較を承認済み（2026-04-28、Claude AI セッション内）。

---

## 作業概要

本 PR は **作業 1（コード）+ 作業 2（DESIGN.md）** の 2 段階構成。

1. **作業 1**: `src/components/WindMonitorModal.jsx` の `#f87171` × 2 箇所を `var(--wind-strong)` に置換（機械的、視覚変化あり）
2. **作業 2**: `DESIGN.md` の 4 箇所更新（§9.3.4 / §9.3.11 #3 行 / §9.3.11 導入段落 / §2.6 履歴段落）

作業 2 は **draft 提示 → 太一さん承認 → 一括 commit** の 2 段階フロー（PR 1 と同様）。Claude Code は DESIGN.md draft を作成した時点で太一さんにレビューを求め、承認後に commit すること。

---

## 作業 1: WindMonitorModal.jsx の `#f87171` を `var(--wind-strong)` に置換

### 変更対象ファイル

- `src/components/WindMonitorModal.jsx`

### 前提（実ファイル確認済み）

`#f87171` の出現は **2 箇所のみ**（PR 1 で他 hex はすべて var() 化済）。それぞれ InstrumentDeckPhone と InstrumentDeckPad のレンジゲージ STRONG 帯を構成する div の `background` プロパティ値である。

**箇所 1: InstrumentDeckPhone のレンジゲージ STRONG 帯**

置換対象の行（main の現状、引き継ぎドキュメント §2.1 で「行 645」相当）:

```jsx
<div style={{ position: "absolute", left: "70%", top: 0, height: 4, width: "30%", background: "#f87171", borderRadius: 2, margin: 1 }} />
```

前後文脈（変更不要、参照用）:

```jsx
<div style={{ marginTop: 10, padding: "0 4px" }}>
  <div style={{ height: 6, background: "#0b1220", borderRadius: 3, position: "relative", border: "1px solid var(--wind-edge)" }}>
    <div style={{ position: "absolute", left: "0%", top: 0, height: 4, width: "40%", background: "var(--wind-calm)", borderRadius: 2, margin: 1 }} />
    <div style={{ position: "absolute", left: "40%", top: 0, height: 4, width: "30%", background: "var(--wind-moderate)", margin: 1 }} />
    <div style={{ position: "absolute", left: "70%", top: 0, height: 4, width: "30%", background: "#f87171", borderRadius: 2, margin: 1 }} />
    {gaugeShow && (
      <div style={{ position: "absolute", left: `${gaugePct}%`, top: -3, width: 2, height: 12, background: "var(--wind-text-primary)" }} />
    )}
  </div>
  ...
</div>
```

**箇所 2: InstrumentDeckPad のレンジゲージ STRONG 帯**

置換対象の行（main の現状、引き継ぎドキュメント §2.1 で「行 871」相当）:

```jsx
<div style={{ position: "absolute", left: "70%", top: 0, height: 6, width: "30%", background: "#f87171", borderRadius: 3, margin: 1 }} />
```

前後文脈（変更不要、参照用）:

```jsx
<div style={{ marginTop: 16, padding: "0 6px" }}>
  <div style={{ height: 8, background: "#0b1220", borderRadius: 4, position: "relative", border: "1px solid var(--wind-edge)" }}>
    <div style={{ position: "absolute", left: "0%", top: 0, height: 6, width: "40%", background: "var(--wind-calm)", borderRadius: 3, margin: 1 }} />
    <div style={{ position: "absolute", left: "40%", top: 0, height: 6, width: "30%", background: "var(--wind-moderate)", margin: 1 }} />
    <div style={{ position: "absolute", left: "70%", top: 0, height: 6, width: "30%", background: "#f87171", borderRadius: 3, margin: 1 }} />
    {gaugeShow && (
      <div style={{ position: "absolute", left: `${gaugePct}%`, top: -4, width: 2.5, height: 16, background: "var(--wind-text-primary)" }} />
    )}
  </div>
  ...
</div>
```

### 置換ルール

両箇所とも、`background: "#f87171"` を `background: "var(--wind-strong)"` に置換するのみ。

**変更前**:
```jsx
background: "#f87171"
```

**変更後**:
```jsx
background: "var(--wind-strong)"
```

Phone と Pad で `height` / `borderRadius` / `margin` の値は異なるが、それらは **絶対に触らない**（PR 1 で確定した正典値）。

### Phone と Pad の対称性維持

`#f87171` は Phone（外枠 height 6、帯 height 4）と Pad（外枠 height 8、帯 height 6）の 2 箇所に存在し、両者を同時に変更しないと Phone と Pad で見た目が乖離する。**両方とも置換、片方だけ置換は禁止**。

### styles.css の `--wind-strong` 既存定義（参照、変更不要）

`src/styles.css` の §2.5 Wind Sensor Colors 内で既に正典定義済み（PR 1 以前から）:

```css
--wind-strong: #f97316;  /* 4.0〜6.0 m/s、明確な補正必要 */
```

PR 2 で styles.css への新規トークン追加は **行わない**。既存の Wind Ramp 体系（CALM/MODERATE/STRONG/SEVERE）への統合となる。

### 完了条件

- `grep -n '#f87171' src/components/WindMonitorModal.jsx` の出力が **0 件** であること
- `grep -n 'var(--wind-strong)' src/components/WindMonitorModal.jsx` で **2 件**ヒットすること（Phone のレンジゲージ STRONG 帯 + Pad のレンジゲージ STRONG 帯）
- それ以外の `--wind-*` 系トークン（`--wind-calm` / `--wind-moderate` / `--wind-edge` / `--wind-text-primary` 等）の使用箇所数が PR 1 マージ時点と同じであること
- `WindMonitorModal.jsx` の差分が当該 2 行のみであること（無関係な空白・インデント・コメント変更は禁止）

---

## 作業 2: DESIGN.md の関連記述更新

### 変更対象ファイル

- `DESIGN.md`

### 段階フロー（重要）

PR 1 で確立した **2 段階フロー** を踏襲する。

1. **第 1 段階**: Claude Code が DESIGN.md の draft（変更後の全文 or 該当箇所の差分）を太一さんに提示
2. **第 2 段階**: 太一さんが draft をレビューし承認 → Claude Code が一括 commit

PR 1 では本セッション（2026-04-28）で `§9.3.10.x の var() 化 27 箇所表` の精査時に、太一さん側のレビューで漏れ（行 1935 §9.3.5 face radial の `#020617`）を 1 件発見した実績がある。同様の精査を PR 2 でも行うため、Claude Code は draft を完成させた段階で**先に commit せず**、太一さんの承認を待つこと。

### 更新箇所 1: §9.3.4 レンジゲージ記述

#### 現状の文言（main、SHA `c623a36c1672b04f34269703feaaf9a73cb0cded`）

§9.3.4「主役エリア — 風速数値」内の「レンジゲージ」サブセクションに以下の行が存在する:

```markdown
- STRONG 帯（70〜100%）: `#f87171`（§9.3.11 残余承認）、同サイズ、`margin: 1`、`borderRadius: 2`（Phone）/ `3`（Pad）
```

#### 更新後の文言

```markdown
- STRONG 帯（70〜100%）: `var(--wind-strong)` (#f97316)、同サイズ、`margin: 1`、`borderRadius: 2`（Phone）/ `3`（Pad）
```

#### 更新の意図

- `#f87171` の直書き表記から `var(--wind-strong)` トークン参照表記へ変更
- 「（§9.3.11 残余承認）」表記を削除（PR 2 で正典化されたため、残余承認の対象外になる）
- 隣の CALM 帯・MODERATE 帯の記述形式（`var(--wind-calm)` / `var(--wind-moderate)`）と整合

### 更新箇所 2: §9.3.11 #3 行（残余 hex 一覧テーブル）

#### 現状の文言（main、§9.3.11「残余 hex / rgba 一覧（12 項目）」テーブル）

```markdown
| 3 | レンジゲージ STRONG 帯（Phone / Pad） | `#f87171` | `--wind-strong` (#f97316) | 微差（RGB 各 ±7〜13） | **PR 2 で `--wind-strong` 統合予定**（視覚変化あり、モック確認必須） |
```

#### 更新後の文言

```markdown
| 3 | レンジゲージ STRONG 帯（Phone / Pad） | `#f87171` | `--wind-strong` (#f97316) | 微差（RGB 各 ±7〜13） | `var(--wind-strong)` 統合済（PR 2、視覚変化あり） |
```

#### 更新の意図

- 「**PR 2 で `--wind-strong` 統合予定**...」という未来形の予告から、「`var(--wind-strong)` 統合済（PR 2、視覚変化あり）」という確定形のアーカイブ記述へ変更
- テーブルの 4 列目「既存トークン候補」「差分」列は変更なし（変更履歴の参照情報として保持）

### 更新箇所 3: §9.3.11 導入段落

#### 現状の文言（main、§9.3.11 冒頭の段落）

```markdown
本節は 2026-04-26 の WindMonitor 美学棚卸しタスク（観点 2）で確定した残余 hex 12 項目の処理方針を記録するアーカイブである。PR 1（視覚変化なし、新トークン 4 本追加 + jsx 置換 15 箇所）でほぼ完了し、`#f87171` → `--wind-strong` 統合のみ視覚変化を伴うため PR 2 で別個に対応する。本節は確定後の状態を記録する位置づけであり、新たな審議を必要としない。
```

#### 更新後の文言

```markdown
本節は 2026-04-26 の WindMonitor 美学棚卸しタスク（観点 2）で確定した残余 hex 12 項目の処理方針を記録するアーカイブである。PR 1（視覚変化なし、新トークン 4 本追加 + jsx 置換 15 箇所）と PR 2（視覚変化あり、`#f87171` → `--wind-strong` 統合）で 12 項目すべての処理が確定し、WindMonitor 美学棚卸しタスクは完結した。本節は確定後の状態を記録する位置づけであり、新たな審議を必要としない。
```

#### 更新の意図

- PR 1 と PR 2 の両方が完了したことを明示
- 「ほぼ完了」「PR 2 で別個に対応する」という未完了表現を、「12 項目すべての処理が確定」「タスクは完結した」という完了形に変更

### 更新箇所 4: §2.6 履歴段落（任意、太一さん判断で実施）

#### 現状の文言（main、§2.6「Wind Monitor Industrial Palette」冒頭の段落）

```markdown
Apple Watch Ultra Industrial 美学（Wayfinder 文字盤 + Modular Ultra 文字盤参照）の WindMonitorModal 専用 16 トークン。PR β X-2（PR #91、2026-04-24）で `src/styles.css` に 12 トークン追加、PR β X-3（PR #92、2026-04-24）で `src/components/WindMonitorModal.jsx` に全面適用、PR 1（2026-04-26、WindMonitor 美学棚卸し）で `--wind-battery-null` / `--wind-battery-mid` / `--wind-border-subtle` / `--wind-shadow-deep` の 4 トークンを追加し残余 hex 直書き 15 箇所を解消。既存の `--wind-bg-base` / `--wind-bg-card` / `--wind-grid-*` / `--wind-text-*` の 6 トークン定義（2025 年時点）は本節の書き換えで廃止され、新 16 トークン体系に置き換わる。
```

#### 更新後の文言（候補 A、追記型）

```markdown
Apple Watch Ultra Industrial 美学（Wayfinder 文字盤 + Modular Ultra 文字盤参照）の WindMonitorModal 専用 16 トークン。PR β X-2（PR #91、2026-04-24）で `src/styles.css` に 12 トークン追加、PR β X-3（PR #92、2026-04-24）で `src/components/WindMonitorModal.jsx` に全面適用、PR 1（2026-04-26、WindMonitor 美学棚卸し）で `--wind-battery-null` / `--wind-battery-mid` / `--wind-border-subtle` / `--wind-shadow-deep` の 4 トークンを追加し残余 hex 直書き 15 箇所を解消、PR 2（2026-04-XX、WindMonitor 美学棚卸し完結）でレンジゲージ STRONG 帯 `#f87171` を `--wind-strong` に統合し残余 hex 棚卸しタスク完結。既存の `--wind-bg-base` / `--wind-bg-card` / `--wind-grid-*` / `--wind-text-*` の 6 トークン定義（2025 年時点）は本節の書き換えで廃止され、新 16 トークン体系に置き換わる。
```

#### 更新の意図

- §2.6 の履歴段落に PR 2 の成果を追記し、§9.3.11 と整合させる
- 「2026-04-XX」の `XX` は実際の PR 2 マージ日に置き換えて記述すること（draft 提示時点では PR マージ日が未確定なので、太一さんに「マージ予定日」を確認してから記述する）

#### 任意扱いの理由

§2.6 への追記は「あると整合性が向上するが、なくても §9.3.11 の更新だけで PR 2 の記録は十分」という性質。太一さんから「§2.6 も追記してほしい」という指示があれば反映し、「§9.3.11 だけでよい」という指示なら更新箇所 4 はスキップする。draft 提示時に太一さんに方針を確認すること。

### 完了条件

- `grep -n '#f87171' DESIGN.md` の出力が **0 件**（§9.3.4 と §9.3.11 #3 行から `#f87171` が消えていること）。ただし §9.3.11 #3 行の「現状」列（旧値の参照記述）として `#f87171` を**残す**判断もありうるので、太一さんが draft レビューで残す/消すを最終決定する。本指示書での推奨は §9.3.11 #3 行の「現状」列に `#f87171` を残し、ステータス列のみ更新する形（§9.3.11 が「アーカイブ」としての役割を持つため、変更履歴の追跡用に旧値を保持する方が一貫性が高い）。draft 提示時に太一さんに方針を確認すること。
- §9.3.4 から「（§9.3.11 残余承認）」表記が消えていること
- §9.3.11 導入段落が完了形に書き換わっていること
- §2.6 への追記は太一さん判断（draft 提示時に確認）

---

## スコープ侵食の絶対禁止

PR 2 で触れるのは以下のみ:

- `src/components/WindMonitorModal.jsx` の `#f87171` × 2 箇所
- `DESIGN.md` の §9.3.4 / §9.3.11 #3 行 / §9.3.11 導入段落 / §2.6 履歴段落（最後は任意）

**他の hex は絶対に触らない**。具体的には以下が触らない対象:

- DIRECTION_ITEMS の 5 色（`#5eead4` / `#67e8f9` / `#60a5fa` / `#818cf8` / `#c084fc`）
- レンジゲージ外枠の `#0b1220`、DeckHeader linear-gradient 下端の `#0b1220`
- CompassGauge ティック major の `#cbd5e1`
- BLADE 先端ドットの `#ffffff`
- BezelPanel radial-gradient 終点の `#050914`
- Hero 数値 textShadow の `rgba(251,191,36,0.25)`（InstrumentDeckPad のみ）
- LINKED ドット boxShadow の `rgba(52,211,153,0.8)` / `rgba(239,68,68,0.5)`
- 各種 `rgba(148,163,184,0.08)` / `rgba(148,163,184,0.1)` / `rgba(0,0,0,0.5)` 等の影・ハイライト用 rgba
- 接続成功ドット boxShadow の `rgba(52,211,153,0.8)`、切断時の `rgba(239,68,68,0.5)`
- WindChart 折れ線 accent の `#34d399` 直書き 3 箇所（Phone / Pad の `<WindChart accent="#34d399" />` + `--wind-linked` との意図的エイリアス関係を保つため）

これらは PR 1 と本セッションでの分析で「直書き維持確定」または「PR 2 スコープ外」として正典化されている。Claude Code が「ついでに整理する」「美的に揃える」等の判断で侵食することは禁止。

---

## 検証手順

### 検証 1: lint

```sh
npm run lint
```

エラー 0、警告は PR 1 マージ時点と同数であること（PR 2 で新規警告を増やさない）。

### 検証 2: build

```sh
npm run build
```

ビルド成功。`dist/` 配下に成果物が生成されること。

### 検証 3: 視覚検証（最重要、Phone・Pad 両ビューポート）

#### 検証環境

- ローカル開発サーバー（`npm run dev`）または Vercel preview deploy
- ブラウザ: Chrome / Safari いずれか
- ビューポート 2 種:
  - **Phone**: `window.innerWidth < 768`（例: 414×896 = iPhone 11 相当）
  - **Pad**: `window.innerWidth >= 768`（例: 1024×1366 = iPad Pro 12.9 相当）

#### 検証手順

1. WindMonitor モーダルを開く（GameScreen の風速計連携 ON 状態でモーダル起動 or デバッグ用の直接起動経路）
2. 風速値が STRONG 帯（4.0〜6.0 m/s）に入る状態を再現する（実機接続困難な場合はデバッグデータ注入か、レンジゲージ単体の見た目確認のみで OK）
3. **Phone ビューポート**でレンジゲージを目視確認
4. **Pad ビューポート**でレンジゲージを目視確認

#### 検証ポイント A: レンジゲージ STRONG 帯の色

レンジゲージの右側 30%（70〜100% 位置）の帯が **オレンジ系 (`#f97316`、orange 500 系)** で表示されること。具体的には:

- **Before（PR 2 適用前）**: 朱赤系（red 400 系、`#f87171`）。MODERATE 帯（黄、`#fbbf24`）からの色相遷移が「黄 → 赤」に近い
- **After（PR 2 適用後）**: 明確なオレンジ系（orange 500 系、`#f97316`）。MODERATE 帯からの色相遷移が「黄 → 橙」になり、SEVERE 帯（赤、`#ef4444`）との視覚的差別化が明確

After の表示が以下の構成と一致することを確認:

| 帯位置 | 色 | hex |
|---|---|---|
| 0〜40%（CALM） | 緑 | `#34d399` |
| 40〜70%（MODERATE） | 黄 | `#fbbf24` |
| 70〜100%（STRONG） | **オレンジ** | **`#f97316`**（変更後） |

#### 検証ポイント B: Phone と Pad の対称性

Phone と Pad の両方で STRONG 帯がオレンジ系になっていること。**片方だけ変わっている状態は不可**（Phone はオレンジ、Pad は赤、またはその逆は許容されない）。

#### 検証ポイント C: 他部位の完全同一性

PR 2 のスコープ外の以下の部位が、PR 1 マージ後の状態（main HEAD `4f76077214617e831f0b0d1e59d173fc406743d8`）と **完全同一** であること:

- CompassGauge の全要素（face / ベゼル / ティック / 度数ラベル / 方向ラベル / シェブロン / BEARING / BLADE NEEDLE / ハブ）
- BezelPanel の背景・ボーダー・リベット・title 切り欠き・corner ラベル
- DeckHeader の背景・閉じるボタン・WIND · MONITOR ラベル・T+ タイマー・LINKED ステータスドット
- DeckFooter の WX-02 ▪ FW 1.4.2 / SIG -- dBm / 1 Hz
- 統計カード PEAK / AVG / BAT の数値色・ticks バー（Pad のみ）
- WindChart の折れ線色（緑、`#34d399`）・グリッド線・Y 軸ラベル・X 軸ラベル・風向色帯
- Hero 数値の色変化（CALM / MODERATE / STRONG / SEVERE 連動）と pulse アニメーション
- レンジゲージの **CALM 帯（緑）と MODERATE 帯（黄）** および外枠・現在位置マーカー・目盛りラベル

これらは PR 2 で触らない部位なので、PR 1 マージ時から見た目が変わらないこと。

### 検証 4: 全 hex の残存チェック

```sh
grep -rn '#f87171' src/
```

`src/` 配下に `#f87171` の出現が **0 件** であること（PR 2 適用前は 2 件、適用後は 0 件）。

```sh
grep -rn 'var(--wind-strong)' src/
```

PR 1 マージ時点と比較して **+2 件** 増加していること（PR 2 で追加された Phone / Pad のレンジゲージ STRONG 帯）。

---

## コミット構造

PR 2 のコミットは以下の構造を推奨（PR 1 と同様の 2 コミット構成）:

### コミット 1: 作業 1（jsx 置換）

- メッセージ: `feat(wind): WindMonitorModal の #f87171 を var(--wind-strong) に統合`
- 変更ファイル: `src/components/WindMonitorModal.jsx`（2 行のみ）

### コミット 2: 作業 2（DESIGN.md 更新）

- 太一さん承認後に commit
- メッセージ: `docs(wind): DESIGN.md §9.3.4 / §9.3.11 / §2.6 を PR 2 完了状態に更新`（§2.6 を更新しない場合はそれを除く）
- 変更ファイル: `DESIGN.md`（4 箇所、または 3 箇所）

---

## PR 説明文テンプレート

PR 作成時の説明文ドラフト（太一さんが手動で PR を作成するので、Claude Code はこのテンプレートをそのまま PR 本文に貼り付けず、参考情報として `feat/wind-aesthetic-audit-pr2` ブランチに push 後、太一さんに手渡しすること）:

```markdown
## 概要

WindMonitor 美学棚卸し PR 2。PR 1（2026-04-28 マージ）で残された残余 hex 12 項目のうち、唯一視覚変化を伴う #3 項目（レンジゲージ STRONG 帯 `#f87171` → `--wind-strong`）を実装し、WindMonitor 美学棚卸しタスク（観点 2）を完結する。

## 視覚変化

レンジゲージ STRONG 帯（70〜100%、4.0〜6.0 m/s）の色相が変更:

- **Before**: `#f87171`（red 400 系、柔らかい朱赤）
- **After**: `--wind-strong` (`#f97316`、orange 500 系、明確なオレンジ)

Wind Ramp 階調が CALM(緑) → MODERATE(黄) → STRONG(橙) → SEVERE(赤) の温度勾配として明快化され、SEVERE 帯との視覚的差別化が向上。

## 変更内容

### `src/components/WindMonitorModal.jsx`（2 箇所）

- InstrumentDeckPhone レンジゲージ STRONG 帯: `background: "#f87171"` → `background: "var(--wind-strong)"`
- InstrumentDeckPad レンジゲージ STRONG 帯: `background: "#f87171"` → `background: "var(--wind-strong)"`

### `DESIGN.md`（4 箇所、または 3 箇所）

- §9.3.4 レンジゲージ記述: `#f87171`（§9.3.11 残余承認）→ `var(--wind-strong)` (#f97316)
- §9.3.11 #3 行: PR 2 統合予定 → 統合済（PR 2、視覚変化あり）
- §9.3.11 導入段落: PR 1 + PR 2 完了形へ書き換え
- （任意）§2.6 履歴段落: PR 2 追記

## 検証

- lint / build 成功
- Phone / Pad 両ビューポートで STRONG 帯がオレンジ系（`#f97316`）に変化していることを目視確認
- 他部位（CompassGauge / BezelPanel / DeckHeader / 統計カード / WindChart 等）は PR 1 マージ後の状態と完全同一

## 関連

- PR 1（先行マージ）: WindMonitor 美学棚卸し PR 1、新トークン 4 本追加 + jsx 置換 15 箇所
- PR β X-1（前提）: DESIGN.md §9.3.11 残余 hex 棚卸し（PR #94、2026-04-25）
- 引き継ぎドキュメント: `pr2_handover_v1.md`（2026-04-28 発行）
```

---

## 作業完了後

- ブランチ名（`feat/wind-aesthetic-audit-pr2`）を太一さんに報告
- PR は太一さんが手動で作成するので Claude Code 側では作成不要
- DESIGN.md draft の太一さんレビュー時に発見された修正点があれば、追加コミットで対応してから報告

---

## 想定されるトラブルシューティング

### Q1. `var(--wind-strong)` を参照しているが見た目がオレンジにならない

A. styles.css の `:root` で `--wind-strong: #f97316;` が定義されていることを確認する（§2.5 Wind Sensor Colors の中、PR 1 以前から存在）。CSS ビルドキャッシュが原因なら `npm run build` で再ビルドする。

### Q2. Phone と Pad で見た目が乖離している

A. `grep -n '#f87171' src/components/WindMonitorModal.jsx` で残存件数を確認。0 件でなければ片方だけ置換漏れ。

### Q3. lint で警告が増えた

A. PR 2 のスコープ外を触っている可能性が高い。`git diff main` で差分を確認し、当該 2 行 + DESIGN.md 4 箇所 (or 3 箇所) 以外の変更があれば revert する。

### Q4. 視覚検証で「STRONG 帯がオレンジに見えない」「他の帯と色が混ざって見える」

A. ブラウザの devtools で当該 div の computed style を確認し、`background: rgb(249, 115, 22)`（= `#f97316`）になっていることを直接確認する。なっていない場合は CSS 変数解決の不具合（styles.css の `:root` 定義漏れ等）を疑う。

### Q5. DESIGN.md draft の作成方針で迷う

A. 「§9.3.11 #3 行の『現状』列の `#f87171` を残すか消すか」「§2.6 履歴段落への追記をするかしないか」「§9.3.11 #3 行のステータス列の文言」等で迷ったら、draft 完成前に太一さんに質問する。本指示書「更新箇所 N」の「更新の意図」セクションで触れている方針判断は、本指示書の推奨であって、太一さんの最終判断が優先される。

---

## 引き継ぎ実績

- 引き継ぎドキュメント: `pr2_handover_v1.md`（2026-04-28、Claude AI Opus 4.7 発行）
- Phase 1 モック画像確認: 2026-04-28、Claude AI セッション内で太一さん承認済み
- 本指示書: 2026-04-28 発行、Claude AI Opus 4.7 作成、GitHub MCP で実ファイル確認済み

PR 1 マージは完璧に完了済み。PR 2 は安全に着手可能な状態。
