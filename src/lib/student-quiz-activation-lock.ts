/**
 * Course activation gate for quizzes/exams on the student side.
 * Locked when: has_activation === true AND is_public === false (API may send loose types).
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

/** True when the student must activate the course before accessing this quiz/exam. */
export function quizRequiresCourseActivationLock(
  attrs: Record<string, unknown> | null | undefined,
): boolean {
  if (!attrs) return false;
  const hasActivation = coerceAttrBoolean(attrs.has_activation);
  const isPublic = coerceAttrBoolean(attrs.is_public);
  return hasActivation === true && isPublic === false;
}
