import type { Course } from '@/src/types';

/**
 * Matches student courses list: explicit `is_locked`, else inactive when `status !== 1`.
 */
export function courseIsLocked(course: Course): boolean {
  const a = course.attributes;
  if (typeof a.is_locked === 'boolean') return a.is_locked;
  return a.status !== 1;
}
