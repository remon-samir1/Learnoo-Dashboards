import getUserDataFromJWT from "@/lib/server.utils"
import type { CreateDiscussionRequest, Discussion } from "@/src/types"

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

/**
 * Create a chapter discussion / comment (POST /v1/discussion).
 * Server-side service for use in Server Components or route handlers.
 * `parent_id` is sent as JSON `null` when omitted or not available.
 */
export const createDiscussion = async (
  body: CreateDiscussionRequest
): Promise<ServiceResponse<Discussion>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token

  const payload = {
    chapter_id: body.chapter_id,
    type: body.type ?? "text",
    content: body.content,
    moment: body.moment ?? 0,
    parent_id: body.parent_id ?? null,
  }

  try {
    const res = await fetch(`https://api.learnoo.app/v1/discussion`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
