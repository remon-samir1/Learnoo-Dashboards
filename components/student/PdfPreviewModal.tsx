'use client';

import { FileText, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { api } from '@/src/lib/api';
import { useEffect, useRef, useState } from 'react';
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
  currentPage?: number;
  onPageChange?: (page: number) => void;
  numPages?: number;
  onNumPagesChange?: (numPages: number) => void;
  /** Content type used to resolve the correct watermark bucket. Defaults to 'chapters'. */
  contentType?: 'chapters' | 'library' | 'liveStreams' | 'videos' | 'files' | 'exams';
  /** Chapter ID to record a view for when the PDF is opened. */
  chapterId?: number | null;
  /** Minutes of reading time before recording a view (matches chapter `view_by_minute`). 0 = immediate. */
  viewByMinute?: number;
};

function PdfPreviewContent({
  proxiedPdfUrl,
  expandToContainer = false,
  scale,
  currentPage,
  onPagesLoaded,
}: {
  proxiedPdfUrl: string;
  expandToContainer?: boolean;
  scale?: number;
  currentPage: number;
  onPagesLoaded: (numPages: number) => void;
}) {
  const [pageWidth, setPageWidth] = useState(720);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [useNativeViewer, setUseNativeViewer] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const effectiveScale = scale ?? 1.0;

  useEffect(() => {
    const controller = new AbortController();

    setPdfData(null);
    setLoadError(false);
    setUseNativeViewer(false);

    fetch(proxiedPdfUrl, { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch PDF');
        return response.arrayBuffer();
      })
      .then(setPdfData)
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') setLoadError(true);
      });

    return () => controller.abort();
  }, [proxiedPdfUrl]);

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

  const handleLoadSuccess = ({ numPages: pages }: { numPages: number }) => {
    setTotalPages(pages);
    onPagesLoaded(pages);
  };

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  return (
    <div ref={contentRef} className="min-h-0 w-full">
      {loadError || useNativeViewer ? (
        <iframe
          className="h-[70vh] w-full border-0"
          src={proxiedPdfUrl}
          title="PDF Preview"
        />
      ) : !pdfData ? (
        <p className="py-12 text-sm text-[#64748B]">Loading PDF...</p>
      ) : (
      <Document
        file={pdfData}
        error={<p className="py-12 text-sm text-red-600">Failed to load PDF file.</p>}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={(error) => {
          console.error('PDF viewer error:', error);
          setUseNativeViewer(true);
        }}
      >
        <div className="flex flex-col items-center gap-4 py-1 sm:gap-5 sm:py-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={pageNum === currentPage ? pageRef : null}
              className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200/90"
              style={{ width: pageWidth }}
            >
              <Page
                pageNumber={pageNum}
                width={pageWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="[&_canvas]:!h-auto [&_canvas]:!w-full"
              />

            </div>
          ))}
        </div>
      </Document>
      )}
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
  currentPage: externalCurrentPage,
  onPageChange,
  numPages: externalNumPages,
  onNumPagesChange,
  chapterId,
  viewByMinute = 0,
}: Props) {
  const [internalScale, setInternalScale] = useState(1.0);
  const [internalNumPages, setInternalNumPages] = useState(0);
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  const scale = externalScale ?? internalScale;
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const numPages = externalNumPages ?? internalNumPages;

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalCurrentPage(newPage);
    }
  };

  const handlePagesLoaded = (pages: number) => {
    setInternalNumPages(pages);
    onNumPagesChange?.(pages);
  };

  const handleZoomIn = () => {
    const next = Math.min(2.5, Math.round((scale + 0.1) * 10) / 10);
    if (onScaleChange) onScaleChange(next);
    else setInternalScale(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.5, Math.round((scale - 0.1) * 10) / 10);
    if (onScaleChange) onScaleChange(next);
    else setInternalScale(next);
  };

  const handleResetZoom = () => {
    if (onScaleChange) onScaleChange(1.0);
    else setInternalScale(1.0);
  };

  const handlePrevPage = () => {
    handlePageChange(Math.max(1, currentPage - 1));
  };

  const handleNextPage = () => {
    handlePageChange(Math.min(numPages || 1, currentPage + 1));
  };

  const handlePageInputBlur = () => {
    const val = parseInt(pageInput, 10);
    if (!isNaN(val) && val >= 1 && (numPages === 0 || val <= numPages)) {
      handlePageChange(val);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  // ── PDF View Recording ──────────────────────────────────────────────────
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    // Reset when modal closes or chapter changes
    if (!open) {
      viewRecordedRef.current = false;
      return;
    }

    if (!chapterId || !Number.isFinite(chapterId)) return;

    let cancelled = false;
    const minutesRequired = Math.max(0, Number(viewByMinute) || 0);
    const delayMs = minutesRequired > 0 ? minutesRequired * 60 * 1000 : 0;

    const recordView = async () => {
      if (cancelled || viewRecordedRef.current) return;
      viewRecordedRef.current = true;
      try {
        await api.chapters.recordView(chapterId);
      } catch {
        // Silently ignore — view limit errors are handled by the server
        viewRecordedRef.current = false;
      }
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (delayMs === 0) {
      void recordView();
    } else {
      timeoutId = setTimeout(() => {
        if (!cancelled) void recordView();
      }, delayMs);
    }

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [open, chapterId, viewByMinute]);
  // ────────────────────────────────────────────────────────────────────────

  const proxiedPdfUrl = pdfUrl ?? '';

  if (!open || !pdfUrl) return null;

  const content = (
    <div
      className={`mx-auto flex w-full justify-center ${expandToContainer ? 'max-w-none' : 'max-w-[800px]'}`}
    >
      <PdfPreviewContent
        proxiedPdfUrl={proxiedPdfUrl}
        expandToContainer={expandToContainer}
        scale={scale}
        currentPage={currentPage}
        onPagesLoaded={handlePagesLoaded}
      />
    </div>
  );

  if (variant === 'inline') {
    return <div className="w-full min-w-0">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-col gap-2 border-b border-[#E5E7EB] bg-[#F8F9FB] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-start">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-5 shrink-0 text-[#2D43D1]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0F172A]">{title}</p>
                <p className="text-xs text-[#64748B]">PDF Preview</p>
              </div>
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#64748B] transition hover:bg-[#EEF2FF] sm:hidden"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || numPages === 0}
                className="flex size-8 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageInputBlur}
                  onKeyDown={handlePageInputKeyDown}
                  className="h-8 w-10 rounded-md border border-slate-200 bg-white text-center text-xs font-bold text-slate-700 outline-none focus:border-[#2D43D1] focus:ring-1 focus:ring-[#2D43D1]"
                />
                <span className="text-xs font-medium text-slate-500">
                  of {numPages}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= numPages || numPages === 0}
                className="flex size-8 items-center justify-center rounded-md text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A] disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:mr-4">
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
                className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#64748B] transition hover:bg-[#EEF2FF] sm:flex"
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
