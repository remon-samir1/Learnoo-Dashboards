'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Quiz, QuizQuestionAnswer } from '@/src/types';
import { resolveStudentExamMediaUrl } from '@/src/lib/student-exam-media';
import {
  isMultipleChoice,
  isQuestionCorrect,
  normalizeQuestions,
  questionAnswers,
} from '@/src/lib/student-exam-question-utils';

function answerReasonText(a: QuizQuestionAnswer): string | null {
  const r = a.attributes?.reason;
  if (r == null) return null;
  const s = typeof r === 'string' ? r.trim() : String(r).trim();
  return s.length > 0 ? s : null;
}

function optionStyle(args: {
  selected: boolean;
  isCorrect: boolean;
  questionCorrect: boolean;
}): string {
  const { selected, isCorrect, questionCorrect } = args;
  if (selected && isCorrect) {
    return 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/25';
  }
  if (selected && !isCorrect) {
    return 'border-red-600 bg-red-50 ring-1 ring-red-600/25';
  }
  if (!selected && isCorrect && !questionCorrect) {
    return 'border-emerald-500/70 border-dashed bg-emerald-50/60';
  }
  return 'border-slate-200 bg-slate-50';
}

function optionTextClass(args: { selected: boolean; isCorrect: boolean }): string {
  const { selected, isCorrect } = args;
  if (selected && isCorrect) return 'text-emerald-950';
  if (selected && !isCorrect) return 'text-red-950';
  if (!selected && isCorrect) return 'text-emerald-900';
  return 'text-slate-800';
}

export function ExamAnswersReview({
  quiz,
  selections,
  locale,
}: {
  quiz: Quiz;
  selections: Record<string, string[]>;
  locale: string;
}) {
  const t = useTranslations('courses.studentExamResult');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const questions = useMemo(() => normalizeQuestions(quiz), [quiz]);

  return (
    <div className="flex w-full flex-col gap-8" dir={dir}>
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 sm:text-sm">
        {t('reviewReadOnlyHint')}
      </p>

      {questions.map((q, idx) => {
        const qid = String(q.id);
        const sel = selections[qid] ?? [];
        const answers = questionAnswers(q);
        const questionCorrect = isQuestionCorrect(q, sel);
        const qImg = resolveStudentExamMediaUrl(q.attributes.image);

        return (
          <section
            key={qid}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:px-5 sm:py-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-[#E8EEFC] px-2.5 py-0.5 text-[11px] font-semibold text-[#2D46D9] sm:px-3 sm:py-1 sm:text-xs">
                {t('reviewQuestionBadge', { n: idx + 1 })}
              </span>
              {isMultipleChoice(q) ? (
                <span className="text-[11px] font-medium text-slate-500 sm:text-xs">{t('reviewMultipleType')}</span>
              ) : null}
            </div>

            <h3 className="text-start text-base font-bold leading-snug text-slate-900 sm:text-lg">{q.attributes.text}</h3>

            {qImg ? (
              <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <Image
                  src={qImg}
                  alt=""
                  width={800}
                  height={450}
                  className="max-h-[min(40vh,220px)] w-full object-contain sm:max-h-[min(42vh,260px)]"
                  sizes="(max-width: 768px) 100vw, 800px"
                  unoptimized
                />
              </div>
            ) : null}

            {answers.length === 0 ? (
              <p className="text-sm text-slate-600">{t('reviewNoAnswerOptions')}</p>
            ) : (
              <ul className="flex flex-col gap-2.5 sm:gap-3" role="list">
                {answers.map((ans) => {
                  const aid = String(ans.id);
                  const selected = sel.includes(aid);
                  const isCorrect = !!ans.attributes?.is_correct;
                  const reason = answerReasonText(ans);
                  const showReason =
                    reason != null && (isCorrect || selected);
                  const label = ans.attributes?.text?.trim() ?? '';
                  const imgSrc = resolveStudentExamMediaUrl(ans.attributes?.image);

                  return (
                    <li
                      key={aid}
                      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 ${optionStyle({
                        selected,
                        isCorrect,
                        questionCorrect,
                      })}`}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <span
                          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-600 sm:mt-1 sm:size-[18px] sm:text-[11px]"
                          aria-hidden
                        >
                          {selected ? '✓' : ''}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[13px] font-medium leading-snug sm:text-sm ${optionTextClass({ selected, isCorrect })}`}>
                            {label}
                          </p>
                          {showReason ? (
                            <p className="mt-2 border-s-2 border-slate-200 ps-3 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                              {reason}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      {imgSrc ? (
                        <div className="relative ms-7 w-full max-w-xl overflow-hidden rounded-md border border-slate-200 bg-white sm:ms-8">
                          <Image
                            src={imgSrc}
                            alt=""
                            width={640}
                            height={360}
                            className="max-h-[min(32vh,180px)] w-full object-contain sm:max-h-[min(34vh,200px)]"
                            sizes="(max-width: 768px) 100vw, 640px"
                            unoptimized
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
