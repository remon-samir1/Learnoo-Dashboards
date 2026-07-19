"use client";

import Link from "next/link";
import { Radio, Users, Video, Droplets } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { JitsiMeeting } from "@jitsi/react-sdk";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  getCourseThumbnail,
  getCourseTitle,
  getInstructorDisplayName,
  isEnded,
  isLiveOrStarted,
  isUpcoming,
  normalizeLiveStatus,
} from "@/src/lib/student-live-room";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoWatermark } from "@/components/student/watch/VideoWatermark";
import { resolveEnabledWatermarkBucket } from "@/src/lib/watermark-from-features";
import { getStudentPlatformFeatures } from "@/src/services/student/platform-feature.service";

const JITSI_DOMAIN = "meet.jit.si";

function formatWhen(iso: string | null | undefined, locale: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

export default function LiveSessionRoomClient({
  room,
  studentName,
}: {
  room: StudentLiveRoom;
  studentName: string;
}) {
  const t = useTranslations("liveSessions");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const attrs = room.attributes;
  const status = normalizeLiveStatus(attrs?.status);
  const liveView = isLiveOrStarted(attrs?.status);
  const upcoming = isUpcoming(attrs?.status) || status === "pending";
  const ended = isEnded(attrs?.status);
  const recordingUrl =
    attrs?.recording_url?.trim() ||
    attrs?.playback_url?.trim() ||
    attrs?.video_url?.trim() ||
    null;
  const showRecording = ended && !!recordingUrl;

  const jitsiRoomName = `learnoo-room-${room.id}`;
  const displayName = studentName?.trim() || "Student";

  // Watermark state management
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const watermarkDummyRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadWatermarkSettings = async () => {
      try {
        const features = await getStudentPlatformFeatures();
        const resolution = resolveEnabledWatermarkBucket(features, 'liveStreams');
        if (mounted) {
          setWatermarkEnabled(resolution?.config.enabled ?? false);
        }
      } catch (error) {
        console.error('Failed to load watermark settings:', error);
      }
    };

    loadWatermarkSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const title = attrs?.title?.trim() || t("liveSession");
  const instructor =
    getInstructorDisplayName(attrs) || t("card.unknownInstructor");
  const courseTitle = getCourseTitle(attrs) || t("courseNotAvailable");
  const thumb = getCourseThumbnail(attrs);
  const startedLabel = formatWhen(attrs?.started_at, locale);

  const statusBadge = () => {
    if (liveView) return t("liveBadge");
    if (upcoming) return t("status.upcoming");
    if (ended) return t("status.ended");
    return attrs?.status ?? tc("unknown");
  };

  return (
    <div className="flex min-w-0 flex-col gap-6" dir={isRtl ? "rtl" : "ltr"}>
      <Link
        href={`/${locale}/student/live-sessions`}
        className="inline-flex min-h-[44px] w-fit items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)]"
      >
        {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
        {t("backToList")}
      </Link>

      {/* Session Header */}
      <header className="flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {liveView && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                <span className="size-1.5 animate-pulse rounded-full bg-white" />
                {t("liveBadge")}
              </span>
            )}
            <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)]">
              {statusBadge()}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold text-[var(--text-dark)] sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{instructor}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{courseTitle}</p>
          {thumb ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border-color)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                className="h-28 w-full object-cover sm:h-32"
              />
            </div>
          ) : null}
          {startedLabel ? (
            <p className="mt-1 text-xs text-[var(--text-placeholder)]">
              {startedLabel}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-[var(--text-muted)]">
          <Users size={18} className="text-[var(--primary)]" />
          <span>
            {typeof attrs?.max_students === "number"
              ? `${attrs.max_students} ${t("maxStudentsLabel")}`
              : "—"}
          </span>
        </div>
      </header>

      {/* Live — Jitsi embed */}
      {liveView ? (
        <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-sm">
          <div className="relative" style={{ height: "min(75vh, 640px)" }}>
            {watermarkEnabled ? (
              <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                <Droplets className="size-4 text-blue-600" aria-hidden />
                <span className="text-xs font-semibold text-blue-700">Watermarked</span>
              </div>
            ) : null}
            <JitsiMeeting
              domain={JITSI_DOMAIN}
              roomName={jitsiRoomName}
              configOverwrite={{
                startWithAudioMuted: true,
                startWithVideoMuted: true,
                disableModeratorIndicator: true,
                enableEmailInStats: false,
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                // Students auto-knock and wait in lobby until host admits them
                lobby: {
                  enabled: true,
                  autoKnock: true,
                },
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
                SHOW_CHROME_EXTENSION_BANNER: false,
                MOBILE_APP_PROMO: false,
              }}
              userInfo={{ displayName, email: "" }}
              getIFrameRef={(iframe) => {
                iframe.style.width = "100%";
                iframe.style.height = "100%";
                iframe.style.border = "none";
              }}
            />
            {/* Watermark overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <VideoWatermark
                videoRef={watermarkDummyRef}
                contentType="liveStreams"
                showWatermark={watermarkEnabled}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Upcoming */}
      {upcoming && !liveView ? (
        <section className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[var(--border-color)] bg-white px-6 py-16 text-center shadow-sm">
          <Radio className="size-12 text-[var(--primary)]" />
          <p className="max-w-md text-sm font-medium text-[var(--text-dark)]">
            {t("upcomingMessage")}
          </p>
          {startedLabel ? (
            <p className="text-xs text-[var(--text-muted)]">{startedLabel}</p>
          ) : null}
        </section>
      ) : null}

      {/* Ended */}
      {ended && !liveView ? (
        <section className="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-dark)]">
            {t("sessionEnded")}
          </h2>
          {showRecording ? (
            <a
              href={recordingUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              {t("watchRecording")}
            </a>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {t("endedNoRecording")}
            </p>
          )}
        </section>
      ) : null}

      {/* Unknown status */}
      {!liveView && !upcoming && !ended ? (
        <section className="rounded-2xl border border-[var(--border-color)] bg-white p-6 text-sm text-[var(--text-muted)] shadow-sm">
          <p>{attrs?.description?.trim() || tc("na")}</p>
        </section>
      ) : null}
    </div>
  );
}
