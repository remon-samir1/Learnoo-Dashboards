import type { Chapter } from '@/src/types';

/**
 * Student chapter / part access — **trust the backend** for video.
 *
 * Three cases govern a chapter's content visibility:
 *
 * CASE 1 — Free preview (chapter still locked or not fully activated):
 *   - `is_free_preview` flag controls **video only** — if true, the video is watchable.
 *   - `is_free_preview_attachment` flag controls **PDF only** — if true, the PDF is viewable.
 *   - These two flags are completely independent.
 *
 * CASE 2 — Chapter explicitly activated (`is_activated === true` or course purchased):
 *   - All content (video and PDF) is fully accessible regardless of free-preview flags.
 *
 * CASE 3 — Views exhausted (`current_user_views >= max_views`):
 *   - Show a re-activation button.
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
 * Determines if a chapter is genuinely fully unlocked via user purchase/activation.
 * We CANNOT just rely on `chapter.attributes.is_locked === false` because the API
 * dynamically sets it to false if the video is free preview!
 */
export function isChapterFullyUnlocked(chapter: Chapter, courseLocked: boolean): boolean {
  // If the entire course is unlocked, the chapter is fully unlocked.
  if (!courseLocked) return true;
  // If the chapter was explicitly activated by the user.
  if (chapter.attributes.is_activated === true) return true;
  return false;
}

/**
 * Whether the chapter VIDEO is currently playable.
 */
export function isStudentChapterVideoPlayable(chapter: Chapter, courseLocked: boolean): boolean {
  if (isChapterFullyUnlocked(chapter, courseLocked)) return true;

  const attrs = chapter.attributes;
  if (coercePreviewFlag(attrs.is_free_preview)) return true;
  return coerceCanWatchExplicitTrue(attrs.can_watch);
}

/**
 * Whether the video requires an activation prompt (i.e. currently locked/unaccessible).
 */
export function isStudentChapterVideoRequiresActivation(chapter: Chapter, courseLocked: boolean): boolean {
  if (isChapterFullyUnlocked(chapter, courseLocked)) return false;

  const attrs = chapter.attributes;
  if (coercePreviewFlag(attrs.is_free_preview)) return false;
  if (coerceCanWatchExplicitTrue(attrs.can_watch)) return false;

  return true;
}

/**
 * Whether the chapter PDF is visible.
 */
export function isStudentChapterPdfVisible(chapter: Chapter, courseLocked: boolean): boolean {
  if (isChapterFullyUnlocked(chapter, courseLocked)) return true;

  const attrs = chapter.attributes;
  return coercePreviewFlag(attrs.is_free_preview_attachment);
}

/**
 * Whether the PDF requires an activation prompt.
 */
export function isStudentChapterPdfRequiresActivation(chapter: Chapter, courseLocked: boolean): boolean {
  if (isChapterFullyUnlocked(chapter, courseLocked)) return false;

  const attrs = chapter.attributes;
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
