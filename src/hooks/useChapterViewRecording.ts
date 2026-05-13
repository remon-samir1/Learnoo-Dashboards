'use client';

import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/src/lib/api';

export type UseChapterViewRecordingArgs = {
  chapterId: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  /** From chapter `view_by_minute` — minutes of playback before POST /view (0 = on first play). */
  viewByMinute: number;
  /** When false, listeners are not attached (e.g. access denied or no video). */
  enabled: boolean;
  /** Called when POST /view fails (e.g. max views). */
  onViewRecordError: (message: string) => void;
};

/**
 * Registers a chapter view (POST /v1/chapter/:id/view) after playback rules:
 * - `view_by_minute <= 0`: one POST on first `playing` event.
 * - `view_by_minute > 0`: one POST after that many minutes of watch time (small `timeupdate` deltas only; large seeks ignored).
 */
export function useChapterViewRecording({
  chapterId,
  videoRef,
  videoSrc,
  viewByMinute,
  enabled,
  onViewRecordError,
}: UseChapterViewRecordingArgs) {
  const router = useRouter();
  const recordedRef = useRef(false);
  const accumulatedSecRef = useRef(0);
  const lastVideoTimeRef = useRef<number | null>(null);
  const onViewRecordErrorRef = useRef(onViewRecordError);
  onViewRecordErrorRef.current = onViewRecordError;

  useEffect(() => {
    recordedRef.current = false;
    accumulatedSecRef.current = 0;
    lastVideoTimeRef.current = null;
  }, [chapterId, videoSrc]);

  useEffect(() => {
    if (!enabled || !videoSrc) return;

    let cancelled = false;
    let detach: (() => void) | undefined;

    const raf = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const el = videoRef.current;
      if (!el) return;

      const minutesRequired = Math.max(0, Number(viewByMinute) || 0);

      const recordViewOnce = async () => {
        if (recordedRef.current) return;
        recordedRef.current = true;
        try {
          await api.chapters.recordView(chapterId);
          router.refresh();
        } catch (err) {
          recordedRef.current = false;
          const msg =
            err instanceof ApiError ? err.message : 'Could not record chapter view.';
          onViewRecordErrorRef.current(msg);
          try {
            el.pause();
          } catch {
            /* ignore */
          }
        }
      };

      const onPlaying = () => {
        lastVideoTimeRef.current = el.currentTime;
        if (minutesRequired <= 0) {
          void recordViewOnce();
        }
      };

      const onTimeUpdate = () => {
        if (el.paused || minutesRequired <= 0) return;
        const t = el.currentTime;
        const last = lastVideoTimeRef.current;
        lastVideoTimeRef.current = t;
        if (last == null) return;
        const delta = t - last;
        if (delta <= 0 || delta > 3) return;
        accumulatedSecRef.current += delta;
        if (!recordedRef.current && accumulatedSecRef.current >= minutesRequired * 60) {
          void recordViewOnce();
        }
      };

      const onSeeking = () => {
        lastVideoTimeRef.current = el.currentTime;
      };

      const onPause = () => {
        lastVideoTimeRef.current = el.currentTime;
      };

      el.addEventListener('playing', onPlaying);
      el.addEventListener('timeupdate', onTimeUpdate);
      el.addEventListener('seeking', onSeeking);
      el.addEventListener('pause', onPause);

      detach = () => {
        el.removeEventListener('playing', onPlaying);
        el.removeEventListener('timeupdate', onTimeUpdate);
        el.removeEventListener('seeking', onSeeking);
        el.removeEventListener('pause', onPause);
      };
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      detach?.();
    };
  }, [chapterId, enabled, router, videoRef, videoSrc, viewByMinute]);
}
