#!/usr/bin/env python3
"""
モルックスコアラー Pi HTTP配信サーバー
dist/ フォルダの静的ファイルをHTTPで配信する。

使い方:
  python3 serve.py

環境変数:
  PORT: 配信ポート（デフォルト: 8080）
  DIST_DIR: 配信ディレクトリ（デフォルト: ./dist）
"""

import http.server
import os
import sys
from pathlib import Path

PORT = int(os.environ.get("PORT", 8080))
DIST_DIR = os.environ.get("DIST_DIR", str(Path(__file__).parent / "dist"))


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """SPA用ハンドラー: 存在しないパスは全て index.html にフォールバック"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_GET(self):
        # ファイルが存在するか確認
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith("/api"):
            # SPA フォールバック: index.html を返す
            self.path = "/index.html"
        return super().do_GET()

    def end_headers(self):
        # CORS ヘッダー（Pi から Vercel API への呼び出しに必要）
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        # ログ出力（簡易）
        sys.stdout.write(f"[serve] {args[0]}\n")
        sys.stdout.flush()


def main():
    if not os.path.isdir(DIST_DIR):
        print(f"エラー: {DIST_DIR} が見つかりません")
        print("先にPCで 'npx vite build' を実行し、dist/ をこのディレクトリにコピーしてください")
        sys.exit(1)

    index_path = os.path.join(DIST_DIR, "index.html")
    if not os.path.exists(index_path):
        print(f"エラー: {index_path} が見つかりません")
        sys.exit(1)

    server = http.server.HTTPServer(("0.0.0.0", PORT), SPAHandler)
    print(f"モルックスコアラー配信中: http://0.0.0.0:{PORT}")
    print(f"配信ディレクトリ: {DIST_DIR}")
    print("Ctrl+C で停止")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n停止しました")
        server.server_close()


if __name__ == "__main__":
    main()
