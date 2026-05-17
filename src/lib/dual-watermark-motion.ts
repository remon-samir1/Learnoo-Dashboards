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

/** Matches exam watermark: smooth continuous loop across the full frame. */
export const DUAL_WATERMARK_MOVEMENT_DURATION_S = 8;

export function resolveDualWatermarkDurationSeconds(
  config: Pick<WatermarkConfig, 'dynamicPosition' | 'dynamicInterval'> | null | undefined,
): number {
  if (!config?.dynamicPosition) {
    return DUAL_WATERMARK_MOVEMENT_DURATION_S;
  }
  const sec = Number(config.dynamicInterval);
  if (!Number.isFinite(sec) || sec <= 0) {
    return DUAL_WATERMARK_MOVEMENT_DURATION_S;
  }
  return Math.max(DUAL_WATERMARK_MOVEMENT_DURATION_S, sec);
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
