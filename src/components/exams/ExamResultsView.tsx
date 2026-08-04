'use client';

import { use } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, RotateCcw } from 'lucide-react';
import { useQuiz } from '@/src/hooks/useQuizzes';

interface ExamResultsViewProps {
  params: Promise<{ id: string }>;
  backHref: '/exams' | '/doctor/exams';
}

export function ExamResultsView({ params, backHref }: ExamResultsViewProps) {
  const { id } = use(params);
  const examId = Number(id);
  const locale = useLocale();
  const t = useTranslations('exams.resultsPage');
  const quizQuery = useQuiz(examId);
  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  if (quizQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-[#2137D6]" />
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (quizQuery.isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-red-50 p-3 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#1E293B]">{t('quizLoadErrorTitle')}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{t('quizLoadErrorDescription')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => void quizQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2137D6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1a2bb3]"
          >
            <RotateCcw className="h-4 w-4" />
            {t('retry')}
          </button>
          <Link href={backHref} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#475569]">
            {t('backToExams')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <header className="flex items-center gap-4">
        <Link
          href={backHref}
          aria-label={t('backToExams')}
          className="rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[#64748B] transition hover:text-[#1E293B] hover:shadow-sm"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-[#1E293B]">{t('title')}</h1>
          <p className="mt-0.5 truncate text-sm text-[#64748B]">
            {quizQuery.data?.attributes.title ?? t('examNumber', { id })}
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8" role="status">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="w-fit shrink-0 rounded-full bg-amber-100 p-3 text-amber-700">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">{t('unavailableTitle')}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">{t('unavailableDescription')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
