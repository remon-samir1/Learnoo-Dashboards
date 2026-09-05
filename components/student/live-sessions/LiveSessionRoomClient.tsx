"use client";

import Link from "next/link";
import {
  Radio,
  Users,
  Droplets,
  Eye,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Hand,
} from "lucide-react";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { VideoWatermark } from "@/components/student/watch/VideoWatermark";
import { resolveEnabledWatermarkBucket } from "@/src/lib/watermark-from-features";
import { getStudentPlatformFeatures } from "@/src/services/student/platform-feature.service";
import { JITSI_DOMAIN, getJitsiRoomName } from "@/src/lib/jitsi";

interface JitsiExternalApi {
  executeCommand: (command: string, ...args: unknown[]) => void;
  addEventListeners: (listeners: Record<string, (event?: unknown) => void>) => void;
}

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

  const jitsiRoomName = getJitsiRoomName(room.id);
  const displayName = studentName?.trim() || "Student";

  // Whiteboard and meeting state
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isConferenceJoined, setIsConferenceJoined] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const localParticipantIdRef = useRef<string | null>(null);
  const jitsiApiRef = useRef<JitsiExternalApi | null>(null);

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

  const isChatEnabled = attrs?.enable_chat !== false;

  const studentToolbarButtons = useMemo(() => {
    const buttons = ["microphone", "raisehand", "reactions"];
    if (isChatEnabled) {
      buttons.push("chat");
    }
    buttons.push("tileview", "settings", "fullscreen", "hangup");
    return buttons;
  }, [isChatEnabled]);

  const handleToggleRaiseHand = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleRaiseHand");
      setIsHandRaised((prev) => !prev);
    }
  };

  const handleToggleChat = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleChat");
      setIsChatOpen((prev) => {
        const next = !prev;
        if (next) setUnreadChatCount(0);
        return next;
      });
    }
  };

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
      <header className="flex flex-col gap-3 rounded-2xl border border-[var(--border-color)] bg-white p-3.5 sm:p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
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
          <h1 className="mt-2 text-lg sm:text-2xl font-bold text-[var(--text-dark)] leading-snug">
            {title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)]">{instructor}</p>
          <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[var(--text-muted)]">{courseTitle}</p>
          {thumb ? (
            <div className="mt-3 max-w-sm overflow-hidden rounded-xl border border-[var(--border-color)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt=""
                className="h-24 w-full object-cover sm:h-32"
              />
            </div>
          ) : null}
          {startedLabel ? (
            <p className="mt-1 text-xs text-[var(--text-placeholder)]">
              {startedLabel}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--text-muted)]">
          <Users size={16} className="text-[var(--primary)] sm:size-[18px]" />
          <span>
            {typeof attrs?.max_students === "number"
              ? `${attrs.max_students} ${t("maxStudentsLabel")}`
              : "—"}
          </span>
        </div>
      </header>

      {/* Live — Jitsi embed */}
      {liveView ? (
        <section className="flex flex-col gap-3">
          {/* Live Interaction Tools (Raise Hand & Live Chat) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] bg-white px-4 py-3 sm:px-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-dark)]">
                {t("liveTools")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Raise Hand Button */}
              <button
                type="button"
                onClick={handleToggleRaiseHand}
                disabled={!isConferenceJoined}
                title={t("raiseHandDesc")}
                aria-pressed={isHandRaised}
                className={`group inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isHandRaised
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-300 ring-offset-1"
                    : "border border-amber-200 bg-amber-50/70 text-amber-900 hover:bg-amber-100 active:scale-95"
                }`}
              >
                <Hand
                  className={`size-4 sm:size-[18px] transition-transform ${
                    isHandRaised ? "animate-bounce" : "group-hover:-rotate-12"
                  }`}
                />
                <span>{isHandRaised ? t("lowerHand") : t("raiseHand")}</span>
                {isHandRaised && (
                  <span className="size-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>

              {/* Live Chat Button */}
              {isChatEnabled ? (
                <button
                  type="button"
                  onClick={handleToggleChat}
                  disabled={!isConferenceJoined}
                  title={t("chatDesc")}
                  aria-pressed={isChatOpen}
                  className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                    isChatOpen
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/25 ring-2 ring-blue-300 ring-offset-1"
                      : "border border-blue-200 bg-blue-50/70 text-blue-900 hover:bg-blue-100 active:scale-95"
                  }`}
                >
                  <MessageCircle className="size-4 sm:size-[18px]" />
                  <span>{isChatOpen ? t("hideChat") : t("chat")}</span>
                  {unreadChatCount > 0 && !isChatOpen && (
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadChatCount > 9 ? "9+" : unreadChatCount}
                    </span>
                  )}
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-sm">
            <div className="relative h-[65vh] min-h-[440px] sm:h-[72vh] sm:min-h-[520px] lg:h-[640px]">
              {watermarkEnabled ? (
                <div className="absolute top-2 end-2 z-20 flex items-center gap-1 sm:gap-1.5 bg-blue-50/95 border border-blue-200 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 shadow-sm">
                  <Droplets className="size-3.5 sm:size-4 text-blue-600" aria-hidden />
                  <span className="text-[10px] sm:text-xs font-semibold text-blue-700">Watermarked</span>
                </div>
              ) : null}

              {/* Whiteboard view-only notification badge */}
              {isWhiteboardOpen ? (
                <div className="absolute top-2 start-2 z-20 flex items-center gap-1 sm:gap-1.5 rounded-lg border border-amber-200 bg-amber-50/95 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-amber-800 shadow-sm">
                  <Eye className="size-3.5 sm:size-4 text-amber-600" aria-hidden />
                  <span>{isRtl ? "السبورة التفاعلية (للعرض فقط)" : "Whiteboard (View Only)"}</span>
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
                  disableChat: !isChatEnabled,
                  // Hide and disable remote video context menu (the 3 dots on remote video tiles)
                  remoteVideoMenu: {
                    disabled: true,
                    disableKick: true,
                    disableGrantModerator: true,
                    disablePrivateChat: true,
                    disableDemote: true,
                  },
                  // Disable remote moderation actions
                  disableRemoteMute: true,
                  disableKick: true,
                  disableGrantModerator: true,
                  disablePrivateChat: true,
                  disableInviteFunctions: true,
                  hideConferenceSubject: true,
                  hideConferenceTimer: false,
                  moderator: {
                    enabled: false,
                  },
                  participantsPane: {
                    hideModeratorSettingsTab: true,
                    hideMoreActionsButton: true,
                    hideMuteAllButton: true,
                  },
                  // Enable whiteboard collab backend for students so they receive the canvas stream
                  whiteboard: {
                    enabled: true,
                    collabServerBaseUrl: 'https://whiteboard.jitsi.net',
                  },
                  toolbarButtons: studentToolbarButtons,
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
                  TOOLBAR_BUTTONS: studentToolbarButtons,
                  SETTINGS_SECTIONS: ['devices', 'language'],
                  HIDE_INVITE_MORE_HEADER: true,
                }}
                userInfo={{ displayName, email: "" }}
                onApiReady={(api) => {
                  jitsiApiRef.current = api as unknown as JitsiExternalApi;
                  api.addEventListeners({
                    videoConferenceJoined: (localUser: unknown) => {
                      setIsConferenceJoined(true);
                      const user = localUser as { id?: string } | undefined;
                      if (user?.id) {
                        localParticipantIdRef.current = user.id;
                      }
                    },
                    videoConferenceLeft: () => {
                      setIsConferenceJoined(false);
                      setIsWhiteboardOpen(false);
                      setIsHandRaised(false);
                      setIsChatOpen(false);
                    },
                    whiteboardStatusChanged: (event: unknown) => {
                      const ev = event as { status?: string; isOpen?: boolean } | string | undefined;
                      const rawStatus = typeof ev === "string" ? ev : ev?.status || "";
                      const status = String(rawStatus).toLowerCase();
                      // Jitsi (meet.learnoo.app) reports: INSTANTIATED | SHOWN | HIDDEN | FORBIDDEN | RESET
                      const isOpen =
                        status === "shown" ||
                        status === "instantiated" ||
                        status === "visible" ||
                        status === "open" ||
                        status === "opened" ||
                        status === "showing" ||
                        status === "active" ||
                        status === "started" ||
                        (typeof ev === "object" && ev?.isOpen === true);
                      setIsWhiteboardOpen(isOpen);
                    },
                    chatUpdated: (event: unknown) => {
                      const ev = event as { isOpen?: boolean; unreadCount?: number } | undefined;
                      if (typeof ev?.isOpen === "boolean") {
                        setIsChatOpen(ev.isOpen);
                        if (ev.isOpen) {
                          setUnreadChatCount(0);
                        }
                      }
                      if (typeof ev?.unreadCount === "number") {
                        setUnreadChatCount(ev.unreadCount);
                      }
                    },
                    raiseHandUpdated: (event: unknown) => {
                      const ev = event as { id?: string; handRaised?: number | boolean } | undefined;
                      if (!ev || !ev.id || ev.id === localParticipantIdRef.current || ev.id === "local") {
                        setIsHandRaised(Boolean(ev?.handRaised));
                      }
                    },
                    incomingMessage: () => {
                      setIsChatOpen((open) => {
                        if (!open) {
                          setUnreadChatCount((count) => count + 1);
                        }
                        return open;
                      });
                    },
                  });
                }}
                getIFrameRef={(iframe) => {
                  iframe.style.width = "100%";
                  iframe.style.height = "100%";
                  iframe.style.border = "none";
                }}
              />

              {/* Read-only stage overlay: active whenever the host opens the whiteboard.
                  The bottom strip stays uncovered so the toolbar and chat input remain usable. */}
              {isConferenceJoined && isWhiteboardOpen ? (
                <div
                  className="absolute inset-x-0 top-0 bottom-[76px] z-10 select-none bg-transparent cursor-default"
                  style={{ touchAction: "none" }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  title={isRtl ? "السبورة التفاعلية للعرض فقط" : "Whiteboard is view-only"}
                />
              ) : null}

              {/* Watermark overlay */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <VideoWatermark
                  videoRef={watermarkDummyRef}
                  contentType="liveStreams"
                  showWatermark={watermarkEnabled}
                />
              </div>
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
