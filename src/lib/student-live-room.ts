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

export function getCourseTitles(
  attributes?: StudentLiveRoomAttributes | Record<string, any> | null,
): string[] {
  if (!attributes || typeof attributes !== "object") return [];

  const titles: string[] = [];

  // 1. Check attributes.courses array (e.g. [ { attributes: { title: "..." } }, ... ])
  const coursesRaw = (attributes as Record<string, any>).courses;
  const coursesList = Array.isArray(coursesRaw)
    ? coursesRaw
    : Array.isArray(coursesRaw?.data)
      ? coursesRaw.data
      : null;

  if (coursesList && coursesList.length > 0) {
    for (const c of coursesList) {
      if (!c || typeof c !== "object") continue;
      const t =
        c.attributes?.title ??
        c.title ??
        c.data?.attributes?.title ??
        c.data?.title;
      if (typeof t === "string" && t.trim() && !titles.includes(t.trim())) {
        titles.push(t.trim());
      }
    }
  }

  // 2. Check attributes.course (single course object)
  const singleCourse = (attributes as Record<string, any>).course;
  if (singleCourse && typeof singleCourse === "object") {
    const t =
      singleCourse.data?.attributes?.title ??
      singleCourse.attributes?.title ??
      singleCourse.data?.title ??
      singleCourse.title;
    if (typeof t === "string" && t.trim() && !titles.includes(t.trim())) {
      titles.push(t.trim());
    }
  }

  return titles;
}

export function getCourseTitle(
  attributes?: StudentLiveRoomAttributes | Record<string, any> | null,
  separator: string = "، ",
): string {
  const titles = getCourseTitles(attributes);
  return titles.join(separator);
}

export function getLiveRoomCourseIds(
  roomOrAttrs?: StudentLiveRoom | StudentLiveRoomAttributes | Record<string, any> | null,
): string[] {
  if (!roomOrAttrs || typeof roomOrAttrs !== "object") return [];

  const attrs = (roomOrAttrs as any).attributes || roomOrAttrs;
  const ids = new Set<string>();

  // 1. Check course_ids array
  if (Array.isArray(attrs.course_ids)) {
    for (const id of attrs.course_ids) {
      if (id != null && String(id).trim()) {
        ids.add(String(id).trim());
      }
    }
  }

  // 2. Check courses array
  const coursesList = Array.isArray(attrs.courses)
    ? attrs.courses
    : Array.isArray(attrs.courses?.data)
      ? attrs.courses.data
      : null;

  if (coursesList) {
    for (const c of coursesList) {
      const id = c?.id ?? c?.data?.id;
      if (id != null && String(id).trim()) {
        ids.add(String(id).trim());
      }
    }
  }

  // 3. Check single course
  const singleId = attrs.course?.data?.id ?? attrs.course?.id;
  if (singleId != null && String(singleId).trim()) {
    ids.add(String(singleId).trim());
  }

  return Array.from(ids);
}

export function getCourseThumbnail(
  attributes?: StudentLiveRoomAttributes | Record<string, any> | null,
): string | null {
  if (!attributes || typeof attributes !== "object") return null;

  const attrs = (attributes as any).attributes || attributes;

  // 1. Check single course thumbnail
  const single = attrs?.course?.data?.attributes ?? attrs?.course?.attributes ?? attrs?.course;
  const th = single?.thumbnail;
  if (typeof th === "string" && th.trim()) return th.trim();
  if (th && typeof th === "object" && "url" in th) {
    const url = (th as { url?: string }).url;
    if (typeof url === "string" && url.trim()) return url.trim();
  }

  // 2. Check courses array thumbnail
  const coursesList = Array.isArray(attrs.courses)
    ? attrs.courses
    : Array.isArray(attrs.courses?.data)
      ? attrs.courses.data
      : null;

  if (coursesList) {
    for (const c of coursesList) {
      const cAttrs = c?.attributes ?? c?.data?.attributes ?? c;
      const cTh = cAttrs?.thumbnail;
      if (typeof cTh === "string" && cTh.trim()) return cTh.trim();
      if (cTh && typeof cTh === "object" && "url" in cTh) {
        const url = (cTh as { url?: string }).url;
        if (typeof url === "string" && url.trim()) return url.trim();
      }
    }
  }

  return null;
}

