// ═══ Wind Sensor Manager ═══
// Calypso CMI1022 BLE -> Raspberry Pi WebSocket -> iPad PWA
// compass_valid対応: QMC5883L異常時は風速のみ記録、風向きはnull

import {
  WIND_SPEED_CAP,
  WIND_BUFFER_SIZE,
  WIND_WS_PORT,
  WIND_RECONNECT_MS,
} from "./constants.js";

// ═══ Wind Direction Utilities ═══

/** 投擲方向基準の相対風向きから8方位カテゴリを返す */
export function getWindCategory(relativeDirection) {
  const d = relativeDirection;
  if (d >= 337.5 || d < 22.5) return "tailwind";
  if (d >= 22.5 && d < 67.5) return "tail_right";
  if (d >= 67.5 && d < 112.5) return "right_cross";
  if (d >= 112.5 && d < 157.5) return "head_right";
  if (d >= 157.5 && d < 202.5) return "headwind";
  if (d >= 202.5 && d < 247.5) return "head_left";
  if (d >= 247.5 && d < 292.5) return "left_cross";
  if (d >= 292.5 && d < 337.5) return "tail_left";
  return "unknown";
}

/** 磁北基準の絶対風向きから8方位を返す */
export function getAbsolute8Direction(absoluteDir) {
  const d = absoluteDir;
  if (d >= 337.5 || d < 22.5) return "N";
  if (d >= 22.5 && d < 67.5) return "NE";
  if (d >= 67.5 && d < 112.5) return "E";
  if (d >= 112.5 && d < 157.5) return "SE";
  if (d >= 157.5 && d < 202.5) return "S";
  if (d >= 202.5 && d < 247.5) return "SW";
  if (d >= 247.5 && d < 292.5) return "W";
  if (d >= 292.5 && d < 337.5) return "NW";
  return "N";
}

/** 三脚ズレ補正付き相対風向き */
export function calcRelativeDirection(calypsoDir, compassNow, compassInit) {
  const drift = (compassNow - compassInit + 360) % 360;
  return (calypsoDir + drift + 360) % 360;
}

/** 絶対風向き（磁北基準） */
export function calcAbsoluteDirection(calypsoDir, compassNow) {
  return (calypsoDir + compassNow) % 360;
}

// ═══ WindSensorManager Class ═══

