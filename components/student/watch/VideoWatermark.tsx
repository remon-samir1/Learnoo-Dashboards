'use client';

import { createPortal } from 'react-dom';
import type { CSSProperties, RefObject } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlatformFeature } from '@/src/hooks';
import {
  resolveEnabledWatermarkBucket,
  type WatermarkResolution,
} from '@/src/lib/watermark-from-features';
import { buildWatermarkText } from '@/src/lib/watermark-text';
import { useAuthStore } from '@/src/stores/authStore';
import {
  WATERMARK_FULL_POSITION_COPY_COUNT,
  type WatermarkConfig,
  type WatermarkContentType,
  type WatermarkPosition,
} from '@/src/types/watermark-config';

const POSITION_CLASSES: Record<WatermarkPosition, string> = {
  topLeft: 'top-4 left-4',
  topRight: 'top-4 right-4',
  bottomLeft: 'bottom-4 left-4',
  bottomRight: 'bottom-4 right-4',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  full: '',
};

const POSITIONS: WatermarkPosition[] = [
  'topLeft',
  'topRight',
  'center',
  'bottomLeft',
  'bottomRight',
];

const MOVEMENT_SEQUENCES: Record<
  WatermarkConfig['movementPattern'],
  WatermarkPosition[]
> = {
  random: POSITIONS,
  circular: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'],
  zigzag: ['topLeft', 'center', 'topRight', 'center', 'bottomLeft', 'center', 'bottomRight'],
  bounce: ['topLeft', 'bottomRight', 'topRight', 'bottomLeft'],
  edge: ['topLeft', 'topRight', 'bottomRight', 'bottomLeft', 'topLeft'],
};

type VideoRect = { left: number; top: number; width: number; height: number };

function rectsEqual(a: VideoRect | null, b: VideoRect): boolean {
  if (!a) return false;
  const e = 0.25;
  return (
    Math.abs(a.left - b.left) < e &&
    Math.abs(a.top - b.top) < e &&
    Math.abs(a.width - b.width) < e &&
    Math.abs(a.height - b.height) < e
  );
}

function sizeClassFullGrid(size: WatermarkConfig['size']): string {
  switch (size) {
    case 'small':
      return 'text-lg font-bold';
    case 'large':
      return 'text-3xl font-bold';
    default:
      return 'text-2xl font-bold';
  }
}

function sizeClassSingle(size: WatermarkConfig['size']): string {
  switch (size) {
    case 'small':
      return 'text-base font-bold';
    case 'large':
      return 'text-4xl font-bold';
    default:
      return 'text-2xl font-bold';
  }
}

export type VideoWatermarkProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Player shell used with `portalMountRef` to detect document fullscreen on the player. */
  shellRef?: RefObject<HTMLElement | null>;
  /** When the shell is `document.fullscreenElement`, portal mounts here so the watermark stays visible. */
  portalMountRef?: RefObject<HTMLElement | null>;
  contentType?: WatermarkContentType;
  showWatermark?: boolean;
  initialResolution?: WatermarkResolution | null;
};

