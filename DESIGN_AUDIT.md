# Design Audit Report - モルックスコアラー

生成日: 2026-04-16
走査対象ファイル数: 20
ブランチ: chore/design-audit

---

## サマリー

- 走査ファイル数: 20
- インラインstyle使用ファイル数: 10（全20ファイル中 50%）
- CSSファイル数: 1
- ユニーク色数: 144
- ユニークフォントサイズ数: 33
- ユニーク余白値数: 31
- ユニーク角丸値数: 24
- ユニーク影値数: 15

---

## 1. 色 (Colors)

### 1.1 頻度順リスト

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `#ffffff` | 209 | src/components/CalibrationModal.jsx:59, src/components/CalibrationModal.jsx:149, src/components/CalibrationModal.jsx:190, src/components/CalibrationModal.jsx:254, src/components/CalibrationModal.jsx:291 |
| `#000000` | 53 | src/components/StatsModal.jsx:456, src/components/StatsModal.jsx:741, src/components/CalibrationModal.jsx:133, src/components/CalibrationModal.jsx:151, src/components/common.jsx:44 |
| `#2b7de9` | 35 | src/components/common.jsx:63, src/components/common.jsx:228, src/components/common.jsx:247, src/components/common.jsx:251, src/components/common.jsx:268 |
| `#e74c3c` | 32 | src/components/common.jsx:37, src/components/common.jsx:63, src/components/common.jsx:293, src/components/GameScreen.jsx:84, src/components/GameScreen.jsx:192 |
| `#22b566` | 27 | src/components/CalibrationModal.jsx:279, src/components/CalibrationModal.jsx:284, src/components/CalibrationModal.jsx:304, src/components/common.jsx:63, src/components/common.jsx:228 |
| `#6b7280` | 26 | src/components/common.jsx:643, src/components/common.jsx:693, src/components/common.jsx:699, src/components/SetupScreen.jsx:324, src/components/SetupScreen.jsx:386 |
| `#9ca3af` | 22 | src/components/SetupScreen.jsx:385, src/components/StatsModal.jsx:333, src/components/StatsModal.jsx:346, src/components/StatsModal.jsx:348, src/components/StatsModal.jsx:351 |
| `#666666` | 20 | src/components/common.jsx:47, src/components/common.jsx:56, src/components/common.jsx:275, src/components/common.jsx:405, src/components/common.jsx:475 |
| `#ef4444` | 17 | src/components/CalibrationModal.jsx:318, src/components/CalibrationModal.jsx:323, src/components/GameScreen.jsx:469, src/components/SetupScreen.jsx:402, src/components/SetupScreen.jsx:408 |
| `#333333` | 17 | src/components/common.jsx:335, src/components/common.jsx:409, src/components/common.jsx:693, src/components/common.jsx:699, src/components/GameResult.jsx:28 |
| `#14365a` | 13 | src/components/CalibrationModal.jsx:175, src/components/common.jsx:274, src/components/common.jsx:393, src/components/common.jsx:397, src/components/GameResult.jsx:22 |
| `#cccccc` | 12 | src/components/common.jsx:289, src/components/common.jsx:294, src/components/common.jsx:474, src/components/GameResult.jsx:28, src/components/GameScreen.jsx:101 |
| `#ffc107` | 11 | src/components/CalibrationModal.jsx:42, src/components/CalibrationModal.jsx:174, src/components/CalibrationModal.jsx:206, src/components/CalibrationModal.jsx:227, src/components/common.jsx:393 |
| `#1a1a2e` | 11 | src/components/common.jsx:207, src/components/common.jsx:244, src/components/common.jsx:268, src/components/common.jsx:289, src/components/common.jsx:293 |
| `#34d399` | 11 | src/components/SetupScreen.jsx:410, src/components/WindMonitorModal.jsx:10, src/components/WindMonitorModal.jsx:50, src/components/WindMonitorModal.jsx:342, src/components/WindMonitorModal.jsx:351 |
| `#f97316` | 10 | src/components/SetupScreen.jsx:404, src/components/StatsModal.jsx:196, src/components/StatsModal.jsx:198, src/components/StatsModal.jsx:330, src/components/StatsModal.jsx:530 |
| `#555555` | 9 | src/components/common.jsx:624, src/components/SetupScreen.jsx:458, src/components/StatsModal.jsx:173, src/components/StatsModal.jsx:174, src/components/StatsModal.jsx:186 |
| `#dddddd` | 8 | src/components/common.jsx:275, src/components/common.jsx:289, src/components/common.jsx:693, src/components/common.jsx:699, src/components/common.jsx:771 |
| `#475569` | 8 | src/components/WindMonitorModal.jsx:565, src/components/WindMonitorModal.jsx:575, src/components/WindMonitorModal.jsx:600, src/components/WindMonitorModal.jsx:645, src/components/WindMonitorModal.jsx:654 |
| `#999999` | 7 | src/components/common.jsx:268, src/components/common.jsx:688, src/components/SetupScreen.jsx:423, src/components/SetupScreen.jsx:439, src/components/SetupScreen.jsx:452 |
| `#eab308` | 7 | src/components/StatsModal.jsx:376, src/components/StatsModal.jsx:456, src/components/StatsModal.jsx:656, src/components/StatsModal.jsx:741, src/components/WindMonitorModal.jsx:49 |
| `#d93a5e` | 6 | src/components/common.jsx:63, src/components/common.jsx:410, src/components/StatsModal.jsx:90, src/constants.js:12, src/constants.js:16 |
| `#aaaaaa` | 6 | src/components/common.jsx:289, src/components/GameScreen.jsx:261, src/components/StatsModal.jsx:458, src/components/StatsModal.jsx:743, src/components/WindDebugOverlay.jsx:99 |
| `#f0f0f0` | 6 | src/components/common.jsx:657, src/components/common.jsx:683, src/components/common.jsx:706, src/components/common.jsx:710, src/components/GameScreen.jsx:189 |
| `#00ff00` | 6 | src/components/WindDebugOverlay.jsx:26, src/components/WindDebugOverlay.jsx:37, src/components/WindDebugOverlay.jsx:69, src/components/WindDebugOverlay.jsx:70, src/components/WindDebugOverlay.jsx:82 |
| `#1e293b` | 6 | src/components/WindMonitorModal.jsx:315, src/components/WindMonitorModal.jsx:414, src/components/WindMonitorModal.jsx:429, src/components/WindMonitorModal.jsx:541, src/components/WindMonitorModal.jsx:549 |
| `#888888` | 5 | src/components/common.jsx:174, src/components/GameScreen.jsx:193, src/components/GameScreen.jsx:205, src/components/StatsModal.jsx:1072, src/styles.css:11 |
| `#eeeeee` | 5 | src/components/common.jsx:292, src/components/common.jsx:670, src/components/common.jsx:671, src/components/common.jsx:766, src/styles.css:24 |
| `#4b5563` | 5 | src/components/common.jsx:393, src/components/common.jsx:397, src/components/common.jsx:398, src/components/common.jsx:414, src/components/SetupScreen.jsx:385 |
| `#e6a817` | 5 | src/components/common.jsx:587, src/components/GameScreen.jsx:427, src/styles.css:20, src/styles.css:59, src/styles.css:60 |
| `#f8f9fa` | 5 | src/components/common.jsx:640, src/components/common.jsx:677, src/components/GameScreen.jsx:189, src/components/GameScreen.jsx:202, src/styles.css:7 |
| `#fbbf24` | 5 | src/components/GameScreen.jsx:479, src/components/WindMonitorModal.jsx:12, src/components/WindMonitorModal.jsx:16, src/windSensor.js:404, src/windSensor.js:408 |
| `#d9a83a` | 4 | src/components/common.jsx:30, src/components/common.jsx:63, src/constants.js:14, src/constants.js:16 |
| `#9b59b6` | 4 | src/components/common.jsx:63, src/components/StatsModal.jsx:792, src/constants.js:16, src/constants.js:129 |
| `#ffd700` | 4 | src/components/common.jsx:63, src/components/common.jsx:268, src/components/GameResult.jsx:26, src/styles.css:22 |
| `#0d2a48` | 4 | src/components/common.jsx:395, src/components/common.jsx:397, src/components/common.jsx:398, src/components/GameResult.jsx:26 |
| `#bbbbbb` | 4 | src/components/common.jsx:401, src/components/common.jsx:618, src/components/common.jsx:625, src/components/StatsModal.jsx:188 |
| `#e0e0e0` | 4 | src/components/GameResult.jsx:75, src/components/StatsModal.jsx:779, src/components/StatsModal.jsx:1132, src/styles.css:23 |
| `#f0b0b0` | 4 | src/components/GameScreen.jsx:102, src/components/SetupScreen.jsx:424, src/components/SetupScreen.jsx:440, src/components/SetupScreen.jsx:454 |
| `#3b82f6` | 4 | src/components/StatsModal.jsx:116, src/components/StatsModal.jsx:199, src/components/StatsModal.jsx:329, src/components/StatsModal.jsx:529 |
| `#e5e7eb` | 4 | src/components/StatsModal.jsx:344, src/components/StatsModal.jsx:374, src/components/StatsModal.jsx:627, src/components/StatsModal.jsx:655 |
| `#6ee7b7` | 4 | src/components/WindMonitorModal.jsx:11, src/components/WindMonitorModal.jsx:17, src/windSensor.js:403, src/windSensor.js:409 |
| `#f0f6ff` | 3 | src/components/common.jsx:30, src/components/StatsModal.jsx:802, src/components/StatsModal.jsx:1053 |
| `#e67e22` | 3 | src/components/common.jsx:63, src/constants.js:16, src/constants.js:128 |
| `#3d5a80` | 3 | src/components/common.jsx:393, src/components/common.jsx:397, src/components/common.jsx:398 |
| `#3498db` | 3 | src/components/common.jsx:644, src/components/SetupScreen.jsx:325, src/constants.js:127 |
| `#c0392b` | 3 | src/components/GameResult.jsx:28, src/components/GameScreen.jsx:427, src/styles.css:14 |
| `#1a9d52` | 3 | src/components/GameResult.jsx:86, src/components/SetupScreen.jsx:347, src/components/SetupScreen.jsx:356 |
| `#1a6dd4` | 3 | src/components/GameResult.jsx:86, src/components/SetupScreen.jsx:346, src/components/SetupScreen.jsx:457 |
| `#e6f0fb` | 3 | src/components/GameScreen.jsx:210, src/components/StatsModal.jsx:779, src/constants.js:11 |
| `#d0dff0` | 2 | src/components/common.jsx:30, src/components/GameResult.jsx:85 |
| `#fde8e8` | 2 | src/components/common.jsx:35, src/components/GameScreen.jsx:102 |
| `#1abc9c` | 2 | src/components/common.jsx:63, src/constants.js:16 |
| `#fff3e0` | 2 | src/components/common.jsx:291, src/components/GameScreen.jsx:103 |
| `#1e4a72` | 2 | src/components/common.jsx:395, src/components/GameResult.jsx:25 |
| `#fffde6` | 2 | src/components/common.jsx:404, src/components/GameResult.jsx:80 |
| `#f0f3f8` | 2 | src/components/common.jsx:414, src/styles.css:6 |
| `#8b6914` | 2 | src/components/common.jsx:659, src/constants.js:114 |
| `#bf6900` | 2 | src/components/GameResult.jsx:28, src/styles.css:21 |
| `#444444` | 2 | src/components/GameResult.jsx:29, src/components/GameResult.jsx:81 |
| `#f5f5f5` | 2 | src/components/GameScreen.jsx:96, src/components/StatsModal.jsx:167 |
| `#fafafa` | 2 | src/components/SetupScreen.jsx:337, src/components/SetupScreen.jsx:384 |
| `#e8e8e8` | 2 | src/components/StatsModal.jsx:116, src/components/StatsModal.jsx:167 |
| `#93c5fd` | 2 | src/components/StatsModal.jsx:116, src/components/StatsModal.jsx:199 |
| `#60a5fa` | 2 | src/components/StatsModal.jsx:116, src/components/StatsModal.jsx:199 |
| `#2563eb` | 2 | src/components/StatsModal.jsx:116, src/components/StatsModal.jsx:199 |
| `#f59e0b` | 2 | src/components/StatsModal.jsx:116, src/components/WindMonitorModal.jsx:493 |
| `#fb923c` | 2 | src/components/StatsModal.jsx:198, src/constants.js:209 |
| `#22c55e` | 2 | src/components/StatsModal.jsx:200, src/constants.js:209 |
| `#d1d5db` | 2 | src/components/StatsModal.jsx:427, src/components/StatsModal.jsx:703 |
| `#ff4444` | 2 | src/components/WindDebugOverlay.jsx:24, src/components/WindDebugOverlay.jsx:61 |
| `#44ff44` | 2 | src/components/WindDebugOverlay.jsx:25, src/components/WindDebugOverlay.jsx:61 |
| `#111827` | 2 | src/components/WindMonitorModal.jsx:58, src/components/WindMonitorModal.jsx:314 |
| `#e2e8f0` | 2 | src/components/WindMonitorModal.jsx:305, src/components/WindMonitorModal.jsx:364 |
| `#7dd3fc` | 2 | src/constants.js:209, src/constants.js:210 |
| `#38bdf8` | 2 | src/constants.js:209, src/constants.js:210 |
| `#ffb432` | 2 | src/components/common.jsx:398, src/components/common.jsx:414 |
| `#0f1a2e` | 1 | src/components/CalibrationModal.jsx:144 |
| `#ff69b4` | 1 | src/components/common.jsx:63 |
| `#f0a030` | 1 | src/components/common.jsx:268 |
| `#ffeeee` | 1 | src/components/common.jsx:289 |
| `#cc0000` | 1 | src/components/common.jsx:289 |
| `#e65100` | 1 | src/components/common.jsx:291 |
| `#fff9db` | 1 | src/components/common.jsx:410 |
| `#ffe0e0` | 1 | src/components/common.jsx:410 |
| `#fff8e1` | 1 | src/components/common.jsx:659 |
| `#f8f9fb` | 1 | src/components/GameResult.jsx:27 |
| `#dde1e6` | 1 | src/components/GameScreen.jsx:76 |
| `#8899aa` | 1 | src/components/GameScreen.jsx:93 |
| `#f0d4a0` | 1 | src/components/GameScreen.jsx:103 |
| `#27ae60` | 1 | src/components/GameScreen.jsx:192 |
| `#1a2a3e` | 1 | src/components/GameScreen.jsx:447 |
| `#b45309` | 1 | src/components/GameScreen.jsx:479 |
| `#8bc53f` | 1 | src/components/SetupScreen.jsx:341 |
| `#2e7d32` | 1 | src/components/SetupScreen.jsx:341 |
| `#14b8a6` | 1 | src/components/SetupScreen.jsx:410 |
| `#053426` | 1 | src/components/SetupScreen.jsx:410 |
| `#6ab0ff` | 1 | src/components/SetupScreen.jsx:430 |
| `#ccccdd` | 1 | src/components/StatsModal.jsx:39 |
| `#2c3e50` | 1 | src/components/StatsModal.jsx:43 |
| `#1565c0` | 1 | src/components/StatsModal.jsx:44 |
| `#dbeafe` | 1 | src/components/StatsModal.jsx:116 |
| `#bfdbfe` | 1 | src/components/StatsModal.jsx:116 |
| `#1d4ed8` | 1 | src/components/StatsModal.jsx:116 |
| `#1e40af` | 1 | src/components/StatsModal.jsx:116 |
| `#1e3a8a` | 1 | src/components/StatsModal.jsx:116 |
| `#a78bfa` | 1 | src/components/StatsModal.jsx:196 |
| `#22d3ee` | 1 | src/components/StatsModal.jsx:196 |
| `#f472b6` | 1 | src/components/StatsModal.jsx:196 |
| `#fdba74` | 1 | src/components/StatsModal.jsx:198 |
| `#ea580c` | 1 | src/components/StatsModal.jsx:198 |
| `#4ade80` | 1 | src/components/StatsModal.jsx:200 |
| `#86efac` | 1 | src/components/StatsModal.jsx:200 |
| `#16a34a` | 1 | src/components/StatsModal.jsx:200 |
| `#f87171` | 1 | src/components/StatsModal.jsx:201 |
| `#fca5a5` | 1 | src/components/StatsModal.jsx:201 |
| `#dc2626` | 1 | src/components/StatsModal.jsx:201 |
| `#0d9488` | 1 | src/components/StatsModal.jsx:803 |
| `#f0fdfa` | 1 | src/components/StatsModal.jsx:803 |
| `#fef2f2` | 1 | src/components/StatsModal.jsx:804 |
| `#ffff00` | 1 | src/components/WindDebugOverlay.jsx:23 |
| `#0a0f1a` | 1 | src/components/WindMonitorModal.jsx:303 |
| `#94a3b8` | 1 | src/components/WindMonitorModal.jsx:328 |
| `#f0fdf4` | 1 | src/components/WindMonitorModal.jsx:385 |
| `#334155` | 1 | src/components/WindMonitorModal.jsx:617 |
| `#c8dfff` | 1 | src/constants.js:11 |
| `#6b1d30` | 1 | src/constants.js:12 |
| `#fbe6ec` | 1 | src/constants.js:12 |
| `#ffc8d6` | 1 | src/constants.js:12 |
| `#1a5c3a` | 1 | src/constants.js:13 |
| `#e6faf0` | 1 | src/constants.js:13 |
| `#b8ffd8` | 1 | src/constants.js:13 |
| `#6b5a1d` | 1 | src/constants.js:14 |
| `#fbf5e6` | 1 | src/constants.js:14 |
| `#ffe8a0` | 1 | src/constants.js:14 |
| `#c4a35a` | 1 | src/constants.js:115 |
| `#7cb342` | 1 | src/constants.js:116 |
| `#eef1f5` | 1 | src/constants.js:224 |
| `#0b1526` | 1 | src/styles.css:2 |
| `#0f1f30` | 1 | src/styles.css:4 |
| `#e67700` | 1 | src/styles.css:15 |
| `#ffc864` | 1 | src/components/common.jsx:398 |
| `#787878` | 1 | src/components/GameScreen.jsx:427 |
| `#0f172a` | 1 | src/components/GameWindWidget.jsx:25 |


