import NotificationsClient from "@/components/student/notifications/NotificationsClient";

/**
 * The list itself comes from the shared notification store, which the student layout
 * seeds from the server and `StudentNotificationsRuntime` keeps fresh, so this page does
 * not refetch `GET /v1/notifications` on its own.
 *
 * The students' area deliberately does not use the shared `PlatformNotifications`
 * component the staff areas render: that one keeps its own local copy of the list, so
 * marking something read there would not update the navbar bell count, and it carries
 * neither the localized copy nor the opt-in browser notifications students asked for.
 * The notification destinations it resolves are shared through
 * `resolveStudentNotificationHref`, which delegates to the same `notificationHref` map.
 */
export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <NotificationsClient />
    </div>
  );
}
