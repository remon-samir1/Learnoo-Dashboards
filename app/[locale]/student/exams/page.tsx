import StudentExamsHub from '@/components/student/exams/StudentExamsHub';

interface StudentExamsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function StudentExamsPage({ params }: StudentExamsPageProps) {
  const { locale } = await params;
  return <StudentExamsHub locale={locale} />;
}
