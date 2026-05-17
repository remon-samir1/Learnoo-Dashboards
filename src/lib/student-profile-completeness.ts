type CentersValue =
  | number[]
  | string[]
  | Array<{ data?: { id?: string | number | null } | null }>
  | null
  | undefined;

type AcademicProfileSource = {
  university_id?: unknown;
  faculty_id?: unknown;
  centers?: CentersValue;
  university?: {
    data?: {
      id?: string | number | null;
    } | null;
  } | null;
  faculty?: {
    data?: {
      id?: string | number | null;
      attributes?: {
        parent_id?: number | string | null;
        parent?: {
          data?: {
            id?: string | number | null;
          } | null;
        } | null;
      };
    } | null;
  } | null;
  department?: {
    data?: {
      id?: string | number | null;
      attributes?: {
        name?: string | null;
      };
    } | null;
  } | null;
};

function hasPresentId(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

export function getStudentUniversityId(
  profile: AcademicProfileSource | null | undefined,
): string | null {
  if (!profile) return null;

  if (hasPresentId(profile.university_id)) {
    return String(profile.university_id);
  }

  const relationId = profile.university?.data?.id;
  if (hasPresentId(relationId)) {
    return String(relationId);
  }

  return null;
}

export function getStudentFacultyId(
  profile: AcademicProfileSource | null | undefined,
): string | null {
  if (!profile) return null;

  if (hasPresentId(profile.faculty_id)) {
    return String(profile.faculty_id);
  }

  const relationId = profile.faculty?.data?.id;
  if (hasPresentId(relationId)) {
    return String(relationId);
  }

  return null;
}

export function getStudentCenterId(
  profile: AcademicProfileSource | null | undefined,
): string | null {
  if (!profile) return null;

  const centers = profile.centers;
  if (Array.isArray(centers) && centers.length > 0) {
    const first = centers[0];
    if (typeof first === "number" || typeof first === "string") {
      return String(first);
    }
    if (
      first &&
      typeof first === "object" &&
      "data" in first &&
      first.data?.id != null
    ) {
      return String(first.data.id);
    }
  }

  const facultyAttrs = profile.faculty?.data?.attributes;
  if (facultyAttrs && hasPresentId(facultyAttrs.parent_id)) {
    return String(facultyAttrs.parent_id);
  }

  const parentCenterId = facultyAttrs?.parent?.data?.id;
  if (hasPresentId(parentCenterId)) {
    return String(parentCenterId);
  }

  return null;
}

export function getStudentDepartmentId(
  profile: AcademicProfileSource | null | undefined,
): string | null {
  if (!profile) return null;

  const relationId = profile.department?.data?.id;
  if (hasPresentId(relationId)) {
    return String(relationId);
  }

  return null;
}

/** Student dashboard guard: university, center, and faculty. */
export function isStudentAcademicProfileComplete(
  profile: AcademicProfileSource | null | undefined,
): boolean {
  return (
    getStudentUniversityId(profile) !== null &&
    getStudentCenterId(profile) !== null &&
    getStudentFacultyId(profile) !== null
  );
}
