import EditProfileForm from "@/components/student/profile/EditProfileForm";
import { getUserProfileData } from "@/src/services/student/user.service";
import {
  getStudentCenterId,
  getStudentDepartmentId,
  getStudentFacultyId,
  getStudentUniversityId,
} from "@/src/lib/student-profile-completeness";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type ProfileAttributes = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  image?: string | null;
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

export default async function Page({ params }: PageProps) {
  const { locale } = await params;

  const t = await getTranslations("studentProfile");

  const response = await getUserProfileData();

  const student: ProfileAttributes | null =
    response?.success && response?.data?.data?.attributes
      ? response.data.data.attributes
      : null;

  const isArabic = locale === "ar";

  if (!response?.success) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
          {response?.message || "Failed to load profile data"}
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#FAFAF8] p-6">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/${locale}/student/profile`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] transition hover:text-[var(--primary)]"
        >
          {isArabic ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}

          <span>{t("backToProfile")}</span>
        </Link>

        <EditProfileForm
          defaultValues={{
            first_name: student?.first_name || "",
            last_name: student?.last_name || "",
            phone: student?.phone || "",
            email: student?.email || "",
            image: student?.image || "",
            university_id: getStudentUniversityId(student) ?? "",
            center_id: getStudentCenterId(student) ?? "",
            faculty_id: getStudentFacultyId(student) ?? "",
            department_id: getStudentDepartmentId(student) ?? "",
          }}
        />
      </div>
    </main>
  );
}
