import ProfileHeader from "@/components/student/profile/ProfileHeader";
import ProfileInfoCard from "@/components/student/profile/ProfileInfoCard";
import ProfileLinksCard from "@/components/student/profile/ProfileLinksCard";
import ProfileOverview from "@/components/student/profile/ProfileOverview";
import ProfileQrCard from "@/components/student/profile/ProfileQrCard";
import { getUserProfileData } from "@/src/services/student/user.service";
import { getTranslations } from "next-intl/server";

type ProfileAttributes = {
  student_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string | null;
  email?: string | null;
  joined?: string | null;
  image?: string | null;
  university?: {
    data?: {
      attributes?: {
        name?: string | null;
      };
    };
  };
  faculty?: {
    data?: {
      attributes?: {
        name?: string | null;
      };
    };
  };
  activity_stats?: {
    notes_created?: number;
    downloads?: number;
    live_attendance?: number;
    community_posts?: number;
  };
  device_access?: {
    device?: string | null;
    last_ip?: string | null;
  };
};

const getInitials = (name?: string | null) => {
  if (!name) return "ST";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

export default async function StudentProfilePage() {
  const t = await getTranslations("studentProfile");

  const response = await getUserProfileData();

  const student: ProfileAttributes | null =
    response?.success && response?.data?.data?.attributes
      ? response.data.data.attributes
      : null;

  const fullName = student?.full_name || "Student";
  const email = student?.email || "Not available";
  const phone = student?.phone || "Not available";
  const image = student?.image || "";

  const university =
    student?.university?.data?.attributes?.name || "Not available";
  const faculty = student?.faculty?.data?.attributes?.name || "Not available";
  const initials = getInitials(fullName);
  const stats = student?.activity_stats;

  if (!response?.success) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] p-6 ">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-600">
          {response?.message || "Failed to load profile data"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-6">
      <ProfileHeader title={t("title")} description={t("description")} />

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <ProfileInfoCard
          initials={initials}
          fullName={fullName}
          university={university}
          image={image}
          email={email}
          phone={phone}
          faculty={faculty}
          status={student?.status || "Unknown"}
          device={`${student?.device_access?.device || "Unknown"} - ${
            student?.device_access?.last_ip || "Unknown IP"
          }`}
        />

        <div className="space-y-5">
          <ProfileQrCard
            student={{
              id: student?.student_id || "",
              fullName,
              email,
              phone,
              university,
              faculty,
              status: student?.status || "Unknown",
            }}
          />
          {/* <ProfileLinksCard /> */}
        </div>
      </section>

      <ProfileOverview stats={stats} />
    </main>
  );
}
