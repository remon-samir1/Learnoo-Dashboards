import type {
  AcademicSelectOption,
  Department,
  FacultyForSelection,
} from "@/src/types/student-academic.types";

type FacultyAttributesWithChildren = FacultyForSelection["attributes"] & {
  /** Alternate key some payloads may use */
  children?: Department[] | null;
};

/** Departments/terms nested on a faculty JSON:API item. */
export function getFacultyChildrens(
  faculty: FacultyForSelection | null | undefined,
): Department[] {
  if (!faculty?.attributes) {
    return [];
  }

  const attributes = faculty.attributes as FacultyAttributesWithChildren;
  const raw = attributes.childrens ?? attributes.children;

  if (!raw || !Array.isArray(raw)) {
    return [];
  }

  return raw;
}

export function findFacultyInList(
  faculties: FacultyForSelection[],
  facultyId: string | number | null | undefined,
): FacultyForSelection | undefined {
  if (facultyId === null || facultyId === undefined || facultyId === "") {
    return undefined;
  }

  return faculties.find(
    (faculty) => String(faculty.id) === String(facultyId),
  );
}

/**
 * Build department/term options from a faculty's `attributes.childrens`.
 * value = department.id, label = department.attributes.name
 */
export function buildDepartmentOptionsFromFaculty(
  faculty: FacultyForSelection | null | undefined,
): AcademicSelectOption[] {
  const departments = getFacultyChildrens(faculty);
  const options: AcademicSelectOption[] = [];

  for (const department of departments) {
    if (department.id == null || department.id === "") {
      continue;
    }

    const name = department.attributes?.name;
    if (typeof name !== "string") {
      continue;
    }

    const label = name.trim();
    if (!label) {
      continue;
    }

    options.push({
      id: String(department.id),
      label,
    });
  }

  return options.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

export function buildFacultyDepartmentOptions(
  faculties: FacultyForSelection[],
  facultyId: string | number | null | undefined,
  facultyDetail?: FacultyForSelection | null,
): AcademicSelectOption[] {
  const faculty =
    facultyDetail ??
    findFacultyInList(faculties, facultyId);

  return buildDepartmentOptionsFromFaculty(faculty);
}

export function facultyHasDepartments(
  faculties: FacultyForSelection[],
  facultyId: string | null | undefined,
  facultyDetail?: FacultyForSelection | null,
): boolean {
  return (
    buildFacultyDepartmentOptions(faculties, facultyId, facultyDetail).length >
    0
  );
}

export function departmentBelongsToFaculty(
  faculties: FacultyForSelection[],
  departmentId: string | null | undefined,
  facultyId: string | null | undefined,
  facultyDetail?: FacultyForSelection | null,
): boolean {
  if (!departmentId || !facultyId) {
    return false;
  }

  return buildFacultyDepartmentOptions(
    faculties,
    facultyId,
    facultyDetail,
  ).some((option) => String(option.id) === String(departmentId));
}
