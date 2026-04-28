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
  if (pct == null) return "var(--wind-battery-null)";
  if (pct < 20) return "var(--wind-severe)";
  if (pct < 50) return "var(--wind-battery-mid)";
  return "var(--wind-calm)";
}

function formatElapsed(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function formatTimestamp(isoOrDate) {
  if (!isoOrDate) return "--:--";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "--:--";
  const pad = (n) => String(n).padStart(2, "0");
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function getWindRampLabel(windSpeed) {
  if (typeof windSpeed !== "number" || !isFinite(windSpeed)) return "---";
  if (windSpeed < 2.0) return "CALM";
  if (windSpeed < 4.0) return "MODERATE";
  if (windSpeed < 6.0) return "STRONG";
  return "SEVERE";
}

/* ───────── CompassGauge (size 可変、prefix で SVG ID 衝突回避) ─────────
 * 三重リング金属ベゼル + 72 本階層ティック + BLADE NEEDLE +
 * セクター放射グラデ(bearing ± 12°) + BEARING 数値表示 + ハブディテール
 */
const CompassGauge = ({ prefix, size = 260, bearing = 45 }) => {
  const CX = size / 2, CY = size / 2, k = size / 340;

  // 針の滑らか回転（UI改善）:
  // CSS transition で 500ms かけて新角度へ補間する。
  // 0°↔359° 境界で長回り（例: 358°→1° で +3° ではなく -357° に動く）を避けるため、
  // 累積角度（rotate に渡す値が 360° を超えても良い）を維持し、
  // 新 bearing との差分を「最短経路（-180°〜+180°）」に正規化して加算する。
  // useRef を使うのは state にすると bearing 変化のたびに再レンダーが余計に走るため。
  // bearing prop の変化検知でガードを入れることで StrictMode の二重実行に対応。
  const prevBearingRef = useRef(bearing);
  const cumulativeBearingRef = useRef(bearing);
  if (bearing !== prevBearingRef.current) {
    // 最短差分: ((diff % 360) + 540) % 360 - 180 で -180〜+180 に正規化
    const diff = ((bearing - prevBearingRef.current) % 360 + 540) % 360 - 180;
    cumulativeBearingRef.current += diff;
    prevBearingRef.current = bearing;
  }
  const renderedBearing = cumulativeBearingRef.current;

  const rOuter = 156 * k, rRing = 150 * k, rSep = 128 * k, rInner = 100 * k, rFace = 94 * k;
  const rDegText = 137 * k, rDirText = 112 * k;
  const tickAngles = Array.from({ length: 72 }, (_, i) => i * 5);
  const degLabels = [30, 60, 120, 150, 210, 240, 300, 330];
  const directions = [
    { angle: 0, text: "追" }, { angle: 45, text: "追右" },
    { angle: 90, text: "右" }, { angle: 135, text: "向右" },
    { angle: 180, text: "向" }, { angle: 225, text: "向左" },
    { angle: 270, text: "左" }, { angle: 315, text: "追左" },
  ];
  const idF = `${prefix}_face`, idB = `${prefix}_bez`, idS = `${prefix}_sec`;
  const idBL = `${prefix}_bl`, idBD = `${prefix}_bd`, idT = `${prefix}_tail`, idH = `${prefix}_hub`;
  const rad = (d) => ((d - 90) * Math.PI) / 180;
  const p = (r, d) => ({ x: CX + r * Math.cos(rad(d)), y: CY + r * Math.sin(rad(d)) });
  const half = 12;
  const a1 = p(rRing - 1, bearing - half), a2 = p(rRing - 1, bearing + half);
  const b2 = p(rSep + 1, bearing + half), b1 = p(rSep + 1, bearing - half);
  const secD = `M ${a1.x} ${a1.y} A ${rRing - 1} ${rRing - 1} 0 0 1 ${a2.x} ${a2.y} L ${b2.x} ${b2.y} A ${rSep + 1} ${rSep + 1} 0 0 0 ${b1.x} ${b1.y} Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={idF} cx="0.5" cy="0.42" r="0.65">
          <stop offset="0%" stopColor="var(--wind-bg-panel)" />
          <stop offset="70%" stopColor="var(--wind-bg-base)" />
          <stop offset="100%" stopColor="var(--wind-shadow-deep)" />
        </radialGradient>
        <linearGradient id={idB} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--wind-text-dim)" />
          <stop offset="50%" stopColor="var(--wind-edge)" />
          <stop offset="100%" stopColor="var(--wind-bg-surface)" />
        </linearGradient>
        <radialGradient id={idS} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--wind-accent)" stopOpacity="0" />
          <stop offset="60%" stopColor="var(--wind-accent)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--wind-accent)" stopOpacity="0.32" />
        </radialGradient>
        <linearGradient id={idBL} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--wind-accent-hi)" />
          <stop offset="45%" stopColor="var(--wind-accent)" />
          <stop offset="100%" stopColor="var(--wind-accent-lo)" />
        </linearGradient>
        <linearGradient id={idBD} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--wind-text-dim)" />
          <stop offset="100%" stopColor="var(--wind-edge)" />
        </linearGradient>
        <linearGradient id={idT} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--wind-text-dim)" />
          <stop offset="100%" stopColor="var(--wind-edge)" />
        </linearGradient>
        <radialGradient id={idH} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="var(--wind-edge)" />
          <stop offset="100%" stopColor="var(--wind-shadow-deep)" />
        </radialGradient>
      </defs>

      <circle cx={CX} cy={CY} r={rOuter} fill={`url(#${idF})`} />
      <circle cx={CX} cy={CY} r={rOuter} stroke={`url(#${idB})`} strokeWidth={3 * k} fill="none" />
      <circle cx={CX} cy={CY} r={rOuter - 3 * k} stroke="var(--wind-shadow-deep)" strokeWidth="1" fill="none" />
      <circle cx={CX} cy={CY} r={rRing} stroke="var(--wind-border-subtle)" strokeWidth="1" fill="none" />
      <path d={secD} fill={`url(#${idS})`} />

      {tickAngles.map((a) => {
        const isCard = a % 90 === 0;
        const isMajor = a % 30 === 0;
        let inset, stroke, sw;
        if (isCard) { inset = 18 * k; stroke = "var(--wind-text-primary)"; sw = 2.4; }
        else if (isMajor) { inset = 14 * k; stroke = "#cbd5e1"; sw = 1.8; }
        else if (a % 15 === 0) { inset = 10 * k; stroke = "var(--wind-text-slate)"; sw = 1.2; }
        else { inset = 6 * k; stroke = "var(--wind-text-dim)"; sw = 0.9; }
        const r1 = rRing - inset;
        return (
          <line key={a}
            x1={CX + r1 * Math.cos(rad(a))} y1={CY + r1 * Math.sin(rad(a))}
            x2={CX + rRing * Math.cos(rad(a))} y2={CY + rRing * Math.sin(rad(a))}
            stroke={stroke} strokeWidth={sw} />
        );
      })}

      <circle cx={CX} cy={CY} r={rSep} stroke="var(--wind-edge)" strokeWidth="0.8" strokeDasharray="1 3" fill="none" />

      {degLabels.map((a) => {
        const pt = p(rDegText, a);
        return (
          <text key={`d${a}`} x={pt.x} y={pt.y} fill="var(--wind-text-muted)"
            fontSize={9 * k} fontWeight={600} textAnchor="middle" dominantBaseline="middle"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="0.5">
            {String(a).padStart(3, "0")}
          </text>
        );
      })}

      {directions.map((d) => {
        const pt = p(rDirText, d.angle);
        const em = d.angle === bearing;
        return (
          <text key={d.angle} x={pt.x} y={pt.y}
            fill={em ? "var(--wind-accent)" : "var(--wind-text-slate)"}
            fontSize={em ? 13 * k : 11 * k}
            fontWeight={em ? 800 : 600}
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
            {d.text}
          </text>
        );
      })}

      <circle cx={CX} cy={CY} r={rInner} stroke="var(--wind-edge)" strokeWidth="0.8" fill="none" />
      <circle cx={CX} cy={CY} r={rFace} stroke="var(--wind-bg-surface)" strokeWidth="0.6" fill="none" />

      <polygon
        points={`${CX - 6 * k},${CY - rOuter - 8 * k} ${CX + 6 * k},${CY - rOuter - 8 * k} ${CX},${CY - rOuter + 2 * k}`}
        fill="var(--wind-text-primary)" />

      <text x={CX} y={CY - 42 * k} fill="var(--wind-text-dim)" fontSize={9 * k} fontWeight={700}
        textAnchor="middle" fontFamily="'JetBrains Mono', monospace" letterSpacing="1.5">
        BEARING
      </text>
      <text x={CX} y={CY - 26 * k} fill="var(--wind-accent)" fontSize={18 * k} fontWeight={700}
        textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
        {String(bearing).padStart(3, "0")}°
      </text>

      <g style={{
        transform: `rotate(${renderedBearing}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: 'transform 500ms ease-out',
      }}>
        <path d={`M ${CX - 7 * k} ${CY + 4 * k} L ${CX + 7 * k} ${CY + 4 * k} L ${CX + 4 * k} ${CY + 44 * k} L ${CX - 4 * k} ${CY + 44 * k} Z`}
          fill={`url(#${idT})`} />
        <path d={`M ${CX} ${CY - 118 * k} L ${CX + 7 * k} ${CY - 4 * k} L ${CX - 7 * k} ${CY - 4 * k} Z`}
          fill={`url(#${idBL})`} />
        <path d={`M ${CX} ${CY - 118 * k} L ${CX + 7 * k} ${CY - 4 * k} L ${CX + 3 * k} ${CY - 4 * k} Z`}
          fill={`url(#${idBD})`} fillOpacity="0.55" />
        <line x1={CX} y1={CY - 114 * k} x2={CX} y2={CY - 4 * k}
          stroke="var(--wind-accent-hi)" strokeWidth="1" strokeOpacity="0.9" />
        <circle cx={CX} cy={CY - 112 * k} r={1.4 * k} fill="#ffffff" fillOpacity="0.9" />
        <circle cx={CX} cy={CY} r={16 * k} fill={`url(#${idH})`} stroke="var(--wind-accent)" strokeWidth="1.5" />
        <circle cx={CX} cy={CY} r={11 * k} fill="none" stroke="var(--wind-accent-lo)" strokeWidth="1" />
        <circle cx={CX} cy={CY} r={6 * k} fill="var(--wind-shadow-deep)" />
        <circle cx={CX} cy={CY} r={2.4 * k} fill="var(--wind-accent-hi)" />
        <circle cx={CX - 12 * k} cy={CY} r={1.2 * k} fill="var(--wind-shadow-deep)" stroke="var(--wind-accent-lo)" strokeWidth="0.6" />
        <circle cx={CX + 12 * k} cy={CY} r={1.2 * k} fill="var(--wind-shadow-deep)" stroke="var(--wind-accent-lo)" strokeWidth="0.6" />
      </g>
    </svg>
  );
};

/* ───────── BezelPanel (リベット付き金属パネル) ───────── */
const BezelPanel = ({ children, style, title, corner }) => (
  <div style={{
    position: "relative",
    background: "radial-gradient(ellipse at top, var(--wind-bg-panel) 0%, var(--wind-bg-base) 60%, #050914 100%)",
    border: "1px solid var(--wind-edge)",
    boxShadow: "inset 0 1px 0 rgba(148,163,184,0.08), inset 0 0 0 1px var(--wind-shadow-deep), 0 8px 24px rgba(0,0,0,0.5)",
    borderRadius: 10,
    padding: 14,
    ...style,
  }}>
    {[
      ["tl", { top: 6, left: 6 }],
      ["tr", { top: 6, right: 6 }],
      ["bl", { bottom: 6, left: 6 }],
      ["br", { bottom: 6, right: 6 }],
    ].map(([k, pos]) => (
      <div key={k} style={{
        position: "absolute", width: 4, height: 4, borderRadius: 2,
        background: "var(--wind-shadow-deep)", boxShadow: "inset 0 0 0 0.5px var(--wind-text-dim)",
        ...pos,
      }} />
    ))}
    {title && (
      <div style={{
        position: "absolute", top: -9, left: 12, padding: "2px 8px",
        background: "var(--wind-bg-base)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 700, color: "var(--wind-text-slate)", letterSpacing: 2,
      }}>{title}</div>
    )}
    {corner && (
      <div style={{
        position: "absolute", top: 8, right: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, fontWeight: 700, color: "var(--wind-text-muted)", letterSpacing: 1.5,
      }}>{corner}</div>
    )}
    {children}
  </div>
);

/* ───────── WindChart (風速推移折れ線 + 風向色帯) ───────── */
const WindChart = ({
  width,
  height,
  accent = "#34d399",
  prefix = "wc",
  validSamples,
  xOfSample,
  yOf,
  marginL,
  marginT,
  plotW,
  plotH,
  chartH,
  yMax,
  connected,
}) => {
  const gradId = `${prefix}_grad`;
  const clipId = `${prefix}_clip`;
  const bandClipId = `${prefix}_band`;

  let lineD = "";
  let fillD = "";
  if (validSamples.length >= 2) {
    const points = validSamples.map((s) => ({
      x: xOfSample(s),
      y: yOf(typeof s.wind_speed === "number" ? s.wind_speed : 0),
    }));
    lineD = points
      .map((p, i) => (i === 0 ? "M " : "L ") + p.x.toFixed(1) + " " + p.y.toFixed(1))
      .join(" ");
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    fillD = lineD
      + " L " + lastX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
      + " L " + firstX.toFixed(1) + " " + (marginT + plotH).toFixed(1)
      + " Z";
  }

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={marginL} y={marginT} width={plotW} height={plotH} />
        </clipPath>
        <clipPath id={bandClipId}>
          <rect x={marginL} y={chartH - 24 - 4} width={plotW} height={4} />
        </clipPath>
      </defs>

      <line x1={marginL} y1={marginT} x2={marginL + plotW} y2={marginT}
        stroke="var(--wind-edge)" strokeDasharray="2 4" />
      <line x1={marginL} y1={marginT + plotH / 2} x2={marginL + plotW} y2={marginT + plotH / 2}
        stroke="var(--wind-edge)" strokeDasharray="2 4" />
      <line x1={marginL} y1={marginT + plotH} x2={marginL + plotW} y2={marginT + plotH}
        stroke="var(--wind-edge)" strokeDasharray="2 4" />

      <text x={marginL - 4} y={marginT} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="end" dominantBaseline="hanging"
        fontFamily="'JetBrains Mono', monospace">
        {yMax.toFixed(1)}
      </text>
      <text x={marginL - 4} y={marginT + plotH / 2} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="end" dominantBaseline="middle"
        fontFamily="'JetBrains Mono', monospace">
        {(yMax / 2).toFixed(1)}
      </text>
      <text x={marginL - 4} y={marginT + plotH} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="end" dominantBaseline="baseline"
        fontFamily="'JetBrains Mono', monospace">
        0.0
      </text>

      {validSamples.length >= 2 ? (
        <g clipPath={`url(#${clipId})`}>
          <path d={fillD} fill={`url(#${gradId})`} />
          <path d={lineD} fill="none" stroke={accent} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
          {validSamples.map((s, i) => {
            const x = xOfSample(s);
            const y = yOf(typeof s.wind_speed === "number" ? s.wind_speed : 0);
            return <circle key={i} cx={x} cy={y} r={1.6} fill={accent} />;
          })}
        </g>
      ) : (
        <text
          x={marginL + plotW / 2}
          y={marginT + plotH / 2}
          fill="var(--wind-text-dim)"
          fontSize={12}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {connected ? "データ収集中..." : "未接続"}
        </text>
      )}

      {validSamples.length >= 2 && (() => {
        const bandY = chartH - 24 - 4;
        const rightEdge = marginL + plotW;
        const points = validSamples.map((s) => ({
          x: xOfSample(s),
          color: (() => {
            const rw = calcRelativeWind(s);
            return rw ? rw.color : "var(--wind-edge)";
          })(),
        }));
        return (
          <g clipPath={`url(#${bandClipId})`}>
            {points.map((pt, i) => {
              const x1 = pt.x;
              const x2 = i < points.length - 1 ? points[i + 1].x : rightEdge;
              const w = Math.max(0, x2 - x1);
              return (
                <rect key={`band-${i}`} x={x1} y={bandY} width={w} height={4} fill={pt.color} />
              );
            })}
          </g>
        );
      })()}

      <text x={marginL} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="start" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
        5分前
      </text>
      <text x={marginL + plotW * 0.4} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="middle" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
        3分前
      </text>
      <text x={marginL + plotW * 0.8} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="middle" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
        1分前
      </text>
      <text x={marginL + plotW} y={chartH - 6} fill="var(--wind-text-dim)" fontSize={9}
        textAnchor="end" fontFamily="-apple-system, 'Hiragino Sans', sans-serif">
        今
      </text>
    </svg>
  );
};

/* ───────── DeckHeader (ヘッダーバー、閉じる + タイトル + T+ + ステータス) ───────── */
const DeckHeader = ({ scale = 1, session = "00:00", connected = false, onClose }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: `${8 * scale}px ${12 * scale}px`,
    background: "linear-gradient(180deg, var(--wind-bg-panel) 0%, #0b1220 100%)",
    border: "1px solid var(--wind-edge)",
    boxShadow: "inset 0 1px 0 rgba(148,163,184,0.1), inset 0 -1px 0 var(--wind-shadow-deep)",
    borderRadius: 8,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 * scale }}>
      <button
        type="button"
        onClick={onClose}
        style={{
          padding: `${5 * scale}px ${10 * scale}px`,
          border: "1px solid var(--wind-border-subtle)",
          borderRadius: 6,
          background: "transparent",
          color: "var(--wind-text-slate)",
          fontSize: 11 * scale,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
          minHeight: 32 * scale,
        }}
      >
        ← 閉じる
      </button>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10 * scale, fontWeight: 700,
        color: "var(--wind-text-muted)", letterSpacing: 2,
      }}>
        WIND · MONITOR
      </div>
    </div>
    <div style={{ display: "flex", gap: 12 * scale, alignItems: "center" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10 * scale, color: "var(--wind-text-muted)", letterSpacing: 1.5,
      }}>
        T+ {session}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{
          width: 7, height: 7, borderRadius: 4,
          background: connected ? "var(--wind-linked)" : "var(--wind-severe)",
          boxShadow: connected
            ? "0 0 8px rgba(52,211,153,0.8)"
            : "0 0 8px rgba(239,68,68,0.5)",
          animation: connected ? "none" : "wind-monitor-blink 3s ease-in-out infinite",
        }} />
        <span style={{
          fontSize: 10 * scale, fontWeight: 700,
          color: connected ? "var(--wind-linked)" : "var(--wind-severe)",
          letterSpacing: 1.5,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {connected ? "LINKED" : "DISCONNECTED"}
        </span>
      </div>
    </div>
  </div>
);

/* ───────── DeckFooter (デバイス識別フッター、3 項目装飾) ───────── */
const DeckFooter = ({ scale = 1 }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", padding: "0 6px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9 * scale, color: "var(--wind-text-dim)", letterSpacing: 1.5,
  }}>
    <span>WX-02 ▪ FW 1.4.2</span>
    <span>SIG -- dBm</span>
    <span>1 Hz</span>
  </div>
);

