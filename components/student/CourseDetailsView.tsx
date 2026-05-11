'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Fragment, useLayoutEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  ListOrdered,
  Lock,
  Play,
  Target,
} from 'lucide-react';
import { useCourse } from '@/src/hooks/useCourses';
import { courseIsLocked } from '@/src/lib/student-course-lock';
import type { Chapter, Course, Lecture, Note } from '@/src/types';
import StudentCourseNotesTab from '@/components/student/StudentCourseNotesTab';

/** Figma-aligned tokens for this page */
const C_PRIMARY = '#2D43D1';
const C_SECTION_BG = '#F8F9FB';

type DetailTab = 'lectures' | 'exams' | 'notes';

type StudentDetailsT = ReturnType<typeof useTranslations<'courses.studentDetails'>>;

function hasPdfAttachment(ch: Chapter): boolean {
  const atts = ch.attributes.attachments ?? [];
  return atts.some((a) => {
    const ext = a.attributes?.extension?.toLowerCase() ?? '';
    const path = a.attributes?.path?.toLowerCase() ?? '';
    const name = a.attributes?.name?.toLowerCase() ?? '';
    return ext === 'pdf' || path.endsWith('.pdf') || name.endsWith('.pdf');
  });
}

function getFirstPdfUrl(ch: Chapter): string | null {
  const atts = ch.attributes.attachments ?? [];
  for (const a of atts) {
    const path = a.attributes?.path;
    if (!path) continue;
    const ext = a.attributes?.extension?.toLowerCase() ?? '';
    const name = a.attributes?.name?.toLowerCase() ?? '';
    if (ext === 'pdf' || path.toLowerCase().endsWith('.pdf') || name.endsWith('.pdf')) {
      return path;
    }
  }
  return null;
}

function isViewsExhausted(ch: Chapter): boolean {
  const max = ch.attributes.max_views;
  if (max == null || max <= 0) return false;
  return ch.attributes.current_user_views >= max;
}

function sortedLectures(lectures: Lecture[] | undefined): Lecture[] {
  if (!lectures?.length) return [];
  return [...lectures].sort(
    (a, b) => (a.attributes.order ?? 0) - (b.attributes.order ?? 0)
  );
}

function detailTabFromSearchParams(searchParams: URLSearchParams): DetailTab {
  const q = searchParams.get('tab');
  if (q === 'exams' || q === 'notes' || q === 'lectures') return q;
  return 'lectures';
}

function normalizeExamStatusToken(status: unknown): string {
  return String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');
}

/** Buckets for student exam UI. `null` = hide (e.g. draft). */
type StudentExamBucket = 'active' | 'upcoming' | 'completed' | 'locked';

function classifyExamBucket(
  exam: NonNullable<Course['attributes']['exams']>[number]
): StudentExamBucket | null {
  const s = normalizeExamStatusToken(exam?.attributes?.status);

  if (s === 'draft') return null;

  // Keep “active” strict: only this token (case-insensitive) → Available Now / Start Exam.
  if (s === 'active') return 'active';

  const upcoming = ['upcoming', 'scheduled', 'pending', 'not_started', 'notstarted', 'soon', 'waiting'];
  if (upcoming.includes(s)) return 'upcoming';

  const completed = [
    'completed',
    'complete',
    'finished',
    'done',
    'submitted',
    'graded',
    'passed',
    'failed',
  ];
  if (completed.includes(s)) return 'completed';

  const locked = ['locked', 'lock', 'unavailable', 'disabled', 'closed', 'inactive'];
  if (locked.includes(s)) return 'locked';

  if (s.includes('complete') || s.includes('finish') || s.includes('graded')) return 'completed';
  if (s.includes('upcome') || s.includes('schedule') || s.includes('pend')) return 'upcoming';
  if (s.includes('lock') || s.includes('close')) return 'locked';

  if (!s) {
    const rawStart = (exam?.attributes as { start_time?: string | null } | undefined)?.start_time;
    if (rawStart?.trim()) {
      const ts = new Date(rawStart).getTime();
      if (!Number.isNaN(ts) && ts > Date.now()) return 'upcoming';
    }
    return 'locked';
  }

  return 'locked';
}

