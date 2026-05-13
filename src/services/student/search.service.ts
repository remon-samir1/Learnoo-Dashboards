import getUserDataFromJWT from "@/lib/server.utils";

export type SearchType =
  | "courses"
  | "chapters"
  | "libraries"
  | "users"
  | "posts"
  | "notes"
  | "quizzes";

export interface SearchItem {
  type: string;
  id: string;
  attributes: {
    title?: string;
    name?: string;
    description?: string;
    content?: string;
    status?: string;
    tags?: string[];
    created_at?: string;
    updated_at?: string;
  };
  links?: {
    self?: string;
  };
}

export interface SearchApiResponse {
  data: SearchItem[];
  meta: {
    query: string;
    type?: string;
    total: number;
    counts: Record<string, number>;
  };
}

export interface SearchParams {
  q: string;
  type?: SearchType;
  limit?: number;
}

export const globalSearch = async ({
  q,
  type,
  limit = 10,
}: SearchParams): Promise<{
  success: boolean;
  data?: SearchApiResponse;
  message?: string;
}> => {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  try {
    const params = new URLSearchParams({
      q,
      limit: String(limit),
    });

    if (type) params.append("type", type);

    const res = await fetch(
      `https://api.learnoo.app/v1/search?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || "Search failed",
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