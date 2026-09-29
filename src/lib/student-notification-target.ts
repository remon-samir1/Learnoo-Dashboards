/**
 * Notification helpers: normalizing the list payload, classifying a notification for the
 * filter chips / icons, and resolving the in-app destination a notification points at.
 *
 * The backend does not return an explicit target route, so the destination is recovered
 * best-effort from whatever ids the notification class happened to put in `data`. When
 * nothing usable is there the notification simply has no link and stays a read-only row.
 */

import type {
  StudentNotification,
  StudentNotificationCategory,
  StudentNotificationListResponse,
  StudentNotificationMeta,
} from '@/src/types/student-notification';

/** Ids must be url-safe segments for our routes; everything else is ignored. */
function readId(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const raw = source[key];
    if (raw == null) continue;
    if (typeof raw !== 'string' && typeof raw !== 'number') continue;
    const value = String(raw).trim();
    if (!value || value === '0') continue;
    if (!/^[\w-]+$/.test(value)) continue;
    return value;
  }
  return null;
}

/** Flattens `data` plus a nested `data.data` bag, which some notification classes use. */
function readPayload(notification: StudentNotification): Record<string, unknown> {
  const data = (notification.data ?? {}) as Record<string, unknown>;
  const nested = data.data;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...data };
  }
  return data;
}

/**
 * Classifies a notification from its Laravel class name (`type`) or `data.type`.
 * Mirrors the icon buckets the mobile notifications screen uses.
 */
export function getStudentNotificationCategory(
  notification: StudentNotification,
): Exclude<StudentNotificationCategory, 'all'> {
  const raw = `${notification.data?.type ?? ''} ${notification.type ?? ''}`.toLowerCase();

  if (raw.includes('live') || raw.includes('room') || raw.includes('stream')) return 'live';
  if (raw.includes('exam') || raw.includes('quiz')) return 'exam';
  if (raw.includes('course') || raw.includes('lecture') || raw.includes('chapter')) return 'course';
  return 'general';
}

/**
 * In-app href a notification points at, or `null` when `data` carries no usable id.
 * Only same-origin relative paths are produced; an absolute `url` in the payload is
 * accepted only when it is a path on this site.
 */
export function resolveStudentNotificationHref(
  notification: StudentNotification,
  locale: string,
): string | null {
  const payload = readPayload(notification);
  const base = `/${locale}/student`;

  const liveId = readId(payload, ['live_room_id', 'live_session_id', 'room_id', 'liveRoomId']);
  if (liveId) return `${base}/live-sessions/${liveId}`;

  const quizId = readId(payload, ['quiz_id', 'exam_id', 'quizId', 'examId']);
  if (quizId) {
    const courseId = readId(payload, ['course_id', 'courseId']);
    const href = `${base}/exams/start-exam/${quizId}`;
    return courseId && /^\d+$/.test(courseId) ? `${href}?course=${courseId}` : href;
  }

  const chapterId = readId(payload, ['chapter_id', 'lecture_id', 'chapterId', 'lectureId']);
  if (chapterId) return `${base}/courses/watch/${chapterId}`;

  const courseId = readId(payload, ['course_id', 'courseId']);
  if (courseId) return `${base}/courses/course-details/${courseId}`;

  const libraryId = readId(payload, ['library_id', 'libraryId']);
  if (libraryId) return `${base}/library/${libraryId}`;

  const noteId = readId(payload, ['note_id', 'noteId']);
  if (noteId) return `${base}/notes/${noteId}`;

  const postId = readId(payload, ['post_id', 'discussion_id', 'postId']);
  if (postId) return `${base}/community?post=${postId}`;

  // Explicit link, when the backend ever sends one. Relative in-app paths only.
  const rawUrl = payload.url ?? payload.link ?? payload.route;
  if (typeof rawUrl === 'string') {
    const value = rawUrl.trim();
    if (value.startsWith('/') && !value.startsWith('//')) return value;
  }

  return null;
}

/** Reads both the `{ data: [...] }` and the nested-paginator response shapes. */
export function normalizeStudentNotifications(
  response: StudentNotificationListResponse | null | undefined,
): StudentNotification[] {
  const raw = response?.data;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object' && Array.isArray(raw.data)) return raw.data;
  return [];
}

/** Reads `meta` from either the top level or the nested paginator. */
export function normalizeStudentNotificationMeta(
  response: StudentNotificationListResponse | null | undefined,
): StudentNotificationMeta | null {
  if (response?.meta) return response.meta;
  const raw = response?.data;
  if (raw && !Array.isArray(raw) && typeof raw === 'object' && raw.meta) return raw.meta;
  return null;
}

/** Newest first, so realtime arrivals and refetched pages order identically. */
export function sortStudentNotifications(items: StudentNotification[]): StudentNotification[] {
  return [...items].sort((a, b) => {
    const left = Date.parse(a?.created_at ?? '');
    const right = Date.parse(b?.created_at ?? '');
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return right - left;
  });
}

/** Merges incoming rows with what is already in the store, de-duplicating by id. */
export function mergeStudentNotifications(
  incoming: StudentNotification[],
  existing: StudentNotification[],
): StudentNotification[] {
  const byId = new Map<string, StudentNotification>();

  for (const item of [...existing, ...incoming]) {
    const id = typeof item?.id === 'string' || typeof item?.id === 'number' ? String(item.id) : '';
    if (!id) continue;
    // `incoming` wins: it is the fresher copy (e.g. a row that just became read).
    byId.set(id, { ...item, id });
  }

  return sortStudentNotifications([...byId.values()]);
}
