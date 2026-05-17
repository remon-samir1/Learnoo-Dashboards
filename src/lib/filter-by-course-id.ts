/**
 * Scope list results by course without `course_id` query params.
 * The API reads query strings as strings; some endpoints type-hint `int` and error.
 */
export function filterListByCourseId<T>(
  items: T[],
  courseId: number | null,
  getCourseId: (item: T) => number | string | null | undefined,
): T[] {
  if (courseId === null || !Number.isFinite(courseId) || courseId <= 0) {
    return items;
  }

  return items.filter((item) => {
    const raw = getCourseId(item);
    if (raw == null) {
      return true;
    }
    return Number(raw) === courseId;
  });
}
