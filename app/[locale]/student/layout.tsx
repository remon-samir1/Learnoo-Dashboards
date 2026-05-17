import { StudentAuthStoreInit } from "@/components/student/StudentAuthStoreInit";
import StudentLayoutShell from "@/components/student/StudentLayoutShell";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getCurrentUser } from "@/src/services/auth/me.service";
import { getStudentNotifications, getUserProfileData } from "@/src/services/student/user.service";
import { isStudentAcademicProfileComplete } from "@/src/lib/student-profile-completeness";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learnoo-Dashboard",
};

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function StudentLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  const [notificationsResponse, userResponse, profileResponse] =
    await Promise.all([
      getStudentNotifications(),
      getCurrentUser(),
      getUserProfileData(),
    ]);

  const notifications = Array.isArray(notificationsResponse?.data)
    ? notificationsResponse.data
    : notificationsResponse?.data?.data || [];

  const currentUser =
    userResponse.success && userResponse.data ? userResponse.data : null;

  const profileAttributes =
    profileResponse?.success && profileResponse?.data?.data?.attributes
      ? profileResponse.data.data.attributes
      : null;

  const isAcademicProfileComplete =
    isStudentAcademicProfileComplete(profileAttributes);

  return (
    <ProtectedRoute requireProfileComplete={false}>
      <StudentAuthStoreInit />
      <StudentLayoutShell
        locale={locale}
        isAcademicProfileComplete={isAcademicProfileComplete}
        currentUser={currentUser}
        initialNotifications={notifications}
      >
        {children}
      </StudentLayoutShell>
    </ProtectedRoute>
  );
}