### 1.2 表記ゆれ検出

同一色が複数の表記で書かれている箇所:

| Hex | rgba表記 | Hexファイル | rgbaファイル |
|---|---|---|---|
| `#ffffff` | `rgba(255,255,255,0.12)` | src/components/CalibrationModal.jsx:59 | src/components/CalibrationModal.jsx:34 |
| `#000000` | `rgba(0,0,0,0.72)` | src/components/StatsModal.jsx:456 | src/components/CalibrationModal.jsx:133 |
| `#ffc107` | `rgba(255,193,7,0.25)` | src/components/CalibrationModal.jsx:42 | src/components/CalibrationModal.jsx:181 |
| `#22b566` | `rgba(34,181,102,0.15)` | src/components/CalibrationModal.jsx:279 | src/components/CalibrationModal.jsx:278 |
| `#ef4444` | `rgba(239,68,68,0.12)` | src/components/CalibrationModal.jsx:318 | src/components/CalibrationModal.jsx:317 |
| `#2b7de9` | `rgba(43,125,233,0.08)` | src/components/common.jsx:63 | src/components/common.jsx:325 |
| `#e6a817` | `rgba(230,168,23,0.08)` | src/components/common.jsx:587 | src/components/common.jsx:587 |
| `#e74c3c` | `rgba(231,76,60,0.1)` | src/components/common.jsx:37 | src/components/common.jsx:647 |
| `#14365a` | `rgba(20,54,90,0.3)` | src/components/CalibrationModal.jsx:175 | src/components/GameScreen.jsx:93 |
| `#fbbf24` | `rgba(251,191,36,0.15)` | src/components/GameScreen.jsx:479 | src/components/GameScreen.jsx:479 |
| `#34d399` | `rgba(52,211,153,0.28)` | src/components/SetupScreen.jsx:410 | src/components/SetupScreen.jsx:410 |
| `#1a1a2e` | `rgba(26,26,46,0.95)` | src/components/common.jsx:207 | src/components/StatsModal.jsx:728 |


