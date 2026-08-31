'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useTranslations } from 'next-intl';
import {
  Captions,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Info,
  Maximize,
  MessageSquare,
  Minimize,
  Moon,
  Pause,
  Play,
  Settings as SettingsIcon,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Tv2,
  Volume2,
  VolumeX,
} from 'lucide-react';

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export type QualityOption = {
  id: string;
  label: string;
  height?: number;
  bitrate?: number;
  realLevelIndex?: number;
  isFake?: boolean;
};

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
type SpeedValue = (typeof SPEED_OPTIONS)[number];

const SLEEP_TIMER_OPTIONS = [0, 5, 10, 15, 30, 45, 60] as const;

type SettingsSubMenu = null | 'sleep' | 'speed' | 'quality';

export type HlsVideoCustomControlsProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  /** Player shell — fullscreen targets this node so overlays / watermarks stay in the fullscreen subtree. */
  shellRef: RefObject<HTMLDivElement | null>;
  qualityOptions?: QualityOption[];
  qualityValue?: string | number | 'auto';
  visible?: boolean;
  onQualityChange?: (value: string | 'auto') => void;
  /** Trailing actions (e.g. PDF toggle) — shown in the control row on small screens. */
  endAction?: React.ReactNode;
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  canPrevChapter?: boolean;
  canNextChapter?: boolean;
  /** Chapter title shown next to the info icon (top-right). */
  chapterInfoTitle?: string;
  /** Theater mode (wider player). When true the theater icon is "active". */
  theaterMode?: boolean;
  onToggleTheater?: () => void;
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
  visible = true,
  onPrevChapter,
  onNextChapter,
  canPrevChapter = false,
  canNextChapter = false,
  chapterInfoTitle,
  theaterMode = false,
  onToggleTheater,
}: HlsVideoCustomControlsProps) {
  const t = useTranslations('courses.studentWatch');

  const [paused, setPaused] = useState(true);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<SpeedValue>(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<SettingsSubMenu>(null);
  const [annotationsEnabled, setAnnotationsEnabled] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number>(0);
  const [sleepRemaining, setSleepRemaining] = useState<number>(0);
  const [infoOpen, setInfoOpen] = useState(false);

  const sleepCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsWrapRef = useRef<HTMLDivElement | null>(null);

  // ────────── Sync playback state from <video> ──────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const sync = () => {
      setPaused(v.paused);
      setCurrent(v.currentTime);
      const d = v.duration;
      setDuration(Number.isFinite(d) ? d : 0);
      setMuted(v.muted);
      try {
        if (v.buffered && v.buffered.length > 0) {
          setBufferedEnd(v.buffered.end(v.buffered.length - 1));
        }
      } catch {
        /* ignore */
      }
    };
    sync();
    const events = [
      'timeupdate',
      'loadedmetadata',
      'play',
      'pause',
      'volumechange',
      'durationchange',
      'progress',
    ] as const;
    events.forEach((e) => v.addEventListener(e, sync));
    return () => {
      events.forEach((e) => v.removeEventListener(e, sync));
    };
  }, [videoRef]);

  useEffect(() => {
    const sync = () => setIsFullscreen(isShellFullscreen(shellRef.current));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [shellRef]);

  // Derived: settings panel is only open while controls are visible.
  // (When `visible` flips false the panel is unmounted automatically.)

  // Close settings on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e: MouseEvent) => {
      const wrap = settingsWrapRef.current;
      if (wrap && !wrap.contains(e.target as Node)) {
        setSettingsOpen(false);
        setSubMenu(null);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [settingsOpen]);

  // ────────── Player controls ──────────
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

  const setSpeed = useCallback(
    (speed: SpeedValue) => {
      const v = videoRef.current;
      if (!v) return;
      v.playbackRate = speed;
      setPlaybackSpeed(speed);
      setSubMenu(null);
      setSettingsOpen(false);
    },
    [videoRef]
  );

  const onQualitySelect = useCallback(
    (value: string | 'auto') => {
      onQualityChange?.(value);
      setSubMenu(null);
      setSettingsOpen(false);
    },
    [onQualityChange]
  );

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

  const onSeekInput = useCallback(
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

  // ────────── Sleep timer ──────────
  const applySleepTimer = useCallback(
    (minutes: number) => {
      // Clear existing
      if (sleepCountdownRef.current) {
        clearInterval(sleepCountdownRef.current);
        sleepCountdownRef.current = null;
      }
      setSleepRemaining(0);
      setSleepTimerMinutes(minutes);

      if (minutes > 0) {
        const totalSec = minutes * 60;
        setSleepRemaining(totalSec);
        sleepCountdownRef.current = setInterval(() => {
          setSleepRemaining((prev) => {
            const next = prev - 1;
            if (next <= 0) {
              if (sleepCountdownRef.current) {
                clearInterval(sleepCountdownRef.current);
                sleepCountdownRef.current = null;
              }
              const vid = videoRef.current;
              if (vid && !vid.paused) vid.pause();
              setSleepTimerMinutes(0);
              return 0;
            }
            return next;
          });
        }, 1000);
      }

      setSubMenu(null);
      setSettingsOpen(false);
    },
    [videoRef]
  );

  useEffect(() => {
    return () => {
      if (sleepCountdownRef.current) {
        clearInterval(sleepCountdownRef.current);
        sleepCountdownRef.current = null;
      }
    };
  }, []);

  // ────────── Derived ──────────
  const max = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const rangeMax = max > 0 ? max : 1;
  const rangeValue = max > 0 ? Math.min(current, max) : 0;
  const playedPercent = max > 0 ? (current / max) * 100 : 0;
  const bufferedPercent = max > 0 ? Math.min(100, (bufferedEnd / max) * 100) : 0;

  const currentQualityOption = useMemo(() => {
    if (qualityValue === 'auto') return null;
    return (
      qualityOptions.find(
        (q) =>
          q.id === qualityValue ||
          q.label === qualityValue ||
          (typeof qualityValue === 'number' && q.realLevelIndex === qualityValue)
      ) ?? null
    );
  }, [qualityValue, qualityOptions]);

  const autoOptionLabel = useMemo(() => {
    const heights = qualityOptions
      .map((q) => q.height)
      .filter((h): h is number => typeof h === 'number' && h > 0);
    const maxHeight = heights.length > 0 ? Math.max(...heights) : null;
    return maxHeight ? `Auto (${maxHeight}p)` : 'Auto';
  }, [qualityOptions]);

  const qualityMenuLabel = useMemo(() => {
    if (qualityValue === 'auto') {
      return autoOptionLabel;
    }
    return currentQualityOption?.label ?? (typeof qualityValue === 'string' ? qualityValue : 'Auto');
  }, [qualityValue, autoOptionLabel, currentQualityOption]);

const speedMenuLabel =
  playbackSpeed === 1
    ? t('videoControlsPlaybackNormal')
    : Number.isInteger(playbackSpeed)
      ? `${playbackSpeed}x`
      : `${playbackSpeed}x`;

  const sleepMenuLabel =
    sleepTimerMinutes === 0
      ? t('videoControlsSleepTimerOff')
      : sleepRemaining > 0
        ? formatClock(sleepRemaining)
        : t('videoControlsSleepTimerMinutes', { minutes: sleepTimerMinutes });

  // Settings row components
  const settingsBaseBtn =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-white transition hover:bg-white/10';

  const backRow = (
    <button
      type="button"
      onClick={() => setSubMenu(null)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      <ChevronLeft className="size-4 rtl:rotate-180" />
      <span className="flex-1">{t('videoControlsBack')}</span>
    </button>
  );

  return (
    <div
      className={`
        absolute inset-0 z-[9999]
        flex flex-col justify-end
        transition-opacity duration-200
        ${
          visible
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }
      `}
      role="group"
      aria-label={t('videoControlsGroup')}
      dir="ltr"
    >
      {/* Top gradient for info icon visibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/55 to-transparent" />
      {/* Bottom gradient for controls visibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/55 to-transparent" />

      {/* Info icon top-right */}
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4">
        {infoOpen && chapterInfoTitle ? (
          <div className="pointer-events-auto max-w-xs rounded-lg bg-black/80 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/10 backdrop-blur">
            {chapterInfoTitle}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setInfoOpen((v) => !v)}
          className="pointer-events-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white/90 transition hover:bg-white/15 hover:text-white"
          aria-label={t('videoControlsInfo')}
          title={chapterInfoTitle ?? t('videoControlsInfo')}
        >
          <Info className="size-5" />
        </button>
      </div>

      {/* Settings overlay panel */}
      {visible && settingsOpen ? (
      <div
        ref={settingsWrapRef}
        className={`
          absolute bottom-16 right-3 z-20 sm:bottom-20 sm:right-4
          pointer-events-auto min-w-[260px] max-w-[320px]
          origin-bottom-right rounded-2xl bg-black/85 text-white shadow-2xl
          ring-1 ring-white/10 backdrop-blur-md transition duration-150
        `}
        aria-hidden={!settingsOpen}
      >
        <div className="overflow-hidden rounded-2xl">
          {subMenu === null && (
            <div className="flex flex-col gap-0.5 p-2">
              {/* Annotations row */}
              <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm">
                <MessageSquare className="size-4 shrink-0 text-white/80" />
                <span className="flex-1">{t('videoControlsAnnotations')}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={annotationsEnabled}
                  onClick={() => setAnnotationsEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    annotationsEnabled ? 'bg-[#3ea6ff]' : 'bg-white/25'
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white transition ${
                      annotationsEnabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sleep timer row */}
              <button
                type="button"
                onClick={() => setSubMenu('sleep')}
                className={settingsBaseBtn}
              >
                <Moon className="size-4 shrink-0 text-white/80" />
                <span className="flex-1">{t('videoControlsSleepTimer')}</span>
                <span className="text-sm text-white/70">{sleepMenuLabel}</span>
                <ChevronRight className="size-4 shrink-0 text-white/60 rtl:rotate-180" />
              </button>

              {/* Playback speed row */}
              <button
                type="button"
                onClick={() => setSubMenu('speed')}
                className={settingsBaseBtn}
              >
                <Gauge className="size-4 shrink-0 text-white/80" />
                <span className="flex-1">{t('videoControlsPlaybackSpeed')}</span>
                <span className="text-sm text-white/70">
                  {speedMenuLabel}
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/60 rtl:rotate-180" />
              </button>

              {/* Quality row */}
              {onQualityChange ? (
                <button
                  type="button"
                  onClick={() => setSubMenu('quality')}
                  className={settingsBaseBtn}
                >
                  <SlidersHorizontal className="size-4 shrink-0 text-white/80" />
                  <span className="flex-1">{t('videoControlsQuality')}</span>
                  <span className="text-sm text-white/70">{qualityMenuLabel}</span>
                  <ChevronRight className="size-4 shrink-0 text-white/60 rtl:rotate-180" />
                </button>
              ) : null}
            </div>
          )}

          {subMenu === 'sleep' && (
            <div className="flex flex-col gap-0.5 p-2">
              {backRow}
              {SLEEP_TIMER_OPTIONS.map((m) => {
                const active = sleepTimerMinutes === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => applySleepTimer(m)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                      active ? 'text-[#3ea6ff]' : 'text-white'
                    }`}
                  >
                    <span className="flex-1">
                      {m === 0
                        ? t('videoControlsSleepTimerOff')
                        : t('videoControlsSleepTimerMinutes', { minutes: m })}
                    </span>
                    {active ? (
                      <span className="text-xs font-bold uppercase tracking-wide">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {subMenu === 'speed' && (
            <div className="flex flex-col gap-0.5 p-2">
              {backRow}
              {SPEED_OPTIONS.map((s) => {
                const active = playbackSpeed === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                      active ? 'text-[#3ea6ff]' : 'text-white'
                    }`}
                  >
                    <span className="flex-1">
                      {s === 1 ? t('videoControlsPlaybackNormal') : `${s}x`}
                    </span>
                    {active ? (
                      <span className="text-xs font-bold uppercase tracking-wide">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {subMenu === 'quality' && onQualityChange && (
            <div className="flex flex-col gap-0.5 p-2">
              {backRow}
              <button
                type="button"
                onClick={() => onQualitySelect('auto')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                  qualityValue === 'auto' ? 'text-[#3ea6ff]' : 'text-white'
                }`}
              >
                <span className="flex-1">{autoOptionLabel}</span>
                {qualityValue === 'auto' ? (
                  <span className="text-xs font-bold uppercase tracking-wide">✓</span>
                ) : null}
              </button>
              {qualityOptions.map((opt) => {
                const active =
                  qualityValue === opt.id ||
                  qualityValue === opt.label ||
                  (typeof qualityValue === 'number' && opt.realLevelIndex === qualityValue);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onQualitySelect(opt.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/10 ${
                      active ? 'text-[#3ea6ff]' : 'text-white'
                    }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {active ? (
                      <span className="text-xs font-bold uppercase tracking-wide">✓</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      ) : null}

      {/* Bottom controls */}
      <div className="relative z-10 px-3 pb-2 sm:px-5 sm:pb-4">
        {/* Progress bar */}
        <div className="group/seek relative h-3 w-full cursor-pointer">
          {/* Buffered track */}
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white/50 transition-[width] duration-150"
              style={{ width: `${bufferedPercent}%` }}
            />
          </div>
          {/* Played track (red) */}
          <div
            className="absolute top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-[#ff0033]"
            style={{ width: `${playedPercent}%` }}
          />
          {/* Playhead */}
          <div
            className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff0033] shadow ring-2 ring-white/10 transition-transform group-hover/seek:scale-125"
            style={{ left: `${playedPercent}%` }}
          />
          {/* Range input overlay (invisible but clickable / scrollable) */}
          <input
            type="range"
            min={0}
            max={rangeMax}
            step="any"
            value={rangeValue}
            onChange={onSeekInput}
            disabled={max <= 0}
            aria-label={t('videoControlsSeek')}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
            style={{ direction: 'ltr' }}
          />
        </div>

        {/* Bottom row */}
        <div className="mt-1 flex items-center gap-1 text-white sm:gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 sm:size-10"
              aria-label={paused ? t('videoControlsPlay') : t('videoControlsPause')}
            >
              {paused ? (
                <Play className="size-5 translate-x-px fill-white sm:size-6" />
              ) : (
                <Pause className="size-5 sm:size-6" />
              )}
            </button>
            <button
              type="button"
              onClick={onPrevChapter}
              disabled={!canPrevChapter}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed sm:size-10"
              aria-label={t('videoControlsPrevChapter')}
              title={t('videoControlsPrevChapter')}
            >
              <SkipBack className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              onClick={onNextChapter}
              disabled={!canNextChapter}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed sm:size-10"
              aria-label={t('videoControlsNextChapter')}
              title={t('videoControlsNextChapter')}
            >
              <SkipForward className="size-4 sm:size-5" />
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 sm:size-10"
              aria-label={muted ? t('videoControlsUnmute') : t('videoControlsMute')}
            >
              {muted ? (
                <VolumeX className="size-5 sm:size-6" />
              ) : (
                <Volume2 className="size-5 sm:size-6" />
              )}
            </button>
            <span className="ms-1 select-none tabular-nums text-[12px] font-medium leading-none text-white sm:ms-2 sm:text-[13px]">
              {formatClock(current)} / {formatClock(duration)}
            </span>
          </div>

          {/* Spacer for centering on large screens */}
          <div className="flex-1" />

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {endAction ? <div className="hidden md:block">{endAction}</div> : null}

            <button
              type="button"
              onClick={() => setCaptionsEnabled((v) => !v)}
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tracking-tight transition hover:bg-white/15 active:bg-white/20 sm:size-10 sm:text-xs ${
                captionsEnabled ? 'bg-white/15' : ''
              }`}
              aria-label={captionsEnabled ? t('videoControlsCaptionsTurnOff') : t('videoControlsCaptionsTurnOn')}
              aria-pressed={captionsEnabled}
              title={t('videoControlsCaptions')}
            >
              <Captions className="size-5 sm:size-6" strokeWidth={1.6} />
            </button>

            <button
              type="button"
              onClick={() => {
                setSettingsOpen((v) => !v);
                setSubMenu(null);
              }}
              className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 sm:size-10 ${
                settingsOpen ? 'bg-white/15' : ''
              }`}
              aria-label={t('videoControlsSettings')}
              aria-expanded={settingsOpen}
              title={t('videoControlsSettings')}
            >
              <SettingsIcon className="size-5 sm:size-6" />
            </button>

            {onToggleTheater ? (
              <button
                type="button"
                onClick={onToggleTheater}
                className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 sm:size-10 ${
                  theaterMode ? 'bg-white/15' : ''
                }`}
                aria-label={
                  theaterMode ? t('videoControlsTheaterExit') : t('videoControlsTheaterEnter')
                }
                aria-pressed={theaterMode}
                title={t('videoControlsTheater')}
              >
                <Tv2 className="size-5 sm:size-6" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={toggleShellFullscreen}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white transition hover:bg-white/15 active:bg-white/20 sm:size-10"
              aria-label={isFullscreen ? t('videoControlsExitFullscreen') : t('videoControlsFullscreen')}
              title={isFullscreen ? t('videoControlsExitFullscreen') : t('videoControlsFullscreen')}
            >
              {isFullscreen ? (
                <Minimize className="size-5 sm:size-6" />
              ) : (
                <Maximize className="size-5 sm:size-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
