// app/[locale]/student/notifications/page.tsx

import NotificationsClient from "@/components/student/notifications/NotificationsClient";

/**
 * The list itself comes from the shared notification store, which the student layout
 * seeds from the server and `StudentNotificationsRuntime` keeps fresh, so this page does
 * not refetch `GET /v1/notifications` on its own.
 */
export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NotificationsClient />
    </div>
  );
}
