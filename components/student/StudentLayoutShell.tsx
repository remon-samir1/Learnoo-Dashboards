"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar, { type NotificationItem } from "@/components/student/Navbar";
import Sidebar from "@/components/student/Sidebar";
import { StudentToaster } from "@/components/student/StudentToaster";
import type { CurrentUser } from "@/src/interfaces/current-user.interface";
import { useAuth } from "@/src/stores/authStore";

type StudentLayoutShellProps = {
  locale: string;
  isAcademicProfileComplete: boolean;
  currentUser: CurrentUser | null;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
};

export default function StudentLayoutShell({
  locale,
  isAcademicProfileComplete,
  currentUser,
  initialNotifications,
  children,
}: StudentLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isCompleteProfilePage = pathname?.includes("/student/complete-profile");

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!isAcademicProfileComplete && !isCompleteProfilePage) {
      router.replace(`/${locale}/student/complete-profile`);
    }
  }, [
    isAcademicProfileComplete,
    isCompleteProfilePage,
    isAuthenticated,
    isLoading,
    locale,
    router,
  ]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!isAcademicProfileComplete && !isCompleteProfilePage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (isCompleteProfilePage) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <main className="flex flex-1 items-center justify-center px-4 py-8">
          {children}
        </main>
        <StudentToaster />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentUser={currentUser} />

      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        <Navbar
          initialNotifications={initialNotifications}
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
