'use client';

import dynamic from 'next/dynamic';
import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HlsVideoPlayer } from '@/components/student/watch/HlsVideoPlayer';
import {
  attachmentMediaKind,
  isHlsAttachment,
  type AttachmentMediaSource,
} from '@/src/lib/student-attachment-media';

const PdfPreviewModal = dynamic(() => import('@/components/student/PdfPreviewModal'), {
  ssr: false,
});

/** `true` for a PDF, by mime type first and only then by extension / url. */
function isPdfAttachment(source: AttachmentMediaSource): boolean {
  const mime = (source.mime_type ?? source.mime ?? source.type ?? '').trim().toLowerCase();
  if (mime === 'application/pdf') return true;
  if (mime.startsWith('image/') || mime.startsWith('video/')) return false;
  const ext = (source.extension ?? '').trim().replace(/^\./, '').toLowerCase();
  if (ext) return ext === 'pdf';
  const fromPath = (source.name ?? source.url ?? '').split('?')[0].split('#')[0];
  return fromPath.toLowerCase().endsWith('.pdf');
}

type NoteAttachmentPreviewProps = {
  /** Missing attachment renders nothing, so callers can pass theirs straight through. */
  attachment: AttachmentMediaSource | null | undefined;
  /** Note title, used as the image alt text when present. */
  title?: string | null;
  /** Taller on the note details page than in the compact course tab. */
  size?: 'compact' | 'full';
};

/**
 * Renders a note/summary attachment: PDFs, images and videos (including HLS
 * playlists) play inline, everything else keeps the plain file link. Shared by
 * the course "Notes & summaries" tab, the home notes card and the note details
 * page so all three stay in sync.
 */
export default function NoteAttachmentPreview({
  attachment,
  title,
  size = 'compact',
}: NoteAttachmentPreviewProps) {
  const t = useTranslations('notesSummaries.attachment');
  if (!attachment?.url?.trim()) return null;

  const url = attachment.url.trim();
  const kind = attachmentMediaKind(attachment);
  const mediaHeight = size === 'full' ? 'max-h-[500px]' : 'max-h-[300px]';

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-100 bg-gray-50 ${size === 'full' ? 'mb-6' : 'mt-3'
        }`}
    >
      {isPdfAttachment(attachment) ? (
        <div className={size === 'full' ? 'h-[500px]' : 'h-[300px]'}>
          <PdfPreviewModal
            open
            pdfUrl={url}
            title={title?.trim() || attachment.name?.trim() || ''}
            variant="inline"
            contentType="files"
          />
        </div>
      ) : kind === 'video' ? (
        isHlsAttachment(attachment) ? (
          <HlsVideoPlayer src={url} className={`w-full ${mediaHeight}`} />
        ) : (
          <video
            src={url}
            controls
            playsInline
            className={`w-full ${mediaHeight} object-contain`}
            preload="metadata"
          />
        )
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
