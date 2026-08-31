"use client";

import Link from "next/link";
import { CalendarDays, Radio, Timer, Users, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  getCourseTitle,
  getInstructorDisplayName,
} from "@/src/lib/student-live-room";
import { useCountdown } from "@/src/hooks/useCountdown";

function LiveSessionCard({
  item,
  locale,
  t,
}: {
  item: StudentLiveRoom;
  locale: string;
  t: any;
}) {
  const attrs = item.attributes;

  const title = attrs?.title?.trim() || t("fallbackTitle");
  const instructor = getInstructorDisplayName(attrs) || t("unknownInstructor");
  const course = getCourseTitle(attrs) || t("unknownCourse");

  const formatDate = (date?: string | null) => {
    if (!date) return t("unknownTime");

    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(date));
  };

  const startedAt = formatDate(attrs?.started_at);

  const countdown = useCountdown(attrs?.started_at, {
    dayLabel: locale === "ar" ? "يوم" : "d",
  });

  const isLive = countdown.isPast && !!attrs?.started_at;
  const detailHref = `/${locale}/student/live-sessions/${item.id}`;

  return (
    <article
      key={item.id}
      className="group rounded-2xl border border-[var(--border-color)] bg-white p-3 sm:p-4 transition duration-300 hover:border-[var(--primary)] hover:shadow-md"
    >
      <Link href={detailHref} className="block">
        <h3 className="text-lg font-bold text-[var(--text-dark)] transition group-hover:text-[var(--primary)]">
          {title}
        </h3>
      </Link>

      <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
        <p className="flex items-center gap-2">
          <Users size={16} />
          {instructor}
        </p>

        <p className="flex items-center gap-2">
          <CalendarDays size={16} />
          {startedAt}
        </p>

        <p className="text-xs text-[var(--text-placeholder)]">
          {course}
        </p>
      </div>

      <Link
        href={detailHref}
        className={`mt-4 flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition shadow-sm ${
          isLive
            ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
            : "bg-[var(--primary)] text-white hover:opacity-90"
        }`}
      >
        {isLive ? (
          <>
            <Radio size={16} className="shrink-0 animate-spin" />
            <span>{locale === "ar" ? "مباشر الآن (انضم)" : "Live Now (Join)"}</span>
          </>
        ) : (
          <>
            <Timer size={16} className="shrink-0 animate-pulse" />
            <span className="font-mono tracking-wider">
              {countdown.isReady ? countdown.formatted : "--:--:--"}
            </span>
          </>
        )}
      </Link>
    </article>
  );
}

export default function UpcomingLiveClasses({
  sessions = [],
}: {
  sessions?: StudentLiveRoom[];
}) {
  const t = useTranslations("students.home.upcomingLive");
  const locale = useLocale();

  return (
    <section className="h-fit rounded-2xl border border-[var(--border-color)] bg-white px-4 py-5 shadow-sm sm:px-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)] sm:text-xl">
          {t("title")}
        </h2>

        <Link
          href={`/${locale}/student/live-sessions`}
          className="shrink-0 text-sm font-bold leading-6 text-primary transition duration-300 hover:text-primary-blue"
        >
          {t("viewAll")}
        </Link>
      </div>

      {!sessions.length ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-color)] bg-[#F7F8FA] p-6 text-center sm:min-h-[250px]">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-blue-50 text-[var(--primary)]">
            <Video size={26} />
          </div>

          <h3 className="text-lg font-bold text-[var(--text-dark)]">
            {t("emptyTitle")}
          </h3>

          <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((item) => (
            <LiveSessionCard
              key={item.id}
              item={item}
              locale={locale}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}