import ExamResultView from '@/components/student/exams/ExamResultView';

interface ExamResultPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function ExamResultPage({ params }: ExamResultPageProps) {
  const { locale, id } = await params;
  return <ExamResultView locale={locale} quizId={id.trim()} />;
}
