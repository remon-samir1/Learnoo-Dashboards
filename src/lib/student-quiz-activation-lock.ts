/**
 * Course / quiz activation gate on the student side.
 * - `is_public === true` → accessible (ignore `has_activation`).
 * - `is_public === false` → locked until activation; unlocked when `has_activation` is true
 *   (e.g. after POST `/v1/code/activate` with `item_type: "quiz"` and refreshed course payload).
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
