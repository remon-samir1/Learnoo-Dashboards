// app/[locale]/student/notifications/page.tsx

import NotificationsClient from "@/components/student/notifications/NotificationsClient";
import { getStudentNotifications } from "@/src/services/student/user.service";

export default async function NotificationsPage() {
  const response = await getStudentNotifications();

  const notifications = Array.isArray(response?.data)
    ? response.data
    : response?.data?.data || [];

  return (<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><NotificationsClient initialNotifications={notifications} /></div>)
  ;
}
