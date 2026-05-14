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

function correctAnswerIds(q: QuizQuestion): Set<string> {
  const ids = new Set<string>();
  for (const a of questionAnswers(q)) {
    if (a.attributes?.is_correct) ids.add(String(a.id));
  }
  return ids;
}

/** Single / true_false / short_answer with options: one selected id must be correct. Multiple: selected set must equal correct set. */
export function isQuestionCorrect(q: QuizQuestion, selectedIds: string[]): boolean {
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

export function isQuestionAnswered(q: QuizQuestion, selectedIds: string[]): boolean {
  if (isMultipleChoice(q)) return selectedIds.length > 0;
  return selectedIds.length === 1;
}

export function computeExamScore(questions: QuizQuestion[], selections: Record<string, string[]>) {
  let score = 0;
  let total_score = 0;
  let correctQuestions = 0;
  for (const q of questions) {
    const weight = Number(q.attributes.score);
    const w = Number.isFinite(weight) && weight > 0 ? weight : 0;
    total_score += w;
    const sel = selections[String(q.id)] ?? [];
    if (isQuestionCorrect(q, sel)) {
      score += w;
      correctQuestions += 1;
    }
  }
  return { score, total_score, correctQuestions };
}
