# 既知の罠リスト（Known Pitfalls）

プロジェクト全体で継続的に注意すべき罠・既知の落とし穴をまとめた恒久的なリスト。
セッションファイルの「継続的に覚えておくべき罠」に含める代わりに、ここを参照する。

**このファイルに記載する基準**:
- プロジェクト全体で不変（特定セッション固有ではない）
- 忘れると再発する実害のある罠
- 根本的な環境・ツール・ハードウェアの制約に由来するもの

**記載しない**:
- 一度限りの設定ミス（セッションファイルに留める）
- 太一さんの好み・スタイル選択（rules/ 他ファイルへ）
- アクティブな開発中の課題（セッションファイルや issue へ）

---

## ハードウェア連携

### Calypso CMI1022 風速計

- **mDNS (`calypso-bridge.local`) で WebSocket 接続すると Chrome では失敗する**
  - 症状: ブラウザ側で即時切断、サーバー側にログが残らない
  - 原因: Chrome の WebSocket 実装が mDNS 解決をサポートしていない
  - 対処: IP 直指定 (`172.20.10.7:8765`) を使う。iPad 共有 Wi-Fi なので IP 固定前提
  - 発見: BLE ブリッジ Phase 1 開発時

- **BLE プロトコルは標準 ESS (UUID `0x181A`) を使う。カスタム UUID ではない**
  - 症状: カスタム UUID で接続試行すると通信確立しない
  - 根拠: Calypso の GitHub issue で確認
  - 対処: `bleak` で ESS Characteristic を読む

- **py_qmc5883l の read_magnet_raw() は 2 値を返すバグあり**
  - 症状: unpack エラーで Raspberry Pi 側が落ちる
  - 対処: 返り値を 3 値に修正するパッチ適用済み（bridge.py 内）

### iPad 運用

- **`transform: translate3d` を使わないと iOS Safari でレンダリング性能が落ちる**
  - 対処: 高頻度更新する要素には GPU アクセラレーション明示指定

- **Canvas で動的フォントサイズを計算すると想定より遥かに小さくなる**
  - 症状: Trump Card などで文字が読めない
  - 原因: viewport 単位と実ピクセル比の計算ミスが起きやすい
  - 対処: 実機で目視確認するまでコード上のフォントサイズは信用しない

---

## Claude Code 環境

### ファイル追跡

- **`.gitignore` に `.claude/` が含まれているため、rules/ や skills/ の新規ファイルは `git add -f` が必要**
  - 症状: `git add .claude/rules/foo.md` しても追跡されない
  - 原因: `.claude/` 配下全体が ignore 対象
  - 対処: `git add -f .claude/rules/foo.md` で強制追加。既存ファイルは `git add` のみで差分追跡可能
  - 代替案（未採用）: `.gitignore` を細分化して `settings.local.json` のみ ignore する（太一さん判断で据え置き）

### フック構文

- **ECC kit 同梱の hooks-example は `$TOOL_INPUT_FILE` / `$TOOL_INPUT` を参照するが、これらは Claude Code の仕様に存在しない**
  - 症状: フックが常に空のファイルパスで動作し、何もチェックしない
  - 原因: kit の元ネタが古い仕様、または別ツールの仕様と混同
  - 対処: stdin から JSON を読む形式に書き換え
    ```javascript
    const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const filePath = (d.tool_input || {}).file_path || '';
    const command = (d.tool_input || {}).command || '';
    ```
  - 現状: `.claude/settings.local.json` に修正版を実装済み

### セッション引き継ぎ

- **Claude AI（設計側）と Claude Code（実装側）は記憶を共有しない**
  - 症状: Claude.ai で決めたことが Claude Code で忘れられる・逆も然り
  - 対処: `/save-session` の「Claude.ai 側との同期」セクションで伝達事項を明示。必要なら memory 更新を依頼

### Git 操作

- **ブランチ切り替え前の `.claude/settings.local.json` 状態確認**
  - 症状: `git checkout` 時に「Your local changes would be overwritten by checkout」でブロックされる
  - 原因: セッション中に Claude Code が新しいコマンドの承認を取ると `.claude/settings.local.json` が modified 状態になる。本ファイルは ECC 導入時の設計判断で git 追跡済みのため、未コミットのまま切り替えができない
  - 対処: ブランチ作成・切り替え直前に `git status` で本ファイルの状態を確認し、modified ならセッション中の承認分を main に独立コミットとして保存してから切り替える
  - 前例: `ab1968b`（第2弾B-α 冒頭）、`4c22dd0`（第2弾B-α 後クリーンアップ時）

- **Squash merge 後の feature ブランチ削除は `-D` が必須**
  - 症状: GitHub 上で Squash merge した feature ブランチをローカルで `git branch -d` しようとすると「not fully merged」で拒否される
  - 原因: Squash merge は feature ブランチのコミット群を1つに圧縮して main に積むため、元コミットのハッシュは main に存在しない。git は「このブランチのコミットが main に含まれていない = 未マージ」と判定する
  - 対処: PR マージ記録で実内容の取り込みが確定している場合のみ、`git diff origin/main..<branch>` で差分ゼロを確認した上で `git branch -D <branch>` で強制削除する

