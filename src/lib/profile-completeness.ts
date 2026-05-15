import type { User } from '@/src/types';

/**
 * Check if a user's profile is complete with required academic information.
 * A profile is considered complete when the user has:
 * - university_id
 * - centers (non-empty array)
 * - faculty_id
 */
function hasPresentId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  const { university_id, centers, faculty_id } = user.attributes;

  const hasUniversity = hasPresentId(university_id);
  const hasFaculty = hasPresentId(faculty_id);
  const hasCenters =
    centers !== null &&
    centers !== undefined &&
    (Array.isArray(centers) ? centers.length > 0 : typeof centers === 'object');

  return hasUniversity && hasCenters && hasFaculty;
}

/** Ensure client auth state reflects onboarding choices if /me omits them briefly. */
export function mergeOnboardingSelection(
  user: User,
  selection: { universityId: string; centerId: string; facultyId: string }
): User {
  const university_id = Number(selection.universityId);
  const faculty_id = Number(selection.facultyId);
  const centerId = Number(selection.centerId);

  const existingCenters = user.attributes.centers;
  const centers =
    Array.isArray(existingCenters) && existingCenters.length > 0
      ? existingCenters
      : Number.isFinite(centerId)
        ? [centerId]
        : existingCenters;

  return {
    ...user,
    attributes: {
      ...user.attributes,
      university_id: Number.isFinite(university_id)
        ? university_id
        : user.attributes.university_id,
      faculty_id: Number.isFinite(faculty_id) ? faculty_id : user.attributes.faculty_id,
      centers,
    },
  };
}

/**
 * Get the missing profile fields for a user.
 * Returns an array of missing field names for display purposes.
 */
export function getMissingProfileFields(user: User | null): string[] {
  if (!user) return ['university', 'centers', 'faculty'];

  const missing: string[] = [];
  const { university_id, centers, faculty_id } = user.attributes;

  if (university_id === null || university_id === undefined) {
    missing.push('university');
  }

  if (centers === null || centers === undefined || !Array.isArray(centers) || centers.length === 0) {
    missing.push('centers');
  }

  if (faculty_id === null || faculty_id === undefined) {
    missing.push('faculty');
  }

  return missing;
}
