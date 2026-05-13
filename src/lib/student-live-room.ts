import type {
  StudentLiveRoom,
  StudentLiveRoomAttributes,
  StudentLiveRoomListResponse,
} from "@/src/interfaces/student-live-room.interface";

export function extractLiveRoomsFromResponse(
  payload: unknown,
): StudentLiveRoom[] {
  if (!payload || typeof payload !== "object") return [];

  const root = payload as StudentLiveRoomListResponse;
  const raw = root?.data;

  if (Array.isArray(raw)) {
    return raw.filter((item) => item && typeof item === "object" && item.id);
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const nested = (raw as { data?: unknown }).data;
    if (Array.isArray(nested)) {
      return nested.filter(
        (item) => item && typeof item === "object" && (item as StudentLiveRoom).id,
      ) as StudentLiveRoom[];
    }
    const single = raw as StudentLiveRoom;
    if (single?.id) return [single];
  }

  return [];
}

export function normalizeLiveStatus(status?: string | null): string {
  return (status ?? "").toLowerCase().trim();
}

export function isLiveOrStarted(status?: string | null): boolean {
  const s = normalizeLiveStatus(status);
  return s === "live" || s === "started";
}

export function isUpcoming(status?: string | null): boolean {
  return normalizeLiveStatus(status) === "upcoming";
}

export function isEnded(status?: string | null): boolean {
  const s = normalizeLiveStatus(status);
  return s === "ended" || s === "completed" || s === "finished";
}

export function getHostPeerId(
  attributes?: StudentLiveRoomAttributes | null,
): string | null {
  if (!attributes || typeof attributes !== "object") return null;

  const direct =
    attributes.host_peer_id ??
    attributes.instructor_peer_id ??
    attributes.peer_id ??
    attributes.live_peer_id;

  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const userPeer =
    attributes.user?.data?.attributes?.host_peer_id ??
    attributes.user?.data?.attributes?.peer_id;

  if (typeof userPeer === "string" && userPeer.trim()) return userPeer.trim();

  const extra = attributes as Record<string, unknown>;
  const keys = [
    "hostPeerId",
    "host_peer_session",
    "instructor_peer",
    "peer_session_id",
  ];

  for (const k of keys) {
    const v = extra[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }

  return null;
}

export function hasRecording(attributes?: StudentLiveRoomAttributes | null): boolean {
  if (!attributes) return false;
  const urls = [
    attributes.recording_url,
    attributes.playback_url,
    attributes.video_url,
  ];
  return urls.some((u) => typeof u === "string" && u.trim().length > 0);
}

export function getInstructorDisplayName(
  attributes?: StudentLiveRoomAttributes | null,
): string {
  const courseInstructor =
    attributes?.course?.data?.attributes?.instructor?.data?.attributes
      ?.full_name;
  if (typeof courseInstructor === "string" && courseInstructor.trim()) {
    return courseInstructor.trim();
  }
  const userName = attributes?.user?.data?.attributes?.full_name;
  if (typeof userName === "string" && userName.trim()) return userName.trim();
  return "";
}

export function getCourseTitle(attributes?: StudentLiveRoomAttributes | null): string {
  const t = attributes?.course?.data?.attributes?.title;
  return typeof t === "string" && t.trim() ? t.trim() : "";
}

export function getCourseThumbnail(
  attributes?: StudentLiveRoomAttributes | null,
): string | null {
  const th = attributes?.course?.data?.attributes?.thumbnail;
  if (typeof th === "string" && th.trim()) return th.trim();
  if (th && typeof th === "object" && "url" in th) {
    const url = (th as { url?: string }).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }
  return null;
}
