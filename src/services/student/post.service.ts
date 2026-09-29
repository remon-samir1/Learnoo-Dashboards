import getUserDataFromJWT from "@/lib/server.utils";
import { API_BASE_URL } from "@/src/lib/api";
import {
  isTopLevelPublishedCommunityPost,
  sortCommunityPostsNewestFirst,
} from "@/src/lib/student-community-posts";

export interface Post {
  id: number;
  attributes: {
    title: string;
    content: string;
    type: 'post' | 'question' | 'summary';
    status: 'draft' | 'published';
    course_id: number | null;
    /** Multi-course community posts carry the ids / inlined course objects. */
    course_ids?: (number | string)[];
    courses?: { id: string | number; attributes?: { title?: string } }[];
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    user?: {
      data: {
        attributes: {
          first_name?: string;
          last_name?: string;
          full_name?: string;
          role?: string;
        };
      };
    };
    comments_count?: number;
    reactions_count?: number;
    image_url?: string;
    tags?: string[];
  };
}

interface ServiceResponse<T> {
  success: boolean;
  data?: {
    data: T;
  };
  message?: string;
}

/**
 * Community posts for the student home section (Server Components only).
 *
 * `GET /v1/post` returns posts *and* replies — a comment is a post carrying a
 * parent reference, which is how `commentsApi.list` reads them — for every
 * course on the platform. The home section has to apply the same rules the
 * community page applies, so they live in `student-community-posts`: drop
 * replies, drop drafts, newest first. Scoping to the student's own courses is
 * left to the caller, which is the side that knows the enrolled course ids.
 */
export const getCommunityPosts = async (): Promise<ServiceResponse<Post[]>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`${API_BASE_URL}/v1/post`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: result.message || "Failed to fetch posts",
      };
    }

    // API response structure is { data: Post[] } and mixes posts with replies.
    const allPosts: Post[] = Array.isArray(result?.data) ? result.data : [];
    const topLevelPosts = allPosts.filter(isTopLevelPublishedCommunityPost);

    return {
      success: true,
      data: {
        data: sortCommunityPostsNewestFirst(topLevelPosts),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};