"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  Users,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  getCourseThumbnail,
  getCourseTitle,
  getInstructorDisplayName,
  hasRecording,
  isEnded,
  isLiveOrStarted,
  isUpcoming,
  normalizeLiveStatus,
} from "@/src/lib/student-live-room";

function formatSessionWhen(
  iso: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SessionMeta({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: ReactNode;
}) {
  return (
    <p className="flex min-w-0 items-start gap-2 text-xs text-[var(--text-muted)]">
      <Icon size={14} className="mt-0.5 shrink-0 text-[var(--primary)]" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function UpcomingCard({
  room,
  locale,
  t,
}: {
  room: StudentLiveRoom;
  locale: string;
  t: ReturnType<typeof useTranslations<"liveSessions">>;
}) {
  const attrs = room.attributes;
  const title = attrs?.title?.trim() || t("liveSession");
  const instructor =
    getInstructorDisplayName(attrs) || t("card.unknownInstructor");
  const course = getCourseTitle(attrs) || t("courseNotAvailable");
  const thumb = getCourseThumbnail(attrs);
  const when = formatSessionWhen(
    attrs?.started_at,
    locale,
    t("timeNotAvailable"),
  );
  const max = attrs?.max_students;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[var(--primary)]">
            <Video size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              {t("status.upcoming")}
            </span>
            <h3 className="mt-2 line-clamp-2 text-sm font-bold text-[var(--text-dark)] sm:text-[15px]">
              {title}
            </h3>
            <SessionMeta icon={Users}>{instructor}</SessionMeta>
            <SessionMeta icon={Calendar}>{when}</SessionMeta>
            <SessionMeta icon={Clock}>{course}</SessionMeta>
            {typeof max === "number" && max > 0 ? (
              <SessionMeta icon={Users}>
                {`${max} ${t("maxStudentsLabel")}`}
              </SessionMeta>
            ) : null}
          </div>
        </div>
        {thumb ? (
          <div className="hidden shrink-0 overflow-hidden rounded-xl border border-[var(--border-color)] sm:block sm:h-20 sm:w-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="" className="size-full object-cover" />
          </div>
        ) : null}
      </div>
      <div className="border-t border-[var(--border-color)] px-4 py-3 sm:px-5">
        <Link
          href={`/${locale}/student/live-sessions/${room.id}`}
          className="flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border-color)] bg-[#F8FAFC] text-sm font-semibold text-[var(--text-dark)] transition hover:bg-[#F1F5F9]"
        >
          {t("joinNow")}
        </Link>
      </div>
    </article>
  );
}

function RecordedCard({
  room,
  locale,
  t,
}: {
  room: StudentLiveRoom;
  locale: string;
  t: ReturnType<typeof useTranslations<"liveSessions">>;
}) {
  const attrs = room.attributes;
  const title = attrs?.title?.trim() || t("liveSession");
  const instructor =
    getInstructorDisplayName(attrs) || t("card.unknownInstructor");
  const when = formatSessionWhen(
    attrs?.started_at,
    locale,
    t("timeNotAvailable"),
  );
  const url =
    attrs?.recording_url?.trim() ||
    attrs?.playback_url?.trim() ||
    attrs?.video_url?.trim() ||
    "";

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-sm">
      <div className="relative aspect-video bg-[#0f172a]">
        <div className="absolute inset-0 flex items-center justify-center text-white/90">
          <Video className="size-12" />
        </div>
      </div>
      <div className="space-y-2 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-sm font-bold text-[var(--text-dark)]">
          {title}
        </h3>
        <p className="text-xs text-[var(--text-muted)]">{instructor}</p>
        <p className="text-xs text-[var(--text-placeholder)]">{when}</p>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white hover:opacity-90"
          >
            {t("watchRecording")}
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function LiveSessionsClient({
  success,
  message,
  rooms,
}: {
  success: boolean;
  message?: string;
  rooms: StudentLiveRoom[];
}) {
  const t = useTranslations("liveSessions");
  const locale = useLocale();

  const liveNow = rooms.filter((r) => isLiveOrStarted(r.attributes?.status));
  const upcoming = rooms.filter((r) => {
    if (isLiveOrStarted(r.attributes?.status)) return false;
    const s = normalizeLiveStatus(r.attributes?.status);
    return isUpcoming(r.attributes?.status) || s === "pending";
  });
  const recorded = rooms.filter(
    (r) => isEnded(r.attributes?.status) && hasRecording(r.attributes),
  );

  if (!success) {
    return (
      <div
        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800"
        role="alert"
      >
        <p className="font-semibold">{t("loadListError")}</p>
        {message ? <p className="mt-1 opacity-90">{message}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-8 sm:gap-10">
      <header>
        <h1 className="text-2xl font-bold text-[var(--text-dark)] sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)] sm:text-[15px]">
          {t("description")}
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="size-2 shrink-0 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <h2 className="text-lg font-bold text-[var(--text-dark)]">
            {t("liveNow")}
          </h2>
        </div>
        {!liveNow.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-white px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            {t("noLiveSessions")}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {liveNow.map((room) => {
              const attrs = room.attributes;
              const title = attrs?.title?.trim() || t("liveSession");
              const instructor =
                getInstructorDisplayName(attrs) || t("card.unknownInstructor");
              const course =
                getCourseTitle(attrs) || t("courseNotAvailable");
              const when = formatSessionWhen(
                attrs?.started_at,
                locale,
                t("timeNotAvailable"),
              );
              const max = attrs?.max_students;
              return (
                <div
                  key={room.id}
                  className="overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-700 p-5 text-white shadow-lg sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
                          {t("liveBadge")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-white/90">
                          <Users size={14} />
                          {typeof max === "number" && max > 0
                            ? `${max} ${t("maxStudentsLabel")}`
                            : t("watching")}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold leading-snug sm:text-2xl">
                        {title}
                      </h3>
                      <p className="text-sm text-white/90">{instructor}</p>
                      <p className="text-xs text-white/80">{course}</p>
                      <p className="flex items-center gap-2 text-xs text-white/85">
                        <Clock size={14} />
                        {when}
                      </p>
                    </div>
                    <Link
                      href={`/${locale}/student/live-sessions/${room.id}`}
                      className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-red-600 shadow-sm transition hover:bg-white/95 sm:self-start"
                    >
                      <Video size={18} />
                      {t("joinNow")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-dark)]">
          {t("upcomingSessions")}
        </h2>
        {!upcoming.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-white px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            {t("noUpcomingSessions")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcoming.map((room) => (
              <UpcomingCard key={room.id} room={room} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-dark)]">
          {t("recordedSessions")}
        </h2>
        {!recorded.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-white px-4 py-12 text-center text-sm text-[var(--text-muted)]">
            {t("noRecordedSessions")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recorded.map((room) => (
              <RecordedCard key={room.id} room={room} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
