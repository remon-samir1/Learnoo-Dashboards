import ChapterWatchView from '@/components/student/ChapterWatchView';
import { getChapterById } from '@/src/services/student/chapter.service';
import { getLectureById } from '@/src/services/student/lecture.service';
import type { Chapter, Lecture } from '@/src/types';

interface WatchChapterPageProps {
  params: Promise<{
    locale: string;
    chapterId: string;
  }>;
}

function chapterFromServiceResponse(
  res: Awaited<ReturnType<typeof getChapterById>>
): { chapter: Chapter | null; loadError: string | null } {
  if (!res.success) {
    return { chapter: null, loadError: res.message ?? 'Failed to load chapter' };
  }
  const payload = res.data as { data?: Chapter } | undefined;
  const entity = payload?.data;
  if (!entity) {
    return { chapter: null, loadError: 'Chapter not found' };
  }
  return { chapter: entity, loadError: null };
}

function lectureFromServiceResponse(
  res: Awaited<ReturnType<typeof getLectureById>>
): Lecture | null {
  if (!res.success) return null;
  const payload = res.data as { data?: Lecture } | undefined;
  return payload?.data ?? null;
}

export default async function WatchChapterPage({ params }: WatchChapterPageProps) {
  const { chapterId } = await params;
  const result = await getChapterById(chapterId);
  const { chapter, loadError } = chapterFromServiceResponse(result);

  let lectureChapters: Chapter[] = [];
  let lectureTitle = '';

  if (chapter?.attributes?.lecture_id != null) {
    const lecRes = await getLectureById(chapter.attributes.lecture_id);
    const lecture = lectureFromServiceResponse(lecRes);
    if (lecture?.attributes) {
      lectureTitle = lecture.attributes.title?.trim() ?? '';
      lectureChapters = lecture.attributes.chapters ?? [];
    }
  }

  const watchAccessDenied =
    chapter != null && chapter.attributes.can_watch === false;

  return (
    <ChapterWatchView
      chapterId={chapterId}
      chapter={chapter}
      loadError={loadError}
      lectureChapters={lectureChapters}
      lectureTitle={lectureTitle}
      watchAccessDenied={watchAccessDenied}
    />
  );
}
