import getUserDataFromJWT from "@/lib/server.utils"
import type { Chapter } from "@/src/types"

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

interface ServiceListResponse<T> {
  success: boolean;
  data?: {
    data: T[];
  };
  message?: string;
}

/**
 * Fetch all chapters from the API
 * Server-side service for use in Server Components
 */
export const getChapters = async (): Promise<ServiceListResponse<Chapter>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  try {
    const res = await fetch(`https://api.learnoo.app/v1/chapter`, {
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

/**
 * Fetch a single chapter by ID from the API
 * Server-side service for use in Server Components
 */
export const getChapterById = async (id: number | string): Promise<ServiceResponse<Chapter>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  try {
    const res = await fetch(`https://api.learnoo.app/v1/chapter/${id}`, {
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
