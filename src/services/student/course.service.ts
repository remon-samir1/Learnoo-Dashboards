import getUserDataFromJWT from "@/lib/server.utils"
import type { Course } from "@/src/types"

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
 * Fetch all courses from the API
 * Server-side service for use in Server Components
 */
export const getCourses = async (): Promise<ServiceListResponse<Course>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  try {
    const res = await fetch(`https://api.learnoo.app/v1/course`, {
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
 * Fetch a single course by ID from the API
 * Server-side service for use in Server Components
 */
export const getCourseById = async (id: number | string): Promise<ServiceResponse<Course>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  try {
    const res = await fetch(`https://api.learnoo.app/v1/course/${id}`, {
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
