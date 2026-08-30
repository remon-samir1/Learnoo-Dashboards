import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import { getLiveRoomCourseIds } from "@/src/lib/student-live-room";

export interface FacultyTreeCourseResult {
  allCourseIds: Set<string>;
  unlockedCourseIds: Set<string>;
}

/**
 * Traverses categories/departments recursively starting from the student's faculty
 * to collect all course IDs that appear in the student's faculty tree.
 */
export function extractFacultyTreeCourses(
  categories: any[],
  facultyId: string | number | null | undefined,
): FacultyTreeCourseResult {
  const allCourseIds = new Set<string>();
  const unlockedCourseIds = new Set<string>();

  if (!Array.isArray(categories) || !categories.length || !facultyId) {
    return { allCourseIds, unlockedCourseIds };
  }

  const fIdStr = String(facultyId).trim();
  const categoryMap = new Map<string, any>(
    categories.map((item) => [String(item.id), item]),
  );

  const facultyCategoryIds = new Set<string>();
  const queue: any[] = [];

  // 1. Root categories for this faculty
  for (const cat of categories) {
    const pId = cat.attributes?.parent_id ?? cat.parent_id;
    if (pId != null && String(pId).trim() === fIdStr) {
      facultyCategoryIds.add(String(cat.id));
      queue.push(cat);
    }
  }

  // 2. BFS traversal to collect all nested child categories
  while (queue.length > 0) {
    const current = queue.shift();
    const currentId = String(current.id);

    // Check direct children in 'childrens' or 'children' array
    const apiChildren = current.attributes?.childrens || current.attributes?.children || current.childrens || [];
    for (const child of apiChildren) {
      const childObj = categoryMap.get(String(child.id)) || child;
      const childId = String(childObj.id);
      if (!facultyCategoryIds.has(childId)) {
        facultyCategoryIds.add(childId);
        queue.push(childObj);
      }
    }

    // Check parent_id link in entire categories array
    for (const cat of categories) {
      const pId = cat.attributes?.parent_id ?? cat.parent_id;
      if (pId != null && String(pId).trim() === currentId && !facultyCategoryIds.has(String(cat.id))) {
        facultyCategoryIds.add(String(cat.id));
        queue.push(cat);
      }
    }
  }

  // 3. Collect all courses from all discovered categories under the faculty
  for (const catId of facultyCategoryIds) {
    const cat = categoryMap.get(catId);
    if (!cat) continue;

    const rawCourses = cat.attributes?.courses || cat.courses || [];
    const coursesList = Array.isArray(rawCourses)
      ? rawCourses
      : Array.isArray(rawCourses?.data)
        ? rawCourses.data
        : [];

    for (const c of coursesList) {
      if (!c) continue;
      const cId = c.id != null ? String(c.id).trim() : null;
      if (!cId) continue;

      allCourseIds.add(cId);

      const attrs = c.attributes || c;
      const isLocked = attrs.is_locked === true;
      if (!isLocked) {
        unlockedCourseIds.add(cId);
      }
    }
  }

  return { allCourseIds, unlockedCourseIds };
}

/**
 * Filters live rooms so that:
 * - General live sessions (no courses attached) are shown.
 * - Live sessions attached to courses are ONLY shown if at least one of their courses
 *   belongs to the student's faculty course tree.
 */
export function filterLiveRoomsByFacultyCourses(
  rooms: StudentLiveRoom[],
  facultyCourseIds: Set<string>,
  hasLoadedFacultyTree: boolean,
): StudentLiveRoom[] {
  if (!rooms || !rooms.length) return [];
  // If faculty tree is not loaded or has no courses, fallback to showing all returned rooms
  if (!hasLoadedFacultyTree || facultyCourseIds.size === 0) {
    return rooms;
  }

  return rooms.filter((room) => {
    const cids = getLiveRoomCourseIds(room);
    // General live session with no course attached -> show to all students
    if (cids.length === 0) return true;

    // Must belong to at least one course in the student's faculty tree
    return cids.some((cid) => facultyCourseIds.has(cid));
  });
}

export type LiveRoomAccessState = "available" | "locked_private" | "course_not_enrolled";

/**
 * Resolves the 3 access states for a student:
 * 1. 'available': Join Now (Public room, or Activated private room, or Included in an enrolled course).
 * 2. 'locked_private': Private session needing activation code.
 * 3. 'course_not_enrolled': Included session whose course has not been unlocked/enrolled yet.
 */
export function resolveLiveRoomAccessState(
  room: StudentLiveRoom,
  enrolledCourseIds: Set<string>,
): LiveRoomAccessState {
  const attrs = room.attributes;
  const pub = String(attrs?.is_public ?? "unknown").toLowerCase().trim();

  // Case 1: Included in course
  if (pub === "included") {
    const cIds = getLiveRoomCourseIds(room);
    if (cIds.length > 0) {
      const isEnrolled = cIds.some((cid) => enrolledCourseIds.has(cid));
      if (!isEnrolled) {
        return "course_not_enrolled";
      }
    }
    return "available";
  }

  // Case 2: Private room
  if (pub === "false" || pub === "private") {
    const hasActivation = attrs?.has_activation === true;
    if (!hasActivation) {
      return "locked_private";
    }
    return "available";
  }

  // Case 3: Public / General room
  return "available";
}
