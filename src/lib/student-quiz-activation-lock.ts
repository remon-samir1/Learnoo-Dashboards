/**
 * Course / quiz activation gate on the student side.
 * When `is_public === false`, the quiz is treated as locked until the student redeems a code;
 * the backend sets `is_public` to true after successful POST `/v1/code/activate` with `item_type: "quiz"`.
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
  return coerceAttrBoolean(attrs.is_public) === false;
}
