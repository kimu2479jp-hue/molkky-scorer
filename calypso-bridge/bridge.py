#!/usr/bin/env python3
"""
Calypso CMI1022 BLE + QMC5883L → WebSocket ブリッジ
Raspberry Pi Zero 2 W 上で動作
ESS (Environmental Sensing Service) プロトコル対応版
"""
import asyncio
import json
import logging
import math
import os
import tempfile
import time
from datetime import datetime, timezone

from bleak import BleakClient, BleakScanner
import websockets

# ESS標準UUIDs
WIND_SPEED_UUID = "00002a72-0000-1000-8000-00805f9b34fb"
WIND_DIR_UUID = "00002a73-0000-1000-8000-00805f9b34fb"
BATTERY_UUID = "00002a19-0000-1000-8000-00805f9b34fb"

# デフォルト設定
DEFAULT_WS_PORT = 8765
DEFAULT_LOG_LEVEL = "INFO"
BATTERY_READ_INTERVAL = 300  # 5分間隔

# ブロードキャスト / キャリブレーション関連
# Phase A: イベント駆動 + フォールバック定期送信。
# BLE notify 受信時に即座にブロードキャストし、
# 何も来ない場合でも BROADCAST_FALLBACK_INTERVAL 秒ごとに送る。
BROADCAST_FALLBACK_INTERVAL = 0.25  # 4Hz でフォールバック送信
CALIBRATE_TIMEOUT_SEC = 60          # キャリブレーション最大時間（秒）
CALIBRATE_COVERAGE_THRESHOLD = 500  # x/y range の目標値（これに到達で coverage=1.0）
CALIBRATE_SAMPLE_INTERVAL = 0.1     # 10Hz で QMC5883L を読む
CALIBRATE_PROGRESS_INTERVAL = 0.5   # 0.5秒毎にクライアントへ進捗送信

# QMC5883Lセンサー（I2C）
compass_sensor = None
compass_offset_x = 0
compass_offset_y = 0
compass_valid = False

# グローバル: 最新の風速データ
latest_wind_data = {
    "type": "wind_data",          # メッセージ識別子（固定値）
    "wind_speed": 0.0,
    "wind_direction": 0,
    "compass_heading": 0,
    "compass_valid": False,
    "battery": None,
    "throw_direction": None,      # test_connection受信時に現在のcompass_headingで更新
    "timestamp": None,
    "connected": False,
}

# Phase A: broadcast トリガー用の asyncio.Event。
# BLE notify 受信時に set() し、broadcast_task 側で wait() する。
# 注: asyncio.Event は event loop 起動後に生成する必要があるため、
# モジュールレベルでは None で初期化し、main() 内で実体化する。
wind_data_updated = None

ws_clients = set()
ble_client_ref = None

# キャリブレーション実行中の state
calibration_state = {
    "active": False,
    "requester_ws": None,
    "x_min": float("inf"),
    "x_max": float("-inf"),
    "y_min": float("inf"),
    "y_max": float("-inf"),
    "start_time": 0.0,
    "task": None,
}


def load_config():
    try:
        with open("config.json") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def init_compass(config):
    global compass_sensor, compass_offset_x, compass_offset_y, compass_valid
    try:
        import py_qmc5883l
        compass_sensor = py_qmc5883l.QMC5883L()
        compass_offset_x = config.get("compass_offset_x", 0)
        compass_offset_y = config.get("compass_offset_y", 0)
        compass_valid = True
        logging.info(f"コンパス初期化成功 (offset: x={compass_offset_x}, y={compass_offset_y})")
    except Exception as e:
        compass_valid = False
        logging.warning(f"コンパス初期化失敗: {e}")


def read_compass():
    global compass_valid
    if compass_sensor is None:
        return 0
    # キャリブレーション中は I2C 競合回避のため直近値を返す
    if calibration_state["active"]:
        return latest_wind_data.get("compass_heading", 0)
    try:
        result = compass_sensor.get_magnet()
        x, y = result[0], result[1]
        x -= compass_offset_x
        y -= compass_offset_y
        heading = math.degrees(math.atan2(y, x))
        if heading < 0:
            heading += 360
        compass_valid = True
        return round(heading, 1)
    except Exception as e:
        compass_valid = False
        logging.warning(f"コンパス読み取りエラー: {e}")
        return 0


