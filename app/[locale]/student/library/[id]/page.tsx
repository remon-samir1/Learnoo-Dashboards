import StudentLibraryMaterialDetail from '@/components/student/library/StudentLibraryMaterialDetail';

interface StudentLibraryMaterialPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function StudentLibraryMaterialPage({ params }: StudentLibraryMaterialPageProps) {
  const { id } = await params;
  return <StudentLibraryMaterialDetail materialId={id} />;
}
