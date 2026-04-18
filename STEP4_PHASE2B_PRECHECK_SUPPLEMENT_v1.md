# Step 4 第2弾B 事前確認（追加）レポート v1

作成日: 2026-04-17
調査対象コミット: 782a8fc81bef4178046e899e1cc941c698c19327
調査実行者: Claude Code

---

## 1. --border-light 使用箇所 grep 結果

- 実行コマンド: `grep -rnE 'var\(--border-light\)' src/`
- ヒット件数: **1 件**
- 使用箇所一覧:

  | # | file:line | 文脈要約 |
  |---|---|---|
  | 1 | src/components/SetupScreen.jsx:337 | `const PIN={flex:1,border:"1px solid var(--border-light)",borderRadius:10,padding:"12px 14px",fontSize:20,outline:"none",background:"#fafafa"};` — PIN 入力欄（テキストインプット）の外枠ボーダー |

- 用途カテゴリ: **入力系（テキストインプット外枠）1 件のみ**
  - `--border-lighter`（事前確認レポート §1.1 で 9 件）と異なり、`--border-light` は極めて限定的な使用にとどまっている
  - カード外枠・ボタン外枠・区切り線等への波及なし

---

## 2. DESIGN.md §2.4 Semantic Colors 現状

### 2.1 §2.4 の開始行・終了行

- 開始: L133（`### 2.4 Semantic Colors`）
- 終了: L154（§2.5 開始の L155 直前）

### 2.2 定義されている変数一覧

| 変数 | 値 | 用途記載 |
|---|---|---|
| `--success` | `#22b566` | 成功状態、ONトグル、完了バッジ |
| `--success-dark` | `#1a9d52` | 成功hover、濃色文字 |
| `--success-bg` | `#e6faf0` | 成功薄背景、通知背景 |
| `--warning` | `#e6a817` | 警告、注意、お気に入り星 |
| `--warning-dark` | `#bf6900` | 警告文字、強調 |
| `--warning-bg` | `#fff3e0` | 警告薄背景 |
| `--danger` | `#e74c3c` | エラー、削除、ミス列、NGバッジ |
| `--danger-dark` | `#c0392b` | エラー文字、hover |
| `--danger-bg` | `#fde8e8` | エラー薄背景、NGバッジ背景 |
| `--gold` | `#ffd700` | 上がり得点（11・12点）強調、勝利演出 |

- 記載フォーマット: **マークダウンテーブル形式**（3 列：トークン / 値 / 主な用途）
- 用途列粒度: **1 行、短いカンマ区切り 2〜3 用途列挙**

### 2.3 --warning 相当の定義の有無

- **有（既に DESIGN.md §2.4 に定義済み）**
- 詳細: `--warning`（`#e6a817`）、`--warning-dark`（`#bf6900`）、`--warning-bg`（`#fff3e0`）の 3 変数セットが L142-L144 に定義されている
- **最重要の発見**: B-3「--warning の新設」は、DESIGN.md 側では既に定義済みだが styles.css 側に実装が欠落している状態である（後述 §4 参照）

### 2.4 §2.4 全文引用

```markdown
### 2.4 Semantic Colors

状態表現専用。汎用装飾・強調目的での使用は禁止（色の役割分離原則）。

| トークン | 値 | 主な用途 |
|---|---|---|
| `--success` | `#22b566` | 成功状態、ONトグル、完了バッジ |
| `--success-dark` | `#1a9d52` | 成功hover、濃色文字 |
| `--success-bg` | `#e6faf0` | 成功薄背景、通知背景 |
| `--warning` | `#e6a817` | 警告、注意、お気に入り星 |
| `--warning-dark` | `#bf6900` | 警告文字、強調 |
| `--warning-bg` | `#fff3e0` | 警告薄背景 |
| `--danger` | `#e74c3c` | エラー、削除、ミス列、NGバッジ |
| `--danger-dark` | `#c0392b` | エラー文字、hover |
| `--danger-bg` | `#fde8e8` | エラー薄背景、NGバッジ背景 |
| `--gold` | `#ffd700` | 上がり得点（11・12点）強調、勝利演出 |

**既存エイリアス変更（Step 4 第2弾以降で実施予定）**:
- `--accent-red` の定義値を `#d93a5e` → `#e74c3c` に変更（`--danger` と統一）

