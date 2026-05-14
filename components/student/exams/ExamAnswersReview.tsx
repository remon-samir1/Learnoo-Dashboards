'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Quiz } from '@/src/types';
import { ExamQuestionScreen } from '@/components/student/exams/ExamQuestionScreen';
import {
  isMultipleChoice,
  isQuestionCorrect,
  normalizeQuestions,
  questionAnswers,
} from '@/src/lib/student-exam-question-utils';

export function ExamAnswersReview({
  quiz,
  selections,
  locale,
  onExitReview,
}: {
  quiz: Quiz;
  selections: Record<string, string[]>;
  locale: string;
  onExitReview: () => void;
}) {
  const tResult = useTranslations('courses.studentExamResult');
  const tTake = useTranslations('courses.studentTakeExam');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const questions = useMemo(() => normalizeQuestions(quiz), [quiz]);
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = questions[currentIndex] ?? null;
  const qNum = currentIndex + 1;
  const isFirst = currentIndex <= 0;
  const isLast = total > 0 && currentIndex >= total - 1;

  const title = quiz.attributes.title?.trim() ?? tTake('defaultExamTitle');
  const answers = current ? questionAnswers(current) : [];
  const selectedForCurrent = current ? selections[String(current.id)] ?? [] : [];
  const questionCorrect = current ? isQuestionCorrect(current, selectedForCurrent) : false;

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIndex((i) => Math.min(total - 1, i + 1));

  if (!current || total === 0) {
    return null;
  }

  return (
    <ExamQuestionScreen
      dir={dir}
      examTitle={title}
      questionBadgeText={tTake('questionBadge', { n: qNum })}
      questionProgressText={tTake('questionProgress', { current: qNum, total })}
      currentQuestionNumber={qNum}
      totalQuestions={total}
      question={current}
      answers={answers}
      headerBleed={false}
      mode="review"
      selectedIds={selectedForCurrent}
      reviewQuestionCorrect={questionCorrect}
      noAnswerOptionsText={tResult('reviewNoAnswerOptions')}
      articleFooter={
        <>
          <p className="text-xs text-[#94A3B8] sm:text-[13px]">
            {isMultipleChoice(current) ? tResult('reviewMultipleType') : '\u00a0'}
          </p>
          <div className="flex flex-row flex-wrap items-stretch justify-end gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-bold text-[#334155] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:rounded-xl sm:px-5 sm:text-sm"
            >
              <ChevronLeft className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
              {tResult('reviewPreviousQuestion')}
            </button>
            {!isLast ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2D46D9] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2438c4] sm:h-11 sm:rounded-xl sm:px-6 sm:text-sm"
              >
                {tTake('nextQuestion')}
                <ChevronRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={onExitReview}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2D46D9] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2438c4] sm:h-11 sm:rounded-xl sm:px-6 sm:text-sm"
              >
                {tResult('backFromReview')}
              </button>
            )}
          </div>
        </>
      }
      belowArticle={
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:text-sm">
          {tResult('reviewReadOnlyHint')}
        </p>
      }
    />
  );
}
