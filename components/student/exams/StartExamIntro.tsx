'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle, Clock, FileText, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiResponse, Quiz, QuizAttempt } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import { writeStudentTakePayload } from '@/src/lib/student-quiz-cache';
import { sanitizeNumericCourseQueryParam } from '@/src/lib/student-start-exam-href';
import { navigateTakeExamExit } from '@/components/student/exams/takeExamNav';

/** Backend may return this in JSON `message` (2xx or error body). */
function isMaxAttemptsReachedMessage(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  return /max\s*attempts?\s*reached/i.test(text.trim());
}

/** Figma exam intro — primary blue */
const EXAM_PRIMARY = '#2D46D9';

export function StartExamIntro({
  quiz,
  quizId,
  backHref,
}: {
  quiz: Quiz;
  quizId: string;
  backHref: string;
}) {
  const router = useRouter();
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('courses.studentStartExam');

  const [starting, setStarting] = useState(false);

  const attrs = quiz.attributes;
  const subtitle =
    attrs.description?.trim() ||
    (attrs.type === 'exam' ? t('typeExam') : t('typeHomework'));
  const questions = attrs.questions ?? [];
  const qCount = questions.length;
  const durationMin = typeof attrs.duration === 'number' && attrs.duration > 0 ? attrs.duration : 0;

  const rules = [
    t('rule1'),
    t('rule2'),
    t('rule3'),
    t('rule4'),
    t('rule5'),
  ] as const;

  const courseForTake = sanitizeNumericCourseQueryParam(String(attrs.course_id ?? ''));
  const takeHref =
    courseForTake != null
      ? `/${locale}/student/exams/take/${encodeURIComponent(quizId)}?course=${encodeURIComponent(courseForTake)}`
      : `/${locale}/student/exams/take/${encodeURIComponent(quizId)}`;

  const handleStart = async () => {
    if (starting) return;
    const numericQuizId = Number(quiz.id);
    if (!Number.isFinite(numericQuizId)) {
      toast.error(t('startAttemptError'));
      return;
    }
    setStarting(true);
    try {
      const res = await api.quizAttempts.start({ quiz_id: numericQuizId });
      const payload = res as ApiResponse<QuizAttempt>;
      const apiMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
      if (apiMessage && isMaxAttemptsReachedMessage(apiMessage)) {
        toast.error(apiMessage);
        navigateTakeExamExit(router, backHref);
        return;
      }
      const attemptId = String(payload.data?.id ?? '').trim();
      if (!attemptId) {
        toast.error(t('startAttemptError'));
        return;
      }
      writeStudentTakePayload(quizId, {
        version: 1,
        quiz,
        backHref,
        examStartedAtMs: Date.now(),
        attemptId: String(payload.data.id),
      });
      router.push(takeHref);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : null;
      if (msg && isMaxAttemptsReachedMessage(msg)) {
        toast.error(msg.trim());
        navigateTakeExamExit(router, backHref);
        return;
      }
      toast.error(msg?.trim() || t('startAttemptError'));
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = () => {
    navigateTakeExamExit(router, backHref);
  };

  return (
    <div className="w-full pb-10 pt-2" dir={dir}>
      <div className="mx-auto w-full max-w-[672px]">
        <article
          className="flex w-full max-w-[672px] flex-col gap-8 overflow-y-auto rounded-2xl border border-[#E8ECF2] bg-white pt-8 pr-8 pl-8 pb-8 shadow-[0_4px_32px_rgba(15,23,42,0.07)] min-[700px]:min-h-[763px]"
        >
          <header className="flex flex-col items-center gap-3 text-center">
            <div
              className="flex size-[56px] shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: '#E8EEFC' }}
            >
              <FileText className="size-7" strokeWidth={2} style={{ color: EXAM_PRIMARY }} aria-hidden />
            </div>
            <h1 className="max-w-[480px] text-[1.375rem] font-bold leading-snug tracking-tight text-[#0F172A] sm:text-[1.5rem]">
              {attrs.title}
            </h1>
            <p className="max-w-[420px] text-[0.9375rem] leading-relaxed text-[#64748B]">{subtitle}</p>
          </header>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="rounded-[12px] border border-[#E8ECF2] bg-[#F8F9FB] px-4 py-4 text-center sm:px-5 sm:py-4">
              <Clock className="mx-auto size-[22px] text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <p className="mt-3 text-[12px] font-medium text-[#64748B]">{t('durationLabel')}</p>
              <p className="mt-1.5 text-[15px] font-bold text-[#0F172A]">
                {durationMin > 0 ? t('minutesUnit', { count: durationMin }) : '—'}
              </p>
            </div>
            <div className="rounded-[12px] border border-[#E8ECF2] bg-[#F8F9FB] px-4 py-4 text-center sm:px-5 sm:py-4">
              <FileText className="mx-auto size-[22px] text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <p className="mt-3 text-[12px] font-medium text-[#64748B]">{t('questionsLabel')}</p>
              <p className="mt-1.5 text-[15px] font-bold text-[#0F172A]">{qCount}</p>
            </div>
          </div>

          {(attrs.passing_marks != null || attrs.total_marks != null) && (
            <p className="text-center text-[12px] text-[#64748B]">
              {t('passingInfo', {
                passing: attrs.passing_marks ?? 0,
                total: attrs.total_marks ?? 0,
              })}
            </p>
          )}

          <section className="text-start">
            <h2 className="text-[15px] font-bold text-[#0F172A]">{t('rulesHeading')}</h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#475569]">
              {rules.map((text) => (
                <li key={text} className="flex gap-3">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: EXAM_PRIMARY }}
                    aria-hidden
                  />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-3 rounded-[12px] border border-[#F5D0A8] bg-[#FFF8F0] p-4 sm:p-5">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-full sm:size-11"
              style={{ backgroundColor: '#FFEDD5', color: '#C2410C' }}
            >
              <AlertCircle className="size-5 sm:size-[22px]" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 text-start">
              <p className="text-[14px] font-bold" style={{ color: '#9A3412' }}>
                {t('noticeTitle')}
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed sm:text-[13px]" style={{ color: '#7C2D12' }}>
                {t('noticeBody')}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1" aria-hidden />

          <footer className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={starting}
              className="inline-flex h-[48px] flex-1 items-center justify-center rounded-[12px] border border-[#D1D5DB] bg-white text-[14px] font-semibold text-[#475569] transition-colors hover:bg-[#F8F9FB] disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={starting}
              className="inline-flex h-[48px] flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#2D46D9] text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#2438c4] active:bg-[#1e2f9e] disabled:opacity-50"
            >
              <Play className="size-4 shrink-0 fill-white text-white" aria-hidden />
              {t('startExam')}
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
}
