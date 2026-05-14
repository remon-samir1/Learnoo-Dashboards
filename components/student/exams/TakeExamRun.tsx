'use client';

import Cookies from 'js-cookie';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FinishQuizAttemptResponse } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import {
  clearStudentTakePayload,
  readStudentTakePayload,
  writeStudentQuizResultPayload,
  type StudentTakePayload,
} from '@/src/lib/student-quiz-cache';
import { buildStudentStartExamHref } from '@/src/lib/student-start-exam-href';
import { navigateTakeExamExit } from '@/components/student/exams/takeExamNav';
import { resolveStudentExamMediaUrl } from '@/src/lib/student-exam-media';
import {
  computeExamScore,
  isMultipleChoice,
  isQuestionAnswered,
  normalizeQuestions,
  questionAnswers,
} from '@/src/lib/student-exam-question-utils';

function formatHms(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function readStudentName(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = Cookies.get('user_data');
    if (!raw) return null;
    const u = JSON.parse(raw) as { attributes?: { full_name?: string } };
    const n = u.attributes?.full_name?.trim();
    return n || null;
  } catch {
    return null;
  }
}

export default function TakeExamRun({
  locale,
  quizId,
  courseIdForStartRedirect,
}: {
  locale: string;
  quizId: string;
  courseIdForStartRedirect?: string;
}) {
  const router = useRouter();
  const t = useTranslations('courses.studentTakeExam');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const [session, setSession] = useState<StudentTakePayload | null | undefined>(undefined);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const timeOutHandled = useRef(false);

  useEffect(() => {
    const p = readStudentTakePayload(quizId);
    if (!p || normalizeQuestions(p.quiz).length === 0) {
      router.replace(buildStudentStartExamHref(locale, quizId, courseIdForStartRedirect ?? null));
      setSession(null);
      return;
    }
    setSession(p);
  }, [quizId, locale, router, courseIdForStartRedirect]);

  const quiz = session?.quiz ?? null;
  const backHref = session?.backHref ?? `/${locale}/student/exams`;
  const startedAt = session?.examStartedAtMs ?? null;
  const attemptId = session?.attemptId ?? null;

  const questions = useMemo(() => (quiz ? normalizeQuestions(quiz) : []), [quiz]);
  const total = questions.length;
  const current = questions[currentIndex] ?? null;
  const isLast = total > 0 && currentIndex === total - 1;

  const durationMinutes = useMemo(() => {
    if (!quiz) return 0;
    const d = quiz.attributes.duration;
    return typeof d === 'number' && d > 0 ? d : 0;
  }, [quiz]);

  const endsAtMs = useMemo(() => {
    if (startedAt == null || durationMinutes <= 0) return null;
    return startedAt + durationMinutes * 60 * 1000;
  }, [startedAt, durationMinutes]);

  const studentName = useMemo(() => readStudentName(), []);

  useEffect(() => {
    if (endsAtMs == null) {
      setRemainingSec(null);
      return;
    }
    let intervalId = 0;
    const tick = () => {
      const left = Math.ceil((endsAtMs - Date.now()) / 1000);
      if (left <= 0) {
        setRemainingSec(0);
        setTimeExpired(true);
        window.clearInterval(intervalId);
        return;
      }
      setRemainingSec(left);
    };
    tick();
    intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [endsAtMs]);

  const exitExam = useCallback(() => {
    navigateTakeExamExit(router, backHref);
  }, [router, backHref]);

  useEffect(() => {
    if (!timeExpired || timeOutHandled.current) return;
    timeOutHandled.current = true;
    toast.error(t('timeOutMessage'));
    const tmr = window.setTimeout(() => {
      exitExam();
    }, 400);
    return () => window.clearTimeout(tmr);
  }, [timeExpired, exitExam, t]);

  const setSingleAnswer = (answerId: string) => {
    if (!current) return;
    setSelections((prev) => ({ ...prev, [String(current.id)]: [answerId] }));
  };

  const toggleMultiAnswer = (answerId: string) => {
    if (!current) return;
    const qid = String(current.id);
    setSelections((prev) => {
      const cur = prev[qid] ?? [];
      const has = cur.includes(answerId);
      const next = has ? cur.filter((id) => id !== answerId) : [...cur, answerId];
      return { ...prev, [qid]: next };
    });
  };

  const selectedForCurrent = current ? selections[String(current.id)] ?? [] : [];

  const goNext = () => {
    if (!current || !isQuestionAnswered(current, selectedForCurrent)) return;
    if (!isLast) setCurrentIndex((i) => Math.min(i + 1, total - 1));
  };

  const handleFinish = async () => {
    if (!quiz || !current || !attemptId || finishing) return;
    if (!isQuestionAnswered(current, selectedForCurrent)) return;
    const { score, total_score } = computeExamScore(questions, selections);
    setFinishing(true);
    try {
      const res = (await api.quizAttempts.submit(attemptId, {
        score,
        total_score,
      })) as FinishQuizAttemptResponse;
      writeStudentQuizResultPayload(quizId, {
        version: 2,
        quizId,
        locale,
        backHref,
        finishResponse: res,
        quizForReview: quiz,
        selectionsForReview: { ...selections },
      });
      clearStudentTakePayload(quizId);
      router.push(`/${locale}/student/exams/result/${encodeURIComponent(quizId)}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : null;
      toast.error(msg?.trim() || t('finishError'));
    } finally {
      setFinishing(false);
    }
  };

  if (session === undefined) {
    return (
      <div className="mx-auto max-w-[832px] px-4 py-10 text-center text-sm text-slate-600 sm:py-12" dir={dir}>
        {t('loadingSession')}
      </div>
    );
  }

  if (session === null || !quiz || total === 0 || !attemptId) {
    return null;
  }

  const title = quiz.attributes.title?.trim() ?? t('defaultExamTitle');
  const qNum = currentIndex + 1;
  const answers = current ? questionAnswers(current) : [];
  const multi = current ? isMultipleChoice(current) : false;
  const answered = current ? isQuestionAnswered(current, selectedForCurrent) : false;

  const questionImageSrc = current ? resolveStudentExamMediaUrl(current.attributes.image) : null;

  return (
    <div className="flex w-full min-w-0 flex-col pb-6 sm:pb-8" dir={dir}>
      <div className="-mx-5 -mt-5 mb-4 w-[calc(100%+2.5rem)] max-w-none shrink-0 lg:-mx-16 lg:w-[calc(100%+8rem)]">
        <header className="box-border flex min-h-[52px] w-full min-w-0 items-center justify-between gap-3 border-b border-[#EEEEEE] bg-white py-2.5 ps-5 pe-8 sm:ps-6 sm:pe-12 lg:ps-8 lg:pe-16">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-tight">
            <h1 className="truncate text-base font-bold text-[#0F172A] sm:text-lg">{title}</h1>
            <p className="text-xs text-[#64748B] sm:text-[13px]">{t('questionProgress', { current: qNum, total })}</p>
          </div>
          {remainingSec != null ? (
            <div
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2"
              aria-live="polite"
            >
              <Clock className="size-4 text-amber-700 sm:size-[18px]" strokeWidth={2} aria-hidden />
              <span className="font-mono text-xs font-bold tabular-nums text-amber-900 sm:text-sm">
                {formatHms(remainingSec)}
              </span>
            </div>
          ) : null}
        </header>
      </div>

      <div className="mx-auto flex w-full max-w-[832px] flex-col gap-4 sm:gap-5">
        <article className="flex w-full flex-col gap-4 overflow-y-auto rounded-xl border border-[#E8ECF2] bg-white px-4 py-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:gap-5 sm:rounded-2xl sm:px-5 sm:py-5">
          {studentName ? (
            <p className="text-[11px] font-medium text-[#94A3B8] sm:text-[12px]">{studentName}</p>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-2">
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold sm:px-3 sm:py-1 sm:text-[12px]"
              style={{ backgroundColor: '#E8EEFC', color: '#2D46D9' }}
            >
              {t('questionBadge', { n: qNum })}
            </span>
            <span className="text-xs font-semibold text-[#64748B] sm:text-sm">
              {qNum} / {total}
            </span>
          </div>

          <h2 className="text-start text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
            {current?.attributes.text}
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

          <div className="flex flex-col gap-2 sm:gap-2.5">
            {answers.map((ans) => {
              const aid = String(ans.id);
              const label = ans.attributes?.text?.trim() ?? '';
              const imgSrc = resolveStudentExamMediaUrl(ans.attributes?.image);
              const checked = selectedForCurrent.includes(aid);
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
                      name={`question-${current?.id}`}
                      value={aid}
                      checked={checked}
                      onChange={() => (multi ? toggleMultiAnswer(aid) : setSingleAnswer(aid))}
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

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
            <p className="text-xs text-[#94A3B8] sm:text-[13px]">{multi ? t('selectMultipleHint') : t('selectAnswerHint')}</p>
            {!isLast ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!answered}
                className="inline-flex h-10 items-center justify-center gap-1.5 self-stretch rounded-lg bg-[#2D46D9] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2438c4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white sm:h-11 sm:self-auto sm:rounded-xl sm:px-6 sm:text-sm"
              >
                {t('nextQuestion')}
                <ChevronRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={!answered || finishing}
                className="inline-flex h-10 items-center justify-center gap-1.5 self-stretch rounded-lg bg-[#2D46D9] px-5 text-xs font-bold text-white transition-colors hover:bg-[#2438c4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white sm:h-11 sm:self-auto sm:rounded-xl sm:px-6 sm:text-sm"
              >
                {t('finishExam')}
              </button>
            )}
          </div>
        </article>

        <div
          className="flex gap-2 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2.5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3"
          role="status"
        >
          <AlertTriangle className="size-4 shrink-0 text-amber-600 sm:size-5" strokeWidth={2} aria-hidden />
          <p className="text-xs font-medium leading-snug text-amber-950 sm:text-[13px] sm:leading-relaxed">{t('noReturnWarning')}</p>
        </div>
      </div>
    </div>
  );
}
