'use client';

import { ExternalLink, Globe, Loader2, MessageSquare, Plus, Reply, ThumbsUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import StudentCommunityCreatePostModal from '@/components/student/community/StudentCommunityCreatePostModal';
import { communityPostRelativeTime, communityPostTypeBadgeClasses } from '@/src/lib/community-post-display';
import { pickPostImageUrl } from '@/src/lib/community-post-media';
import { useCreateComment } from '@/src/hooks/useComments';
import { useCreatePost, usePosts, useReactToPost } from '@/src/hooks/usePosts';
import { useSocialLinks } from '@/src/hooks/useSocialLinks';
import type { CreatePostRequest, Post, SocialLink } from '@/src/types';

const POST_TIME_AGO_PREFIX = 'community.posts.timeAgo';

type FeedTab = 'all' | 'post' | 'summary' | 'question';

function isTopLevelPublishedPost(p: Post): boolean {
  const pid = p.attributes.parent_id;
  if (pid != null && pid !== 0) return false;
  return p.attributes.status === 'published';
}

function isLikelyInstructorRole(role: string | undefined): boolean {
  if (!role?.trim()) return false;
  const r = role.trim().toLowerCase();
  return (
    r.includes('instructor') ||
    r.includes('doctor') ||
    r.includes('teacher') ||
    r.includes('faculty') ||
    r === 'admin'
  );
}

function SocialLinkCard({ link, joinLabel }: { link: SocialLink; joinLabel: string }) {
  const bg = link.attributes.color?.trim() || '#16A34A';
  const href = link.attributes.link?.trim();
  const inactive = link.attributes.status === false;

  const inner = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: link.attributes.icon ? 'transparent' : bg }}
        >
          {link.attributes.icon ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote API icon URLs
            <img src={link.attributes.icon} alt="" className="size-full object-cover" />
          ) : (
            <Globe className="size-5 text-white" aria-hidden />
          )}
        </div>
        <ExternalLink className="size-4 shrink-0 text-white/90" aria-hidden />
      </div>
      <h3 className="mb-1 text-[15px] font-bold text-white">{link.attributes.title}</h3>
      {link.attributes.subtitle?.trim() ? (
        <p className="mb-1 text-[13px] text-white/90">{link.attributes.subtitle}</p>
      ) : null}
      <p className="mb-0 text-[13px] text-white/80">{joinLabel}</p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex min-h-[140px] flex-col rounded-2xl p-6 text-start shadow-md transition hover:opacity-95 ${inactive ? 'pointer-events-none opacity-60' : ''}`}
        style={{ backgroundColor: bg }}
      >
        {inner}
      </a>
    );
  }

  return (
    <div
      className={`flex min-h-[140px] flex-col rounded-2xl p-6 ${inactive ? 'opacity-60' : 'opacity-80'}`}
      style={{ backgroundColor: bg }}
    >
      {inner}
    </div>
  );
}

export default function StudentCommunityFeed() {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations();
  const tPage = useTranslations('courses.studentCommunity');
  const { data: postsRaw, isLoading: postsLoading, error: postsError, refetch: refetchPosts } = usePosts();
  const { data: socialRaw, isLoading: socialLoading, error: socialError } = useSocialLinks();
  const { mutate: createPost, isLoading: isCreating } = useCreatePost();
  const { mutate: createComment, isLoading: isReplying } = useCreateComment();
  const { mutate: reactToPost } = useReactToPost();

  const [tab, setTab] = useState<FeedTab>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Post | null>(null);
  const [reactingId, setReactingId] = useState<string | null>(null);

  const socialLinks = useMemo(() => socialRaw ?? [], [socialRaw]);

  const topPosts = useMemo(() => {
    const list = postsRaw ?? [];
    const roots = list.filter(isTopLevelPublishedPost);
    return [...roots].sort((a, b) => {
      const ta = new Date(a.attributes.created_at || 0).getTime();
      const tb = new Date(b.attributes.created_at || 0).getTime();
      return tb - ta;
    });
  }, [postsRaw]);

  const filteredPosts = useMemo(() => {
    if (tab === 'all') return topPosts;
    return topPosts.filter((p) => p.attributes.type === tab);
  }, [topPosts, tab]);

  const tabs = useMemo(
    () =>
      [
        { key: 'all' as const, label: tPage('tabAll') },
        { key: 'post' as const, label: tPage('tabPosts') },
        { key: 'summary' as const, label: tPage('tabSummaries') },
        { key: 'question' as const, label: tPage('tabQuestions') },
      ],
    [tPage],
  );

  const timeLabel = useCallback(
    (iso: string) => communityPostRelativeTime(iso, t, POST_TIME_AGO_PREFIX),
    [t],
  );

  const handleCreate = useCallback(
    async (payload: CreatePostRequest) => {
      try {
        await createPost(payload);
        setModalOpen(false);
        setReplyTarget(null);
        toast.success(tPage('toastCreated'));
        await refetchPosts();
      } catch {
        toast.error(tPage('toastCreateFailed'));
      }
    },
    [createPost, refetchPosts, tPage],
  );

  const handleSubmitReply = useCallback(
    async (parentId: string, payload: { content: string; tags?: string[] }) => {
      const pid = Number.parseInt(parentId, 10);
      if (!Number.isFinite(pid)) {
        toast.error(tPage('toastReplyFailed'));
        return;
      }
      try {
        await createComment(pid, {
          content: payload.content,
          ...(payload.tags?.length ? { tags: payload.tags } : {}),
        });
        setModalOpen(false);
        setReplyTarget(null);
        toast.success(tPage('toastReplyCreated'));
        await refetchPosts();
      } catch {
        toast.error(tPage('toastReplyFailed'));
      }
    },
    [createComment, refetchPosts, tPage],
  );

  const openCreateModal = useCallback(() => {
    setReplyTarget(null);
    setModalOpen(true);
  }, []);

  const openReplyModal = useCallback((post: Post) => {
    setReplyTarget(post);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isCreating || isReplying) return;
    setModalOpen(false);
    setReplyTarget(null);
  }, [isCreating, isReplying]);

  const handleReact = useCallback(
    async (post: Post) => {
      const id = String(post.id);
      setReactingId(id);
      try {
        await reactToPost(parseInt(id, 10), { type: 'like' });
        await refetchPosts();
      } catch {
        toast.error(tPage('toastReactFailed'));
      } finally {
        setReactingId(null);
      }
    },
    [reactToPost, refetchPosts, tPage],
  );

  const modalReplyTarget = useMemo(
    () =>
      replyTarget
        ? { id: String(replyTarget.id), title: replyTarget.attributes.title }
        : null,
    [replyTarget],
  );

  return (
    <div className="w-full pb-12 pt-2" dir={dir}>
      <header className="mb-8 max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl">{tPage('pageTitle')}</h1>
        <p className="mt-2 text-sm text-[#64748B] sm:text-base">{tPage('pageSubtitle')}</p>
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-bold text-[#1E293B]">{tPage('socialSectionTitle')}</h2>
        {socialLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-8 animate-spin text-[#2137D6]" />
          </div>
        ) : socialError ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{tPage('socialError')}</p>
        ) : socialLinks.length === 0 ? (
          <p className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-8 text-center text-sm text-[#64748B]">
            {tPage('socialEmpty')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {socialLinks.map((link) => (
              <SocialLinkCard key={link.id} link={link} joinLabel={tPage('socialJoinCta')} />
            ))}
          </div>
        )}
      </section>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-max flex-nowrap items-center gap-2 border-b border-[#E5E7EB]">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition sm:px-4 ${
                  tab === item.key
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3]"
        >
          <Plus className="size-4" aria-hidden />
          {tPage('createPost')}
        </button>
      </div>

      {postsError ? (
        <p className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">{tPage('postsError')}</p>
      ) : null}

      {postsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-10 animate-spin text-[#2137D6]" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="rounded-xl border border-[#E5E7EB] bg-white px-6 py-12 text-center text-sm text-[#64748B]">
          {tPage('postsEmpty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-5">
          {filteredPosts.map((post) => {
            const user = post.attributes.user?.data.attributes;
            const userInitial = user?.first_name?.[0] || user?.full_name?.[0] || '?';
            const userName = user?.full_name || user?.first_name || t('community.posts.unknownUser');
            const instructor = isLikelyInstructorRole(user?.role);
            const typeKey = post.attributes.type;
            const typeLabel = t(`community.posts.type.${typeKey}`);
            const comments = post.attributes.comments_count ?? 0;
            const reactions = post.attributes.reactions_count ?? 0;
            const liked = Boolean(post.attributes.user_reaction);
            const tags = post.attributes.tags ?? [];
            const postImageSrc = pickPostImageUrl(post.attributes);

            const cardTone = instructor
              ? 'border-amber-200 bg-amber-50/90'
              : 'border-[#E2E8F0] bg-white';

            return (
              <li key={post.id} className={`rounded-2xl border p-6 shadow-sm ${cardTone}`}>
                <div className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[15px] font-bold text-[#2137D6]">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      <span className="text-[15px] font-bold text-[#1E293B]">{userName}</span>
                      {instructor ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                          {tPage('badgeInstructor')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                          {tPage('badgeStudent')}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[#94A3B8]">
                        · {timeLabel(post.attributes.created_at || '')}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${communityPostTypeBadgeClasses(typeKey)}`}
                      >
                        {typeLabel}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-[#0F172A] sm:text-[17px]">{post.attributes.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">
                      {post.attributes.content}
                    </p>

                    {postImageSrc ? (
                      <div className="relative mt-4 max-h-80 w-full overflow-hidden rounded-xl border border-[#E2E8F0]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote API URLs */}
                        <img
                          src={postImageSrc}
                          alt=""
                          className="max-h-80 w-full object-contain"
                        />
                      </div>
                    ) : null}

                    {tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#64748B]">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-4 sm:gap-6">
                      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#64748B]">
                        <MessageSquare className="size-[18px] shrink-0" aria-hidden />
                        {tPage('commentsCount', { count: comments })}
                      </span>
                      <button
                        type="button"
                        onClick={() => openReplyModal(post)}
                        disabled={isCreating || isReplying}
                        className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-semibold text-[#2137D6] transition hover:bg-[#EEF2FF] hover:text-[#1a2bb3] disabled:opacity-50"
                      >
                        <Reply className="size-[18px] shrink-0 rtl:scale-x-[-1]" aria-hidden />
                        {tPage('addComment')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReact(post)}
                        disabled={reactingId !== null}
                        className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-semibold transition ${
                          liked ? 'text-[#2137D6]' : 'text-[#64748B] hover:text-[#1E293B]'
                        } disabled:opacity-50`}
                        aria-pressed={liked}
                        aria-label={tPage('like')}
                      >
                        <ThumbsUp
                          className="size-[18px] shrink-0"
                          strokeWidth={2}
                          fill={liked ? 'currentColor' : 'none'}
                          aria-hidden
                        />
                        <span>{reactions}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <StudentCommunityCreatePostModal
        open={modalOpen}
        onClose={closeModal}
        isSubmitting={isCreating || isReplying}
        replyTarget={modalReplyTarget}
        onSubmitPost={handleCreate}
        onSubmitReply={handleSubmitReply}
      />
    </div>
  );
}
