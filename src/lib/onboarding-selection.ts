import type { Center, Faculty } from '@/src/types';

export const REGISTRATION_ONBOARDING_KEY = 'registration_onboarding';

export function startRegistrationOnboarding(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(REGISTRATION_ONBOARDING_KEY, '1');
  }
}

export function clearRegistrationOnboarding(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(REGISTRATION_ONBOARDING_KEY);
  }
}

export function isRegistrationOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(REGISTRATION_ONBOARDING_KEY) === '1';
}

/** Center API uses a flat shape; university/faculty use JSON:API `attributes`. */export function getEntityName(item: {
  name?: string;
  attributes?: { name?: string };
}): string {
  return item.attributes?.name ?? item.name ?? '';
}

export function getCenterParentUniversityId(
  center: Center | null | undefined
): string | number | null {
  if (!center) return null;

  const fromRelation = center.parent?.data?.id;
  if (fromRelation != null) return fromRelation;

  const attrs = (center as Center & { attributes?: { parent_id?: number } }).attributes;
  if (attrs?.parent_id != null) return attrs.parent_id;

  if (center.parent_id != null) return center.parent_id;
  return null;
}

export function centerBelongsToUniversity(center: Center, universityId: string): boolean {
  const parentId = getCenterParentUniversityId(center);
  if (parentId == null) return false;
  return String(parentId) === String(universityId);
}

export function getFacultyParentCenterId(faculty: Faculty): string | null {
  return faculty.attributes.parent?.data?.id ?? null;
}

export function facultyBelongsToCenter(faculty: Faculty, centerId: string): boolean {
  const parentId = getFacultyParentCenterId(faculty);
  if (parentId == null) return false;
  return String(parentId) === String(centerId);
}
