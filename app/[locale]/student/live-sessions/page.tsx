"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Video,
  Clock,
  CheckCircle,
  Radio,
  CalendarDays,
  Loader2,
} from "lucide-react";
import {
  isLiveOrStarted,
  isUpcoming,
  isEnded,
  getCourseTitle,
  getInstructorDisplayName,
} from "@/src/lib/student-live-room";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import { getStudentLiveRooms } from "@/src/services/student/live-room.service";

const labels = {
  ar: {
    title: "الجلسات المباشرة",
    live: "مباشر الآن",
    upcoming: "قادم",
    ended: "انتهى",
    join: "انضم الآن",
    watch: "مشاهدة التسجيل",
    view: "عرض",
    noSessions: "لا توجد جلسات حالياً",
    loading: "جارٍ التحميل...",
    error: "فشل تحميل الجلسات",
    unknownInstructor: "غير معروف",
    noCourse: "بدون دورة",
  },
  en: {
    title: "Live Sessions",
    live: "Live Now",
    upcoming: "Upcoming",
    ended: "Ended",
    join: "Join Now",
    watch: "Watch Recording",
    view: "View",
    noSessions: "No sessions available",
    loading: "Loading...",
    error: "Failed to load sessions",
    unknownInstructor: "Unknown Instructor",
    noCourse: "No Course",
  },
};

function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function StatusBadge({
  room,
  t,
}: {
  room: StudentLiveRoom;
  t: typeof labels.en;
}) {
  const status = room.attributes?.status;
  if (isLiveOrStarted(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
        {t.live}
      </span>
    );
  }
  if (isUpcoming(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">
        <Clock size={11} />
        {t.upcoming}
      </span>
    );
  }
  if (isEnded(status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
        <CheckCircle size={11} />
        {t.ended}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-semibold text-[#64748B]">
      {status ?? "—"}
    </span>
  );
}

function SessionCard({
  room,
  locale,
  t,
}: {
  room: StudentLiveRoom;
  locale: string;
  t: typeof labels.en;
}) {
  const attrs = room.attributes;
  const status = attrs?.status;
  const live = isLiveOrStarted(status);
  const ended = isEnded(status);
  const instructor = getInstructorDisplayName(attrs) || t.unknownInstructor;
  const course = getCourseTitle(attrs) || t.noCourse;
  const whenLabel = formatDateTime(attrs?.started_at, locale);
  const hasRecording = !!(
    attrs?.recording_url ||
    attrs?.playback_url ||
    attrs?.video_url
  );

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${
        live
          ? "border-red-200 ring-1 ring-red-200"
          : "border-[var(--border-color)]"
      }`}
    >
      {/* Left — Icon + Info */}
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${
            live
              ? "bg-red-600"
              : ended
              ? "bg-[#F1F5F9]"
              : "bg-[var(--primary-light,#EEF2FF)]"
          }`}
        >
          {live ? (
            <Radio size={22} className="text-white" />
          ) : ended ? (
            <CheckCircle size={22} className="text-[#94A3B8]" />
          ) : (
            <CalendarDays size={22} className="text-[var(--primary)]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge room={room} t={t} />
          </div>
          <h2 className="mt-1.5 truncate text-[15px] font-bold text-[var(--text-dark)]">
            {attrs?.title?.trim() || "—"}
          </h2>
          <p className="mt-0.5 truncate text-sm text-[var(--text-muted)]">
            {instructor} · {course}
          </p>
          {whenLabel ? (
            <p className="mt-1 text-xs text-[var(--text-placeholder)]">
              {whenLabel}
            </p>
          ) : null}
        </div>
      </div>

      {/* Right — CTA */}
      <div className="shrink-0">
        {live ? (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-95">
              <Video size={16} />
              {t.join}
            </button>
          </Link>
        ) : ended && hasRecording ? (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--text-dark)] transition-all hover:bg-[#F8FAFC]">
              {t.watch}
            </button>
          </Link>
        ) : (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-all hover:bg-[#F8FAFC]">
              {t.view}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function StudentLiveSessionsPage() {
  const locale = useLocale();
  const t = locale === "ar" ? labels.ar : labels.en;

  const [rooms, setRooms] = useState<StudentLiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudentLiveRooms().then((res) => {
      if (res.success && res.data) {
        setRooms(res.data);
      } else {
        setError(res.message || t.error);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      {/* Page title */}
      <h1 className="mb-6 text-2xl font-bold text-[var(--text-dark)]">
        {t.title}
      </h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#94A3B8]">
          <Loader2 className="size-10 animate-spin text-[var(--primary)]" />
          <p className="text-sm">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-white py-20 text-center">
          <Video className="size-12 text-[var(--primary)] opacity-50" />
          <p className="text-sm text-[var(--text-muted)]">{t.noSessions}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rooms.map((room) => (
            <SessionCard key={room.id} room={room} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}