### 1.3 近似色検出

視覚的にほぼ区別つかない色のペア（CIELAB deltaE < 5）:

| 色1 | 色2 | deltaE | 統一推奨先 |
|---|---|---|---|
| `#f8f9fa` | `#f8f9fb` | 0.5 | `#f8f9fa` |
| `#eeeeee` | `#f0f0f0` | 0.7 | `#f0f0f0` |
| `#f8f9fa` | `#fafafa` | 0.7 | `#f8f9fa` |
| `#f0f3f8` | `#eef1f5` | 0.9 | `#f0f3f8` |
| `#dddddd` | `#e0e0e0` | 1.1 | `#dddddd` |
| `#f8f9fb` | `#fafafa` | 1.1 | `#fafafa` |
| `#f8f9fa` | `#f5f5f5` | 1.5 | `#f8f9fa` |
| `#ffffff` | `#fafafa` | 1.7 | `#ffffff` |
| `#0f1a2e` | `#0f172a` | 1.7 | `#0f1a2e` |
| `#f0f0f0` | `#f5f5f5` | 1.7 | `#f0f0f0` |
| `#f8f9fb` | `#f5f5f5` | 1.7 | `#f5f5f5` |
| `#f5f5f5` | `#fafafa` | 1.7 | `#f5f5f5` |
| `#1a2a3e` | `#1e293b` | 2.0 | `#1e293b` |
| `#ffeeee` | `#fef2f2` | 2.1 | `#ffeeee` |
| `#eeeeee` | `#e8e8e8` | 2.1 | `#eeeeee` |
| `#ffffff` | `#f8f9fa` | 2.2 | `#ffffff` |
| `#e8e8e8` | `#e5e7eb` | 2.2 | `#e5e7eb` |
| `#0b1526` | `#0f172a` | 2.2 | `#0b1526` |
| `#fde8e8` | `#ffeeee` | 2.3 | `#fde8e8` |
| `#fffde6` | `#fff8e1` | 2.3 | `#fffde6` |
| `#f0f0f0` | `#eef1f5` | 2.3 | `#f0f0f0` |
| `#111827` | `#0b1526` | 2.3 | `#111827` |
| `#ffffff` | `#f8f9fb` | 2.4 | `#ffffff` |
| `#f0f6ff` | `#f0f3f8` | 2.4 | `#f0f6ff` |
| `#eeeeee` | `#f5f5f5` | 2.4 | `#eeeeee` |
| `#dde1e6` | `#e5e7eb` | 2.4 | `#e5e7eb` |
| `#eeeeee` | `#eef1f5` | 2.5 | `#eeeeee` |
| `#e5e7eb` | `#e2e8f0` | 2.5 | `#e5e7eb` |
| `#e65100` | `#ea580c` | 2.6 | `#e65100` |
| `#2c3e50` | `#334155` | 2.6 | `#2c3e50` |
| `#f0f3f8` | `#f8f9fb` | 2.7 | `#f0f3f8` |
| `#f5f5f5` | `#eef1f5` | 2.7 | `#f5f5f5` |
| `#bfdbfe` | `#c8dfff` | 2.7 | `#bfdbfe` |
| `#f0f0f0` | `#e8e8e8` | 2.8 | `#f0f0f0` |
| `#e0e0e0` | `#e8e8e8` | 2.8 | `#e0e0e0` |
| `#f0f6ff` | `#e6f0fb` | 2.9 | `#f0f6ff` |
| `#f0f3f8` | `#f0f0f0` | 2.9 | `#f0f0f0` |
| `#f0f3f8` | `#f5f5f5` | 2.9 | `#f0f3f8` |
| `#e0e0e0` | `#dde1e6` | 2.9 | `#e0e0e0` |
| `#dde1e6` | `#e2e8f0` | 2.9 | `#e2e8f0` |
| `#f0fdf4` | `#e6faf0` | 2.9 | `#f0fdf4` |
| `#fff3e0` | `#fff8e1` | 3.0 | `#fff3e0` |
| `#f0f3f8` | `#f8f9fa` | 3.0 | `#f8f9fa` |
| `#22b566` | `#27ae60` | 3.1 | `#22b566` |
| `#fde8e8` | `#fbe6ec` | 3.1 | `#fde8e8` |
| `#fff3e0` | `#fbf5e6` | 3.1 | `#fff3e0` |
| `#f8f9fa` | `#f0f0f0` | 3.1 | `#f0f0f0` |
| `#f8f9fb` | `#eef1f5` | 3.1 | `#f8f9fb` |
| `#f0fdfa` | `#f0fdf4` | 3.1 | `#f0fdfa` |
| `#111827` | `#0f172a` | 3.1 | `#111827` |
| `#f0f6ff` | `#eef1f5` | 3.2 | `#f0f6ff` |
| `#dddddd` | `#dde1e6` | 3.2 | `#dddddd` |
| `#eeeeee` | `#f0f3f8` | 3.2 | `#eeeeee` |
| `#0f1a2e` | `#0b1526` | 3.3 | `#0f1a2e` |
| `#eeeeee` | `#e5e7eb` | 3.3 | `#eeeeee` |
| `#f8f9fa` | `#eef1f5` | 3.3 | `#f8f9fa` |
| `#f0f0f0` | `#f8f9fb` | 3.3 | `#f0f0f0` |
| `#e0e0e0` | `#e5e7eb` | 3.3 | `#e0e0e0` |
| `#e6f0fb` | `#e2e8f0` | 3.3 | `#e6f0fb` |
| `#e5e7eb` | `#eef1f5` | 3.4 | `#e5e7eb` |
| `#ffffff` | `#f5f5f5` | 3.5 | `#ffffff` |
| `#fff9db` | `#fff8e1` | 3.5 | `#fff9db` |
| `#f0f0f0` | `#fafafa` | 3.5 | `#f0f0f0` |
| `#1a1a2e` | `#0f172a` | 3.7 | `#1a1a2e` |
| `#f0f3f8` | `#fafafa` | 3.7 | `#f0f3f8` |
| `#0f1a2e` | `#111827` | 3.8 | `#111827` |
| `#eeeeee` | `#f8f9fa` | 3.8 | `#eeeeee` |
| `#e8e8e8` | `#eef1f5` | 3.8 | `#e8e8e8` |
| `#0f1a2e` | `#0f1f30` | 3.9 | `#0f1a2e` |
| `#dddddd` | `#e8e8e8` | 3.9 | `#dddddd` |
| `#4b5563` | `#475569` | 3.9 | `#475569` |
| `#f0f0f0` | `#e5e7eb` | 3.9 | `#f0f0f0` |
| `#dde1e6` | `#e8e8e8` | 3.9 | `#e8e8e8` |
| `#0f1a2e` | `#1a1a2e` | 4.0 | `#1a1a2e` |
| `#eeeeee` | `#f8f9fb` | 4.0 | `#eeeeee` |
| `#fafafa` | `#eef1f5` | 4.0 | `#fafafa` |
| `#e2e8f0` | `#eef1f5` | 4.0 | `#e2e8f0` |
| `#f0f6ff` | `#f8f9fb` | 4.1 | `#f0f6ff` |
| `#dddddd` | `#e5e7eb` | 4.1 | `#dddddd` |
| `#ffeeee` | `#fbe6ec` | 4.1 | `#ffeeee` |
| `#fffde6` | `#fff9db` | 4.1 | `#fffde6` |
| `#f0f3f8` | `#e6f0fb` | 4.1 | `#e6f0fb` |
| `#d0dff0` | `#dbeafe` | 4.2 | `#d0dff0` |
| `#eeeeee` | `#fafafa` | 4.2 | `#eeeeee` |
| `#f0f3f8` | `#e5e7eb` | 4.2 | `#e5e7eb` |
| `#fff8e1` | `#fbf5e6` | 4.2 | `#fff8e1` |
| `#fde8e8` | `#ffe0e0` | 4.3 | `#fde8e8` |
| `#fde8e8` | `#fef2f2` | 4.3 | `#fde8e8` |
| `#dde1e6` | `#d1d5db` | 4.3 | `#d1d5db` |
| `#f5f5f5` | `#fef2f2` | 4.3 | `#f5f5f5` |
| `#e6f0fb` | `#eef1f5` | 4.3 | `#e6f0fb` |
| `#111827` | `#0f1f30` | 4.3 | `#111827` |
| `#f0f3f8` | `#e2e8f0` | 4.4 | `#f0f3f8` |
| `#f5f5f5` | `#e8e8e8` | 4.5 | `#f5f5f5` |
| `#f0f6ff` | `#f8f9fa` | 4.6 | `#f8f9fa` |
| `#dddddd` | `#d1d5db` | 4.6 | `#dddddd` |
| `#cccccc` | `#d1d5db` | 4.6 | `#cccccc` |
| `#f0f0f0` | `#fef2f2` | 4.6 | `#f0f0f0` |
| `#8899aa` | `#94a3b8` | 4.6 | `#8899aa` |
| `#e8e8e8` | `#e2e8f0` | 4.6 | `#e8e8e8` |
| `#f0f3f8` | `#e8e8e8` | 4.7 | `#f0f3f8` |
| `#f8f9fa` | `#f0fdfa` | 4.7 | `#f8f9fa` |
| `#fafafa` | `#fef2f2` | 4.7 | `#fafafa` |
| `#f0fdfa` | `#e6faf0` | 4.7 | `#f0fdfa` |
| `#fffde6` | `#fbf5e6` | 4.8 | `#fffde6` |
| `#fafafa` | `#f0fdfa` | 4.8 | `#fafafa` |
| `#f0f6ff` | `#e2e8f0` | 4.9 | `#f0f6ff` |
| `#fff3e0` | `#fffde6` | 4.9 | `#fff3e0` |
| `#eeeeee` | `#e0e0e0` | 4.9 | `#eeeeee` |
| `#eeeeee` | `#fef2f2` | 4.9 | `#eeeeee` |
| `#f8f9fa` | `#fef2f2` | 4.9 | `#f8f9fa` |
| `#f8f9fb` | `#f0fdfa` | 4.9 | `#f8f9fb` |
| `#f8f9fb` | `#fef2f2` | 5.0 | `#f8f9fb` |
| `#fbbf24` | `#eab308` | 5.0 | `#eab308` |
| `#0f1f30` | `#0f172a` | 5.0 | `#0f1f30` |