**注意**: Step 4 第1弾では実コードの定義値変更は行わない。視覚変化を伴う変更のため、別途モックアップ検証を経て第2弾以降で適用する。現状値と理想値の差分は §2.10.2 および §2.10.3 を参照。
```

### 2.5 補足: styles.css 実装状況（追加調査）

- `grep -nE -- '--warning|--success|--danger|--gold' src/styles.css` → **ヒット 0 件**
- §2.4 に定義された 10 変数（`--success` / `--success-dark` / `--success-bg` / `--warning` / `--warning-dark` / `--warning-bg` / `--danger` / `--danger-dark` / `--danger-bg` / `--gold`）は **いずれも styles.css に未実装**
- つまり DESIGN.md §2.4 は「設計上の理想」を記載しているが、現状コードからは利用不可能な状態

---

## 3. DESIGN.md §7.5 Modal Overlay 現状

### 3.1 §7.5 の開始行・終了行

- 開始: L971（`### 7.5 Modal`）
- 終了: L1009（§7.6 開始の L1011 直前、L1010 は区切りの水平線または空行）

### 3.2 §7.5 全文引用

```markdown
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
```

### 3.3 「未使用状態」「将来使用予定」文言の有無

- **記載無**
- §7.5 内には `--bg-overlay` が現状実装で未使用である旨、あるいは「将来使用予定」である旨の文言は一切ない
- 第2弾A で §7.5 を `rgba(0,0,0,0.55)` / `var(--bg-overlay)` に同期済みだが、その時点で用途実態（実コード未使用）には触れられていない

---

## 4. 総括

### 4.1 判明事項

1. **`--border-light` の使用はわずか 1 箇所（SetupScreen.jsx:337 PIN 入力欄ボーダー）**。B-2a での置換規模は極めて小規模で、他コンポーネントへの波及リスクはない。
2. **DESIGN.md §2.4 に `--warning` / `--warning-dark` / `--warning-bg` が既に定義済み**（L142-L144、`#e6a817` / `#bf6900` / `#fff3e0`）。B-3 は「新設」ではなく「DESIGN.md 既定義変数の styles.css への実装（同期）」が実態。
3. **§2.4 全 10 変数（success 系 3・warning 系 3・danger 系 3・gold）は styles.css にいずれも未実装**。DESIGN.md は設計上の理想を記載しているが、コードからは利用不能な状態。
4. **DESIGN.md §7.5 Modal Overlay は「未使用状態」「将来使用予定」の文言を持たない**。第2弾A で `var(--bg-overlay)` 同期済みだが、実コード上の利用実態に関する注記はない。
5. §2.4 のテーブルは 3 列フォーマット（トークン / 値 / 主な用途）で、用途列は短いカンマ区切り。B で追記する際は同一フォーマットを踏襲すべき。

### 4.2 B 本指示書ドラフト作成に与える影響

#### B-2a（--border-light 置換規模の確定）
- 置換対象は SetupScreen.jsx:337 の **1 箇所のみ**。
- 置換先候補は `--neutral-200`（第2弾B 事前確認レポート §1.2 で確認済みの Neutral Scale 対応値）。
- 1 箇所のみのため視覚差分の影響範囲も極小。モックアップ検証の必要性は低い（iPad 実機で PIN 入力欄の枠のみ確認すれば足りる）。

#### B-3（--warning の扱い方針の再定義が必要）
- **重要**: B-3 のタスク名は「--warning 新設」とされているが、DESIGN.md には既に 3 変数セットが定義済み。B 本指示書では以下のように文言を補正すべき:
  - 誤: 「`--warning` を DESIGN.md §2.4 に新設する」
  - 正: 「DESIGN.md §2.4 に既定義の `--warning` / `--warning-dark` / `--warning-bg` を styles.css に実装する（既定義トークンの同期）」
- あわせて、成功系 3 変数・danger 系 3 変数・gold の合計 7 変数も未実装のまま。B-3 のスコープを「`--warning` 系 3 変数のみ実装」にするか、「§2.4 全 10 変数を一括実装」にするかは B 本指示書で判断が必要。
- スコープを絞る場合でも、残り 7 変数の実装時期（第2弾C 以降）を B 本指示書内で明記すべき。

#### §7.5 への追記要否
- 現状 §7.5 には「`--bg-overlay` が実コードで未使用」である旨の注記がない。
- B で `--bg-overlay` を保持する方針を確定させる場合、§7.5 末尾に以下の趣旨の追記をすべき:
  - 「モーダル実装は現状コードでは `style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.55)'}}` の直書きが中心であり、`--bg-overlay` は将来的な統一用途として保持する」
- 追記しない場合、DESIGN.md 読者が「この変数はどこで使われているのか」を追跡する材料がない状態が残る。

#### 事前確認レポート v1 との矛盾
- なし。v1 §1.1 で確認した `--border-lighter` 使用 9 件と、本追加確認の `--border-light` 使用 1 件は別変数の独立カウントであり整合する。
- §2.4 の `--warning` 既定義は v1 では未調査だったため、v1 の「--warning 新設」前提が本追加確認で覆る形となる（ただし v1 の他の結論への波及はなし）。

---

以上
