'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookOpen, ChevronLeft, CircleX, Home, ListChecks, RefreshCw, Trophy } from 'lucide-react';
import { ExamAnswersReview } from '@/components/student/exams/ExamAnswersReview';
import { normalizeQuestions } from '@/src/lib/student-exam-question-utils';
import {
  clearStudentQuizResultPayload,
  readStudentQuizResultPayload,
  type StudentQuizResultPayload,
} from '@/src/lib/student-quiz-cache';
import { buildStudentStartExamHref, parseCourseIdFromCourseDetailsPath } from '@/src/lib/student-start-exam-href';
import { formatTimeTakenForDisplay } from '@/src/lib/quiz-finish-result-fields';

const PRIMARY = '#2D46D9';

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}%`;
}

function passingThresholdPercent(info: StudentQuizResultPayload['finishResponse']['quiz_info']): number | null {
  const tm = Number(info.total_marks);
  const pm = Number(info.passing_marks);
  if (Number.isFinite(tm) && tm > 0 && Number.isFinite(pm)) {
    return (pm / tm) * 100;
  }
  if (Number.isFinite(pm)) return pm;
  return null;
}

function formatFinishedAt(raw: string | undefined, locale: string): string {
  if (!raw?.trim()) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.trim();
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export default function ExamResultView({ locale, quizId }: { locale: string; quizId: string }) {
  const router = useRouter();
  const t = useTranslations('courses.studentExamResult');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const [payload, setPayload] = useState<StudentQuizResultPayload | null | undefined>(undefined);
  const [showAnswerReview, setShowAnswerReview] = useState(false);

  useEffect(() => {
    const p = readStudentQuizResultPayload(quizId);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from sessionStorage once per quizId (no external store subscription)
    setPayload(p);
  }, [quizId]);

  useEffect(() => {
    if (payload === null) {
      router.replace(`/${locale}/student/exams`);
    }
  }, [payload, locale, router]);

  const finish = payload?.finishResponse;
  const results = finish?.results;
  const quizInfo = finish?.quiz_info;

  const passed = results?.passed === true;
  const yourPct = results != null && Number.isFinite(Number(results.percentage)) ? Number(results.percentage) : null;
  const passPct = quizInfo != null ? passingThresholdPercent(quizInfo) : null;
  const timeTakenVal = results != null ? formatTimeTakenForDisplay(results.time_taken) : null;

  const scoreMarksLine = useMemo(() => {
    if (!results) return '—';
    const a = Number(results.score);
    const b = Number(results.total_score);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return '—';
    return `${a} / ${b}`;
  }, [results]);

  if (payload === undefined) {
    return (
      <div className="mx-auto max-w-[1130px] px-4 py-24 text-center text-sm text-slate-600" dir={dir}>
        {t('loading')}
      </div>
    );
  }

  if (payload === null || !finish || !results || !quizInfo) {
    return null;
  }

  const homeHref = `/${locale}/student`;
  const reviewHref = payload.backHref?.trim() || `/${locale}/student/courses`;
  const retryCourseId = parseCourseIdFromCourseDetailsPath(payload.backHref);
  const retryHref = buildStudentStartExamHref(locale, quizId, retryCourseId);

  const handleRetry = () => {
    clearStudentQuizResultPayload(quizId);
    router.push(retryHref);
  };

  const quizForReview = payload.quizForReview;
  const selectionsForReview = payload.selectionsForReview;
  const canAnswerReview = Boolean(
    quizForReview &&
      selectionsForReview &&
      normalizeQuestions(quizForReview).length > 0,
  );

  const bannerBg = passed ? '#16A34A' : '#DC2626';
  const quizTitle = quizInfo.title?.trim() || '—';

  return (
    <div className="flex w-full justify-center px-4 pb-16 pt-[72px] sm:pt-[112px]" dir={dir}>
      <div
        className="flex w-full max-w-[1130px] min-h-[min(954px,calc(100vh-8rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(15,23,42,0.1)]"
        style={{ borderRadius: 16 }}
      >
        <header
          className="flex flex-col items-center px-6 pb-12 pt-12 text-center sm:px-10 sm:pb-14 sm:pt-14"
          style={{
            backgroundColor: bannerBg,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div
            className="flex size-16 items-center justify-center rounded-full border-2 border-white text-white sm:size-[72px]"
            aria-hidden
          >
            {passed ? (
              <Trophy className="size-9 sm:size-10" strokeWidth={2} />
            ) : (
              <CircleX className="size-9 sm:size-10" strokeWidth={2} />
            )}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white sm:text-[1.75rem]">
            {passed ? t('congratulationsTitle') : t('failedTitle')}
          </h1>
          <p className="mt-2 max-w-md text-[0.9375rem] text-white/95">
            {passed ? t('passedSubtitle') : t('failedSubtitle')}
          </p>
        </header>

        <div className="flex flex-1 flex-col gap-10 px-6 py-10 sm:px-12 sm:py-12">
          {showAnswerReview && canAnswerReview && quizForReview && selectionsForReview ? (
            <>
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
                <button
                  type="button"
                  onClick={() => setShowAnswerReview(false)}
                  className="inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#334155] transition-colors hover:bg-slate-100"
                >
                  <ChevronLeft className="size-4 shrink-0 rtl:rotate-180" strokeWidth={2} aria-hidden />
                  {t('backFromReview')}
                </button>
              </div>
              <ExamAnswersReview
                quiz={quizForReview}
                selections={selectionsForReview}
                locale={locale}
                onExitReview={() => setShowAnswerReview(false)}
              />
            </>
          ) : (
            <>
              <h2 className="text-center text-lg font-semibold leading-snug text-[#0F172A] sm:text-xl">{quizTitle}</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
                <div className="rounded-xl border border-[#E8ECF2] bg-white px-5 py-6 text-center shadow-sm">
                  <p className="text-3xl font-bold tabular-nums sm:text-[2rem]" style={{ color: PRIMARY }}>
                    {yourPct != null ? formatPercent(yourPct) : '—'}
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-[#64748B]">{t('yourScore')}</p>
                </div>
                <div className="rounded-xl border border-[#E8ECF2] bg-white px-5 py-6 text-center shadow-sm">
                  <p className="text-3xl font-bold tabular-nums text-[#0F172A] sm:text-[2rem]">{scoreMarksLine}</p>
                  <p className="mt-2 text-[13px] font-medium text-[#64748B]">{t('scoreMarks')}</p>
                </div>
                <div className="rounded-xl border border-[#E8ECF2] bg-white px-5 py-6 text-center shadow-sm">
                  <p className="text-3xl font-bold tabular-nums text-[#0F172A] sm:text-[2rem]">
                    {passPct != null ? formatPercent(passPct) : '—'}
                  </p>
                  <p className="mt-2 text-[13px] font-medium text-[#64748B]">{t('passingScore')}</p>
                </div>
              </div>

              <dl className="grid gap-3 rounded-xl border border-[#E8ECF2] bg-[#F8FAFC] px-4 py-4 text-sm sm:grid-cols-2 sm:px-6 sm:py-5">
                <div>
                  <dt className="font-medium text-[#64748B]">{t('finishedAt')}</dt>
                  <dd className="mt-1 font-semibold text-[#0F172A]">{formatFinishedAt(results.finished_at, locale)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#64748B]">{t('timeTaken')}</dt>
                  <dd className="mt-1 font-semibold text-[#0F172A]">
                    {timeTakenVal != null
                      ? t('timeTakenMinutes', {
                          value: timeTakenVal.toLocaleString(locale, { maximumFractionDigits: 2 }),
                        })
                      : '—'}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
                <Link
                  href={homeHref}
                  className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#F1F5F9] px-5 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#E2E8F0] sm:max-w-[200px] sm:flex-none"
                >
                  <Home className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t('backToHome')}
                </Link>
                {canAnswerReview ? (
                  <button
                    type="button"
                    onClick={() => setShowAnswerReview(true)}
                    className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] px-5 text-sm font-semibold text-[#3730A3] transition-colors hover:bg-[#E0E7FF] sm:max-w-[240px] sm:flex-none"
                  >
                    <ListChecks className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    {t('reviewAnswers')}
                  </button>
                ) : null}
                <Link
                  href={reviewHref}
                  className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors sm:max-w-[220px] sm:flex-none"
                  style={{ backgroundColor: '#E8EEFC', color: PRIMARY }}
                >
                  <BookOpen className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t('reviewLectures')}
                </Link>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition-colors hover:opacity-95 sm:max-w-[200px] sm:flex-none"
                  style={{ backgroundColor: PRIMARY }}
                >
                  <RefreshCw className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  {t('retryExam')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
