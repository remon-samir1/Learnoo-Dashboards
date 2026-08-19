import type { Chapter } from '@/src/types';

/**
 * Student chapter / part access — **trust the backend** for video.
 *
 * Three cases govern a chapter's content visibility:
 *
 * CASE 1 — Free preview (chapter still locked, `is_locked === true`):
 *   - `is_free_preview` flag controls **video only** — if true, the video is watchable even while locked.
 *   - `is_free_preview_attachment` flag controls **PDF only** — if true, the PDF is viewable even while locked.
 *   - These two flags are completely independent; a chapter with only PDF and `is_free_preview=true`
 *     remains locked for the PDF (needs `is_free_preview_attachment=true`).
 *
 * CASE 2 — Chapter activated (`is_locked === false`):
 *   - All content (video and PDF) is fully accessible regardless of free-preview flags.
 *   - `is_locked` is the authoritative key; free-preview flags do not matter.
 *
 * CASE 3 — Views exhausted (`current_user_views >= max_views`):
 *   - Show a re-activation button. After the user re-enters a code, `is_locked` becomes false → Case 2 applies.
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

/**
 * Whether the chapter VIDEO is currently playable.
 *
 * - CASE 2: `is_locked === false` → always playable (if any video content exists).
 * - CASE 1: `is_locked === true` → playable only if `is_free_preview` is true.
 * - Otherwise, trust `can_watch` from the server.
 */
export function isStudentChapterVideoPlayable(chapter: Chapter): boolean {
  const attrs = chapter.attributes;

  // CASE 2: chapter fully unlocked — video is accessible
  if (attrs.is_locked === false) return true;

  // CASE 1: chapter is locked but free-preview flag allows video
  if (coercePreviewFlag(attrs.is_free_preview)) return true;

  // Fallback: trust server can_watch (e.g. intermediate states)
  return coerceCanWatchExplicitTrue(attrs.can_watch);
}

/**
 * Whether the video requires an activation prompt (i.e. accessible but pending a code entry).
 * Only relevant when `is_locked` is NOT false (not yet fully activated).
 */
export function isStudentChapterVideoRequiresActivation(chapter: Chapter): boolean {
  const attrs = chapter.attributes;
  // CASE 2: fully unlocked → no activation needed
  if (attrs.is_locked === false) return false;
  // Already activated
  if (attrs.is_activated === true) return false;
  // can_watch is granted but is_free_preview is false → server says "watch but not fully open"
  if (!coerceCanWatchExplicitTrue(attrs.can_watch)) return false;
  return !coercePreviewFlag(attrs.is_free_preview);
}

/**
 * Whether the chapter PDF is visible.
 *
 * - CASE 2: `is_locked === false` → always visible (if PDF attachment exists).
 * - CASE 1: `is_locked === true` → visible only if `is_free_preview_attachment` is true.
 * - `is_free_preview` has NO effect on PDF visibility.
 */
export function isStudentChapterPdfVisible(chapter: Chapter): boolean {
  const attrs = chapter.attributes;

  // CASE 2: chapter fully unlocked — PDF is accessible
  if (attrs.is_locked === false) return true;

  // CASE 1: chapter is locked but free-preview-attachment flag allows PDF
  if (coercePreviewFlag(attrs.is_free_preview_attachment)) return true;

  // Fallback: trust server can_watch for PDF too
  return coerceCanWatchExplicitTrue(attrs.can_watch);
}

/**
 * Whether the PDF requires an activation prompt.
 * Only relevant when `is_locked` is NOT false.
 */
export function isStudentChapterPdfRequiresActivation(chapter: Chapter): boolean {
  const attrs = chapter.attributes;
  // CASE 2: fully unlocked → no activation needed
  if (attrs.is_locked === false) return false;
  // Already activated
  if (attrs.is_activated === true) return false;
  // can_watch granted but is_free_preview_attachment is false → PDF needs activation
  if (!coerceCanWatchExplicitTrue(attrs.can_watch)) return false;
  return !coercePreviewFlag(attrs.is_free_preview_attachment);
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
