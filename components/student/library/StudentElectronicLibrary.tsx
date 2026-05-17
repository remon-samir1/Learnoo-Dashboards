'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { Key, Loader2, Lock, Search, Unlock } from 'lucide-react';
import { StudentCourseActivationModal } from '@/components/student/StudentCourseActivationModal';
import { formatLibraryAttachmentSize, isStudentLibraryPublished, librarySearchHaystack } from '@/src/lib/student-library-utils';
import { useLibraries } from '@/src/hooks/useLibraries';
import type { Attachment, Library, MaterialType } from '@/src/types';

type LibraryMaterialFilter = 'all' | MaterialType;

const MATERIAL_FILTER_TABS: readonly LibraryMaterialFilter[] = [
  'all',
  'booklet',
  'reference',
  'guide',
];

function firstAttachmentMeta(attrs: Library['attributes']): { count: number; sizeLine: string } | null {
  const list = attrs.attachments ?? [];
  if (!list.length) return null;
  const first = list[0] as Attachment;
  const size = formatLibraryAttachmentSize(first.attributes?.size);
  return { count: list.length, sizeLine: size };
}

export default function StudentElectronicLibrary() {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const t = useTranslations('courses.studentLibrary');
  const { data: rawList, isLoading, error, refetch } = useLibraries();

  const [tab, setTab] = useState<LibraryMaterialFilter>('all');
  const [q, setQ] = useState('');
  const [activationItemId, setActivationItemId] = useState<string | null>(null);
  const [activationContextTitle, setActivationContextTitle] = useState('');

  const base = `/${locale}/student/library`;

  const publishedMaterials = useMemo(() => {
    const list = rawList ?? [];
    return list.filter(isStudentLibraryPublished);
  }, [rawList]);

  const searchNeedle = q.trim().toLowerCase();

  const tabFiltered = useMemo(() => {
    let list = publishedMaterials;
    if (tab !== 'all') {
      list = list.filter((item) => item.attributes.material_type === tab);
    }
    if (!searchNeedle) return list;
    return list.filter((lib) => librarySearchHaystack(lib).includes(searchNeedle));
  }, [publishedMaterials, tab, searchNeedle]);

  const firstLockedForBanner = useMemo(
    () => publishedMaterials.find((l) => l.attributes.is_locked) ?? null,
    [publishedMaterials],
  );

  const openActivation = useCallback((libraryMaterialId: string | number, contextTitle: string) => {
    setActivationItemId(String(libraryMaterialId));
    setActivationContextTitle(contextTitle.trim());
  }, []);

  const closeActivation = useCallback(() => {
    setActivationItemId(null);
    setActivationContextTitle('');
  }, []);

  const handleBannerActivate = useCallback(() => {
    if (!firstLockedForBanner) return;
    openActivation(firstLockedForBanner.id, firstLockedForBanner.attributes.title);
  }, [firstLockedForBanner, openActivation]);

  const materialTypeLabel = useCallback(
    (type: MaterialType | string) => {
      if (type === 'booklet' || type === 'reference' || type === 'guide') {
        return t(`materialType.${type}`);
      }
      return type;
    },
    [t],
  );

  const filterTabLabel = useCallback(
    (filter: LibraryMaterialFilter) => {
      if (filter === 'all') {
        return t('tabAll');
      }
      return t(`materialType.${filter}`);
    },
    [t],
  );

  return (
    <div className="w-full pb-12 pt-2" dir={dir}>
      <header className="mb-6 max-w-5xl sm:mb-8">
        <h1 className="text-[1.375rem] font-bold leading-tight tracking-tight text-[#0F172A] sm:text-3xl">
          {t('pageTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#64748B] sm:text-base">{t('pageSubtitle')}</p>
      </header>

      <section
        className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#7C3AED] px-4 py-6 text-white shadow-md sm:mb-8 sm:px-10 sm:py-10"
        aria-labelledby="library-unlock-banner-title"
      >
        <div className="relative z-[1] max-w-2xl">
          <h2 id="library-unlock-banner-title" className="text-base font-bold leading-snug sm:text-xl">
            {t('unlockBannerTitle')}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-white/90 sm:text-[15px]">{t('unlockBannerBody')}</p>
          <button
            type="button"
            onClick={handleBannerActivate}
            disabled={!firstLockedForBanner}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/90 bg-white px-5 py-3 text-sm font-bold text-[#4F46E5] shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-5 sm:w-auto sm:py-2.5"
          >
            <Key className="size-4 text-amber-500" aria-hidden />
            {t('activateMaterial')}
          </button>
        </div>
        <div
          className="pointer-events-none absolute end-6 top-1/2 hidden -translate-y-1/2 text-white/20 sm:block"
          aria-hidden
        >
          <Lock className="size-32" strokeWidth={1} />
        </div>
      </section>

      <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:mb-6 sm:p-5">
        <div className="relative mb-4 sm:mb-5">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-[18px] -translate-y-1/2 text-[#94A3B8]" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-h-[48px] w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] py-3 ps-10 pe-4 text-base text-[#1E293B] placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:outline-none focus:ring-2 focus:ring-[#6366F1]/25 sm:min-h-0 sm:py-2.5 sm:text-sm"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {MATERIAL_FILTER_TABS.map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setTab(filterKey)}
              className={`shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-semibold transition sm:py-2 ${tab === filterKey
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                }`}
            >
              {filterTabLabel(filterKey)}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{t('loadError')}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 text-sm font-semibold text-red-900 underline underline-offset-2"
          >
            {t('retryLoad')}
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-[#2137D6]" aria-hidden />
        </div>
      ) : tabFiltered.length === 0 ? (
        <p className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-12 text-center text-sm leading-relaxed text-[#64748B] sm:px-6 sm:py-14">
          {searchNeedle ? t('emptySearch') : t('empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-3">
          {tabFiltered.map((lib) => {
            const a = lib.attributes;
            const locked = Boolean(a.is_locked);
            const cover = a.cover_image?.trim();
            const meta = firstAttachmentMeta(a);
            const href = `${base}/${encodeURIComponent(String(lib.id))}`;
            const typeLabel = materialTypeLabel(a.material_type);
            const priceNum = Number.parseFloat(String(a.price ?? '0'));
            const priceDisplay = Number.isFinite(priceNum) ? priceNum.toFixed(2) : String(a.price ?? '—');

            return (
              <li key={lib.id} className="w-full shrink-0 sm:w-[232px]">
                <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition hover:border-[#CBD5E1] hover:shadow-md sm:h-[356px] sm:w-[232px]">
                  <div className="relative aspect-[4/3] w-full shrink-0 bg-[#F1F5F9] sm:aspect-auto sm:h-[174px]">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote signed URLs
                      <img src={cover} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[#94A3B8]">
                        <Lock className="size-10 opacity-40" aria-hidden />
                      </div>
                    )}
                    {!locked ? (
                      <span className="absolute end-2 top-2 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-2 ring-white">
                        <Unlock className="size-[18px]" strokeWidth={2.5} aria-hidden />
                      </span>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/65 px-4 py-6 text-center text-white backdrop-blur-[1px] sm:py-4">
                        <Lock className="mb-2 size-11 text-white sm:size-10" strokeWidth={2} aria-hidden />
                        <p className="text-sm font-bold sm:text-sm">{t('locked')}</p>
                        <button
                          type="button"
                          onClick={() => openActivation(lib.id, a.title)}
                          className="mt-4 min-h-[40px] rounded-lg bg-white px-4 py-2 text-xs font-bold text-[#4F46E5] shadow-sm transition hover:bg-indigo-50 active:scale-[0.98] sm:mt-3 sm:min-h-0 sm:px-3 sm:py-1.5"
                        >
                          {t('unlock')}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden p-4 pt-3 sm:min-h-0 sm:flex-1 sm:p-3 sm:pt-2">
                    {locked ? (
                      <p className="mb-1 line-clamp-2 text-xs font-medium leading-snug text-amber-800 sm:text-[10px]">
                        {t('activateCourseHint')}
                      </p>
                    ) : null}
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#0F172A] sm:text-[13px]">{a.title}</h3>
                    <p className="mt-0.5 line-clamp-1 text-xs font-medium text-[#64748B] sm:text-[10px]">
                      {t('courseRef', { id: a.course_id })}
                    </p>
                    {a.description?.trim() ? (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#64748B] sm:line-clamp-2 sm:text-[10px]">
                        {a.description.trim()}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#64748B] sm:mt-1 sm:gap-1 sm:text-[10px]">
                      <span className="rounded-full bg-[#EEF2FF] px-2 py-0.5 text-[#4338CA] sm:px-1.5">{typeLabel}</span>
                      <span className="truncate">
                        {t('priceLabel')}: {priceDisplay}
                      </span>
                    </div>
                    {meta ? (
                      <p className="mt-1 text-xs text-[#94A3B8] sm:text-[10px]">
                        {t('fileCount', { count: meta.count })} · {meta.sizeLine}
                      </p>
                    ) : null}
                    <div className="mt-4 shrink-0 sm:mt-auto sm:pt-2">
                      {locked ? (
                        <button
                          type="button"
                          onClick={() => openActivation(lib.id, a.title)}
                          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-sm font-semibold text-[#475569] transition hover:bg-[#F1F5F9] active:bg-slate-100 sm:h-9 sm:min-h-0 sm:text-xs"
                        >
                          {t('lockedMaterial')}
                        </button>
                      ) : (
                        <Link
                          href={href}
                          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#2137D6] px-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2bb3] active:bg-[#182a9e] sm:h-9 sm:min-h-0 sm:text-xs"
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
      )}

      <StudentCourseActivationModal
        open={activationItemId != null}
        onClose={closeActivation}
        courseId={activationItemId ?? ''}
        courseTitle={activationContextTitle}
        activationItemType="library"
        onActivated={() => void refetch()}
      />
    </div>
  );
}
