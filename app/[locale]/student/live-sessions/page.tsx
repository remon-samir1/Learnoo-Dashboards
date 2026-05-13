import LiveSessionsClient from "@/components/student/live-sessions/LiveSessionsClient";
import { getStudentLiveRooms } from "@/src/services/student/live-room.service";

export default async function StudentLiveSessionsPage() {
  const res = await getStudentLiveRooms();
  const rooms = res.success ? res.data ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <LiveSessionsClient
        success={res.success}
        message={res.message}
        rooms={rooms}
      />
    </div>
  );
}
