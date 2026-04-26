# Phase B1: calypso-anemometer ライブラリ動作確認手順

## 目的
maritime-labs/calypso-anemometer ライブラリが Pi Zero 2 W で動作し、Calypso CMI1022 から 4Hz でデータ受信できることを確認する。bridge.py には一切触れず、CLI のみで検証する。

## 前提
- 既存 Phase A 版 bridge.py が正常稼働していること
- Pi の venv パス: `/home/pi/calypso-venv/`
- Calypso CMI1022 が電源ON、Pi の近くに設置されていること

## 検証手順

### Step 1: ライブラリのインストール

```bash
ssh pi@calypso-bridge.local
cd ~/calypso-bridge
source /home/pi/calypso-venv/bin/activate
pip install --upgrade calypso-anemometer
```

期待結果:
- インストール成功
- 依存パッケージ（bleak など）の衝突なし
- `Successfully installed calypso-anemometer-0.6.0` 等の表示

### Step 2: 既存サービスの一時停止

CLI 検証中は BLE 接続が競合するため、既存サービスを停止する。

```bash
sudo systemctl stop calypso-bridge
sudo systemctl status calypso-bridge --no-pager
```

期待結果:
- `Active: inactive (dead)` の表示

### Step 3: BLE デバイス検出確認

```bash
calypso-anemometer info
```

期待結果:
- Calypso CMI1022 (`ULTRASONIC`, `FE:B7:AC:1E:7A:B9`) が検出される
- デバイス情報（ファームウェアリビジョン等）が表示される

#### NG だった場合の判断
- デバイスが検出されない → CMI1022 互換性に問題ありの可能性
- 認識はするが情報取得失敗 → vendor UUID プロトコルが CMI1022 で完全動作しない可能性
- どちらの場合も Phase B 戦略の再検討が必要 → Step 7 へ進み報告

### Step 4: 単発読み取り

```bash
calypso-anemometer read --compass=on
```

期待結果:
- 1回分の読み取りデータ（wind_speed, wind_direction, roll, pitch, heading）が表示される
- バッテリー残量も表示される

### Step 5: 4Hz 連続購読（メイン検証）

```bash
calypso-anemometer read --subscribe --rate=hz_4 --compass=on
```

期待結果:
- データが連続的に流れる
- 1秒間に約4行のデータ更新が観察される
- Ctrl+C で中断可能

#### 観察ポイント（重要）
1. **更新頻度**: 1秒に約4回データが流れることを目視確認
2. **風速計への息吹きかけ**: 風速計に強く息を吹きかけて、wind_speed の値が反応するまでの時間を体感計測
3. **反応速度の比較**: Phase A 実機検証時の体感（息→反応 2〜3秒）と比べて明確に速いか

このステップで30秒〜1分程度観察する。

### Step 6: 8Hz 連続購読（オプション）

時間に余裕があれば 8Hz も試す。

```bash
calypso-anemometer read --subscribe --rate=hz_8 --compass=on
```

期待結果:
- 1秒に約8回データ更新
- 4Hz と比べて顕著に追従が速いかを主観評価

### Step 7: 既存サービスの再開

CLI 検証が終わったら、必ずサービスを再開する。

```bash
deactivate
sudo systemctl start calypso-bridge
sudo systemctl status calypso-bridge --no-pager
sudo journalctl -u calypso-bridge --since "30 seconds ago" --no-pager | grep -E "起動|プロトコル|broadcast"
```

期待結果:
- `Active: active (running)` の表示
- ログに以下の3行が出ること:
  - `=== Calypso CMI1022 BLE Bridge 起動 ===`
  - `プロトコル: ESS (Environmental Sensing Service)`
  - `broadcast: イベント駆動 + フォールバック 0.25秒`

## 結果報告テンプレート

検証完了後、以下のテンプレートを埋めて報告すること。

```
## Phase B1 検証結果

### Step 1: pip install
- 結果: OK / NG
- インストールされたバージョン: X.X.X
- 依存パッケージ衝突: なし / あり（詳細）

### Step 2: サービス停止
- 結果: OK / NG

### Step 3: calypso-anemometer info
- 結果: OK / NG
- 検出されたデバイス: ULTRASONIC FE:B7:AC:1E:7A:B9
- ファームウェアリビジョン:
- ハードウェアリビジョン:

### Step 4: 単発読み取り
- 結果: OK / NG
- wind_speed の例: X.XX m/s
- wind_direction の例: XXX°
- compass heading の例: XXX°

### Step 5: 4Hz 連続購読
- 更新頻度: 1秒あたり約N回（実測）
- 息→反応のラグ: 体感X秒
- Phase A との比較: 明確に速い / 同程度 / 不明
- 安定性: 数十秒間ドロップなし / ドロップあり（頻度）

### Step 6: 8Hz 連続購読（実施した場合のみ）
- 更新頻度: 1秒あたり約N回（実測）
- 息→反応のラグ: 体感X秒
- 4Hz との比較: 明確に速い / 同程度 / 不明
- 安定性: 数十秒間ドロップなし / ドロップあり（頻度）

### Step 7: サービス再開
- 結果: OK / NG
- 起動ログ3行確認: OK / NG

### 総合判定
- Phase B2 に進む価値: 大いにあり / あり / 限定的 / なし
- 理由:

### 想定外事象
- なし / あれば箇条書き
```

## トラブル時のリカバリ

### pip install で失敗した場合
```bash
# venv に残骸があれば除去
pip uninstall calypso-anemometer
# 既存システムへの影響なし、サービスは Phase A のまま動作
```

### CLI 実行中に BLE が応答しなくなった場合
```bash
# Bluetooth スタック再起動
sudo hciconfig hci0 down
sudo hciconfig hci0 up
# それでもダメなら Pi 再起動
sudo reboot
```

### サービス再開ができない場合
```bash
sudo journalctl -u calypso-bridge -n 50 --no-pager
# エラー内容を確認、必要なら太一さんに報告
```
