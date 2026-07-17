"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare, CheckCircle2, AlertTriangle, Star, RefreshCcw } from 'lucide-react';
import { useStudentFeedback } from '@/src/hooks';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

const STORAGE_KEY = 'parentStudentId';

function read(obj: JsonValue | undefined, ...keys: string[]): JsonValue | undefined {
  let current: JsonValue | undefined = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as JsonObject)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function asArray(value: JsonValue | undefined): JsonObject[] {
  return Array.isArray(value) ? (value.filter((v): v is JsonObject => typeof v === 'object' && v !== null && !Array.isArray(v)) as JsonObject[]) : [];
}

const str = (value: JsonValue | undefined) => (value === undefined || value === null ? '' : String(value));

export default function ParentStudentFeedbackPage() {
  const t = useTranslations('parentFeedback');
  const params = useParams();
  const studentId = params?.id as string | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const feedbackQuery = useStudentFeedback(studentId ?? '', { enabled: Boolean(studentId) });
  const isLoading = feedbackQuery.isLoading;
  const isError = feedbackQuery.isError;
  // API returns { feedback: [...] } directly — not wrapped in { data: [...] }
  const rawFeedback = feedbackQuery.data as unknown as Record<string, unknown>;
  const feedbackData = asArray((rawFeedback?.feedback ?? rawFeedback?.data ?? rawFeedback) as unknown as JsonValue);

  const stats = (() => {
    const total = feedbackData.length;
    const positive = feedbackData.filter((item) => str(read(item, 'type')).toLowerCase() === 'positive').length;
    const needsAttention = feedbackData.filter((item) => str(read(item, 'type')).toLowerCase() === 'negative').length;
    return { total, positive, needsAttention };
  })();

  const errorMessage = feedbackQuery.error instanceof Error ? feedbackQuery.error.message : String(feedbackQuery.error ?? '');

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Teacher Feedback'}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle') ?? 'Read feedback from instructors about your child\'s engagement and progress.'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label={t('totalFeedback') ?? 'Total Feedback'} value={`${stats.total}`} icon={<MessageSquare className="h-5 w-5" />} />
        <SummaryCard label={t('positiveFeedback') ?? 'Positive Feedback'} value={`${stats.positive}`} icon={<CheckCircle2 className="h-5 w-5" />} />
        <SummaryCard label={t('needsAttention') ?? 'Needs Attention'} value={`${stats.needsAttention}`} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      {isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>{errorMessage || 'Unable to load feedback.'}</p>
            <button onClick={() => feedbackQuery.refetch()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : feedbackData.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {t('noFeedback') ?? 'No feedback entries are available yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackData.map((item, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">{str(read(item, 'instructor') ?? (read(item, 'teacher') || 'Instructor'))}</p>
                  <p className="text-sm text-slate-500 mt-1">{str(read(item, 'subject') ?? (read(item, 'course') || ''))}</p>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  str(read(item, 'type')).toLowerCase() === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                  str(read(item, 'type')).toLowerCase() === 'negative' ? 'bg-rose-100 text-rose-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {str(read(item, 'type') || 'Neutral')}
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{str(read(item, 'feedback') ?? (read(item, 'comments') ?? (read(item, 'details') || 'No detailed feedback provided.')))}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{str(read(item, 'created_at') ?? (read(item, 'date') || ''))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">{icon}</div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}