import CompleteProfileForm from "@/components/student/profile/CompleteProfileForm";
import { getUserProfileData } from "@/src/services/student/user.service";
import {
  getStudentCenterId,
  getStudentDepartmentId,
  getStudentFacultyId,
  getStudentUniversityId,
  isStudentAcademicProfileComplete,
} from "@/src/lib/student-profile-completeness";
import { redirect } from "next/navigation";

type ProfileAttributes = {
  first_name?: string | null;
  last_name?: string | null;
  university_id?: unknown;
  faculty_id?: unknown;
  university?: {
    data?: {
      id?: string | number | null;
    } | null;
  } | null;
  faculty?: {
    data?: {
      id?: string | number | null;
    } | null;
  } | null;
};

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function StudentCompleteProfilePage({ params }: PageProps) {
  const { locale } = await params;
  const response = await getUserProfileData();

  if (!response?.success) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
        {response?.message || "Failed to load profile"}
      </div>
    );
  }

  const student: ProfileAttributes | null =
    response?.data?.data?.attributes ?? null;

  if (isStudentAcademicProfileComplete(student)) {
    redirect(`/${locale}/student`);
  }

  const firstName = student?.first_name?.trim() || "";
  const lastName = student?.last_name?.trim() || "";

  return (
    <CompleteProfileForm
      defaultUniversityId={getStudentUniversityId(student) ?? ""}
      defaultCenterId={getStudentCenterId(student) ?? ""}
      defaultFacultyId={getStudentFacultyId(student) ?? ""}
      defaultDepartmentId={getStudentDepartmentId(student) ?? ""}
      firstName={firstName}
      lastName={lastName}
    />
  );
}
