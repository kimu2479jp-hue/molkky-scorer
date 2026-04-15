import React from "react";
import { calcMolkkyWind, isWindDisplayReady } from "../windSensor.js";

/**
 * GameScreen上のコンパクト風表示ウィジェット
 *
 * Props:
 *   currentWind: windSensorManager.currentWind（1Hzで更新されるオブジェクト or null）
 *
 * 表示条件:
 *   isWindDisplayReady(currentWind) === true の場合のみレンダリング
 *   条件を満たさない場合は null を返す（何も表示しない）
 */
export default function GameWindWidget({ currentWind }) {
  if (!isWindDisplayReady(currentWind)) return null;

  const { wind_speed, wind_direction, compass_heading, throw_direction } = currentWind;
  const { label, color, degrees } = calcMolkkyWind(wind_direction, compass_heading, throw_direction);

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: "rgba(15, 23, 42, 0.85)",
      borderRadius: 6,
      padding: "4px 8px",
      flexShrink: 0,
    }}>
      {/* SVG矢印: 上向き矢印を relativeAngle で回転 */}
      <svg
        width={20}
        height={20}
        viewBox="0 0 20 20"
        style={{
          transition: "transform 0.3s ease",
          transform: `rotate(${degrees}deg)`,
        }}
      >
        <path
          d="M10 2 L14 10 L11 10 L11 18 L9 18 L9 10 L6 10 Z"
          fill={color}
        />
      </svg>
      {/* 風速: 小数第1位、m/s不要 */}
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "monospace",
        color: "#fff",
        lineHeight: 1,
      }}>
        {wind_speed.toFixed(1)}
      </span>
      {/* モルック方位ラベル */}
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: color,
        lineHeight: 1,
      }}>
        {label}
      </span>
    </div>
  );
}
