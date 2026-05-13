import TakeExamRun from '@/components/student/exams/TakeExamRun';
import { sanitizeNumericCourseQueryParam } from '@/src/lib/student-start-exam-href';

interface TakeExamPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TakeExamPage({ params, searchParams }: TakeExamPageProps) {
  const { locale, id } = await params;
  const sp = (await searchParams) ?? {};
  const raw = sp.course;
  const courseRaw = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  const courseForStartRedirect = sanitizeNumericCourseQueryParam(courseRaw);
  return (
    <TakeExamRun
      locale={locale}
      quizId={id.trim()}
      courseIdForStartRedirect={courseForStartRedirect ?? undefined}
    />
  );
}
