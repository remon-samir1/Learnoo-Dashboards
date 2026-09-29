import type { Chapter, ChapterAttributes } from '@/src/types';

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
export function isStudentChapterVideoPlayable(chapter: Chapter): boolean {
  return chapter.attributes.watch_access_state === 'available';
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

/** A duration string that actually describes a video (not "", "—", "0" or "00:00"). */
function hasPlayableDuration(duration: unknown): boolean {
  if (typeof duration !== 'string') return false;
  const s = duration.trim();
  if (!s || s === '—' || s === '-') return false;
  // "0", "0:00", "00:00:00" … all mean "nothing to play".
  return !/^[0:.\s]*$/.test(s);
}

/**
 * Whether a chapter has a video at all — as opposed to being a PDF-only part.
 *
 * The backend withholds the video URLs while a lesson is locked, so probing the
 * URL fields alone cannot tell "PDF-only" apart from "locked video". Order of
 * trust:
 *   1. `video_status` — `"none"` is the backend's explicit "no video" marker.
 *   2. Any non-placeholder video URL.
 *   3. A non-zero `duration`, which stays populated even while the URLs are
 *      withheld and is only ever set for parts that carry a video.
 */
export function chapterHasVideo(attrs: ChapterAttributes): boolean {
  if (attrs.video_status === 'none') return false;
  if (attrs.video_status != null) return true;
  if (
    !isNoVideoUrl(attrs.video ?? null) ||
    !isNoVideoUrl(attrs.playlist ?? null) ||
    !isNoVideoUrl(attrs.video_hls_url ?? null) ||
    !isNoVideoUrl(attrs.video_mp4_url ?? null)
  ) {
    return true;
  }
  return hasPlayableDuration(attrs.duration);
}

/**
 * Whether a chapter must be hidden from the student entirely — lectures list,
 * part counters, next/previous navigation and search alike.
 *
 * `not_published` is the backend's decision for a lesson whose schedule has not
 * arrived yet; the legacy `schedule` / `schedule_start` timestamps are kept as a
 * fallback for payloads that do not carry `watch_access_state`.
 */
export function isChapterHiddenFromStudent(chapter: Chapter): boolean {
  const attrs = chapter.attributes;
  if (attrs.watch_access_state === 'not_published') return true;

  const scheduledAt = attrs.schedule ?? attrs.schedule_start ?? null;
  if (scheduledAt) {
    const time = new Date(String(scheduledAt).replace(' ', 'T')).getTime();
    if (!Number.isNaN(time) && time > Date.now()) return true;
  }
  return false;
}
