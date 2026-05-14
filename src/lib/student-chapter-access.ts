/**
 * Chapter access on course details — **preview flags only** (no `can_watch`, no `is_activated`).
 *
 * Used while views are **not** exhausted. `CourseDetailsView` / `ChapterRow` combine this with
 * view exhaustion + `can_watch` (see `coerceCanWatchExplicitTrue`).
 *
 * Rules:
 * 1. `is_free_preview` true → video + attachments allowed.
 * 2. `is_free_preview` false and `is_free_preview_attachment` true → video locked, attachments allowed.
 * 3. Both false → video + attachments locked (`isChapterLocked: true`).
 */

export type ChapterPreviewAccess = {
  canWatchLecture: boolean;
  canAccessAttachments: boolean;
  /** True only when both preview flags deny access (case 3). */
  isChapterLocked: boolean;
};

/** Normalize API booleans / 0–1 / numeric strings. */
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

/** `can_watch === false` (or 0 / `"0"`) — for watch routes / explicit deny checks. */
export function coerceCanWatchDenied(value: unknown): boolean {
  if (value === false || value === 0 || value === '0') return true;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'false') return true;
  return false;
}

/** True only for explicit allow: `true` / `1` / `"1"` / `"true"`. */
export function coerceCanWatchExplicitTrue(value: unknown): boolean {
  if (value === true || value === 1 || value === '1') return true;
  if (typeof value === 'string' && value.trim().toLowerCase() === 'true') return true;
  return false;
}

export function getChapterPreviewAccess(attrs: {
  is_free_preview?: unknown;
  is_free_preview_attachment?: unknown;
}): ChapterPreviewAccess {
  const freeVideo = coercePreviewFlag(attrs.is_free_preview);
  const freeAttachment = coercePreviewFlag(attrs.is_free_preview_attachment);

  if (freeVideo) {
    return {
      canWatchLecture: true,
      canAccessAttachments: true,
      isChapterLocked: false,
    };
  }

  if (freeAttachment) {
    return {
      canWatchLecture: false,
      canAccessAttachments: true,
      isChapterLocked: false,
    };
  }

  return {
    canWatchLecture: false,
    canAccessAttachments: false,
    isChapterLocked: true,
  };
}
