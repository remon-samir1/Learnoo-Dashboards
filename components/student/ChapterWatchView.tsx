'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  Maximize2,
  MessageCircle,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  ZoomIn,
  ZoomOut,
  Mic,
  Square,
  Pause,
  Trash2,
  Camera,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChapterViewRecording } from '@/src/hooks/useChapterViewRecording';
import type { Chapter, Quiz } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import { quizStudentMustActivateOrReactivate } from '@/src/lib/student-quiz-activation-lock';
import { buildStudentStartExamHref } from '@/src/lib/student-start-exam-href';
import {
  discussionAuthorName,
  discussionContent,
  discussionCreatedAt,
  discussionKey,
  discussionMoment,
  discussionReplies,
  discussionTypeLabel,
  normalizeDiscussions,
  type WatchDiscussionItem,
} from '@/components/student/watch/watchChapterDiscussionUtils';
import {
  coerceCanWatchExplicitTrue,
  isNoVideoUrl,
  isStudentChapterPdfVisible,
  isStudentChapterVideoPlayable,
} from '@/src/lib/student-chapter-access';
import PdfPreviewModal from './PdfPreviewModal';
import type { WatermarkResolution } from '@/src/lib/watermark-from-features';
import { VideoWatermark } from '@/components/student/watch/VideoWatermark';
import { StudentVideoStaticOverlay } from '@/components/student/watch/StudentVideoStaticOverlay';

type ChapterAttachment = NonNullable<Chapter['attributes']['attachments']>[number];

function attachmentsWithPath(chapter: Chapter): ChapterAttachment[] {
  const list = chapter.attributes.attachments ?? [];
  return list.filter((a) => Boolean(a.attributes?.path?.trim()));
}

function isPdfAttachment(a: ChapterAttachment): boolean {
  const ext = a.attributes?.extension?.toLowerCase() ?? '';
  const path = a.attributes?.path?.toLowerCase() ?? '';
  const name = a.attributes?.name?.toLowerCase() ?? '';
  return ext === 'pdf' || path.endsWith('.pdf') || name.endsWith('.pdf');
}

function firstPdfUrl(chapter: Chapter): string | null {
  for (const a of attachmentsWithPath(chapter)) {
    if (isPdfAttachment(a)) {
      const p = a.attributes?.path?.trim();
      if (p) return p;
    }
  }
  return null;
}

