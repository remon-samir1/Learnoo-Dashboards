import { redirect } from 'next/navigation';

export default async function CreateCourseExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/doctor/exams/create?course_id=${encodeURIComponent(id)}`);
}
