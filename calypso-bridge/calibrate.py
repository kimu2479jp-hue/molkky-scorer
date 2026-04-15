#!/usr/bin/env python3
"""
QMC5883L キャリブレーションスクリプト
初回セットアップ時に1回実行。Calypso+Pi+QMC5883Lを全て設置した状態で
雲台をゆっくり360度回転させる。
"""
import time
import json
import py_qmc5883l

sensor = py_qmc5883l.QMC5883L()

print("=== QMC5883L キャリブレーション ===")
print("全てのデバイスを設置した最終状態で実行してください。")
print("雲台のパンロックを緩めて、ゆっくり1周（360°）回してください。")
print("準備ができたらEnterを押してスタート...")
input()
print("回転開始！ゆっくり360°回してください（約20-30秒）...")
print("回転が終わったらEnterを押して停止。")

x_min, x_max = float('inf'), float('-inf')
y_min, y_max = float('inf'), float('-inf')
samples = 0

try:
    while True:
        result = sensor.get_magnet_raw()
        x, y = result[0], result[1]
        x_min = min(x_min, x)
        x_max = max(x_max, x)
        y_min = min(y_min, y)
        y_max = max(y_max, y)
        samples += 1
        if samples % 10 == 0:
            print(f"  サンプル数: {samples}, X: [{x_min:.0f}, {x_max:.0f}], Y: [{y_min:.0f}, {y_max:.0f}]")
        time.sleep(0.05)  # 20Hz
except KeyboardInterrupt:
    pass

offset_x = (x_max + x_min) / 2
offset_y = (y_max + y_min) / 2

print(f"\n=== キャリブレーション完了 ===")
print(f"サンプル数: {samples}")
print(f"Offset X: {offset_x:.1f}")
print(f"Offset Y: {offset_y:.1f}")

# config.jsonに保存
try:
    with open("config.json") as f:
        config = json.load(f)
except FileNotFoundError:
    config = {}

config["compass_offset_x"] = offset_x
config["compass_offset_y"] = offset_y

with open("config.json", "w") as f:
    json.dump(config, f, indent=2)

print("config.json に保存しました。")
