import { ExamResultsView } from '@/src/components/exams/ExamResultsView';

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ExamResultsView params={params} backHref="/exams" />;
}
