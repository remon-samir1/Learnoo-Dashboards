export type GeneratedQuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer';

export interface GeneratedExamAnswer {
  text: string;
  isCorrect: boolean;
  reason: string;
}

export interface GeneratedExamQuestion {
  text: string;
  type: GeneratedQuestionType;
  score: number;
  autoCorrect: boolean;
  answers: GeneratedExamAnswer[];
}

const QUESTION_TYPES = new Set<GeneratedQuestionType>([
  'single_choice',
  'multiple_choice',
  'true_false',
  'short_answer',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1';
}

function toQuestionType(value: unknown): GeneratedQuestionType {
  return typeof value === 'string' && QUESTION_TYPES.has(value as GeneratedQuestionType)
    ? (value as GeneratedQuestionType)
    : 'single_choice';
}

function parseAnswer(value: unknown): GeneratedExamAnswer | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) return null;

  return {
    text: value.text.trim(),
    isCorrect: toBoolean(value.is_correct),
    reason: typeof value.reason === 'string' ? value.reason : '',
  };
}

function parseQuestion(value: unknown): GeneratedExamQuestion | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) return null;

  const type = toQuestionType(value.type);
  const score = typeof value.score === 'number' && Number.isFinite(value.score) && value.score >= 0
    ? value.score
    : 1;
  const answers = Array.isArray(value.answers)
    ? value.answers.map(parseAnswer).filter((answer): answer is GeneratedExamAnswer => answer !== null)
    : [];

  if (type !== 'short_answer' && answers.length < 2) return null;

  return {
    text: value.text.trim(),
    type,
    score,
    autoCorrect: toBoolean(value.auto_correct),
    answers,
  };
}

/**
 * Validates the currently observed AI webhook envelope without widening the
 * backend contract. Invalid or incomplete questions are rejected.
 */
export function parseGeneratedExamQuestions(payload: unknown): GeneratedExamQuestion[] {
  if (!Array.isArray(payload) || !isRecord(payload[0]) || !Array.isArray(payload[0].output)) {
    throw new Error('INVALID_AI_RESPONSE');
  }

  const questions = payload[0].output
    .map(parseQuestion)
    .filter((question): question is GeneratedExamQuestion => question !== null);

  if (questions.length === 0) {
    throw new Error('INVALID_AI_RESPONSE');
  }

  return questions;
}