def on_wind_speed(sender, data):
    speed = int.from_bytes(data, "little") / 100.0
    latest_wind_data["wind_speed"] = round(speed, 2)
    latest_wind_data["timestamp"] = datetime.now(timezone.utc).isoformat()
    latest_wind_data["connected"] = True
    latest_wind_data["compass_heading"] = read_compass()
    latest_wind_data["compass_valid"] = compass_valid
    logging.debug(f"Wind Speed: {speed:.2f} m/s")
    # Phase A: BLE notify 受信時に即座に broadcast をトリガー
    if wind_data_updated is not None:
        wind_data_updated.set()


def on_wind_dir(sender, data):
    direction = int.from_bytes(data, "little") / 100.0
    latest_wind_data["wind_direction"] = round(direction, 1)
    logging.debug(f"Wind Dir: {direction:.1f}")
    # Phase A: BLE notify 受信時に即座に broadcast をトリガー
    if wind_data_updated is not None:
        wind_data_updated.set()


async def ble_task(config):
    global ble_client_ref
    ble_address = config.get("ble_address")

    while True:
        try:
            logging.info("BLEデバイス検索中...")
            if ble_address:
                device = await BleakScanner.find_device_by_address(ble_address, timeout=10)
            else:
                device = await BleakScanner.find_device_by_name("ULTRASONIC", timeout=10)

            if device is None:
                logging.warning("デバイス未検出。5秒後にリトライ...")
                await asyncio.sleep(5)
                continue

            logging.info(f"デバイス発見: {device.name} ({device.address})")

            async with BleakClient(device, timeout=20) as client:
                ble_client_ref = client
                logging.info("BLE接続成功")

                # バッテリー初回読み取り
                try:
                    battery_data = await client.read_gatt_char(BATTERY_UUID)
                    latest_wind_data["battery"] = battery_data[0]
                    logging.info(f"バッテリー: {battery_data[0]}%")
                except Exception as e:
                    logging.warning(f"バッテリー読み取り失敗: {e}")

                # ESS notify購読
                await client.start_notify(WIND_SPEED_UUID, on_wind_speed)
                await client.start_notify(WIND_DIR_UUID, on_wind_dir)
                logging.info("ESS notify購読開始。データ受信中...")

                while client.is_connected:
                    await asyncio.sleep(1)

                latest_wind_data["connected"] = False
                ble_client_ref = None

        except Exception as e:
            logging.error(f"BLEエラー: {e}")
            latest_wind_data["connected"] = False
            ble_client_ref = None
            await asyncio.sleep(5)


async def battery_task():
    while True:
        await asyncio.sleep(BATTERY_READ_INTERVAL)
        if ble_client_ref and ble_client_ref.is_connected:
            try:
                battery_data = await ble_client_ref.read_gatt_char(BATTERY_UUID)
                latest_wind_data["battery"] = battery_data[0]
                logging.debug(f"バッテリー更新: {battery_data[0]}%")
            except Exception as e:
                logging.debug(f"バッテリー読み取り失敗: {e}")


