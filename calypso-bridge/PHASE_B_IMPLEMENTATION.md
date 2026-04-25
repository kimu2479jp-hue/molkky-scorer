# Phase B 実装記録: vendor パス + 8Hz 化

## 背景

Phase A（ESS 1Hz パス、bridge.py の broadcast_task をイベント駆動化）では、立ち上がりラグ 2-3 秒の解消には不十分だった。原因は以下の組み合わせ:

- ESS (Environmental Sensing Service) パスは Calypso ファームウェア仕様で 1Hz 固定
- Calypso 内部で平滑化処理（移動平均または非線形フィルタ）が存在する蓋然性が高い

Phase B では Calypso vendor characteristic 経由で 4Hz/8Hz の高速 notify に切り替え、立ち上がりラグの短縮を狙う。

## プロトコル仕様

すべて maritime-labs/calypso-anemometer v0.6.0 のソースコード（model.py / core.py）から確認した一次仕様。

### BLE Characteristic UUID

| 用途 | UUID | 操作 |
|---|---|---|
| データ読み取り (vendor) | `00002a39-0000-1000-8000-00805f9b34fb` | notify (10 byte blob) |
| Mode 設定 | `0000a001-0000-1000-8000-00805f9b34fb` | write 1 byte (response=True) |
| Rate 設定 | `0000a002-0000-1000-8000-00805f9b34fb` | write 1 byte (response=True) |
| Compass 設定 | `0000a003-0000-1000-8000-00805f9b34fb` | write 1 byte (response=True) |

### 設定値

- Mode: `0x00`=SLEEP, `0x01`=LOW_POWER, `0x02`=NORMAL（Phase B 使用値）
- Rate: `0x01`=HZ_1, `0x04`=HZ_4, `0x08`=HZ_8（Phase B デフォルト値）
- Compass: `0x00`=OFF（Phase B 使用値、QMC5883L 利用のため Calypso 内蔵 9DOF は OFF）

### 揮発性

すべての設定は BLE 切断で揮発し、再接続時に rate=HZ_4 にリセットされる。再接続ループ内で毎回書き込む必要がある。

### 10 byte payload デコード

struct format: `<HHBBBBH` (little-endian)

| バイト | 内容 | 変換式 | 単位 |
|---|---|---|---|
| 0-1 | wind_speed_raw | / 100.0 | m/s |
| 2-3 | wind_direction | そのまま | 度 (0-359) |
| 4 | battery_raw | × 10 | % (0-100) |
| 5 | temperature_raw | - 100 | 摂氏 |
| 6 | roll_raw | - 90 | 度 (-90〜+90) |
| 7 | pitch_raw | - 90 | 度 |
| 8-9 | heading_raw | 360 - 値 | 度 (0-359) |

注: roll/pitch/heading は Calypso 内蔵 9DOF 由来。Phase B では Calypso compass を OFF にするため roll=-90, pitch=-90, heading=360 が固定で返る想定。bridge.py 側ではこれらの値は使用せず、QMC5883L 由来の compass_heading を使い続ける。

## 実装ステップ

- Step 0: 準備（依存削除、本ドキュメント作成）✅
- Step 1: UUID 定数とデコーダ追加
- Step 2: ble_task を vendor パスに切替
- Step 3: config.json に wind_rate キー追加
- Step 4: WebSocket コマンド set_rate 受付
- Step 5: 検証 + ドキュメント更新

## 検証結果

（Step 5 で記入）

### 立ち上がりラグ測定

| 条件 | Phase A | Phase B (4Hz) | Phase B (8Hz) |
|---|---|---|---|
| ON 立ち上がり | 2-3 秒 | TBD | TBD |
| OFF 立ち下がり | 1 秒 | TBD | TBD |

### CMI1022 の hz_8 受理判定

ログから notify 間隔を測定し、以下のいずれかを判定:
- 受理: 約 125ms 間隔で notify が来る
- クランプ: hz_8 書き込み成功でも 250ms (4Hz) または 1000ms (1Hz) 間隔のまま

### BLE 安定性

8Hz で N 分間切断なく動作するかを記録。
