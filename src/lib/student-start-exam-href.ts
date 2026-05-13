/**
 * Student "start exam" deep links. Optional `course` preserves the owning course when
 * GET /v1/quiz/:id fails (e.g. activation gate) so the start page can still link to course details.
 */
export function buildStudentStartExamHref(
  locale: string,
  quizId: string | number,
  courseId?: string | number | null,
): string {
  const idStr = typeof quizId === 'number' ? String(quizId) : String(quizId).trim();
  const base = `/${locale}/student/exams/start-exam/${encodeURIComponent(idStr)}`;
  const cid = courseId != null ? String(courseId).trim() : '';
  if (cid && /^\d+$/.test(cid)) {
    return `${base}?course=${encodeURIComponent(cid)}`;
  }
  return base;
}

/** Course details URL segment must be numeric for our routes. */
export function sanitizeNumericCourseQueryParam(raw: string | undefined | null): string | null {
  const s = raw?.trim() ?? '';
  if (!s || !/^\d+$/.test(s)) return null;
  return s;
}

export function isLikelyQuizAccessDeniedError(args: { httpStatus?: number; message?: string }): boolean {
  const s = args.httpStatus;
  if (s === 403 || s === 401) return true;
  const m = (args.message ?? '').toLowerCase();
  if (m.includes('do not have access')) return true;
  if (m.includes('access') && m.includes('quiz')) return true;
  if (m.includes('forbidden')) return true;
  return false;
}

/** Recover course id from a stored back link like `/en/student/courses/course-details/33`. */
export function parseCourseIdFromCourseDetailsPath(href: string | undefined | null): string | null {
  const h = href?.trim();
  if (!h) return null;
  const m = h.match(/\/student\/courses\/course-details\/([^/?#]+)/);
  const id = m?.[1]?.trim() ?? '';
  if (!id || !/^\d+$/.test(id)) return null;
  return id;
}