---

## 2. タイポグラフィ (Typography)

### 2.1 FontSize 頻度順リスト

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `14px` | 83 | src/components/CalibrationModal.jsx:163, src/components/CalibrationModal.jsx:219, src/components/common.jsx:51, src/components/common.jsx:171, src/components/common.jsx:249 |
| `16px` | 76 | src/App.jsx:46, src/components/CalibrationModal.jsx:254, src/components/common.jsx:15, src/components/common.jsx:19, src/components/common.jsx:34 |
| `13px` | 76 | src/components/CalibrationModal.jsx:297, src/components/common.jsx:36, src/components/common.jsx:37, src/components/common.jsx:53, src/components/common.jsx:219 |
| `15px` | 64 | src/components/CalibrationModal.jsx:191, src/components/CalibrationModal.jsx:333, src/components/common.jsx:41, src/components/common.jsx:230, src/components/common.jsx:231 |
| `18px` | 52 | src/App.jsx:47, src/components/common.jsx:17, src/components/common.jsx:18, src/components/common.jsx:30, src/components/common.jsx:33 |
| `12px` | 47 | src/components/CalibrationModal.jsx:63, src/components/CalibrationModal.jsx:206, src/components/CalibrationModal.jsx:238, src/components/CalibrationModal.jsx:260, src/components/common.jsx:42 |
| `11px` | 22 | src/components/common.jsx:282, src/components/common.jsx:643, src/components/common.jsx:644, src/components/common.jsx:688, src/components/GameScreen.jsx:439 |
| `20px` | 21 | src/App.jsx:39, src/components/CalibrationModal.jsx:176, src/components/CalibrationModal.jsx:225, src/components/common.jsx:230, src/components/common.jsx:231 |
| `22px` | 14 | src/App.jsx:45, src/components/CalibrationModal.jsx:209, src/components/CalibrationModal.jsx:291, src/components/common.jsx:14, src/components/common.jsx:220 |
| `24px` | 10 | src/components/common.jsx:171, src/components/common.jsx:228, src/components/common.jsx:581, src/components/GameResult.jsx:70, src/components/GameScreen.jsx:103 |
| `10px` | 10 | src/components/common.jsx:289, src/components/GameScreen.jsx:470, src/components/SetupScreen.jsx:324, src/components/SetupScreen.jsx:325, src/components/StatsModal.jsx:168 |
| `17px` | 9 | src/components/GameResult.jsx:75, src/components/GameResult.jsx:83, src/components/GameResult.jsx:85, src/components/GameScreen.jsx:103, src/components/GameScreen.jsx:190 |
| `0` | 7 | src/components/common.jsx:392, src/components/common.jsx:393, src/components/common.jsx:397, src/components/common.jsx:398, src/components/common.jsx:401 |
| `28px` | 6 | src/components/common.jsx:235, src/components/common.jsx:310, src/components/common.jsx:339, src/components/common.jsx:470, src/components/GameScreen.jsx:472 |
| `32px` | 6 | src/components/GameResult.jsx:74, src/components/GameScreen.jsx:180, src/components/SetupScreen.jsx:426, src/components/SetupScreen.jsx:442, src/components/SetupScreen.jsx:459 |
| `44px` | 4 | src/components/CalibrationModal.jsx:62, src/components/CalibrationModal.jsx:322, src/components/GameResult.jsx:75, src/components/GameScreen.jsx:86 |
| `38px` | 4 | src/components/common.jsx:220, src/components/common.jsx:305, src/components/GameScreen.jsx:439, src/components/SetupScreen.jsx:341 |
| `26px` | 3 | src/components/common.jsx:219, src/components/common.jsx:304, src/components/GameScreen.jsx:101 |
| `30px` | 3 | src/components/common.jsx:222, src/components/common.jsx:307, src/components/GameResult.jsx:74 |
| `9px` | 2 | src/components/common.jsx:289, src/components/StatsModal.jsx:1133 |
| `8px` | 2 | src/components/common.jsx:392, src/components/common.jsx:401 |
| `78px` | 2 | src/components/common.jsx:397, src/components/common.jsx:398 |
| `19px` | 2 | src/components/GameResult.jsx:84, src/components/GameResult.jsx:87 |
| `52px` | 1 | src/components/CalibrationModal.jsx:283 |
| `75px` | 1 | src/components/common.jsx:393 |
| `1px` | 1 | src/components/common.jsx:398 |
| `85px` | 1 | src/components/common.jsx:405 |
| `36px` | 1 | src/components/common.jsx:748 |
| `48px` | 1 | src/components/GameScreen.jsx:74 |
| `55px` | 1 | src/components/GameScreen.jsx:82 |
| `34px` | 1 | src/components/GameScreen.jsx:101 |
| `72px` | 1 | src/components/WindMonitorModal.jsx:383 |
| `56px` | 1 | src/components/WindMonitorModal.jsx:383 |


