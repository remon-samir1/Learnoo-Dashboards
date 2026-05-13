import getUserDataFromJWT from "@/lib/server.utils";
import type { CurrentUser } from "@/src/interfaces/current-user.interface";

export type GetCurrentUserResult = {
  success: boolean;
  data?: CurrentUser | null;
  message?: string;
};

export async function getCurrentUser(): Promise<GetCurrentUserResult> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: "Unauthorized", data: null };
  }

  try {
    const res = await fetch("https://api.learnoo.app/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const body = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          typeof body?.message === "string"
            ? body.message
            : "Failed to load user",
        data: null,
      };
    }

    const dataNode = body?.data;
    const attrs =
      dataNode &&
      typeof dataNode === "object" &&
      "attributes" in dataNode &&
      dataNode.attributes &&
      typeof dataNode.attributes === "object"
        ? (dataNode.attributes as CurrentUser)
        : null;

    const topId =
      typeof dataNode === "object" &&
      dataNode &&
      "id" in dataNode &&
      typeof (dataNode as { id?: unknown }).id === "string"
        ? (dataNode as { id: string }).id
        : undefined;

    if (!attrs) {
      return { success: true, data: null };
    }

    const merged: CurrentUser = {
      ...attrs,
      id: attrs.id ?? topId ?? null,
    };

    return { success: true, data: merged };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
      data: null,
    };
  }
}
