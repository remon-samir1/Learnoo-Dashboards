'use client';

import type { RefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { DualMotionWatermark } from '@/components/student/watermark/DualMotionWatermark';
import { usePlatformFeature } from '@/src/hooks';
import {
  resolveEnabledWatermarkBucket,
  type WatermarkResolution,
} from '@/src/lib/watermark-from-features';
import { buildWatermarkText } from '@/src/lib/watermark-text';
import { useAuthStore } from '@/src/stores/authStore';
import type { WatermarkContentType } from '@/src/types/watermark-config';

export type VideoWatermarkProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  contentType?: WatermarkContentType;
  showWatermark?: boolean;
  initialResolution?: WatermarkResolution | null;
};

export function VideoWatermark({
  videoRef: _videoRef,
  contentType = 'chapters',
  showWatermark = true,
  initialResolution = null,
}: VideoWatermarkProps) {
  const [mounted, setMounted] = useState(false);

  const user = useAuthStore(useShallow((s) => s.user));
  const { data: features } = usePlatformFeature();

  const clientResolution = useMemo(() => {
    if (!features?.length) return null;
    return resolveEnabledWatermarkBucket(features, contentType);
  }, [features, contentType]);

  const resolution = useMemo(
    () => clientResolution ?? initialResolution ?? null,
    [clientResolution, initialResolution],
  );

  const config = resolution?.config ?? null;

  const displayText = useMemo(() => {
    if (!config?.enabled) return '';
    return buildWatermarkText(user, config);
  }, [config, user]);

  const overlayActive =
    mounted && showWatermark && Boolean(config?.enabled) && Boolean(displayText);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !overlayActive || !config || !displayText) {
    return null;
  }

  return (
    <DualMotionWatermark
      text={displayText}
      color={config.color}
      opacityPercent={config.opacity}
      size={config.size}
      rotation={config.rotation}
      config={config}
      className="relative h-full w-full"
    />
  );
}
