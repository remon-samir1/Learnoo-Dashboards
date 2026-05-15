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
  MessageCircle,
  Play,
  Send,
} from 'lucide-react';
import type { ErrorDetails } from 'hls.js';
import toast from 'react-hot-toast';
import type { Chapter, Quiz } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import { quizStudentMustActivateOrReactivate } from '@/src/lib/student-quiz-activation-lock';
import { buildStudentStartExamHref } from '@/src/lib/student-start-exam-href';
import { useChapterViewRecording } from '@/src/hooks/useChapterViewRecording';
import {
  discussionAuthorName,
  discussionContent,
  discussionCreatedAt,
  discussionKey,
  discussionMoment,
  discussionTypeLabel,
  normalizeDiscussions,
} from '@/components/student/watch/watchChapterDiscussionUtils';
import { HlsVideoPlayer } from '@/components/student/watch/HlsVideoPlayer';
import { pickChapterStreams } from '@/src/lib/chapter-playback-urls';
import type { WatermarkResolution } from '@/src/lib/watermark-from-features';
import {
  coerceCanWatchExplicitTrue,
  isStudentChapterPdfVisible,
  isStudentChapterVideoPlayable,
} from '@/src/lib/student-chapter-access';

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
  const [playbackSec, setPlaybackSec] = useState(0);
  const [composerText, setComposerText] = useState('');
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [clientPlaybackBlocked, setClientPlaybackBlocked] = useState(false);
  const [playbackBlockMessage, setPlaybackBlockMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const composerTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const chapterIdValid = chapterId.trim().length > 0;
  const chapterNumericId = Number.parseInt(chapterId, 10);
  const chapterIdForApi = Number.isFinite(chapterNumericId) ? chapterNumericId : NaN;

  const { primarySrc: videoSrc, mp4FallbackUrl } = useMemo(() => {
    if (!chapter) return { primarySrc: '', mp4FallbackUrl: '' };
    const attrs = chapter.attributes;
    const cid = Number.parseInt(String(chapter.id), 10);
    return pickChapterStreams(Number.isFinite(cid) ? cid : 0, {
      video: attrs.video,
      playlist: attrs.playlist,
      video_hls_url: attrs.video_hls_url,
      video_mp4_url: attrs.video_mp4_url,
    });
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

  const discussions = useMemo(
    () => (chapter ? normalizeDiscussions(chapter.attributes.discussions) : []),
    [chapter]
  );

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

  const momentForPost = useMemo(() => {
    if (!videoSrc) return 0;
    const s = playbackSec;
    if (!Number.isFinite(s) || s < 0) return 0;
    return Math.floor(s);
  }, [playbackSec, videoSrc]);

  const momentDisplay = useMemo(() => {
    const label = formatMomentSeconds(momentForPost);
    return label ? t('composerMomentLabel', { time: label }) : null;
  }, [momentForPost, t]);

  const viewByMinute = useMemo(
    () => Math.max(0, Number(chapter?.attributes?.view_by_minute ?? 0) || 0),
    [chapter]
  );

  const accessDenied = watchAccessDenied || clientPlaybackBlocked;

  useEffect(() => {
    setClientPlaybackBlocked(false);
    setPlaybackBlockMessage(null);
  }, [chapterId]);

  useEffect(() => {
    if (!pdfPanelVisible) setShowPdf(false);
  }, [pdfPanelVisible]);

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

  const onViewRecordError = useCallback(
    (message: string) => {
      setClientPlaybackBlocked(true);
      setPlaybackBlockMessage(message);
      toast.error(message);
      router.refresh();
    },
    [router]
  );

  const onFatalPlaybackError = useCallback(
    (info: { reason: string; hlsDetails?: ErrorDetails }) => {
      console.error('[ChapterWatchView] Fatal HLS playback:', info.reason, info.hlsDetails ?? '');
      toast.error(t('hlsPlaybackError'));
    },
    [t]
  );

  useChapterViewRecording({
    chapterId: chapterIdForApi,
    videoRef,
    videoSrc,
    viewByMinute,
    enabled: Number.isFinite(chapterIdForApi) && Boolean(videoSrc) && !accessDenied,
    onViewRecordError,
  });

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc || accessDenied) return;
    const onTime = () => setPlaybackSec(el.currentTime || 0);
    el.addEventListener('timeupdate', onTime);
    onTime();
    return () => el.removeEventListener('timeupdate', onTime);
  }, [videoSrc, chapterId, accessDenied]);

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
        moment: momentForPost,
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

  return (
    <div
      className="min-h-screen overflow-x-clip bg-[#0b1426] pb-28 text-slate-100 [-webkit-tap-highlight-color:transparent] sm:pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]"
      dir={dir}
    >
      <div className="mx-auto w-full max-w-6xl px-6 pt-2 pb-1 sm:px-6 sm:pb-2 sm:pt-6 lg:px-8">
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
            {pdfUrl && pdfPanelVisible ? (
              <button
                type="button"
                onClick={() => setShowPdf((v) => !v)}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10 active:bg-white/15 sm:min-h-0 sm:w-auto sm:bg-transparent sm:px-4 sm:py-2 sm:text-sm"
              >
                <FileText className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{showPdf ? t('hidePdf') : t('showPdf')}</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative left-1/2 w-screen max-w-[100dvw] -translate-x-1/2 [overscroll-behavior-x:contain] sm:static sm:left-auto sm:w-full sm:max-w-none sm:translate-x-0">
        <div className="mx-auto w-full max-w-6xl sm:px-6 lg:px-8">
          <div className="overflow-hidden border-y border-slate-700 bg-[#070d18] shadow-xl sm:rounded-2xl sm:border sm:border-slate-700">
            <div className={`grid gap-0 ${showPdf && pdfUrl && pdfPanelVisible ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              <div className="border-slate-700 bg-black/50 lg:border-e lg:border-slate-700">
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
                    <HlsVideoPlayer
                      id="watch-chapter-video"
                      key={`${videoSrc}|${mp4FallbackUrl}`}
                      ref={videoRef}
                      src={videoSrc}
                      mp4FallbackUrl={mp4FallbackUrl}
                      switchingPlaybackLabel={t('switchingPlaybackMethod')}
                      showCustomControls
                      playsInline
                      className="aspect-video w-full object-contain"
                      preload="metadata"
                      onFatalPlaybackError={onFatalPlaybackError}
                      initialWatermarkResolution={initialWatermarkResolution ?? null}
                      staticOverlaySubtitle={lectureTitle.trim() || attrs.title?.trim() || undefined}
                    >
                      {tDetails('watchNoVideo')}
                    </HlsVideoPlayer>
                  )
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center gap-3 bg-slate-950 px-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-[#2D43D1]/90 text-white">
                      <Play className="size-8 translate-x-0.5" fill="currentColor" />
                    </div>
                    <p className="text-sm font-medium text-slate-300">{attrs.title}</p>
                    <p className="text-xs text-slate-500">{tDetails('watchNoVideo')}</p>
                  </div>
                )}
              </div>

              {showPdf && pdfUrl && pdfPanelVisible ? (
                <div className="flex min-h-[280px] flex-col border-t border-slate-700 bg-white lg:min-h-0 lg:border-t-0">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-800">{t('lectureMaterial')}</span>
                  </div>
                  <div className="relative min-h-[240px] flex-1 bg-slate-100 lg:min-h-[320px]">
                    <iframe
                      title={t('lectureMaterial')}
                      src={pdfUrl}
                      className="absolute inset-0 h-full w-full border-0"
                    />
                    <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-center text-[11px] text-slate-500">
                      {t('pdfSyncHint')}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Under video: stacked on small screens; desktop = one row like design (Ask | Lecture parts inline | Discussions). */}
            <div className="border-t border-slate-800/80 bg-[#050915] px-0 py-0 sm:px-6 sm:py-3.5">
              <div className="flex flex-col gap-3 px-7 pb-7 pt-7 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-5 md:py-3.5 md:pb-3.5 md:pt-3.5 lg:gap-6 lg:px-6">
                <div className="flex justify-stretch max-md:-mx-7 max-md:border-b max-md:border-slate-800/90 md:min-w-0 md:justify-start">
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
                  <button
                    type="button"
                    onClick={() => setDiscussionsOpen((o) => !o)}
                    className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-slate-600/90 bg-slate-800/90 px-8 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:bg-slate-800/80 max-md:px-12 md:inline-flex md:min-h-0 md:w-auto md:shrink-0 md:px-5 md:py-2.5"
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

            {Number.isFinite(chapterIdForApi) && composerOpen ? (
              <div className="border-t border-slate-800/80 bg-[#050915] px-7 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 sm:px-6 sm:pb-5 sm:pt-1">
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
                      {momentDisplay ? (
                        <span className="rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300">
                          {momentDisplay}
                        </span>
                      ) : (
                        <span />
                      )}
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
                .map((d, i) => {
                  const content = discussionContent(d);
                  const author = discussionAuthorName(d) ?? t('anonymousUser');
                  const created = formatDiscussionTime(discussionCreatedAt(d), locale);
                  const momentSec = discussionMoment(d);
                  const momentLabel = formatMomentSeconds(momentSec);
                  const typeTag = discussionTypeLabel(d);
                  const isQuestion = typeTag === 'question';

                  const jump = () => {
                    if (momentSec == null || !videoRef.current) return;
                    const el = videoRef.current;
                    el.currentTime = Math.min(momentSec, el.duration || momentSec);
                    void el.play().catch(() => { });
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  };

                  return (
                    <article
                      key={discussionKey(d, i)}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3.5 shadow-sm sm:p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#2D43D1] text-xs font-bold text-white">
                            {author
                              .split(/\s+/)
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join('') || '•'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-100">
                              {author}
                              {created ? (
                                <span className="font-normal text-slate-500"> • {created}</span>
                              ) : null}
                            </p>
                            {typeTag ? (
                              <span
                                className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isQuestion
                                  ? 'bg-orange-500/20 text-orange-300'
                                  : 'bg-[#2D43D1]/25 text-[#93B4FF]'
                                  }`}
                              >
                                {isQuestion ? t('badgeQuestion') : t('badgeComment')}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {momentSec != null && videoSrc && !accessDenied ? (
                          <button
                            type="button"
                            onClick={jump}
                            className="-me-1 min-h-[44px] shrink-0 px-2 py-2 text-xs font-semibold text-[#5B8DEF] hover:underline sm:me-0 sm:min-h-0 sm:px-0 sm:py-0"
                          >
                            {t('jumpToTime')}
                            {momentLabel ? (
                              <span className="ms-1 text-slate-500">({momentLabel})</span>
                            ) : null}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">{content}</p>
                    </article>
                  );
                })
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
}
