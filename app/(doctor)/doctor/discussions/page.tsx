'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  MessageCircle,
  Trash2,
  Reply,
  Loader2,
  User,
  Clock,
  PlayCircle
} from 'lucide-react';
import { useDiscussions, useDeleteDiscussion, useCreateDiscussion } from '@/src/hooks/useDiscussions';
import toast from 'react-hot-toast';

export default function DoctorDiscussionsPage() {
  const t = useTranslations('discussions');
  const locale = useLocale();
  const { data: discussionsData, isLoading, refetch } = useDiscussions();
  const { mutate: deleteDiscussion, isLoading: isDeleting } = useDeleteDiscussion();
  const { mutate: createReply, isLoading: isReplying } = useCreateDiscussion();

  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState('');

  const discussionsTree = useMemo(() => {
    if (!discussionsData) return [];

    const flat = discussionsData;
    const map = new Map<string | number, any>();
    const roots: any[] = [];

    flat.forEach((d) => {
      map.set(String(d.id), { ...d, replies: [] });
    });

    flat.forEach((d) => {
      const parentId = d.attributes?.parent_id;
      if (parentId != null && map.has(String(parentId))) {
        const parent = map.get(String(parentId))!;
        parent.replies.push(map.get(String(d.id)) || d);
      } else {
        roots.push(map.get(String(d.id)) || d);
      }
    });

    return roots;
  }, [discussionsData]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('deleteConfirm'))) return;
    try {
      await deleteDiscussion(id);
      toast.success(t('notifications.deleted'));
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const handleReply = async (parentId: number, chapterId: number, moment?: number | null) => {
    if (!replyText.trim()) return;
    try {
      await createReply({
        chapter_id: chapterId,
        content: replyText,
        parent_id: parentId,
        type: 'text',
        moment: moment ?? undefined
      });
      toast.success(t('notifications.replied'));
      setReplyText('');
      setReplyingTo(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatMoment = (sec: number | null) => {
    if (sec == null) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">{t('pageTitle')}</h1>
        <p className="mt-0.5 text-sm text-[#64748B]">{t('pageDescription')}</p>
      </div>

      <div className="space-y-6">
        {discussionsTree.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-white py-12 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-[#94A3B8]" />
            <p className="mt-2 text-[#64748B]">{t('noDiscussions')}</p>
          </div>
        ) : (
          discussionsTree.map((discussion: any) => (
            <DiscussionNode
              key={discussion.id}
              discussion={discussion}
              isRoot={true}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              handleReply={handleReply}
              handleDelete={handleDelete}
              isReplying={isReplying}
              t={t}
              formatTime={formatTime}
              formatMoment={formatMoment}
            />
          ))
        )}
      </div>
    </div>
  );
}

const DiscussionNode = ({
  discussion,
  isRoot = false,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  handleReply,
  handleDelete,
  isReplying,
  t,
  formatTime,
  formatMoment
}: any) => {
  const hasReplies = discussion.replies?.length > 0;
  const isReplyComposerOpen = replyingTo === discussion.id;

  return (
    <div className={`${isRoot ? 'overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm' : 'mt-4'}`}>
      <div className={`${isRoot ? 'p-6' : 'pl-6'}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex shrink-0 items-center justify-center rounded-full bg-[#F1F5F9] ${isRoot ? 'h-10 w-10' : 'h-8 w-8'}`}>
              <User className={`${isRoot ? 'h-5 w-5' : 'h-4 w-4'} text-[#64748B]`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-[#1E293B] ${isRoot ? 'text-base' : 'text-sm'}`}>
                  {discussion.attributes?.user?.data?.attributes?.full_name || t('badges.student')}
                </h3>
                <span className="rounded bg-[#E0E7FF] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#2137D6]">
                  {t(`badges.${discussion.attributes?.user?.data?.attributes?.role || 'student'}`)}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#94A3B8]">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(discussion.attributes?.created_at)}
                </div>
                {isRoot && (
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[#64748B]">{t('chapter')}:</span>
                    {discussion.attributes?.chapter_id}
                  </div>
                )}
                {discussion.attributes?.moment != null && (
                  <div className="flex items-center gap-1 text-[#2137D6]">
                    <PlayCircle className="h-3 w-3" />
                    {formatMoment(discussion.attributes.moment)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setReplyingTo(replyingTo === discussion.id ? null : discussion.id);
                setReplyText('');
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#2137D6] transition-colors"
              title={t('reply')}
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(Number(discussion.id))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors"
              title={t('delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <p className={`mt-3 leading-relaxed text-[#475569] ${isRoot ? 'text-sm' : 'text-[13px]'}`}>
          {discussion.attributes?.content}
        </p>

        {isReplyComposerOpen && (
          <div className={`mt-4 space-y-3 rounded-xl bg-[#F8FAFC] p-4 ring-1 ring-[#E2E8F0]`}>
            <textarea
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('reply')}
              className="w-full resize-none rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm focus:border-[#2137D6] focus:outline-none focus:ring-1 focus:ring-[#2137D6]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReplyingTo(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:bg-[#E2E8F0]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleReply(Number(discussion.id), discussion.attributes.chapter_id, discussion.attributes.moment)}
                disabled={isReplying || !replyText.trim()}
                className="flex items-center gap-2 rounded-lg bg-[#2137D6] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a2bb3] disabled:opacity-50"
              >
                {isReplying && <Loader2 className="h-3 w-3 animate-spin" />}
                {t('reply')}
              </button>
            </div>
          </div>
        )}

        {hasReplies && (
          <div className="mt-2 border-l border-[#E2E8F0] ml-4 sm:ml-5">
            {discussion.replies.map((reply: any) => (
              <DiscussionNode
                key={reply.id}
                discussion={reply}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                handleReply={handleReply}
                handleDelete={handleDelete}
                isReplying={isReplying}
                t={t}
                formatTime={formatTime}
                formatMoment={formatMoment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
