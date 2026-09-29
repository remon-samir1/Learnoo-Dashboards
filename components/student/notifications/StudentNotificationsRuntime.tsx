"use client";

/**
 * Mount point for the student notification runtime (polling, realtime refetch and browser
 * notifications). Rendered once, inside the authenticated branch of `StudentLayoutShell`,
 * so nothing polls before the student is signed in. Renders no UI.
 */

import { useStudentNotificationsRuntime } from "@/src/hooks/useStudentNotifications";
import type { StudentNotification } from "@/src/types/student-notification";

export default function StudentNotificationsRuntime({
  initialNotifications,
}: {
  initialNotifications: StudentNotification[];
}) {
  useStudentNotificationsRuntime(initialNotifications);

  return null;
}
