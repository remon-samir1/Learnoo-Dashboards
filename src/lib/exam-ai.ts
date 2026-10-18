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

function toQuestionType(value: unknown): GeneratedQuestionType | null {
  return typeof value === 'string' && QUESTION_TYPES.has(value as GeneratedQuestionType)
    ? (value as GeneratedQuestionType)
    : null;
}

function parseAnswer(value: unknown): GeneratedExamAnswer | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) return null;
  if (![true, false, 1, 0, '1', '0'].includes(value.is_correct as boolean)) return null;

  return {
    text: value.text.trim().replace(/^[أابجدA-Da-d][).:\-]\s*/u, ''),
    isCorrect: toBoolean(value.is_correct),
    reason: typeof value.reason === 'string' ? value.reason : '',
  };
}

function parseQuestion(value: unknown): GeneratedExamQuestion | null {
  if (!isRecord(value) || typeof value.text !== 'string' || !value.text.trim()) return null;

  const type = toQuestionType(value.type);
  if (!type || typeof value.score !== 'number' || !Number.isInteger(value.score) || value.score < 1) return null;
  const answers = Array.isArray(value.answers)
    ? value.answers.map(parseAnswer)
    : [];
  if (!answers.length || answers.some(answer => answer === null)) return null;
  const validAnswers = answers as GeneratedExamAnswer[];
  if (validAnswers.some(answer => !answer.text)) return null;
  const content = [value.text, ...validAnswers.map(answer => answer.text)].join(' ');
  const arabic = content.match(/\p{Script=Arabic}/gu)?.length || 0;
  const latin = content.match(/[A-Za-z]/g)?.length || 0;
  if (arabic > latin && /\p{Script=Arabic}[A-Za-z]|[A-Za-z]\p{Script=Arabic}|(?=[A-Za-z]{3})[A-Za-z]*[a-z][A-Za-z]*/u.test(content)) return null;
  const correctCount = validAnswers.filter(answer => answer.isCorrect).length;
  if (correctCount === 0 || (['single_choice', 'true_false'].includes(type) && correctCount !== 1)) return null;
  if (type === 'true_false' && answers.length !== 2) return null;
  if (type !== 'short_answer' && answers.length < 2) return null;

  return {
    text: value.text.trim(),
    type,
    score: value.score,
    autoCorrect: toBoolean(value.auto_correct),
    answers: validAnswers,
  };
}

/**
 * Validates the currently observed AI webhook envelope without widening the
 * backend contract. Invalid or incomplete questions are rejected.
 */
export function parseGeneratedExamQuestions(payload: unknown, expectedCount?: number): GeneratedExamQuestion[] {
  if (!Array.isArray(payload) || !isRecord(payload[0]) || !Array.isArray(payload[0].output)) {
    throw new Error('INVALID_AI_RESPONSE');
  }

  const questions = payload[0].output.map(parseQuestion);

  if (questions.length === 0 || questions.some(question => question === null)
    || (expectedCount !== undefined && questions.length !== expectedCount)) {
    throw new Error('INVALID_AI_RESPONSE');
  }

  return questions as GeneratedExamQuestion[];
}

export async function requestExamExtraction(formData: FormData): Promise<Response> {
  let response = await fetch('/api/ai-exam-extract', { method: 'POST', body: formData });
  if (response.status !== 202) return response;
  const job: unknown = await response.json();
  if (!isRecord(job) || typeof job.id !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id)) {
    throw new Error('INVALID_AI_RESPONSE');
  }
  const deadline = Date.now() + 360_000;
  while (response.status === 202 && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 2_000));
    response = await fetch(`/api/ai-exam-extract?id=${job.id}`, { cache: 'no-store' });
  }
  if (response.status === 202) throw new Error('التوليد استغرق وقتًا طويلًا. أعد المحاولة؛ الملف والعدد محفوظان.');
  return response;
}