export class WindSensorManager {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.compassValid = false;
    this.windBuffer = [];
    this.currentWind = null;
    this.onDataCallback = null;
    this.onStatusCallback = null;
    this.onDebugLogCallback = null;
    this.reconnectTimer = null;
    this.piAddress = null;
    this.compassHeadingInitial = null;
    this.debugLogs = [];
    this._firstMessageLogged = false;
    // キャリブレーション用コールバック（type ディスパッチで呼ばれる）
    this.onCalibrateProgressCallback = null;  // (coverage: number) => void
    this.onCalibrateDoneCallback = null;      // (data: {offset_x, offset_y}) => void
    this.onCalibrateErrorCallback = null;     // (reason: string) => void
    // test_result 受信用（_connectWs 経由の安全策）
    this._testResolve = null;
    this._testReject = null;
  }

  _log(message) {
    const now = new Date();
    const ts = now.toTimeString().slice(0, 8) + "." + String(now.getMilliseconds()).padStart(3, "0");
    const entry = "[" + ts + "] " + message;
    this.debugLogs.push(entry);
    if (this.debugLogs.length > 100) this.debugLogs.shift();
    this.onDebugLogCallback?.([...this.debugLogs]);
  }

  connect(piAddress) {
    this._log("connect() called with: " + piAddress);
    this.piAddress = piAddress;
    this._connectWs();
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    if (this.ws) {
      this.ws.onclose = null; // 再接続を抑止
      this.ws.close();
    }
    this.ws = null;
    this.connected = false;
    this.compassValid = false;
    this.windBuffer = [];
    this.currentWind = null;
  }

  /** 現在のQMC5883L方位を初期方位として記録 */
  setInitialCompassHeading() {
    if (this.currentWind && this.currentWind.compass_heading != null) {
      this.compassHeadingInitial = this.currentWind.compass_heading;
      return this.compassHeadingInitial;
    }
    return null;
  }

  /** 三脚ズレ再設定（三角マークをスキットル方向に直した後に呼ぶ） */
  resetCompassHeading() {
    return this.setInitialCompassHeading();
  }

  /** 接続テスト: 一時的にWebSocket接続してtest_connectionコマンドを送り、test_resultを待つ
   *  成功時は test_result オブジェクト ({type, status, wind_speed, wind_direction, compass_heading, compass_valid, battery, throw_direction}) を resolve
   *  失敗時は new Error(...) で reject
   */
  testConnection(address, timeout = 5000) {
    this._log("testConnection() called with: " + address);
    return new Promise((resolve, reject) => {
      let settled = false;
      let ws = null;
      const cleanup = () => {
        settled = true;
        if (ws) {
          try { ws.onclose = null; ws.onerror = null; ws.onmessage = null; ws.close(); } catch (e) {}
          ws = null;
        }
      };
      const timer = setTimeout(() => {
        if (settled) return;
        this._log("testConnection timeout (" + timeout + "ms)");
        cleanup();
        reject(new Error("5秒以内に応答なし"));
      }, timeout);
      try {
        const wsUrl = address.startsWith("wss://") || address.startsWith("ws://") ? address : "ws://" + address + ":" + WIND_WS_PORT;
        this._log("testConnection URL: " + wsUrl);
        ws = new WebSocket(wsUrl);
        this._log("testConnection WebSocket created");
        ws.onopen = () => {
          this._log("testConnection onopen - sending test_connection command");
          try {
            ws.send(JSON.stringify({ command: "test_connection" }));
          } catch (e) {
            // 送信失敗は onerror / onclose で処理される
            this._log("testConnection send error: " + e.message);
          }
        };
        ws.onmessage = (event) => {
          if (settled) return;
          try {
            const data = JSON.parse(event.data);
            if (data && data.type === "test_result") {
              this._log("testConnection test_result received: status=" + data.status);
              clearTimeout(timer);
              cleanup();
              resolve(data);
            }
            // wind_data（初回スナップショットやブロードキャスト）は無視して test_result を待つ
          } catch (e) {
            // JSON パースエラーは無視
          }
        };
        ws.onerror = (event) => {
          if (settled) return;
          this._log("testConnection onerror - type: " + event.type);
          clearTimeout(timer);
          cleanup();
          reject(new Error("接続エラー"));
        };
        ws.onclose = (event) => {
          if (settled) return;
          this._log("testConnection onclose - code: " + event.code + ", reason: " + event.reason);
          clearTimeout(timer);
          cleanup();
          reject(new Error("接続が切断されました"));
        };
      } catch (e) {
        this._log("testConnection catch error: " + e.message);
        clearTimeout(timer);
        cleanup();
        reject(new Error("WebSocket作成エラー"));
      }
    });
  }

  /** キャリブレーション開始コマンドを送信。
   *  WebSocketがOPEN状態ならtrue、それ以外はfalseを返す。
   *  進捗・完了・エラーはonCalibrate*Callback経由で通知される。
   */
  startCalibration() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ command: "calibrate_start" }));
        this._log("calibrate_start sent");
        return true;
      } catch (e) {
        this._log("startCalibration send error: " + e.message);
        return false;
      }
    }
    this._log("startCalibration aborted: ws not open");
    return false;
  }

  _connectWs() {
    if (!this.piAddress) return;
    this._log("_connectWs() constructing URL...");
    try {
      const wsUrl = this.piAddress.startsWith("wss://") || this.piAddress.startsWith("ws://") ? this.piAddress : "ws://" + this.piAddress + ":" + WIND_WS_PORT;
      this._log("WebSocket URL: " + wsUrl);
      this.ws = new WebSocket(wsUrl);
      this._log("new WebSocket() called");

      this.ws.onopen = () => {
        this._log("WS onopen - connected");
        this.connected = true;
        if (this.onStatusCallback) {
          this.onStatusCallback({ connected: true, address: this.piAddress });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          if (!this._firstMessageLogged) {
            this._firstMessageLogged = true;
            const preview = typeof event.data === "string" ? event.data.slice(0, 100) : String(event.data).slice(0, 100);
            this._log("WS first message received: " + preview);
          }
          const data = JSON.parse(event.data);
          const type = data && data.type;

          if (type === "wind_data" || !type) {
            // 通常の風データ（type 未設定の旧 bridge.py との互換も維持）
            this.currentWind = data;
            this.compassValid = !!data.compass_valid;
            this.windBuffer.push(data);
            if (this.windBuffer.length > WIND_BUFFER_SIZE) this.windBuffer.shift();
            if (this.onDataCallback) this.onDataCallback(data);
          } else if (type === "test_result") {
            // 安全策: _connectWs 経由で test_result を受けることは通常ないが、
            // 万が一に備えて _testResolve があれば解決する
            if (this._testResolve) {
              this._testResolve(data);
              this._testResolve = null;
              this._testReject = null;
            }
          } else if (type === "calibrate_progress") {
            if (this.onCalibrateProgressCallback) this.onCalibrateProgressCallback(data.coverage);
          } else if (type === "calibrate_done") {
            if (this.onCalibrateDoneCallback) this.onCalibrateDoneCallback(data);
          } else if (type === "calibrate_error") {
            if (this.onCalibrateErrorCallback) this.onCalibrateErrorCallback(data.reason);
          }
          // 未知の type は無視（将来の拡張に対応）
        } catch (e) {
          // JSONパースエラーは無視
        }
      };

      this.ws.onclose = (event) => {
        this._log("WS onclose - code: " + event.code + ", reason: " + event.reason + ", wasClean: " + event.wasClean);
        this.connected = false;
        this._firstMessageLogged = false;
        if (this.onStatusCallback) {
          this.onStatusCallback({ connected: false });
        }
        this._log("Reconnect scheduled in " + WIND_RECONNECT_MS + "ms");
        this.reconnectTimer = setTimeout(() => this._connectWs(), WIND_RECONNECT_MS);
      };

      this.ws.onerror = (event) => {
        this._log("WS onerror - type: " + event.type);
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      this._log("WS catch error: " + e.message);
      this._log("Reconnect scheduled in " + WIND_RECONNECT_MS + "ms");
      this.reconnectTimer = setTimeout(() => this._connectWs(), WIND_RECONNECT_MS);
    }
  }

  /** スコア入力時に呼ぶ: 現在の風速データのスナップショットを返す */
  snapshot() {
    if (!this.currentWind || this.compassHeadingInitial == null) return null;

    const compassIsValid = this.compassValid;
    const calypsoDir = this.currentWind.wind_direction;
    const compassNow = this.currentWind.compass_heading;
    const compassInit = this.compassHeadingInitial;

    // コンパス無効時: 風速のみ記録、風向き関連はnull
    let relDir = null;
    let absDir = null;
    let windCat = null;
    let absCat = null;

    if (compassIsValid) {
      relDir = calcRelativeDirection(calypsoDir, compassNow, compassInit);
      absDir = calcAbsoluteDirection(calypsoDir, compassNow);
      windCat = getWindCategory(relDir);
      absCat = getAbsolute8Direction(absDir);
    }

    const speeds = this.windBuffer.map(d => d.wind_speed);
    const avg = speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : this.currentWind.wind_speed;
    const max = speeds.length > 0 ? Math.max(...speeds) : this.currentWind.wind_speed;

    const result = {
      timestamp: new Date().toISOString(),
      windSpeed: Math.min(this.currentWind.wind_speed, WIND_SPEED_CAP),
      windDirection: calypsoDir,
      compassHeading: compassNow,
      compassValid: compassIsValid,
      relativeDirection: relDir,
      absoluteDirection: absDir,
      windCategory: windCat,
      absoluteCategory: absCat,
      avgWindSpeed: Math.round(Math.min(avg, WIND_SPEED_CAP) * 10) / 10,
      maxWindSpeed: Math.round(Math.min(max, WIND_SPEED_CAP) * 10) / 10,
      gustFactor: avg > 0 ? Math.round((max / avg) * 100) / 100 : 1.0,
    };

    this.windBuffer = [];
    return result;
  }

  /** 試合終了時: turnWindData全体からサマリーを算出 */
  calcSummary(turnWindData) {
    if (!turnWindData || turnWindData.length === 0) return null;

    const speeds = turnWindData.map(d => d.windSpeed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);

    // compass_valid=trueの投擲のみで風向き集計
    const validTurns = turnWindData.filter(d => d.compassValid);

    // 最頻出カテゴリ（投擲方向基準）
    const catCounts = {};
    validTurns.forEach(d => {
      if (d.windCategory) {
        catCounts[d.windCategory] = (catCounts[d.windCategory] || 0) + 1;
      }
    });
    const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    const dominantCategory = catEntries.length > 0 ? catEntries[0][0] : "unknown";

    // 最頻出絶対風向き（8方位）
    const absCounts = {};
    validTurns.forEach(d => {
      if (d.absoluteCategory) {
        absCounts[d.absoluteCategory] = (absCounts[d.absoluteCategory] || 0) + 1;
      }
    });
    const absEntries = Object.entries(absCounts).sort((a, b) => b[1] - a[1]);
    const dominantAbsoluteDirection = absEntries.length > 0 ? absEntries[0][0] : "N";

    return {
      avgWindSpeed: Math.round(avgSpeed * 10) / 10,
      maxWindSpeed: Math.round(maxSpeed * 10) / 10,
      dominantCategory,
      dominantAbsoluteDirection,
      sampleCount: turnWindData.length,
      compassValidCount: validTurns.length,
    };
  }
}

