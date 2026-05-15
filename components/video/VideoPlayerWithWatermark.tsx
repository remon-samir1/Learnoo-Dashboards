'use client';

import { useEffect, useId, useState } from 'react';
import { getStudentInfo, type StudentInfo } from '@/src/lib/get-student-info';

export type VideoPlayerWithWatermarkProps = {
  videoUrl: string;
  /** Optional label for the root region (accessibility). */
  label?: string;
  className?: string;
};

/**
 * Progressive `<video>` with a non-destructive, front-end-only identity watermark.
 * Overlay uses `pointer-events-none` so native controls keep receiving input.
 */
export function VideoPlayerWithWatermark({
  videoUrl,
  label = 'Video with student watermark',
  className = '',
}: VideoPlayerWithWatermarkProps) {
  const regionId = useId();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    getStudentInfo()
      .then((data) => {
        if (!cancelled) {
          setStudent(data);
          setLoadState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStudent(null);
          setLoadState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedUrl = videoUrl.trim();
  if (!trimmedUrl) {
    return (
      <div
        className={`flex min-h-[12rem] w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-600 ${className}`}
        role="status"
      >
        No video URL provided.
      </div>
    );
  }

  return (
    <section
      id={regionId}
      aria-label={label}
      className={`relative isolate w-full max-w-full overflow-hidden rounded-lg bg-black ${className}`}
    >
      <div className="relative aspect-video w-full max-w-full">
        <video
          className="relative z-0 h-full w-full object-contain"
          src={trimmedUrl}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
        >
          Your browser does not support embedded video.
        </video>

        {/* Above the video surface; pointer-events-none keeps controls usable (esp. bottom bar). */}
        <div
          className="pointer-events-none absolute inset-0 z-50 flex items-start justify-start p-2 sm:p-3"
          role="note"
          aria-label="Student identification watermark"
        >
          {loadState === 'ready' && student ? (
            <div
              className="max-w-[min(100%,18rem)] rounded-md px-2.5 py-2 text-white shadow-sm sm:max-w-[min(100%,22rem)] sm:px-3 sm:py-2.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-white/80 sm:text-xs">
                Student
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug sm:text-sm">{student.name}</p>
              <p className="mt-1.5 text-[0.625rem] text-white/85 sm:text-xs">
                <span className="font-semibold text-white/90">ID:</span> {student.id}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[0.625rem] text-white/85 sm:text-xs">
                <span className="font-semibold text-white/90">Course:</span> {student.course}
              </p>
            </div>
          ) : loadState === 'loading' ? (
            <div
              className="rounded-md px-2.5 py-2 text-[0.625rem] text-white/90 sm:text-xs"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              Loading student…
            </div>
          ) : loadState === 'error' ? (
            <div
              className="rounded-md px-2.5 py-2 text-[0.625rem] text-white/90 sm:text-xs"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              Watermark unavailable
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