---

## Supabase

### RLS / 権限

- **テーブル作成時に RLS ポリシーを設定し忘れると、プロダクションで全アクセス拒否**
  - 症状: migration 通った後、API から `permission denied for table X` エラー
  - 対処: 各 migration で `CREATE TABLE` と同時に `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` と `CREATE POLICY` を書く

### 型生成

- **スキーマ変更後に `supabase gen types` を実行し忘れると TypeScript 側が古い型のまま**
  - 症状: 実際のカラム名やカラム型と TS 側で不一致、ランタイムで `undefined` アクセス
  - 対処: migration push 直後に型生成コマンドを実行し、差分をコミット

---

## 運用

### Vercel

- **環境変数変更後は手動で再デプロイが必要（自動ではない）**
  - 症状: 環境変数を追加しても本番で反映されない
  - 対処: Vercel ダッシュボードで該当デプロイを Redeploy

### nanaco / 決済

- **これは開発ではないが、nanaco 残高のチケットショップ換金戦略は Ticket Land Fuji が最適**
  - メモ: 別件、太一さんの運用知見として記録

---

## デザイントークン整理

### セマンティックカラー

- **セマンティックカラー整理時の `:root` 全変数列挙必須化**
  - 症状: `styles.css` の `:root` ブロックに既存定義されているトークンを見落とし、「新規追加しようとしたトークンが既に存在していた」という誤認で作業途中に仕様変更を強いられる
  - 前例: 第2弾B-α 段階の事前調査で `:root` ブロック全量の列挙を省いた結果、第2弾B-β 冒頭で `--text-warning: #e67700` の既存定義（`GameScreen.jsx:88` で実使用）が発覚し仕様変更が必要になった（2026-04-19）
  - 対処: セマンティックカラー関連の事前調査フェーズで、`src/styles.css` の `:root` ブロック全変数を明示的に列挙することを手順に含める

- **セマンティック整理時の置換元/先 hex 値一致確認**
  - 症状: 置換元 hex と置換先トークンの値が完全一致するか微差があるかを確認しないまま機械的に置換すると、色味変化が発生しても気づかずに本番反映される
  - 対処: 置換作業前に「hex → トークン値」のマッピング表を作成し、値一致 / 微差 / 大差 を明示する。微差以上の差がある場合は太一さんの許容確認を必ず取る
  - 前例: 第2弾B-β で `common.jsx:293` の `#e65100` を `var(--text-warning)`（= `#e67700`）に置換する際、事前に色味微変化を把握し太一さんに許容確認を取ってから進めた（2026-04-19）

---

## 追加・更新ガイドライン

新しい罠を発見した時の判断：

1. **その罠は恒久的か？** → このファイルに追加
2. **特定セッションのみの問題か？** → セッションファイルの「避けるべき罠」に留める
3. **プロジェクト設計思想の話か？** → `.claude/rules/` の該当ファイルに追加

このファイルは肥大化しないよう、年1回程度で「もう発生しなくなった罠」を削除する（git log で復元可能）。

## DESIGN.md 違反パターン

以下は DESIGN.md §10 Don'ts に基づく典型的な違反パターン。PR 作成前にセルフチェックすること。

### インラインで生値を書かない

**違反例**:
```jsx
<div style={{ color: "#14365a", padding: "16px", borderRadius: "12px" }}>
```

**修正例**:
```jsx
<div style={{ color: "var(--text-primary)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)" }}>
```

### プレイヤー色を UI 要素に流用しない（§10.2）

**違反例**: ボタン背景に `--team-1-accent` を使う

**修正例**: ボタン背景は `--blue-500`（ブランド色）や `--success`（状態色）を使う

### Wind Ramp 色をスコア可視化に流用しない（§10.2）

**違反例**: スコア分布ヒートマップに `--wind-calm`〜`--wind-severe` を使う

**修正例**: スコアヒートマップは独自の色体系を使う（構造を借りるのは OK だが色は別）

### `--font-instrument` を本文・見出し・日本語テキストに使わない（§3.5, §10.2）

**違反例**: セクション見出しに `font-family: var(--font-instrument)` を使う

**修正例**: `--font-instrument` は主要数値（KPI・レーダー軸・試合スコア・風速数値・同期コード・Pi アドレス）のみに使用

### `--weight-medium` より軽いウェイト（400 等）を使わない（§3.3）

**違反例**: `font-weight: 400` や `font-weight: normal` を指定

**修正例**: `font-weight: var(--weight-medium)` (500) 以上を使用。本アプリの下限は 500

### Tailwind 系グレーを新規使用しない（§2.1, §2.9）

**違反例**: `bg-gray-500`, `text-gray-400` の直書き

**修正例**: Neutral Scale (`--neutral-0`〜`--neutral-950`) を使用

### Step 4 第1弾時点の保留項目を認識せずに実装する

**違反例**: `--accent-red` が `#e74c3c` に変わっていると仮定した実装をする

**修正例**: DESIGN.md §2.10.3 で Step 4 第1弾時点の保留項目を確認し、現状値で動作することを前提に実装する
