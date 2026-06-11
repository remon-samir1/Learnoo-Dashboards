import type { Chapter } from '@/src/types';

/**
 * Student chapter / part access — **trust the backend** for video.
 *
 * - Do **not** compare `max_views` vs `current_user_views` for allow/deny; the API sets `can_watch`.
 * - **Video**: playable only when `can_watch` is explicitly true and the chapter is not `is_locked`.
 * - **PDF / attachments (student UI)**: **`is_free_preview_attachment` only** — `true` → show; otherwise hide.
 *   Independent of `can_watch`, activation, and view limits.
 */

/** Normalize API booleans / 0–1 / numeric strings for preview flags. */
export function coercePreviewFlag(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') return true;
  if (value === false || value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    if (s === 'true' || s === 'yes') return true;
    if (s === 'false' || s === 'no' || s === '') return false;
  }
  return Boolean(value);
}

/** True only when the backend explicitly allows watching (`true` / `1` / `"1"` / `"true"`). */
export function coerceCanWatchExplicitTrue(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') return true;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'true') return true;
  return false;
}

/** Chapter video stream — `can_watch` + `is_locked` + `is_free_preview`. */
export function isStudentChapterVideoPlayable(chapter: Chapter): boolean {
  const attrs = chapter.attributes;
  if (attrs.is_locked === true) return false;

  return (
    coercePreviewFlag(attrs.is_free_preview) ||
    coerceCanWatchExplicitTrue(attrs.can_watch)
  );
}


/** Whether PDF/attachment UI may be shown — **`is_free_preview_attachment` only** (API boolean / 0–1). */
export function isStudentChapterPdfVisible(chapter: Chapter): boolean {
  const attrs = chapter.attributes;

  // We still respect is_locked for general availability, but if it's a free preview attachment, we show it.
  if (attrs.is_locked === true && !coercePreviewFlag(attrs.is_free_preview_attachment)) {
    return false;
  }

  return (
    coercePreviewFlag(attrs.is_free_preview_attachment) ||
    coerceCanWatchExplicitTrue(attrs.can_watch)
  );
}

/**
 * Detects if a video URL from the backend is actually a placeholder indicating "no video".
 * Common placeholder: "https://api.learnoo.app/storage"
 */
export function isNoVideoUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const s = url.trim();
  if (!s) return true;
  return s === 'https://api.learnoo.app/storage' || s === 'https://api.learnoo.app/storage/';
}
