'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  attachmentMediaKind,
  type AttachmentMediaSource,
} from '@/src/lib/student-attachment-media';

type NoteAttachmentPreviewProps = {
  attachment: AttachmentMediaSource;
  /** Note title, used as the image alt text when present. */
  title?: string | null;
  /** Taller on the note details page than in the compact course tab. */
  size?: 'compact' | 'full';
};

/**
 * Renders a note/summary attachment: images and videos play inline, everything
 * else keeps the plain file link. Shared by the course "Notes & summaries" tab
 * and the note details page so both stay in sync.
 */
export default function NoteAttachmentPreview({
  attachment,
  title,
  size = 'compact',
}: NoteAttachmentPreviewProps) {
  const t = useTranslations('notesSummaries.attachment');
  const url = attachment?.url?.trim();
  if (!url) return null;

  const kind = attachmentMediaKind(attachment);
  const mediaHeight = size === 'full' ? 'max-h-[500px]' : 'max-h-[300px]';

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-100 bg-gray-50 ${size === 'full' ? 'mb-6' : 'mt-3'
        }`}
    >
      {kind === 'video' ? (
        <video
          src={url}
          controls
          playsInline
          className={`w-full ${mediaHeight} object-contain`}
          preload="metadata"
        />
      ) : kind === 'image' ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={t('openFullSize')}
          className={`flex items-center justify-center ${mediaHeight} overflow-hidden`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote signed URLs in formats the optimizer rejects (jfif, heic) */}
          <img
            src={url}
            alt={title?.trim() || t('imageAlt')}
            loading="lazy"
            className={`h-auto w-full ${mediaHeight} object-contain`}
          />
        </a>
      ) : (
        <div
          className={`flex items-center gap-3 ${size === 'full' ? 'px-5 py-4' : 'px-4 py-3'}`}
        >
          <Download
            size={size === 'full' ? 18 : 16}
            className="shrink-0 text-blue-600"
            aria-hidden
          />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-sm font-medium text-blue-600 hover:underline"
          >
            {attachment.name?.trim() || t('download')}
          </a>
        </div>
      )}
    </div>
  );
}
