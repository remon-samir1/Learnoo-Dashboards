'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useDebounce } from 'use-debounce';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Loader2,
  RotateCcw,
  Search as SearchIcon,
  XCircle,
  X as XIcon,
} from 'lucide-react';
import { useQuiz, useQuizAttemptsByQuiz, useQuizAttemptResult } from '@/src/hooks/useQuizzes';
import type {
  QuizAttempt,
  QuizAttemptResultAttempt,
  QuizAttemptResultQuiz,
  QuizAttemptResultResponse,
} from '@/src/types';

interface ExamResultsViewProps {
  params: Promise<{ id: string }>;
  backHref: '/exams' | '/doctor/exams';
}

/** Extract a displayable user name from the eager-loaded nested user. */
function userDisplayName(attempt: QuizAttempt): string {
  const nested = attempt.attributes.user?.data;
  if (!nested) return '—';
  const a = nested.attributes;
  if (a.full_name && a.full_name.trim()) return a.full_name;
  const first = a.first_name?.trim();
  const last = a.last_name?.trim();
  const joined = [first, last].filter(Boolean).join(' ');
  if (joined) return joined;
  if (a.student_code) return a.student_code;
  return nested.id ?? '—';
}

function userSecondary(attempt: QuizAttempt): string | null {
  const nested = attempt.attributes.user?.data;
  if (!nested) return null;
  const a = nested.attributes;
  if (a.student_code) return a.student_code;
  if (a.email) return a.email;
  return null;
}

