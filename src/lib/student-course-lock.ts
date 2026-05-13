import type { Course } from '@/src/types';

/**
 * Student course card / details: locked only when the API sets `is_locked` to `true`.
 * If the field is absent or `false`, the course is treated as unlocked for lock UI.
 */
export function courseIsLocked(course: Course): boolean {
  return course.attributes.is_locked === true;
}
