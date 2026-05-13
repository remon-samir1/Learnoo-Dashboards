import { notFound } from "next/navigation";
import LiveSessionRoomClient from "@/components/student/live-sessions/LiveSessionRoomClient";
import { getStudentLiveRoomById } from "@/src/services/student/live-room.service";
import { getStudentData } from "@/src/services/student/user.service";

type PageProps = {
  params: Promise<{
    locale: string;
    id: string;
  }>;
};

function displayNameFromMe(apiBody: unknown): string {
  if (!apiBody || typeof apiBody !== "object") return "";
  const root = apiBody as {
    data?: { attributes?: Record<string, unknown>; data?: { attributes?: Record<string, unknown> } };
  };
  const attrs =
    root?.data?.attributes ??
    root?.data?.data?.attributes;
  if (!attrs) return "";
  const full = attrs.full_name;
  if (typeof full === "string" && full.trim()) return full.trim();
  const first = attrs.first_name;
  const last = attrs.last_name;
  const a = typeof first === "string" ? first.trim() : "";
  const b = typeof last === "string" ? last.trim() : "";
  return [a, b].filter(Boolean).join(" ").trim();
}

export default async function StudentLiveSessionDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [roomRes, userRes] = await Promise.all([
    getStudentLiveRoomById(id),
    getStudentData(),
  ]);

  if (!roomRes.success || !roomRes.data) {
    notFound();
  }

  const fromApi =
    userRes &&
    typeof userRes === "object" &&
    "success" in userRes &&
    (userRes as { success: boolean }).success &&
    "data" in userRes
      ? displayNameFromMe((userRes as { data?: unknown }).data)
      : "";

  const studentName = fromApi.trim() || "Student";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <LiveSessionRoomClient room={roomRes.data} studentName={studentName} />
    </div>
  );
}