// ═══ Molkky Wind Display Helpers ═══

/**
 * モルック相対方位を計算する
 * @param {number} windDirection - Calypso が報告する風向き（センサー三角マーク基準、度）
 * @param {number} compassHeading - QMC5883L の現在の方位（度）
 * @param {number} throwDirection - スキットル方向の方位（度）
 * @returns {{ label: string, color: string, degrees: number }}
 */
export function calcMolkkyWind(windDirection, compassHeading, throwDirection) {
  // 絶対風向（風が吹いてくる方向）
  const absoluteWindFrom = (windDirection + compassHeading) % 360;
  // 風が流れていく方向
  const windFlowDirection = (absoluteWindFrom + 180) % 360;
  // スキットル方向を基準とした相対角度
  const relativeAngle = ((windFlowDirection - throwDirection) % 360 + 360) % 360;
  // 8方位インデックス
  const index = Math.round(relativeAngle / 45) % 8;

  const labels = ["追", "追右", "右", "向右", "向", "向左", "左", "追左"];
  const colors = [
    "#5eead4", // 追（ティール）
    "#67e8f9", // 追右（シアン）
    "#60a5fa", // 右（ブルー）
    "#818cf8", // 向右（インディゴ）
    "#c084fc", // 向（パープル）
    "#818cf8", // 向左（インディゴ）
    "#60a5fa", // 左（ブルー）
    "#67e8f9", // 追左（シアン）
  ];

  return {
    label: labels[index],
    color: colors[index],
    degrees: relativeAngle,
  };
}

