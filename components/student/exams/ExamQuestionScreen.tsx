'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { QuizQuestion, QuizQuestionAnswer } from '@/src/types';
import { resolveStudentExamMediaUrl } from '@/src/lib/student-exam-media';
import { useCurrentUser } from '@/src/hooks';
import { getStudentPlatformFeatures } from '@/src/services/student/platform-feature.service';
import {
  resolveEnabledWatermarkBucket,
  type WatermarkResolution,
} from '@/src/lib/watermark-from-features';
import ExamWatermark from './WaterMarkDyna';
export type ExamQuestionScreenMode = 'take' | 'review';

function answerReasonText(a: QuizQuestionAnswer): string | null {
  const r = a.attributes?.reason;
  if (r == null) return null;
  const s = typeof r === 'string' ? r.trim() : String(r).trim();
  return s.length > 0 ? s : null;
}

function reviewOptionContainerClass(args: {
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
  return 'border-[#E2E8F0] bg-white';
}

function reviewOptionTextClass(args: { selected: boolean; isCorrect: boolean }): string {
  const { selected, isCorrect } = args;
  if (selected && isCorrect) return 'text-emerald-950';
  if (selected && !isCorrect) return 'text-red-950';
  if (!selected && isCorrect) return 'text-emerald-900';
  return 'text-[#0F172A]';
}

export type ExamQuestionScreenProps = {
  dir: 'ltr' | 'rtl';
  examTitle: string;
  questionBadgeText: string;
  questionProgressText: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  question: QuizQuestion;
  answers: QuizQuestionAnswer[];
  studentName?: string | null;
  /** When true, header spans the student main horizontal padding (take-exam page). */
  headerBleed?: boolean;
  headerAside?: ReactNode;
  mode: ExamQuestionScreenMode;
  multi?: boolean;
  selectedIds?: string[];
  onSelectSingle?: (answerId: string) => void;
  onToggleMulti?: (answerId: string) => void;
  /** Review-only: whether the learner’s selection(s) for this question are fully correct. */
  reviewQuestionCorrect?: boolean;
  noAnswerOptionsText?: string;
  articleFooter: ReactNode;
  belowArticle?: ReactNode;
};

export function ExamQuestionScreen({
  dir,
  examTitle,
  questionBadgeText,
  questionProgressText,
  currentQuestionNumber,
  totalQuestions,
  question,
  answers,
  studentName,
  headerBleed = false,
  headerAside,
  mode,
  multi = false,
  selectedIds = [],
  onSelectSingle,
  onToggleMulti,
  reviewQuestionCorrect = false,
  noAnswerOptionsText,
  articleFooter,
  belowArticle,
}: ExamQuestionScreenProps) {
  const qNum = currentQuestionNumber;
  const questionImageSrc = resolveStudentExamMediaUrl(question.attributes.image);
const { user } = useCurrentUser();

const [watermarkConfig, setWatermarkConfig] =
  useState<WatermarkResolution | null>(null);

  useEffect(() => {
  let mounted = true;

  const loadWatermark = async () => {
    try {
      const features = await getStudentPlatformFeatures();

      const resolution = resolveEnabledWatermarkBucket(
        features,
        'exams'
      );

      if (mounted) {
        setWatermarkConfig(resolution);
      }
    } catch (error) {
      console.error(error);
    }
  };

  loadWatermark();

  return () => {
    mounted = false;
  };
}, []);
const watermarkText = useMemo(() => {
  const config = watermarkConfig?.config;

  if (!config?.enabled) return '';

  const attrs = user?.attributes;

  const parts: string[] = [];

  if (config.useStudentCode && attrs?.student_code) {
    parts.push(String(attrs.student_code));
  }

  if (config.usePhoneNumber && attrs?.phone) {
    parts.push(String(attrs.phone));
  }

  return parts.join(' · ');
}, [watermarkConfig, user]);

  const headerInner = (
    <header className="box-border flex min-h-[52px] w-full min-w-0 items-center justify-between gap-3 border-b border-[#EEEEEE] bg-white py-2.5 ps-5 pe-8 sm:ps-6 sm:pe-12 lg:ps-8 lg:pe-16">
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-tight">
        <h1 className="truncate text-base font-bold text-[#0F172A] sm:text-lg">{examTitle}</h1>
        <p className="text-xs text-[#64748B] sm:text-[13px]">{questionProgressText}</p>
      </div>
      {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
    </header>
  );

  return (
    <div className="flex w-full min-w-0 flex-col pb-6 sm:pb-8" dir={dir}>
      {headerBleed ? (
        <div className="-mx-5 -mt-5 mb-4 w-[calc(100%+2.5rem)] max-w-none shrink-0 lg:-mx-16 lg:w-[calc(100%+8rem)]">
          {headerInner}
        </div>
      ) : (
        <div className="mb-4 w-full shrink-0">{headerInner}</div>
      )}

      <div className="mx-auto   flex w-full max-w-[832px] flex-col gap-4 sm:gap-5">
        
        <article className="relative flex w-full flex-col overflow-hidden rounded-xl border border-[#E8ECF2] bg-white px-4 py-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:rounded-2xl sm:px-5 sm:py-5">
          {watermarkConfig?.config.enabled ? (
            <ExamWatermark text={watermarkText} watermarkConfig={watermarkConfig} />
          ) : null}

          <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
          {studentName ? (
            <p className="text-[11px] font-medium text-[#94A3B8] sm:text-[12px]">{studentName}</p>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-[12px]"
              style={{ backgroundColor: '#E8EEFC', color: '#2D46D9' }}
            >
              {questionBadgeText}
            </span>
            <span className="text-xs font-semibold text-[#64748B] sm:text-sm">
              {qNum} / {totalQuestions}
            </span>
          </div>

          <h2 className="text-start text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
            {question.attributes.text}
          </h2>

          {questionImageSrc ? (
            <div className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-[#E2E8F0] bg-slate-50">
              <Image
                src={questionImageSrc}
                alt=""
                width={800}
                height={450}
                className="max-h-[min(40vh,220px)] w-full object-contain sm:max-h-[min(42vh,260px)]"
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
              />
            </div>
          ) : null}

          {mode === 'take' ? (
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {answers.map((ans) => {
                const aid = String(ans.id);
                const label = ans.attributes?.text?.trim() ?? '';
                const imgSrc = resolveStudentExamMediaUrl(ans.attributes?.image);
                const checked = selectedIds.includes(aid);
                return (
                  <label
                    key={aid}
                    className={`flex cursor-pointer flex-col gap-2 rounded-lg border bg-white px-3 py-2.5 transition-colors sm:gap-2.5 sm:px-4 sm:py-3 ${
                      checked ? 'border-[#2D46D9] ring-1 ring-[#2D46D9]/20' : 'border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      
                      <input
                        type={multi ? 'checkbox' : 'radio'}
                        name={`question-${question.id}`}
                        value={aid}
                        checked={checked}
                        onChange={() =>
                          multi ? onToggleMulti?.(aid) : onSelectSingle?.(aid)
                        }
                        className="mt-0.5 size-[15px] shrink-0 accent-[#2D46D9] sm:mt-1 sm:size-4"
                      />
                      <span className="text-[13px] font-medium leading-snug text-[#0F172A] sm:text-sm">{label}</span>
                    </div>
                    {imgSrc ? (
                      <div className="relative ms-6 w-full max-w-xl overflow-hidden rounded-md border border-[#E2E8F0] bg-slate-50 sm:ms-7">
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
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:gap-2.5">
              
              {answers.length === 0 ? (
                <p className="text-sm text-slate-600">{noAnswerOptionsText}</p>
              ) : (
                answers.map((ans) => {
                  const aid = String(ans.id);
                  const selected = selectedIds.includes(aid);
                  const isCorrect = !!ans.attributes?.is_correct;
                  const reason = answerReasonText(ans);
                  const showReason = reason != null && (isCorrect || selected);
                  const label = ans.attributes?.text?.trim() ?? '';
                  const imgSrc = resolveStudentExamMediaUrl(ans.attributes?.image);
                  return (
                    <div
                      key={aid}
                      className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 sm:gap-2.5 sm:px-4 sm:py-3 ${reviewOptionContainerClass({
                        selected,
                        isCorrect,
                        questionCorrect: reviewQuestionCorrect,
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
                          <p
                            className={`text-[13px] font-medium leading-snug sm:text-sm ${reviewOptionTextClass({
                              selected,
                              isCorrect,
                            })}`}
                          >
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
                        <div className="relative ms-7 w-full max-w-xl overflow-hidden rounded-md border border-[#E2E8F0] bg-slate-50 sm:ms-8">
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
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
            {articleFooter}
          </div>
          </div>
        </article>

        {belowArticle}
      </div>
    </div>
  );
}
