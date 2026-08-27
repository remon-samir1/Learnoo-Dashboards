"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Video,
  Clock,
  CheckCircle,
  Radio,
  CalendarDays,
  Loader2,
  Lock,
  ChevronLeft,
  ChevronRight,
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
import { useCourses, STUDENT_COURSES_LIST_PARAMS } from "@/src/hooks/useCourses";
import { courseIsLocked } from "@/src/lib/student-course-lock";
import { StudentCourseActivationModal } from "@/components/student/StudentCourseActivationModal";
import type { PaginationMeta } from "@/src/types";

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
    activateRoom: "تفعيل الجلسة",
    activateCourseFirst: "يجب تفعيل الدورة أولاً",
    lockedPrivate: "جلسة خاصة",
    prevPage: "السابق",
    nextPage: "التالي",
    pageOf: "صفحة {current} من {total}",
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
    activateRoom: "Activate Session",
    activateCourseFirst: "Activate Course First",
    lockedPrivate: "Private Session",
    prevPage: "Previous",
    nextPage: "Next",
    pageOf: "Page {current} of {total}",
  },
};

function formatDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function getLiveRoomCourseId(room: StudentLiveRoom): string | null {
  const cId = room.attributes?.course?.data?.id;
  if (cId != null && String(cId).trim() !== "") {
    return String(cId).trim();
  }
  const raw = room as Record<string, any>;
  const rawCId = raw.course?.data?.id;
  if (rawCId != null && String(rawCId).trim() !== "") {
    return String(rawCId).trim();
  }
  return null;
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
  accessState,
  onActivateRoom,
}: {
  room: StudentLiveRoom;
  locale: string;
  t: typeof labels.en;
  accessState: "available" | "locked_private" | "course_not_enrolled";
  onActivateRoom: (roomId: string, title: string) => void;
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

  const title = attrs?.title?.trim() || "—";

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${live && accessState === "available"
        ? "border-red-200 ring-1 ring-red-200"
        : "border-[var(--border-color)]"
        }`}
    >
      {/* Left — Icon + Info */}
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accessState !== "available"
            ? "bg-[#F1F5F9]"
            : live
              ? "bg-red-600"
              : ended
                ? "bg-[#F1F5F9]"
                : "bg-[var(--primary-light,#EEF2FF)]"
            }`}
        >
          {accessState !== "available" ? (
            <Lock size={22} className="text-[#94A3B8]" />
          ) : live ? (
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
            {accessState === "locked_private" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                <Lock size={10} />
                {t.lockedPrivate}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 truncate text-[15px] font-bold text-[var(--text-dark)]">
            {title}
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
      <div className="shrink-0 flex flex-col sm:flex-row gap-2">
        {accessState === "locked_private" ? (
          <button
            onClick={() => onActivateRoom(room.id, title)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1a2bb3] active:scale-95"
          >
            <Lock size={16} />
            {t.activateRoom}
          </button>
        ) : accessState === "course_not_enrolled" ? (
          <Link href={`/${locale}/student/courses`}>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-700 transition-all hover:bg-orange-100">
              <Lock size={16} />
              {t.activateCourseFirst}
            </button>
          </Link>
        ) : live ? (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-95">
              <Video size={16} />
              {t.join}
            </button>
          </Link>
        ) : ended && hasRecording ? (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--text-dark)] transition-all hover:bg-[#F8FAFC]">
              {t.watch}
            </button>
          </Link>
        ) : (
          <Link href={`/${locale}/student/live-sessions/${room.id}`}>
            <button className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-all hover:bg-[#F8FAFC]">
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
  const dir = locale === "ar" ? "rtl" : "ltr";
  const t = locale === "ar" ? labels.ar : labels.en;

  const [rooms, setRooms] = useState<StudentLiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);

  const [activationTarget, setActivationTarget] = useState<{ id: string; title: string } | null>(null);

  const { data: enrolledCourses, isLoading: loadingCourses } = useCourses(STUDENT_COURSES_LIST_PARAMS);

  const enrolledCourseIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (!enrolledCourses) return set;
    for (const course of enrolledCourses) {
      if (!courseIsLocked(course) && course?.id != null && String(course.id).trim() !== "") {
        set.add(String(course.id).trim());
      }
    }
    return set;
  }, [enrolledCourses]);

  const visibleCourseIds = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    if (!enrolledCourses) return set;
    for (const course of enrolledCourses) {
      if (course?.id != null && String(course.id).trim() !== "") {
        set.add(String(course.id).trim());
      }
    }
    return set;
  }, [enrolledCourses]);

  const fetchRooms = (pageNum: number) => {
    setLoading(true);
    getStudentLiveRooms({ page: pageNum }).then((res) => {
      if (res.success && res.data) {
        setRooms(res.data);
        if (res.meta) setPaginationMeta(res.meta);
      } else {
        setError(res.message || t.error);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRooms(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const visibleRooms = useMemo(() => {
    return rooms.filter((room) => {
      const cids = [getLiveRoomCourseId(room)].filter(Boolean) as string[];
      if (cids.length === 0) return true; // If no course, just show it
      return cids.some((cid) => visibleCourseIds.has(cid));
    });
  }, [rooms, visibleCourseIds]);

  const isDataLoading = loading || loadingCourses;

  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6"
      dir={dir}
    >
      <h1 className="mb-6 text-2xl font-bold text-[var(--text-dark)]">
        {t.title}
      </h1>

      {isDataLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#94A3B8]">
          <Loader2 className="size-10 animate-spin text-[var(--primary)]" />
          <p className="text-sm">{t.loading}</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : visibleRooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-white py-20 text-center">
          <Video className="size-12 text-[var(--primary)] opacity-50" />
          <p className="text-sm text-[var(--text-muted)]">{t.noSessions}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleRooms.map((room) => {
            const pub = String(room.attributes?.is_public ?? 'unknown');
            let accessState: "available" | "locked_private" | "course_not_enrolled" = "available";

            if (pub === "included") {
              const cId = getLiveRoomCourseId(room);
              if (cId && !enrolledCourseIds.has(cId)) {
                accessState = "course_not_enrolled";
              }
            } else if (pub === "false" || pub === "private") {
              const hasAct = room.attributes?.has_activation;
              // If it's private and has_activation is not explicitly true, it is locked.
              if (hasAct !== true) {
                accessState = "locked_private";
              }
            }

            return (
              <SessionCard
                key={room.id}
                room={room}
                locale={locale}
                t={t}
                accessState={accessState}
                onActivateRoom={(id, title) => setActivationTarget({ id, title })}
              />
            );
          })}
        </div>
      )}

      {/* Pagination controls */}
      {!isDataLoading && paginationMeta && paginationMeta.last_page > 1 ? (
        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] shadow-sm transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className={`size-4 shrink-0${dir === 'rtl' ? ' rotate-180' : ''}`} strokeWidth={2} />
            {t.prevPage}
          </button>

          <span className="text-sm text-[#64748B]">
            {t.pageOf.replace("{current}", String(paginationMeta.current_page)).replace("{total}", String(paginationMeta.last_page))}
          </span>

          <button
            type="button"
            disabled={page >= paginationMeta.last_page}
            onClick={() => setPage((p) => Math.min(paginationMeta.last_page, p + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#374151] shadow-sm transition hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.nextPage}
            <ChevronRight className={`size-4 shrink-0${dir === 'rtl' ? ' rotate-180' : ''}`} strokeWidth={2} />
          </button>
        </div>
      ) : null}

      <StudentCourseActivationModal
        open={activationTarget !== null}
        onClose={() => setActivationTarget(null)}
        courseId={activationTarget?.id ?? ''}
        courseTitle={activationTarget?.title}
        activationItemType="live_room"
        onActivated={() => {
          fetchRooms(page);
        }}
      />
    </div>
  );
}