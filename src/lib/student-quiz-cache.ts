import type { Quiz, FinishQuizAttemptResponse } from '@/src/types';

const PAYLOAD_VERSION = 1 as const;

export type StudentTakePayload = {
  version: typeof PAYLOAD_VERSION;
  quiz: Quiz;
  /** Same target used by intro Cancel when history back is unavailable */
  backHref: string;
  /** Resource id from POST /v1/quiz-attempt (start attempt). */
  attemptId: string;
  /** Client timestamp (ms) when student clicked Start after POST /quiz-attempt succeeded */
  examStartedAtMs: number;
};

const RESULT_VERSION = 2 as const;

export type StudentQuizResultPayload = {
  version: typeof RESULT_VERSION;
  quizId: string;
  locale: string;
  backHref: string;
  /** Full body from PUT `/v1/quiz-attempt/{attemptId}` after finish. */
  finishResponse: FinishQuizAttemptResponse;
  /** Quiz snapshot at submit time — used only for “Review answers” (not sent to API). */
  quizForReview?: Quiz;
  /** Student selections keyed by question id — same shape as during the exam. */
  selectionsForReview?: Record<string, string[]>;
};

export function studentTakeSessionKey(quizId: string): string {
  return `learnoo_student_quiz_take_${quizId}`;
}

export function writeStudentTakePayload(quizId: string, payload: StudentTakePayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(studentTakeSessionKey(quizId), JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

export function readStudentTakePayload(quizId: string): StudentTakePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(studentTakeSessionKey(quizId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentTakePayload;
    if (parsed?.version !== PAYLOAD_VERSION || !parsed.quiz || !parsed.backHref || !parsed.attemptId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStudentTakePayload(quizId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(studentTakeSessionKey(quizId));
  } catch {
    /* ignore */
  }
}

export function studentQuizResultKey(quizId: string): string {
  return `learnoo_student_quiz_result_${quizId}`;
}

export function writeStudentQuizResultPayload(quizId: string, payload: StudentQuizResultPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(studentQuizResultKey(quizId), JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
}

export function readStudentQuizResultPayload(quizId: string): StudentQuizResultPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(studentQuizResultKey(quizId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentQuizResultPayload;
    if (
      parsed?.version !== RESULT_VERSION ||
      !parsed.finishResponse?.results ||
      parsed.finishResponse.quiz_info == null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearStudentQuizResultPayload(quizId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(studentQuizResultKey(quizId));
  } catch {
    /* ignore */
  }
}
