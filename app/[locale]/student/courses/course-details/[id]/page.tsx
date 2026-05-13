import { Suspense } from 'react';
import CourseDetailsView from '@/components/student/CourseDetailsView';

interface CourseDetailsPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

function CourseDetailsFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<CourseDetailsFallback />}>
      <CourseDetailsView courseId={id} />
    </Suspense>
  );
}
