'use client';

import { FileText, X } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

import { useCurrentUser } from '@/src/hooks';
import { resolveEnabledWatermarkBucket, WatermarkResolution } from '@/src/lib/watermark-from-features';
import { getStudentPlatformFeatures } from '@/src/services/student/platform-feature.service';
import { useEffect, useMemo, useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type Props = {
  open: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  title: string;
};

export default function PdfPreviewModal({
  open,
  onClose,
  pdfUrl,
  title,
}: Props) {

    const [watermarkConfig, setWatermarkConfig] =
    useState<WatermarkResolution | null>(null);
    const [numPages, setNumPages] = useState<number>(0);

const safePdfUrl = pdfUrl ? encodeURI(pdfUrl) : '';
const proxiedPdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(safePdfUrl)}`;
const {user}= useCurrentUser();
const attrs = user?.attributes

const watermarkText = useMemo(() => {
  const config = watermarkConfig?.config;
  if (!config?.enabled) return '';

  const parts: string[] = [];

  if (config.useStudentCode && attrs?.student_code) {
    parts.push(String(attrs.student_code).trim());
  }

  if (config.usePhoneNumber && attrs?.phone) {
    parts.push(String(attrs.phone).trim());
  }

  return parts.join(' · ');
}, [watermarkConfig, attrs]);
useEffect(() => {
  let mounted = true;

  const loadWatermark = async () => {
    try {
      const platformFeatures = await getStudentPlatformFeatures();
       
      const resolution = resolveEnabledWatermarkBucket(
        platformFeatures,
        'chapters'
      );

      if (mounted) {
        setWatermarkConfig(resolution);
      }
    } catch (error) {
      console.error('Failed to load watermark config:', error);
    }
  };

  loadWatermark();

  return () => {
    mounted = false;
  };
}, []);
const watermarkStyle = useMemo(() => {
  const config = watermarkConfig?.config;

  return {
    color: config?.color ?? '#666666',
    opacity: (config?.opacity ?? 50) / 100,
  };
}, [watermarkConfig]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8F9FB] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#2D43D1]" />
            <div>
              <p className="text-sm font-bold text-[#0F172A]">
                {title}
              </p>
              <p className="text-xs text-[#64748B]">
                PDF Preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white text-[#64748B] transition hover:bg-[#EEF2FF]"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-auto bg-[#F8FAFC] p-5">
          <div className="mx-auto flex w-full max-w-[800px] justify-center overflow-auto rounded-xl bg-white p-3 shadow-sm">
   <Document
  file={proxiedPdfUrl}
  loading={<p className="py-20 text-sm text-[#64748B]">Loading PDF...</p>}
  error={<p className="py-20 text-sm text-red-600">Failed to load PDF file.</p>}
  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
>
  <div className="flex flex-col items-center gap-6">
    {Array.from({ length: numPages }, (_, index) => {
      const pageNumber = index + 1;

      return (
        <div
          key={pageNumber}
          className="relative overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <Page
            pageNumber={pageNumber}
            width={720}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />

          {watermarkText ? (
           <div
  className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
  aria-hidden
>
  <div className="grid h-full w-full grid-cols-3 gap-16 p-10">
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center justify-center"
      >
        <span
          className="rotate-[-25deg] whitespace-nowrap text-2xl font-bold"
          style={watermarkStyle}
        >
          {watermarkText}
        </span>
      </div>
    ))}
  </div>
</div>
          ) : null}
        </div>
      );
    })}
  </div>
</Document>
          </div>
        </div>
      </div>
    </div>
  );
}

