# Supabase パターン

## Migrationルール

- ファイル名: `YYYYMMDDHHMMSS_descriptive_name.sql`
- 各migrationは1つの論理的変更のみ
- `IF NOT EXISTS` / `IF EXISTS` を使用して冪等性を確保
- RLSポリシーはテーブル作成と同じmigrationに含める

## テーブル設計パターン

- `id` は `uuid` + `gen_random_uuid()` をデフォルト
- `created_at` は `timestamptz` + `now()` をデフォルト
- sync-code-scoped な共有データは `sync_code` カラムでフィルタリング
- 外部キーには `ON DELETE CASCADE` を明示的に指定

## クエリパターン

- `SELECT *` は禁止 — 必要なカラムのみ指定
- ユーザー向けクエリには `LIMIT` を必ず付ける
- N+1クエリを避ける — JOINまたはバッチ取得を使用
- Supabase クライアントの `.select()` でカラムを明示指定

## 型生成

- スキーマ変更後は `supabase gen types typescript` を実行
- 生成された型ファイルはgit管理する
