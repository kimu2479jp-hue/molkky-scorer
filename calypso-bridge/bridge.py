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

# QMC5883Lセンサー（I2C）
compass_sensor = None
compass_offset_x = 0
compass_offset_y = 0
compass_valid = False

# グローバル: 最新の風速データ
latest_wind_data = {
    "wind_speed": 0.0,
    "wind_direction": 0,
    "compass_heading": 0,
    "compass_valid": False,
    "battery": None,
    "timestamp": None,
    "connected": False,
}

ws_clients = set()
ble_client_ref = None


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
    try:
        x, y, z = compass_sensor.get_magnet()
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


def on_wind_dir(sender, data):
    direction = int.from_bytes(data, "little") / 100.0
    latest_wind_data["wind_direction"] = round(direction, 1)
    logging.debug(f"Wind Dir: {direction:.1f}")


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


async def ws_handler(websocket):
    ws_clients.add(websocket)
    peer = websocket.remote_address
    logging.info(f"WebSocketクライアント接続: {peer}")
    try:
        await websocket.send(json.dumps(latest_wind_data))
        async for _ in websocket:
            pass
    except websockets.ConnectionClosed:
        pass
    finally:
        ws_clients.discard(websocket)
        logging.info(f"WebSocketクライアント切断: {peer}")


async def ws_server_task(config):
    port = config.get("ws_port", DEFAULT_WS_PORT)
    async with websockets.serve(ws_handler, "0.0.0.0", port, origins=None):
        logging.info(f"WebSocketサーバー起動: ws://0.0.0.0:{port}")
        await asyncio.Future()


async def main():
    config = load_config()

    log_level = config.get("log_level", DEFAULT_LOG_LEVEL)
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    )

    logging.info("=== Calypso CMI1022 BLE Bridge 起動 ===")
    logging.info(f"プロトコル: ESS (Environmental Sensing Service)")

    init_compass(config)

    await asyncio.gather(
        ble_task(config),
        ws_server_task(config),
        battery_task(),
    )


if __name__ == "__main__":
    asyncio.run(main())
