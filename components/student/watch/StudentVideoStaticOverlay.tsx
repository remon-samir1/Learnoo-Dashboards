'use client';

import { useLayoutEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { initializeAuthStore, useAuthStore } from '@/src/stores/authStore';

export type StudentVideoStaticOverlayProps = {
  /** e.g. lecture or chapter title — optional second line */
  subtitle?: string;
};

/**
 * Non-interactive static badge on the video (top area). Does not replace the platform watermark.
 */
export function StudentVideoStaticOverlay({ subtitle }: StudentVideoStaticOverlayProps) {
  useLayoutEffect(() => {
    initializeAuthStore();
  }, []);

  const user = useAuthStore(useShallow((s) => s.user));

  if (!user) return null;

  const { first_name, last_name } = user.attributes;
  const name = [first_name, last_name].map((s) => s?.trim()).filter(Boolean).join(' ') || '—';
  const id = user.id != null ? String(user.id) : '—';

  const idShort = id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[25] col-start-1 row-start-1 flex items-start justify-end p-1 sm:justify-start sm:p-2.5"
      role="note"
      aria-label={`${name}. ID ${id}. ${subtitle?.trim() ?? ''}`}
    >
      <div
        className="max-w-[min(calc(100vw-5.5rem),10.5rem)] rounded-md px-2 py-1.5 text-white shadow-sm sm:max-w-[min(100%,22rem)] sm:px-3 sm:py-2.5"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        dir="auto"
        title={`${name} · ${id}`}
      >
        <p className="hidden text-[0.625rem] font-semibold uppercase tracking-wide text-white/80 sm:block sm:text-xs">
          Student
        </p>
        <p className="line-clamp-1 text-[0.65rem] font-semibold leading-tight text-white sm:mt-0.5 sm:line-clamp-2 sm:text-sm sm:font-medium">
          {name}
        </p>
        <p className="mt-0.5 truncate text-[0.6rem] text-white/90 sm:mt-1.5 sm:text-xs">
          <span className="font-semibold text-white">ID</span>{' '}
          <span className="sm:hidden">{idShort}</span>
          <span className="hidden sm:inline">{id}</span>
        </p>
        {subtitle?.trim() ? (
          <p className="mt-0.5 line-clamp-1 border-t border-white/15 pt-0.5 text-[0.6rem] leading-snug text-white/85 sm:mt-1 sm:line-clamp-2 sm:pt-1 sm:text-xs">
            {subtitle.trim()}
          </p>
        ) : null}
      </div>
    </div>
  );
}
