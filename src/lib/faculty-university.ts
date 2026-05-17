/**
 * Student academic selection: University → Center → Faculty → Department
 *
 * Center: faculty.attributes.parent.data
 * Faculty: faculty item (faculty.attributes.parent_id === center id)
 * Department: faculty.attributes.childrens
 */

import type {
  AcademicSelectOption,
  Center,
  Department,
  FacultyForSelection,
} from "@/src/types/student-academic.types";

export type {
  AcademicSelectOption,
  Center,
  Department,
  FacultyForSelection,
} from "@/src/types/student-academic.types";

/** @deprecated Use FacultyForSelection */
export type FacultyForAcademicSelection = FacultyForSelection;

/** @deprecated Use Center attributes from student-academic.types */
export type FacultyParentCenterData = Center;
export type FacultyParentCenterAttributes = NonNullable<Center["attributes"]>;
export type FacultyParentRelation = FacultyForSelection["attributes"]["parent"];

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function idsMatch(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  const na = toFiniteNumber(a);
  const nb = toFiniteNumber(b);
  if (na === null || nb === null) {
    return false;
  }
  return na === nb;
}

function getCenterNode(faculty: FacultyForSelection): Center | null {
  const node = faculty.attributes.parent?.data;
  if (!node?.id) {
    return null;
  }
  return node;
}

function getCenterLabel(centerNode: Center): string | null {
  const name = centerNode.attributes?.name;
  if (typeof name !== "string") {
    return null;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getFacultyLabel(faculty: FacultyForSelection): string | null {
  const name = faculty.attributes.name;
  if (typeof name !== "string") {
    return null;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Center options for a university.
 * value: parent.data.id — label: parent.data.attributes.name only
 */
export function buildUniversityCenterOptions(
  faculties: FacultyForSelection[],
  universityId: string | number | null | undefined,
): AcademicSelectOption[] {
  if (
    universityId === null ||
    universityId === undefined ||
    universityId === ""
  ) {
    return [];
  }

  const byId = new Map<string, AcademicSelectOption>();

  for (const facultyItem of faculties) {
    const centerNode = getCenterNode(facultyItem);
    if (!centerNode) {
      continue;
    }

    if (!idsMatch(centerNode.attributes?.parent_id, universityId)) {
      continue;
    }

    const label = getCenterLabel(centerNode);
    if (!label) {
      continue;
    }

    const centerId = String(centerNode.id);
    if (!byId.has(centerId)) {
      byId.set(centerId, { id: centerId, label });
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

/**
 * Faculty options for a center.
 * value: faculty.id — label: faculty.attributes.name only
 */
export function buildCenterFacultyOptions(
  faculties: FacultyForSelection[],
  centerId: string | number | null | undefined,
): AcademicSelectOption[] {
  if (centerId === null || centerId === undefined || centerId === "") {
    return [];
  }

  const options: AcademicSelectOption[] = [];

  for (const facultyItem of faculties) {
    if (!idsMatch(facultyItem.attributes.parent_id, centerId)) {
      continue;
    }

    const label = getFacultyLabel(facultyItem);
    if (!label) {
      continue;
    }

    options.push({
      id: String(facultyItem.id),
      label,
    });
  }

  return options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export {
  buildFacultyDepartmentOptions,
  buildDepartmentOptionsFromFaculty,
  departmentBelongsToFaculty,
  facultyHasDepartments,
  getFacultyChildrens,
} from "@/src/lib/student-faculty-departments";

export function findFacultyById<T extends FacultyForSelection>(
  faculties: T[],
  facultyId: string | null | undefined,
): T | undefined {
  if (!facultyId) {
    return undefined;
  }
  return faculties.find((faculty) => String(faculty.id) === String(facultyId));
}

export function findCenterOptionById(
  centers: AcademicSelectOption[],
  centerId: string | null | undefined,
): AcademicSelectOption | undefined {
  if (!centerId) {
    return undefined;
  }
  return centers.find((center) => String(center.id) === String(centerId));
}

export function facultyBelongsToCenter(
  faculty: FacultyForSelection | null | undefined,
  centerId: string | number | null | undefined,
): boolean {
  if (!faculty) {
    return false;
  }
  return idsMatch(faculty.attributes.parent_id, centerId);
}

export function centerBelongsToUniversity(
  center: AcademicSelectOption | undefined,
  universityId: string | number | null | undefined,
  faculties: FacultyForSelection[],
): boolean {
  if (!center) {
    return false;
  }

  return faculties.some((facultyItem) => {
    const centerNode = getCenterNode(facultyItem);
    if (!centerNode) {
      return false;
    }
    return (
      idsMatch(centerNode.id, center.id) &&
      idsMatch(centerNode.attributes?.parent_id, universityId)
    );
  });
}

export function getFacultyCenterId(
  faculty: FacultyForSelection | null | undefined,
): string | null {
  if (!faculty) {
    return null;
  }

  const parentId = faculty.attributes.parent_id;
  if (parentId !== null && parentId !== undefined && parentId !== "") {
    return String(parentId);
  }

  const centerNode = faculty.attributes.parent?.data;
  if (centerNode?.id != null) {
    return String(centerNode.id);
  }

  return null;
}

export function inferCenterIdFromFaculty(
  faculties: FacultyForSelection[],
  facultyId: string | null | undefined,
): string | null {
  const faculty = findFacultyById(faculties, facultyId);
  return getFacultyCenterId(faculty);
}