export function ExamResultsView({ params, backHref }: ExamResultsViewProps) {
  const { id } = use(params);
  const examId = Number(id);
  const locale = useLocale();
  const t = useTranslations('exams.resultsPage');
  const td = useTranslations('exams.resultsPage.drillDown');
  const tc = useTranslations('exams.resultsPage.columns');
  const tp = useTranslations('exams.resultsPage.pagination');
  const ts = useTranslations('exams.resultsPage.search');
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebounce(searchInput, 350);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | string | null>(null);

  // Reset page when search changes (the new query has different offsets).
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const quizQuery = useQuiz(examId);
  const attemptsQuery = useQuizAttemptsByQuiz({
    quiz_id: examId,
    page,
    search: debouncedSearch,
  });

  const attempts = (attemptsQuery.data?.data ?? []) as QuizAttempt[];
  const meta = attemptsQuery.data?.meta;
  const totalPages = meta?.last_page ?? 1;
  const total = meta?.total ?? attempts.length;
  const from = meta?.from ?? (attempts.length > 0 ? 1 : 0);
  const to = meta?.to ?? attempts.length;
  const quizTitle = quizQuery.data?.attributes.title ?? t('examNumber', { id });

  const isLoading = quizQuery.isPending || attemptsQuery.isPending;
  const isError = quizQuery.isError || attemptsQuery.isError;
  const isFetching = attemptsQuery.isFetching;

  const attemptRows = useMemo(
    () =>
      attempts.map((a) => ({
        id: a.id,
        name: userDisplayName(a),
        secondary: userSecondary(a),
        userId: a.attributes.user_id,
        score: a.attributes.score,
        totalScore: a.attributes.total_score,
        percentage: a.attributes.percentage,
        passed: a.attributes.passed,
        status: a.attributes.status,
        startedAt: a.attributes.started_at,
        finishedAt: a.attributes.finished_at,
        attemptsRemaining: a.attributes.attempts_remaining,
      })),
    [attempts],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-[#2137D6]" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-50 p-3 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">{t('quizLoadErrorTitle')}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{t('quizLoadErrorDescription')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              void quizQuery.refetch();
              void attemptsQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2bb3]"
          >
            <RotateCcw className="h-4 w-4" />
            {t('retry')}
          </button>
          <Link href={backHref} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#475569]">
            {t('backToExams')}
          </Link>
        </div>
      </div>
    );
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="flex flex-col gap-6 pb-12">
      <header className="flex items-center gap-4">
        <Link
          href={backHref}
          aria-label={t('backToExams')}
          className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[#64748B] transition hover:text-[#1E293B] hover:shadow-sm"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-[#1E293B]">{t('title')}</h1>
          <p className="mt-0.5 truncate text-sm text-[#64748B]">{quizTitle}</p>
        </div>
      </header>

      {/* Search + meta strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative flex w-full max-w-md items-center">
          <SearchIcon className="pointer-events-none absolute start-3 h-4 w-4 text-[#94A3B8]" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={ts('placeholder')}
            aria-label={ts('label')}
            className="w-full rounded-xl border border-[#E2E8F0] bg-white pe-9 ps-9 py-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#2137D6] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label={ts('clear')}
              className="absolute end-2 rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569]"
            >
              <XIcon className="h-4 w-4" />
            </button>
          ) : null}
        </label>

        <div className="flex items-center gap-3 text-xs text-[#64748B]">
          <span>
            {tp('showingXtoYofZ', {
              from: from.toLocaleString(locale),
              to: to.toLocaleString(locale),
              total: total.toLocaleString(locale),
            })}
          </span>
          {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#94A3B8]" aria-hidden /> : null}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-[#1E293B]">{t('attempts')}</h2>
            <p className="mt-0.5 text-xs text-[#64748B]">
              {debouncedSearch
                ? tp('pageXOfY', { page, total: totalPages }) +
                  ' · ' +
                  ts('filteredBy', { q: debouncedSearch })
                : tp('pageXOfY', { page, total: totalPages })}
            </p>
          </div>
        </div>

        {attemptRows.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#64748B]">
              {debouncedSearch ? ts('noResults') : t('noAttempts')}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table (md+) */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] border-collapse text-start">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-4 py-2 text-start text-[11px] font-bold uppercase tracking-wide text-[#475569]">{tc('student')}</th>
                    <th className="px-4 py-2 text-start text-[11px] font-bold uppercase tracking-wide text-[#475569]">{tc('score')}</th>
                    <th className="px-4 py-2 text-start text-[11px] font-bold uppercase tracking-wide text-[#475569]">{tc('percentage')}</th>
                    <th className="px-4 py-2 text-start text-[11px] font-bold uppercase tracking-wide text-[#475569]">{tc('passed')}</th>
                    <th className="px-4 py-2 text-start text-[11px] font-bold uppercase tracking-wide text-[#475569]">{tc('finishedAt')}</th>
                    <th className="px-4 py-2 text-end text-[11px] font-bold uppercase tracking-wide text-[#475569]">—</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {attemptRows.map((row) => {
                    const isExpanded = expandedId === row.id;
                    return (
                      <ExamAttemptsRow
                        key={String(row.id)}
                        row={row}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                        tc={tc}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards (<md) */}
            <div className="flex flex-col gap-1.5 p-2 md:hidden">
              {attemptRows.map((row) => {
                const isExpanded = expandedId === row.id;
                return (
                  <ExamAttemptCard
                    key={String(row.id)}
                    row={row}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                    tc={tc}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Pagination footer */}
        {totalPages > 1 || total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-xs sm:px-5">
            <span className="text-[#64748B]">
              {tp('pageXOfY', { page, total: totalPages })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                {tp('previous')}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#475569] transition hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {tp('next')}
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

interface AttemptRowData {
  id: number | string;
  name: string;
  secondary: string | null;
  userId: number | string | null | undefined;
  score: number | null;
  totalScore: number | null | undefined;
  percentage: number | null | undefined;
  passed: boolean | null | undefined;
  status: string | null | undefined;
  startedAt: string | null | undefined;
  finishedAt: string | null | undefined;
  attemptsRemaining: number | null | undefined;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

function PassedBadge({ passed }: { passed: boolean | null | undefined }) {
  if (passed == null) return <span className="text-[#94A3B8]">—</span>;
  if (passed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Passed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
      <XCircle className="h-3 w-3" />
      Failed
    </span>
  );
}

function ExamAttemptsRow({
  row,
  isExpanded,
  onToggle,
  tc,
}: {
  row: AttemptRowData;
  isExpanded: boolean;
  onToggle: () => void;
  tc: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr className="cursor-pointer transition-colors hover:bg-[#F8FAFC]/70" onClick={onToggle}>
        <td className="px-4 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-bold text-[#1E293B]">{row.name}</p>
            {row.secondary ? <p className="truncate text-[11px] text-[#94A3B8]">{row.secondary}</p> : null}
          </div>
        </td>
        <td className="px-4 py-2 text-sm text-[#475569]">
          {row.score != null && row.totalScore != null ? (
            <span>
              <strong className="font-bold text-[#1E293B]">{row.score}</strong>
              <span className="text-[#94A3B8]"> / {row.totalScore}</span>
            </span>
          ) : (
            '—'
          )}
        </td>
        <td className="px-4 py-2 text-sm font-semibold text-[#475569]">
          {row.percentage != null ? `${row.percentage}%` : '—'}
        </td>
        <td className="px-4 py-2 text-sm">
          <PassedBadge passed={row.passed} />
        </td>
        <td className="px-4 py-2 text-xs text-[#64748B]">{formatDateTime(row.finishedAt)}</td>
        <td className="px-4 py-2 text-end">
          {isExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-[#94A3B8]" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-[#94A3B8]" />
          )}
        </td>
      </tr>
      {isExpanded ? (
        <tr>
          <td colSpan={6} className="bg-[#F8FAFC] px-4 py-3">
            <ExamAttemptDrillDown attemptId={row.id} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ExamAttemptCard({
  row,
  isExpanded,
  onToggle,
  tc,
}: {
  row: AttemptRowData;
  isExpanded: boolean;
  onToggle: () => void;
  tc: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-start"
        aria-expanded={isExpanded}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#1E293B]">{row.name}</p>
          {row.secondary ? <p className="truncate text-[11px] text-[#94A3B8]">{row.secondary}</p> : null}
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            {row.score != null && row.totalScore != null ? (
              <span>
                <strong className="font-bold text-[#1E293B]">{row.score}</strong>
                <span className="text-[#94A3B8]"> / {row.totalScore}</span>
              </span>
            ) : (
              '—'
            )}
            {row.percentage != null ? ` · ${row.percentage}%` : ''}
            {row.finishedAt ? ` · ${formatDateTime(row.finishedAt)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PassedBadge passed={row.passed} />
          {isExpanded ? <ChevronUp className="h-4 w-4 text-[#94A3B8]" /> : <ChevronDown className="h-4 w-4 text-[#94A3B8]" />}
        </div>
      </button>
      {isExpanded ? (
        <div className="border-t border-[#E2E8F0] px-3 py-3">
          <ExamAttemptDrillDown attemptId={row.id} />
        </div>
      ) : null}
    </div>
  );
}

/** Pull the attempt summary from the actual result response shape. */
function readResultAttempt(result: QuizAttemptResultResponse | undefined): QuizAttemptResultAttempt | null {
  const wrapped = result?.data?.attempt;
  if (wrapped && typeof wrapped === 'object' && 'id' in wrapped) return wrapped;
  const legacy = result?.attempt;
  if (!legacy) return null;
  if ('data' in legacy) return null; // legacy nested QuizAttempt shape — not used here
  return null;
}

function readResultQuiz(result: QuizAttemptResultResponse | undefined): QuizAttemptResultQuiz | null {
  const wrapped = result?.data?.quiz;
  if (wrapped && typeof wrapped === 'object' && 'id' in wrapped) return wrapped;
  return null;
}

function readResultAnswers(result: QuizAttemptResultResponse | undefined) {
  return result?.data?.answers ?? result?.answers ?? [];
}

function ExamAttemptDrillDown({ attemptId }: { attemptId: number | string }) {
  const t = useTranslations('exams.resultsPage.drillDown');
  const resultQuery = useQuizAttemptResult(Number(attemptId));
  const result = resultQuery.data;
  const quiz = readResultQuiz(result);
  const attempt = readResultAttempt(result);
  const answers = readResultAnswers(result);
  const locale = useLocale();

  if (resultQuery.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-[#64748B]">
        <Loader2 className="h-4 w-4 animate-spin text-[#2137D6]" />
        {t('loading')}
      </div>
    );
  }

  if (resultQuery.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {t('errorLoading')}
      </div>
    );
  }

  const earned = attempt?.earned_marks ?? attempt?.score ?? null;
  const total = attempt?.total_score ?? (quiz as { total_marks?: number } | null)?.total_marks ?? null;
  const percentage = attempt?.percentage ?? null;
  const passed = attempt?.passed ?? null;
  const finishedAt = attempt?.finished_at ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8]">{t('quiz')}</p>
          <p className="mt-0.5 truncate text-sm font-bold text-[#1E293B]">
            {quiz?.title ?? `Quiz #${quiz?.id ?? attemptId}`}
          </p>
          {total != null ? (
            <p className="text-[11px] text-[#64748B]">
              {t('totalMarks', { total: total.toLocaleString(locale) })}
              {(quiz as { passing_marks?: number } | null)?.passing_marks != null
                ? ` · ${t('passingMarks', { marks: ((quiz as { passing_marks?: number }).passing_marks ?? 0).toLocaleString(locale) })}`
                : ''}
            </p>
          ) : null}
        </div>
        <PassedBadge passed={passed} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {earned != null ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <span className="text-[#64748B]">{t('earned')}</span>
            <strong className="font-bold text-[#1E293B]">{earned.toLocaleString(locale)}</strong>
            {total != null ? <span className="text-[#94A3B8]">/ {total.toLocaleString(locale)}</span> : null}
          </span>
        ) : null}
        {percentage != null ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <span className="text-[#64748B]">{t('percentage')}</span>
            <strong className="font-bold text-[#1E293B]">{percentage}%</strong>
          </span>
        ) : null}
        {finishedAt ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1">
            <Clock className="h-3 w-3 text-[#94A3B8]" />
            <span className="text-[#475569]">{formatDateTime(finishedAt)}</span>
          </span>
        ) : null}
      </div>

      {answers.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {answers.map((ans) => (
            <ExamAnswerRow key={String(ans.id)} answer={ans} locale={locale} t={t} />
          ))}
        </ol>
      ) : (
        <p className="rounded-md bg-white px-3 py-2 text-xs text-[#64748B] ring-1 ring-[#E2E8F0]">
          {t('noReview')}
        </p>
      )}
    </div>
  );
}

function ExamAnswerRow({
  answer,
  locale,
  t,
}: {
  answer: import('@/src/types').QuizUserAnswer;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const attrs = answer.attributes;
  const q = attrs.quiz_question;
  const correct = attrs.is_correct;
  const pending = q?.auto_correct === false && correct === null;

  const questionText = q?.text ?? `Question #${attrs.quiz_question_id}`;
  const questionImage = q?.image_url ?? null;

  return (
    <li className="rounded-lg border border-[#E2E8F0] bg-white p-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-bold text-[#1E293B]">{questionText}</p>
          {pending ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              <Clock className="h-3 w-3" />
              {t('awaitingGrading')}
            </span>
          ) : correct ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {t('correct')}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
              <XCircle className="h-3 w-3" />
              {t('incorrect')}
            </span>
          )}
        </div>
        {questionImage ? (
          <div className="relative w-full max-w-xl overflow-hidden rounded-md border border-[#E2E8F0] bg-slate-50">
            <Image
              src={questionImage}
              alt=""
              width={640}
              height={360}
              className="max-h-[min(32vh,180px)] w-full object-contain sm:max-h-[min(34vh,200px)]"
              sizes="(max-width: 768px) 100vw, 640px"
              unoptimized
            />
          </div>
        ) : null}
        <dl className="grid gap-2 text-xs text-[#475569] sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[#1E293B]">{t('yourAnswer')}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words">{attrs.answer_text || '—'}</dd>
          </div>
          {attrs.score_earned != null ? (
            <div>
              <dt className="font-semibold text-[#1E293B]">{t('scoreEarned')}</dt>
              <dd className="mt-1">{attrs.score_earned}</dd>
            </div>
          ) : null}
          {attrs.feedback ? (
            <div className="sm:col-span-2">
              <dt className="font-semibold text-[#1E293B]">{t('feedback')}</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">{attrs.feedback}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </li>
  );
}