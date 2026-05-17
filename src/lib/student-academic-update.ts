import type { UpdateUserRequest } from "@/src/types";

export type StudentAcademicIds = {
  universityId: string;
  centerId: string;
  facultyId: string;
  departmentId?: string;
};

type AcademicUpdateBase = Pick<UpdateUserRequest, "first_name" | "last_name"> &
  Partial<
    Pick<
      UpdateUserRequest,
      "phone" | "email" | "password" | "device_name"
    >
  >;

/** JSON body for PUT /v1/auth/update — ids only, never display names. */
export function buildStudentAcademicUpdatePayload(
  ids: StudentAcademicIds,
  base: AcademicUpdateBase,
): UpdateUserRequest {
  return {
    ...base,
    first_name: base.first_name,
    last_name: base.last_name,
    university_id: ids.universityId,
    faculty_id: ids.facultyId,
    centers: [ids.centerId],
    center_id: ids.centerId,
    ...(ids.departmentId ? { department_id: ids.departmentId } : {}),
  };
}

export function appendStudentAcademicFormFields(
  formData: FormData,
  ids: StudentAcademicIds,
): void {
  formData.append("university_id", ids.universityId);
  formData.append("faculty_id", ids.facultyId);
  formData.append("center_id", ids.centerId);
  formData.append("centers[]", ids.centerId);

  if (ids.departmentId) {
    formData.append("department_id", ids.departmentId);
  }
}
