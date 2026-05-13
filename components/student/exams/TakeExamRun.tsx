'use client';

import Cookies from 'js-cookie';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { FinishQuizAttemptResponse, Quiz, QuizQuestion, QuizQuestionAnswer } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import {
  clearStudentTakePayload,
  readStudentTakePayload,
  writeStudentQuizResultPayload,
  type StudentTakePayload,
} from '@/src/lib/student-quiz-cache';
import { buildStudentStartExamHref } from '@/src/lib/student-start-exam-href';
import { navigateTakeExamExit } from '@/components/student/exams/takeExamNav';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

function resolveMediaUrl(url: string | null | undefined): string | null {
  const u = url?.trim();
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_BASE}${u.startsWith('/') ? u : `/${u}`}`;
}

function normalizeQuestions(quiz: Quiz): QuizQuestion[] {
  const raw = quiz.attributes.questions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((q) => q?.attributes?.text?.trim());
}

function questionAnswers(q: QuizQuestion): QuizQuestionAnswer[] {
  const list = q.attributes.answers;
  if (!Array.isArray(list)) return [];
  return list;
}

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

function isMultipleChoice(q: QuizQuestion): boolean {
  return q.attributes.type === 'multiple_choice';
}

function correctAnswerIds(q: QuizQuestion): Set<string> {
  const ids = new Set<string>();
  for (const a of questionAnswers(q)) {
    if (a.attributes?.is_correct) ids.add(String(a.id));
  }
  return ids;
}

/** Single choice / true_false / short_answer with options: exactly one selected id must be is_correct. Multiple: selected set must equal correct set. */
function isQuestionCorrect(q: QuizQuestion, selectedIds: string[]): boolean {
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

function isQuestionAnswered(q: QuizQuestion, selectedIds: string[]): boolean {
  if (isMultipleChoice(q)) return selectedIds.length > 0;
  return selectedIds.length === 1;
}

function computeExamScore(questions: QuizQuestion[], selections: Record<string, string[]>) {
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
      <div className="mx-auto max-w-[832px] px-4 py-16 text-center text-sm text-slate-600" dir={dir}>
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

  const questionImageSrc = current ? resolveMediaUrl(current.attributes.image) : null;

  return (
    <div className="flex w-full min-w-0 flex-col pb-12" dir={dir}>
      <div className="-mx-5 -mt-5 mb-8 w-[calc(100%+2.5rem)] max-w-none shrink-0 lg:-mx-16 lg:w-[calc(100%+8rem)]">
        <header className="box-border flex h-[83px] w-full min-w-0 items-center justify-between gap-4 border-b border-[#EEEEEE] bg-white pt-4 pb-px ps-8 pe-16">
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 leading-tight">
            <h1 className="truncate text-xl font-bold text-[#0F172A]">{title}</h1>
            <p className="text-sm text-[#64748B]">{t('questionProgress', { current: qNum, total })}</p>
          </div>
          {remainingSec != null ? (
            <div
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5"
              aria-live="polite"
            >
              <Clock className="size-5 text-amber-700" strokeWidth={2} aria-hidden />
              <span className="font-mono text-sm font-bold tabular-nums text-amber-900">
                {formatHms(remainingSec)}
              </span>
            </div>
          ) : null}
        </header>
      </div>

      <div className="mx-auto flex w-full max-w-[832px] flex-col gap-8">
        <article className="flex w-full flex-col gap-8 overflow-y-auto rounded-2xl border border-[#E8ECF2] bg-white pt-8 pr-8 pl-8 pb-8 shadow-[0_4px_32px_rgba(15,23,42,0.07)] min-[900px]:min-h-[669px]">
          {studentName ? (
            <p className="text-[12px] font-medium text-[#94A3B8]">{studentName}</p>
          ) : null}

          <div className="flex flex-wrap items-start justify-between gap-3">
            <span
              className="inline-flex rounded-full px-3 py-1 text-[12px] font-semibold"
              style={{ backgroundColor: '#E8EEFC', color: '#2D46D9' }}
            >
              {t('questionBadge', { n: qNum })}
            </span>
            <span className="text-sm font-semibold text-[#64748B]">
              {qNum} / {total}
            </span>
          </div>

          <h2 className="text-start text-lg font-bold leading-snug text-[#0F172A] sm:text-xl">
            {current?.attributes.text}
          </h2>

          {questionImageSrc ? (
            <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-slate-50">
              <Image
                src={questionImageSrc}
                alt=""
                width={800}
                height={450}
                className="h-auto w-full object-contain"
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            {answers.map((ans) => {
              const aid = String(ans.id);
              const label = ans.attributes?.text?.trim() ?? '';
              const imgSrc = resolveMediaUrl(ans.attributes?.image);
              const checked = selectedForCurrent.includes(aid);
              return (
                <label
                  key={aid}
                  className={`flex cursor-pointer flex-col gap-3 rounded-xl border bg-white px-4 py-3.5 transition-colors sm:px-5 sm:py-4 ${
                    checked ? 'border-[#2D46D9] ring-1 ring-[#2D46D9]/20' : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type={multi ? 'checkbox' : 'radio'}
                      name={`question-${current?.id}`}
                      value={aid}
                      checked={checked}
                      onChange={() => (multi ? toggleMultiAnswer(aid) : setSingleAnswer(aid))}
                      className="mt-1 size-4 shrink-0 accent-[#2D46D9]"
                    />
                    <span className="text-sm font-medium text-[#0F172A] sm:text-[15px]">{label}</span>
                  </div>
                  {imgSrc ? (
                    <div className="relative ms-7 w-full max-w-xl overflow-hidden rounded-lg border border-[#E2E8F0] bg-slate-50">
                      <Image
                        src={imgSrc}
                        alt=""
                        width={640}
                        height={360}
                        className="h-auto w-full object-contain"
                        sizes="(max-width: 768px) 100vw, 640px"
                        unoptimized
                      />
                    </div>
                  ) : null}
                </label>
              );
            })}
          </div>

          <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-[#94A3B8]">{multi ? t('selectMultipleHint') : t('selectAnswerHint')}</p>
            {!isLast ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!answered}
                className="inline-flex h-12 items-center justify-center gap-1.5 self-stretch rounded-xl bg-[#2D46D9] px-6 text-sm font-bold text-white transition-colors hover:bg-[#2438c4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white sm:self-auto"
              >
                {t('nextQuestion')}
                <ChevronRight className="size-4 shrink-0 rtl:rotate-180" aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={!answered || finishing}
                className="inline-flex h-12 items-center justify-center gap-1.5 self-stretch rounded-xl bg-[#2D46D9] px-6 text-sm font-bold text-white transition-colors hover:bg-[#2438c4] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white sm:self-auto"
              >
                {t('finishExam')}
              </button>
            )}
          </div>
        </article>

        <div
          className="flex gap-3 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3.5 sm:px-5 sm:py-4"
          role="status"
        >
          <AlertTriangle className="size-5 shrink-0 text-amber-600" strokeWidth={2} aria-hidden />
          <p className="text-[13px] font-medium leading-relaxed text-amber-950 sm:text-sm">{t('noReturnWarning')}</p>
        </div>
      </div>
    </div>
  );
}