### 2.2 FontWeight 頻度順リスト

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `700` | 214 | src/App.jsx:39, src/App.jsx:47, src/components/CalibrationModal.jsx:164, src/components/CalibrationModal.jsx:192, src/components/CalibrationModal.jsx:206 |
| `800` | 90 | src/App.jsx:45, src/components/CalibrationModal.jsx:209, src/components/CalibrationModal.jsx:291, src/components/common.jsx:14, src/components/common.jsx:33 |
| `900` | 52 | src/components/CalibrationModal.jsx:62, src/components/CalibrationModal.jsx:177, src/components/CalibrationModal.jsx:285, src/components/CalibrationModal.jsx:324, src/components/common.jsx:171 |
| `600` | 43 | src/components/CalibrationModal.jsx:63, src/components/common.jsx:19, src/components/common.jsx:35, src/components/common.jsx:241, src/components/common.jsx:249 |
| `500` | 5 | src/components/common.jsx:693, src/components/common.jsx:699, src/components/common.jsx:771, src/components/StatsModal.jsx:93, src/components/StatsModal.jsx:168 |


### 2.3 FontFamily 使用状況

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `monospace` | 4 | src/components/GameWindWidget.jsx:49, src/components/WindDebugOverlay.jsx:38, src/components/WindDebugOverlay.jsx:75, src/components/WindDebugOverlay.jsx:88 |
| `ui-monospace, 'SF Mono', Menlo, monospace` | 2 | src/components/WindMonitorModal.jsx:71, src/components/WindMonitorModal.jsx:382 |
| `'Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif` | 1 | src/components/StatsModal.jsx:35 |


### 2.4 単位の混在

**FontSize:**
- px: 528件
- rem: 0件
- em: 0件
- %: 0件
- 合計: 535件

---

## 3. 余白 (Spacing)

### 3.1 padding 値の頻度順

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `12px` | 97 | src/components/CalibrationModal.jsx:158, src/components/common.jsx:34, src/components/common.jsx:35, src/components/common.jsx:40, src/components/common.jsx:47 |
| `0` | 90 | src/App.jsx:47, src/components/CalibrationModal.jsx:171, src/components/CalibrationModal.jsx:186, src/components/CalibrationModal.jsx:338, src/components/common.jsx:17 |
| `10px` | 68 | src/components/CalibrationModal.jsx:234, src/components/common.jsx:36, src/components/common.jsx:37, src/components/common.jsx:39, src/components/common.jsx:40 |
| `14px` | 64 | src/components/CalibrationModal.jsx:186, src/components/CalibrationModal.jsx:234, src/components/common.jsx:19, src/components/common.jsx:228, src/components/common.jsx:230 |
| `16px` | 63 | src/App.jsx:47, src/components/CalibrationModal.jsx:139, src/components/CalibrationModal.jsx:171, src/components/CalibrationModal.jsx:215, src/components/common.jsx:17 |
| `8px` | 60 | src/components/common.jsx:221, src/components/common.jsx:239, src/components/common.jsx:241, src/components/common.jsx:280, src/components/common.jsx:291 |
| `6px` | 45 | src/components/CalibrationModal.jsx:158, src/components/common.jsx:222, src/components/common.jsx:239, src/components/common.jsx:289, src/components/common.jsx:301 |
| `4px` | 32 | src/components/CalibrationModal.jsx:338, src/components/common.jsx:222, src/components/common.jsx:275, src/components/common.jsx:287, src/components/common.jsx:307 |
| `24px` | 25 | src/components/CalibrationModal.jsx:146, src/components/common.jsx:44, src/components/common.jsx:49, src/components/common.jsx:216, src/components/common.jsx:239 |
| `20px` | 21 | src/App.jsx:42, src/components/common.jsx:218, src/components/common.jsx:303, src/components/common.jsx:321, src/components/common.jsx:339 |
| `28px` | 16 | src/App.jsx:43, src/components/CalibrationModal.jsx:146, src/components/CalibrationModal.jsx:205, src/components/common.jsx:12, src/components/common.jsx:218 |
| `2px` | 14 | src/components/common.jsx:577, src/components/common.jsx:643, src/components/common.jsx:644, src/components/GameScreen.jsx:469, src/components/GameScreen.jsx:474 |
| `18px` | 12 | src/components/CalibrationModal.jsx:215, src/components/common.jsx:325, src/components/common.jsx:575, src/components/common.jsx:582, src/components/common.jsx:616 |
| `1px` | 12 | src/components/SetupScreen.jsx:324, src/components/SetupScreen.jsx:325, src/components/StatsModal.jsx:450, src/components/StatsModal.jsx:451, src/components/StatsModal.jsx:455 |
| `5px` | 8 | src/components/common.jsx:36, src/components/common.jsx:37, src/components/common.jsx:771, src/components/GameResult.jsx:81, src/components/GameScreen.jsx:261 |
| `7px` | 7 | src/components/GameResult.jsx:80, src/components/GameScreen.jsx:436, src/components/GameScreen.jsx:467, src/components/GameScreen.jsx:468, src/components/GameScreen.jsx:470 |
| `40px` | 6 | src/components/CalibrationModal.jsx:272, src/components/CalibrationModal.jsx:311, src/components/common.jsx:235, src/components/common.jsx:310, src/components/GameScreen.jsx:73 |
| `36px` | 3 | src/components/CalibrationModal.jsx:252, src/components/GameScreen.jsx:86, src/components/SetupScreen.jsx:341 |
| `32px` | 2 | src/App.jsx:43, src/components/common.jsx:12 |
| `48px` | 2 | src/components/common.jsx:235, src/components/common.jsx:310 |
| `9px` | 2 | src/components/GameScreen.jsx:474, src/components/SetupScreen.jsx:385 |
| `34px` | 2 | src/components/SetupScreen.jsx:335, src/components/SetupScreen.jsx:458 |
| `44px` | 2 | src/components/SetupScreen.jsx:417, src/components/SetupScreen.jsx:433 |
| `px` | 1 | src/components/GameScreen.jsx:76 |
| `calc(` | 1 | src/components/GameScreen.jsx:76 |
| `3px` | 1 | src/components/GameScreen.jsx:454 |
| `11px` | 1 | src/components/WindMonitorModal.jsx:60 |