type LooseExamAttrs = {
  status?: unknown;
  title?: string;
  description?: string;
  chapter_id?: number | null;
  duration?: number;
  start_time?: string | null;
  end_time?: string | null;
  questions?: unknown[];
  total_marks?: number;
  passing_marks?: number;
  max_attempts?: number;
  percentage?: number;
  score?: number;
  result_percentage?: number;
  obtained_marks?: number;
};

function looseExamAttrs(exam: NonNullable<Course['attributes']['exams']>[number]): LooseExamAttrs {
  return (exam?.attributes ?? {}) as LooseExamAttrs;
}

function daysWholeFromNowTo(iso: string | null | undefined): number | null {
  if (!iso?.trim()) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const now = Date.now();
  if (target <= now) return null;
  return Math.max(1, Math.ceil((target - now) / 86400000));
}

function getExamScorePercent(attrs: LooseExamAttrs): number | null {
  for (const v of [attrs.result_percentage, attrs.percentage]) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      if (v > 0 && v <= 1) return Math.round(v * 100);
      if (v <= 100) return Math.round(v);
    }
  }
  const sc = attrs.score;
  if (typeof sc === 'number' && Number.isFinite(sc)) {
    if (sc > 0 && sc <= 1) return Math.round(sc * 100);
    if (sc <= 100) return Math.round(sc);
  }
  const ob = attrs.obtained_marks;
  const tot = attrs.total_marks;
  if (typeof ob === 'number' && typeof tot === 'number' && tot > 0) {
    return Math.round((ob / tot) * 100);
  }
  return null;
}

function chapterLineForExam(
  exam: NonNullable<Course['attributes']['exams']>[number],
  lectures: Lecture[],
  t: StudentDetailsT
): string {
  const attrs = looseExamAttrs(exam);
  const chapterId = attrs.chapter_id;
  const chapterName = chapterTitleForExam(lectures, chapterId);
  return (
    chapterName ??
    (chapterId != null
      ? t('examsChapterFallback', { id: String(chapterId) })
      : t('examsChapterCourse'))
  );
}

/** Resolve chapter title for an exam from nested lectures → chapters (API `chapter_id`). */
function chapterTitleForExam(
  lectures: Lecture[],
  chapterId: number | string | null | undefined
): string | null {
  if (chapterId == null || chapterId === '') return null;
  const target = String(chapterId);
  for (const lec of lectures) {
    for (const ch of lec.attributes.chapters ?? []) {
      if (String(ch.id) === target) {
        return ch.attributes.title?.trim() || null;
      }
    }
  }
  return null;
}

function examQuestionsReturned(exam: NonNullable<Course['attributes']['exams']>[number]): boolean {
  const qs = exam?.attributes?.questions;
  return Array.isArray(qs) && qs.length > 0;
}

function examQuestionCount(exam: NonNullable<Course['attributes']['exams']>[number]): number {
  const qs = exam?.attributes?.questions;
  return Array.isArray(qs) ? qs.length : 0;
}

