import getUserDataFromJWT from "@/lib/server.utils";

export interface Post {
  id: number;
  attributes: {
    title: string;
    content: string;
    type: 'post' | 'question' | 'summary';
    status: 'draft' | 'published';
    course_id: number | null;
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
 * Get latest posts that don't have a course_id (general community posts).
 * Server-side service for use in Server Components.
 */
export const getLatestGeneralPosts = async (limit: number = 5): Promise<ServiceResponse<Post[]>> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const res = await fetch(`https://api.learnoo.app/v1/post`, {
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

    // Filter posts that don't have a course_id and are published top-level posts
    // Note: API response structure is { data: Post[] }
    const allPosts: Post[] = result.data || [];
    const generalPosts = allPosts.filter((post: Post) => {
      const isTopLevel = post.attributes.parent_id == null || post.attributes.parent_id === 0;
      const isPublished = post.attributes.status === 'published';
      const courseId = post.attributes.course_id;
      // Consider it general if course_id is null, undefined, or 0
      const hasNoCourse = courseId == null || Number(courseId) === 0;
      return isTopLevel && isPublished && hasNoCourse;
    });

    // Sort by created_at descending and limit
    const sortedPosts = generalPosts.sort((a, b) => {
      return new Date(b.attributes.created_at).getTime() - new Date(a.attributes.created_at).getTime();
    });

    const limitedPosts = sortedPosts.slice(0, limit);

    return {
      success: true,
      data: {
        data: limitedPosts,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};