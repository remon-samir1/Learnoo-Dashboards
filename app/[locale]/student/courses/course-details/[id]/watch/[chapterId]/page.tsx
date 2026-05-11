import ChapterWatchView from '@/components/student/ChapterWatchView';

interface PageProps {
  params: Promise<{
    locale: string;
    id: string;
    chapterId: string;
  }>;
}

export default async function WatchChapterPage({ params }: PageProps) {
  const { id, chapterId } = await params;
  return <ChapterWatchView courseId={id} chapterId={chapterId} />;
}
