# Pi HTTP配信サーバー

## 概要
モルックスコアラーのビルド済みファイルをRaspberry PiからHTTPで配信するサーバー。
風速計連携時に、HTTPS→ws://の混合コンテンツブロックを回避するために使用。

## セットアップ手順

### 1. PCでPi配信用ビルドを作成

```bash
# プロジェクトルートで実行
VITE_API_BASE=https://molkky-scorer.vercel.app npx vite build
```

Windows PowerShellの場合:
```powershell
$env:VITE_API_BASE="https://molkky-scorer.vercel.app"; npx vite build
```

### 2. Piにファイルをコピー

```bash
# PCで実行（PiのIPは環境に合わせて変更）
scp -r dist/ pi@<Pi-IP>:~/molkky-server/dist/
scp pi-server/serve.py pi@<Pi-IP>:~/molkky-server/serve.py
```

### 3. Pi上でsystemdサービスを登録

```bash
sudo tee /etc/systemd/system/molkky-server.service << 'EOF'
[Unit]
Description=Molkky Scorer HTTP Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/molkky-server
ExecStart=/usr/bin/python3 /home/pi/molkky-server/serve.py
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=DIST_DIR=/home/pi/molkky-server/dist

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable molkky-server
sudo systemctl start molkky-server
```

### 4. 動作確認

iPadのSafariで `http://<Pi-IP>:8080` を開く。

## 更新手順

アプリのコードを更新した場合:

```bash
# PCで再ビルド
VITE_API_BASE=https://molkky-scorer.vercel.app npx vite build

# Piにコピー
scp -r dist/ pi@<Pi-IP>:~/molkky-server/dist/

# Piでサーバー再起動
ssh pi@<Pi-IP> "sudo systemctl restart molkky-server"
```

## 運用

- **風速計を使う日**: iPadで `http://<Pi-IP>:8080` を開く
- **風速計を使わない日**: 従来通り `https://molkky-scorer.vercel.app` を使う
- Pi起動時にbridge.py（風速計）と serve.py（HTTP配信）が両方自動起動する
