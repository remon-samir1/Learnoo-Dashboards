import LiveSessionsClient from "@/components/student/live-sessions/LiveSessionsClient";
import { getStudentLiveSessions } from "@/src/services/student/user.service";

export default async function LiveSessionsPage() {
  const liveSessionsResponse = await getStudentLiveSessions();

  const liveSessions = liveSessionsResponse?.success
    ? Array.isArray(liveSessionsResponse.data)
      ? liveSessionsResponse.data
      : liveSessionsResponse.data?.data || []
    : [];

  console.log("LIVE SESSIONS FROM API:", liveSessions);

  return <LiveSessionsClient sessions={liveSessions} />;
}
