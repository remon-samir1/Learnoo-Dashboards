"use client";

import dynamic from 'next/dynamic';
import { HlsVideoPlayer } from '@/components/student/watch/HlsVideoPlayer';

const PdfPreviewModal = dynamic(() => import('@/components/student/PdfPreviewModal'), { ssr: false });

export default function NoteAttachment({ attachment, title }: { attachment?: { url: string; extension: string; name?: string } | null; title: string }) {
  if (!attachment?.url) return null;
  const extension = attachment.extension.toLowerCase();
  if (extension === 'pdf') return <div className="h-[500px]"><PdfPreviewModal open pdfUrl={attachment.url} title={title} variant="inline" contentType="files" /></div>;
  if (['mp4', 'webm', 'ogg', 'mov', 'm3u8'].includes(extension)) return <HlsVideoPlayer src={attachment.url} className="w-full" />;
  if (['jpg', 'jpeg', 'jfif', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) return <img src={attachment.url} alt={title} className="max-h-[500px] w-full object-contain" />;
  return <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{attachment.name || title}</a>;
}
