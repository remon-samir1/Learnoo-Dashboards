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
    <div
      dir="ltr"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`.trim()}
      aria-hidden
    >
      {DUAL_WATERMARK_MOTION_PATTERNS.map((pattern, index) => (
        <motion.div
          key={index}
          initial={{
            x: pattern.x[0],
            y: pattern.y[0],
          }}
          animate={{
            x: [...pattern.x],
            y: [...pattern.y],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="pointer-events-none absolute inset-0 will-change-transform"
        >
          <div className="absolute left-0 top-0 max-w-[min(90%,calc(100%-1rem))]">
            <span
              className={`inline-block select-none whitespace-nowrap ${textClass}`}
              style={{
                color,
                opacity,
                transform: `rotate(${dualWatermarkTiltDegrees(index, rotation)}deg)`,
              }}
            >
              {trimmed}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export { DUAL_WATERMARK_MOVEMENT_DURATION_S };
