'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, ThumbsUp as LikeIcon, Trash2, Edit2, Loader2, Check, X } from 'lucide-react';
import { useComments, useDeleteComment } from '@/src/hooks/useComments';
import { useReactToPost, useUpdatePost } from '@/src/hooks/usePosts';
import { useAuth } from '@/src/stores/authStore';

interface ModeratorPostCommentsProps {
    postId: string | number;
    commentsCount: number;
    readOnly?: boolean;
    onRefresh?: () => void | Promise<void>;
    expanded: boolean;
    onToggleExpanded: () => void;
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

export default function ModeratorPostComments({
    postId,
    commentsCount,
    readOnly = false,
    onRefresh,
    expanded,
    onToggleExpanded,
}: ModeratorPostCommentsProps) {
    const t = useTranslations('courses.studentCommunity');
    const tActions = useTranslations('community.posts.actions');
    const { user: currentUser } = useAuth();

    const { mutateAsync: deleteComment, isLoading: isDeleting } = useDeleteComment();
    const { mutateAsync: updatePost, isLoading: isUpdating } = useUpdatePost();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState<string>('');

    const { data: commentsResponse, isLoading: commentsLoading, refetch: refetchComments } = useComments(
        typeof postId === 'string' ? parseInt(postId, 10) : postId,
        { enabled: expanded }
    );

    const handleDelete = async (commentId: number) => {
        if (isDeleting) return;
        if (!confirm(tActions('delete') + ' ?')) return;
        try {
            await deleteComment(commentId);
            await refetchComments();
            if (onRefresh) await onRefresh();
        } catch {
            // toast handled
        }
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
        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
            {/* Comments header with toggle */}
            <button
                type="button"
                onClick={onToggleExpanded}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#64748B] hover:text-[#2137D6] transition-colors self-start mb-2"
            >
                <MessageSquare className="size-[16px] shrink-0" aria-hidden />
                <span>
                    {commentsCount || 0} {expanded ? tActions('hideComments') : tActions('showComments')}
                </span>
            </button>

            {/* Comments list */}
            {expanded && (
                <div className="space-y-4">
                    {commentsLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="size-5 animate-spin text-[#2137D6]" />
                        </div>
                    ) : displayComments.length == 0 ? (
                        <p className="text-sm text-[#64748B] italic text-center py-2">
                            {t('noCommentsYet')}
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
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

                                const displayElement = (
                                    <div
                                        key={comment.id}
                                        className={`group flex gap-4 rounded-xl p-4 transition-colors border ${instructor
                                            ? 'bg-[#F0F9FF] border-[#E0F2FE]'
                                            : 'bg-[#F8FAFC] border-[#F1F5F9]'
                                            }`}
                                    >
                                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${instructor ? 'bg-[#1E3A8A] text-white shadow-sm shadow-blue-200' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                                            {userInitial}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="text-[13px] font-bold text-[#1E293B]">
                                                    {userName}
                                                </span>
                                                {instructor && (
                                                    <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#1D4ED8] text-[9px] font-bold uppercase tracking-wide">
                                                        {commentUser?.role}
                                                    </span>
                                                )}
                                                {commentDate && (
                                                    <span className="text-[11px] font-semibold text-[#94A3B8]">
                                                        · {commentDate}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[13px] leading-relaxed text-[#475569]">
                                                {comment.attributes.content}
                                            </p>

                                            {!readOnly && (
                                                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingId(cId);
                                                            setEditContent(comment.attributes.content || '');
                                                        }}
                                                        disabled={isDeleting || isUpdating}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] text-[11px] font-bold transition-all disabled:opacity-50"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                        {tActions('edit')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(cId)}
                                                        disabled={isDeleting || isUpdating}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-[11px] font-bold transition-all disabled:opacity-50"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        {tActions('delete')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );

                                return editingId === cId ? (
                                    <div key={comment.id} className="flex gap-4 rounded-xl p-4 bg-white border border-[#E2E8F0]">
                                        <div className="flex-1 w-full">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full rounded-xl border border-[#E2E8F0] p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all resize-none"
                                                rows={2}
                                                autoFocus
                                                placeholder="Edit comment..."
                                            />
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    disabled={!editContent.trim() || isUpdating}
                                                    onClick={async () => {
                                                        if (!editContent.trim()) return;
                                                        try {
                                                            await updatePost(cId, { content: editContent.trim() });
                                                            setEditingId(null);
                                                            await refetchComments();
                                                            if (onRefresh) await onRefresh();
                                                        } catch { }
                                                    }}
                                                    className="px-4 py-2 text-xs font-bold bg-[#2137D6] hover:bg-[#1a2bb3] shadow-sm shadow-blue-200 text-white rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditContent('');
                                                    }}
                                                    disabled={isUpdating}
                                                    className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-xs font-bold rounded-xl transition-all"
                                                >
                                                    <X className="w-4 h-4 inline-block -mt-0.5" /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : displayElement;
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
