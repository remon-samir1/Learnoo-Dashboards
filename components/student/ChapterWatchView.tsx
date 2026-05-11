'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCourse } from '@/src/hooks/useCourses';
import { courseIsLocked } from '@/src/lib/student-course-lock';
import type { Chapter, Course } from '@/src/types';

function chapterExtras(ch: Chapter) {
  return ch.attributes as Chapter['attributes'] & { playlist?: string };
}

function findChapter(
  course: Course | null | undefined,
  chapterId: string
): { chapter: Chapter; lectureTitle: string } | null {
  if (!course?.attributes?.lectures?.length) return null;
  for (const lec of course.attributes.lectures) {
    for (const ch of lec.attributes.chapters ?? []) {
      if (String(ch.id) === chapterId) {
        return { chapter: ch, lectureTitle: lec.attributes.title };
      }
    }
  }
  return null;
}

export default function ChapterWatchView({
  courseId,
  chapterId,
}: {
  courseId: string;
  chapterId: string;
}) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const router = useRouter();
  const t = useTranslations('courses.studentDetails');

  const numericId = Number.parseInt(courseId, 10);
  const idValid = Number.isFinite(numericId) && numericId > 0;

  const { data: course, isLoading, error } = useCourse(numericId, {
    enabled: idValid,
  });

  const lockedCourse =
    !isLoading && course != null && courseIsLocked(course);

  useLayoutEffect(() => {
    if (!lockedCourse) return;
    router.replace(`/${locale}/student/courses`);
  }, [lockedCourse, router, locale]);

  const found = useMemo(
    () => findChapter(course ?? undefined, chapterId),
    [course, chapterId]
  );

  const videoSrc = useMemo(() => {
    if (!found) return '';
    const attrs = found.chapter.attributes;
    const extras = chapterExtras(found.chapter);
    const v = attrs.video?.trim();
    const p = extras.playlist?.trim();
    return v || p || '';
  }, [found]);

  const backHref = `/${locale}/student/courses/course-details/${courseId}`;

  if (!idValid) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8" dir={dir}>
        <p className="text-sm text-red-600">{t('invalidId')}</p>
        <Link href={backHref} className="mt-4 inline-flex text-sm font-medium text-[#2563EB]">
          {t('watchBack')}
        </Link>
      </div>
    );
  }

  if (lockedCourse) {
    return (
      <div
        className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
        dir={dir}
        aria-busy="true"
      >
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8" dir={dir}>
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#64748B] transition hover:text-[#0F172A]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" />
        {t('watchBack')}
      </Link>

      {isLoading && (
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-slate-200" />
      )}

      {!isLoading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
          {t('error')}: {error}
        </div>
      )}

      {!isLoading && !error && !found && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white px-8 py-12 text-center text-sm text-[#64748B]">
          {t('watchNotFound')}
        </div>
      )}

      {!isLoading && !error && found && (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] sm:text-2xl">
              {found.chapter.attributes.title}
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">{found.lectureTitle}</p>
          </div>

          {videoSrc ? (
            <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-black shadow-lg">
              <video
                key={videoSrc}
                src={videoSrc}
                controls
                playsInline
                className="aspect-video w-full object-contain"
                preload="metadata"
              >
                {t('watchNoVideo')}
              </video>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-8 py-12 text-center text-sm text-[#64748B]">
              {t('watchNoVideo')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