def save_compass_offsets(offset_x, offset_y):
    """config.json に compass_offset_x/y を原子的に保存（SDカード電源断対策）"""
    try:
        with open("config.json") as f:
            config = json.load(f)
    except FileNotFoundError:
        config = {}
    config["compass_offset_x"] = float(offset_x)
    config["compass_offset_y"] = float(offset_y)
    tmp_fd, tmp_path = tempfile.mkstemp(dir=".", prefix="config.", suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w") as f:
            json.dump(config, f, indent=2)
        os.replace(tmp_path, "config.json")
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
        raise


async def _safe_send(ws, payload):
    """WebSocket send の例外をキャッチして bool を返すヘルパー"""
    try:
        await ws.send(json.dumps(payload))
        return True
    except (websockets.ConnectionClosed,
            websockets.ConnectionClosedOK,
            websockets.ConnectionClosedError):
        return False
    except Exception as e:
        logging.warning(f"WebSocket送信エラー: {e}")
        return False


async def handle_test_connection(ws):
    """test_connection コマンド受信時: throw_direction を更新してレスポンス送信"""
    # BLE接続 + コンパス有効時のみ throw_direction を現在値で更新
    # 未接続時は過去値を維持する
    ble_ok = bool(latest_wind_data.get("connected"))
    compass_ok = bool(latest_wind_data.get("compass_valid"))
    if ble_ok and compass_ok:
        latest_wind_data["throw_direction"] = latest_wind_data.get("compass_heading")
    status = "ok" if ble_ok else "no_ble"
    response = {
        "type": "test_result",
        "status": status,
        "wind_speed": latest_wind_data.get("wind_speed", 0.0),
        "wind_direction": latest_wind_data.get("wind_direction", 0),
        "compass_heading": latest_wind_data.get("compass_heading", 0),
        "compass_valid": latest_wind_data.get("compass_valid", False),
        "battery": latest_wind_data.get("battery"),
        "throw_direction": latest_wind_data.get("throw_direction"),
    }
    await _safe_send(ws, response)
    logging.info(
        f"test_connection 応答: status={status}, throw_direction={response['throw_direction']}"
    )


async def calibration_loop(ws):
    """QMC5883L キャリブレーション実行ループ。進捗送信と完了処理を担当"""
    global compass_offset_x, compass_offset_y

    last_progress_sent = 0.0
    calibration_state["x_min"] = float("inf")
    calibration_state["x_max"] = float("-inf")
    calibration_state["y_min"] = float("inf")
    calibration_state["y_max"] = float("-inf")
    calibration_state["start_time"] = time.time()

    try:
        while calibration_state["active"]:
            # タイムアウト判定
            elapsed = time.time() - calibration_state["start_time"]
            if elapsed > CALIBRATE_TIMEOUT_SEC:
                await _safe_send(ws, {"type": "calibrate_error", "reason": "timeout"})
                logging.info("キャリブレーションタイムアウト")
                return

            # サンプル収集（calibrate.py と一貫して get_magnet_raw を使用）
            try:
                result = compass_sensor.get_magnet_raw()
                x, y = result[0], result[1]
            except Exception as e:
                logging.warning(f"キャリブレーション中の読み取りエラー: {e}")
                await asyncio.sleep(CALIBRATE_SAMPLE_INTERVAL)
                continue

            calibration_state["x_min"] = min(calibration_state["x_min"], x)
            calibration_state["x_max"] = max(calibration_state["x_max"], x)
            calibration_state["y_min"] = min(calibration_state["y_min"], y)
            calibration_state["y_max"] = max(calibration_state["y_max"], y)

            x_range = calibration_state["x_max"] - calibration_state["x_min"]
            y_range = calibration_state["y_max"] - calibration_state["y_min"]
            coverage = min(x_range, y_range) / CALIBRATE_COVERAGE_THRESHOLD
            coverage = min(max(coverage, 0.0), 1.0)

            # 進捗送信（0.5秒毎）
            now = time.time()
            if now - last_progress_sent >= CALIBRATE_PROGRESS_INTERVAL:
                sent_ok = await _safe_send(
                    ws, {"type": "calibrate_progress", "coverage": round(coverage, 2)}
                )
                if not sent_ok:
                    logging.info("キャリブレーション要求元クライアント切断")
                    return
                last_progress_sent = now

            # 完了判定
            if coverage >= 1.0:
                offset_x = (calibration_state["x_max"] + calibration_state["x_min"]) / 2
                offset_y = (calibration_state["y_max"] + calibration_state["y_min"]) / 2
                try:
                    save_compass_offsets(offset_x, offset_y)
                except Exception:
                    logging.exception("config.json保存失敗")
                    await _safe_send(
                        ws, {"type": "calibrate_error", "reason": "config_write_failed"}
                    )
                    return
                # Runtime globals を更新
                compass_offset_x = offset_x
                compass_offset_y = offset_y
                logging.info(
                    f"キャリブレーション完了 (offset: x={offset_x:.1f}, y={offset_y:.1f})"
                )
                await _safe_send(
                    ws,
                    {
                        "type": "calibrate_done",
                        "offset_x": round(offset_x, 1),
                        "offset_y": round(offset_y, 1),
                    },
                )
                return

            await asyncio.sleep(CALIBRATE_SAMPLE_INTERVAL)
    except asyncio.CancelledError:
        logging.info("キャリブレーションループキャンセル")
        raise
    except Exception:
        logging.exception("キャリブレーションループ例外")
        await _safe_send(ws, {"type": "calibrate_error", "reason": "exception"})
    finally:
        calibration_state["active"] = False
        calibration_state["requester_ws"] = None
        calibration_state["task"] = None


async def ws_handler(websocket):
    ws_clients.add(websocket)
    peer = websocket.remote_address
    logging.info(f"WebSocketクライアント接続: {peer}")
    try:
        # 初回スナップショット送信（既存互換のため継続）
        await _safe_send(websocket, latest_wind_data)

        # コマンドループ
        async for raw in websocket:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if not isinstance(msg, dict):
                continue
            command = msg.get("command")
            if command == "test_connection":
                await handle_test_connection(websocket)
            elif command == "calibrate_start":
                if calibration_state["active"]:
                    await _safe_send(
                        websocket,
                        {"type": "calibrate_error", "reason": "already_running"},
                    )
                elif compass_sensor is None:
                    await _safe_send(
                        websocket, {"type": "calibrate_error", "reason": "no_compass"}
                    )
                else:
                    calibration_state["active"] = True
                    calibration_state["requester_ws"] = websocket
                    task = asyncio.create_task(calibration_loop(websocket))
                    # 未捕捉例外の握りつぶし防止
                    task.add_done_callback(
                        lambda t: t.exception() if not t.cancelled() else None
                    )
                    calibration_state["task"] = task
                    logging.info(f"キャリブレーション開始 (requester={peer})")
    except websockets.ConnectionClosed:
        pass
    finally:
        ws_clients.discard(websocket)
        # 切断クライアントがキャリブレーション要求元の場合キャンセル
        if calibration_state["requester_ws"] is websocket:
            calibration_state["active"] = False
            if (
                calibration_state["task"] is not None
                and not calibration_state["task"].done()
            ):
                calibration_state["task"].cancel()
        logging.info(f"WebSocketクライアント切断: {peer}")


async def broadcast_task():
    """イベント駆動 + フォールバック定期送信で latest_wind_data をブロードキャスト

    Phase A: BLE notify 受信時に wind_data_updated.set() されると即座に送信。
    notify が来ない場合でも BROADCAST_FALLBACK_INTERVAL 秒ごとに送る
    （クライアントの初期表示や接続維持のため）。
    """
    while True:
        # イベント待機（タイムアウトでフォールバック送信）
        try:
            await asyncio.wait_for(
                wind_data_updated.wait(),
                timeout=BROADCAST_FALLBACK_INTERVAL,
            )
            wind_data_updated.clear()
        except asyncio.TimeoutError:
            pass  # フォールバック: データ未更新でも送信

        if not ws_clients:
            continue

        # Phase A: 送信時刻を payload に含めて、後続の遅延測定を可能にする
        latest_wind_data["bridge_send_ts"] = time.time()

        payload = json.dumps(latest_wind_data)
        dead = []
        # list() でスナップショット（イテレーション中の変更回避）
        for ws in list(ws_clients):
            # キャリブレーション中の要求元クライアントには送らない（混線防止）
            if (
                calibration_state["active"]
                and ws is calibration_state["requester_ws"]
            ):
                continue
            try:
                await ws.send(payload)
            except (
                websockets.ConnectionClosed,
                websockets.ConnectionClosedOK,
                websockets.ConnectionClosedError,
            ):
                dead.append(ws)
            except Exception as e:
                logging.debug(f"broadcast send例外: {e}")
                dead.append(ws)
        for ws in dead:
            ws_clients.discard(ws)


async def ws_server_task(config):
    port = config.get("ws_port", DEFAULT_WS_PORT)
    async with websockets.serve(ws_handler, "0.0.0.0", port, origins=None):
        logging.info(f"WebSocketサーバー起動: ws://0.0.0.0:{port}")
        await asyncio.Future()


async def main():
    global wind_data_updated

    config = load_config()

    log_level = config.get("log_level", DEFAULT_LOG_LEVEL)
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )

    logging.info("=== Calypso CMI1022 BLE Bridge 起動 ===")
    logging.info(f"プロトコル: ESS (Environmental Sensing Service)")
    logging.info(f"broadcast: イベント駆動 + フォールバック {BROADCAST_FALLBACK_INTERVAL}秒")

    # Phase A: asyncio.Event は event loop 起動後（main 内）で生成する
    wind_data_updated = asyncio.Event()

    init_compass(config)

    await asyncio.gather(
        ble_task(config),
        ws_server_task(config),
        battery_task(),
        broadcast_task(),
    )


if __name__ == "__main__":
    asyncio.run(main())
