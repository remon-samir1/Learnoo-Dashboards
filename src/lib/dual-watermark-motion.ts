import type { WatermarkConfig } from '@/src/types/watermark-config';

/** Two distinct paths across ~5%–85% of the frame (LTR positioning layer; RTL-safe). */
export const DUAL_WATERMARK_MOTION_PATTERNS: ReadonlyArray<{
  x: readonly string[];
  y: readonly string[];
}> = [
  {
    x: ['5%', '85%', '42%', '12%', '75%'],
    y: ['8%', '78%', '32%', '68%', '18%'],
  },
  {
    x: ['82%', '8%', '48%', '72%', '5%'],
    y: ['18%', '72%', '28%', '62%', '10%'],
  },
] as const;

/**
 * Default duration for one full dual-motion loop (exam + video) when admin interval is unset.
 * Higher = slower movement.
 */
export const DUAL_WATERMARK_MOVEMENT_DURATION_S = 28;

const MIN_LOOP_DURATION_S = 16;
const MAX_LOOP_DURATION_S = 120;

/**
 * Maps admin watermark settings to dual-motion loop duration.
 *
 * - Admin **Dynamic position** + **Change interval** (`dynamic_interval`, 1–5s in settings)
 *   control speed for the smooth moving watermark on exams and video.
 * - Interval is scaled to a full path cycle (not 1:1 with the admin preview “jump” tiles).
 * - When dynamic position is off, `dynamic_interval` still slows or speeds the loop if set.
 */
export function resolveDualWatermarkDurationSeconds(
  config: Pick<WatermarkConfig, 'dynamicPosition' | 'dynamicInterval'> | null | undefined,
): number {
  const interval = Number(config?.dynamicInterval);
  if (Number.isFinite(interval) && interval > 0) {
    const scale = config?.dynamicPosition ? 10 : 8;
    const loopSec = interval * scale;
    return Math.min(MAX_LOOP_DURATION_S, Math.max(MIN_LOOP_DURATION_S, loopSec));
  }
  return DUAL_WATERMARK_MOVEMENT_DURATION_S;
}

export function dualWatermarkTextSizeClass(size: WatermarkConfig['size'] | undefined): string {
  switch (size) {
    case 'small':
      return 'text-xs font-black sm:text-sm';
    case 'large':
      return 'text-base font-black sm:text-lg lg:text-xl';
    default:
      return 'text-sm font-black lg:text-base';
  }
}

export function dualWatermarkTiltDegrees(
  index: number,
  rotation: number | undefined,
): number {
  const base = Number.isFinite(rotation) ? rotation! : 20;
  return index === 0 ? -Math.abs(base) : Math.abs(base);
}
