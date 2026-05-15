import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { StartExamIntro } from '@/components/student/exams/StartExamIntro';
import {
  quizNeedsReactivationAfterExhaustedAttempts,
  quizStudentMustActivateOrReactivate,
} from '@/src/lib/student-quiz-activation-lock';
import {
  isLikelyQuizAccessDeniedError,
  sanitizeNumericCourseQueryParam,
} from '@/src/lib/student-start-exam-href';
import { getQuizById } from '@/src/services/student/quiz.service';
import type { Quiz } from '@/src/types';

interface StartExamPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type StartExamActivationReason = 'exam_first' | 'exam_reactivate' | 'exam_access_denied';

function quizAttrsForActivationPolicy(quiz: Quiz): Record<string, unknown> {
  const a = quiz.attributes as unknown as Record<string, unknown>;
  const top = quiz as unknown as Record<string, unknown>;
  return {
    ...a,
    remaining_attempts: a.remaining_attempts ?? top.remaining_attempts,
    current_attempts: a.current_attempts ?? top.current_attempts,
    max_attempts: a.max_attempts ?? top.max_attempts,
    maxAttempts: a.maxAttempts ?? top.maxAttempts,
    has_activation: a.has_activation ?? top.has_activation,
    is_public: a.is_public ?? top.is_public,
  };
}

function StartExamActivationPanel(props: {
  locale: string;
  examsHref: string;
  /** Course details URL with `tab=exams` so the student can use exam activation (not course-wide activation). */
  courseExamsHref: string | null;
  reason: StartExamActivationReason;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  const { locale, examsHref, courseExamsHref, reason, t } = props;
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const coursesHref = `/${locale}/student/courses`;
  const primaryHref = courseExamsHref ?? coursesHref;
  const primaryLabel = courseExamsHref ? t('goToCourseExams') : t('goToCourses');

  const titleKey =
    reason === 'exam_reactivate'
      ? 'examReactivationRequiredTitle'
      : reason === 'exam_access_denied'
        ? 'examAccessDeniedTitle'
        : 'examActivationRequiredTitle';
  const bodyKey =
    reason === 'exam_reactivate'
      ? 'examReactivationRequiredBody'
      : reason === 'exam_access_denied'
        ? 'examAccessDeniedBody'
        : 'examActivationRequiredBody';

  return (
    <div className="w-full pb-10 pt-2" dir={dir}>
      <div className="mx-auto max-w-[672px] rounded-xl border border-amber-200 bg-amber-50 px-5 py-6">
        <p className="text-base font-semibold text-amber-950">{t(titleKey)}</p>
        <p className="mt-2 text-sm text-amber-900/90">{t(bodyKey)}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href={primaryHref}
            className="inline-flex items-center justify-center rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3]"
          >
            {primaryLabel}
          </Link>
          <Link
            href={examsHref}
            className="inline-flex items-center justify-center rounded-xl border border-amber-300/80 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-100/80"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function StartExamPage({ params, searchParams }: StartExamPageProps) {
  const { locale, id } = await params;
  const sp = (await searchParams) ?? {};
  const rawCourseParam = sp.course;
  const courseQueryRaw =
    typeof rawCourseParam === 'string'
      ? rawCourseParam
      : Array.isArray(rawCourseParam)
        ? rawCourseParam[0]
        : '';
  const courseFromQuery = sanitizeNumericCourseQueryParam(courseQueryRaw);

  const t = await getTranslations({ locale, namespace: 'courses.studentStartExam' });

  const rawId = id?.trim() ?? '';
  const numeric = Number.parseInt(rawId, 10);
  const idValid = rawId.length > 0 && Number.isFinite(numeric);

  const examsHref = `/${locale}/student/exams`;

  if (!idValid) {
    return (
      <div className="w-full pb-10 pt-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-[672px]">
          <p className="text-sm font-medium text-red-700">{t('invalidId')}</p>
          <Link
            href={examsHref}
            className="mt-4 inline-flex text-sm font-semibold text-[#2D46D9] transition-colors hover:text-[#2438c4]"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    );
  }

  const result = await getQuizById(rawId);

  if (!result.success || !result.data?.data) {
    const msg = result.message ?? t('error');
    if (isLikelyQuizAccessDeniedError({ httpStatus: result.httpStatus, message: msg })) {
      const courseExamsHref = courseFromQuery
        ? `/${locale}/student/courses/course-details/${encodeURIComponent(courseFromQuery)}?tab=exams`
        : null;
      return (
        <StartExamActivationPanel
          locale={locale}
          examsHref={examsHref}
          courseExamsHref={courseExamsHref}
          reason="exam_access_denied"
          t={t}
        />
      );
    }
    return (
      <div className="w-full pb-10 pt-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="mx-auto max-w-[672px]">
          <p className="text-sm font-medium text-red-700">
            {t('error')}: {msg}
          </p>
          <Link
            href={examsHref}
            className="mt-4 inline-flex text-sm font-semibold text-[#2D46D9] transition-colors hover:text-[#2438c4]"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    );
  }

  const quiz = result.data.data as Quiz;
  const courseId = quiz.attributes.course_id;
  const backHref =
    courseId != null && String(courseId).trim() !== ''
      ? `/${locale}/student/courses/course-details/${courseId}`
      : examsHref;

  const policyAttrs = quizAttrsForActivationPolicy(quiz);
  if (quizStudentMustActivateOrReactivate(policyAttrs)) {
    const cid = quiz.attributes.course_id;
    const courseIdForLink =
      cid != null && String(cid).trim() !== '' ? String(cid) : courseFromQuery != null ? courseFromQuery : null;
    const courseExamsHref = courseIdForLink
      ? `/${locale}/student/courses/course-details/${encodeURIComponent(courseIdForLink)}?tab=exams`
      : null;
    const reason: StartExamActivationReason = quizNeedsReactivationAfterExhaustedAttempts(policyAttrs)
      ? 'exam_reactivate'
      : 'exam_first';

    return (
      <StartExamActivationPanel
        locale={locale}
        examsHref={examsHref}
        courseExamsHref={courseExamsHref}
        reason={reason}
        t={t}
      />
    );
  }

  return <StartExamIntro quiz={quiz} quizId={String(quiz.id)} backHref={backHref} />;
}
