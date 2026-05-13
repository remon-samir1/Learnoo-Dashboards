import getUserDataFromJWT from '@/lib/server.utils';
import type { Quiz } from '@/src/types';

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
  /** Set when the HTTP response was not OK (e.g. 403 activation / access). */
  httpStatus?: number;
}

/**
 * Fetch a single quiz/exam by ID (GET /v1/quiz/:id).
 * Server-side service for use in Server Components (student start-exam flow).
 */
export const getQuizById = async (id: number | string): Promise<ServiceResponse<Quiz>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/quiz/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? `HTTP ${res.status}`,
        httpStatus: res.status,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};
