/**
 * Course / quiz activation gate on the student side.
 * - `is_public === true` → accessible (ignore `has_activation`).
 * - `is_public === false` → private exam. Access is granted when EITHER:
 *     a) the API has already attached `has_activation = true` to this quiz, OR
 *     b) the owning course (from `courses.data[0].id` or `course_id`) is in the
 *        student's enrolled courses list (which means the student has already
 *        activated the course on the My Courses page). If neither holds, the
 *        exam is locked and the student is asked to activate the course first.
 */

export function coerceAttrBoolean(v: unknown): boolean | undefined {
  if (v === true) return true;
  if (v === false) return false;
  if (v === 1) return true;
  if (v === 0) return false;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (!s) return undefined;
    if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true;
    if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false;
  }
  return undefined;
}

function coercePositiveInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseInt(trimmed, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function coerceNonNegativeInt(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const n = Number.parseInt(trimmed, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/**
 * Remaining attempts from loose quiz/exam attributes (`remaining_attempts` or max − current).
 */
export function readRemainingAttemptsFromQuizAttributes(
  attrs: Record<string, unknown> | null | undefined,
): number | null {
  if (!attrs) return null;
  const direct = coerceNonNegativeInt(attrs.remaining_attempts);
  if (direct != null) return direct;
  const max =
    coercePositiveInt(attrs.max_attempts) ?? coercePositiveInt(attrs.maxAttempts);
  const cur = coerceNonNegativeInt(attrs.current_attempts);
  if (max != null && cur != null) return Math.max(0, max - cur);
  return null;
}

function asStringId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
  }
  return null;
}

/** Normalise a course id from various shapes the API may return. */
function normaliseCourseId(value: unknown): string | null {
  return asStringId(value);
}

/**
 * Resolve the owning course id for a quiz from the loose API payload.
 * Tries `courses.data[0].id` first, then `course_id` as a fallback.
 */
export function readQuizOwningCourseId(
  attrs: Record<string, unknown> | null | undefined
): string | null {
  if (!attrs) return null;
  const courses = attrs.courses;
  if (courses != null && typeof courses === 'object' && !Array.isArray(courses)) {
    const data = (courses as Record<string, unknown>).data;
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (first != null && typeof first === 'object') {
        const id = normaliseCourseId((first as Record<string, unknown>).id);
        if (id != null) return id;
      }
    }
  }
  const direct = normaliseCourseId(attrs.course_id);
  if (direct != null) return direct;
  return null;
}

/**
 * Returns `true` when a private exam's owning course is present in the
 * student's enrolled courses list. The comparison is string-based so it
 * tolerates numeric/string mismatches from the API.
 */
export function quizCourseIsEnrolled(
  attrs: Record<string, unknown> | null | undefined,
  enrolledCourseIds: ReadonlySet<string> | Iterable<string> | null | undefined
): boolean {
  if (!attrs || enrolledCourseIds == null) return false;
  const cid = readQuizOwningCourseId(attrs);
  if (cid == null) return false;
  const set: ReadonlySet<string> =
    enrolledCourseIds instanceof Set
      ? (enrolledCourseIds as ReadonlySet<string>)
      : new Set<string>(
          (() => {
            const out: string[] = [];
            for (const v of enrolledCourseIds as Iterable<string>) {
              if (typeof v === 'string' && v.trim()) out.push(v.trim());
            }
            return out;
          })()
        );
  return set.has(cid);
}

/** True when the student must redeem an activation code before accessing this quiz/exam. */
export function quizRequiresCourseActivationLock(
  attrs: Record<string, unknown> | null | undefined,
): boolean {
  if (!attrs) return false;
  if (coerceAttrBoolean(attrs.is_public) === true) return false;
  if (coerceAttrBoolean(attrs.is_public) !== false) return false;
  if (coerceAttrBoolean(attrs.has_activation) === true) return false;
  return true;
}

/**
 * Same as {@link quizRequiresCourseActivationLock} but also returns `false`
 * (i.e. unlocks the exam) when the owning course is already in the student's
 * enrolled courses list — the student has effectively activated it from
 * the My Courses page, so we should not block them on the exam card.
 */
export function quizRequiresCourseActivationLockWithEnrolled(
  attrs: Record<string, unknown> | null | undefined,
  enrolledCourseIds?: ReadonlySet<string> | Iterable<string> | null
): boolean {
  if (quizRequiresCourseActivationLock(attrs) === false) return false;
  if (quizCourseIsEnrolled(attrs, enrolledCourseIds)) return false;
  return true;
}

/**
 * Private exam was already activated but the student used all attempts — enter a new code again.
 * Requires explicit `remaining === 0` from API (or derived from max/current).
 */
export function quizNeedsReactivationAfterExhaustedAttempts(
  attrs: Record<string, unknown> | null | undefined,
): boolean {
  if (!attrs) return false;
  if (coerceAttrBoolean(attrs.is_public) === true) return false;
  if (coerceAttrBoolean(attrs.is_public) !== false) return false;
  if (coerceAttrBoolean(attrs.has_activation) !== true) return false;
  return readRemainingAttemptsFromQuizAttributes(attrs) === 0;
}

/** First-time activation or re-activation after attempts are exhausted (private exams). */
export function quizStudentMustActivateOrReactivate(
  attrs: Record<string, unknown> | null | undefined,
): boolean {
  return quizRequiresCourseActivationLock(attrs) || quizNeedsReactivationAfterExhaustedAttempts(attrs);
}

/**
 * Enrolled-aware variant. Treats a private exam as already activated when the
 * owning course appears in the student's enrolled courses list. The reactivation
 * path is only reached when the student has previously activated the quiz
 * (e.g. by `has_activation === true`) but exhausted attempts.
 */
export function quizStudentMustActivateOrReactivateWithEnrolled(
  attrs: Record<string, unknown> | null | undefined,
  enrolledCourseIds?: ReadonlySet<string> | Iterable<string> | null
): boolean {
  return (
    quizRequiresCourseActivationLockWithEnrolled(attrs, enrolledCourseIds) ||
    quizNeedsReactivationAfterExhaustedAttempts(attrs)
  );
}

/**
 * Inner payload from POST `/v1/code/activate` (after `res.data`).
 * When the API returns explicit `done: false` and `has_activation: false`, the quiz stays locked.
 * If those flags are absent, treat as success for backward compatibility.
 */
export function activateCodeResponseUnlocksQuiz(data: unknown): boolean {
  if (data == null || typeof data !== 'object') return true;
  const o = data as Record<string, unknown>;
  if (o.done === true) return true;
  if (coerceAttrBoolean(o.has_activation) === true) return true;
  if (o.done === false && coerceAttrBoolean(o.has_activation) === false) return false;
  return true;
}
