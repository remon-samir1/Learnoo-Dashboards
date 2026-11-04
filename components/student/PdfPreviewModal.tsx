'use client';

import { FileText, X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { api } from '@/src/lib/api';
import { useCurrentUser } from '@/src/hooks';
import { getStudentPlatformFeatures } from '@/src/services/student/platform-feature.service';
import {
  resolveEnabledWatermarkBucket,
  type WatermarkResolution,
} from '@/src/lib/watermark-from-features';
import { buildWatermarkText } from '@/src/lib/watermark-text';
import { useTranslations } from 'next-intl';
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

/**
 * Pixels to rasterise a page at, per CSS pixel.
 *
 * This used to be capped at 1.5, which on a phone (`devicePixelRatio` 3) drew
 * the page at about half the screen's real resolution and left dense scans
 * looking blurred. The cap the canvas actually needs is on its total area —
 * mobile Safari drops a canvas that grows too large — so the budget below is
 * what limits big screens, and a phone now renders at its own pixel density.
 */
const MAX_PAGE_MEGAPIXELS = 4_000_000;

function pageDevicePixelRatio(pageWidth: number, pageRatio: number): number {
  const screenRatio = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 3);
  const areaBudget = Math.sqrt(MAX_PAGE_MEGAPIXELS / (pageWidth ** 2 * pageRatio));
  return Math.max(1, Math.min(screenRatio, areaBudget));
}

function PdfPreviewContent({
  proxiedPdfUrl,
  expandToContainer = false,
  scale,
  currentPage,
  onPagesLoaded,
  watermarkText,
  watermarkStyle,
}: {
  proxiedPdfUrl: string;
  expandToContainer?: boolean;
  scale?: number;
  currentPage: number;
  onPagesLoaded: (numPages: number) => void;
  watermarkText: string;
  watermarkStyle: { color: string; opacity: number };
}) {
  const t = useTranslations('pdfViewer');
  const [pageWidth, setPageWidth] = useState(720);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [visiblePages, setVisiblePages] = useState(() => new Set([1]));
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const effectiveScale = scale ?? 1.0;

  const reportError = (stage: string, error: unknown) => {
    const detail = `${stage}: ${String(error).replace(/https?:\/\/\S+/g, '[URL]').slice(0, 180)}`;
    console.error('PDF viewer error:', detail);
    setLoadError(detail);
  };

  useEffect(() => {
    const controller = new AbortController();

    setPdfData(null);
    setLoadError(null);

    fetch(proxiedPdfUrl, { cache: 'no-store', signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then(setPdfData)
      .catch((error: unknown) => {
        if ((error as Error).name !== 'AbortError') reportError('fetch', error);
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
    const visible = new Set<number>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const page = Number((entry.target as HTMLElement).dataset.pdfPage);
        if (entry.isIntersecting) visible.add(page);
        else visible.delete(page);
      }
      setVisiblePages(new Set(visible));
    }, { rootMargin: '300px 0px' });
    contentRef.current?.querySelectorAll('[data-pdf-page]').forEach(page => observer.observe(page));
    return () => observer.disconnect();
  }, [totalPages, pdfData]);

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, totalPages]);

  return (
    <div ref={contentRef} className="min-h-0 w-full">
      {loadError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-slate-600">{t('inlineError')}</p>
          <p className="text-xs text-slate-500">{t('errorHint')}</p>
          <code dir="ltr" className="max-w-full break-all rounded bg-slate-100 p-2 text-xs text-slate-700">{loadError}</code>
        </div>
      ) : !pdfData ? (
        <p className="py-12 text-sm text-[#64748B]">{t('loading')}</p>
      ) : (
      <Document
        file={pdfData}
        error={<p className="py-12 text-sm text-red-600">{t('renderError')}</p>}
        onLoadSuccess={handleLoadSuccess}
        onSourceError={(error) => reportError('source', error)}
        onLoadError={(error) => reportError('document', error)}
      >
        <div className="flex flex-col items-center gap-4 py-1 sm:gap-5 sm:py-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              data-pdf-page={pageNum}
              ref={pageNum === currentPage ? pageRef : null}
              className="relative mx-auto overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-200/90"
              style={{ width: pageWidth, minHeight: pageWidth * (pageRatios[pageNum] ?? Math.SQRT2) }}
            >
              {visiblePages.has(pageNum) && <Page
                pageNumber={pageNum}
                width={pageWidth}
                devicePixelRatio={pageDevicePixelRatio(pageWidth, pageRatios[pageNum] ?? Math.SQRT2)}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                onLoadSuccess={({ width, height }) => setPageRatios(ratios => ({ ...ratios, [pageNum]: height / width }))}
                onLoadError={(error) => reportError('page', error)}
                onRenderError={(error) => reportError('render', error)}
                className="[&_canvas]:!h-auto [&_canvas]:!w-full"
              />}

              {watermarkText ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 select-none overflow-hidden"
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
  contentType = 'chapters',
  chapterId,
  viewByMinute = 0,
}: Props) {
  const tViewer = useTranslations('pdfViewer');
  const { user } = useCurrentUser();
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkResolution | null>(null);
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

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    getStudentPlatformFeatures()
      .then((features) => {
        if (mounted) setWatermarkConfig(resolveEnabledWatermarkBucket(features, contentType));
      })
      .catch(() => {
        // An unreachable settings call must not hide the document.
        if (mounted) setWatermarkConfig(null);
      });

    return () => {
      mounted = false;
    };
  }, [open, contentType]);

  /** Empty whenever the bucket is off, which is what hides the overlay. */
  const watermarkText = useMemo(() => {
    const config = watermarkConfig?.config;
    if (!config?.enabled) return '';
    // The same line the video overlay draws, so one leak points at one account.
    return buildWatermarkText(user ?? null, config);
  }, [watermarkConfig, user]);

  const watermarkStyle = useMemo(
    () => ({
      color: watermarkConfig?.config?.color ?? '#666666',
      opacity: (watermarkConfig?.config?.opacity ?? 50) / 100,
    }),
    [watermarkConfig],
  );

  const sourceUrl = pdfUrl ? new URL(pdfUrl) : null;
  const proxiedPdfUrl = sourceUrl ? `${sourceUrl.pathname}${sourceUrl.search}` : '';

  if (!open || !pdfUrl) return null;

  const content = (
    <div
      className={`mx-auto flex w-full justify-center ${expandToContainer ? 'max-w-none' : 'max-w-[800px]'}`}
    >
      <PdfPreviewContent
        key={proxiedPdfUrl}
        proxiedPdfUrl={proxiedPdfUrl}
        watermarkText={watermarkText}
        watermarkStyle={watermarkStyle}
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
                <p className="text-xs text-[#64748B]">{tViewer('preview')}</p>
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
            {numPages > 0 && <div className="flex items-center gap-2">
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
            </div>}
            {numPages > 0 && <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 sm:mr-4">
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
            </div>}

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
