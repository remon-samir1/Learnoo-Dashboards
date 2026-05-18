'use client';

import Cookies from 'js-cookie';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { ExamQuestionScreen } from '@/components/student/exams/ExamQuestionScreen';
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
import {
  computeExamScore,
  isMultipleChoice,
  isQuestionAnswered,
  normalizeQuestions,
  questionAnswers,
} from '@/src/lib/student-exam-question-utils';
import { useExamCopyGuard } from '@/src/hooks/useExamCopyGuard';

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
  useExamCopyGuard(session !== null && session !== undefined && total > 0);
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

  if (!current) return null;

  return (
    <ExamQuestionScreen
      dir={dir}
      examTitle={title}
      questionBadgeText={t('questionBadge', { n: qNum })}
      questionProgressText={t('questionProgress', { current: qNum, total })}
      currentQuestionNumber={qNum}
      totalQuestions={total}
      question={current}
      answers={answers}
      studentName={studentName}
      headerBleed
      headerAside={
        remainingSec != null ? (
          <div
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-1.5 sm:gap-2 sm:px-3 sm:py-2"
            aria-live="polite"
          >
            <Clock className="size-4 text-amber-700 sm:size-[18px]" strokeWidth={2} aria-hidden />
            <span className="font-mono text-xs font-bold tabular-nums text-amber-900 sm:text-sm">
              {formatHms(remainingSec)}
            </span>
          </div>
        ) : null
      }
      mode="take"
      multi={multi}
      selectedIds={selectedForCurrent}
      onSelectSingle={setSingleAnswer}
      onToggleMulti={toggleMultiAnswer}
      articleFooter={
        <>
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
        </>
      }
      belowArticle={
        <div
          className="flex gap-2 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2.5 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3"
          role="status"
        >
          <AlertTriangle className="size-4 shrink-0 text-amber-600 sm:size-5" strokeWidth={2} aria-hidden />
          <p className="text-xs font-medium leading-snug text-amber-950 sm:text-[13px] sm:leading-relaxed">{t('noReturnWarning')}</p>
        </div>
      }
    />
  );
}