function formatDiscussionTime(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function formatMomentSeconds(sec: number | null): string | null {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${m}:${pad(s)}`;
}

function chapterQuizzes(chapter: Chapter): Quiz[] {
  const raw = chapter.attributes.quizzes;
  return Array.isArray(raw) ? raw : [];
}

interface DiscussionNodeProps {
  discussion: WatchDiscussionItem;
  isReply?: boolean;
  locale: string;
  t: (key: string, params?: Record<string, unknown>) => string;
  replyToId: string | number | null;
  setReplyToId: (id: string | number | null) => void;
  replyText: string;
  setReplyText: (text: string) => void;
  replySubmitting: boolean;
  onSubmitReply: (parentId: string | number, moment?: number | null) => void;
  onPreviewImage: (url: string) => void;
}

function DiscussionNode({
  discussion,
  isReply = false,
  locale,
  t,
  replyToId,
  setReplyToId,
  replyText,
  setReplyText,
  replySubmitting,
  onSubmitReply,
  onPreviewImage,
}: DiscussionNodeProps) {
  const d = discussion;
  const content = discussionContent(d);
  const author = discussionAuthorName(d) ?? t('anonymousUser');
  const created = formatDiscussionTime(discussionCreatedAt(d), locale);
  const momentSec = discussionMoment(d);
  const momentLabel = formatMomentSeconds(momentSec);
  const typeTag = discussionTypeLabel(d);
  const isQuestion = typeTag === 'question';
  const replies = discussionReplies(d);
  const discussionType = d.attributes?.discussion_type;
  const imageUrl = d.attributes?.image;
  const voiceUrl = d.attributes?.voice;
  const _duration = d.attributes?.duration;
  const isVoice = discussionType === 'voice' || Boolean(voiceUrl);

  return (
    <article
      className={`${isReply
        ? 'mt-3 rounded-xl bg-slate-800/30 p-3.5 ring-1 ring-white/5 shadow-sm transition-all hover:bg-slate-800/40'
        : 'rounded-xl border border-slate-700/80 bg-slate-900/50 p-3.5 shadow-sm sm:p-4'
        }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2D43D1] to-[#6b7fee] font-bold text-white shadow-inner ${isReply ? 'size-8 text-[10px]' : 'size-10 text-xs'
              }`}
          >
            {author
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join('') || '•'}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-slate-100 ${isReply ? 'text-[13px]' : 'text-sm'}`}>
              {author}
              {created ? <span className="font-normal text-slate-500"> • {created}</span> : null}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {isVoice && (
                <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300">
                  <Mic className="size-2.5" />
                  Voice
                </span>
              )}
              {!isVoice && !isReply && (
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isQuestion ? 'bg-orange-500/20 text-orange-300' : 'bg-[#2D43D1]/25 text-[#93B4FF]'}`}>
                  {isQuestion ? t('badgeQuestion') : t('badgeComment')}
                </span>
              )}
              {momentLabel && !isReply && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                  <Play className="size-2.5" fill="currentColor" />
                  {momentLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isVoice && voiceUrl ? (
        <div className="mt-3">
          <audio
            controls
            src={voiceUrl}
            className="h-9 w-full rounded-lg opacity-90"
          />
        </div>
      ) : content ? (
        <p className={`mt-3 leading-relaxed text-slate-300 ${isReply ? 'text-[13px]' : 'text-sm'}`}>{content}</p>
      ) : null}

      {imageUrl && !isVoice && (
        <button
          type="button"
          onClick={() => onPreviewImage(imageUrl)}
          className="mt-3 block overflow-hidden rounded-lg border border-slate-700 hover:border-[#2D43D1] transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Discussion screenshot"
            className="max-h-48 w-auto rounded-lg object-cover"
          />
        </button>
      )}

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setReplyToId(replyToId === d.id ? null : d.id ?? null);
            setReplyText('');
          }}
          className="text-xs font-semibold text-slate-400 transition-colors hover:text-white"
        >
          {t('reply')}
        </button>
        {replies.length > 0 && (
          <span className="text-xs text-slate-600">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
        )}
      </div>

      {replyToId === d.id && (
        <div className="mt-4 space-y-3 rounded-lg bg-black/30 p-3 ring-1 ring-slate-800">
          <textarea
            rows={2}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={replySubmitting}
            placeholder={t('replyPlaceholder')}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#2D43D1] focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReplyToId(null)}
              className="px-3 py-1 text-xs font-semibold text-slate-400 hover:text-white"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={() => void onSubmitReply(d.id!, d.attributes?.moment)}
              disabled={replySubmitting || !replyText.trim()}
              className="rounded-md bg-[#2D43D1] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            >
              {replySubmitting ? <Loader2 className="size-3 animate-spin" /> : t('postReply')}
            </button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-4 border-s-2 border-slate-700/30 ps-3 sm:ps-5 ms-2 sm:ms-3">
          {replies.map((r, ri) => (
            <DiscussionNode
              key={discussionKey(r, ri)}
              discussion={r}
              isReply={true}
              locale={locale}
              t={t}
              replyToId={replyToId}
              setReplyToId={setReplyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              replySubmitting={replySubmitting}
              onSubmitReply={onSubmitReply}
              onPreviewImage={onPreviewImage}
            />
          ))}
        </div>
      )}
    </article>
  );
}

export default function ChapterWatchView({
  chapterId,
  chapter,
  loadError,
  lectureChapters,
  lectureTitle,
  watchAccessDenied,
  initialWatermarkResolution,
}: {
  chapterId: string;
  chapter: Chapter | null;
  loadError: string | null;
  lectureChapters: Chapter[];
  lectureTitle: string;
  /** Server says `can_watch` is false — user cannot use this chapter URL to stream. */
  watchAccessDenied: boolean;
  /** From server `GET /v1/feature` + bucket resolution; used until client query settles. */
  initialWatermarkResolution?: WatermarkResolution | null;
}) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const router = useRouter();
  const tDetails = useTranslations('courses.studentDetails');
  const t = useTranslations('courses.studentWatch');

  const [showPdf, setShowPdf] = useState(false);
  const [discussionsOpen, setDiscussionsOpen] = useState(true);
  const [composerText, setComposerText] = useState('');
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [clientPlaybackBlocked, setClientPlaybackBlocked] = useState(false);
  const [playbackBlockMessage, setPlaybackBlockMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [isMobile, setIsMobile] = useState(false);
  const [replyToId, setReplyToId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  // Store videoSrc in state to prevent iframe reload on discussion updates
  // Only updates when chapter.id changes, not on every chapter object refresh
  const [stableVideoSrc, setStableVideoSrc] = useState<string>('');
  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | undefined>(undefined);
  // Composer mode: 'text' | 'voice'
  const [composerMode, setComposerMode] = useState<'text' | 'voice'>('text');
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const vdoPlayerRef = useRef<any>(null);
  const vdoPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const [useVdoPlayerApi, setUseVdoPlayerApi] = useState(false);
  // Screen capture state
  const screenStreamRef = useRef<MediaStream | null>(null);
  const [screenCaptureDenied, setScreenCaptureDenied] = useState(false);
  const [screenCapturePrompted, setScreenCapturePrompted] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load VdoCipher Player API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scriptId = 'vdocipher-api-script';
    const scriptUrl = 'https://player.vdocipher.com/v2/api.js';

    // Check if script is already loaded
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => console.log('[ChapterWatchView] VdoCipher api.js loaded successfully');
    script.onerror = () => console.error('[ChapterWatchView] VdoCipher api.js failed to load');
    document.head.appendChild(script);

    return () => {
      // Don't remove the script as it might be used by other components
    };
  }, []);

  // Parse VdoCipher URL to extract OTP and playbackInfo
  const parseVdoCipherParams = (url: string): { otp?: string; playbackInfo?: string } | null => {
    try {
      const urlObj = new URL(url);
      const otp = urlObj.searchParams.get('otp');
      const playbackInfo = urlObj.searchParams.get('playbackInfo');
      if (otp && playbackInfo) {
        return { otp, playbackInfo };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Detect whether to use VdoCipher Player API based on URL format
  useEffect(() => {
    if (!stableVideoSrc) {
      console.log('[ChapterWatchView] No stableVideoSrc, useVdoPlayerApi = false');
      setUseVdoPlayerApi(false);
      return;
    }
    const params = parseVdoCipherParams(stableVideoSrc);
    console.log('[ChapterWatchView] VdoCipher URL detection:', { stableVideoSrc, params, willUseApi: Boolean(params) });
    setUseVdoPlayerApi(Boolean(params));
  }, [stableVideoSrc]);

  // Initialize VdoCipher Player API (only when useVdoPlayerApi is true and container is mounted)
  useEffect(() => {
    if (!useVdoPlayerApi || !stableVideoSrc || !vdoPlayerContainerRef.current) return;

    const params = parseVdoCipherParams(stableVideoSrc);
    if (!params) return;

    const MAX_RETRIES = 10; // ~5s total at 500ms each
    let retryCount = 0;

    const initializePlayer = () => {
      if (typeof window !== 'undefined' && (window as any).VdoPlayer) {
        try {
          // Clean up existing player
          if (vdoPlayerRef.current) {
            try {
              vdoPlayerRef.current.video.remove();
            } catch (err) {
              console.debug('[ChapterWatchView] Error removing existing player:', err);
            }
            vdoPlayerRef.current = null;
          }

          const { otp, playbackInfo } = params;
          const VdoPlayer = (window as any).VdoPlayer;

          console.log('[ChapterWatchView] Initializing VdoCipher Player API:', { otp, playbackInfo });

          const player = VdoPlayer.initialize({
            otp,
            playbackInfo,
            container: vdoPlayerContainerRef.current,
          });

          if (!player || !player.video) {
            throw new Error('VdoPlayer.initialize returned no video element');
          }

          vdoPlayerRef.current = player;

          // Subscribe to timeupdate events for accurate currentTime tracking
          player.video.addEventListener('timeupdate', () => {
            console.log('[ChapterWatchView] VdoPlayer timeupdate event fired');
            player.api.currentTime.then((time: number) => {
              console.log('[ChapterWatchView] VdoPlayer currentTime resolved:', time);
              if (Number.isFinite(time)) {
                setCurrentVideoMoment(time);
              }
            }).catch((err: unknown) => {
              console.error('[ChapterWatchView] Error getting currentTime:', err);
            });
          });

          // Handle player errors
          player.video.addEventListener('error', (err: Event) => {
            console.error('[ChapterWatchView] VdoCipher player error:', err);
          });
        } catch (err) {
          console.error('[ChapterWatchView] VdoPlayer init failed, falling back to iframe:', err);
          console.log('[ChapterWatchView] Setting useVdoPlayerApi = false (fallback triggered)');
          setUseVdoPlayerApi(false); // fall back to the iframe that used to work
        }
      } else if (retryCount < MAX_RETRIES) {
        retryCount += 1;
        setTimeout(initializePlayer, 500);
      } else {
        console.error('[ChapterWatchView] VdoCipher api.js never loaded, falling back to iframe');
        console.log('[ChapterWatchView] Setting useVdoPlayerApi = false (script never loaded)');
        setUseVdoPlayerApi(false); // fall back to the iframe that used to work
      }
    };

    initializePlayer();

    return () => {
      // Clean up player on unmount
      if (vdoPlayerRef.current) {
        try {
          vdoPlayerRef.current.video.remove();
        } catch (err) {
          console.debug('[ChapterWatchView] Error cleaning up player:', err);
        }
        vdoPlayerRef.current = null;
      }
    };
  }, [useVdoPlayerApi, stableVideoSrc]);

  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const watermarkDummyRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const pdfPanelRef = useRef<HTMLDivElement | null>(null);
  const vdoCipherIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [currentVideoMoment, setCurrentVideoMoment] = useState<number>(0);

  const chapterIdValid = chapterId.trim().length > 0;
  const chapterNumericId = Number.parseInt(chapterId, 10);
  const chapterIdForApi = Number.isFinite(chapterNumericId) ? chapterNumericId : NaN;

  const videoSrc = useMemo(() => {
    if (!chapter) return '';
    const attrs = chapter.attributes;
    const rawUrl = attrs.video_hls_url || attrs.video_mp4_url || attrs.video || attrs.playlist || '';
    if (isNoVideoUrl(rawUrl)) return '';
    return rawUrl;
  }, [chapter]);

  // Update stableVideoSrc only when chapter.id changes (new chapter), not on discussion refreshes
  useEffect(() => {
    if (chapter && chapter.id) {
      setStableVideoSrc(videoSrc);
    }
  }, [chapter?.id, videoSrc]);

  const pdfUrl = useMemo(() => (chapter ? firstPdfUrl(chapter) : null), [chapter]);

  const partChapters = useMemo(() => {
    if (lectureChapters.length > 0) return lectureChapters;
    if (chapter) return [chapter];
    return [];
  }, [lectureChapters, chapter]);

  const currentPartIndex = useMemo(() => {
    const idx = partChapters.findIndex((c) => String(c.id) === String(chapterId));
    return idx >= 0 ? idx : 0;
  }, [partChapters, chapterId]);

  const discussions = useMemo(() => {
    if (!chapter) return [];
    const flat = normalizeDiscussions(chapter.attributes.discussions);
    const map = new Map<string, WatchDiscussionItem>();
    const roots: WatchDiscussionItem[] = [];

    flat.forEach((d) => {
      if (d.id == null) return;
      map.set(String(d.id), { ...d, replies: [] });
    });

    flat.forEach((d) => {
      if (d.id == null) return;
      const parentId = d.attributes?.parent_id;
      if (parentId != null) {
        const parent = map.get(String(parentId));
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(map.get(String(d.id)) || d);
        } else {
          // Parent not found (e.g., filtered/deleted), push to roots as fallback
          roots.push(map.get(String(d.id)) || d);
        }
      } else {
        roots.push(map.get(String(d.id)) || d);
      }
    });

    return roots;
  }, [chapter]);

  const quizzes = useMemo(() => (chapter ? chapterQuizzes(chapter) : []), [chapter]);

  const examQuiz = useMemo(
    () => quizzes.find((q) => q.attributes?.type === 'exam') ?? null,
    [quizzes]
  );

  const examLockedByActivation = useMemo(() => {
    if (!examQuiz?.attributes) return false;
    return quizStudentMustActivateOrReactivate(examQuiz.attributes as unknown as Record<string, unknown>);
  }, [examQuiz]);

  const backHref = useMemo(() => {
    const courseId = chapter?.attributes?.course_id;
    if (courseId != null && String(courseId).trim() !== '') {
      return `/${locale}/student/courses/course-details/${courseId}`;
    }
    return `/${locale}/student/courses`;
  }, [chapter, locale]);

  const pdfPanelVisible = useMemo(
    () => (chapter ? isStudentChapterPdfVisible(chapter) : false),
    [chapter]
  );

  const viewsBadge = useMemo(() => {
    if (!chapter) return null;
    const maxViews = chapter.attributes.max_views;
    const current = chapter.attributes.current_user_views;
    if (maxViews != null && maxViews > 0) {
      return tDetails('viewsUsageBadge', { current, max: maxViews });
    }
    return null;
  }, [chapter, tDetails]);

  const chapterThumb = useMemo(() => {
    const u = chapter?.attributes?.thumbnail?.trim();
    return u || '/logo.svg';
  }, [chapter]);

  const accessDenied = watchAccessDenied || clientPlaybackBlocked;

  useEffect(() => {
    setClientPlaybackBlocked(false);
    setPlaybackBlockMessage(null);
  }, [chapterId]);

  useChapterViewRecording({
    chapterId: chapterIdForApi,
    videoRef: watermarkDummyRef, // Dummy ref because we use iframe + timer fallback
    videoSrc: stableVideoSrc || 'vdocipher', // Ensure hook is enabled even for iframes
    viewByMinute: chapter?.attributes?.view_by_minute ?? 0,
    enabled: Number.isFinite(chapterIdForApi) && !accessDenied,
    onViewRecordError: (msg) => {
      toast.error(msg, { id: 'view-record-error' });
    },
  });

  useEffect(() => {
    if (!pdfPanelVisible) setShowPdf(false);
  }, [pdfPanelVisible]);

  // Clean up screen capture stream on unmount
  useEffect(() => {
    return () => {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    };
  }, []);

  // If no video but PDF exists, auto-show PDF
  useEffect(() => {
    if (!stableVideoSrc && pdfUrl && pdfPanelVisible) {
      setShowPdf(true);
    }
  }, [stableVideoSrc, pdfUrl, pdfPanelVisible]);

  useEffect(() => {
    if (!Number.isFinite(chapterIdForApi) || watchAccessDenied) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.chapters.get(chapterIdForApi, { skipAuthRedirect: true });
        if (cancelled) return;
        if (!coerceCanWatchExplicitTrue(res.data.attributes.can_watch)) {
          setClientPlaybackBlocked(true);
          setPlaybackBlockMessage(null);
        } else {
          setClientPlaybackBlocked(false);
          setPlaybackBlockMessage(null);
        }
      } catch (err) {
        if (cancelled) return;
        const msg =
          err instanceof ApiError ? err.message : "You can't watch this chapter.";
        setClientPlaybackBlocked(true);
        setPlaybackBlockMessage(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chapterIdForApi, watchAccessDenied]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setIsPdfFullscreen(document.fullscreenElement === pdfPanelRef.current);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Notify VdoCipher iframe of container resize events (only for iframe fallback)
  useEffect(() => {
    if (!playerWrapperRef.current || !vdoCipherIframeRef.current || !stableVideoSrc || useVdoPlayerApi) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const iframe = vdoCipherIframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              event: 'resize',
              width: entry.contentRect.width,
              height: entry.contentRect.height,
            },
            '*'
          );
        }
      }
    });

    resizeObserver.observe(playerWrapperRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [stableVideoSrc, useVdoPlayerApi]);

  // VdoCipher iframe postMessage handler (only for iframe fallback)
  useEffect(() => {
    if (!stableVideoSrc || useVdoPlayerApi) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (typeof data === 'object' && data !== null) {
          if (typeof data.currentTime === 'number' && Number.isFinite(data.currentTime)) {
            setCurrentVideoMoment(data.currentTime);
          } else if (typeof data.time === 'number' && Number.isFinite(data.time)) {
            setCurrentVideoMoment(data.time);
          }
        }
      } catch (err) {
        console.debug('[ChapterWatchView] VdoCipher message parse error', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [stableVideoSrc, useVdoPlayerApi]);



  const toggleFullscreen = () => {
    if (!playerWrapperRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void playerWrapperRef.current.requestFullscreen();
    }
  };

  const togglePdfFullscreen = () => {
    if (!pdfPanelRef.current) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void pdfPanelRef.current.requestFullscreen();
    }
  };

  useEffect(() => {
    if (!composerOpen) return;
    const id = window.requestAnimationFrame(() => {
      composerTextareaRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [composerOpen]);

  const refreshChapter = async () => {
    // Fetch ONLY the updated discussions list via API call instead of router.refresh()
    // router.refresh() re-fetches the entire chapter from server, returning a new video URL (fresh OTP/token),
    // causing the iframe to fully reload/restart mid-playback. This decouples discussion updates from video state.
    try {
      if (!Number.isFinite(chapterIdForApi)) return;
      const res = await api.chapters.get(chapterIdForApi, { skipAuthRedirect: true });
      // Update local discussions state without touching video URL
      // The chapter object from API will have updated discussions, but we ignore video URL changes
      // since stableVideoSrc is stored separately and only updates on chapter.id change
      // Note: This requires the parent component to handle the chapter prop update gracefully
      // For now, we still call router.refresh() but the video won't reload due to stableVideoSrc
      router.refresh();
    } catch (err) {
      console.error('[ChapterWatchView] Failed to refresh discussions:', err);
    }
  };

  // Helper to get current video moment for discussions
  const getCurrentVideoMoment = (): number => {
    // Return the tracked moment from VdoCipher Player API or iframe fallback
    if (Number.isFinite(currentVideoMoment) && currentVideoMoment >= 0) {
      console.log('[ChapterWatchView] getCurrentVideoMoment returning tracked moment:', currentVideoMoment, 'useVdoPlayerApi:', useVdoPlayerApi);
      return currentVideoMoment;
    }
    console.log('[ChapterWatchView] getCurrentVideoMoment: currentVideoMoment not valid, returning 0. useVdoPlayerApi:', useVdoPlayerApi, 'currentVideoMoment:', currentVideoMoment);
    // For iframe fallback, try to query directly
    if (!useVdoPlayerApi) {
      try {
        const iframe = vdoCipherIframeRef.current;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ event: 'getCurrentTime' }, '*');
        }
      } catch (err) {
        // Ignore CORS errors
      }
    }
    return 0;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      toast.error('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [audioUrl]);

  const formatRecordingTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Request screen capture permission (fire-and-forget, non-blocking)
  const requestScreenCapture = useCallback(async (): Promise<MediaStream | null> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      console.debug('[ChapterWatchView] Screen capture not supported in this environment');
      setScreenCapturePrompted(true);
      return null;
    }
    if (screenStreamRef.current) return screenStreamRef.current;
    if (screenCaptureDenied) return null;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any,
      });
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        console.debug('[ChapterWatchView] Screen capture stream ended by user');
        screenStreamRef.current = null;
      });
      screenStreamRef.current = stream;
      console.log('[ChapterWatchView] Screen capture stream acquired successfully');
      return stream;
    } catch (err) {
      console.debug('[ChapterWatchView] Screen capture denied/cancelled:', err);
      setScreenCaptureDenied(true);
      return null;
    } finally {
      setScreenCapturePrompted(true);
    }
  }, [screenCaptureDenied]);

  // Capture a single frame from the screen capture stream
  const captureScreenFrame = useCallback(async (): Promise<File | null> => {
    const stream = screenStreamRef.current;
    if (!stream) {
      console.debug('[ChapterWatchView] No screen capture stream available for frame capture');
      return null;
    }
    try {
      const track = stream.getVideoTracks()[0];
      if (!track) {
        console.debug('[ChapterWatchView] No video track in screen capture stream');
        return null;
      }
      if ('ImageCapture' in window) {
        const imageCapture = new (window as any).ImageCapture(track);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(bitmap, 0, 0);
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', 0.85)
        );
        return blob ? new File([blob], 'screenshot.jpg', { type: 'image/jpeg' }) : null;
      }
      // Fallback: draw video frame to canvas
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 100));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0);
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );
      return blob ? new File([blob], 'screenshot.jpg', { type: 'image/jpeg' }) : null;
    } catch (err) {
      console.debug('[ChapterWatchView] Frame capture failed:', err);
      return null;
    }
  }, []);


  const submitComposer = async () => {
    if (!Number.isFinite(chapterIdForApi)) return;
    setComposerSubmitting(true);
    try {
      const moment = getCurrentVideoMoment();
      console.log('[ChapterWatchView] submitComposer: moment value being sent:', moment, 'useVdoPlayerApi:', useVdoPlayerApi, 'currentVideoMoment:', currentVideoMoment);

      if (composerMode === 'voice') {
        if (!audioBlob) {
          toast.error('Please record a voice note first');
          return;
        }
        let imagePath: string | null = null;
        const frameFile = await captureScreenFrame();
        if (frameFile) {
          try {
            const uploadRes = await api.discussions.uploadMedia(frameFile);
            imagePath = uploadRes.data?.path ?? null;
            console.log('[ChapterWatchView] Screenshot uploaded successfully:', imagePath);
          } catch (err) {
            console.debug('[ChapterWatchView] Screenshot upload failed:', err);
          }
        }
        const voiceFile = new File([audioBlob], 'voice-note.webm', { type: 'audio/webm' });
        // Upload voice file first
        const voiceUploadRes = await api.discussions.uploadMedia(voiceFile);
        const voicePath = voiceUploadRes.data?.path ?? null;
        if (!voicePath) {
          toast.error('Voice upload failed');
          return;
        }
        await api.discussions.create({
          chapter_id: chapterIdForApi,
          type: 'voice',
          voice: voicePath,
          moment,
          parent_id: null,
          discussion_type: 'voice',
          duration: recordingSeconds,
          image: imagePath,
        });
        toast.success(t('discussionPosted'));
        clearRecording();
        setComposerMode('text');
      } else {
        const text = composerText.trim();
        if (!text) {
          toast.error(t('discussionContentRequired'));
          return;
        }
        let imagePath: string | null = null;
        const frameFile = await captureScreenFrame();
        if (frameFile) {
          try {
            const uploadRes = await api.discussions.uploadMedia(frameFile);
            imagePath = uploadRes.data?.path ?? null;
            console.log('[ChapterWatchView] Screenshot uploaded successfully:', imagePath);
          } catch (err) {
            console.debug('[ChapterWatchView] Screenshot upload failed:', err);
          }
        }
        await api.discussions.create({
          chapter_id: chapterIdForApi,
          type: 'text',
          content: text,
          moment,
          parent_id: null,
          discussion_type: 'text',
          image: imagePath,
        });
        toast.success(t('discussionPosted'));
        setComposerText('');
      }
      await refreshChapter();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('discussionPostError');
      toast.error(msg);
    } finally {
      setComposerSubmitting(false);
    }
  };

  const submitReply = async (parentId: string | number, momentSource?: number | null) => {
    const text = replyText.trim();
    if (!text) {
      toast.error(t('discussionContentRequired'));
      return;
    }
    if (!Number.isFinite(chapterIdForApi)) return;

    setReplySubmitting(true);
    try {
      await api.discussions.create({
        chapter_id: chapterIdForApi,
        type: 'text',
        content: text,
        moment: momentSource ?? getCurrentVideoMoment(),
        parent_id: Number(parentId),
        discussion_type: 'text',
      });
      toast.success(t('discussionPosted'));
      setReplyText('');
      setReplyToId(null);
      await refreshChapter();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('discussionPostError');
      toast.error(msg);
    } finally {
      setReplySubmitting(false);
    }
  };

  if (!chapterIdValid) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8" dir={dir}>
        <p className="text-sm text-red-400">{tDetails('invalidId')}</p>
        <Link href={`/${locale}/student/courses`} className="mt-4 inline-flex text-sm font-medium text-[#2563EB] transition-colors hover:text-[#1d4ed8]">
          {tDetails('watchBack')}
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" dir={dir}>
        <Link
          href={backHref}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
        >
          <ArrowLeft className="size-4 text-slate-600 transition-colors group-hover:text-slate-950 rtl:rotate-180" />
          {tDetails('watchBack')}
        </Link>
        <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-6 py-8 text-sm text-red-200">
          {tDetails('error')}: {loadError}
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8" dir={dir}>
        <Link
          href={backHref}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
        >
          <ArrowLeft className="size-4 text-slate-600 transition-colors group-hover:text-slate-950 rtl:rotate-180" />
          {tDetails('watchBack')}
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-12 text-center text-sm text-slate-600">
          {tDetails('watchNotFound')}
        </div>
      </div>
    );
  }

  const attrs = chapter.attributes;
  const startExamHref =
    examQuiz != null
      ? buildStudentStartExamHref(locale, String(examQuiz.id), attrs.course_id ?? null)
      : null;

  const pdfToggleVisible = pdfUrl && pdfPanelVisible;

  const pdfWatchPanel =
    showPdf && pdfUrl && pdfPanelVisible ? (
      <div ref={pdfPanelRef} className={`flex min-h-0 flex-col bg-white ${isPdfFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen' : isFullscreen ? 'h-screen' : 'h-full'}`}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-[#f8fafc] px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-[#2D43D1]" aria-hidden />
            <span className="truncate text-sm font-semibold text-slate-900">{t('lectureMaterial')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setPdfScale((s) => Math.max(0.5, s - 0.1))}
                className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="min-w-[2.5rem] text-center text-[10px] font-bold text-slate-600 sm:text-xs">
                {Math.round(pdfScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPdfScale((s) => Math.min(2.5, s + 0.1))}
                className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <div className="mx-0.5 h-3 w-px bg-slate-200" />
              <button
                type="button"
                onClick={() => setPdfScale(1.0)}
                className="flex size-7 items-center justify-center rounded text-[#64748B] hover:bg-slate-100"
                title="Reset Zoom"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {!isMobile && (
              <button
                type="button"
                onClick={togglePdfFullscreen}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white p-1.5 text-[#64748B] transition hover:bg-slate-50"
                title={isPdfFullscreen ? 'Exit fullscreen' : 'Full screen'}
              >
                {isPdfFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPdf(false)}
              className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-xs"
            >
              {t('hidePdf')}
            </button>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-auto overscroll-y-contain bg-[#eef2f6] px-2 py-3 touch-pan-x touch-pan-y sm:px-3 [-webkit-overflow-scrolling:touch] [overflow-anchor:none] ${isPdfFullscreen || isFullscreen ? 'h-[calc(100vh-44px)]' : ''}`}>
          <PdfPreviewModal
            variant="inline"
            expandToContainer
            title={t('lectureMaterial')}
            open={showPdf}
            pdfUrl={pdfUrl}
            scale={pdfScale}
            onScaleChange={setPdfScale}
            contentType="chapters"
          />
        </div>
        <p className="hidden shrink-0 border-t border-slate-200 bg-[#f8fafc] px-4 py-2 text-center text-[11px] text-slate-500 sm:block">
          {t('pdfSyncHint')}
        </p>
      </div>
    ) : null;


  return (
    <>
    <div
      className="min-h-screen overflow-x-clip bg-[#0b1426] pb-28 text-slate-100 [-webkit-tap-highlight-color:transparent] sm:pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]"
      dir={dir}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-2 pb-1 sm:px-6 sm:pb-2 sm:pt-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={backHref}
              className="mb-2 inline-flex min-h-[44px] items-center gap-2 py-1 text-sm font-medium text-slate-400 transition hover:text-white sm:mb-3"
            >
              <ArrowLeft className="size-4 shrink-0 rtl:rotate-180" />
              {tDetails('watchBack')}
            </Link>
            <h1 className="text-xl font-bold leading-snug text-white sm:text-2xl sm:leading-tight lg:text-3xl">
              {attrs.title}
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:mt-2 sm:text-sm">
              {lectureTitle ? (
                <>
                  <span className="text-slate-300">{lectureTitle}</span>
                  <span className="mx-1.5 text-slate-600 sm:mx-2">•</span>
                </>
              ) : null}
              <span>{t('subtitleChapter', { number: currentPartIndex + 1 })}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:justify-end">
            {viewsBadge ? (
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 sm:min-h-0 sm:py-1.5">
                {viewsBadge}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-clip [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto w-full max-w-6xl px-0 sm:px-6 lg:px-8">
          <div className="overflow-hidden border-y border-slate-700 bg-[#070d18] shadow-xl sm:rounded-2xl sm:border sm:border-slate-700">
            <div className="flex flex-col">
              <div className="bg-black/50">
                {stableVideoSrc ? (
                  accessDenied ? (
                    <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-center">
                      <p className="max-w-md text-sm font-medium text-slate-200">
                        {playbackBlockMessage ?? t('watchAccessDenied')}
                      </p>
                      <p className="max-w-md text-xs text-slate-500">{t('watchAccessDeniedHint')}</p>
                      <Link
                        href={backHref}
                        className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        {tDetails('watchBack')}
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div ref={playerWrapperRef} className={`flex flex-col lg:flex-row ${isFullscreen ? 'h-screen w-screen bg-black' : ''}`}>
                        <div className="relative lg:flex-1">
                          {useVdoPlayerApi ? (
                            // VdoCipher Player API container
                            <div
                              ref={vdoPlayerContainerRef}
                              className="aspect-video w-full"
                            />
                          ) : (
                            // Fallback to iframe for non-VdoCipher videos
                            <iframe
                              ref={vdoCipherIframeRef}
                              src={stableVideoSrc}
                              className="aspect-video w-full"
                              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share"
                              frameBorder="0"
                              scrolling="no"
                            />
                          )}
                          {/* Overlays - ensured they don't block bottom interaction area on small screens */}
                          <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <StudentVideoStaticOverlay subtitle={lectureTitle.trim() || attrs.title?.trim()} />
                            <VideoWatermark
                              videoRef={watermarkDummyRef}
                              contentType="chapters"
                              initialResolution={initialWatermarkResolution ?? null}
                            />
                          </div>

                          {/* Fullscreen toggle - moved higher on mobile to avoid overlapping VdoCipher gear icon/controls */}
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="absolute bottom-12 right-2 z-20 rounded-md bg-black/60 p-1.5 text-white transition hover:bg-black/80 sm:bottom-2"
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                          >
                            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                          </button>
                        </div>

                        {showPdf && pdfWatchPanel && (
                          <div className={`w-full lg:w-1/2 ${isFullscreen ? 'h-screen overflow-hidden' : 'h-64 sm:h-80 overflow-hidden'}`}>
                            <div className="h-full w-full">{pdfWatchPanel}</div>
                          </div>
                        )}
                      </div>

                    </>
                  )
                ) : (
                  // NO VIDEO CASE
                  pdfUrl && pdfPanelVisible ? (
                    <div className="bg-slate-950">
                      <div className="mx-auto max-w-5xl">
                        <div className="aspect-[16/10] w-full sm:aspect-[16/9]">
                          {pdfWatchPanel}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                      <div className="flex size-16 items-center justify-center rounded-full bg-[#2D43D1]/90 text-white">
                        <Play className="size-8 translate-x-0.5" fill="currentColor" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">{attrs.title}</p>
                      <p className="text-xs text-slate-500">{tDetails('watchNoVideo')}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Under video: stacked on small screens; desktop = one row like design (Ask | Lecture parts inline | Discussions). */}
            <div className="border-t border-slate-800/80 bg-[#050915] px-0 py-0 sm:px-6 sm:py-3.5">
              <div className="flex flex-col gap-3 px-4 pb-6 pt-5 sm:px-5 sm:pb-7 sm:pt-7 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-5 md:py-3.5 md:pb-3.5 md:pt-3.5 lg:gap-6 lg:px-6">
                <div className="flex justify-stretch max-md:border-b max-md:border-slate-800/90 md:min-w-0 md:justify-start">
                  {Number.isFinite(chapterIdForApi) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setComposerOpen((o) => !o);
                        if (!screenCapturePrompted) void requestScreenCapture();
                      }}
                      className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] max-md:rounded-none max-md:px-12 sm:min-h-0 sm:w-auto sm:px-7 sm:py-2.5 md:shrink-0 ${composerOpen
                        ? 'bg-[#2436b0] sm:ring-2 sm:ring-white/20'
                        : 'bg-[#2D43D1] hover:bg-[#2436b0]'
                        }`}
                    >
                      <MessageCircle className="size-4 shrink-0 stroke-[2]" aria-hidden />
                      {t('askMoment')}
                    </button>
                  ) : (
                    <span className="h-10" aria-hidden />
                  )}
                </div>

                {/* <div className="min-w-0 md:flex md:justify-center md:px-1">
                  <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:justify-center md:gap-2.5 md:overflow-x-auto md:py-0.5">
                    <span className="w-full text-center text-xs font-medium text-slate-400 sm:text-sm md:w-auto md:shrink-0 md:text-start">
                      {t('lecturePartsToolbar')}
                    </span>
                    <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0 md:justify-center md:pb-0 [&::-webkit-scrollbar]:hidden">
                      {partChapters.map((ch, idx) => {
                        const active = String(ch.id) === String(chapterId);
                        const href = `/${locale}/student/courses/watch/${ch.id}`;
                        const partPlayable = isStudentChapterVideoPlayable(ch);
                        if (partPlayable) {
                          return (
                            <Link
                              key={ch.id}
                              href={href}
                              prefetch
                              className={`snap-start whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition md:rounded-lg md:px-4 md:py-2 md:text-sm ${active
                                ? 'bg-[#2D43D1] text-white'
                                : 'border border-slate-600/90 bg-slate-800/90 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                                }`}
                            >
                              {t('partLabel', { number: idx + 1 })}
                            </Link>
                          );
                        }
                        return (
                          <span
                            key={ch.id}
                            title={t('partLockedTooltip')}
                            className={`inline-flex snap-start cursor-not-allowed items-center gap-1 whitespace-nowrap rounded-lg border px-3.5 py-2 text-xs font-semibold opacity-80 md:rounded-lg md:px-4 md:py-2 md:text-sm ${active
                              ? 'border-amber-500/60 bg-slate-900/90 text-amber-100'
                              : 'border-slate-600/80 bg-slate-800/80 text-slate-400'
                              }`}
                            aria-disabled
                          >
                            <Lock className="size-3.5 shrink-0 opacity-90" aria-hidden />
                            {t('partLabel', { number: idx + 1 })}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div> */}

                <div className="flex justify-stretch md:min-w-0 md:justify-end">
                  <div className="flex w-full gap-2 md:w-auto">
                    {pdfToggleVisible && (
                      <button
                        type="button"
                        onClick={() => setShowPdf((v) => !v)}
                        className={`inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold text-white transition active:scale-[0.99] sm:min-h-0 sm:px-4 sm:py-2.5 ${showPdf
                          ? 'border-slate-500/90 bg-slate-800 hover:bg-slate-700'
                          : 'border-slate-600/90 bg-slate-800/90 hover:bg-slate-800'
                          }`}
                      >
                        <FileText className="size-4 shrink-0" aria-hidden />
                        <span className="max-w-[4.5rem] truncate sm:max-w-none">
                          {showPdf ? t('hidePdf') : t('showPdf')}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDiscussionsOpen((o) => !o)}
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-600/90 bg-slate-800/90 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:bg-slate-800/80 max-md:px-12 md:flex-1 md:min-h-0 md:w-auto md:shrink-0 md:px-5 md:py-2.5"
                      aria-expanded={discussionsOpen}
                    >
                      {t('discussionsCount', { count: discussions.length })}
                      <ChevronDown
                        className={`size-4 shrink-0 transition ${discussionsOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {Number.isFinite(chapterIdForApi) && composerOpen ? (
              <div className="border-t border-slate-800/80 bg-[#050915] px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 sm:px-6 sm:pb-5">
                {/* Mode tabs */}
                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setComposerMode('text'); clearRecording(); }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${composerMode === 'text' ? 'bg-[#2D43D1] text-white' : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                  >
                    <MessageCircle className="size-3.5" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposerMode('voice')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${composerMode === 'voice' ? 'bg-[#2D43D1] text-white' : 'border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}
                  >
                    <Mic className="size-3.5" />
                    Voice
                  </button>
                </div>

                {composerMode === 'text' ? (
                  <div className="flex gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 sm:h-14 sm:w-14">
                      <Image src={chapterThumb} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <textarea
                        ref={composerTextareaRef}
                        rows={3}
                        value={composerText}
                        onChange={(e) => setComposerText(e.target.value)}
                        disabled={composerSubmitting}
                        placeholder={t('composerPlaceholder')}
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/90 px-4 py-2.5 text-base text-white placeholder:text-slate-500 focus:border-[#2D43D1] focus:outline-none focus:ring-1 focus:ring-[#2D43D1] disabled:opacity-60 sm:text-sm"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Camera className="size-3" />
                          {screenStreamRef.current
                            ? t('screenshotCaptured')
                            : screenCaptureDenied
                              ? t('screenshotDenied')
                              : screenCapturePrompted
                                ? t('screenshotUnsupported')
                                : t('screenshotPending')}
                        </span>
                        <button
                          type="button"
                          onClick={() => void submitComposer()}
                          disabled={composerSubmitting || !composerText.trim()}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#2D43D1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2436b0] active:scale-[0.99] disabled:opacity-50 sm:min-h-0 sm:px-4 sm:py-2"
                        >
                          {composerSubmitting ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : (
                            <Send className="size-4 rtl:rotate-180" aria-hidden />
                          )}
                          {t('composerPost')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                    {!audioBlob ? (
                      <div className="flex flex-col items-center gap-4 py-4">
                        {isRecording ? (
                          <>
                            <div className="flex size-16 items-center justify-center rounded-full bg-red-500/20 ring-4 ring-red-500/30 animate-pulse">
                              <div className="size-4 rounded-full bg-red-500" />
                            </div>
                            <span className="text-xl font-bold tabular-nums text-red-400">{formatRecordingTime(recordingSeconds)}</span>
                            <p className="text-xs text-slate-500">Recording... tap Stop when done</p>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                            >
                              <Square className="size-4" />
                              Stop Recording
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex size-16 items-center justify-center rounded-full bg-[#2D43D1]/20 ring-4 ring-[#2D43D1]/20">
                              <Mic className="size-8 text-[#2D43D1]" />
                            </div>
                            <p className="text-sm text-slate-400">Tap the button to start recording your voice note</p>
                            <button
                              type="button"
                              onClick={() => void startRecording()}
                              className="flex items-center gap-2 rounded-xl bg-[#2D43D1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2436b0]"
                            >
                              <Mic className="size-4" />
                              Start Recording
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                          <Mic className="size-4" />
                          Voice note recorded ({formatRecordingTime(recordingSeconds)})
                        </div>
                        {audioUrl && (
                          <audio controls src={audioUrl} className="w-full rounded-lg [&::-webkit-media-controls-panel]:bg-slate-900 [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white" />
                        )}
                        <div className="flex justify-between gap-2">
                          <button
                            type="button"
                            onClick={clearRecording}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:border-slate-500 hover:text-red-400"
                          >
                            <Trash2 className="size-3.5" />
                            Discard
                          </button>
                          <button
                            type="button"
                            onClick={() => void submitComposer()}
                            disabled={composerSubmitting}
                            className="flex items-center gap-2 rounded-xl bg-[#2D43D1] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#2436b0] disabled:opacity-50"
                          >
                            {composerSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                            Send Voice Note
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-[30px] w-full max-w-6xl space-y-6 px-5 pb-4 sm:space-y-8 sm:px-6 sm:pb-6 lg:px-8">
        {discussionsOpen ? (
          <section className="space-y-3 sm:space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {t('discussionsHeading')}
            </h2>
            {discussions.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-10 text-center text-sm text-slate-400 sm:px-4">
                {t('noDiscussions')}
              </p>
            ) : (
              discussions
                .filter((d) => Boolean(discussionContent(d)))
                .map((d, i) => (
                  <DiscussionNode
                    key={discussionKey(d, i)}
                    discussion={d}
                    locale={locale}
                    t={t}
                    replyToId={replyToId}
                    setReplyToId={setReplyToId}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    replySubmitting={replySubmitting}
                    onSubmitReply={submitReply}
                    onPreviewImage={setPreviewImageUrl}
                  />
                ))
            )}
          </section>
        ) : null}

        {examQuiz && (startExamHref || examLockedByActivation) ? (
          <div className="flex flex-col items-stretch justify-between gap-3 overflow-hidden rounded-2xl border border-[#5c3d28]/80 bg-[#3d2818] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
            <div className="flex min-w-0 items-center gap-3 text-sm font-semibold text-[#f5e6d6]">
              <FileText className="size-5 shrink-0 text-[#f59e0b]" aria-hidden />
              {t('examBannerText')}
            </div>
            {examLockedByActivation ? (
              <div className="flex min-w-0 flex-col items-stretch gap-2 sm:max-w-xs sm:items-end">
                <p className="text-xs font-medium leading-snug text-[#fde68a]/95">
                  {tDetails('examsActivationRequired')}
                </p>
                <Link
                  href={backHref}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/35 bg-white/10 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-white/15"
                >
                  {tDetails('examsActivateCourseForExam')}
                </Link>
              </div>
            ) : startExamHref ? (
              <Link
                href={startExamHref}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#f97316] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#ea580c]"
              >
                {t('takeExam')}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>

    {previewImageUrl && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
        onClick={() => setPreviewImageUrl(undefined)}
      >
        <div
          className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-xl bg-slate-900 shadow-2xl ring-1 ring-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewImageUrl} alt="Preview" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain" />
          <button
            type="button"
            onClick={() => setPreviewImageUrl(undefined)}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      </div>
    )}
  </>
  );
}

