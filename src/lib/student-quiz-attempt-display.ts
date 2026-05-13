import type { QuizAttempt } from '@/src/types';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

/** Nested quiz payload: `attributes.quiz.data.attributes` (API-specific). */
export function nestedQuizAttributesFromAttempt(attempt: QuizAttempt): Record<string, unknown> | null {
  const attrs = asRecord(attempt.attributes as unknown);
  if (!attrs) return null;
  const quiz = asRecord(attrs.quiz);
  if (!quiz) return null;
  const data = asRecord(quiz.data);
  if (!data) return null;
  return asRecord(data.attributes);
}

export function readQuizIdForStudentRoutes(attempt: QuizAttempt): string {
  const rel = asRecord((attempt as { relationships?: unknown }).relationships);
  const quizRel = rel ? asRecord(rel.quiz) : null;
  const relData = quizRel ? asRecord(quizRel.data) : null;
  const fromRel = relData?.id;
  if (fromRel != null && String(fromRel).trim()) return String(fromRel).trim();

  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  const qid = attrs?.quiz_id;
  if (qid != null && String(qid).trim()) return String(qid).trim();

  const nest = attrs?.quiz;
  const nestRec = asRecord(nest);
  const data = nestRec ? asRecord(nestRec.data) : null;
  const id = data?.id;
  if (id != null && String(id).trim()) return String(id).trim();

  return '';
}

export function readQuizTitleFromAttempt(attempt: QuizAttempt): string {
  const q = nestedQuizAttributesFromAttempt(attempt);
  const t = q?.title;
  return typeof t === 'string' && t.trim() ? t.trim() : '';
}

export function isAttemptRecordCompleted(attempt: QuizAttempt): boolean {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  if (!attrs) return false;
  if (attrs.finished_at && String(attrs.finished_at).trim()) return true;
  if (attrs.submitted_at && String(attrs.submitted_at).trim()) return true;
  const s = String(attrs.status ?? '')
    .trim()
    .toLowerCase();
  return s === 'submitted' || s === 'graded' || s === 'completed';
}

export function readAttemptFinishedAtIso(attempt: QuizAttempt): string | null {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  const v = attrs?.finished_at ?? attrs?.submitted_at;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function readAttemptStartedAtIso(attempt: QuizAttempt): string | null {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  const v = attrs?.started_at;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function readAttemptPassState(attempt: QuizAttempt): boolean | null {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  if (!attrs) return null;
  if (typeof attrs.passed === 'boolean') return attrs.passed;

  const pct = Number(attrs.percentage);
  const q = nestedQuizAttributesFromAttempt(attempt);
  if (!q) return null;
  const pm = Number(q.passing_marks);
  const tm = Number(q.total_marks);
  if (Number.isFinite(pct) && Number.isFinite(pm) && Number.isFinite(tm) && tm > 0) {
    const threshold = (pm / tm) * 100;
    return pct >= threshold - 1e-9;
  }
  if (Number.isFinite(pct) && Number.isFinite(pm)) {
    return pct >= pm - 1e-9;
  }
  return null;
}

export function readAttemptScoreDisplay(attempt: QuizAttempt): { score: number | null; total: number | null } {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  const score = attrs?.score != null ? Number(attrs.score) : NaN;
  const total = attrs?.total_score != null ? Number(attrs.total_score) : NaN;
  return {
    score: Number.isFinite(score) ? score : null,
    total: Number.isFinite(total) ? total : null,
  };
}

export function readAttemptPercentage(attempt: QuizAttempt): number | null {
  const attrs = attempt.attributes as unknown as Record<string, unknown> | undefined;
  const p = attrs?.percentage != null ? Number(attrs.percentage) : NaN;
  return Number.isFinite(p) ? p : null;
}
