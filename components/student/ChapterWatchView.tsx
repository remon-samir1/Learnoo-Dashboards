'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const watermarkDummyRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const pdfPanelRef = useRef<HTMLDivElement | null>(null);

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
    const map = new Map<string | number, WatchDiscussionItem>();
    const roots: WatchDiscussionItem[] = [];

    flat.forEach((d) => {
      if (d.id != null) map.set(d.id, { ...d, replies: [] });
    });

    flat.forEach((d) => {
      const parentId = d.attributes?.parent_id;
      if (parentId != null && map.has(parentId)) {
        const parent = map.get(parentId)!;
        parent.replies = parent.replies || [];
        parent.replies.push(map.get(d.id!) || d);
      } else {
        roots.push(map.get(d.id!) || d);
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
    videoSrc: videoSrc || 'vdocipher', // Ensure hook is enabled even for iframes
    viewByMinute: chapter?.attributes?.view_by_minute ?? 0,
    enabled: Number.isFinite(chapterIdForApi) && !accessDenied,
    onViewRecordError: (msg) => {
      toast.error(msg, { id: 'view-record-error' });
    },
  });

  useEffect(() => {
    if (!pdfPanelVisible) setShowPdf(false);
  }, [pdfPanelVisible]);

  // If no video but PDF exists, auto-show PDF
  useEffect(() => {
    if (!videoSrc && pdfUrl && pdfPanelVisible) {
      setShowPdf(true);
    }
  }, [videoSrc, pdfUrl, pdfPanelVisible]);

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
    router.refresh();
  };

  const submitComposer = async () => {
    const text = composerText.trim();
    if (!text) {
      toast.error(t('discussionContentRequired'));
      return;
    }
    if (!Number.isFinite(chapterIdForApi)) return;

    setComposerSubmitting(true);
    try {
      await api.discussions.create({
        chapter_id: chapterIdForApi,
        type: 'text',
        content: text,
        moment: 0,
        parent_id: null,
      });
      toast.success(t('discussionPosted'));
      setComposerText('');
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
        moment: momentSource ?? 0,
        parent_id: Number(parentId),
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
                  {videoSrc ? (
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
                            <iframe
                              src={videoSrc}
                              className="aspect-video w-full"
                              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; web-share"
                              allowFullScreen
                              frameBorder="0"
                              scrolling="no"
                            />
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
                      onClick={() => setComposerOpen((o) => !o)}
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

                <div className="min-w-0 md:flex md:justify-center md:px-1">
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
                </div>

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
              <div className="border-t border-slate-800/80 bg-[#050915] px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-5 sm:pt-1">
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
                      <span />
                      <button
                        type="button"
                        onClick={() => void submitComposer()}
                        disabled={composerSubmitting}
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
                .map((d, i) => <DiscussionNode key={discussionKey(d, i)} discussion={d} />)
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
  );

  function DiscussionNode({ discussion, isReply = false }: { discussion: WatchDiscussionItem; isReply?: boolean }) {
    const d = discussion;
    const content = discussionContent(d);
    const author = discussionAuthorName(d) ?? t('anonymousUser');
    const created = formatDiscussionTime(discussionCreatedAt(d), locale);
    const momentSec = discussionMoment(d);
    const momentLabel = formatMomentSeconds(momentSec);
    const typeTag = discussionTypeLabel(d);
    const isQuestion = typeTag === 'question';
    const replies = discussionReplies(d);

    const jump = () => {
      // jump logic
    };

    return (
      <article
        className={`${
          isReply
            ? 'mt-4 rounded-xl bg-slate-800/30 p-4 ring-1 ring-white/5 shadow-sm transition-all hover:bg-slate-800/40'
            : 'rounded-xl border border-slate-700/80 bg-slate-900/50 p-3.5 shadow-sm sm:p-4'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex shrink-0 items-center justify-center rounded-full bg-[#2D43D1] font-bold text-white shadow-inner ${
                isReply ? 'size-9 text-[11px]' : 'size-10 text-xs'
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
              {!isReply && typeTag ? (
                <span
                  className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    isQuestion ? 'bg-orange-500/20 text-orange-300' : 'bg-[#2D43D1]/25 text-[#93B4FF]'
                  }`}
                >
                  {isQuestion ? t('badgeQuestion') : t('badgeComment')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <p className={`mt-3 leading-relaxed text-slate-300 ${isReply ? 'text-[13px]' : 'text-sm'}`}>{content}</p>

        <div className="mt-4 flex items-center gap-4">
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
                onClick={() => void submitReply(d.id!, d.attributes?.moment)}
                disabled={replySubmitting || !replyText.trim()}
                className="rounded-md bg-[#2D43D1] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
              >
                {replySubmitting ? <Loader2 className="size-3 animate-spin" /> : t('postReply')}
              </button>
            </div>
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-5 border-s-2 border-slate-700/30 ps-4 sm:ps-6 ml-2 sm:ml-4">
            {replies.map((r, ri) => (
              <DiscussionNode key={discussionKey(r, ri)} discussion={r} isReply={true} />
            ))}
          </div>
        )}
      </article>
    );
  }
}
