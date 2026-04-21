import React from "react";
import { calcMolkkyWind, isWindDisplayReady } from "../windSensor.js";

/**
 * GameScreen上のコンパクト風表示ウィジェット（pill 型）
 *
 * DESIGN.md §9.2.5 Wind Vector Widget 正典仕様:
 *   - pill 形状（borderRadius 9999、--radius-full 相当）
 *   - 高さ 44px（--space-11、タッチターゲット下限）
 *   - 背景 --neutral-900 固定
 *   - パディング 縦 8px / 横 12px（--space-2 / --space-3）
 *   - 要素間ギャップ 8px（--space-2）
 *   - 矢印 24×24px
 *   - 構成要素（左→右、4 要素）: 矢印 / 風速数値 / 単位 m/s / 方向ラベル
 *
 * iPhone 縦向き簡略版（window.innerWidth <= 480）:
 *   - 構成: 矢印 + 風速数値のみ（単位と方向ラベル省略）
 *   - 高さ 44px 維持、最小幅 72px
 *
 * Props:
 *   currentWind: windSensorManager.currentWind（1Hzで更新されるオブジェクト or null）
 *
 * 表示条件:
 *   isWindDisplayReady(currentWind) === true の場合のみレンダリング
 *   条件を満たさない場合は null を返す（何も表示しない）
 *
 * 色ロジック（C-d スコープでは現状維持、C-e で Wind Ramp 連動へ変更予定）:
 *   - 矢印色: calcMolkkyWind 戻り値の方位色（DIRECTION パレット、C-a 移行済み）
 *   - 風速数値色: #fff 固定
 *   - 単位 m/s 色: rgba(255,255,255,0.6) 固定（--wind-text-label 相当）
 *   - 方向ラベル色: calcMolkkyWind 戻り値の方位色（C-a 路線 B 維持）
 */
export default function GameWindWidget({ currentWind }) {
  if (!isWindDisplayReady(currentWind)) return null;

  const { wind_speed, wind_direction, compass_heading, throw_direction } = currentWind;
  const { label, color, degrees } = calcMolkkyWind(wind_direction, compass_heading, throw_direction);

  // iPhone 縦向き簡略版判定（GameScreen.jsx の isTablet 判定と同じ mount 時取得方式）
  const vw = typeof window !== "undefined" ? window.innerWidth : 768;
  const isCompact = vw <= 480;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      background: "var(--neutral-900)",
      borderRadius: 9999,
      height: 44,
      minWidth: isCompact ? 72 : undefined,
      padding: "8px 12px",
      boxSizing: "border-box",
      flexShrink: 0,
      justifyContent: isCompact ? "center" : undefined,
    }}>
      {/* 方向矢印（24×24）: 上向き矢印を relativeAngle で回転 */}
      <svg
        width={24}
        height={24}
        viewBox="0 0 20 20"
        style={{
          transition: "transform 0.3s ease",
          transform: `rotate(${degrees}deg)`,
          flexShrink: 0,
        }}
      >
        <path
          d="M10 2 L14 10 L11 10 L11 18 L9 18 L9 10 L6 10 Z"
          fill={color}
        />
      </svg>

      {/* 風速数値（20px / instrument / semibold / 白固定） */}
      <span style={{
        fontSize: 20,
        fontWeight: 600,
        fontFamily: "var(--font-instrument)",
        color: "#fff",
        lineHeight: 1,
      }}>
        {wind_speed.toFixed(1)}
      </span>

      {/* 単位 m/s（12px / instrument / medium / rgba(255,255,255,0.6)）
          iPhone 簡略版では非表示 */}
      {!isCompact && (
        <span style={{
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "var(--font-instrument)",
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1,
        }}>
          m/s
        </span>
      )}

      {/* 方向ラベル（12px / sans / bold / 方位色）
          iPhone 簡略版では非表示 */}
      {!isCompact && (
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: color,
          lineHeight: 1,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
