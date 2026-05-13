import getUserDataFromJWT from "@/lib/server.utils";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  extractLiveRoomsFromResponse,
} from "@/src/lib/student-live-room";

export type StudentLiveRoomServiceResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const API_BASE = "https://api.learnoo.app/v1/live-room";

export async function getStudentLiveRooms(): Promise<
  StudentLiveRoomServiceResult<StudentLiveRoom[]>
> {
  const userData = await getUserDataFromJWT();
  const token = userData?.token;

  if (!token) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const res = await fetch(API_BASE, {
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
    return { success: true, data: rooms };
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
