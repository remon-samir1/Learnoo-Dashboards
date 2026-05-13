import Navbar from "@/components/student/Navbar";
import Sidebar from "@/components/student/Sidebar";
import { StudentToaster } from "@/components/student/StudentToaster";
import { getCurrentUser } from "@/src/services/auth/me.service";
import { getStudentNotifications } from "@/src/services/student/user.service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learnoo-Dashboard",
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notificationsResponse, userResponse] = await Promise.all([
    getStudentNotifications(),
    getCurrentUser(),
  ]);

  const notifications = Array.isArray(notificationsResponse?.data)
    ? notificationsResponse.data
    : notificationsResponse?.data?.data || [];

  const currentUser =
    userResponse.success && userResponse.data ? userResponse.data : null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentUser={currentUser} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          initialNotifications={notifications}
          currentUser={currentUser}
        />

        <main className="min-w-0 flex-1 px-4 py-4 pb-6 sm:px-5 sm:py-5 lg:px-16 lg:py-5">
          {children}
        </main>
        <StudentToaster />
      </div>
    </div>
  );
}
