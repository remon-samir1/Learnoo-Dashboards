'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, ExternalLink, Loader2, Lock, Unlock } from 'lucide-react';
import { StudentCourseActivationModal } from '@/components/student/StudentCourseActivationModal';
import { formatLibraryAttachmentSize } from '@/src/lib/student-library-utils';
import { getCourseLibrary } from '@/src/services/student/course-library';
import type { LibraryItem, MaterialType } from '@/src/types/student-library';

type StudentCourseLibraryTabProps = {
  courseId: number;
  courseTitle: string;
  locale: string;
};

export default function StudentCourseLibraryTab({
  courseId,
  courseTitle,
  locale,
}: StudentCourseLibraryTabProps) {
  const t = useTranslations('courses.studentDetails.library');

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activationItemId, setActivationItemId] = useState<string | null>(null);
  const [activationTitle, setActivationTitle] = useState('');

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCourseLibrary(courseId);
      setItems(data.filter((item) => item.attributes.is_publish !== false));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('loadError');
      setError(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, t]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  const materialTypeLabel = (type: MaterialType | string) => {
    if (type === 'booklet' || type === 'reference' || type === 'guide') {
      return t(`materialType.${type}`);
    }
    return type;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-10 animate-spin text-[#2137D6]" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-8 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => void loadLibrary()}
          className="mt-3 text-sm font-semibold text-red-900 underline underline-offset-2"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-[#E5E7EB] bg-white px-6 py-14 text-center text-sm text-[#64748B]">
        {t('empty')}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {items.map((item) => {
          const attrs = item.attributes;
          const locked = Boolean(attrs.is_locked);
          const cover = attrs.cover_image?.trim();
          const priceNum = Number.parseFloat(String(attrs.price ?? '0'));
          const priceDisplay = Number.isFinite(priceNum)
            ? priceNum.toFixed(2)
            : String(attrs.price ?? '—');
          const detailHref = `/${locale}/student/library/${encodeURIComponent(String(item.id))}`;
          const attachments = attrs.attachments ?? [];

          return (
            <li
              key={item.id}
              className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 bg-[#F1F5F9] sm:aspect-auto sm:min-h-[160px] sm:w-40">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote cover URLs
                    <img src={cover} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full min-h-[120px] items-center justify-center text-[#94A3B8]">
                      <Lock className="size-8 opacity-40" aria-hidden />
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-[#0F172A]">{attrs.title}</h3>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        locked
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {locked ? (
                        <Lock className="size-3.5" aria-hidden />
                      ) : (
                        <Unlock className="size-3.5" aria-hidden />
                      )}
                      {locked ? t('statusLocked') : t('statusUnlocked')}
                    </span>
                  </div>

                  {attrs.description?.trim() ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-[#64748B]">
                      {attrs.description.trim()}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#64748B]">
                    <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[#4338CA]">
                      {materialTypeLabel(attrs.material_type)}
                    </span>
                    <span>
                      {t('priceLabel')}: {priceDisplay}
                    </span>
                  </div>

                  {attachments.length > 0 ? (
                    <ul className="space-y-2 border-t border-[#F1F5F9] pt-3">
                      {attachments.map((attachment) => {
                        const att = attachment.attributes;
                        const path = att.path?.trim();
                        const canOpen = Boolean(path) && !locked;

                        return (
                          <li
                            key={attachment.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#0F172A]">{att.name}</p>
                              <p className="mt-0.5 text-[#94A3B8]">
                                {att.extension}
                                {' · '}
                                {formatLibraryAttachmentSize(att.size)}
                                {' · '}
                                {att.downloadable ? t('downloadable') : t('notDownloadable')}
                              </p>
                            </div>
                            {canOpen && path ? (
                              <a
                                href={path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 items-center gap-1 font-semibold text-[#2563EB] hover:underline"
                              >
                                {att.downloadable ? (
                                  <Download className="size-3.5" aria-hidden />
                                ) : (
                                  <ExternalLink className="size-3.5" aria-hidden />
                                )}
                                {att.downloadable ? t('download') : t('open')}
                              </a>
                            ) : (
                              <span className="text-[#94A3B8]">{t('unavailable')}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#94A3B8]">{t('noAttachments')}</p>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {locked ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActivationItemId(String(item.id));
                          setActivationTitle(attrs.title);
                        }}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9]"
                      >
                        {t('unlock')}
                      </button>
                    ) : (
                      <Link
                        href={detailHref}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#2137D6] px-3 text-xs font-bold text-white hover:bg-[#1a2bb3]"
                      >
                        {t('openMaterial')}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <StudentCourseActivationModal
        open={activationItemId != null}
        onClose={() => {
          setActivationItemId(null);
          setActivationTitle('');
        }}
        courseId={activationItemId ?? String(courseId)}
        courseTitle={activationTitle || courseTitle}
        activationItemType="library"
        onActivated={async () => {
          await loadLibrary();
        }}
      />
    </>
  );
}
