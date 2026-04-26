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

**判定: CMI1022 Mini は内部 1Hz 固定。Phase B のレート向上効果は得られず。ただし vendor パス自体は採用。**

### 検証 A: 接続と起動ログ

vendor パス接続成功。期待ログがすべて出力された:

- `BLE接続成功`
- `vendor: mode = NORMAL (0x02)`
- `vendor: rate = 0x08`
- `vendor: compass = OFF (0x00)`
- `vendor notify 購読開始 (rate=hz_8)。データ受信中...`

vendor write は ACK 返信付きで成功し、デコーダも正常動作（wind_speed/wind_direction/battery が現実的な値で受信）。

### 検証 B: notify 頻度測定（決定的）

WebSocket クライアントで 5 秒間サンプリング:

```
received: 26 messages in 5 sec
unique timestamps: 6
broadcast rate: 5.2 Hz
notify rate: 1.2 Hz
```

`broadcast rate = 5.2Hz` は bridge.py の broadcast_task のフォールバック（0.25s = 4Hz 名目）+ notify によるイベント駆動が混在した数値。`unique timestamps = 6` を 5 秒で割った `notify rate = 1.2Hz` が **Calypso が実際に送ってくる頻度**。

`hz_8` 書き込みは受理されたものの、Calypso 内部で 1Hz にクランプされて配信されている。Tradeinn 流通データシートの「Sample rate: 1Hz」記述が正しかったことが確定。

### 採用判断: vendor パス採用

レート向上効果は得られなかったが、vendor パス自体は技術的に Phase A の ESS パスより優れているため採用:

1. Phase A の二重 ESS notify（`0x2A72` 風速 + `0x2A73` 風向）→ vendor 単一 notify（`0x2A39`）に簡素化
2. battery が vendor blob 内に含まれるため別 read 不要 → battery_task が事実上 no-op に
3. Calypso 公式アプリ (Anemotracker) と同じプロトコルパス、将来的なファーム更新でレート上限が緩和された場合も無修正で恩恵を受けられる

### 立ち上がりラグ問題への対応

Phase B のレート上限解消では立ち上がりラグ（Phase A 計測 2-3 秒）を縮められないため、別アプローチで対応:

- **UI 側の表示滑らか化**: WindMonitor 針の CSS transition で 500ms 補間 → 別タスクで実施
- **将来的な代替センサー検討**: Skywatch BL400（¥40,000、BLE 標準 ESS、サブ秒 push）または Calypso ULP 有線版（¥55,000、10Hz、Wind Filter 操作可能）への置換は別判断

## Step 3-5 を実施しない理由

当初計画の Step 3（config.json wind_rate キー追加）、Step 4（WebSocket set_rate コマンド）、Step 5（検証）のうち、Step 3-4 は CMI1022 が hz_8 を受理しない（クランプする）ため意味なし。Step 5 は本ドキュメントの「検証結果」記録で代替。
