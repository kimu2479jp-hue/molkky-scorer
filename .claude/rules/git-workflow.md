# Git ワークフロー

## ブランチ運用

- `main` — 本番リリースブランチ
- `feature/*` — 機能ブランチ（1機能1ブランチ厳守）
- ブランチ名は英語、ハイフン区切り（例: `feature/wind-monitor-phase3`）

## コミットスタイル

Conventional Commits形式：

```
feat: 新機能
fix: バグ修正
refactor: リファクタリング（機能変更なし）
style: フォーマット変更（コード動作に影響なし）
docs: ドキュメント更新
chore: ビルド・設定変更
```

- コミットメッセージは日本語OK
- 例: `feat: 風速モニター画面の骨組み追加`
- 例: `fix: GameScreenのスコア表示がNaNになる問題を修正`

## PRルール

- PRは手動で作成する（Claude Codeは作成しない）
- PR作成前に `/verify` を実行して品質チェック
- PRの説明には変更内容と影響範囲を記載

## push前の確認事項

1. `npm run build` が通ること
2. console.logが残っていないこと
3. 仕様書に記載された変更のみであること
4. CLAUDE.mdの更新が必要な場合は更新済みであること
