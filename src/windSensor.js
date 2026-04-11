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

  /** 接続テスト: 一時的にWebSocket接続して結果を返す */
  testConnection(address, timeout = 5000) {
    this._log("testConnection() called with: " + address);
    return new Promise((resolve) => {
      let ws = null;
      let done = false;
      const cleanup = () => {
        done = true;
        if (ws) {
          try { ws.onclose = null; ws.onerror = null; ws.onmessage = null; ws.close(); } catch (e) {}
          ws = null;
        }
      };
      const timer = setTimeout(() => {
        if (!done) {
          this._log("testConnection timeout (" + timeout + "ms)");
          cleanup();
          resolve({ ok: false, detail: "5秒以内に応答なし" });
        }
      }, timeout);
      try {
        const wsUrl = address.startsWith("wss://") || address.startsWith("ws://") ? address : "ws://" + address + ":" + WIND_WS_PORT;
        this._log("testConnection URL: " + wsUrl);
        ws = new WebSocket(wsUrl);
        this._log("testConnection WebSocket created");
        ws.onopen = () => {
          this._log("testConnection onopen");
        };
        ws.onmessage = (event) => {
          if (done) return;
          clearTimeout(timer);
          const preview = typeof event.data === "string" ? event.data.slice(0, 100) : "";
          this._log("testConnection message: " + preview);
          try {
            const data = JSON.parse(event.data);
            const speed = data.wind_speed != null ? data.wind_speed.toFixed(1) : "?";
            const compass = data.compass_valid ? "OK" : "NG";
            cleanup();
            resolve({ ok: true, detail: "風速 " + speed + " m/s / コンパス " + compass });
          } catch (e) {
            cleanup();
            resolve({ ok: true, detail: "データ受信OK" });
          }
        };
        ws.onerror = (event) => {
          if (done) return;
          this._log("testConnection onerror - type: " + event.type);
          clearTimeout(timer);
          cleanup();
          resolve({ ok: false, detail: "接続エラー" });
        };
        ws.onclose = (event) => {
          if (done) return;
          this._log("testConnection onclose - code: " + event.code + ", reason: " + event.reason);
        };
      } catch (e) {
        this._log("testConnection catch error: " + e.message);
        clearTimeout(timer);
        cleanup();
        resolve({ ok: false, detail: "WebSocket作成エラー" });
      }
    });
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
          this.currentWind = data;
          this.compassValid = !!data.compass_valid;
          this.windBuffer.push(data);
          if (this.windBuffer.length > WIND_BUFFER_SIZE) this.windBuffer.shift();
          if (this.onDataCallback) this.onDataCallback(data);
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

export default WindSensorManager;
