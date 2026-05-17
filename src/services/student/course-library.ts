import { api } from '@/src/lib/api';
import type { LibraryItem } from '@/src/types/student-library';

function parseCourseId(courseId: string | number): number | null {
  const parsed = typeof courseId === 'number' ? courseId : Number.parseInt(String(courseId), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/** Client-side: library materials for one course (`GET /v1/library?course_id=`). */
export async function getCourseLibrary(
  courseId: string | number,
): Promise<LibraryItem[]> {
  const id = parseCourseId(courseId);
  if (id === null) {
    return [];
  }

  const response = await api.libraries.list({ course_id: id });
  return (response.data ?? []) as LibraryItem[];
}