/**
 * 風表示ウィジェットに必要なデータが揃っているか判定する
 * @param {object|null} currentWind - windSensorManager.currentWind
 * @returns {boolean}
 */
export function isWindDisplayReady(currentWind) {
  if (!currentWind) return false;
  if (!currentWind.connected) return false;
  if (currentWind.throw_direction == null) return false;
  if (currentWind.wind_speed == null) return false;
  if (currentWind.wind_direction == null) return false;
  return true;
}

/**
 * 風速カテゴリに応じた Wind Ramp 色を返す
 * @param {number|null|undefined} windSpeed - 風速 (m/s)
 * @returns {string|null} Wind Ramp の hex 色。windSpeed が number でない、
 *                        または NaN/Infinity の場合は null を返す（呼び出し側で
 *                        グレー等のフォールバックを適用する想定）。
 *
 * 閾値（DESIGN.md §2.5 Wind Sensor Colors と共通、単一の真実源）:
 *   speed <  2.0 → CALM      (#34d399 = --wind-calm)
 *   speed <  4.0 → MODERATE  (#fbbf24 = --wind-moderate)
 *   speed <  6.0 → STRONG    (#f97316 = --wind-strong)
 *   speed >= 6.0 → SEVERE    (#ef4444 = --wind-severe)
 *
 * 境界値（ちょうど 2.0 / 4.0 / 6.0）は上位カテゴリに属する（< 未満方式）。
 *
 * SVG fill 属性での var() 解決はブラウザ実装依存で不安定なため、
 * 本関数は hex 直書きを返す。--wind-* トークン定義は styles.css 側で
 * 管理され、将来の色変更時は両方を同時更新する運用（C-a と同方針）。
 *
 * WindMonitor Hero 数値（§9.3.4）および GameScreen Wind Vector Widget
 * （§9.2.5、C-e で実装予定）の両方から呼ばれる。
 */
export function getWindRampColor(windSpeed) {
  if (typeof windSpeed !== "number" || !isFinite(windSpeed)) return null;
  if (windSpeed < 2.0) return "#34d399";
  if (windSpeed < 4.0) return "#fbbf24";
  if (windSpeed < 6.0) return "#f97316";
  return "#ef4444";
}

export default WindSensorManager;
