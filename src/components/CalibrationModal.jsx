import React, { useState, useEffect } from "react";

/* エラー理由 → 日本語メッセージ */
const ERROR_MESSAGES = {
  timeout: "回転が不十分です。もう一度お試しください。",
  no_compass: "コンパスセンサーが検出されません。Raspberry Piの接続を確認してください。",
  already_running: "別のデバイスでキャリブレーション中です。",
  config_write_failed: "設定の保存に失敗しました。Raspberry Piのストレージを確認してください。",
  ws_not_open: "Raspberry Piとの接続が確立されていません。もう一度お試しください。",
};

function getErrorMessage(reason) {
  return ERROR_MESSAGES[reason] || "予期しないエラーが発生しました。";
}

/* 円形プログレスリング（SVG、外部依存なし）
 *  value: 0.0〜1.0
 */
function CircularProgress({ value }) {
  const size = 180;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circumference * (1 - clamped);
  const percent = Math.round(clamped * 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ffc107"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s linear" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{percent}%</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)", marginTop: 4, letterSpacing: 1 }}>
          COVERAGE
        </div>
      </div>
    </div>
  );
}

export function CalibrationModal({ isOpen, onClose, windSensorManager }) {
  // "guide" | "running" | "done" | "error"
  const [step, setStep] = useState("guide");
  const [coverage, setCoverage] = useState(0);
  const [errorReason, setErrorReason] = useState("");

  // モーダルオープン時: state リセット + コールバック登録
  useEffect(() => {
    if (!isOpen) return;
    setStep("guide");
    setCoverage(0);
    setErrorReason("");
    if (!windSensorManager) return;
    windSensorManager.onCalibrateProgressCallback = (cov) => {
      setCoverage(typeof cov === "number" ? cov : 0);
    };
    windSensorManager.onCalibrateDoneCallback = () => {
      setStep("done");
    };
    windSensorManager.onCalibrateErrorCallback = (reason) => {
      setErrorReason(reason || "");
      setStep("error");
    };
    return () => {
      // モーダルクローズ時: コールバッククリーンアップ
      // disconnect() は SetupScreen 側の closeCalibration() の責務
      if (windSensorManager) {
        windSensorManager.onCalibrateProgressCallback = null;
        windSensorManager.onCalibrateDoneCallback = null;
        windSensorManager.onCalibrateErrorCallback = null;
      }
    };
  }, [isOpen, windSensorManager]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (!windSensorManager) {
      setErrorReason("ws_not_open");
      setStep("error");
      return;
    }
    const ok = windSensorManager.startCalibration();
    if (ok) {
      setCoverage(0);
      setStep("running");
    } else {
      setErrorReason("ws_not_open");
      setStep("error");
    }
  };

  const handleRetry = () => {
    setStep("guide");
    setCoverage(0);
    setErrorReason("");
  };

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9500,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  };

  const cardStyle = {
    position: "relative",
    background: "#0f1a2e",
    borderRadius: 20,
    padding: "28px 28px 24px",
    maxWidth: 440,
    width: "100%",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
  };

  const closeBtnStyle = {
    position: "absolute",
    top: 14,
    left: 14,
    padding: "6px 12px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.3,
  };

  const primaryBtnStyle = {
    width: "100%",
    padding: "16px 0",
    border: "none",
    borderRadius: 12,
    background: "#ffc107",
    color: "#14365a",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: 2,
    marginTop: 24,
    boxShadow: "0 4px 18px rgba(255,193,7,0.25)",
  };

  const secondaryBtnStyle = {
    width: "100%",
    padding: "14px 0",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 10,
    background: "transparent",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 10,
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={closeBtnStyle} onClick={onClose}>
          ← 閉じる
        </button>

        {step === "guide" && (
          <div style={{ paddingTop: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#ffc107", textAlign: "center" }}>
              CALIBRATION
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginTop: 6 }}>
              コンパスキャリブレーション
            </div>
            <div
              style={{
                marginTop: 22,
                padding: "16px 18px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 14,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontSize: 20, lineHeight: 1.3 }}>🧭</div>
                <div>
                  Raspberry Pi本体を<strong style={{ color: "#ffc107" }}>ゆっくり水平に360°回転</strong>させてください。回転中は端末を傾けないでください。
                </div>
              </div>
            </div>
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 10,
                background: "rgba(255,193,7,0.08)",
                border: "1px solid rgba(255,193,7,0.25)",
                fontSize: 12,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.6,
              }}
            >
              初回セットアップ時、または風速計の設置構成を変えた時のみ実行してください。
            </div>
            <button type="button" style={primaryBtnStyle} onClick={handleStart}>
              開始
            </button>
          </div>
        )}

        {step === "running" && (
          <div style={{ paddingTop: 36, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <CircularProgress value={coverage} />
            <div style={{ marginTop: 22, fontSize: 16, fontWeight: 700, color: "#fff", textAlign: "center" }}>
              回転中... ゆっくり1周させてください
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "rgba(255,255,255,0.5)",
                textAlign: "center",
                letterSpacing: 0.5,
              }}
            >
              端末は傾けずに水平を保ってください
            </div>
          </div>
        )}

        {step === "done" && (
          <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "rgba(34,181,102,0.15)",
                border: "2px solid #22b566",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 52,
                color: "#22b566",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              ✓
            </div>
            <div style={{ marginTop: 22, fontSize: 22, fontWeight: 800, color: "#fff" }}>
              キャリブレーション完了
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
              }}
            >
              オフセット値を保存しました
            </div>
            <button type="button" style={{ ...primaryBtnStyle, background: "#22b566", color: "#fff", marginTop: 28 }} onClick={onClose}>
              閉じる
            </button>
          </div>
        )}

        {step === "error" && (
          <div style={{ paddingTop: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                background: "rgba(239,68,68,0.12)",
                border: "2px solid #ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 44,
                color: "#ef4444",
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              !
            </div>
            <div
              style={{
                marginTop: 22,
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                textAlign: "center",
                lineHeight: 1.6,
                padding: "0 4px",
              }}
            >
              {getErrorMessage(errorReason)}
            </div>
            <button type="button" style={{ ...primaryBtnStyle, marginTop: 24 }} onClick={handleRetry}>
              やり直す
            </button>
            <button type="button" style={secondaryBtnStyle} onClick={onClose}>
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CalibrationModal;