export function VideoWatermark({
  videoRef,
  shellRef,
  portalMountRef,
  contentType = 'chapters',
  showWatermark = true,
  initialResolution = null,
}: VideoWatermarkProps) {
  const [mounted, setMounted] = useState(false);
  const [videoRect, setVideoRect] = useState<VideoRect | null>(null);
  /** Re-read `portalMountRef.current` after layout (ref is set post-commit). */
  const [mountPulse, setMountPulse] = useState(0);
  const [fullscreenTick, setFullscreenTick] = useState(0);
  const [dynamicPos, setDynamicPos] = useState<WatermarkPosition>('topLeft');
  const [randomPct, setRandomPct] = useState({ x: 50, y: 50 });
  const [fullGridJitter, setFullGridJitter] = useState({ x: 0, y: 0 });
  const seqIndexRef = useRef(0);

  const user = useAuthStore(useShallow((s) => s.user));
  const { data: features } = usePlatformFeature();

  const clientResolution = useMemo(() => {
    if (!features?.length) return null;
    return resolveEnabledWatermarkBucket(features, contentType);
  }, [features, contentType]);

  const resolution = useMemo(
    () => clientResolution ?? initialResolution ?? null,
    [clientResolution, initialResolution]
  );

  const config = resolution?.config ?? null;

  const displayText = useMemo(() => {
    if (!config?.enabled) return '';
    return buildWatermarkText(user, config);
  }, [config, user]);

  const overlayActive =
    mounted && showWatermark && Boolean(config?.enabled) && Boolean(displayText);

  const shellFsActive = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const shell = shellRef?.current;
    const fs = document.fullscreenElement;
    if (!shell || !fs) return false;
    return fs === shell || shell.contains(fs);
  }, [shellRef, fullscreenTick]);

  const portalParent: HTMLElement | null = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const mount = portalMountRef?.current;
    if (shellFsActive && mount?.isConnected) return mount;
    return document.body;
  }, [shellFsActive, portalMountRef, fullscreenTick]);

  const mountEl = portalMountRef?.current;
  const useMountPortal = Boolean(portalMountRef && mountEl?.isConnected);
  void mountPulse;

  const updateVideoRect = useCallback(() => {
    if (shellFsActive) {
      setVideoRect(null);
      return;
    }
    const el = videoRef.current;
    if (!el || !el.isConnected) {
      setVideoRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const next: VideoRect = { left: r.left, top: r.top, width: r.width, height: r.height };
    if (next.width < 1 || next.height < 1) {
      setVideoRect(null);
      return;
    }
    setVideoRect((prev) => (rectsEqual(prev, next) ? prev : next));
  }, [videoRef, shellFsActive]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreenTick((n) => n + 1);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useLayoutEffect(() => {
    if (!overlayActive) return;
    if (portalMountRef) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMountPulse((n) => n + 1));
      });
      return () => cancelAnimationFrame(id);
    }
    updateVideoRect();
    const id = requestAnimationFrame(() => {
      updateVideoRect();
      requestAnimationFrame(() => updateVideoRect());
    });
    return () => cancelAnimationFrame(id);
  }, [overlayActive, updateVideoRect, shellFsActive, portalMountRef]);

  useEffect(() => {
    if (!overlayActive) return;
    if (portalMountRef && mountEl?.isConnected) return;
    const el = videoRef.current;
    if (!el) return;

    updateVideoRect();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => updateVideoRect()) : null;
    ro?.observe(el);

    const onLayout = () => updateVideoRect();
    window.addEventListener('resize', onLayout);
    document.addEventListener('fullscreenchange', onLayout);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onLayout);
    vv?.addEventListener('scroll', onLayout);

    const thresholds = Array.from({ length: 41 }, (_, i) => i / 40);
    const io = new IntersectionObserver(onLayout, { threshold: thresholds });
    io.observe(el);

    const pollId = window.setInterval(onLayout, 150);

    return () => {
      window.clearInterval(pollId);
      ro?.disconnect();
      window.removeEventListener('resize', onLayout);
      document.removeEventListener('fullscreenchange', onLayout);
      vv?.removeEventListener('resize', onLayout);
      vv?.removeEventListener('scroll', onLayout);
      io.disconnect();
    };
  }, [overlayActive, updateVideoRect, videoRef, portalMountRef, mountEl?.isConnected]);

  const intervalMs = useMemo(() => {
    if (!config?.dynamicPosition) return 0;
    const sec = Number.isFinite(config.dynamicInterval) ? config.dynamicInterval : 2;
    return Math.max(1, sec) * 1000;
  }, [config?.dynamicInterval, config?.dynamicPosition]);

  const tickDynamic = useCallback(() => {
    if (!config?.dynamicPosition) return;
    if (config.position === 'full') {
      setFullGridJitter({
        x: Math.floor(Math.random() * 14) - 7,
        y: Math.floor(Math.random() * 14) - 7,
      });
      return;
    }
    if (config.randomCoordinates) {
      setRandomPct({
        x: Math.floor(Math.random() * 80) + 10,
        y: Math.floor(Math.random() * 80) + 10,
      });
      return;
    }
    const seq = MOVEMENT_SEQUENCES[config.movementPattern] ?? POSITIONS;
    if (config.movementPattern === 'random') {
      setDynamicPos((cur) => {
        const pool = POSITIONS.filter((p) => p !== cur);
        return pool[Math.floor(Math.random() * pool.length)] ?? 'topLeft';
      });
      return;
    }
    const i = seqIndexRef.current % seq.length;
    setDynamicPos(seq[i] ?? 'topLeft');
    seqIndexRef.current = (seqIndexRef.current + 1) % seq.length;
  }, [config]);

  useEffect(() => {
    if (!overlayActive || !config?.dynamicPosition || intervalMs <= 0) return;
    const video = videoRef.current;
    if (!video) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const clearTimer = () => {
      if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const onPlay = () => {
      clearTimer();
      tickDynamic();
      timer = setInterval(tickDynamic, intervalMs);
    };
    const onPause = () => {
      clearTimer();
    };

    if (!video.paused) onPlay();
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onPause);

    return () => {
      clearTimer();
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onPause);
    };
  }, [overlayActive, config, intervalMs, tickDynamic, videoRef]);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  if (!overlayActive || !config || !displayText) {
    return null;
  }

  const effectivePosition =
    config.dynamicPosition && !config.randomCoordinates ? dynamicPos : config.position;

  const randomCoordsStyle: CSSProperties | undefined = config.randomCoordinates
    ? {
        left: `${randomPct.x}%`,
        top: `${randomPct.y}%`,
        transform: 'translate(-50%, -50%)',
      }
    : undefined;

  const animationClasses: Record<WatermarkConfig['animationStyle'], string> = {
    slide: 'transition-transform duration-500',
    fade: 'transition-all duration-500',
    scale: 'transition-transform duration-500',
    rotate: 'transition-transform duration-500',
    glide: 'transition-all duration-700',
  };

  const easingClasses: Record<WatermarkConfig['easingType'], string> = {
    linear: 'ease-linear',
    ease: 'ease-in-out',
    easeInOut: 'ease-in-out',
    bounce: 'transition-all duration-700',
    elastic: 'transition-all duration-700',
  };

  const getAnimationClass = () => {
    const base = animationClasses[config.animationStyle];
    const ease =
      config.easingType === 'bounce' || config.easingType === 'elastic'
        ? easingClasses[config.easingType]
        : base;
    return `${base} ${ease}`;
  };

  const spanOpacityStyle = { opacity: config.opacity / 100 };

  const layer = (
    <div
      className="pointer-events-none  relative h-full w-full select-none overflow-visible max-sm:[&_span]:!text-[11px] max-sm:[&_span]:!leading-snug max-sm:[&_span]:!font-semibold"
      aria-hidden
    >
      {config.position === 'full' && !config.dynamicPosition ? (
        <div
          className="absolute inset-0 flex flex-wrap content-center justify-center gap-x-12 gap-y-8 p-4 max-sm:gap-x-4 max-sm:gap-y-3 max-sm:p-2"
          style={{ transform: `rotate(${config.rotation}deg) scale(1.1)` }}
        >
          {Array.from({ length: WATERMARK_FULL_POSITION_COPY_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`select-none whitespace-nowrap ${sizeClassFullGrid(config.size)}`}
              style={{ color: config.color, ...spanOpacityStyle }}
            >
              {displayText}
            </span>
          ))}
        </div>
      ) : config.position === 'full' && config.dynamicPosition ? (
        <div
          className={`absolute inset-0 flex flex-wrap content-center justify-center gap-x-12 gap-y-8 p-4 max-sm:gap-x-4 max-sm:gap-y-3 max-sm:p-2 ${getAnimationClass()}`}
          style={{
            transform: `rotate(${config.rotation}deg) scale(1.1) translate(${fullGridJitter.x}%, ${fullGridJitter.y}%)`,
          }}
        >
          {Array.from({ length: WATERMARK_FULL_POSITION_COPY_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`select-none whitespace-nowrap ${sizeClassFullGrid(config.size)}`}
              style={{ color: config.color, ...spanOpacityStyle }}
            >
              {displayText}
            </span>
          ))}
        </div>
      ) : (
        <div
          className={`absolute ${getAnimationClass()} ${config.randomCoordinates ? '' : POSITION_CLASSES[effectivePosition]}`}
          style={{
            ...randomCoordsStyle,
            ...(!config.randomCoordinates && effectivePosition !== 'center'
              ? { transform: `rotate(${config.rotation}deg)` }
              : {}),
          }}
        >
          <span
            className={`inline-block select-none whitespace-nowrap ${sizeClassSingle(config.size)} ${
              config.animationStyle === 'fade' && config.dynamicPosition ? 'animate-pulse' : ''
            }`}
            style={{ color: config.color, ...spanOpacityStyle }}
          >
            {displayText}
          </span>
        </div>
      )}
    </div>
  );

  if (useMountPortal && mountEl) {
    const tree = (
      <div className="pointer-events-none absolute inset-0 z-[2147483000] overflow-visible">{layer}</div>
    );
    return createPortal(tree, mountEl);
  }

  if (!portalParent) {
    return null;
  }

  const innerBoxStyle: CSSProperties | undefined =
    !shellFsActive && videoRect != null
      ? {
          position: 'absolute',
          left: videoRect.left,
          top: videoRect.top,
          width: videoRect.width,
          height: videoRect.height,
        }
      : undefined;

  if (!shellFsActive && !innerBoxStyle) {
    return null;
  }

  const tree = shellFsActive ? (
    <div className="pointer-events-none absolute inset-0 z-[2147483000] overflow-visible">{layer}</div>
  ) : (
    <div className="pointer-events-none fixed inset-0 z-[2147483647] overflow-visible">
      <div className="pointer-events-none absolute overflow-visible" style={innerBoxStyle}>
        {layer}
      </div>
    </div>
  );

  return createPortal(tree, portalParent);
}
