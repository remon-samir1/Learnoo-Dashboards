'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Download, Loader2, Lock, Minus, Plus, Search } from 'lucide-react';
import { StudentCourseActivationModal } from '@/components/student/StudentCourseActivationModal';
import { formatLibraryAttachmentSize } from '@/src/lib/student-library-utils';
import { useLibrary } from '@/src/hooks/useLibraries';
import type { Attachment } from '@/src/types';

function extOf(att: Attachment): string {
  return (att.attributes?.extension ?? '').trim().toLowerCase();
}

function isPdfPath(att: Attachment): boolean {
  return extOf(att) === 'pdf';
}

export default function StudentLibraryMaterialDetail({ materialId }: { materialId: string }) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('courses.studentLibrary');
  const raw = materialId?.trim() ?? '';
  const idNum = Number.parseInt(raw, 10);
  const idValid = raw.length > 0 && Number.isFinite(idNum) && idNum > 0;

  const { data: library, isLoading, error, refetch } = useLibrary(idNum, { enabled: idValid });

  const [activationOpen, setActivationOpen] = useState(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);

  const listHref = `/${locale}/student/library`;

  const attachments = useMemo(() => {
    if (!library) return [] as Attachment[];
    return (library.attributes.attachments ?? []) as Attachment[];
  }, [library]);

  const selected = useMemo(() => {
    if (!attachments.length) return null;
    if (selectedAttachmentId) {
      const found = attachments.find((a) => String(a.id) === selectedAttachmentId);
      if (found) return found;
    }
    return attachments[0] ?? null;
  }, [attachments, selectedAttachmentId]);

  const locked = Boolean(library?.attributes.is_locked);
  const canAccessAttachment = !locked && selected?.attributes?.downloadable === true;
  const canOpenUnlocked = !locked && Boolean(selected?.attributes?.path?.trim());
  const showPdfFrame = Boolean(selected && isPdfPath(selected) && canOpenUnlocked);

  const materialTypeLabel = useCallback(
    (type: string) => {
      const k = type as 'booklet' | 'reference' | 'guide';
      if (k === 'booklet' || k === 'reference' || k === 'guide') return t(`materialType.${k}`);
      return type;
    },
    [t],
  );

  if (!idValid) {
    return (
      <div className="w-full pb-12 pt-2" dir={dir}>
        <p className="text-sm text-red-600">{t('invalidId')}</p>
        <Link href={listHref} className="mt-4 inline-flex text-sm font-semibold text-[#2137D6]">
          {t('backToLibrary')}
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24" dir={dir}>
        <Loader2 className="size-10 animate-spin text-[#2137D6]" aria-hidden />
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="w-full pb-12 pt-2" dir={dir}>
        <p className="text-sm text-red-700">{t('detailLoadError')}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 text-sm font-semibold text-[#2137D6] underline underline-offset-2"
        >
          {t('retryLoad')}
        </button>
        <Link href={listHref} className="mt-4 block text-sm font-semibold text-[#64748B] hover:text-[#2137D6]">
          {t('backToLibrary')}
        </Link>
      </div>
    );
  }

  const a = library.attributes;
  const cover = a.cover_image?.trim();
  const priceNum = Number.parseFloat(String(a.price ?? '0'));
  const priceDisplay = Number.isFinite(priceNum) ? priceNum.toFixed(2) : String(a.price ?? '—');

  return (
    <div className="w-full pb-16 pt-2" dir={dir}>
      <Link
        href={listHref}
        className="group mb-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#64748B] transition hover:text-[#2137D6] sm:mb-6"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden />
        {t('backToLibrary')}
      </Link>

      <header className="mb-6 flex flex-col gap-4 border-b border-[#E5E7EB] pb-6 max-lg:gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-[#0F172A] sm:text-2xl lg:text-3xl">{a.title}</h1>
          <p className="mt-1.5 text-sm font-medium text-[#64748B]">{t('courseRef', { id: a.course_id })}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-[#EEF2FF] px-2.5 py-1 text-[#4338CA]">{materialTypeLabel(a.material_type)}</span>
            <span className="text-[#64748B]">
              {t('priceLabel')}: {priceDisplay}
            </span>
            {locked ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-900">{t('lockedMaterial')}</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">{t('unlockedBadge')}</span>
            )}
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <div className="order-2 flex items-center justify-center gap-1 rounded-xl border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm text-[#64748B] sm:order-none sm:justify-start">
            <button type="button" className="rounded-lg p-1.5 opacity-40" disabled aria-hidden>
              <Minus className="size-4" />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-bold">100%</span>
            <button type="button" className="rounded-lg p-1.5 opacity-40" disabled aria-hidden>
              <Plus className="size-4" />
            </button>
          </div>
          <button type="button" className="rounded-xl border border-[#E2E8F0] p-2 opacity-40" disabled aria-label="Search">
            <Search className="size-5 text-[#64748B]" />
          </button>
          {selected?.attributes?.path && canAccessAttachment ? (
            <a
              href={selected.attributes.path}
              download={selected.attributes.name}
              target="_blank"
              rel="noopener noreferrer"
              className="order-1 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2137D6] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3] sm:order-none sm:min-h-0 sm:w-auto sm:py-2.5"
            >
              <Download className="size-4 shrink-0" aria-hidden />
              {t('download')}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="order-1 inline-flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#94A3B8] sm:order-none sm:min-h-0 sm:w-auto sm:py-2.5"
            >
              <Download className="size-4 shrink-0" aria-hidden />
              {t('download')}
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-8">
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="aspect-[3/4] w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-[#94A3B8]">
                <Lock className="size-12 opacity-30" aria-hidden />
              </div>
            )}
          </div>
          {a.description?.trim() ? (
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{t('descriptionHeading')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">{a.description.trim()}</p>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748B]">{t('attachments')}</h2>
            <ul className="mt-3 space-y-2">
              {attachments.length === 0 ? (
                <li className="text-sm text-[#94A3B8]">{t('noAttachments')}</li>
              ) : (
                attachments.map((att) => {
                  const active = String(att.id) === String(selected?.id);
                  const path = att.attributes?.path?.trim();
                  const openOk = !locked && Boolean(path);
                  const dlOk = !locked && att.attributes?.downloadable === true && Boolean(path);
                  return (
                    <li key={att.id}>
                      <div
                        className={`flex flex-col gap-2 rounded-xl border p-3 transition ${
                          active ? 'border-[#6366F1] bg-[#EEF2FF]' : 'border-[#F1F5F9] bg-[#F8FAFC]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedAttachmentId(String(att.id))}
                          className="text-start text-sm font-semibold text-[#0F172A]"
                        >
                          {att.attributes?.name ?? '—'}
                        </button>
                        <p className="text-[11px] font-medium text-[#64748B]">
                          {(att.attributes?.extension ?? '').toUpperCase()} · {formatLibraryAttachmentSize(att.attributes?.size)}
                          {!att.attributes?.downloadable ? (
                            <span className="ms-2 text-amber-700">({t('notDownloadable')})</span>
                          ) : null}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {openOk ? (
                            <a
                              href={path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-lg bg-[#2137D6] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1a2bb3]"
                            >
                              {t('openInNewTab')}
                            </a>
                          ) : (
                            <span className="inline-flex rounded-lg bg-[#F1F5F9] px-3 py-1.5 text-xs font-semibold text-[#94A3B8]">
                              {locked ? t('attachmentLocked') : t('openUnavailable')}
                            </span>
                          )}
                          {dlOk ? (
                            <a
                              href={path}
                              download={att.attributes?.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#2137D6] hover:bg-[#F8FAFC]"
                            >
                              {t('download')}
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {locked ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">{t('activateCourseHint')}</p>
              <button
                type="button"
                onClick={() => setActivationOpen(true)}
                className="mt-3 w-full rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3]"
              >
                {t('unlock')}
              </button>
            </div>
          ) : null}
        </aside>

        <section className="order-first min-h-[min(50vh,420px)] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm lg:order-none lg:min-h-[480px]">
          {locked ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center gap-3 bg-slate-900/5 px-6 py-16 text-center">
              <Lock className="size-14 text-[#94A3B8]" aria-hidden />
              <p className="text-sm font-semibold text-[#64748B]">{t('lockedMaterial')}</p>
              <p className="max-w-md text-sm text-[#94A3B8]">{t('activateCourseHint')}</p>
            </div>
          ) : showPdfFrame && selected?.attributes?.path ? (
            <iframe
              title={selected.attributes.name ?? 'PDF'}
              src={selected.attributes.path}
              className="h-[min(78vh,900px)] w-full border-0 bg-[#F8FAFC]"
            />
          ) : canOpenUnlocked && selected?.attributes?.path ? (
            <div className="flex min-h-[480px] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <p className="text-lg font-bold text-[#1E293B]">{t('previewUnavailableTitle')}</p>
              <p className="max-w-md text-sm text-[#64748B]">{t('previewUnavailableBody')}</p>
              <a
                href={selected.attributes.path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-[#2137D6] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#1a2bb3]"
              >
                {t('openInNewTab')}
              </a>
            </div>
          ) : (
            <div className="flex min-h-[480px] flex-col items-center justify-center px-6 py-16 text-center text-[#64748B]">
              <p className="text-lg font-bold text-[#1E293B]">{t('pdfViewerTitle')}</p>
              <p className="mt-2 max-w-lg text-sm">{t('pdfViewerPlaceholder')}</p>
            </div>
          )}
        </section>
      </div>

      <StudentCourseActivationModal
        open={activationOpen}
        onClose={() => setActivationOpen(false)}
        courseId={String(library.id)}
        courseTitle={a.title}
        activationItemType="library"
        onActivated={() => {
          setActivationOpen(false);
          void refetch();
        }}
      />
    </div>
  );
}
