---
name: molkky-verify
description: "モルックスコアラーの実装完了後に実行する品質検証ループ。ビルド、セキュリティ、Iron Rule準拠、diff確認を体系的にチェックする。"
---

# モルックスコアラー検証ループ

## いつ使うか

- 機能実装完了後、コミット前
- リファクタリング完了後
- PRマージ前の最終確認
- `npm run build` が失敗した時の状況把握

## 検証フェーズ

### Phase 1: ビルド検証

```bash
npm run build 2>&1 | tail -20
```

ビルド失敗 → **BLOCK**。Phase 2に進まず、まず `/build-fix` を実行。

### Phase 2: セキュリティスキャン

```bash
# APIキー・シークレット露出チェック
grep -rn 'sk-ant-\|AIza\|sbp_\|supabase_service_role\|ANTHROPIC_API_KEY\|GOOGLE_PLACES' \
  --include='*.js' --include='*.jsx' src/ 2>/dev/null

# .envファイルのgit追跡チェック
git ls-files --cached | grep -E '\.env($|\.local|\.production)'
```

APIキーがソースに存在 → **BLOCK**
.envがgit追跡されている → **BLOCK**

### Phase 3: console.log チェック

```bash
grep -rn 'console\.log\|console\.debug\|console\.warn\|console\.error' \
  --include='*.js' --include='*.jsx' src/ 2>/dev/null | \
  grep -v '// keep' | head -20
```

意図的な `console.error`（エラーハンドリング用）は `// keep` コメントで許可。
それ以外の残存 → **WARNING**（除去してからマージ推奨）

### Phase 4: Iron Rule 準拠チェック

```bash
# Unicode escape チェック（日本語直書きルール）
grep -rn '\\u[0-9a-fA-F]\{4\}' --include='*.js' --include='*.jsx' src/ 2>/dev/null

# ファイルサイズチェック（800行超は要分割）
find src/ -name '*.jsx' -o -name '*.js' | while read f; do
  lines=$(wc -l < "$f")
  if [ "$lines" -gt 800 ]; then
    echo "[WARN] $f: ${lines}行（800行上限超過）"
  fi
done
```

Unicode escape 存在 → **BLOCK**
800行超ファイル → **WARNING**

### Phase 5: Diff 確認

```bash
# 変更ファイル一覧
git diff --stat

# 変更内容のサマリー
git diff HEAD --name-only

# 未要求の変更がないか確認
git diff HEAD --name-only | while read f; do
  echo "--- $f ---"
done
```

各変更ファイルについて確認：
- 仕様書で指示された変更か？
- 未要求のリファクタリングが含まれていないか？
- エラーハンドリングが欠落していないか？

## 出力フォーマット

```
検証レポート
==================

ビルド:       [PASS/FAIL]
セキュリティ:  [PASS/FAIL] (問題数: X)
console.log:  [PASS/WARN] (残存数: X)
Iron Rule:    [PASS/FAIL] (違反数: X)
Diff:         [変更ファイル数: X]

総合判定:     [READY / NOT READY] for コミット

要修正:
1. ...
2. ...
```

## 判定基準

| 結果 | 条件 |
|------|------|
| **READY** | 全Phase PASS |
| **WARNING** | console.log残存のみ。除去すればREADY |
| **NOT READY** | ビルド失敗、セキュリティ問題、またはIron Rule違反あり |

## molkky-code-review との使い分け

- **molkky-verify**: 機械的・自動的なチェック（ビルド、grep、行数）
- **molkky-code-review**: 論理的・設計的なレビュー（UI v2準拠、情報ブロック設計、エッジケース）

両方実行するのが理想。順番は verify → code-review（機械的問題を先に潰す）。
