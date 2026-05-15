'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  ListOrdered,
  Lock,
  Play,
  Tag,
  Target,
  XCircle,
} from 'lucide-react';
import type { QuizAttempt } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import {
  isAttemptRecordCompleted,
  nestedQuizAttributesFromAttempt,
  readAttemptFinishedAtIso,
  readAttemptPassState,
  readAttemptPercentage,
  readAttemptScoreDisplay,
  readAttemptStartedAtIso,
  readQuizTitleFromAttempt,
} from '@/src/lib/student-quiz-attempt-display';
import {
  classifyHubQuizRow,
  daysWholeFromNowTo,
  hubQuizAttemptsSummaryLines,
  hubQuizAttrs,
  hubQuizChapterTitle,
  hubQuizDurationMinutes,
  hubQuizPassMarks,
  hubQuizQuestionCount,
  hubQuizTitle,
  hubQuizTypeLabel,
  type HubQuizListRow,
} from '@/src/lib/student-exam-hub-quiz';
import {
  quizNeedsReactivationAfterExhaustedAttempts,
  quizStudentMustActivateOrReactivate,
} from '@/src/lib/student-quiz-activation-lock';
import { buildStudentStartExamHref } from '@/src/lib/student-start-exam-href';
import { STUDENT_EXAM_CARD_BASE, STUDENT_EXAM_GRID } from '@/components/student/exams/studentExamCardStyles';
import { StudentCourseActivationModal } from '@/components/student/StudentCourseActivationModal';

function normalizeQuizListRow(raw: unknown): HubQuizListRow | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : '';
  if (!id) return null;
  const attrs = o.attributes;
  const attrRec =
    attrs != null && typeof attrs === 'object' && !Array.isArray(attrs)
      ? (attrs as Record<string, unknown>)
      : undefined;
  return {
    id,
    type: typeof o.type === 'string' ? o.type : undefined,
    attributes: attrRec,
  };
}

function formatIsoDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function StudentExamsHub({ locale }: { locale: string }) {
  const t = useTranslations('courses.studentExamsPage');
  const tDetails = useTranslations('courses.studentDetails');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const [quizList, setQuizList] = useState<HubQuizListRow[] | null>(null);
  const [attemptList, setAttemptList] = useState<QuizAttempt[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizActivationTarget, setQuizActivationTarget] = useState<{ id: string; title: string } | null>(
    null
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [quizRes, attemptRes] = await Promise.all([api.quizzes.list(), api.quizAttempts.list()]);
      const qRaw = (quizRes as { data?: unknown }).data;
      const quizzes = Array.isArray(qRaw)
        ? (qRaw as unknown[]).map(normalizeQuizListRow).filter((x): x is HubQuizListRow => x != null)
        : [];
      const aRaw = (attemptRes as { data?: unknown }).data;
      const attempts = Array.isArray(aRaw) ? (aRaw as QuizAttempt[]) : [];
      setQuizList(quizzes);
      setAttemptList(attempts);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : null;
      setLoadError(msg?.trim() || t('loadError'));
      setQuizList([]);
      setAttemptList([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const { available, upcoming, expired, locked } = useMemo(() => {
    const buckets: {
      available: HubQuizListRow[];
      upcoming: HubQuizListRow[];
      expired: HubQuizListRow[];
      locked: HubQuizListRow[];
    } = {
      available: [],
      upcoming: [],
      expired: [],
      locked: [],
    };
    if (!quizList?.length) return buckets;
    const now = Date.now();
    for (const row of quizList) {
      const b = classifyHubQuizRow(row, now);
      switch (b) {
        case 'available':
          buckets.available.push(row);
          break;
        case 'upcoming':
          buckets.upcoming.push(row);
          break;
        case 'expired':
          buckets.expired.push(row);
          break;
        case 'locked':
          buckets.locked.push(row);
          break;
        default:
          break;
      }
    }
    return buckets;
  }, [quizList]);

  const completedAttempts = useMemo(() => {
    if (!attemptList?.length) return [];
    const done = attemptList.filter(isAttemptRecordCompleted);
    return [...done].sort((a, b) => {
      const fa = readAttemptFinishedAtIso(a) ?? '';
      const fb = readAttemptFinishedAtIso(b) ?? '';
      return new Date(fb).getTime() - new Date(fa).getTime();
    });
  }, [attemptList]);

  const tExams = useCallback(
    (key: string, values?: Record<string, string | number>) =>
      tDetails(key as 'examsAttemptsOverview', values as never),
    [tDetails],
  );

  const renderQuizMetaBlock = (row: HubQuizListRow, opts: { chapterFallback: string }) => {
    const title = hubQuizTitle(row);
    const chapterName = hubQuizChapterTitle(row);
    const chapterLine = chapterName ?? opts.chapterFallback;
    const typeLabel = hubQuizTypeLabel(row, tExams);
    const durationMin = hubQuizDurationMinutes(row);
    const qCount = hubQuizQuestionCount(row);
    const passMarks = hubQuizPassMarks(row);
    const attemptsLines = hubQuizAttemptsSummaryLines(row, tExams);
    const startRaw = row.attributes?.start_time;
    const endRaw = row.attributes?.end_time;
    const startStr = typeof startRaw === 'string' ? formatIsoDate(startRaw, locale) : null;
    const endStr = typeof endRaw === 'string' ? formatIsoDate(endRaw, locale) : null;

    return (
      <>
        <div className="mt-4 space-y-2.5 text-sm text-[#64748B]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
            <span>{chapterLine}</span>
          </div>
          {typeLabel ? (
            <div className="flex items-center gap-2.5">
              <Tag className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{tDetails('examsTypeLabel', { type: typeLabel })}</span>
            </div>
          ) : null}
          {durationMin > 0 ? (
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{tDetails('examsDurationMinutes', { count: durationMin })}</span>
            </div>
          ) : null}
          {passMarks ? (
            <div className="flex items-center gap-2.5">
              <Target className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>
                {tDetails('examsPassMarks', { passing: passMarks.passing, total: passMarks.total })}
              </span>
            </div>
          ) : typeof row.attributes?.total_marks === 'number' && Number.isFinite(row.attributes.total_marks) ? (
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{tDetails('examsTotalMarks', { count: row.attributes.total_marks as number })}</span>
            </div>
          ) : null}
          {attemptsLines.map((line, li) => (
            <div key={`m-${title}-${li}-${line}`} className="flex items-center gap-2.5">
              <ListOrdered className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{line}</span>
            </div>
          ))}
          {startStr ? (
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{startStr}</span>
            </div>
          ) : null}
          {endStr ? (
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{tDetails('examsDeadline', { date: endStr })}</span>
            </div>
          ) : null}
          {qCount > 0 ? (
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{tDetails('examsQuestionCount', { count: qCount })}</span>
            </div>
          ) : null}
        </div>
      </>
    );
  };

  return (
    <div className="w-full pb-12 pt-2" dir={dir}>
      <header className="mb-8 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">{t('pageTitle')}</h1>
        <p className="mt-2 text-sm text-[#64748B] sm:text-base">{t('pageSubtitle')}</p>
      </header>

      {loadError ? (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="mt-2 text-sm font-semibold text-red-900 underline underline-offset-2"
          >
            {t('retryLoad')}
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-10 sm:gap-12">
        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {tDetails('examsAvailableNow')}
          </h2>
          {loading ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('loadingQuizzes')}
            </p>
          ) : available.length === 0 ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-5 py-8 text-center text-sm text-[#64748B]">
              {t('emptyAvailable')}
            </p>
          ) : (
            <ul className={STUDENT_EXAM_GRID}>
              {available.map((row) => {
                const rawCid = hubQuizAttrs(row).course_id;
                const courseForStart =
                  typeof rawCid === 'number' && Number.isFinite(rawCid)
                    ? rawCid
                    : typeof rawCid === 'string' && /^\d+$/.test(rawCid.trim())
                      ? rawCid.trim()
                      : null;
                const startHref = buildStudentStartExamHref(locale, row.id, courseForStart);
                const title = hubQuizTitle(row);
                return (
                  <li key={row.id} className={`${STUDENT_EXAM_CARD_BASE} border-emerald-200`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
                        {title}
                      </h3>
                      <span
                        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide sm:text-xs"
                        style={{ backgroundColor: '#DCFCE7', color: '#008236' }}
                      >
                        {tDetails('examsAvailableBadge')}
                      </span>
                    </div>
                    {renderQuizMetaBlock(row, { chapterFallback: tDetails('examsChapterCourse') })}
                    <Link
                      href={startHref}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A63E] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#009035] active:bg-[#007d2f] sm:mt-6 sm:py-3.5"
                    >
                      <Play className="size-[18px] shrink-0 text-white" strokeWidth={2.5} aria-hidden />
                      <span>{tDetails('examsStartExam')}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {tDetails('examsUpcomingTitle')}
          </h2>
          {loading ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('loadingQuizzes')}
            </p>
          ) : upcoming.length === 0 ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-5 py-8 text-center text-sm text-[#64748B]">
              {t('emptyUpcoming')}
            </p>
          ) : (
            <ul className={STUDENT_EXAM_GRID}>
              {upcoming.map((row) => {
                const title = hubQuizTitle(row);
                const startRaw = row.attributes?.start_time;
                const daysLeft =
                  typeof startRaw === 'string' ? daysWholeFromNowTo(startRaw) : null;
                return (
                  <li key={row.id} className={STUDENT_EXAM_CARD_BASE}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-lg">{title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 sm:text-xs">
                        {daysLeft != null
                          ? tDetails('examsDaysLeft', { count: daysLeft })
                          : tDetails('examsUpcomingFallback')}
                      </span>
                    </div>
                    {renderQuizMetaBlock(row, { chapterFallback: tDetails('examsChapterCourse') })}
                    <button
                      type="button"
                      disabled
                      className="mt-5 w-full cursor-not-allowed rounded-lg bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#64748B] sm:mt-6"
                    >
                      {tDetails('examsScheduled')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {tDetails('examsExpiredTitle')}
          </h2>
          {loading ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('loadingQuizzes')}
            </p>
          ) : expired.length === 0 ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-5 py-8 text-center text-sm text-[#64748B]">
              {t('emptyExpired')}
            </p>
          ) : (
            <ul className={STUDENT_EXAM_GRID}>
              {expired.map((row) => {
                const title = hubQuizTitle(row);
                const attrs = hubQuizAttrs(row);
                const endRaw = attrs.end_time;
                const endStr =
                  typeof endRaw === 'string' && endRaw.trim() ? formatIsoDate(endRaw, locale) : null;
                return (
                  <li key={row.id} className={`${STUDENT_EXAM_CARD_BASE} border-rose-100`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-lg">{title}</h3>
                      </div>
                      <span className="shrink-0 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-800 sm:text-xs">
                        {tDetails('examsExpiredBadge')}
                      </span>
                    </div>
                    <div className="mt-3 rounded-lg border border-rose-200/90 bg-rose-50/90 px-3 py-2.5">
                      <div className="flex gap-2">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-rose-700" strokeWidth={2} aria-hidden />
                        <p className="text-sm font-medium leading-snug text-rose-950">
                          {tDetails('examsExpiredHint')}
                        </p>
                      </div>
                      {endStr ? (
                        <p className="mt-2 text-xs font-medium text-rose-900/90">
                          {tDetails('examsEndedOn', { date: endStr })}
                        </p>
                      ) : null}
                    </div>
                    {renderQuizMetaBlock(row, { chapterFallback: tDetails('examsChapterCourse') })}
                    <button
                      type="button"
                      disabled
                      className="mt-5 w-full cursor-not-allowed rounded-lg bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#94A3B8] sm:mt-6"
                    >
                      {tDetails('examsExpiredClosed')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {tDetails('examsCompletedTitle')}
          </h2>
          {loading ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('loadingAttempts')}
            </p>
          ) : completedAttempts.length === 0 ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('emptyCompleted')}
            </p>
          ) : (
            <ul className={STUDENT_EXAM_GRID}>
              {completedAttempts.map((attempt) => {
                const title = readQuizTitleFromAttempt(attempt) || '—';
                const pct = readAttemptPercentage(attempt);
                const { score, total } = readAttemptScoreDisplay(attempt);
                const finishedIso = readAttemptFinishedAtIso(attempt);
                const startedIso = readAttemptStartedAtIso(attempt);
                const finishedStr = formatIsoDate(finishedIso, locale);
                const startedStr = formatIsoDate(startedIso, locale);
                const pass = readAttemptPassState(attempt);
                const qAttrs = nestedQuizAttributesFromAttempt(attempt);
                const durationMin =
                  typeof qAttrs?.duration === 'number' && Number.isFinite(qAttrs.duration)
                    ? qAttrs.duration
                    : 0;
                const pm =
                  qAttrs?.passing_marks != null && Number.isFinite(Number(qAttrs.passing_marks))
                    ? Number(qAttrs.passing_marks)
                    : null;
                const tm =
                  qAttrs?.total_marks != null && Number.isFinite(Number(qAttrs.total_marks))
                    ? Number(qAttrs.total_marks)
                    : null;

                const pctColor =
                  pass === true ? 'text-emerald-600' : pass === false ? 'text-red-600' : 'text-slate-600';
                const PctIcon = pass === false ? XCircle : CheckCircle;

                return (
                  <li key={String(attempt.id)} className={STUDENT_EXAM_CARD_BASE}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-lg">{title}</h3>
                      </div>
                      {pct != null ? (
                        <div className={`flex shrink-0 items-center gap-1 ${pctColor}`}>
                          <PctIcon className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                          <span className="text-base font-bold tabular-nums">{pct}%</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 space-y-2.5 text-sm text-[#64748B]">
                      {startedStr ? (
                        <div className="flex items-center gap-2.5">
                          <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                          <span>{t('attemptStarted', { date: startedStr })}</span>
                        </div>
                      ) : null}
                      {finishedStr ? (
                        <div className="flex items-center gap-2.5">
                          <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                          <span>{t('attemptFinished', { date: finishedStr })}</span>
                        </div>
                      ) : null}
                      {score != null && total != null ? (
                        <div className="flex items-center gap-2.5">
                          <Target className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                          <span>{t('attemptScoreLine', { score, total })}</span>
                        </div>
                      ) : null}
                      {pm != null && tm != null ? (
                        <div className="flex items-center gap-2.5">
                          <Target className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                          <span>{tDetails('examsPassMarks', { passing: pm, total: tm })}</span>
                        </div>
                      ) : null}
                      {pass === true ? (
                        <div className="flex items-center gap-2.5 text-emerald-700">
                          <CheckCircle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                          <span className="font-medium">{t('attemptPassed')}</span>
                        </div>
                      ) : pass === false ? (
                        <div className="flex items-center gap-2.5 text-red-700">
                          <XCircle className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                          <span className="font-medium">{t('attemptFailed')}</span>
                        </div>
                      ) : null}
                      {durationMin > 0 ? (
                        <div className="flex items-center gap-2.5">
                          <Clock className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                          <span>{tDetails('examsDurationMinutes', { count: durationMin })}</span>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {tDetails('examsLockedTitle')}
          </h2>
          {loading ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-10 text-center text-sm text-[#64748B]">
              {t('loadingQuizzes')}
            </p>
          ) : locked.length === 0 ? (
            <p className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-5 py-8 text-center text-sm text-[#64748B]">
              {t('emptyLocked')}
            </p>
          ) : (
            <ul className={STUDENT_EXAM_GRID}>
              {locked.map((row) => {
                const title = hubQuizTitle(row);
                const attrs = hubQuizAttrs(row);
                const top = row as Record<string, unknown>;
                const attrsForPolicy: Record<string, unknown> = {
                  ...attrs,
                  has_activation: attrs.has_activation ?? top.has_activation,
                  is_public: attrs.is_public ?? top.is_public,
                  remaining_attempts: attrs.remaining_attempts ?? top.remaining_attempts,
                  current_attempts: attrs.current_attempts ?? top.current_attempts,
                  max_attempts: attrs.max_attempts ?? top.max_attempts,
                  maxAttempts: attrs.maxAttempts ?? top.maxAttempts,
                };
                const needsActivation = quizStudentMustActivateOrReactivate(attrsForPolicy);
                const reactivateOnly = quizNeedsReactivationAfterExhaustedAttempts(attrsForPolicy);
                const cid = attrs.course_id;

                return (
                  <li key={row.id} className={`${STUDENT_EXAM_CARD_BASE} text-[#64748B]`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold leading-snug text-[#475569] sm:text-lg">{title}</h3>
                      </div>
                      <Lock className="size-5 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                    </div>
                    {needsActivation ? (
                      <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5">
                        <p className="text-sm font-semibold text-amber-950">
                          {reactivateOnly
                            ? tDetails('examsReactivateAttemptsTitle')
                            : tDetails('examsActivationRequired')}
                        </p>
                        <p className="mt-1 text-xs font-medium text-amber-900/85">
                          {reactivateOnly
                            ? tDetails('examsReactivateAttemptsBody')
                            : tDetails('examsPrivateExamHint')}
                        </p>
                        {!reactivateOnly ? (
                          <p className="mt-1 text-xs font-medium text-amber-900/85">
                            {tDetails('examsActivationRequiredSub')}
                          </p>
                        ) : null}
                        {cid != null && String(cid).trim() !== '' ? (
                          <p className="mt-2 text-xs font-semibold text-amber-950">
                            {tDetails('examsCourseIdLabel', { id: String(cid) })}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {renderQuizMetaBlock(row, { chapterFallback: tDetails('examsChapterCourse') })}
                    {needsActivation ? (
                      <button
                        type="button"
                        onClick={() => setQuizActivationTarget({ id: row.id, title })}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-[#2137D6] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3] sm:mt-6"
                      >
                        {tDetails('examsActivateQuizForAccess')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="mt-5 w-full cursor-not-allowed rounded-lg bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#94A3B8] sm:mt-6"
                      >
                        {tDetails('examsNotAvailable')}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <StudentCourseActivationModal
        open={quizActivationTarget !== null}
        onClose={() => setQuizActivationTarget(null)}
        courseId={quizActivationTarget?.id ?? ''}
        courseTitle={quizActivationTarget?.title}
        activationItemType="quiz"
        onActivated={async () => {
          await loadAll();
        }}
      />
    </div>
  );
}
