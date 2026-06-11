'use client';

import { FileText, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useCurrentUser } from '@/src/hooks';
import { resolveEnabledWatermarkBucket, WatermarkResolution } from '@/src/lib/watermark-from-features';
import { getStudentPlatformFeatures } from '@/src/services/student/platform-feature.service';
import { useEffect, useMemo, useRef, useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type Props = {
  open: boolean;
  onClose?: () => void;
  pdfUrl: string | null;
  title: string;
  /** `modal` = fullscreen overlay; `inline` = fills parent (e.g. under video). */
  variant?: 'modal' | 'inline';
  /** Use full panel width (e.g. watch player fullscreen PDF column). */
  expandToContainer?: boolean;
  scale?: number;
  onScaleChange?: (scale: number) => void;
};

function PdfPreviewContent({
  proxiedPdfUrl,
  watermarkText,
  watermarkStyle,
  expandToContainer = false,
  scale,
}: {
  proxiedPdfUrl: string;
  watermarkText: string;
  watermarkStyle: { color: string; opacity: number };
  expandToContainer?: boolean;
  scale?: number;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(720);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const effectiveScale = scale ?? 1.0;

  useEffect(() => {
    const updateWidth = () => {
      const width = contentRef.current?.clientWidth ?? 720;
      const padding = expandToContainer ? 16 : 24;
      const availableWidth = Math.max(280, width - padding);

      setPageWidth(availableWidth * effectiveScale);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [expandToContainer, effectiveScale]);

  return (
    <div ref={contentRef} className="min-h-0 w-full">
      <Document
        file={proxiedPdfUrl}
        loading={<p className="py-12 text-sm text-[#64748B]">Loading PDF...</p>}
        error={<p className="py-12 text-sm text-red-600">Failed to load PDF file.</p>}
        onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
      >
        <div className="flex flex-col items-center gap-4 py-1 sm:gap-5 sm:py-2">
          {Array.from({ length: numPages }, (_, index) => {
            const pageNumber = index + 1;

            return (
              <div
                key={pageNumber}
               className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200/90"
               style={{ width: pageWidth }}
              >
                <Page
  pageNumber={pageNumber}
  width={pageWidth}
  renderAnnotationLayer={false}
  renderTextLayer={false}
  className="[&_canvas]:!h-auto [&_canvas]:!w-full"
/>

                {watermarkText ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none"
                    aria-hidden
                  >
                    <div className="grid h-full w-full grid-cols-3 gap-16 p-10">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-center">
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
  );
}

export default function PdfPreviewModal({
  open,
  onClose,
  pdfUrl,
  title,
  variant = 'modal',
  expandToContainer = false,
  scale: externalScale,
  onScaleChange,
}: Props) {
  const [internalScale, setInternalScale] = useState(1.0);
  const scale = externalScale ?? internalScale;

  const handleZoomIn = () => {
    const next = Math.min(2.5, scale + 0.1);
    if (onScaleChange) onScaleChange(next);
    else setInternalScale(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.5, scale - 0.1);
    if (onScaleChange) onScaleChange(next);
    else setInternalScale(next);
  };

  const handleResetZoom = () => {
    if (onScaleChange) onScaleChange(1.0);
    else setInternalScale(1.0);
  };

  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkResolution | null>(null);
  const { user } = useCurrentUser();
  const attrs = user?.attributes;

  const safePdfUrl = pdfUrl ? encodeURI(pdfUrl) : '';
  const proxiedPdfUrl = `/api/pdf-proxy?url=${encodeURIComponent(safePdfUrl)}`;

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
        const resolution = resolveEnabledWatermarkBucket(platformFeatures, 'chapters');

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

  if (!open || !pdfUrl) return null;

  const content = (
    <div
      className={`mx-auto flex w-full justify-center ${expandToContainer ? 'max-w-none' : 'max-w-[800px]'}`}
    >
      <PdfPreviewContent
        proxiedPdfUrl={proxiedPdfUrl}
        watermarkText={watermarkText}
        watermarkStyle={watermarkStyle}
        expandToContainer={expandToContainer}
        scale={scale}
      />
    </div>
  );

  if (variant === 'inline') {
    return <div className="w-full min-w-0">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8F9FB] px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-[#2D43D1]" />
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{title}</p>
              <p className="text-xs text-[#64748B]">PDF Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="mr-4 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="flex size-8 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                title="Zoom Out"
              >
                <ZoomOut className="size-4" />
              </button>
              <div className="flex min-w-[3rem] items-center justify-center px-1 text-xs font-semibold text-slate-700">
                {Math.round(scale * 100)}%
              </div>
              <button
                type="button"
                onClick={handleZoomIn}
                className="flex size-8 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                title="Zoom In"
              >
                <ZoomIn className="size-4" />
              </button>
              <div className="mx-0.5 h-4 w-px bg-slate-200" />
              <button
                type="button"
                onClick={handleResetZoom}
                className="flex size-8 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                title="Reset Zoom"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 items-center justify-center rounded-full bg-white text-[#64748B] transition hover:bg-[#EEF2FF]"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="overflow-auto bg-[#F8FAFC] p-5">{content}</div>
      </div>
    </div>
  );
}

