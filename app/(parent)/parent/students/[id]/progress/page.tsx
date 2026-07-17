"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RefreshCcw } from 'lucide-react';
import { useStudentProgress } from '@/src/hooks';

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

const safeNumber = (value: JsonValue | undefined) => (typeof value === 'number' ? value : Number(value ?? 0) || 0);

export default function ParentStudentProgressPage() {
  const t = useTranslations('parentStudentProgress');
  const params = useParams();
  const studentId = params?.id as string | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const progressQuery = useStudentProgress(studentId ?? '', { enabled: Boolean(studentId) });
  const isLoading = progressQuery.isLoading;
  const isError = progressQuery.isError;
  // API returns flat object { total_courses, completion_rate, courses:[...] } — no .data wrapper
  const rawProgress = progressQuery.data as unknown as JsonObject;
  const progressData: JsonObject = (
    rawProgress && ('courses' in rawProgress || 'completion_rate' in rawProgress)
      ? rawProgress
      : (isObject(rawProgress?.['data'] as unknown as JsonValue) ? (rawProgress?.['data'] as unknown as JsonObject) : {})
  );
  const courses = asArray(read(progressData, 'courses') ?? read(progressData, 'subjects'));
  const overallValue = read(progressData, 'overall_progress') ?? read(progressData, 'completion_rate') ?? read(progressData, 'progress') ?? 0;
  const totalProgress = safeNumber(overallValue);

  const errorMessage = progressQuery.error instanceof Error ? progressQuery.error.message : String(progressQuery.error ?? '');

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Course Progress'}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle') ?? 'Track completed lectures and progress across courses.'}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{t('overallProgress') ?? 'Overall Progress'}</p>
            <p className="text-3xl font-semibold text-slate-900 mt-2">{totalProgress}%</p>
          </div>
          <div className="w-full md:w-1/2">
            <div className="h-4 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, totalProgress))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>{errorMessage || 'Unable to load course progress. Please try again.'}</p>
            <button onClick={() => progressQuery.refetch()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl border border-slate-200 bg-slate-100 p-6" />
          ))
        ) : courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {t('noData') ?? 'Progress data is not available for this student yet.'}
          </div>
        ) : (
          courses.map((course: JsonObject, index: number) => {
            const name = String((read(course, 'name') ?? read(course, 'title')) || 'Course');
            const completed = safeNumber(read(course, 'completed_lectures') ?? read(course, 'completed_chapters') ?? read(course, 'completed') ?? read(course, 'progress_count'));
            const total = safeNumber(read(course, 'total_lectures') ?? read(course, 'total_chapters') ?? read(course, 'total') ?? read(course, 'total_items'));
            const percent = total > 0 ? Math.round((completed / total) * 100) : safeNumber(read(course, 'progress') ?? (read(course, 'completion') || 0));
            const subtitle = `${completed}/${total} ${t('lectures') ?? 'lectures'}`;

            return (
              <div key={index} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{name}</p>
                    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{percent}%</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}