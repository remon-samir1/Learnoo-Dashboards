'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, ThumbsUp, MoreVertical, Trash2 } from 'lucide-react';
import { useComments, useDeleteComment } from '@/src/hooks/useComments';
import type { Comment, Post } from '@/src/types';
import { useAuth } from '@/src/stores/authStore';

interface StudentCommunityPostCommentsProps {
  postId: string | number;
  commentsCount: number;
  readOnly?: boolean;
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
}: StudentCommunityPostCommentsProps) {
  const t = useTranslations('community');
  const { user: currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const { mutate: deleteComment, isLoading: isDeleting } = useDeleteComment();

  const { data: comments, isLoading: commentsLoading } = useComments(
    typeof postId === 'string' ? parseInt(postId, 10) : postId,
    { enabled: expanded }
  );

  const handleDelete = (commentId: number) => {
    if (isDeleting) return;
    deleteComment(commentId);
  };

  const canDeleteComment = (comment: Comment): boolean => {
    if (!currentUser) return false;
    const commentUserId = comment.attributes.user?.data?.id;
    return commentUserId === currentUser.id;
  };

  const displayComments = comments ?? [];

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
              ? t('posts.hideComments', { count: commentsCount })
              : t('posts.showComments', { count: commentsCount })}
          </span>
        </button>
      )}

      {/* Comments list */}
      {expanded && (
        <div className="mt-4 space-y-3">
          {commentsLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="size-5 animate-spin rounded-full border-2 border-[#2137D6] border-t-transparent" />
            </div>
          ) : displayComments.length === 0 ? (
            <p className="text-sm text-[#64748B] italic">
              {t('posts.noCommentsYet')}
            </p>
          ) : (
            <ul className="space-y-3">
              {displayComments.map((comment) => {
                const commentUser = comment.attributes.user?.data?.attributes;
                const userInitial =
                  commentUser?.first_name?.[0] ||
                  commentUser?.full_name?.[0] ||
                  '?';
                const userName =
                  commentUser?.full_name ||
                  commentUser?.first_name ||
                  t('posts.unknownUser');
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

                return (
                  <li
                    key={comment.id}
                    className={`flex gap-3 rounded-xl p-3 ${
                      instructor
                        ? 'bg-amber-50/50'
                        : 'bg-[#F8FAFC]'
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
                          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                            {t('posts.instructorBadge')}
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
                    </div>
                    {!readOnly && canDeleteComment(comment) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(typeof comment.id === 'string' ? parseInt(comment.id, 10) : comment.id)}
                        disabled={isDeleting}
                        className="shrink-0 rounded p-1 text-[#94A3B8] hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        aria-label={t('posts.deleteComment')}
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