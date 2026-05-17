'use client';

import { DualMotionWatermark } from '@/components/student/watermark/DualMotionWatermark';
import { WatermarkResolution } from '@/src/lib/watermark-from-features';

export default function ExamWatermark({
  text,
  watermarkConfig,
}: {
  text: string;
  watermarkConfig?: WatermarkResolution | null;
}) {
  const config = watermarkConfig?.config;

  return (
    <DualMotionWatermark
      text={text}
      color={config?.color ?? '#666666'}
      opacityPercent={config ? config.opacity : 50}
      size={config?.size}
      rotation={config?.rotation}
      config={config ?? null}
      className="z-0"
    />
  );
}
