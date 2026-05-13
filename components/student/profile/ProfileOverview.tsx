import { useTranslations } from "next-intl";
import ProfileStatCard from "./ProfileStatCard";

type Props = {
  stats?: {
    notes_created?: number;
    downloads?: number;
    live_attendance?: number;
    community_posts?: number;
  };
};

export default function ProfileOverview({ stats }: Props) {
  const t = useTranslations("studentProfile");

  return (
    <section className="mt-5 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
      <h3 className="mb-5 text-base font-bold text-[var(--text-dark)]">
        {t("title")}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileStatCard
          value={stats?.notes_created ?? 0}
          label={t("notesCreated")}
          className="bg-blue-50 text-blue-700"
        />

        <ProfileStatCard
          value={stats?.downloads ?? 0}
          label={t("downloads")}
          className="bg-green-50 text-green-700"
        />

        <ProfileStatCard
          value={stats?.live_attendance ?? 0}
          label={t("liveAttendance")}
          className="bg-orange-50 text-orange-700"
        />

        <ProfileStatCard
          value={stats?.community_posts ?? 0}
          label={t("communityPosts")}
          className="bg-purple-50 text-purple-700"
        />
      </div>
    </section>
  );
}