import React from "react";
import { calcMolkkyWind, isWindDisplayReady, getWindRampColor } from "../windSensor.js";

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
 * 色ロジック（DESIGN.md §9.2.5 正典の Wind Ramp 連動仕様、C-e で追従完了）:
 *   - 矢印色: getWindRampColor(wind_speed) の戻り値（Wind Ramp 色、風速カテゴリ連動）
 *   - 風速数値色: getWindRampColor(wind_speed) の戻り値（Wind Ramp 色、風速カテゴリ連動）
 *     ※ getWindRampColor が null を返した場合（NaN / Infinity 混入時のみ）は "#fff" にフォールバック
 *   - 単位 m/s 色: rgba(255,255,255,0.6) 固定（--wind-text-label 相当、直書き）
 *   - 方向ラベル色: rgba(255,255,255,0.6) 固定（--wind-text-label 相当、直書き、§9.2.5 完全追従）
 *     ※ C-a 路線 B（DIRECTION パレット）は C-e で撤回。矢印色が Wind Ramp 連動に移行したことで
 *       「矢印と方向ラベルの視覚的統一」という路線 B の当初根拠が失効したため、正典追従へ回帰。
 *
 * 単一の真実源:
 *   getWindRampColor は src/windSensor.js に集約され、WindMonitor Hero 数値（§9.3.4）と
 *   GameScreen Wind Vector Widget（§9.2.5、本コンポーネント）の両方から流用される。
 *   閾値は §2.5 Wind Sensor Colors と共通（< 未満方式、境界値は上位カテゴリに属する）。
 */
export default function GameWindWidget({ currentWind }) {
  if (!isWindDisplayReady(currentWind)) return null;

  const { wind_speed, wind_direction, compass_heading, throw_direction } = currentWind;
  const { label, degrees } = calcMolkkyWind(wind_direction, compass_heading, throw_direction);
  // Wind Ramp 色（風速カテゴリ連動、§9.2.5 正典）。
  // getWindRampColor は NaN / Infinity に対して null を返すため、
  // isWindDisplayReady のガードを通過した wind_speed でも理論上 null 発生しうる。
  // フォールバックは #fff（C-d 以前の風速数値色と同値、現状互換性維持）。
  const rampColor = getWindRampColor(wind_speed) || "#fff";

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
          fill={rampColor}
        />
      </svg>

      {/* 風速数値（20px / instrument / semibold / Wind Ramp 色連動、§9.2.5 正典） */}
      <span style={{
        fontSize: 20,
        fontWeight: 600,
        fontFamily: "var(--font-instrument)",
        color: rampColor,
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

      {/* 方向ラベル（12px / sans / bold / --wind-text-label 相当の薄白、§9.2.5 正典）
          iPhone 簡略版では非表示 */}
      {!isCompact && (
        <span style={{
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(255,255,255,0.6)",
          lineHeight: 1,
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
