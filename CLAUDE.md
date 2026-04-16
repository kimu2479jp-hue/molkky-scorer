# CLAUDE.md - Molkky Scorer

## Project Overview
モルック（フィンランド発祥の屋外スキットルスローイングゲーム）のスコア管理PWA。

## Tech Stack
- React 18 (Vite 5) - SPA, inline styles (no CSS-in-JS)
- State: useReducer + IndexedDB
- Backend: Supabase (sync/storage, locations, game_environment)
- Hosting: Vercel (serverless API routes in /api)
- AI Analysis: Anthropic API (claude-opus-4-6)
- Location: Google Places API (server proxy) + OpenMeteo (weather)

## Project Structure
```
src/
  App.jsx              - Root component, screen routing
  constants.js         - Shared constants, field types, badge colors
  db.js                - IndexedDB operations
  sync.js              - Supabase cloud sync
  stats.js             - Statistics calculations
  analysis.js          - AI analysis logic
  gameLogic.js         - Game state helpers
  locationSync.js      - Location data IndexedDB cache
  components/
    common.jsx         - Shared UI components, location management
    SetupScreen.jsx    - Pre-match configuration
    GameScreen.jsx     - In-match scoring (primary screen)
    GameResult.jsx     - Post-match results, reshuffle flow
    StatsModal.jsx     - Player/team statistics display
api/
  analyze.js           - Anthropic API proxy (PIN auth)
  sync.js              - Supabase sync endpoint
  locations.js         - Location CRUD (PIN auth)
  places.js            - Google Places API server proxy
  game-environment.js  - Game environment data API
public/                - Static assets, manifest, icons
```

## Build
```bash
npx vite build
```

## Vercel Configuration
- Project: `molkky-scorer`
- Production URL: `molkky-scorer.vercel.app`
- Required env vars: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GOOGLE_PLACES_API_KEY`

## Critical Constraints
- **ゲームロジック変更禁止**: reducer, adv, scoreOf, failsOf, getPI 等は変更しない
- **ASCII only**: スマートクォート、emダッシュ等の特殊文字禁止
- **iOS Safari PWA互換**: インストール済みPWAとして正常動作すること
- **GameScreenでチーム固有色(C配列 .bg/.ac/.nm)は使用しない**: SetupScreen, GameResult, ShuffleAnimation, canvas画像エクスポートでは使用可

## Design Philosophy (Summary)
モルックは時間制限ある競技。iPad三脚固定・屋外直射日光・3m離れた複数人が遠目で見る環境で、数秒以内に状況を正確に把握できるUIが必須。

- **GameScreen** = 視認性が絶対最優先。機能 > 美しさ
- **Stats screens** = おしゃれさとデザインセンス。試合後にゆっくり見る画面
- **SetupScreen** = 操作のしやすさ。素早く直感的な試合前設定

詳細なUI設計ガイドラインは `.claude/skills/molkky-ui-design/SKILL.md` を参照。

## UI Color System
- **アクティブチーム**: 濃紺ヘッダー(#14365a)+白文字、黄色アクセント(#ffc107)
- **非アクティブチーム**: 低彩度暗背景(#1a2a3e)+白文字、グレーヘッダー(#6b7280)
- **カラーパレット**: 濃紺/黄色・琥珀/グレー/白/黒の5系統のみ
- **禁止**: 中間色、薄いグラデーション、半透明

## Security
- CORS制限、PIN認証(bcrypt)、ペイロード制限、セキュリティヘッダー実装済み
- analyze.js, locations.js, game-environment.js はPIN認証必須
- APIキーはすべてサーバーサイド(Vercel環境変数)で管理

## Implemented Features
- マルチコート機能(iPad端末コート+紙コート、最大3コート×4チーム×4人)
- シャッフルアニメーション(カジノディーラー方式)
- 管理者/メンバー権限(4-6桁PIN)
- Supabase cloud sync
- AI分析(タスク1-3完了: 新規指標、プロンプトテンプレート、レベル自動推定Lv1-5)
- 場所プロフィール(Google Places proxy, フィールド種別5択, 環境タイプ3択, OpenMeteo天候自動取得)
- お気に入り名前管理、試合単位スタッツ削除、カレンダーページネーション

## Hidden Specs
- "キムラ" は組み換え後も端末コート固定
- 開発者《𝕸𝖆𝖘𝖙𝖊𝖗》グループはlocalStorageでコンソールからのみ切替

## Collaboration Rules
- 確認事項・質問・コミットメッセージ・PRの説明文は全て日本語
- 段階的に小さく変更し、各変更後にビルド検証
- 実機確認を待ってから次の変更に進む
- 関係ない部分を書き換えない
- 出力に文字数制限はない。フルパワーで回答すること
- 迷ったら複雑さより保守性+磨き上げを優先

## Lessons from Previous Failures
1. Claude AI artifact プレビューでは正しい表示を検証できない(styles.css CSS変数が未ロード)。必ず実機Vercelデプロイ後に確認
2. 「明るくする」を目的にしない。明るいグレー背景+グレー文字はコントラスト不足の前科あり。目標は高コントラスト可読性
3. 暗い背景+白文字の非アクティブ行は好評だった方向性を維持
4. コードを書く前にモックで視覚的方向性を確認
5. iPhone Safariコピペはコードを破壊する(スマートクォート、Unicode省略記号)。GitHub Web UIでのiPhone編集は絶対禁止。git操作は必ずClaude Codeで
6. ShuffleAnimationバグは全画面ブラックアウトを引き起こす。安全弁(stall時自動クローズ)+try-catchラッパー必須

## 鉄則
- 直接依頼された変更だけを行う
- 求められていないリファクタリング・改善・フォーマット変更はしない
- 日本語テキストは直接文字で書く。Unicodeエスケープは絶対に使わない
- 太一さんの指示が太一さん自身の目的に反する場合は、そのまま実行せず改善案を提案する

## 詳細ルールの外部化

プロジェクト固有の詳細ルールは `.claude/rules/` に外出し済み。該当トピックに触れる作業時はまず該当ファイルを参照する:

- `.claude/rules/iron-rules.md` -- 絶対ルール(リファクタ禁止、Unicode escape禁止、1機能1ブランチ等)
- `.claude/rules/ui-design.md` -- UI v2 設計思想(画面別優先度、情報ブロック、視線誘導)
- `.claude/rules/git-workflow.md` -- ブランチ運用、Conventional Commits、PR ルール
- `.claude/rules/security.md` -- APIキー管理、Supabase RLS、CORS、XSS防止
- `.claude/rules/supabase-patterns.md` -- Migration 命名、テーブル設計、クエリ、型生成

また `.claude/skills/molkky-verify/` は、実装完了後の機械的検証(ビルド / セキュリティ / Iron Rule / diff)を体系化したスキル。コミット前に参照する。
