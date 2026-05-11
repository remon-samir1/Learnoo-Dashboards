'use client';

import React, { useCallback } from 'react';
import { BookOpen, FileText, Lock, MapPin } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import { useTranslations } from 'next-intl';

function categoryBadgeClass(categoryName: string): string {
  const n = categoryName.trim();
  if (!n) return 'bg-slate-700 text-white';
  if (n.includes('مراجعات') || n.includes('مراجعة')) return 'bg-emerald-500 text-white';
  if (n.includes('كورسات')) return 'bg-amber-500 text-white';
  return 'bg-slate-700 text-white';
}

function statusBadgeWrapClass(status: number): string {
  if (status !== 1) return 'bg-violet-600 text-white shadow-sm';
  return 'bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm';
}

interface StudentCourseCardProps {
  image: string;
  title: string;
  instructor: string;
  /** API `center.data.attributes.name` — shown next to the map pin only. */
  location?: string | null;
  /** API `sub_title` — plain text under instructor (no location icon). */
  subTitle?: string | null;
  lectures: number;
  exams: number;
  progress: number;
  typeLabel: string;
  statusLabel: string;
  statusCode: number;
  locked?: boolean;
  onView?: () => void;
  /** Called when the locked card’s primary CTA is pressed (activation flow TBD). */
  onActivate?: () => void;
}

export const StudentCourseCard: React.FC<StudentCourseCardProps> = ({
  image,
  title,
  instructor,
  location,
  subTitle,
  lectures,
  exams,
  progress,
  typeLabel,
  statusLabel,
  statusCode,
  locked = false,
  onView,
  onActivate,
}) => {
  const t = useTranslations('courses');
  const tCard = useTranslations('courses.studentCourseCard');

  const subLine = subTitle?.trim() ?? '';
  const locationLine = location?.trim() ?? '';

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (locked) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onView?.();
      }
    },
    [locked, onView]
  );

  const leftBadgeClass = categoryBadgeClass(typeLabel);
  const rightBadgeWrap = statusBadgeWrapClass(statusCode);

  return (
    <article
      role={locked ? undefined : 'button'}
      tabIndex={locked ? -1 : 0}
      onClick={locked ? undefined : () => onView?.()}
      onKeyDown={handleKeyDown}
      className={`group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
        locked
          ? 'cursor-default'
          : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
      }`}
    >
      <div className="relative h-52 overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={title}
          className={`h-full w-full object-cover object-center ${
            locked ? '' : 'transition-transform duration-500 group-hover:scale-[1.03]'
          }`}
        />

        {locked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 px-6 text-center">
            <Lock className="h-10 w-10 text-white" strokeWidth={1.75} aria-hidden />
            <p className="mt-3 text-base font-bold text-white">{t('view.locked')}</p>
            <p className="mt-1 max-w-[14rem] text-sm font-normal leading-snug text-white/90">
              {tCard('activateToAccess')}
            </p>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between gap-2 sm:inset-x-5 sm:top-5">
            <span
              className={`inline-flex max-w-[55%] items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${leftBadgeClass}`}
            >
              <span className="truncate">{typeLabel || '—'}</span>
            </span>

            <span
              className={`inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${rightBadgeWrap}`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate">{statusLabel}</span>
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-lg font-bold leading-snug tracking-tight text-[#1E293B]">{title}</h3>
          {instructor ? (
            <p className="text-sm font-medium text-[#64748B]">{instructor}</p>
          ) : null}
          {locked ? (
            locationLine ? (
              <p className="text-xs font-normal text-[#94A3B8]">{locationLine}</p>
            ) : null
          ) : (
            <>
              {subLine ? <p className="text-xs font-medium text-slate-500">{subLine}</p> : null}
              {locationLine ? (
                <div className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{locationLine}</span>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#64748B]">
          <div className="flex min-w-0 items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden />
            <span>
              {lectures} {t('card.lectures')}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden />
            <span>
              {exams} {t('card.exams')}
            </span>
          </div>
        </div>

        {!locked ? (
          <ProgressBar label={t('card.progress')} value={progress} colorClass="bg-[#3B82F6]" percentagePosition="top" />
        ) : null}

        {locked ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActivate?.();
            }}
            className="mt-2 w-full rounded-xl bg-[#2D46D8] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#243bb8] active:bg-[#1f33a0]"
          >
            {tCard('activateCourse')}
          </button>
        ) : null}
      </div>
    </article>
  );
};