function formatExamDate(iso: string | null | undefined, locale: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export default function CourseDetailsView({ courseId }: { courseId: string }) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('courses.studentDetails');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const numericId = Number.parseInt(courseId, 10);
  const idValid = Number.isFinite(numericId) && numericId > 0;

  const { data: course, isLoading, error, refetch } = useCourse(numericId, {
    enabled: idValid,
  });

  const lockedCourse =
    !isLoading && course != null && courseIsLocked(course);

  useLayoutEffect(() => {
    if (!lockedCourse) return;
    router.replace(`/${locale}/student/courses`);
  }, [lockedCourse, router, locale]);

  const tab = detailTabFromSearchParams(searchParams);

  const selectTab = (key: DetailTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const lectures = useMemo(
    () => sortedLectures(course?.attributes?.lectures),
    [course?.attributes?.lectures]
  );

  const heroThumb =
    course?.attributes?.thumbnail?.trim() || '/logo.svg';

  const instructorName =
    course?.attributes?.instructor?.data?.attributes?.full_name?.trim() ?? '';
  const centerName =
    course?.attributes?.center?.data?.attributes?.name?.trim() ?? '';
  const lectureStatCount = course?.attributes?.stats?.lectures ?? 0;
  const subTitle = course?.attributes?.sub_title?.trim() ?? '';

  /** Hero subtitle: instructor • center • sub_title • N Lectures (reference layout). */
  const heroBannerSubtitleParts = useMemo(() => {
    const parts: string[] = [];
    if (instructorName) parts.push(instructorName);
    if (centerName) parts.push(centerName);
    if (subTitle) parts.push(subTitle);
    parts.push(t('heroLectureCount', { count: lectureStatCount }));
    return parts;
  }, [instructorName, centerName, subTitle, lectureStatCount, t]);

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'lectures', label: t('tabs.lectures') },
    { key: 'exams', label: t('tabs.exams') },
    { key: 'notes', label: t('tabs.notes') },
  ];

  if (!idValid) {
    return (
      <div
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        dir={dir}
      >
        <p className="text-sm text-red-600">{t('invalidId')}</p>
        <Link
          href={`/${locale}/student/courses`}
          className="mt-4 inline-flex text-sm font-medium text-[#2563EB] hover:underline"
        >
          {t('back')}
        </Link>
      </div>
    );
  }

  if (lockedCourse) {
    return (
      <div
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        dir={dir}
        aria-busy="true"
      >
        <div className="flex flex-col gap-8 sm:gap-10">
          <div className="mx-auto h-[200px] max-w-[1264px] animate-pulse rounded-[20px] bg-slate-200 sm:h-[228px] md:h-[256px]" />
          <div className="h-12 max-w-xl animate-pulse rounded-lg bg-slate-200" />
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
      dir={dir}
    >
      <Link
        href={`/${locale}/student/courses`}
        className="mb-6 inline-flex text-sm font-medium text-[#64748B] transition hover:text-[#0F172A] sm:mb-8"
      >
        {t('back')}
      </Link>

      {isLoading && (
        <div className="flex flex-col gap-8 sm:gap-10">
          <div className="mx-auto h-[200px] max-w-[1264px] animate-pulse rounded-[20px] bg-slate-900 shadow-lg sm:h-[228px] md:h-[256px]" />
          <div className="h-12 max-w-xl rounded-lg bg-slate-200" />
          <div className="h-40 rounded-2xl bg-slate-100" />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
          {t('error')}: {error}
        </div>
      )}

      {!isLoading && !error && !course && (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 text-center text-sm text-slate-600">
          {t('notFound')}
        </div>
      )}

      {!isLoading && !error && course && (
        <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
          <section
            className="relative isolate mx-auto h-[200px] w-full max-w-[1264px] overflow-hidden rounded-[20px] bg-slate-900 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.35)] sm:h-[228px] md:h-[256px]"
          >
            <Image
              src={heroThumb}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 1264px"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 flex max-h-full flex-col items-start justify-end px-4 pb-4 pt-8 text-start sm:px-6 sm:pb-5 sm:pt-10 md:px-8 md:pb-5 md:pt-12">
              <h1 className="max-w-4xl text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl md:text-[1.75rem] lg:text-[2rem]">
                {course.attributes.title}
              </h1>
              <div className="mt-2 flex max-w-4xl flex-wrap items-center text-xs font-normal leading-snug text-white/95 sm:mt-2.5 sm:text-sm md:text-base">
                {heroBannerSubtitleParts.map((part, i) => (
                  <Fragment key={i}>
                    {i > 0 ? (
                      <span
                        className="mx-2 shrink-0 select-none text-sm text-white/45 sm:mx-3 sm:text-base"
                        aria-hidden
                      >
                        •
                      </span>
                    ) : null}
                    <span className="break-words">{part}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          </section>

          <div className="overflow-x-auto pb-1 md:[scrollbar-width:thin] md:[scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] md:[&::-webkit-scrollbar]:h-2 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-slate-100 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-slate-300 md:hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
            <div className="flex min-w-max flex-nowrap items-center gap-1 border-b border-[#E5E7EB] sm:gap-2">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectTab(item.key)}
                  className={`whitespace-nowrap border-b-[3px] py-3.5 px-4 text-sm font-medium transition sm:px-8 sm:py-4 sm:text-[15px] ${tab === item.key
                    ? 'border-[#2D43D1] text-[#2D43D1]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[120px]">
            {tab === 'lectures' && (
              <LecturesTab
                courseId={courseId}
                locale={locale}
                lectures={lectures}
                exams={course.attributes.exams}
                instructorImageUrl={
                  course.attributes.instructor?.data?.attributes?.image?.trim() ||
                  undefined
                }
                t={t}
              />
            )}
            {tab === 'exams' && (
              <ExamsTab
                exams={course.attributes.exams}
                courseTitle={course.attributes.title}
                locale={locale}
                lectures={lectures}
                t={t}
              />
            )}
            {tab === 'notes' && (
              <StudentCourseNotesTab
                notes={course.attributes.notes as Note[] | undefined}
                courseId={numericId}
                courseTitle={course.attributes.title}
                onNotesUpdated={() => {
                  void refetch();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LecturesTab({
  courseId,
  locale,
  lectures,
  exams,
  instructorImageUrl,
  t,
}: {
  courseId: string;
  locale: string;
  lectures: Lecture[];
  exams: Course['attributes']['exams'] | undefined;
  instructorImageUrl?: string;
  t: StudentDetailsT;
}) {
  if (!lectures.length) {
    return (
      <p className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
        {t('lecturesEmpty')}
      </p>
    );
  }

  const courseHasExams = (exams?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {lectures.map((lecture) => {
        const chapters = lecture.attributes.chapters ?? [];
        const partCount = chapters.length;

        return (
          <div
            key={lecture.id}
            className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm sm:rounded-2xl"
          >
            <div
              className="flex flex-col gap-4 border-b border-[#E5E7EB] px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-5"
              style={{ backgroundColor: C_SECTION_BG }}
            >
              {instructorImageUrl ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white sm:h-12 sm:w-12">
                  <Image
                    src={instructorImageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
              ) : null}
              <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-[#0F172A] sm:text-lg md:text-xl">
                {lecture.attributes.title}
              </h2>
            </div>
            <div className="divide-y divide-[#E5E7EB] px-3 sm:px-6">
              {chapters.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#64748B] sm:py-12">
                  {t('lectureNoParts')}
                </p>
              ) : (
                chapters.map((chapter, chIdx) => (
                  <ChapterRow
                    key={chapter.id}
                    courseId={courseId}
                    locale={locale}
                    chapter={chapter}
                    itemIndexWithinLecture={chIdx + 1}
                    partCount={partCount}
                    courseHasExams={courseHasExams}
                    t={t}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChapterRow({
  courseId,
  locale,
  chapter,
  itemIndexWithinLecture,
  partCount,
  courseHasExams,
  t,
}: {
  courseId: string;
  locale: string;
  chapter: Chapter;
  itemIndexWithinLecture: number;
  partCount: number;
  courseHasExams: boolean;
  t: StudentDetailsT;
}) {
  const attrs = chapter.attributes;
  const hasExam = courseHasExams;
  const hasPdf = hasPdfAttachment(chapter);
  const pdfUrl = getFirstPdfUrl(chapter);
  const exhausted = isViewsExhausted(chapter);
  const locked = attrs.is_locked || !attrs.can_watch;
  const duration = attrs.duration ?? '—';
  const maxViews = attrs.max_views;
  const remaining =
    maxViews != null && maxViews > 0
      ? Math.max(0, maxViews - attrs.current_user_views)
      : null;
  const viewsLabel =
    maxViews != null && maxViews > 0
      ? t('viewsRemaining', { remaining: remaining ?? 0, max: maxViews })
      : t('viewsUnlimited');

  const watchHref = `/${locale}/student/courses/course-details/${courseId}/watch/${chapter.id}`;

  let iconWrap =
    'flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] sm:size-12';
  let iconColor = C_PRIMARY;
  let IconEl: typeof Play | typeof Lock = Play;

  if (locked) {
    iconWrap =
      'flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-[#F1F5F9] text-[#94A3B8] sm:size-12';
    iconColor = '#94A3B8';
    IconEl = Lock;
  } else if (exhausted) {
    iconWrap =
      'flex size-[52px] shrink-0 items-center justify-center rounded-xl bg-[#FFFBEB] text-[#D97706] sm:size-12';
    iconColor = '#D97706';
    IconEl = Play;
  }

  const badgeBase =
    'inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] font-semibold leading-tight';

  const pdfBadge = hasPdf ? (
    pdfUrl ? (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${badgeBase} bg-[#EFF6FF] text-[#1E40AF] transition hover:opacity-90`}
      >
        {t('hasPdf')}
      </a>
    ) : (
      <span className={`${badgeBase} bg-[#EFF6FF] text-[#1E40AF]`}>{t('hasPdf')}</span>
    )
  ) : null;

  const heading = t('chapterItemHeading', {
    number: itemIndexWithinLecture,
    title: attrs.title,
  });

  return (
    <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-stretch sm:gap-8 sm:py-6 md:gap-10">
      <div className="flex min-w-0 flex-1 flex-row items-start gap-4 sm:items-center sm:gap-6">
        <div className={iconWrap} style={{ color: locked || exhausted ? undefined : iconColor }}>
          <IconEl className="size-[22px] sm:size-5" strokeWidth={2} fill="none" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-[17px] md:text-lg">
            {heading}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-relaxed text-[#64748B] sm:mt-3.5 sm:gap-x-5 sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
              {duration}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
              {viewsLabel}
            </span>
            <span className="font-medium">{t('partsCount', { count: partCount })}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-2.5">
            {hasExam && (
              <span className={`${badgeBase} bg-[#FFF7ED] text-[#C2410C]`}>
                {t('hasExam')}
              </span>
            )}
            {pdfBadge}
            {exhausted && (
              <span className={`${badgeBase} bg-[#F1F5F9] text-[#475569]`}>
                {t('viewsExhausted')}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-[10rem] sm:justify-center sm:gap-3 md:w-[10.5rem]">
        {locked ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-xl bg-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#64748B] sm:min-h-10 sm:py-2.5"
          >
            {t('locked')}
          </button>
        ) : exhausted ? (
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border-2 border-[#F97316] bg-[#FFF7ED] px-4 py-3 text-sm font-semibold text-[#C2410C] transition hover:bg-[#FFEDD5] sm:min-h-10 sm:py-2.5"
          >
            {t('reactivate')}
          </button>
        ) : (
          <Link
            href={watchHref}
            className="inline-flex min-h-11 w-full items-center justify-center gap-0.5 rounded-xl bg-[#2D43D1] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2436b0] sm:min-h-10 sm:py-2.5"
          >
            {t('watch')}
            <ChevronRight className="size-4 shrink-0 rtl:rotate-180" strokeWidth={2.5} />
          </Link>
        )}
      </div>
    </div>
  );
}

type CourseExamItem = NonNullable<Course['attributes']['exams']>[number];

function examSubtitle(attrs: LooseExamAttrs, courseTitle: string): string {
  const d = attrs.description?.trim();
  return d || courseTitle;
}

function ExamsTab({
  exams,
  courseTitle,
  locale,
  lectures,
  t,
}: {
  exams: Course['attributes']['exams'] | undefined;
  courseTitle: string;
  locale: string;
  lectures: Lecture[];
  t: StudentDetailsT;
}) {
  const { active, upcoming, completed, locked } = useMemo(() => {
    const buckets: Record<StudentExamBucket, CourseExamItem[]> = {
      active: [],
      upcoming: [],
      completed: [],
      locked: [],
    };
    if (!exams?.length) return buckets;
    for (const exam of exams) {
      const b = classifyExamBucket(exam);
      if (b) buckets[b].push(exam);
    }
    return buckets;
  }, [exams]);

  if (!exams?.length) {
    return (
      <p className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-10 text-center text-sm text-[#64748B]">
        {t('examsEmpty')}
      </p>
    );
  }

  const gridCls = 'grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6';
  const cardBase =
    'flex flex-col rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-5';

  const renderActiveExamCard = (exam: CourseExamItem) => {
    const examId = String(exam?.attributes?.id ?? exam?.id ?? '');
    const attrs = looseExamAttrs(exam);
    const title = attrs.title?.trim() || '—';
    const chapterLine = chapterLineForExam(exam, lectures, t);
    const durationMin =
      typeof attrs.duration === 'number' && Number.isFinite(attrs.duration) ? attrs.duration : 0;
    const showQuestions = examQuestionsReturned(exam);
    const qCount = showQuestions ? examQuestionCount(exam) : 0;
    const totalMarks =
      typeof attrs.total_marks === 'number' && Number.isFinite(attrs.total_marks)
        ? attrs.total_marks
        : null;
    const passingMarks =
      typeof attrs.passing_marks === 'number' && Number.isFinite(attrs.passing_marks)
        ? attrs.passing_marks
        : null;
    const maxAttempts =
      typeof attrs.max_attempts === 'number' && Number.isFinite(attrs.max_attempts)
        ? attrs.max_attempts
        : null;
    const deadlineStr = formatExamDate(attrs.end_time ?? null, locale);
    const showMarks = totalMarks != null && passingMarks != null;
    const showAttempts = maxAttempts != null && maxAttempts > 0;
    const startHref = `/${locale}/student/exams/start-exam/${examId}`;

    return (
      <li
        key={examId || title}
        className={`${cardBase} border-emerald-200`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
            {title}
          </h3>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide sm:text-xs"
            style={{ backgroundColor: '#DCFCE7', color: '#008236' }}
          >
            {t('examsAvailableBadge')}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#64748B]">{courseTitle}</p>
        <div className="mt-4 space-y-2.5 text-sm text-[#64748B]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
            <span>{chapterLine}</span>
          </div>
          {durationMin > 0 ? (
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{t('examsDurationMinutes', { count: durationMin })}</span>
            </div>
          ) : null}
          {showMarks ? (
            <div className="flex items-center gap-2.5">
              <Target className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>
                {t('examsPassMarks', {
                  passing: passingMarks ?? 0,
                  total: totalMarks ?? 0,
                })}
              </span>
            </div>
          ) : null}
          {showAttempts ? (
            <div className="flex items-center gap-2.5">
              <ListOrdered className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{t('examsAttemptsAllowed', { count: maxAttempts })}</span>
            </div>
          ) : null}
          {deadlineStr ? (
            <div className="flex items-center gap-2.5">
              <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{t('examsDeadline', { date: deadlineStr })}</span>
            </div>
          ) : null}
          {showQuestions ? (
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
              <span>{t('examsQuestionCount', { count: qCount })}</span>
            </div>
          ) : null}
        </div>
        <Link
          href={startHref}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#00A63E] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#009035] active:bg-[#007d2f] sm:mt-6 sm:py-3.5"
        >
          <Play className="size-[18px] shrink-0 text-white" strokeWidth={2.5} />
          <span>{t('examsStartExam')}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-10 sm:gap-12">
      <section className="space-y-4 sm:space-y-5">
        <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
          {t('examsAvailableNow')}
        </h2>
        {active.length === 0 ? (
          <p className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-8 text-center text-sm text-[#64748B]">
            {t('examsNoActiveExams')}
          </p>
        ) : (
          <ul className={gridCls}>{active.map((exam) => renderActiveExamCard(exam))}</ul>
        )}
      </section>

      {upcoming.length > 0 ? (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {t('examsUpcomingTitle')}
          </h2>
          <ul className={gridCls}>
            {upcoming.map((exam) => {
              const examId = String(exam?.attributes?.id ?? exam?.id ?? '');
              const attrs = looseExamAttrs(exam);
              const title = attrs.title?.trim() || '—';
              const chapterLine = chapterLineForExam(exam, lectures, t);
              const durationMin =
                typeof attrs.duration === 'number' && Number.isFinite(attrs.duration)
                  ? attrs.duration
                  : 0;
              const showQuestions = examQuestionsReturned(exam);
              const qCount = showQuestions ? examQuestionCount(exam) : 0;
              const daysLeft = daysWholeFromNowTo(attrs.start_time ?? null);
              const startStr = formatExamDate(attrs.start_time ?? null, locale);

              return (
                <li key={examId || title} className={cardBase}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-sm text-[#64748B]">{examSubtitle(attrs, courseTitle)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 sm:text-xs">
                      {daysLeft != null
                        ? t('examsDaysLeft', { count: daysLeft })
                        : t('examsUpcomingFallback')}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2.5 text-sm text-[#64748B]">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                      <span>{chapterLine}</span>
                    </div>
                    {startStr ? (
                      <div className="flex items-center gap-2.5">
                        <Calendar className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                        <span>{startStr}</span>
                      </div>
                    ) : null}
                    {durationMin > 0 ? (
                      <div className="flex items-center gap-2.5">
                        <Clock className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                        <span>{t('examsDurationMinutes', { count: durationMin })}</span>
                      </div>
                    ) : null}
                    {showQuestions ? (
                      <div className="flex items-center gap-2.5">
                        <FileText className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                        <span>{t('examsQuestionCount', { count: qCount })}</span>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full cursor-not-allowed rounded-lg bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#64748B] sm:mt-6"
                  >
                    {t('examsScheduled')}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {t('examsCompletedTitle')}
          </h2>
          <ul className={gridCls}>
            {completed.map((exam) => {
              const examId = String(exam?.attributes?.id ?? exam?.id ?? '');
              const attrs = looseExamAttrs(exam);
              const title = attrs.title?.trim() || '—';
              const chapterLine = chapterLineForExam(exam, lectures, t);
              const durationMin =
                typeof attrs.duration === 'number' && Number.isFinite(attrs.duration)
                  ? attrs.duration
                  : 0;
              const showQuestions = examQuestionsReturned(exam);
              const qCount = showQuestions ? examQuestionCount(exam) : 0;
              const scorePct = getExamScorePercent(attrs);
              const metaParts: string[] = [];
              if (showQuestions) metaParts.push(t('examsQuestionCount', { count: qCount }));
              if (durationMin > 0) metaParts.push(t('examsDurationMinutes', { count: durationMin }));
              const metaLine = metaParts.join(' • ');

              return (
                <li key={examId || title} className={cardBase}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-[#0F172A] sm:text-lg">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-sm text-[#64748B]">{courseTitle}</p>
                    </div>
                    {scorePct != null ? (
                      <div className="flex shrink-0 items-center gap-1 text-emerald-600">
                        <CheckCircle className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                        <span className="text-base font-bold">{scorePct}%</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-2.5 text-sm text-[#64748B]">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                      <span>{chapterLine}</span>
                    </div>
                    {metaLine ? (
                      <div className="flex items-center gap-2.5">
                        <FileText className="size-4 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                        <span>{metaLine}</span>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {locked.length > 0 ? (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="text-lg font-bold tracking-tight text-[#0F172A] sm:text-xl">
            {t('examsLockedTitle')}
          </h2>
          <ul className={gridCls}>
            {locked.map((exam) => {
              const examId = String(exam?.attributes?.id ?? exam?.id ?? '');
              const attrs = looseExamAttrs(exam);
              const title = attrs.title?.trim() || '—';
              const chapterLine = chapterLineForExam(exam, lectures, t);
              const scheduleStr =
                formatExamDate(attrs.start_time ?? null, locale) ??
                formatExamDate(attrs.end_time ?? null, locale);

              return (
                <li
                  key={examId || title}
                  className={`${cardBase} text-[#64748B]`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-[#475569] sm:text-lg">{title}</h3>
                      <p className="mt-1.5 text-sm text-[#94A3B8]">{examSubtitle(attrs, courseTitle)}</p>
                    </div>
                    <Lock className="size-5 shrink-0 text-[#94A3B8]" strokeWidth={2} aria-hidden />
                  </div>
                  <div className="mt-4 space-y-2.5 text-sm text-[#94A3B8]">
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                      <span>{chapterLine}</span>
                    </div>
                    {scheduleStr ? (
                      <div className="flex items-center gap-2.5">
                        <Calendar className="size-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                        <span>{scheduleStr}</span>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full cursor-not-allowed rounded-lg bg-[#F1F5F9] py-3 text-center text-sm font-semibold text-[#94A3B8] sm:mt-6"
                  >
                    {t('examsNotAvailable')}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

