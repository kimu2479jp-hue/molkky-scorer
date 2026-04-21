import React, { useEffect, useMemo, useRef, useState } from "react";
import { WindSensorManager, getWindRampColor } from "../windSensor.js";

/* Phase 3 実装。航海計器風ダークテーマの風速モニターモーダル。
 * 1Hz で WebSocket から風データを受信し、コンパスローズ・風速数値・
 * 統計カード・推移グラフで表示する。
 */

const DIRECTION_ITEMS = [
  { angle:   0, text: "追",   color: "#5eead4" },
  { angle:  45, text: "追右", color: "#67e8f9" },
  { angle:  90, text: "右",   color: "#60a5fa" },
  { angle: 135, text: "向右", color: "#818cf8" },
  { angle: 180, text: "向",   color: "#c084fc" },
  { angle: 225, text: "向左", color: "#818cf8" },
  { angle: 270, text: "左",   color: "#60a5fa" },
  { angle: 315, text: "追左", color: "#67e8f9" },
];

function calcRelativeWind(data) {
  if (!data || !data.compass_valid || data.throw_direction == null) {
    return null;
  }
  if (typeof data.wind_direction !== "number" || typeof data.compass_heading !== "number") {
    return null;
  }
  const absoluteWindFrom = ((data.wind_direction + data.compass_heading) % 360 + 360) % 360;
  const windFlowDirection = (absoluteWindFrom + 180) % 360;
  const relativeAngle = ((windFlowDirection - data.throw_direction) % 360 + 360) % 360;
  const index = Math.round(relativeAngle / 45) % 8;
  const item = DIRECTION_ITEMS[index];
  return {
    label: item.text,
    color: item.color,
    angle: relativeAngle,
    index,
    absoluteWindFrom,
  };
}

function polarToSvg(degree, r, cx, cy) {
  const rad = (degree - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function batteryColor(pct) {
  if (pct == null) return "#6b7280";
  if (pct < 20) return "var(--wind-severe)";
  if (pct < 50) return "#eab308";
  return "var(--wind-calm)";
}

function StatCard({ label, value, color, isTablet }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      background: "#111827",
      borderRadius: 8,
      padding: isTablet ? "14px 12px" : "11px 8px",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 11,
        color: "#6b7280",
        fontWeight: 700,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}>{label}</div>
      <div style={{
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
        fontSize: isTablet ? 24 : 22,
        fontWeight: 700,
        color,
        marginTop: 4,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
      }}>{value}</div>
    </div>
  );
}

