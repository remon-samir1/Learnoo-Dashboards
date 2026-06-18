"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar, { type NotificationItem } from "@/components/student/Navbar";
import Sidebar from "@/components/student/Sidebar";
import { StudentToaster } from "@/components/student/StudentToaster";
import type { CurrentUser } from "@/src/interfaces/current-user.interface";
import { useAuth } from "@/src/stores/authStore";
import Cookies from "@/lib/cookies";

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
  // Read once whether we should skip the profile gate (user_role === 'Student').
  let skipProfileGate = false;
  try {
    const roleCookie = Cookies.get('auth_flow');
    console.log(roleCookie);
    if (roleCookie && (roleCookie === 'login' || roleCookie.toLowerCase() === 'login')) {
      skipProfileGate = true;
    }
  } catch {}

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // If skipProfileGate is true (user_role cookie says 'Student'), do not
    // run the redirect to complete-profile. Otherwise keep the normal behavior.
    if (skipProfileGate) return;

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

  if (!isAcademicProfileComplete && !isCompleteProfilePage && !skipProfileGate) {
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
