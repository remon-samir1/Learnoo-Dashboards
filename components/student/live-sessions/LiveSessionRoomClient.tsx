"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Radio,
  Send,
  Users,
  Video,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { MediaConnection, DataConnection } from "peerjs";
import type { StudentLiveRoom } from "@/src/interfaces/student-live-room.interface";
import {
  STUDENT_PEER_ICE_SERVERS,
  STUDENT_PEER_JS_OPTIONS,
} from "@/src/lib/student-peerjs-config";
import {
  getCourseThumbnail,
  getCourseTitle,
  getHostPeerId,
  getInstructorDisplayName,
  isEnded,
  isLiveOrStarted,
  isUpcoming,
  normalizeLiveStatus,
} from "@/src/lib/student-live-room";

type ChatRow = {
  id: string;
  name: string;
  content: string;
  self?: boolean;
};

type PeerPayload = {
  id?: string;
  action?: string;
  content?: string | null;
  name?: string;
};

function parsePayload(raw: unknown): PeerPayload | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as PeerPayload;
}

function formatWhen(iso: string | null | undefined, locale: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
  const hostPeerId = getHostPeerId(attrs);
  const enableChat = attrs?.enable_chat === true;
  const recordingUrl =
    attrs?.recording_url?.trim() ||
    attrs?.playback_url?.trim() ||
    attrs?.video_url?.trim() ||
    null;
  const showRecording = ended && !!recordingUrl;

  const videoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<import("peerjs").default | null>(null);
  const dataConnRef = useRef<DataConnection | null>(null);

  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [draft, setDraft] = useState("");
  const [chatOpen, setChatOpen] = useState(true);
  const [peerError, setPeerError] = useState<string | null>(null);
  const [peerPhase, setPeerPhase] = useState<
    "idle" | "boot" | "joined" | "stream" | "error"
  >("idle");

  const displayName = useMemo(
    () => (studentName?.trim() ? studentName.trim() : "Student"),
    [studentName],
  );

  const appendMessage = useCallback((row: ChatRow) => {
    setMessages((m) => [...m, row]);
  }, []);

  const sendChat = useCallback(() => {
    const text = draft.trim();
    if (!text || !enableChat) return;
    const conn = dataConnRef.current;
    const peer = peerRef.current;
    if (!conn?.open || !peer?.id) return;
    conn.send({
      id: peer.id,
      action: "message",
      content: text,
      name: displayName,
    });
    appendMessage({
      id: `${peer.id}-local-${Date.now()}`,
      name: displayName,
      content: text,
      self: true,
    });
    setDraft("");
  }, [appendMessage, draft, displayName, enableChat]);

  useEffect(() => {
    if (!liveView || !hostPeerId) {
      setPeerPhase("idle");
      return;
    }

    let cancelled = false;
    let peerInstance: import("peerjs").default | null = null;

    const boot = async () => {
      setPeerError(null);
      setPeerPhase("boot");

      try {
        const { default: PeerCtor } = await import("peerjs");
        if (cancelled) return;

        peerInstance = new PeerCtor({
          ...STUDENT_PEER_JS_OPTIONS,
          config: { iceServers: STUDENT_PEER_ICE_SERVERS },
        });
        peerRef.current = peerInstance;

        peerInstance.on("error", () => {
          if (cancelled) return;
          setPeerPhase("error");
          setPeerError("peer");
        });

        peerInstance.on("open", (viewerId: string) => {
          if (cancelled || !peerInstance) return;
          const conn = peerInstance.connect(hostPeerId, { reliable: true });
          dataConnRef.current = conn;

          conn.on("open", () => {
            if (cancelled) return;
            conn.send({
              id: viewerId,
              action: "join",
              content: null,
              name: displayName,
            });
            setPeerPhase("joined");
          });

          conn.on("data", (data: unknown) => {
            if (cancelled) return;
            const p = parsePayload(data);
            if (p?.action === "message" && typeof p.content === "string") {
              appendMessage({
                id: `${p.id ?? "remote"}-${Date.now()}`,
                name: typeof p.name === "string" && p.name.trim() ? p.name : "—",
                content: p.content,
              });
            }
          });

          conn.on("error", () => {
            if (cancelled) return;
            setPeerPhase("error");
            setPeerError("conn");
          });
        });

        peerInstance.on("call", (call: MediaConnection) => {
          if (cancelled) return;
          try {
            call.answer();
          } catch {
            /* PeerJS may throw if stream required — ignore */
          }
          call.on("stream", (remote: MediaStream) => {
            if (cancelled) return;
            const el = videoRef.current;
            if (el) {
              el.srcObject = remote;
              void el.play().catch(() => {});
            }
            setPeerPhase("stream");
          });
          call.on("error", () => {
            if (cancelled) return;
            setPeerPhase("error");
            setPeerError("call");
          });
        });
      } catch {
        if (!cancelled) {
          setPeerPhase("error");
          setPeerError("boot");
        }
      }
    };

    void boot();

    return () => {
      cancelled = true;
      dataConnRef.current = null;
      try {
        peerInstance?.destroy();
      } catch {
        /* ignore */
      }
      peerRef.current = null;
      const v = videoRef.current;
      if (v) v.srcObject = null;
    };
  }, [appendMessage, displayName, hostPeerId, liveView]);

  const title = attrs?.title?.trim() || t("liveSession");
  const instructor = getInstructorDisplayName(attrs) || t("card.unknownInstructor");
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
            <p className="mt-1 text-xs text-[var(--text-placeholder)]">{startedLabel}</p>
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

      {liveView && !hostPeerId ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {t("noHostPeer")}
        </section>
      ) : null}

      {liveView && hostPeerId ? (
        <section className="flex min-h-0 flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[#0f172a] sm:min-h-[320px] lg:min-h-[420px]">
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                playsInline
                autoPlay
                muted
                controls
              />
              {peerPhase !== "stream" && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-6 text-center text-white">
                  <Video className="size-12 opacity-90" />
                  <p className="text-sm font-semibold">
                    {peerPhase === "error"
                      ? t("connectionError")
                      : peerPhase === "boot" || peerPhase === "idle"
                        ? t("connecting")
                        : t("receivingStream")}
                  </p>
                  {peerError ? (
                    <p className="max-w-xs text-xs text-white/80">{t("connectionError")}</p>
                  ) : null}
                </div>
              )}
            </div>

            {enableChat ? (
              <aside
                className={`flex w-full shrink-0 flex-col rounded-2xl border border-[var(--border-color)] bg-white shadow-sm lg:w-[min(100%,360px)] ${
                  chatOpen ? "" : "hidden lg:flex"
                }`}
              >
                <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
                  <span className="text-sm font-semibold text-[var(--text-dark)]">
                    {t("chat")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChatOpen((o) => !o)}
                    className="text-xs font-semibold text-[var(--primary)] lg:hidden"
                  >
                    {chatOpen ? t("hideChat") : t("showChat")}
                  </button>
                </div>
                <div className="min-h-[160px] max-h-[280px] flex-1 space-y-2 overflow-y-auto p-3 lg:max-h-[420px]">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-xl px-3 py-2 text-xs ${
                        m.self
                          ? isRtl
                            ? "me-4 bg-[#EEF2FF]"
                            : "ms-4 bg-[#EEF2FF]"
                          : isRtl
                            ? "ms-4 bg-[#F8FAFC]"
                            : "me-4 bg-[#F8FAFC]"
                      }`}
                    >
                      <p className="font-semibold text-[var(--text-dark)]">{m.name}</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-[var(--text-muted)]">
                        {m.content}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-[var(--border-color)] p-3">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChat();
                    }}
                    placeholder={t("writeMessage")}
                    className="min-h-[44px] flex-1 rounded-xl border border-[var(--border-color)] bg-[#F8FAFC] px-3 text-sm text-[var(--text-dark)] outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={sendChat}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--primary)] text-white"
                    aria-label={t("send")}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </aside>
            ) : null}
          </div>
        </section>
      ) : null}

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
            <p className="mt-3 text-sm text-[var(--text-muted)]">{t("endedNoRecording")}</p>
          )}
        </section>
      ) : null}

      {!liveView && !upcoming && !ended ? (
        <section className="rounded-2xl border border-[var(--border-color)] bg-white p-6 text-sm text-[var(--text-muted)] shadow-sm">
          <p>{attrs?.description?.trim() || tc("na")}</p>
        </section>
      ) : null}
    </div>
  );
}

