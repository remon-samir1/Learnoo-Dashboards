'use client';

/**
 * Static UI only via `t()` / messages. Course titles, names, category, status, etc. come from the API as-is.
 */
import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { StudentCourseCard } from '@/components/student/StudentCourseCard';
import { CourseCardSkeleton } from '@/src/components/ui/Skeleton';
import { useCourses } from '@/src/hooks/useCourses';
import { courseIsLocked } from '@/src/lib/student-course-lock';
import type { Course } from '@/src/types';

const FINAL_REVISION_KEYWORDS = ['مراجعة', 'مراجعات', 'revision', 'final revision'];

function normalizeTitle(title?: string) {
  return title?.trim().replace(/\s+/g, ' ') ?? '';
}

function isFinalRevisionTitle(title?: string): boolean {
  const normalized = normalizeTitle(title).toLowerCase();
  return FINAL_REVISION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

type StudentCourseTab = string;

export default function StudentCoursesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('courses');
  const { data: courses, isLoading, error } = useCourses();
  const [selectedTab, setSelectedTab] = useState<StudentCourseTab>('all');
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  /** Includes locked (`status !== 1` or `is_locked`) and active courses. */
  const displayCourses = useMemo(() => courses ?? [], [courses]);

  const titleTabs = useMemo(() => {
    if (!displayCourses.length) return [];
    const titles = displayCourses
      .map((c) => c.attributes.title)
      .filter((title): title is string => Boolean(title) && !isFinalRevisionTitle(title));
    return [...new Set(titles)];
  }, [displayCourses]);

  const hasFinalRevision = useMemo(() => {
    if (!displayCourses.length) return false;
    return displayCourses.some((course) => isFinalRevisionTitle(course.attributes.title));
  }, [displayCourses]);

  const tabs = useMemo(() => {
    const dynamicTabs = titleTabs.map((title) => ({ key: title, label: title }));

    return [
      { key: 'all', label: t('studentTabs.all') },
      { key: 'courses', label: t('studentTabs.courses') },
      ...dynamicTabs,
      ...(hasFinalRevision ? [{ key: 'finalRevision', label: t('studentTabs.finalRevision') }] : []),
    ];
  }, [titleTabs, hasFinalRevision, t]);

  function getCourseProgress(course: Course) {
    const lectures = course.attributes.stats?.lectures ?? 0;
    const exams = course.attributes.stats?.exams ?? 0;
    const base = lectures * 8 + exams * 5;
    return Math.min(98, Math.max(12, base || 35));
  }

  const filteredCourses = useMemo(() => {
    if (!displayCourses.length) return [];
    if (selectedTab === 'all') return displayCourses;
    if (selectedTab === 'courses') {
      return displayCourses.filter((course) => !isFinalRevisionTitle(course.attributes.title));
    }
    if (selectedTab === 'finalRevision') {
      return displayCourses.filter((course) => isFinalRevisionTitle(course.attributes.title));
    }
    return displayCourses.filter((course) => course.attributes.title === selectedTab);
  }, [displayCourses, selectedTab]);

  const selectedTabLabel = useMemo(
    () => tabs.find((tab) => tab.key === selectedTab)?.label ?? '',
    [selectedTab, tabs]
  );

  const resultsSummary = t('studentResultsCount', { count: filteredCourses.length });

  const goToCourse = (courseId: string) => {
    router.push(`/${locale}/student/courses/course-details/${courseId}`);
  };

  // Course activation (code / API / navigation) — implement when the backend flow is ready.
  const handleActivateCourse = (_courseId: string) => {};

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8" dir={dir}>
      <div className="mb-6 space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {t('studentPageTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{t('studentPageDescription')}</p>
        </div>
      </div>

      <div className="overflow-x-auto pb-3 md:pb-2 md:[scrollbar-width:thin] md:[scrollbar-color:rgb(148_163_184)_rgb(241_245_249)] md:[&::-webkit-scrollbar]:h-2 md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-track]:bg-slate-100 md:[&::-webkit-scrollbar-track]:mx-0.5 md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:border-2 md:[&::-webkit-scrollbar-thumb]:border-transparent md:[&::-webkit-scrollbar-thumb]:bg-slate-300 md:[&::-webkit-scrollbar-thumb]:bg-clip-padding md:[&::-webkit-scrollbar-thumb]:shadow-sm md:hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
        <div className="flex min-w-max flex-nowrap items-center gap-2 border-b border-[#E5E7EB]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key)}
              className={`whitespace-nowrap border-b-2 py-3 px-3 text-sm font-medium transition sm:px-4 ${
                selectedTab === tab.key
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {resultsSummary}
          {selectedTab !== 'all' ? ` • ${selectedTabLabel}` : ''}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => <CourseCardSkeleton key={index} />)}

        {!isLoading && error && (
          <div className="col-span-full rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
            {t('view.error')}: {error}
          </div>
        )}

        {!isLoading && !error && filteredCourses.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center text-sm text-slate-600">
            {t('noCourses')}
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredCourses.map((course) => {
            const categoryName = course.attributes.category?.data?.attributes?.name ?? '';
            const instructorName = course.attributes.instructor?.data?.attributes?.full_name ?? '';
            const locationName = course.attributes.center?.data?.attributes?.name ?? '';
            const thumbnail = course.attributes.thumbnail || '/logo.svg';

            const locked = courseIsLocked(course);

            return (
              <StudentCourseCard
                key={course.id}
                image={thumbnail}
                title={course.attributes.title}
                instructor={instructorName}
                location={locationName}
                subTitle={course.attributes.sub_title ?? ''}
                lectures={course.attributes.stats?.lectures ?? 0}
                exams={course.attributes.stats?.exams ?? 0}
                progress={getCourseProgress(course)}
                typeLabel={categoryName}
                statusLabel={String(course.attributes.status)}
                statusCode={course.attributes.status}
                locked={locked}
                onView={locked ? undefined : () => goToCourse(course.id)}
                onActivate={() => handleActivateCourse(course.id)}
              />
            );
          })}
      </div>
    </div>
  );
}
