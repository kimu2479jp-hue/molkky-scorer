import React from "react";

/* Phase 2 骨組み。Phase 3 でこのファイルの中身を実際の WindMonitor 実装に差し替える。
 * Phase 2 時点では WebSocket 接続しない。
 */
export function WindMonitorModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9500,
        background: "#0a0f1a",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: "14px 16px" }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: "8px 14px",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 10,
            background: "transparent",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← 閉じる
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 36 }}>🌬</div>
        <div style={{ marginTop: 12, fontSize: 20, fontWeight: 800, color: "#fff", textAlign: "center" }}>
          風速モニター
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          Phase 3 で実装
        </div>
      </div>
    </div>
  );
}

export default WindMonitorModal;
