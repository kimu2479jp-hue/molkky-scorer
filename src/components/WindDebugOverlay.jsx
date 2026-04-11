import React, { useState, useEffect, useRef } from "react";

export function WindDebugOverlay({ logs, connected, piAddress }) {
  const [minimized, setMinimized] = useState(false);
  const [localLogs, setLocalLogs] = useState(logs || []);
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logs) setLocalLogs(logs);
  }, [logs]);

  useEffect(() => {
    if (!minimized && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [localLogs, minimized]);

  const swStatus = (typeof navigator !== "undefined" && navigator.serviceWorker && navigator.serviceWorker.controller) ? "active" : "none";
  const proto = typeof location !== "undefined" ? location.protocol : "?";

  const getLineColor = (line) => {
    const lower = line.toLowerCase();
    if (lower.includes("url:")) return "#ffff00";
    if (lower.includes("error") || lower.includes("onerror") || lower.includes("onclose")) return "#ff4444";
    if (lower.includes("onopen") || lower.includes("connected")) return "#44ff44";
    return "#00ff00";
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 10,
      right: 10,
      width: 350,
      maxHeight: "50vh",
      background: "rgba(0, 0, 0, 0.85)",
      color: "#00ff00",
      fontFamily: "monospace",
      fontSize: 11,
      zIndex: 99999,
      borderRadius: 8,
      padding: 8,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 4,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>Wind WS Debug</span>
          <span style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: connected ? "#44ff44" : "#ff4444",
          }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setLocalLogs([])}
            style={{
              background: "transparent",
              border: "1px solid #00ff00",
              color: "#00ff00",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >Clear</button>
          <button
            onClick={() => setMinimized(!minimized)}
            style={{
              background: "transparent",
              border: "1px solid #00ff00",
              color: "#00ff00",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >{minimized ? "+" : "-"}</button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Info */}
          <div style={{
            fontSize: 10,
            color: "#aaaaaa",
            marginBottom: 4,
            borderBottom: "1px solid #333",
            paddingBottom: 4,
            flexShrink: 0,
          }}>
            <div>SW: {swStatus} | Proto: {proto} | Pi: {piAddress || "none"}</div>
          </div>

          {/* Logs */}
          <div style={{
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}>
            {localLogs.map((line, i) => (
              <div key={i} style={{
                color: getLineColor(line),
                wordBreak: "break-all",
                lineHeight: 1.3,
              }}>{line}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </>
      )}
    </div>
  );
}