/* ───────── InstrumentDeckPhone (iPhone 縦向きレイアウト) ───────── */
const InstrumentDeckPhone = ({
  connected,
  currentData,
  stats,
  relativeWind,
  validSamples,
  xOfSample,
  yOf,
  marginL,
  marginT,
  plotW,
  plotH,
  chartH,
  yMax,
  sessionElapsed,
  onClose,
}) => {
  const hasWindSpeed = connected && currentData && typeof currentData.wind_speed === "number";
  const heroText = hasWindSpeed ? currentData.wind_speed.toFixed(1) : "---";
  const heroColor = hasWindSpeed
    ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";
  const heroAnimation = hasWindSpeed ? "wind-monitor-hero-pulse 3s ease-in-out infinite" : "none";

  const rampLabel = hasWindSpeed ? getWindRampLabel(currentData.wind_speed) : "---";
  const rampColor = hasWindSpeed
    ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const gaugePctRaw = hasWindSpeed ? (currentData.wind_speed / 5) * 100 : 0;
  const gaugePct = Math.max(0, Math.min(100, gaugePctRaw));
  const gaugeShow = hasWindSpeed;

  const bearing = relativeWind ? Math.round(relativeWind.angle) : 0;

  const compassTitle = (connected && relativeWind)
    ? `COMPASS · ${String(bearing).padStart(3, "0")}°`
    : "COMPASS · ---";

  let compassCorner;
  if (!connected) {
    compassCorner = "---";
  } else if (currentData && currentData.compass_valid === false) {
    compassCorner = "⚠";
  } else if (currentData && currentData.throw_direction == null) {
    compassCorner = "未設定";
  } else if (relativeWind) {
    compassCorner = relativeWind.label;
  } else {
    compassCorner = "---";
  }

  const peakValue = stats.maxSpeed != null ? stats.maxSpeed.toFixed(1) : "---";
  const peakSub = stats.maxSpeedTimestamp ? formatTimestamp(stats.maxSpeedTimestamp) : "--:--";
  const peakColor = stats.maxSpeed != null
    ? (getWindRampColor(stats.maxSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const avgValue = stats.avgSpeed != null ? stats.avgSpeed.toFixed(1) : "---";
  const avgSub = stats.stdDev != null ? `σ ${stats.stdDev.toFixed(2)}` : "σ --";
  const avgColor = stats.avgSpeed != null
    ? (getWindRampColor(stats.avgSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const hasBattery = currentData && typeof currentData.battery === "number";
  const batValue = hasBattery ? Math.round(currentData.battery).toString() : "---";
  const batSub = `n ${stats.sampleCount}`;
  const batColor = hasBattery ? batteryColor(currentData.battery) : "var(--wind-text-muted)";

  const timelineCorner = hasWindSpeed
    ? `${currentData.wind_speed.toFixed(1)} m/s →`
    : "--- m/s →";

  return (
    <div style={{
      maxWidth: 420, margin: "0 auto", minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 0%, var(--wind-bg-surface) 0%, var(--wind-bg-base) 55%, var(--wind-shadow-deep) 100%)",
      color: "var(--wind-text-primary)",
      fontFamily: "-apple-system, 'Hiragino Sans', sans-serif",
      padding: 12, boxSizing: "border-box",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
        <defs>
          <pattern id="idp_grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--wind-text-slate)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#idp_grid)" />
      </svg>

      <DeckHeader scale={1} session={formatElapsed(sessionElapsed)} connected={connected} onClose={onClose} />

      <BezelPanel title="WIND · NOW" corner="m/s">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, padding: "10px 0 4px" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 88, fontWeight: 700, color: heroColor,
            letterSpacing: -2, lineHeight: 1, display: "inline-block",
            transformOrigin: "center", animation: heroAnimation,
          }}>
            {heroText}
          </span>
          <span style={{
            fontSize: 16, color: "var(--wind-text-muted)",
            fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          }}>
            m/s
          </span>
        </div>
        <svg viewBox="0 0 260 18" width="100%" height="14" style={{ marginTop: 2 }}>
          <path d="M 4 9 L 14 9 M 10 3 L 10 15" stroke="var(--wind-accent)" strokeWidth="1.5" fill="none" />
          <path d="M 256 9 L 246 9 M 250 3 L 250 15" stroke="var(--wind-accent)" strokeWidth="1.5" fill="none" />
          <text x="130" y="13" fill={rampColor} fontSize="10" fontWeight="700" textAnchor="middle"
            fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
            {rampLabel}
          </text>
        </svg>
        <div style={{ marginTop: 10, padding: "0 4px" }}>
          <div style={{ height: 6, background: "#0b1220", borderRadius: 3, position: "relative", border: "1px solid var(--wind-edge)" }}>
            <div style={{ position: "absolute", left: "0%", top: 0, height: 4, width: "40%", background: "var(--wind-calm)", borderRadius: 2, margin: 1 }} />
            <div style={{ position: "absolute", left: "40%", top: 0, height: 4, width: "30%", background: "var(--wind-moderate)", margin: 1 }} />
            <div style={{ position: "absolute", left: "70%", top: 0, height: 4, width: "30%", background: "var(--wind-strong)", borderRadius: 2, margin: 1 }} />
            {gaugeShow && (
              <div style={{ position: "absolute", left: `${gaugePct}%`, top: -3, width: 2, height: 12, background: "var(--wind-text-primary)" }} />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "var(--wind-text-dim)" }}>
            <span>0</span><span>2</span><span>3.5</span><span>5+</span>
          </div>
        </div>
      </BezelPanel>

      <BezelPanel title={compassTitle} corner={compassCorner}>
        <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
          <CompassGauge prefix="idp_c" size={330} bearing={bearing} />
        </div>
      </BezelPanel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { title: "PEAK", value: peakValue, unit: "m/s", sub: peakSub, color: peakColor },
          { title: "AVG", value: avgValue, unit: "m/s", sub: avgSub, color: avgColor },
          { title: "BAT", value: batValue, unit: "%", sub: batSub, color: batColor },
        ].map((c) => (
          <BezelPanel key={c.title} title={c.title} style={{ padding: "14px 8px 10px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 30, fontWeight: 700, color: c.color,
                letterSpacing: -1, lineHeight: 1,
              }}>
                {c.value}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, color: "var(--wind-text-muted)",
                marginTop: 3, letterSpacing: 1.5,
              }}>
                {c.unit} · {c.sub}
              </div>
            </div>
          </BezelPanel>
        ))}
      </div>

      <BezelPanel title="TIMELINE · 5 MIN" corner={timelineCorner} style={{ padding: "14px 10px 10px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <WindChart
            width={356}
            height={120}
            accent="#34d399"
            prefix="idp_ch"
            validSamples={validSamples}
            xOfSample={xOfSample}
            yOf={yOf}
            marginL={marginL}
            marginT={marginT}
            plotW={plotW}
            plotH={plotH}
            chartH={chartH}
            yMax={yMax}
            connected={connected}
          />
        </div>
      </BezelPanel>

      <DeckFooter scale={1} />
    </div>
  );
};

/* ───────── InstrumentDeckPad (iPad 縦向きレイアウト) ───────── */
const InstrumentDeckPad = ({
  connected,
  currentData,
  stats,
  relativeWind,
  validSamples,
  xOfSample,
  yOf,
  marginL,
  marginT,
  plotW,
  plotH,
  chartH,
  yMax,
  sessionElapsed,
  onClose,
}) => {
  const hasWindSpeed = connected && currentData && typeof currentData.wind_speed === "number";
  const heroText = hasWindSpeed ? currentData.wind_speed.toFixed(1) : "---";
  const heroColor = hasWindSpeed
    ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";
  const heroAnimation = hasWindSpeed ? "wind-monitor-hero-pulse 3s ease-in-out infinite" : "none";

  const rampLabel = hasWindSpeed ? getWindRampLabel(currentData.wind_speed) : "---";
  const rampColor = hasWindSpeed
    ? (getWindRampColor(currentData.wind_speed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const gaugePctRaw = hasWindSpeed ? (currentData.wind_speed / 5) * 100 : 0;
  const gaugePct = Math.max(0, Math.min(100, gaugePctRaw));
  const gaugeShow = hasWindSpeed;

  const bearing = relativeWind ? Math.round(relativeWind.angle) : 0;
  const compassTitle = (connected && relativeWind)
    ? `COMPASS · ${String(bearing).padStart(3, "0")}°`
    : "COMPASS · ---";

  let skittleLabel;
  if (!connected) skittleLabel = "SKITTLE DIRECTION · ---";
  else if (currentData && currentData.compass_valid === false) skittleLabel = "SKITTLE DIRECTION · ⚠ コンパス異常";
  else if (currentData && currentData.throw_direction == null) skittleLabel = "SKITTLE DIRECTION · 未設定";
  else if (relativeWind) skittleLabel = `SKITTLE DIRECTION · ${relativeWind.label}`;
  else skittleLabel = "SKITTLE DIRECTION · ---";

  const peakValue = stats.maxSpeed != null ? stats.maxSpeed.toFixed(1) : "---";
  const peakSub = stats.maxSpeedTimestamp ? formatTimestamp(stats.maxSpeedTimestamp) : "--:--";
  const peakColor = stats.maxSpeed != null
    ? (getWindRampColor(stats.maxSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";
  const peakTicks = stats.maxSpeed != null
    ? Math.round(Math.min(stats.maxSpeed / 10.0, 1.0) * 20)
    : 0;
  const peakTickColor = stats.maxSpeed != null
    ? (getWindRampColor(stats.maxSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const avgValue = stats.avgSpeed != null ? stats.avgSpeed.toFixed(1) : "---";
  const avgSub = stats.stdDev != null ? `σ ${stats.stdDev.toFixed(2)}` : "σ --";
  const avgColor = stats.avgSpeed != null
    ? (getWindRampColor(stats.avgSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";
  const avgTicks = stats.avgSpeed != null
    ? Math.round(Math.min(stats.avgSpeed / 10.0, 1.0) * 20)
    : 0;
  const avgTickColor = stats.avgSpeed != null
    ? (getWindRampColor(stats.avgSpeed) || "var(--wind-text-muted)")
    : "var(--wind-text-muted)";

  const hasBattery = currentData && typeof currentData.battery === "number";
  const batValue = hasBattery ? Math.round(currentData.battery).toString() : "---";
  const batSub = `n ${stats.sampleCount}`;
  const batColor = hasBattery ? batteryColor(currentData.battery) : "var(--wind-text-muted)";
  const batTicks = hasBattery
    ? Math.round(Math.min(currentData.battery / 100, 1.0) * 20)
    : 0;
  const batTickColor = hasBattery ? batteryColor(currentData.battery) : "var(--wind-text-muted)";

  const timelineCorner = hasWindSpeed
    ? `${currentData.wind_speed.toFixed(1)} m/s →`
    : "--- m/s →";

  const cards = [
    { title: "PEAK", value: peakValue, unit: "m/s", sub: peakSub, corner: "5min", color: peakColor, ticks: peakTicks, tickColor: peakTickColor },
    { title: "AVG", value: avgValue, unit: "m/s", sub: avgSub, corner: "5min", color: avgColor, ticks: avgTicks, tickColor: avgTickColor },
    { title: "BAT", value: batValue, unit: "%", sub: batSub, corner: "OK", color: batColor, ticks: batTicks, tickColor: batTickColor },
  ];

  return (
    <div style={{
      maxWidth: 880, margin: "0 auto", minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 0%, var(--wind-bg-surface) 0%, var(--wind-bg-base) 55%, var(--wind-shadow-deep) 100%)",
      color: "var(--wind-text-primary)",
      fontFamily: "-apple-system, 'Hiragino Sans', sans-serif",
      padding: 22, boxSizing: "border-box",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 18,
    }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
        <defs>
          <pattern id="idp2_grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--wind-text-slate)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#idp2_grid)" />
      </svg>

      <DeckHeader scale={1.35} session={formatElapsed(sessionElapsed)} connected={connected} onClose={onClose} />

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 18, position: "relative", zIndex: 1 }}>
        <BezelPanel title={compassTitle} corner="R.S-7" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
            <CompassGauge prefix="idp2_c" size={420} bearing={bearing} />
          </div>
          <div style={{
            marginTop: 12, textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: "var(--wind-text-muted)", letterSpacing: 3,
          }}>
            {skittleLabel}
          </div>
        </BezelPanel>

        <div style={{ display: "grid", gridTemplateRows: "1.1fr 1fr", gap: 18 }}>
          <BezelPanel title="WIND · NOW" corner="m/s" style={{ padding: "20px 20px 18px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, padding: "14px 0 4px" }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 120, fontWeight: 700, color: heroColor,
                letterSpacing: -3, lineHeight: 1,
                textShadow: "0 0 40px rgba(251,191,36,0.25)",
                display: "inline-block", transformOrigin: "center",
                animation: heroAnimation,
              }}>
                {heroText}
              </span>
              <span style={{
                fontSize: 22, color: "var(--wind-text-muted)",
                fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              }}>
                m/s
              </span>
            </div>
            <svg viewBox="0 0 320 24" width="100%" height="20" style={{ marginTop: 8 }}>
              <path d="M 6 12 L 22 12 M 14 4 L 14 20" stroke="var(--wind-accent)" strokeWidth="1.8" fill="none" />
              <path d="M 314 12 L 298 12 M 306 4 L 306 20" stroke="var(--wind-accent)" strokeWidth="1.8" fill="none" />
              <text x="160" y="17" fill={rampColor} fontSize="13" fontWeight="700" textAnchor="middle"
                fontFamily="'JetBrains Mono', monospace" letterSpacing="3">
                {rampLabel}
              </text>
            </svg>
            <div style={{ marginTop: 16, padding: "0 6px" }}>
              <div style={{ height: 8, background: "#0b1220", borderRadius: 4, position: "relative", border: "1px solid var(--wind-edge)" }}>
                <div style={{ position: "absolute", left: "0%", top: 0, height: 6, width: "40%", background: "var(--wind-calm)", borderRadius: 3, margin: 1 }} />
                <div style={{ position: "absolute", left: "40%", top: 0, height: 6, width: "30%", background: "var(--wind-moderate)", margin: 1 }} />
                <div style={{ position: "absolute", left: "70%", top: 0, height: 6, width: "30%", background: "var(--wind-strong)", borderRadius: 3, margin: 1 }} />
                {gaugeShow && (
                  <div style={{ position: "absolute", left: `${gaugePct}%`, top: -4, width: 2.5, height: 16, background: "var(--wind-text-primary)" }} />
                )}
              </div>
              <div style={{
                display: "flex", justifyContent: "space-between", marginTop: 5,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--wind-text-dim)",
              }}>
                <span>0</span><span>2</span><span>3.5</span><span>5+</span>
              </div>
            </div>
          </BezelPanel>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {cards.map((c) => (
              <BezelPanel key={c.title} title={c.title} corner={c.corner} style={{ padding: "18px 10px 12px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 42, fontWeight: 700, color: c.color,
                    letterSpacing: -1, lineHeight: 1,
                  }}>
                    {c.value}
                  </div>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10, color: "var(--wind-text-muted)",
                    marginTop: 4, letterSpacing: 1.5,
                  }}>
                    {c.unit} · {c.sub}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2, marginTop: 12, justifyContent: "center" }}>
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} style={{
                      width: 2,
                      height: i < c.ticks ? 12 : 6,
                      background: i < c.ticks ? c.tickColor : "var(--wind-text-muted)",
                      opacity: i < c.ticks ? 0.6 + i * 0.02 : 0.4,
                    }} />
                  ))}
                </div>
              </BezelPanel>
            ))}
          </div>
        </div>
      </div>

      <BezelPanel title="TIMELINE · 5 MIN" corner={timelineCorner} style={{ padding: 20, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <WindChart
            width={736}
            height={280}
            accent="#34d399"
            prefix="idp2_ch"
            validSamples={validSamples}
            xOfSample={xOfSample}
            yOf={yOf}
            marginL={marginL}
            marginT={marginT}
            plotW={plotW}
            plotH={plotH}
            chartH={chartH}
            yMax={yMax}
            connected={connected}
          />
        </div>
      </BezelPanel>

      <DeckFooter scale={1.3} />
    </div>
  );
};

