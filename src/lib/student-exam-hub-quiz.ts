/**
 * Helpers for GET /v1/quiz list rows on the student Exams hub (loose API shape).
 */

import { quizRequiresCourseActivationLock } from '@/src/lib/student-quiz-activation-lock';

export type HubQuizListRow = {
  id: string;
  type?: string;
  attributes?: Record<string, unknown>;
};

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

export function hubQuizAttrs(row: HubQuizListRow): Record<string, unknown> {
  const a = row.attributes;
  return a != null && typeof a === 'object' && !Array.isArray(a) ? (a as Record<string, unknown>) : {};
}

export function readHubQuizMaxAttempts(row: HubQuizListRow): number | null {
  const attrs = hubQuizAttrs(row);
  const fromAttrs =
    coercePositiveInt(attrs.max_attempts) ?? coercePositiveInt(attrs.maxAttempts);
  if (fromAttrs != null) return fromAttrs;
  const top = row as Record<string, unknown>;
  return coercePositiveInt(top.max_attempts) ?? coercePositiveInt(top.maxAttempts);
}

export function readHubQuizCurrentAttempts(row: HubQuizListRow): number | null {
  const attrs = hubQuizAttrs(row);
  return (
    coerceNonNegativeInt(attrs.current_attempts) ??
    coerceNonNegativeInt((row as Record<string, unknown>).current_attempts)
  );
}

export function readHubQuizRemainingAttempts(row: HubQuizListRow): number | null {
  const attrs = hubQuizAttrs(row);
  const direct =
    coerceNonNegativeInt(attrs.remaining_attempts) ??
    coerceNonNegativeInt((row as Record<string, unknown>).remaining_attempts);
  if (direct != null) return direct;
  const max = readHubQuizMaxAttempts(row);
  const cur = readHubQuizCurrentAttempts(row);
  if (max != null && cur != null) return Math.max(0, max - cur);
  return null;
}

export function hubQuizAttemptsSummaryLines(
  row: HubQuizListRow,
  t: (key: string, values?: Record<string, string | number>) => string,
): string[] {
  const max = readHubQuizMaxAttempts(row);
  const rem = readHubQuizRemainingAttempts(row);
  const cur = readHubQuizCurrentAttempts(row);
  if (rem != null && max != null && cur != null) {
    return [t('examsAttemptsOverview', { remaining: rem, max, current: cur })];
  }
  if (rem != null && max != null) {
    return [t('examsAttemptsRemainingOfMax', { remaining: rem, max })];
  }
  if (cur != null && max != null) {
    return [t('examsAttemptsUsedOfMax', { current: cur, max })];
  }
  if (max != null) {
    return [t('examsAttemptsAllowed', { count: max })];
  }
  return [];
}

export function hubQuizQuestionCount(row: HubQuizListRow): number {
  const qs = hubQuizAttrs(row).questions;
  return Array.isArray(qs) ? qs.length : 0;
}

export function hubQuizChapterTitle(row: HubQuizListRow): string | null {
  const attrs = hubQuizAttrs(row);
  const ch = attrs.chapter;
  if (ch == null || typeof ch !== 'object') return null;
  const rec = ch as Record<string, unknown>;
  const data = rec.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const inner = data.attributes as Record<string, unknown> | undefined;
  const title = inner?.title;
  return typeof title === 'string' && title.trim() ? title.trim() : null;
}

export function hubQuizTypeLabel(
  row: HubQuizListRow,
  t: (key: string, values?: Record<string, string | number>) => string,
): string | null {
  const raw = hubQuizAttrs(row).type;
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'exam') return t('examsTypeExam');
  if (s === 'homework') return t('examsTypeHomework');
  return t('examsTypeRaw', { type: String(raw).trim() });
}

export type HubQuizBucket = 'available' | 'upcoming' | 'locked' | 'hidden';

export function classifyHubQuizRow(row: HubQuizListRow, nowMs: number): HubQuizBucket {
  const attrs = hubQuizAttrs(row);
  if (quizRequiresCourseActivationLock(attrs)) return 'locked';

  const status = String(attrs.status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'draft') return 'hidden';

  const startRaw = attrs.start_time;
  const endRaw = attrs.end_time;
  const start = typeof startRaw === 'string' && startRaw.trim() ? new Date(startRaw).getTime() : NaN;
  const end = typeof endRaw === 'string' && endRaw.trim() ? new Date(endRaw).getTime() : NaN;

  const rem = readHubQuizRemainingAttempts(row);

  if (status !== 'active') {
    return 'locked';
  }

  if (!Number.isNaN(start) && start > nowMs) {
    return 'upcoming';
  }
  if (!Number.isNaN(end) && end < nowMs) {
    return 'locked';
  }
  if (rem === 0) {
    return 'locked';
  }

  return 'available';
}

export function hubQuizTitle(row: HubQuizListRow): string {
  const t = hubQuizAttrs(row).title;
  return typeof t === 'string' && t.trim() ? t.trim() : '—';
}

export function hubQuizDurationMinutes(row: HubQuizListRow): number {
  const d = hubQuizAttrs(row).duration;
  return typeof d === 'number' && Number.isFinite(d) && d > 0 ? d : 0;
}

export function hubQuizPassMarks(row: HubQuizListRow): { passing: number; total: number } | null {
  const attrs = hubQuizAttrs(row);
  const total = attrs.total_marks;
  const passing = attrs.passing_marks;
  if (typeof total !== 'number' || !Number.isFinite(total)) return null;
  if (typeof passing !== 'number' || !Number.isFinite(passing)) return null;
  return { passing, total };
}

export function daysWholeFromNowTo(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  if (target <= now) return null;
  return Math.max(1, Math.ceil((target - now) / 86400000));
}
