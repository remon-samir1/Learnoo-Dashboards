'use client';

import { Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CreatePostRequest } from '@/src/types';
import { useCallback, useEffect, useState } from 'react';

export type StudentCreatePostFormState = {
  title: string;
  content: string;
  type: 'post' | 'question' | 'summary';
  tagsRaw: string;
  image: File | null;
};

const initialForm: StudentCreatePostFormState = {
  title: '',
  content: '',
  type: 'post',
  tagsRaw: '',
  image: null,
};

export function parseTagsInput(raw: string): string[] {
  return raw
    .split(/[,#\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export type StudentCommunityReplyTarget = {
  id: string;
  title: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  /** When set, modal composes a reply (POST /v1/post with parent_id). */
  replyTarget: StudentCommunityReplyTarget | null;
  onSubmitPost: (payload: CreatePostRequest) => Promise<void>;
  onSubmitReply?: (parentId: string, payload: { content: string; tags?: string[] }) => Promise<void>;
};

export default function StudentCommunityCreatePostModal({
  open,
  onClose,
  isSubmitting,
  replyTarget,
  onSubmitPost,
  onSubmitReply,
}: Props) {
  const t = useTranslations('community.createPost');
  const tTypes = useTranslations('community.postTypes');
  const tTags = useTranslations('courses.studentCommunity');

  const [form, setForm] = useState<StudentCreatePostFormState>(initialForm);

  const reset = useCallback(() => setForm(initialForm), []);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (replyTarget) {
      if (!form.content.trim()) {
        window.alert(tTags('replyBodyRequired'));
        return;
      }
      const tags = parseTagsInput(form.tagsRaw);
      if (!onSubmitReply) return;
      await onSubmitReply(replyTarget.id, {
        content: form.content.trim(),
        ...(tags.length ? { tags } : {}),
      });
      reset();
      return;
    }

    if (!form.title.trim()) {
      window.alert(t('titleRequired'));
      return;
    }
    if (!form.content.trim()) {
      window.alert(t('contentRequired'));
      return;
    }
    const tags = parseTagsInput(form.tagsRaw);
    await onSubmitPost({
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      status: 'published',
      ...(tags.length ? { tags } : {}),
      ...(form.image ? { image: form.image } : {}),
    });
    reset();
  };

  if (!open) return null;

  const isReply = Boolean(replyTarget);
  const previewTitle =
    replyTarget && replyTarget.title.trim().length > 100
      ? `${replyTarget.title.trim().slice(0, 100)}…`
      : replyTarget?.title.trim() || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] p-6">
          <h3 className="text-lg font-bold text-[#1E293B]">
            {isReply ? tTags('replyModalTitle') : t('title')}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-2 transition-colors hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X className="size-5 text-[#64748B]" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {isReply ? (
            <p className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
              <span className="font-semibold text-[#64748B]">{tTags('replyingTo')} </span>
              {previewTitle}
            </p>
          ) : null}

          {!isReply ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#475569]">{t('titleLabel')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
                placeholder={t('titlePlaceholder')}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#475569]">
              {isReply ? tTags('replyBodyLabel') : t('contentLabel')}
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={isReply ? 4 : 5}
              className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
              placeholder={isReply ? tTags('replyBodyPlaceholder') : t('contentPlaceholder')}
            />
          </div>

          {!isReply ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#475569]">{t('typeLabel')}</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as 'post' | 'question' | 'summary' })
                }
                className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
              >
                <option value="post">{tTypes('post')}</option>
                <option value="question">{tTypes('question')}</option>
                <option value="summary">{tTypes('summary')}</option>
              </select>
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-semibold text-[#475569]">{tTags('tagsLabel')}</label>
            <input
              type="text"
              value={form.tagsRaw}
              onChange={(e) => setForm({ ...form, tagsRaw: e.target.value })}
              className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6]"
              placeholder={tTags('tagsPlaceholder')}
            />
          </div>

          {!isReply ? (
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#475569]">{t('imageLabel')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setForm({ ...form, image: e.target.files?.[0] ?? null })}
                className="w-full text-sm text-[#475569] file:mr-4 file:rounded-xl file:border-0 file:bg-[#EEF2FF] file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#2137D6] hover:file:bg-[#DBEAFE]"
              />
            </div>
          ) : null}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[#1a2bb3] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isReply ? tTags('submitReply') : t('submit')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[#E2E8F0] px-4 py-2 text-sm font-bold text-[#64748B] transition-all hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
