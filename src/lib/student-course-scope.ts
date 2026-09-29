/**
 * Scoping student lists (community posts, exams, electronic library) to the
 * courses the student is actually enrolled in / has activated.
 *
 * The API is inconsistent about how it names the owning course(s) of a row:
 * `course_id`, `course_ids`, `courses_ids`, a `courses` relation (plain array
 * or JSON:API `{ data: [...] }`), a single `course` relation, or — for exams
 * created on a chapter — only the nested `chapter`. Every student list has to
 * read all of them, so the reader lives here instead of being re-implemented
 * per screen.
 */

function asStringId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    const n = String(Math.trunc(value));
    return n === '0' ? null : n;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === '0') return null;
    return trimmed;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function collectId(value: unknown, out: Set<string>): void {
  if (value == null) return;

  if (Array.isArray(value)) {
    for (const item of value) collectId(item, out);
    return;
  }

  if (isRecord(value)) {
    // JSON:API relation: `{ data: {...} }` / `{ data: [...] }`
    if (value.data != null) {
      collectId(value.data, out);
      return;
    }
    const id = asStringId(value.id);
    if (id != null) out.add(id);
    return;
  }

  if (typeof value === 'string' && value.includes(',')) {
    for (const part of value.split(',')) collectId(part.trim(), out);
    return;
  }

  const id = asStringId(value);
  if (id != null) out.add(id);
}

/**
 * Every course id an API row belongs to, normalised to strings.
 * Reads `course_ids` / `courses_ids` / `courses` / `course_id` / `course`,
 * then falls back to the owning course of a nested `chapter`.
 */
export function readRecordCourseIds(
  attrs: Record<string, unknown> | null | undefined,
): string[] {
  if (!attrs) return [];
  const out = new Set<string>();

  collectId(attrs.course_ids, out);
  collectId(attrs.courses_ids, out);
  collectId(attrs.courses, out);
  collectId(attrs.course_id, out);
  collectId(attrs.course, out);

  if (out.size === 0) {
    // Chapter-scoped rows (e.g. an exam created on a chapter) only carry the
    // course through the chapter relation.
    const chapter = attrs.chapter;
    const chapterData = isRecord(chapter)
      ? (isRecord(chapter.data) ? chapter.data : chapter)
      : null;
    const chapterAttrs = isRecord(chapterData?.attributes)
      ? (chapterData!.attributes as Record<string, unknown>)
      : chapterData;
    if (chapterAttrs) {
      collectId(chapterAttrs.course_id, out);
      collectId(chapterAttrs.course, out);
    }
  }

  return Array.from(out);
}

/** Same reader, for a JSON:API row where the fields may sit on the root too. */
export function readRowCourseIds(row: unknown): string[] {
  if (!isRecord(row)) return [];
  const attrs = isRecord(row.attributes) ? row.attributes : {};
  return readRecordCourseIds({ ...row, ...attrs });
}

/**
 * A row is in scope when it names at least one course the student has.
 * Rows without any course are out of scope: they belong to the platform at
 * large (other universities / other courses), not to this student.
 */
export function isWithinStudentCourses(
  courseIds: readonly string[],
  enrolledCourseIds: ReadonlySet<string>,
): boolean {
  if (courseIds.length === 0) return false;
  for (const id of courseIds) {
    if (enrolledCourseIds.has(id)) return true;
  }
  return false;
}

/** Enrolled-course id set from a course list (`GET /v1/course`). */
export function studentCourseIdSet(courses: unknown): Set<string> {
  const set = new Set<string>();
  if (!Array.isArray(courses)) return set;
  for (const course of courses) {
    if (!isRecord(course)) continue;
    const id = asStringId(course.id);
    if (id != null) set.add(id);
  }
  return set;
}

/** `id -> title` for resolving the course name shown on a row. */
export function studentCourseTitleMap(courses: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(courses)) return map;
  for (const course of courses) {
    if (!isRecord(course)) continue;
    const id = asStringId(course.id);
    if (id == null) continue;
    const attrs = isRecord(course.attributes) ? course.attributes : course;
    const title = attrs.title ?? attrs.name;
    if (typeof title === 'string' && title.trim()) map[id] = title.trim();
  }
  return map;
}
