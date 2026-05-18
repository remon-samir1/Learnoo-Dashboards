'use client';

import { motion } from 'framer-motion';
import {
  DUAL_WATERMARK_MOTION_PATTERNS,
  DUAL_WATERMARK_MOVEMENT_DURATION_S,
  dualWatermarkTextSizeClass,
  dualWatermarkTiltDegrees,
  resolveDualWatermarkDurationSeconds,
} from '@/src/lib/dual-watermark-motion';
import type { WatermarkConfig } from '@/src/types/watermark-config';

export type DualMotionWatermarkProps = {
  text: string;
  color?: string;
  /** Admin UI opacity 10–50 → CSS 0.1–0.5 */
  opacityPercent?: number;
  size?: WatermarkConfig['size'];
  rotation?: number;
  movementDurationSeconds?: number;
  /** When set, duration may follow `dynamicInterval` if dynamic positioning is enabled. */
  config?: Pick<WatermarkConfig, 'dynamicPosition' | 'dynamicInterval'> | null;
  className?: string;
};

/**
 * Two smoothly moving watermark instances (exam-style).
 * Uses `dir="ltr"` on the clip layer so RTL locales keep the same motion paths.
 * Positions use `left` / `top` % of the clip frame (not transform on a full-size layer).
 */
export function DualMotionWatermark({
  text,
  color = '#666666',
  opacityPercent = 50,
  size,
  rotation,
  movementDurationSeconds,
  config,
  className = '',
}: DualMotionWatermarkProps) {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const opacity = Math.min(1, Math.max(0, opacityPercent / 100));
  const duration =
    movementDurationSeconds ??
    resolveDualWatermarkDurationSeconds(config ?? null);
  const textClass = dualWatermarkTextSizeClass(size);

  return (
    <motion.div
      dir="ltr"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
      aria-hidden
    >
      {DUAL_WATERMARK_MOTION_PATTERNS.map((pattern, index) => (
        <motion.span
          key={index}
          className={`pointer-events-none absolute z-20 inline-block max-w-[min(88%,calc(100%-1.25rem))] select-none whitespace-nowrap will-change-[left,top] ${textClass}`}
          initial={{
            left: pattern.x[0],
            top: pattern.y[0],
          }}
          animate={{
            left: [...pattern.x],
            top: [...pattern.y],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            color,
            opacity,
            transform: `rotate(${dualWatermarkTiltDegrees(index, rotation)}deg)`,
          }}
        >
          {trimmed}
        </motion.span>
      ))}
    </motion.div>
  );
}

export { DUAL_WATERMARK_MOVEMENT_DURATION_S };
