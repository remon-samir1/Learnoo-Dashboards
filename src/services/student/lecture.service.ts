import getUserDataFromJWT from "@/lib/server.utils"
import type { Lecture } from "@/src/types"

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

/**
 * Fetch a single lecture by ID (for watch page lecture parts / chapter siblings).
 * Server-side service for use in Server Components
 */
export const getLectureById = async (id: number | string): Promise<ServiceResponse<Lecture>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  try {
    const res = await fetch(`https://api.learnoo.app/v1/lecture/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    })

    const data = await res.json();

    if (!res.ok) return {
      success: false,
      message: data.message
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message
    }
  }
}
