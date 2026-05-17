'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from 'lucide-react';

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

type QualityOption = {
  index: number;
  height?: number;
  bitrate?: number;
  label: string;
};

export type HlsVideoCustomControlsProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Player shell — fullscreen targets this node so overlays / watermarks stay in the fullscreen subtree. */
  shellRef: RefObject<HTMLDivElement | null>;
  qualityOptions?: QualityOption[];
  qualityValue?: number | 'auto';
  onQualityChange?: (value: number | 'auto') => void;
  /** Trailing actions (e.g. PDF toggle) — shown in the control row on small screens. */
  endAction?: React.ReactNode;
};

function isShellFullscreen(shell: HTMLDivElement | null): boolean {
  if (typeof document === 'undefined' || !shell) return false;
  const fs = document.fullscreenElement;
  if (!fs) return false;
  return fs === shell || shell.contains(fs);
}

export function HlsVideoCustomControls({
  videoRef,
  shellRef,
  qualityOptions = [],
  qualityValue = 'auto',
  onQualityChange,
  endAction,
}: HlsVideoCustomControlsProps) {
  const t = useTranslations('courses.studentWatch');
  const qualityLabel = (() => {
    const translated = t('videoControlsQuality');
    return translated === 'courses.studentWatch.videoControlsQuality' ? 'Quality' : translated;
  })();
  const qualityLoadingLabel = (() => {
    const translated = t('videoControlsQualityLoading');
    return translated === 'courses.studentWatch.videoControlsQualityLoading' ? 'Loading...' : translated;
  })();
  const [paused, setPaused] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setPaused(v.paused);
      setCurrent(v.currentTime);
      const d = v.duration;
      setDuration(Number.isFinite(d) ? d : 0);
      setMuted(v.muted);
    };
    sync();
    v.addEventListener('timeupdate', sync);
    v.addEventListener('loadedmetadata', sync);
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('volumechange', sync);
    v.addEventListener('durationchange', sync);
    return () => {
      v.removeEventListener('timeupdate', sync);
      v.removeEventListener('loadedmetadata', sync);
      v.removeEventListener('play', sync);
      v.removeEventListener('pause', sync);
      v.removeEventListener('volumechange', sync);
      v.removeEventListener('durationchange', sync);
    };
  }, [videoRef]);

  useEffect(() => {
    const sync = () => setIsFullscreen(isShellFullscreen(shellRef.current));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [shellRef]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, [videoRef]);

  const toggleShellFullscreen = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || typeof document === 'undefined') return;

    if (isShellFullscreen(shell)) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      return;
    }

    const req =
      shell.requestFullscreen?.bind(shell) ??
      (shell as unknown as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(
        shell
      );
    if (req) {
      try {
        const p = req();
        if (p != null && typeof (p as Promise<void>).catch === 'function') {
          void (p as Promise<void>).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }
  }, [shellRef]);

  const onSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = videoRef.current;
      if (!v) return;
      const next = Number.parseFloat(e.target.value);
      if (!Number.isFinite(next)) return;
      v.currentTime = next;
      setCurrent(next);
    },
    [videoRef]
  );

  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const rangeMax = max > 0 ? max : 1;
  const rangeValue = max > 0 ? Math.min(current, max) : 0;

  return (
    <div
      className="relative z-30 w-full shrink-0 border-t border-slate-800/80 bg-[#0a0f18] px-2 py-2 sm:px-3 sm:py-2.5"
      role="group"
      aria-label={t('videoControlsGroup')}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-col gap-1 rounded-md bg-black/70 px-2 py-1.5 shadow-md backdrop-blur-sm max-sm:leading-none sm:gap-1.5 sm:px-2.5 sm:py-2 sm:leading-normal">
        <input
          type="range"
          min={0}
          max={rangeMax}
          step="any"
          value={rangeValue}
          onChange={onSeek}
          disabled={max <= 0}
          className="h-1 w-full max-sm:my-0 cursor-pointer touch-pan-x accent-white disabled:cursor-not-allowed disabled:opacity-40 sm:h-1.5 sm:my-0"
          aria-label={t('videoControlsSeek')}
        />
        <div className="flex items-center gap-0.5 text-white max-sm:min-h-8 sm:gap-2 sm:h-auto">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded bg-white/15 text-white transition hover:bg-white/25 active:bg-white/20 sm:size-9 sm:rounded-md"
            aria-label={paused ? t('videoControlsPlay') : t('videoControlsPause')}
          >
            {paused ? (
              <Play className="size-3.5 translate-x-px sm:size-5 sm:translate-x-0.5" fill="currentColor" />
            ) : (
              <Pause className="size-3.5 sm:size-5" />
            )}
          </button>
          <span className="min-w-0 flex-1 max-sm:truncate tabular-nums text-[9px] leading-none text-white/90 sm:min-w-[6.5rem] sm:flex-none sm:text-sm sm:leading-normal">
            {formatClock(current)} / {formatClock(duration)}
          </span>
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded bg-white/15 text-white transition hover:bg-white/25 active:bg-white/20 sm:size-9 sm:rounded-md"
            aria-label={muted ? t('videoControlsUnmute') : t('videoControlsMute')}
          >
            {muted ? <VolumeX className="size-3.5 sm:size-5" /> : <Volume2 className="size-3.5 sm:size-5" />}
          </button>

          {onQualityChange ? (
            <label className="inline-flex min-w-0 max-w-[38%] shrink items-center gap-1 rounded bg-white/10 px-1.5 py-1 text-white/90 transition hover:bg-white/15 sm:max-w-none sm:gap-2 sm:px-2.5 sm:py-1.5">
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-white/70 sm:inline sm:text-xs">
                {qualityLabel}
              </span>
              <select
                value={qualityValue === 'auto' ? 'auto' : String(qualityValue)}
                onChange={(e) => {
                  const value = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
                  onQualityChange(value);
                }}
                disabled={qualityOptions.length === 0}
                className="max-w-full truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] text-white outline-none transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:px-2 sm:py-1 sm:text-sm"
                aria-label={t('videoControlsQuality')}
              >
                <option value="auto">Auto</option>
                {qualityOptions.length > 0
                  ? qualityOptions.map((option) => (
                      <option key={option.index} value={option.index}>
                        {option.label}
                      </option>
                    ))
                  : null}
              </select>
              {qualityOptions.length === 0 ? (
                <span className="hidden text-[10px] text-white/60 sm:inline sm:text-xs">{qualityLoadingLabel}</span>
              ) : null}
            </label>
          ) : null}

          {endAction ? <div className="ms-auto shrink-0 sm:hidden">{endAction}</div> : null}

          <button
            type="button"
            onClick={toggleShellFullscreen}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded bg-white/15 text-white transition hover:bg-white/25 active:bg-white/20 sm:size-9 sm:rounded-md"
            aria-label={isFullscreen ? t('videoControlsExitFullscreen') : t('videoControlsFullscreen')}
          >
            {isFullscreen ? <Minimize2 className="size-3.5 sm:size-5" /> : <Maximize2 className="size-3.5 sm:size-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
