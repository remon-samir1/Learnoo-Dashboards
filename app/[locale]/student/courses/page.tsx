'use client';

/**
 * Static UI only via `t()` / messages. Course titles, names, category, status, etc. come from the API as-is.
 */
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { StudentCourseActivationModal } from '@/components/student/StudentCourseActivationModal';
import { StudentCourseCard } from '@/components/student/StudentCourseCard';
import { CourseCardSkeleton } from '@/src/components/ui/Skeleton';
import { useCourses } from '@/src/hooks/useCourses';
import { useStudentCourseListActivation } from '@/src/hooks/useStudentCourseListActivation';
import { courseIsLocked } from '@/src/lib/student-course-lock';
import type { Course } from '@/src/types';

export default function StudentCoursesPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('courses');
  const { data: courses, isLoading, error, refetch } = useCourses();
  const activation = useStudentCourseListActivation();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const displayCourses = useMemo(() => courses ?? [], [courses]);

  function getCourseProgress(course: Course) {
    const lectures = course.attributes.stats?.lectures ?? 0;
    const exams = course.attributes.stats?.exams ?? 0;
    const base = lectures * 8 + exams * 5;
    return Math.min(98, Math.max(12, base || 35));
  }

  const resultsSummary = t('studentResultsCount', { count: displayCourses.length });

  const goToCourse = (courseId: string) => {
    router.push(`/${locale}/student/courses/course-details/${courseId}`);
  };

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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600">{resultsSummary}</p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 xl:gap-5">
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => <CourseCardSkeleton key={index} />)}

        {!isLoading && error && (
          <div className="col-span-full rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
            {t('view.error')}: {error}
          </div>
        )}

        {!isLoading && !error && displayCourses.length === 0 && (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white px-8 py-10 text-center text-sm text-slate-600">
            {t('noCourses')}
          </div>
        )}

        {!isLoading &&
          !error &&
          displayCourses.map((course) => {
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
                onActivate={
                  locked ? () => activation.openForCourse(course) : undefined
                }
              />
            );
          })}
      </div>

      <StudentCourseActivationModal
        open={activation.open}
        onClose={activation.close}
        courseId={activation.courseId}
        courseTitle={activation.courseTitle}
        onActivated={async () => {
          await refetch();
        }}
      />
    </div>
  );
}