### 3.2 margin 値の頻度順

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `4px` | 61 | src/components/CalibrationModal.jsx:63, src/components/common.jsx:39, src/components/common.jsx:42, src/components/common.jsx:219, src/components/common.jsx:280 |
| `8px` | 59 | src/App.jsx:44, src/components/CalibrationModal.jsx:296, src/components/common.jsx:13, src/components/common.jsx:51, src/components/common.jsx:53 |
| `6px` | 45 | src/App.jsx:45, src/components/CalibrationModal.jsx:209, src/components/common.jsx:14, src/components/common.jsx:45, src/components/common.jsx:291 |
| `10px` | 37 | src/components/CalibrationModal.jsx:194, src/components/CalibrationModal.jsx:259, src/components/common.jsx:33, src/components/common.jsx:279, src/components/common.jsx:292 |
| `12px` | 33 | src/App.jsx:39, src/components/common.jsx:50, src/components/common.jsx:52, src/components/common.jsx:273, src/components/common.jsx:598 |
| `14px` | 27 | src/App.jsx:46, src/components/CalibrationModal.jsx:233, src/components/common.jsx:15, src/components/common.jsx:220, src/components/common.jsx:305 |
| `2px` | 26 | src/components/common.jsx:200, src/components/common.jsx:204, src/components/common.jsx:219, src/components/common.jsx:304, src/components/common.jsx:472 |
| `16px` | 23 | src/components/common.jsx:46, src/components/common.jsx:245, src/components/common.jsx:343, src/components/common.jsx:469, src/components/common.jsx:586 |
| `0` | 13 | src/components/common.jsx:370, src/components/common.jsx:581, src/components/common.jsx:656, src/components/common.jsx:676, src/components/GameResult.jsx:70 |
| `20px` | 11 | src/components/common.jsx:227, src/components/common.jsx:235, src/components/common.jsx:310, src/components/common.jsx:595, src/components/common.jsx:601 |
| `auto` | 6 | src/components/common.jsx:370, src/components/GameScreen.jsx:261, src/components/SetupScreen.jsx:341, src/components/SetupScreen.jsx:342, src/components/StatsModal.jsx:37 |
| `22px` | 4 | src/components/CalibrationModal.jsx:214, src/components/CalibrationModal.jsx:254, src/components/CalibrationModal.jsx:291, src/components/CalibrationModal.jsx:332 |
| `28px` | 4 | src/components/CalibrationModal.jsx:304, src/components/common.jsx:227, src/components/common.jsx:235, src/components/common.jsx:310 |
| `3px` | 4 | src/components/GameResult.jsx:81, src/components/GameScreen.jsx:96, src/components/StatsModal.jsx:743, src/components/StatsModal.jsx:796 |
| `5px` | 4 | src/components/GameResult.jsx:83, src/components/GameResult.jsx:85, src/components/GameScreen.jsx:188, src/components/GameScreen.jsx:201 |
| `24px` | 3 | src/components/CalibrationModal.jsx:180, src/components/CalibrationModal.jsx:343, src/components/GameResult.jsx:87 |
| `7px` | 2 | src/components/SetupScreen.jsx:417, src/components/SetupScreen.jsx:433 |
| `-6px` | 1 | src/components/SetupScreen.jsx:341 |
| `1px` | 1 | src/components/StatsModal.jsx:800 |


### 3.3 gap 値の頻度順

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `8px` | 48 | src/components/common.jsx:47, src/components/common.jsx:54, src/components/common.jsx:227, src/components/common.jsx:229, src/components/common.jsx:246 |
| `6px` | 44 | src/components/common.jsx:39, src/components/common.jsx:331, src/components/common.jsx:581, src/components/common.jsx:587, src/components/common.jsx:590 |
| `4px` | 22 | src/components/common.jsx:35, src/components/common.jsx:45, src/components/common.jsx:588, src/components/common.jsx:591, src/components/common.jsx:639 |
| `10px` | 18 | src/App.jsx:47, src/components/CalibrationModal.jsx:224, src/components/common.jsx:16, src/components/common.jsx:250, src/components/common.jsx:329 |
| `12px` | 7 | src/components/common.jsx:217, src/components/common.jsx:227, src/components/common.jsx:229, src/components/common.jsx:302, src/components/GameResult.jsx:75 |
| `2px` | 5 | src/components/GameScreen.jsx:427, src/components/GameScreen.jsx:473, src/components/GameScreen.jsx:474, src/components/StatsModal.jsx:89, src/components/StatsModal.jsx:1131 |
| `5px` | 4 | src/components/common.jsx:287, src/components/GameScreen.jsx:191, src/components/GameScreen.jsx:204, src/components/StatsModal.jsx:1044 |
| `20px` | 2 | src/components/common.jsx:217, src/components/common.jsx:302 |
| `3px` | 2 | src/components/GameScreen.jsx:84, src/components/GameScreen.jsx:88 |
| `0` | 2 | src/components/GameScreen.jsx:434, src/components/GameScreen.jsx:447 |
| `16px` | 1 | src/components/GameScreen.jsx:436 |
| `14px` | 1 | src/components/SetupScreen.jsx:360 |
| `4px 10px` | 1 | src/components/SetupScreen.jsx:396 |
| `7px` | 1 | src/components/SetupScreen.jsx:446 |


### 3.4 単位の混在

**Padding:** px 566件, rem 0件, % 0件
**Margin:** px 345件, rem 0件, % 0件
**Gap:** px 156件, rem 0件

### 3.5 グリッド準拠状況

4の倍数から逸脱している値:

| 値 | 出現回数 | カテゴリ | 備考 |
|---|---|---|---|
| `6px` | 134 | padding, margin, gap | 最寄り4倍数: 8px |
| `10px` | 123 | padding, margin, gap | 最寄り4倍数: 12px |
| `14px` | 92 | padding, margin, gap | 最寄り4倍数: 16px |
| `2px` | 45 | padding, margin, gap | 最寄り4倍数: 4px |
| `5px` | 16 | padding, margin, gap | 最寄り4倍数: 4px |
| `1px` | 13 | padding, margin | 最寄り4倍数: 0px |
| `18px` | 12 | padding | 最寄り4倍数: 20px |
| `7px` | 10 | padding, margin, gap | 最寄り4倍数: 8px |
| `3px` | 7 | padding, margin, gap | 最寄り4倍数: 4px |
| `22px` | 4 | margin | 最寄り4倍数: 24px |
| `9px` | 2 | padding | 最寄り4倍数: 8px |
| `34px` | 2 | padding | 最寄り4倍数: 36px |
| `11px` | 1 | padding | 最寄り4倍数: 12px |


---

## 4. 角丸 (Border Radius)

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `8px` | 87 | src/components/CalibrationModal.jsx:160, src/components/common.jsx:30, src/components/common.jsx:40, src/components/common.jsx:41, src/components/common.jsx:52 |
| `10px` | 74 | src/components/CalibrationModal.jsx:188, src/components/CalibrationModal.jsx:235, src/components/common.jsx:47, src/components/common.jsx:55, src/components/common.jsx:56 |
| `12px` | 39 | src/App.jsx:47, src/components/CalibrationModal.jsx:173, src/components/CalibrationModal.jsx:216, src/components/common.jsx:17, src/components/common.jsx:18 |
| `14px` | 35 | src/components/common.jsx:228, src/components/common.jsx:230, src/components/common.jsx:231, src/components/common.jsx:235, src/components/common.jsx:310 |
| `6px` | 27 | src/components/common.jsx:36, src/components/common.jsx:37, src/components/common.jsx:197, src/components/common.jsx:643, src/components/common.jsx:644 |
| `16px` | 20 | src/components/common.jsx:44, src/components/common.jsx:49, src/components/common.jsx:214, src/components/common.jsx:218, src/components/common.jsx:244 |
| `5px` | 13 | src/components/common.jsx:332, src/components/GameScreen.jsx:261, src/components/GameScreen.jsx:474, src/components/StatsModal.jsx:435, src/components/StatsModal.jsx:450 |
| `4px` | 11 | src/components/common.jsx:282, src/components/SetupScreen.jsx:324, src/components/SetupScreen.jsx:325, src/components/StatsModal.jsx:737, src/components/StatsModal.jsx:738 |
| `20px` | 8 | src/App.jsx:43, src/components/CalibrationModal.jsx:145, src/components/common.jsx:12, src/components/common.jsx:218, src/components/common.jsx:241 |
| `50%` | 5 | src/components/GameScreen.jsx:84, src/components/GameScreen.jsx:427, src/components/SetupScreen.jsx:341, src/components/StatsModal.jsx:94, src/components/WindDebugOverlay.jsx:60 |
| `18px` | 4 | src/components/common.jsx:467, src/components/common.jsx:654, src/components/common.jsx:725, src/constants.js:227 |
| `13px` | 3 | src/components/common.jsx:578, src/components/SetupScreen.jsx:418, src/components/SetupScreen.jsx:434 |
| `48px` | 1 | src/components/CalibrationModal.jsx:277 |
| `44px` | 1 | src/components/CalibrationModal.jsx:316 |
| `` | 1 | src/components/common.jsx:196 |
| `0 0` | 1 | src/components/common.jsx:196 |
| `15px` | 1 | src/components/common.jsx:577 |
| `2px` | 1 | src/components/GameScreen.jsx:93 |
| `7px` | 1 | src/components/GameScreen.jsx:474 |
| `10px 0 0 10px` | 1 | src/components/StatsModal.jsx:93 |
| `0 10px 10px 0` | 1 | src/components/StatsModal.jsx:93 |
| `0` | 1 | src/components/StatsModal.jsx:93 |
| `36px` | 1 | src/components/StatsModal.jsx:1072 |
| `3px 3px 0 0` | 1 | src/components/StatsModal.jsx:1132 |


---

## 5. 影 (Box Shadow)

| 値 | 出現回数 | 代表使用箇所（最大5件） |
|---|---|---|
| `0 3px 16px rgba(43,125,233,0.3)` | 3 | src/components/common.jsx:339, src/components/SetupScreen.jsx:426, src/components/SetupScreen.jsx:442 |
| `0 1px 3px rgba(0,0,0,0.2)` | 3 | src/components/common.jsx:578, src/components/SetupScreen.jsx:368, src/components/SetupScreen.jsx:379 |
| `var(--shadow-lg)` | 2 | src/App.jsx:43, src/components/common.jsx:12 |
| `0 2px 8px rgba(20,54,90,0.3)` | 2 | src/components/GameScreen.jsx:93, src/components/GameScreen.jsx:101 |
| `none` | 2 | src/components/GameScreen.jsx:93, src/components/GameScreen.jsx:101 |
| `0 24px 60px rgba(0,0,0,0.5)` | 1 | src/components/CalibrationModal.jsx:151 |
| `0 4px 18px rgba(255,193,7,0.25)` | 1 | src/components/CalibrationModal.jsx:181 |
| `0 0 30px ` | 1 | src/components/common.jsx:195 |
| `0 2px 8px rgba(0,0,0,0.18)` | 1 | src/components/SetupScreen.jsx:341 |
| `0 3px 12px rgba(52,211,153,0.28)` | 1 | src/components/SetupScreen.jsx:410 |
| `0 3px 12px rgba(43,125,233,0.3)` | 1 | src/components/SetupScreen.jsx:457 |
| `0 4px 16px rgba(0,0,0,0.3)` | 1 | src/components/StatsModal.jsx:728 |
| `0 0 0 0 rgba(230, 168, 23, 0)` | 1 | src/styles.css:59 |
| `0 0 12px 4px rgba(230, 168, 23, 0.5)` | 1 | src/styles.css:60 |
| `0 4px 20px rgba(0,0,0,0.3)` | 1 | src/styles.css:135 |


---

## 6. 観察事項

### 6.1 インラインstyle vs CSSファイル

- **インラインstyle使用**: 10ファイル / 20ファイル中（50%）
- **style={{}} 出現回数**: 990回
- **className使用**: 4ファイル（合計18回）
- **CSSファイル**: 1ファイル（src/styles.css のみ）
- **スタイル定義の主要パターン**:
  1. **インラインstyleオブジェクト**: 圧倒的多数。全コンポーネントで使用。
  2. **CSS変数参照**: インラインstyle内で `var(--xxx)` を使用（479箇所）
  3. **constants.js定数**: `SS`共有スタイルオブジェクト、`C`チーム色配列、各種バッジ色マップ
  4. **CSSクラス**: アニメーション（mk-fade-scale-in等）とbox-shadow最適化（mk-card-shadow）に限定使用

### 6.2 CSS変数（カスタムプロパティ）使用状況

styles.css の :root に定義されている34変数の使用状況:

