"use client";

import Link from "next/link";
import { Lock, Play } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { HlsVideoPlayer } from "@/components/student/watch/HlsVideoPlayer";
import { IUserProgress } from "@/src/interfaces/progress.interface";
import { useEffect, useState } from "react";
import { getCourseById } from "@/src/services/student/course.service";
import { ICourse } from "@/src/interfaces/courses.interface";

export default function ContinueWatchingSection({
  progress,
}: {
  progress?: IUserProgress[] | null;
}) {
  const [courseDetails, setCourseDetails] = useState<ICourse | null>(null);

  const t = useTranslations("students.home.continueWatching");
  const locale = useLocale();

  const list = Array.isArray(progress) ? progress : [];
  const latest = list[0];
  const lastChapter = latest?.attributes?.chapter?.data?.attributes;
  const chapterProgressId = latest?.attributes?.chapter?.data?.id;

  const courseId = lastChapter?.course_id;

  useEffect(() => {
    if (courseId == null) return;

    const getCourse = async () => {
      const res = await getCourseById(courseId);
      const course = res?.data?.data ?? res?.data ?? null;
      setCourseDetails(course as ICourse | null);
    };

    getCourse();
  }, [courseId]);

  if (!latest?.attributes || !lastChapter) {
    return null;
  }

  const userProgress = latest.attributes;

  const durationToSeconds = (duration?: string) => {
    if (!duration) return 0;

    const parts = duration.split(":").map(Number);

    if (parts.length === 2) {
      const [minutes = 0, seconds = 0] = parts;
      return minutes * 60 + seconds;
    }

    if (parts.length === 3) {
      const [hours = 0, minutes = 0, seconds = 0] = parts;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
  };

  const formatSeconds = (seconds = 0) => {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const watchedSeconds = userProgress?.progress_seconds ?? 0;
  const totalSeconds = durationToSeconds(lastChapter?.duration);

  const progressPercent = totalSeconds
    ? Math.min((watchedSeconds / totalSeconds) * 100, 100)
    : 0;

  const videoSrc = lastChapter.video ?? "";
  // `video_ready` covers both real HLS and the temporary original-file
  // fallback (see ChapterResource on the backend) — requiring
  // video_status === "ready" on top of it would block resuming a lesson
  // that's watchable right now via the fallback stream.
  const canContinue =
    lastChapter.watch_access_state === "available" &&
    lastChapter.video_ready &&
    Boolean(videoSrc) &&
    chapterProgressId != null;
  const watchHref = canContinue
    ? `/${locale}/student/courses/watch/${chapterProgressId}`
    : null;
  const unavailableMessage =
    lastChapter.watch_access_state === "activation_required"
      ? t("activationRequired")
      : lastChapter.watch_access_state === "view_limit_reached"
        ? t("viewLimitReached")
        : t("notPublished");
  const UnavailableIcon = Lock;

  return (
    <section className="rounded-2xl  border border-[var(--border-color)] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-bold text-[var(--text-dark)]">
          {t("title")}
        </h2>

        <Link
          href={`/${locale}/student/courses`}
          className="text-sm font-bold leading-6 text-primary transition duration-300 hover:text-primary-blue sm:shrink-0"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-[#F7F8FA] p-3 sm:p-4 lg:grid lg:grid-cols-4 lg:items-center lg:gap-4">
        <div className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-black lg:col-span-1">
          <div className="relative aspect-video w-full max-h-[40vh] sm:max-h-[20rem] lg:max-h-none">
            {watchHref ? (
              <HlsVideoPlayer
                className="absolute inset-0 h-full w-full object-cover"
                src={videoSrc}
                controls={false}
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800 px-4 text-center text-xs font-medium text-white/80">
                <UnavailableIcon className="size-6" aria-hidden />
                <span>{unavailableMessage}</span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md sm:bottom-3 sm:left-3 sm:px-3">
              {lastChapter.duration}
            </div>

            {watchHref ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-3 shadow-lg transition duration-300 active:scale-95 sm:hover:scale-105">
                <Link
                  href={watchHref}
                  className="flex items-center justify-center"
                  aria-label={t("continue")}
                >
                  <Play
                    size={24}
                    fill="currentColor"
                    className="ms-0.5 text-[var(--primary)] rtl:ms-0 rtl:me-0.5"
                  />
                </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 grid-cols-3 w-full  flex-col justify-center gap-1 lg:col-span-3">
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {courseDetails?.attributes.title}
          </p>

          <h3 className="text-base font-bold leading-snug text-[var(--text-dark)] sm:text-lg">
            {lastChapter.title}
          </h3>

          <div className="mt-3 sm:mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{formatSeconds(watchedSeconds)}</span>
              <span>{lastChapter?.duration || "0:00"}</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {watchHref ? (
            <Link
              href={watchHref}
              className="mt-3 inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
            >
              <Play size={15} />
              {t("continue")}
            </Link>
          ) : (
            <span className="mt-3 inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-600 sm:w-auto">
              <UnavailableIcon size={15} />
              {unavailableMessage}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
