import { ExamResultsView } from '@/src/components/exams/ExamResultsView';

export default function DoctorExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamResultsView params={params} backHref="/doctor/exams" />;
}
