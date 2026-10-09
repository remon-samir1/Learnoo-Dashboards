import getUserDataFromJWT from "@/lib/server.utils";
import { API_BASE_URL } from "@/src/lib/api";

export interface Post {
  id: number;
  attributes: {
    title: string;
    content: string;
    type: 'post' | 'question' | 'summary';
    status: 'draft' | 'published';
    course_id: number | null;
    courses?: { data: { id: string | number; attributes: { title: string } }[] };
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

export const getLatestStudentPosts = async (enrolledCourseIds: Set<string>, limit: number = 5): Promise<ServiceResponse<Post[]>> => {
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

    const allPosts: Post[] = (result.data || []).map((post: Post) => ({
      ...post,
      attributes: { ...post.attributes, courses: {
        data: Array.isArray(post.attributes.courses) ? post.attributes.courses : post.attributes.courses?.data ?? [],
      } },
    }));
    const coursePosts = allPosts.filter((post: Post) => {
      const isTopLevel = post.attributes.parent_id == null || post.attributes.parent_id === 0;
      const isPublished = post.attributes.status === 'published';
      const courseId = post.attributes.course_id;
      const courseIds = [...(post.attributes.courses?.data ?? []).map(course => String(course.id)), ...(courseId ? [String(courseId)] : [])];
      return isTopLevel && isPublished && courseIds.some(id => enrolledCourseIds.has(id));
    });

    // Sort by created_at descending and limit
    const sortedPosts = coursePosts.sort((a, b) => {
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