export function WindMonitorModal({ isOpen, onClose, piAddress, windDebugEnabled, onWindDebugLog }) {
  const managerRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isTablet, setIsTablet] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  // WebSocket 接続ライフサイクル
  useEffect(() => {
    if (!isOpen) return;
    if (!piAddress || !piAddress.trim()) return;

    const manager = new WindSensorManager();
    managerRef.current = manager;

    manager.onDataCallback = (data) => {
      if (!data) return;
      if (data.type && data.type !== "wind_data") return;
      setCurrentData(data);
      if (typeof data.wind_speed === "number") {
        setHistory(prev => {
          const next = prev.length >= 300 ? prev.slice(1) : prev.slice();
          next.push(data);
          return next;
        });
      }
    };
    manager.onStatusCallback = (status) => {
      setConnected(!!(status && status.connected));
    };
    if (windDebugEnabled && onWindDebugLog) {
      manager.onDebugLogCallback = (logs) => onWindDebugLog(logs);
    }
    manager.connect(piAddress.trim());

    return () => {
      manager.onDataCallback = null;
      manager.onStatusCallback = null;
      manager.onDebugLogCallback = null;
      try { manager.disconnect(); } catch (e) {}
      managerRef.current = null;
      setConnected(false);
      setCurrentData(null);
      setHistory([]);
    };
    // onWindDebugLog / windDebugEnabled を deps に入れると親再レンダーで再接続されるため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, piAddress]);

  // リサイズリスナー
  useEffect(() => {
    const onResize = () => setIsTablet(window.innerWidth >= 768);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // 統計値
  const stats = useMemo(() => {
    if (history.length === 0) return { maxSpeed: null, avgSpeed: null, sampleCount: 0 };
    let max = 0, sum = 0;
    for (const d of history) {
      const s = typeof d.wind_speed === "number" ? d.wind_speed : 0;
      if (s > max) max = s;
      sum += s;
    }
    return {
      maxSpeed: max,
      avgSpeed: sum / history.length,
      sampleCount: history.length,
    };
  }, [history]);

  // 相対方位
  const relativeWind = useMemo(() => calcRelativeWind(currentData), [currentData]);

  // 3秒間隔のサンプリング
  const samples = useMemo(() => {
    const out = [];
    for (let i = 0; i < history.length; i += 3) out.push(history[i]);
    if (history.length > 0 && (history.length - 1) % 3 !== 0) {
      out.push(history[history.length - 1]);
    }
    return out;
  }, [history]);

  if (!isOpen) return null;

  // サイズ変数
  const compassSize = isTablet ? 280 : 220;
  const cx = compassSize / 2;
  const cy = compassSize / 2;
  const outerR = compassSize * 0.42;
  const arrowR = compassSize * 0.35; // 半径の 70% の半分（中心から先端まで）
  const labelR = compassSize * 0.47;

  // 矢印 path（真上向きで定義）
  const tip = cy - arrowR;
  const base = cy + arrowR * 0.15;
  const headW = compassSize * 0.055;
  const headH = compassSize * 0.07;
  const shaftW = compassSize * 0.012;
  const arrowPath =
    "M " + cx + " " + tip +
    " L " + (cx + headW) + " " + (tip + headH) +
    " L " + (cx + shaftW) + " " + (tip + headH) +
    " L " + (cx + shaftW) + " " + base +
    " L " + (cx - shaftW) + " " + base +
    " L " + (cx - shaftW) + " " + (tip + headH) +
    " L " + (cx - headW) + " " + (tip + headH) + " Z";

  // 矢印表示判定
  const showArrow = connected
    && relativeWind !== null
    && currentData
    && typeof currentData.wind_speed === "number"
    && currentData.wind_speed > 0;

  // コンパス中央テキスト
  let centerText;
  let centerColor;
  if (!connected) {
    centerText = "切断中";
    centerColor = "#6b7280";
  } else if (currentData && currentData.compass_valid === false) {
    centerText = "⚠ コンパス異常";
    centerColor = "#eab308";
  } else if (currentData && currentData.throw_direction == null) {
    centerText = "基準方向未設定";
    centerColor = "#6b7280";
  } else if (relativeWind) {
    centerText = relativeWind.label;
    centerColor = relativeWind.color;
  } else {
    centerText = "---";
    centerColor = "#6b7280";
  }

  // サブタイトル
  let subText;
  let subColor;
  if (!connected) {
    subText = "スキットル方向 = ---";
    subColor = "#6b7280";
  } else if (currentData && currentData.throw_direction == null) {
    subText = "スキットル方向 = 未設定";
    subColor = "#6b7280";
  } else if (currentData && currentData.compass_valid === false) {
    subText = "スキットル方向 = コンパス異常";
    subColor = "#eab308";
  } else if (relativeWind) {
    subText = "スキットル方向 = " + relativeWind.label;
    subColor = relativeWind.color;
  } else {
    subText = "スキットル方向 = ---";
    subColor = "#6b7280";
  }

  // 風速推移グラフ設定
  const chartH = isTablet ? 140 : 120;
  const marginL = isTablet ? 36 : 32;
  const marginR = 12;
  const marginT = 12;
  const marginB = 24;
  const chartW = 600; // viewBox 幅（SVG は width="100%" で自動スケール）
  const plotW = chartW - marginL - marginR;
  const plotH = chartH - marginT - marginB;

  // Y軸スケール
  const maxObservedSpeed = history.length > 0
    ? Math.max(...history.map(d => typeof d.wind_speed === "number" ? d.wind_speed : 0))
    : 0;
  const yMax = Math.max(3.0, maxObservedSpeed * 1.2);
  const yOf = (speed) => marginT + plotH * (1 - Math.min(Math.max(speed, 0), yMax) / yMax);

  // X軸スケール (timestamp ベース、直近5分固定ウィンドウ)
  const WINDOW_MS = 5 * 60 * 1000;
  const nowMs = Date.now();
  const xMin = nowMs - WINDOW_MS;
  const xOfSample = (sample) => {
    const t = sample && sample.timestamp ? new Date(sample.timestamp).getTime() : NaN;
    if (!isFinite(t)) return NaN;
    return marginL + ((t - xMin) / WINDOW_MS) * plotW;
  };

  // 描画対象 sample (タイムスタンプが有効なもの)
  const validSamples = samples.filter(s => {
    const t = s && s.timestamp ? new Date(s.timestamp).getTime() : NaN;
    return isFinite(t);
  });

  // 折れ線 path 構築
  let lineD = "";
  let fillD = "";
  if (validSamples.length >= 2) {
    const points = validSamples.map(s => ({
      x: xOfSample(s),
      y: yOf(typeof s.wind_speed === "number" ? s.wind_speed : 0),
    }));
    lineD = points.map((p, i) => (i === 0 ? "M " : "L ") + p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" ");
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    fillD = lineD
      + " L " + lastX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
      + " L " + firstX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
      + " Z";
  }

  return (
    <>
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0f1a",
        overflowY: "auto",
        color: "#e2e8f0",
        WebkitOverflowScrolling: "touch",
      }}>
        {/* ① ヘッダーバー */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#111827",
          borderBottom: "1px solid #1e293b",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 10,
              background: "transparent",
              color: "#94a3b8",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 36,
            }}
          >
            ← 閉じる
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: connected ? "#34d399" : "#ef4444",
              boxShadow: connected
                ? "0 0 8px rgba(52,211,153,0.6)"
                : "0 0 8px rgba(239,68,68,0.5)",
              animation: connected ? "none" : "wind-monitor-blink 3s ease-in-out infinite",
            }}/>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: connected ? "#34d399" : "#ef4444",
              letterSpacing: 0.5,
            }}>
              {connected ? "接続中" : "切断中"}
            </span>
          </div>
        </div>

        {/* ② タイトルセクション */}
        <div style={{ textAlign: "center", marginTop: 16, padding: "0 16px" }}>
          <div style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: 0.5,
          }}>
            風速モニター
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: subColor,
            marginTop: 4,
          }}>
            {subText}
          </div>
        </div>

        {/* ③ 風速メイン数値 */}
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <span style={{
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
            fontSize: isTablet ? 72 : 56,
            fontWeight: 700,
            color: (connected && currentData && typeof currentData.wind_speed === "number")
              ? (getWindRampColor(currentData.wind_speed) || "#6b7280")
              : "#6b7280",
            letterSpacing: -2,
            lineHeight: 1,
          }}>
            {connected && currentData && typeof currentData.wind_speed === "number"
              ? currentData.wind_speed.toFixed(1)
              : "---"}
          </span>
          <span style={{
            fontSize: 18,
            color: "#6b7280",
            marginLeft: 6,
            fontWeight: 600,
          }}>m/s</span>
        </div>

        {/* ④ コンパスローズ */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <svg
            width={compassSize}
            height={compassSize}
            viewBox={"0 0 " + compassSize + " " + compassSize}
            style={{ display: "block" }}
          >
            {/* 外周リング */}
            <circle
              cx={cx}
              cy={cy}
              r={outerR}
              stroke="#1e293b"
              strokeWidth={2}
              fill="none"
            />
            {/* 8方位 tick */}
            {DIRECTION_ITEMS.map(item => {
              const inner = polarToSvg(item.angle, outerR - 6, cx, cy);
              const outer = polarToSvg(item.angle, outerR, cx, cy);
              return (
                <line
                  key={"tick-" + item.angle}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="#1e293b"
                  strokeWidth={1.5}
                />
              );
            })}
            {/* 8方位ラベル */}
            {DIRECTION_ITEMS.map((item, i) => {
              const p = polarToSvg(item.angle, labelR, cx, cy);
              const highlighted = relativeWind && relativeWind.index === i;
              return (
                <text
                  key={"label-" + item.angle}
                  x={p.x}
                  y={p.y}
                  fill={item.color}
                  fontSize={highlighted ? 14 : 12}
                  fontWeight={highlighted ? 800 : 600}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ userSelect: "none" }}
                >
                  {item.text}
                </text>
              );
            })}
            {/* 矢印 */}
            {showArrow && (
              <g
                style={{
                  transform: "rotate(" + relativeWind.angle + "deg)",
                  transformOrigin: cx + "px " + cy + "px",
                  transition: "transform 0.3s ease",
                }}
              >
                <path d={arrowPath} fill={relativeWind.color} />
              </g>
            )}
            {/* 中央テキスト */}
            <text
              x={cx}
              y={cy}
              fill={centerColor}
              fontSize={24}
              fontWeight={700}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ userSelect: "none" }}
            >
              {centerText}
            </text>
          </svg>
        </div>

        {/* ⑤ 統計カード 3列 */}
        <div style={{
          display: "flex",
          gap: 12,
          padding: "0 16px",
          marginTop: 20,
        }}>
          <StatCard
            isTablet={isTablet}
            label="最大"
            value={stats.maxSpeed != null ? stats.maxSpeed.toFixed(1) + " m/s" : "---"}
            color={stats.maxSpeed != null ? "#f59e0b" : "#6b7280"}
          />
          <StatCard
            isTablet={isTablet}
            label="平均"
            value={stats.avgSpeed != null ? stats.avgSpeed.toFixed(1) + " m/s" : "---"}
            color={stats.avgSpeed != null ? "var(--wind-calm)" : "#6b7280"}
          />
          <StatCard
            isTablet={isTablet}
            label="バッテリー"
            value={currentData && typeof currentData.battery === "number"
              ? Math.round(currentData.battery) + "%"
              : "---"}
            color={currentData && typeof currentData.battery === "number"
              ? batteryColor(currentData.battery)
              : "#6b7280"}
          />
        </div>

        {/* ⑥ 風速推移グラフ */}
        <div style={{ padding: "0 16px", marginTop: 20 }}>
          <svg
            width="100%"
            height={chartH}
            viewBox={"0 0 " + chartW + " " + chartH}
            preserveAspectRatio="none"
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="windMonitorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
              <clipPath id="windMonitorClip">
                <rect x={marginL} y={marginT} width={plotW} height={plotH} />
              </clipPath>
              <clipPath id="windMonitorBandClip">
                <rect x={marginL} y={chartH - marginB - 4} width={plotW} height={4} />
              </clipPath>
            </defs>

            {/* Y軸グリッド */}
            <line
              x1={marginL}
              y1={marginT}
              x2={marginL + plotW}
              y2={marginT}
              stroke="#1e293b"
              strokeDasharray="2 4"
            />
            <line
              x1={marginL}
              y1={marginT + plotH / 2}
              x2={marginL + plotW}
              y2={marginT + plotH / 2}
              stroke="#1e293b"
              strokeDasharray="2 4"
            />
            <line
              x1={marginL}
              y1={marginT + plotH}
              x2={marginL + plotW}
              y2={marginT + plotH}
              stroke="#1e293b"
              strokeDasharray="2 4"
            />

            {/* Y軸最大値ラベル */}
            <text
              x={marginL - 4}
              y={marginT + 4}
              fill="#475569"
              fontSize={10}
              textAnchor="end"
              dominantBaseline="hanging"
            >
              {yMax.toFixed(1)}
            </text>
            <text
              x={marginL - 4}
              y={marginT + plotH}
              fill="#475569"
              fontSize={10}
              textAnchor="end"
              dominantBaseline="baseline"
            >
              0
            </text>

            {/* 折れ線＋塗りつぶし */}
            {validSamples.length >= 2 ? (
              <g clipPath="url(#windMonitorClip)">
                <path d={fillD} fill="url(#windMonitorGrad)" />
                <path
                  d={lineD}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              <text
                x={marginL + plotW / 2}
                y={marginT + plotH / 2}
                fill="#475569"
                fontSize={12}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {connected ? "データ収集中..." : "未接続"}
              </text>
            )}

            {/* 風向き色帯 */}
            {validSamples.length >= 2 && (() => {
              const bandY = chartH - marginB - 4;
              const rightEdge = marginL + plotW;
              const points = validSamples.map(s => ({
                x: xOfSample(s),
                color: (() => {
                  const rw = calcRelativeWind(s);
                  return rw ? rw.color : "#334155";
                })(),
              }));
              return (
                <g clipPath="url(#windMonitorBandClip)">
                  {points.map((p, i) => {
                    const x1 = p.x;
                    const x2 = i < points.length - 1 ? points[i + 1].x : rightEdge;
                    const w = Math.max(0, x2 - x1);
                    return (
                      <rect
                        key={"band-" + i}
                        x={x1}
                        y={bandY}
                        width={w}
                        height={4}
                        fill={p.color}
                      />
                    );
                  })}
                </g>
              );
            })()}

            {/* X軸ラベル（固定位置 4点） */}
            <text
              x={marginL}
              y={chartH - 6}
              fill="#475569"
              fontSize={10}
              textAnchor="start"
            >
              5分前
            </text>
            <text
              x={marginL + plotW * 0.4}
              y={chartH - 6}
              fill="#475569"
              fontSize={10}
              textAnchor="middle"
            >
              3分前
            </text>
            <text
              x={marginL + plotW * 0.8}
              y={chartH - 6}
              fill="#475569"
              fontSize={10}
              textAnchor="middle"
            >
              1分前
            </text>
            <text
              x={marginL + plotW}
              y={chartH - 6}
              fill="#475569"
              fontSize={10}
              textAnchor="end"
            >
              今
            </text>
          </svg>
        </div>

        {/* ⑦ フッター */}
        <div style={{
          textAlign: "center",
          color: "#475569",
          fontSize: 12,
          marginTop: 16,
          paddingBottom: 24,
        }}>
          1秒ごとに自動更新
        </div>
      </div>
    </>
  );
}

export default WindMonitorModal;
