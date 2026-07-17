"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clock, BookOpen, Award, RefreshCcw } from 'lucide-react';
import { useStudentActivity } from '@/src/hooks';

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

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const str = (value: JsonValue | undefined) => (value === undefined || value === null ? '' : String(value));

export default function ParentStudentActivityPage() {
  const t = useTranslations('parentActivity');
  const params = useParams();
  const studentId = params?.id as string | undefined;
  const [filter, setFilter] = useState<'all' | 'exam' | 'lecture'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const activityQuery = useStudentActivity(studentId ?? '', { enabled: Boolean(studentId) });
  const isLoading = activityQuery.isLoading;
  const isError = activityQuery.isError;

  // API returns { activities: [...] } directly — not { data: [...] }
  const raw = activityQuery.data as unknown as Record<string, unknown>;
  const activityData: JsonObject[] = (() => {
    const arr = (raw?.activities ?? raw?.data ?? raw) as unknown;
    return Array.isArray(arr) ? (arr as JsonObject[]) : [];
  })();

  const filteredItems = (() => {
    if (filter === 'all') return activityData;
    return activityData.filter((item) => {
      const type = str(read(item, 'type')).toLowerCase();
      return type.includes(filter);
    });
  })();

  const totalItems = activityData.length;

  const errorMessage = activityQuery.error instanceof Error ? activityQuery.error.message : String(activityQuery.error ?? '');

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Attendance History'}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle') ?? 'Monitor attendance and lecture participation.'}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('totalActivities') ?? 'Total Activities'}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{totalItems}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>{t('filterAll') ?? 'All'}</FilterButton>
            <FilterButton active={filter === 'exam'} onClick={() => setFilter('exam')}>{t('filterExam') ?? 'Exams'}</FilterButton>
            <FilterButton active={filter === 'lecture'} onClick={() => setFilter('lecture')}>{t('filterLecture') ?? 'Lectures'}</FilterButton>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>{errorMessage || 'Unable to load attendance activity.'}</p>
            <button onClick={() => activityQuery.refetch()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('timeline') ?? 'Activity Timeline'}</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-700">
            <Clock className="h-4 w-4" /> {filteredItems.length} {filteredItems.length === 1 ? 'Entry' : 'Entries'}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {t('noActivity') ?? 'No attendance activity found yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const typeRaw = str(read(item, 'type')).toLowerCase();
              const isExam = typeRaw === 'exam';
              return (
                <div key={index} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{str(read(item, 'title') ?? (read(item, 'subject') || 'Activity'))}</p>
                      <p className="text-xs text-slate-500 mt-1">{str(read(item, 'time') ?? (read(item, 'date') || ''))}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      isExam ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isExam ? <Award className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                      {str(read(item, 'type') || 'Activity')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
    >
      {children}
    </button>
  );
}