| 変数名 | 定義値 | 使用箇所数 | 代表使用ファイル |
|---|---|---|---|
| `--text-inverse` | `#fff` | 73 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--border-input` | `#ddd` | 68 | src/components/common.jsx, src/components/GameResult.jsx, src/components/GameScreen.jsx |
| `--accent-blue` | `#2b7de9` | 65 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--bg-surface` | `#fff` | 56 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--text-primary` | `#14365a` | 55 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--text-secondary` | `#888` | 40 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--text-danger` | `#c0392b` | 30 | src/components/common.jsx, src/components/GameResult.jsx, src/components/GameScreen.jsx |
| `--bg-secondary` | `#14365a` | 29 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--text-muted` | `#aaa` | 11 | src/components/common.jsx, src/components/GameScreen.jsx, src/components/SetupScreen.jsx |
| `--text-success` | `#22b566` | 9 | src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx |
| `--border-lighter` | `#eee` | 9 | src/components/common.jsx, src/components/GameResult.jsx, src/components/GameScreen.jsx |
| `--accent-green` | `#22b566` | 6 | src/components/common.jsx, src/components/GameResult.jsx, src/components/SetupScreen.jsx |
| `--bg-tertiary` | `#0f1f30` | 5 | src/App.jsx, src/components/common.jsx, src/components/SetupScreen.jsx |
| `--bg-surface-dim` | `#f8f9fa` | 5 | src/components/common.jsx, src/components/GameResult.jsx, src/components/GameScreen.jsx |
| `--accent-yellow` | `#e6a817` | 5 | src/components/common.jsx |
| `--accent-orange` | `#bf6900` | 4 | src/components/common.jsx, src/components/GameResult.jsx, src/components/GameScreen.jsx |
| `--bg-surface-alt` | `#f0f3f8` | 3 | src/components/GameResult.jsx, src/components/StatsModal.jsx |
| `--shadow-lg` | `0 10px 36px rgba(0,0,0,0.25)` | 2 | src/App.jsx, src/components/common.jsx |
| `--bg-primary` | `#0b1526` | 1 | src/styles.css |
| `--bg-overlay` | `rgba(0,0,0,0.55)` | 1 | src/constants.js |
| `--text-warning` | `#e67700` | 1 | src/components/GameScreen.jsx |
| `--border-light` | `#e0e0e0` | 1 | src/components/SetupScreen.jsx |
| `--bg-overlay-light` | `rgba(0,0,0,0.4)` | 0 | - |
| `--accent-red` | `#d93a5e` | 0 | - |
| `--accent-gold` | `#ffd700` | 0 | - |
| `--border-focus` | `#2b7de9` | 0 | - |
| `--radius-sm` | `6px` | 0 | - |
| `--radius-md` | `10px` | 0 | - |
| `--radius-lg` | `14px` | 0 | - |
| `--radius-xl` | `18px` | 0 | - |
| `--shadow-md` | `0 6px 20px rgba(0,0,0,0.18)` | 0 | - |
| `--transition-fast` | `0.15s ease` | 0 | - |
| `--transition-normal` | `0.2s ease` | 0 | - |
| `--transition-slow` | `0.3s ease` | 0 | - |

**最も使われている変数 Top5:**
1. `--text-inverse` (73回)
2. `--border-input` (68回)
3. `--accent-blue` (65回)
4. `--bg-surface` (56回)
5. `--text-primary` (55回)

**定義されているが未使用の変数:**
- `--bg-overlay-light` = `rgba(0,0,0,0.4)`
- `--accent-red` = `#d93a5e`
- `--accent-gold` = `#ffd700`
- `--border-focus` = `#2b7de9`
- `--radius-sm` = `6px`
- `--radius-md` = `10px`
- `--radius-lg` = `14px`
- `--radius-xl` = `18px`
- `--shadow-md` = `0 6px 20px rgba(0,0,0,0.18)`
- `--transition-fast` = `0.15s ease`
- `--transition-normal` = `0.2s ease`
- `--transition-slow` = `0.3s ease`

### 6.3 重複・矛盾

- `#ffffff` は CSS変数 `--text-inverse` で定義済みだが、src/components/CalibrationModal.jsx:59, src/components/CalibrationModal.jsx:149, src/components/CalibrationModal.jsx:190, src/components/CalibrationModal.jsx:254, src/components/CalibrationModal.jsx:291 ではハードコードされている
- `#2b7de9` は CSS変数 `--border-focus` で定義済みだが、src/components/common.jsx:63, src/components/common.jsx:228, src/components/common.jsx:268 ではハードコードされている
- `#22b566` は CSS変数 `--accent-green` で定義済みだが、src/components/CalibrationModal.jsx:279, src/components/CalibrationModal.jsx:284, src/components/CalibrationModal.jsx:304, src/components/common.jsx:63, src/components/common.jsx:228 ではハードコードされている
- `#14365a` は CSS変数 `--text-primary` で定義済みだが、src/components/CalibrationModal.jsx:175, src/components/common.jsx:274, src/components/common.jsx:393, src/components/common.jsx:397, src/components/GameResult.jsx:22 ではハードコードされている
- `#dddddd` は CSS変数 `--border-input` で定義済みだが、src/components/common.jsx:275, src/components/common.jsx:289, src/components/common.jsx:693, src/components/common.jsx:699 ではハードコードされている
- `#d93a5e` は CSS変数 `--accent-red` で定義済みだが、src/components/common.jsx:63 ではハードコードされている
- `#aaaaaa` は CSS変数 `--text-muted` で定義済みだが、src/components/common.jsx:289, src/components/StatsModal.jsx:458, src/components/StatsModal.jsx:743, src/components/WindDebugOverlay.jsx:99 ではハードコードされている
- `#888888` は CSS変数 `--text-secondary` で定義済みだが、src/components/common.jsx:174 ではハードコードされている
- `#eeeeee` は CSS変数 `--border-lighter` で定義済みだが、src/components/common.jsx:292, src/components/common.jsx:670, src/components/common.jsx:671, src/components/common.jsx:766 ではハードコードされている
- `#e6a817` は CSS変数 `--accent-yellow` で定義済みだが、src/components/common.jsx:587, src/components/GameScreen.jsx:427 ではハードコードされている
- `#f8f9fa` は CSS変数 `--bg-surface-dim` で定義済みだが、src/components/common.jsx:640, src/components/GameScreen.jsx:189, src/components/GameScreen.jsx:202 ではハードコードされている
- `#ffd700` は CSS変数 `--accent-gold` で定義済みだが、src/components/common.jsx:63, src/components/common.jsx:268, src/components/GameResult.jsx:26 ではハードコードされている
- `#e0e0e0` は CSS変数 `--border-light` で定義済みだが、src/components/StatsModal.jsx:1132 ではハードコードされている
- `#c0392b` は CSS変数 `--text-danger` で定義済みだが、src/components/GameResult.jsx:28, src/components/GameScreen.jsx:427 ではハードコードされている
- `#bf6900` は CSS変数 `--accent-orange` で定義済みだが、src/components/GameResult.jsx:28 ではハードコードされている

### 6.4 CSS名前付き色の使用

| 名前付き色 | 出現回数 | 代表使用箇所 |
|---|---|---|
| `transparent` | 61 | src/App.jsx:47, src/components/CalibrationModal.jsx:161, src/components/CalibrationModal.jsx:189, src/components/common.jsx:18, src/components/common.jsx:19 |
| `none` | 12 | src/components/CalibrationModal.jsx:36, src/components/CalibrationModal.jsx:44, src/components/SetupScreen.jsx:341, src/components/StatsModal.jsx:39, src/components/StatsModal.jsx:366 |
| `inherit` | 2 | src/styles.css:71, src/styles.css:73 |
| `currentcolor` | 1 | src/components/StatsModal.jsx:828 |


### 6.5 その他気づき

**単位省略記述の件数:**
- fontSize: 535件（全535件中 = 100%）が単位なし数値リテラル
- padding系: 112件（全657件中）
- margin系: 347件（全364件中）
- gap: 157件（全158件中）
- borderRadius: 328件（全338件中）

React inline styleでは数値リテラルがpx単位として解釈されるため、ほぼ全ての値が単位省略形式で記述されている。

**コンポーネント間のスタイル一貫性:**
- `SS`オブジェクト（constants.js）がモーダル・オーバーレイ・ツールバーの共通スタイルを提供
- チーム色は`C`配列で一元管理されているが、使用はSetupScreen/GameResult/ShuffleAnimationに限定（GameScreenでは使用禁止ルール）
- 各コンポーネントは独自のインラインスタイルを大量に持ち、共通化されていない部分が多い

**命名の傾向:**
- `SS`: Shared Styles の略。プロパティ名は極端に短縮（gW, tBtn, ov, mod, clsB）
- `C`: Colors の略。チーム色配列。プロパティは2文字略称（bg, lt, ac, tx, nm）
- `PC`: Player Chart colors
- CSS変数: `--カテゴリ-用途` の命名規則（--bg-primary, --text-danger, --accent-blue）

**linear-gradient使用パターン:**
- 使用回数: 19回（4ファイル）
- 使用ファイル: src/App.jsx, src/components/common.jsx, src/components/GameResult.jsx, src/components/SetupScreen.jsx
