'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, ThumbsUp as LikeIcon, Trash2, Loader2 } from 'lucide-react';
import { useComments, useDeleteComment } from '@/src/hooks/useComments';
import { useReactToPost } from '@/src/hooks/usePosts';
import { useAuth } from '@/src/stores/authStore';

interface StudentCommunityPostCommentsProps {
  postId: string | number;
  commentsCount: number;
  readOnly?: boolean;
  onRefresh?: () => void | Promise<void>;
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

export default function StudentCommunityPostComments({
  postId,
  commentsCount,
  readOnly = false,
  onRefresh,
}: StudentCommunityPostCommentsProps) {
  const t = useTranslations('courses.studentCommunity');
  const { user: currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { mutateAsync: deleteComment, isLoading: isDeleting } = useDeleteComment();
  const { mutateAsync: reactToPost } = useReactToPost();
  const [reactingId, setReactingId] = useState<number | null>(null);

  const { data: commentsResponse, isLoading: commentsLoading, refetch: refetchComments } = useComments(
    typeof postId === 'string' ? parseInt(postId, 10) : postId,
    { enabled: expanded }
  );

  const handleDelete = async (commentId: number) => {
    if (isDeleting) return;
    try {
      await deleteComment(commentId);
      await refetchComments();
      if (onRefresh) await onRefresh();
    } catch {
      // toast handled
    }
  };

  const handleReact = async (commentId: number, liked: boolean) => {
    setReactingId(commentId);
    try {
      await reactToPost(commentId, { type: 'like' });
      await refetchComments();
      if (onRefresh) await onRefresh();
    } catch {
      // toast handled
    } finally {
      setReactingId(null);
    }
  };

  const canDeleteComment = (comment: any): boolean => {
    if (!currentUser) return false;
    const commentUserId = comment.attributes.user?.data?.id;
    return String(commentUserId) === String(currentUser.id);
  };

  const commentsArray = Array.isArray(commentsResponse)
    ? commentsResponse
    : (commentsResponse as any)?.data ?? [];

  const displayComments = commentsArray.filter(
    (c: any) =>
      c.attributes?.type === 'post' &&
      c.attributes?.parent_id != null &&
      String(c.attributes.parent_id) === String(postId)
  );
  return (
    <div className="mt-5 border-t border-[#E2E8F0] pt-4">
      {/* Comments header with toggle */}
      {commentsCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B] hover:text-[#2137D6] transition-colors"
        >
          <MessageSquare className="size-[16px] shrink-0" aria-hidden />
          <span>
            {expanded
              ? t('hideComments', { count: commentsCount })
              : t('showComments', { count: commentsCount })}
          </span>
        </button>
      )}

      {/* Comments list */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-5 animate-spin text-[#2137D6]" />
            </div>
          ) : displayComments.length == 0 ? (
            <p className="text-sm text-[#64748B] italic">
              {t('noCommentsYet')}
            </p>
          ) : (
            <ul className="space-y-3">
              {displayComments.map((comment: any) => {
                const commentUser = comment.attributes.user?.data?.attributes;
                const userInitial =
                  commentUser?.first_name?.[0] ||
                  commentUser?.full_name?.[0] ||
                  '?';
                const userName =
                  commentUser?.full_name ||
                  commentUser?.first_name ||
                  t('unknownUser');
                const instructor = isLikelyInstructorRole(commentUser?.role);
                const commentDate = comment.attributes.created_at
                  ? new Date(comment.attributes.created_at).toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )
                  : '';

                const cId = typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id;
                const reactions = comment.attributes.reactions_count ?? 0;
                const liked = Boolean(comment.attributes.user_reaction);

                return (
                  <li
                    key={comment.id}
                    className={`group flex gap-3 rounded-xl p-3 transition-colors ${instructor
                      ? 'bg-amber-50/50 hover:bg-amber-50'
                      : 'bg-[#F8FAFC] hover:bg-[#F1F5F9]'
                      }`}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[13px] font-bold text-[#2137D6]">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-bold text-[#1E293B]">
                          {userName}
                        </span>
                        {instructor && (
                          <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-bold text-violet-700">
                            {t('instructorBadge')}
                          </span>
                        )}
                        {commentDate && (
                          <span className="text-[11px] text-[#94A3B8]">
                            · {commentDate}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-[#475569]">
                        {comment.attributes.content}
                      </p>

                      {!readOnly && (
                        <div className="mt-2 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleReact(cId, liked)}
                            disabled={reactingId === cId}
                            className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors ${liked ? 'text-[#2137D6]' : 'text-[#64748B] hover:text-[#1E293B]'
                              } disabled:opacity-50`}
                          >
                            <LikeIcon
                              className={`size-3.5 ${liked ? 'fill-current' : ''}`}
                              aria-hidden
                            />
                            <span>{reactions}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    {!readOnly && canDeleteComment(comment) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cId)}
                        disabled={isDeleting}
                        className="shrink-0 rounded p-1 text-[#94A3B8] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                        aria-label={t('deleteComment')}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}