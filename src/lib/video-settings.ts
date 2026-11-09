import type { VideoSettingsResponse } from '@/src/types/video-settings';

/**
 * Platform-feature key the value is stored under.
 *
 * `/v1/video-settings` only reads it back; saving goes through
 * `POST /v1/feature/store-or-update` with this key, like every other
 * platform setting.
 */
export const SLEEP_PER_MINUTE_FEATURE_KEY = 'sleep_per_minute';

/** Smallest screen-awake window the dashboard accepts, in minutes. */
export const MIN_SLEEP_PER_MINUTE = 1;

/** Largest screen-awake window the dashboard accepts, in minutes (3 hours). */
export const MAX_SLEEP_PER_MINUTE = 180;

/** Why a typed value was rejected before any request is sent. */
export type SleepPerMinuteError = 'required' | 'integer' | 'range';

export type SleepPerMinuteValidation =
  | { ok: true; value: number }
  | { ok: false; error: SleepPerMinuteError };

function toSleepNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Read `sleep_per_minute` out of a `/v1/video-settings` payload.
 *
 * Accepts the documented flat shape (`{ sleep_per_minute: 5 }`), the same value inside a
 * `data` envelope, and a JSON:API `data.attributes` envelope, because the write endpoint's
 * response shape is unverified. Returns `null` when the payload carries no usable value.
 */
export function parseSleepPerMinute(payload: unknown): number | null {
  if (payload === null || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;
  const direct = toSleepNumber(record.sleep_per_minute);
  if (direct !== null) return direct;

  const data = record.data;
  if (data !== null && typeof data === 'object') {
    const dataRecord = data as Record<string, unknown>;
    const nested = toSleepNumber(dataRecord.sleep_per_minute);
    if (nested !== null) return nested;

    const attributes = dataRecord.attributes;
    if (attributes !== null && typeof attributes === 'object') {
      return toSleepNumber((attributes as Record<string, unknown>).sleep_per_minute);
    }
  }

  return null;
}

/** Narrowing helper so callers can hand a typed response straight to `parseSleepPerMinute`. */
export function readVideoSettings(response: VideoSettingsResponse | undefined): number | null {
  return parseSleepPerMinute(response);
}

/**
 * Validate what the admin typed: a whole number of minutes inside
 * `MIN_SLEEP_PER_MINUTE`–`MAX_SLEEP_PER_MINUTE`.
 */
export function validateSleepPerMinute(input: string | number): SleepPerMinuteValidation {
  const raw = typeof input === 'string' ? input.trim() : input;
  if (raw === '') return { ok: false, error: 'required' };

  const parsed = toSleepNumber(raw);
  if (parsed === null || !Number.isInteger(parsed)) return { ok: false, error: 'integer' };
  if (parsed < MIN_SLEEP_PER_MINUTE || parsed > MAX_SLEEP_PER_MINUTE) {
    return { ok: false, error: 'range' };
  }

  return { ok: true, value: parsed };
}
