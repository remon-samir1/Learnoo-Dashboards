import type { Quiz, QuizQuestion, QuizQuestionAnswer } from '@/src/types';

export function normalizeQuestions(quiz: Quiz): QuizQuestion[] {
  const raw = quiz.attributes.questions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((q) => q?.attributes?.text?.trim());
}

export function questionAnswers(q: QuizQuestion): QuizQuestionAnswer[] {
  const list = q.attributes.answers;
  if (!Array.isArray(list)) return [];
  return list;
}

export function isMultipleChoice(q: QuizQuestion): boolean {
  return q.attributes.type === 'multiple_choice';
}

export function isShortAnswer(q: QuizQuestion): boolean {
  return q.attributes.type === 'short_answer';
}

function correctAnswerIds(q: QuizQuestion): Set<string> {
  const ids = new Set<string>();
  for (const a of questionAnswers(q)) {
    if (a.attributes?.is_correct) ids.add(String(a.id));
  }
  return ids;
}

/**
 * Single / true_false / short_answer with options: one selected id must be correct. Multiple: selected set must equal correct set.
 *
 * For `short_answer` we cannot grade on the client — server grades free text.
 * Returning `null` (unknown) lets the review UI render neutral styling instead
 * of falsely painting every typed answer red or green.
 */
export function isQuestionCorrect(
  q: QuizQuestion,
  selectedIds: string[],
  shortText?: string,
): boolean | null {
  if (isShortAnswer(q)) {
    const t = (shortText ?? '').trim();
    return t.length > 0 ? null : false;
  }

  const answers = questionAnswers(q);
  if (answers.length === 0) return false;

  if (isMultipleChoice(q)) {
    const correct = correctAnswerIds(q);
    const selected = new Set(selectedIds);
    if (selected.size !== correct.size) return false;
    for (const id of selected) {
      if (!correct.has(id)) return false;
    }
    return true;
  }

  if (selectedIds.length !== 1) return false;
  const sel = selectedIds[0];
  const ans = answers.find((a) => String(a.id) === sel);
  return !!ans?.attributes?.is_correct;
}

/**
 * Whether the question has enough input to advance.
 * `short_answer` is "answered" if non-blank text is typed. Selection-based
 * questions follow the previous rule (multi needs at least one; single needs one).
 */
export function isQuestionAnswered(
  q: QuizQuestion,
  selectedIds: string[],
  shortText?: string,
): boolean {
  if (isShortAnswer(q)) return (shortText ?? '').trim().length > 0;
  if (isMultipleChoice(q)) return selectedIds.length > 0;
  return selectedIds.length === 1;
}

export function computeExamScore(
  questions: QuizQuestion[],
  selections: Record<string, string[]>,
  shortTexts: Record<string, string> = {},
) {
  let score = 0;
  let total_score = 0;
  let correctQuestions = 0;
  for (const q of questions) {
    const weight = Number(q.attributes.score);
    const w = Number.isFinite(weight) && weight > 0 ? weight : 0;
    total_score += w;
    const sel = selections[String(q.id)] ?? [];
    const st = shortTexts[String(q.id)];
    const correctness = isQuestionCorrect(q, sel, st);
    if (correctness === true) {
      score += w;
      correctQuestions += 1;
    }
  }
  return { score, total_score, correctQuestions };
}
