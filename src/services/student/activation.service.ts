import getUserDataFromJWT from "@/lib/server.utils"

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

/**
 * Activate course access with a redemption code (POST /v1/code/activate).
 * Server-side service for use in Server Components
 */
export const activateCourseCode = async (
  code: string,
  courseId: number | string
): Promise<ServiceResponse<unknown>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  const itemId =
    typeof courseId === "number"
      ? courseId
      : Number.parseInt(courseId, 10)

  try {
    const res = await fetch(`https://api.learnoo.app/v1/code/activate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        item_id: itemId,
        item_type: "course",
      }),
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
