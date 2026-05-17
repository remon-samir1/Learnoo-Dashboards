import getUserDataFromJWT from '@/lib/server.utils';
import type { LibraryItem, LibraryResponse } from '@/src/types/student-library';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'https://api.learnoo.app').replace(/\/$/, '');

function parseCourseId(courseId: string | number): number | null {
  const parsed = typeof courseId === 'number' ? courseId : Number.parseInt(String(courseId), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

/** Server-side: library materials for one course (`GET /v1/library?course_id=`). */
export async function getCourseLibrary(courseId: string | number): Promise<{
  success: boolean;
  data?: LibraryResponse;
  message?: string;
}> {
  const id = parseCourseId(courseId);
  if (id === null) {
    return { success: false, message: 'Invalid course id' };
  }

  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    const res = await fetch(`${API_BASE}/v1/library?course_id=${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = (await res.json()) as LibraryResponse & { message?: string };

    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch library materials',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

export const getLibrary = async () => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`${API_BASE}/v1/library`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch library',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Request failed',
    };
  }
};
