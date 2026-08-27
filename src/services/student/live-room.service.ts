import getUserDataFromJWT from "@/lib/server.utils";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  extractLiveRoomsFromResponse,
} from "@/src/lib/student-live-room";

import type { PaginationMeta } from "@/src/types";

export type StudentLiveRoomServiceResult<T> = {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  message?: string;
};

const API_BASE = "https://api.learnoo.app/v1/live-room";

export async function getStudentLiveRooms(params?: { page?: number }): Promise<
  StudentLiveRoomServiceResult<StudentLiveRoom[]>
> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const url = new URL(API_BASE);
    if (params?.page) {
      url.searchParams.set("page", String(params.page));
    }

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          typeof data?.message === "string"
            ? data.message
            : "Failed to load live rooms",
      };
    }

    const rooms = extractLiveRoomsFromResponse(data);
    const meta = data?.meta as PaginationMeta | undefined;

    return { success: true, data: rooms, meta };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

export async function getStudentLiveRoomById(
  id: string,
): Promise<StudentLiveRoomServiceResult<StudentLiveRoom | null>> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: "Unauthorized" };
  }

  if (!id) {
    return { success: false, message: "Missing id" };
  }

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message:
          typeof data?.message === "string"
            ? data.message
            : "Failed to load live room",
      };
    }

    const raw = data?.data;
    let room: StudentLiveRoom | null = null;

    if (raw && typeof raw === "object" && !Array.isArray(raw) && "id" in raw) {
      room = raw as StudentLiveRoom;
    } else if (
      raw &&
      typeof raw === "object" &&
      (raw as { data?: StudentLiveRoom }).data
    ) {
      room = (raw as { data: StudentLiveRoom }).data ?? null;
    }

    return { success: true, data: room };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}
