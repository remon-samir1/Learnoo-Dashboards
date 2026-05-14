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
  MessageCircle,
  Play,
  Send,
} from 'lucide-react';
import type { ErrorDetails } from 'hls.js';
import toast from 'react-hot-toast';
import type { Chapter, Quiz } from '@/src/types';
import { api, ApiError } from '@/src/lib/api';
import { quizRequiresCourseActivationLock } from '@/src/lib/student-quiz-activation-lock';
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
}: {
  chapterId: string;
  chapter: Chapter | null;
  loadError: string | null;
  lectureChapters: Chapter[];
  lectureTitle: string;
  /** Server says `can_watch` is false — user cannot use this chapter URL to stream. */
  watchAccessDenied: boolean;
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
    return quizRequiresCourseActivationLock(examQuiz.attributes as unknown as Record<string, unknown>);
  }, [examQuiz]);

  const backHref = useMemo(() => {
    const courseId = chapter?.attributes?.course_id;
    if (courseId != null && String(courseId).trim() !== '') {
      return `/${locale}/student/courses/course-details/${courseId}`;
    }
    return `/${locale}/student/courses`;
  }, [chapter, locale]);

  const viewsBadge = useMemo(() => {
    if (!chapter) return null;
    const maxViews = chapter.attributes.max_views;
    const current = chapter.attributes.current_user_views;
    if (maxViews != null && maxViews > 0) {
      const remaining = Math.max(0, maxViews - current);
      return t('viewsLeftBadge', { remaining, max: maxViews });
    }
    return null;
  }, [chapter, t]);

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
    if (!Number.isFinite(chapterIdForApi) || watchAccessDenied) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await api.chapters.get(chapterIdForApi, { skipAuthRedirect: true });
        if (cancelled) return;
        if (res.data.attributes.can_watch === false) {
          setClientPlaybackBlocked(true);
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
    <div className="min-h-screen bg-[#0b1426] pb-10 text-slate-100" dir={dir}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={backHref}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {tDetails('watchBack')}
            </Link>
            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">{attrs.title}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {lectureTitle ? (
                <>
                  <span className="text-slate-300">{lectureTitle}</span>
                  <span className="mx-2 text-slate-600">•</span>
                </>
              ) : null}
              <span>{t('subtitleChapter', { number: currentPartIndex + 1 })}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {viewsBadge ? (
              <span className="rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200">
                {viewsBadge}
              </span>
            ) : null}
            {pdfUrl ? (
              <button
                type="button"
                onClick={() => setShowPdf((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <FileText className="size-4" aria-hidden />
                {showPdf ? t('hidePdf') : t('showPdf')}
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#070d18] shadow-xl">
          <div className={`grid gap-0 ${showPdf && pdfUrl ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
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
                    controls
                    playsInline
                    className="aspect-video w-full object-contain"
                    preload="metadata"
                    onFatalPlaybackError={onFatalPlaybackError}
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

            {showPdf && pdfUrl ? (
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

          {/* Figma: single toolbar row under video — Ask | Lecture Parts | Discussions */}
          <div className="border-t border-slate-800/80 bg-[#050915] px-3 py-3 sm:px-5 sm:py-3.5">
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-3">
              <div className="flex justify-start md:min-w-0">
                {Number.isFinite(chapterIdForApi) ? (
                  <button
                    type="button"
                    onClick={() => setComposerOpen((o) => !o)}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition sm:px-5 ${
                      composerOpen
                        ? 'bg-[#2436b0] ring-2 ring-white/20'
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

              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 md:justify-center">
                <span className="text-sm font-normal text-slate-400">{t('lecturePartsToolbar')}</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {partChapters.map((ch, idx) => {
                    const active = String(ch.id) === String(chapterId);
                    const href = `/${locale}/student/courses/watch/${ch.id}`;
                    return (
                      <Link
                        key={ch.id}
                        href={href}
                        prefetch
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? 'bg-[#2D43D1] text-white'
                            : 'border border-slate-700/80 bg-slate-800/90 text-white hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        {t('partLabel', { number: idx + 1 })}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end md:min-w-0">
                <button
                  type="button"
                  onClick={() => setDiscussionsOpen((o) => !o)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 md:inline-flex md:w-auto"
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
            <div className="border-t border-slate-800/80 bg-[#050915] px-3 pb-4 pt-1 sm:px-5 sm:pb-5">
              <div className="flex gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800 sm:h-14 sm:w-14">
                  <Image src={chapterThumb} alt="" fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <textarea
                    ref={composerTextareaRef}
                    rows={2}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    disabled={composerSubmitting}
                    placeholder={t('composerPlaceholder')}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950/90 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#2D43D1] focus:outline-none focus:ring-1 focus:ring-[#2D43D1] disabled:opacity-60"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {momentDisplay ? (
                      <span className="rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                        {momentDisplay}
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => void submitComposer()}
                      disabled={composerSubmitting}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#2D43D1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2436b0] disabled:opacity-50"
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

        {discussionsOpen ? (
          <section className="mt-6 space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              {t('discussionsHeading')}
            </h2>
            {discussions.length === 0 ? (
              <p className="rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-400">
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
                    void el.play().catch(() => {});
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  };

                  return (
                    <article
                      key={discussionKey(d, i)}
                      className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4 shadow-sm"
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
                                className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                                  isQuestion
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
                            className="shrink-0 text-xs font-semibold text-[#5B8DEF] hover:underline"
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
          <div className="mt-6 flex flex-col items-stretch justify-between gap-3 overflow-hidden rounded-2xl border border-[#5c3d28]/80 bg-[#3d2818] px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
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