export function WindMonitorModal({ isOpen, onClose, piAddress, windDebugEnabled, onWindDebugLog }) {
  const managerRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [history, setHistory] = useState([]);
  const [isTablet, setIsTablet] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  );

  // T+ タイマー(モーダル開放時を 0 秒起点、1 秒精度で更新、閉時にリセット)
  const [sessionElapsed, setSessionElapsed] = useState(0);
  useEffect(() => {
    if (!isOpen) {
      setSessionElapsed(0);
      return;
    }
    const startTime = Date.now();
    const id = setInterval(() => {
      setSessionElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen]);

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

  // 統計値(stdDev と maxSpeedTimestamp を追加)
  const stats = useMemo(() => {
    if (history.length === 0) {
      return {
        maxSpeed: null,
        maxSpeedTimestamp: null,
        avgSpeed: null,
        stdDev: null,
        sampleCount: 0,
      };
    }
    let max = 0;
    let maxTs = null;
    let sum = 0;
    for (const d of history) {
      const s = typeof d.wind_speed === "number" ? d.wind_speed : 0;
      if (s > max) {
        max = s;
        maxTs = d.timestamp || null;
      }
      sum += s;
    }
    const avg = sum / history.length;
    let variance = 0;
    for (const d of history) {
      const s = typeof d.wind_speed === "number" ? d.wind_speed : 0;
      variance += (s - avg) ** 2;
    }
    variance /= history.length;
    return {
      maxSpeed: max,
      maxSpeedTimestamp: maxTs,
      avgSpeed: avg,
      stdDev: Math.sqrt(variance),
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

  // タイムライン描画用の計算(WindChart に引き渡す)
  const chartH = isTablet ? 280 : 120;
  const marginL = isTablet ? 36 : 32;
  const marginT = 12;
  const marginB = 24;
  const chartW = isTablet ? 736 : 356;
  const plotW = chartW - marginL - 12; // marginR = 12 固定
  const plotH = chartH - marginT - marginB;

  // Y 軸スケール(既存ロジック踏襲、3.0 m/s 下限)
  const maxObservedSpeed = history.length > 0
    ? Math.max(...history.map((d) => (typeof d.wind_speed === "number" ? d.wind_speed : 0)))
    : 0;
  const yMax = Math.max(3.0, maxObservedSpeed * 1.2);
  const yOf = (speed) =>
    marginT + plotH * (1 - Math.min(Math.max(speed, 0), yMax) / yMax);

  // X 軸スケール(直近5分固定ウィンドウ)
  const WINDOW_MS = 5 * 60 * 1000;
  const nowMs = Date.now();
  const xMin = nowMs - WINDOW_MS;
  const xOfSample = (sample) => {
    const t = sample && sample.timestamp ? new Date(sample.timestamp).getTime() : NaN;
    if (!isFinite(t)) return NaN;
    return marginL + ((t - xMin) / WINDOW_MS) * plotW;
  };

  const validSamples = samples.filter((s) => {
    const t = s && s.timestamp ? new Date(s.timestamp).getTime() : NaN;
    return isFinite(t);
  });

  const deckProps = {
    connected, currentData, stats, relativeWind, validSamples,
    xOfSample, yOf, marginL, marginT, plotW, plotH, chartH, yMax,
    sessionElapsed, onClose,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--wind-bg-base)",
      overflowY: "auto",
      color: "var(--wind-text-primary)",
      WebkitOverflowScrolling: "touch",
    }}>
      {isTablet ? <InstrumentDeckPad {...deckProps} /> : <InstrumentDeckPhone {...deckProps} />}
    </div>
  );
}

export default WindMonitorModal;
