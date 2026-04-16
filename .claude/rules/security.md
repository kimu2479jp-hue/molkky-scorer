# セキュリティルール

## 秘密情報の保護

以下をソースコードに含めない：

| 種別 | パターン | 保存場所 |
|------|---------|---------|
| Anthropic APIキー | `sk-ant-*` | Vercel環境変数 `ANTHROPIC_API_KEY` |
| Google Places APIキー | `AIza*` | Vercel環境変数 `GOOGLE_PLACES_API_KEY` |
| Supabase Service Role Key | `sbp_*` | Vercel環境変数のみ（フロントエンドで使用禁止） |
| Supabase URL | — | `.env` + Vercel環境変数 |
| Supabase Anon Key | — | `.env` + Vercel環境変数（公開OK） |

## Supabase セキュリティ

- 全テーブルにRLSポリシーを設定する。RLSなしのテーブル操作はCRITICAL違反。
- フロントエンドからは `anon` キーのみ使用。`service_role` キーはサーバーサイド（Vercel API routes）のみ。
- ユーザー入力はサーバーサイドでバリデーション。フロントエンドのバリデーションは補助的。

## API エンドポイントのセキュリティ

- `/api/analyze` — 認証必須（PINベース、bcryptハッシュ、サーバーサイドレート制限済み）
- `/api/places` — サーバープロキシ経由（Google Places APIキーをフロントエンドに露出させない）
- CORSは本番ドメインのみ許可（Vite v8セキュリティ強化済み）

## フロントエンドのセキュリティ

- ユーザー入力をHTMLとしてレンダリングしない（XSS防止）
- エラーメッセージに内部情報を含めない（汎用化済み）
- `dangerouslySetInnerHTML` の使用禁止
