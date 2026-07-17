"use client";

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clock, Activity, BarChart3, TrendingUp, RefreshCcw } from 'lucide-react';
import { useStudentWeeklyStats } from '@/src/hooks';

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
const num = (value: JsonValue | undefined) => (typeof value === 'number' ? value : Number(value ?? 0) || 0);

export default function ParentStudentWeeklyStatsPage() {
  const t = useTranslations('parentWeeklyStats');
  const params = useParams();
  const studentId = params?.id as string | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const statsQuery = useStudentWeeklyStats(studentId ?? '', { enabled: Boolean(studentId) });
  // API returns flat object { week_start, week_end, attended, missed, exams, active_days } — no .data wrapper
  const rawStats = statsQuery.data as unknown as JsonObject;
  const statsData: JsonObject = (
    rawStats && ('attended' in rawStats || 'week_start' in rawStats)
      ? rawStats
      : isObject(rawStats?.['data'] as unknown as JsonValue) ? (rawStats?.['data'] as unknown as JsonObject) : {}
  );
  const isLoading = statsQuery.isLoading;
  const isError = statsQuery.isError;

  const hoursByDay = asArray(read(statsData, 'hours_by_day') ?? read(statsData, 'daily_hours'));
  const activityBreakdown = asArray(read(statsData, 'activity_breakdown') ?? read(statsData, 'breakdown'));

  const metrics = {
    attended: num(read(statsData, 'attended') ?? 0),
    missed: num(read(statsData, 'missed') ?? 0),
    exams: num(read(statsData, 'exams') ?? 0),
    active_days: num(read(statsData, 'active_days') ?? 0),
    week_start: str(read(statsData, 'week_start') ?? ''),
    week_end: str(read(statsData, 'week_end') ?? ''),
  };

  const chartSeries = hoursByDay;
  const maxHours = Math.max(1, ...chartSeries.map((item) => num(read(item, 'hours') ?? read(item, 'value'))));

  const summaryCards = [
    { label: t('attended') ?? 'Attended', value: `${metrics.attended}`, icon: Clock },
    { label: t('missed') ?? 'Missed', value: `${metrics.missed}`, icon: Activity },
    { label: t('exams') ?? 'Exams', value: `${metrics.exams}`, icon: BarChart3 },
    { label: t('activeDays') ?? 'Active Days', value: `${metrics.active_days}`, icon: TrendingUp },
  ];

  const errorMessage = statsQuery.error instanceof Error ? statsQuery.error.message : String(statsQuery.error ?? '');

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Weekly Stats'}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {metrics.week_start && metrics.week_end
            ? `${metrics.week_start} → ${metrics.week_end}`
            : (t('subtitle') ?? 'Engagement and study activity for the current week.')}
        </p>
      </div>

      {isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>{errorMessage || 'Unable to load weekly stats. Please try again.'}</p>
            <button onClick={() => statsQuery.refetch()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <RefreshCcw className="mr-2 h-4 w-4" /> Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('dailyTimeSpent') ?? 'Daily Time Spent'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('dailyTimeSpent') ?? 'Study hours during the current week.'}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : chartSeries.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              {t('noData') ?? 'Weekly statistics are not available for this student yet.'}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-3">
              {chartSeries.map((item: JsonObject, index: number) => {
                const label = str(read(item, 'day') ?? (read(item, 'label') || `Day ${index + 1}`));
                const value = num(read(item, 'hours') ?? read(item, 'value'));
                const height = Math.max(16, (value / maxHours) * 100);
                return (
                  <div key={index} className="flex flex-col items-center gap-3">
                    <div className="relative flex h-28 w-full items-end justify-center rounded-3xl bg-slate-100">
                      <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-indigo-600" style={{ height: `${height}%` }} />
                    </div>
                    <p className="text-xs font-semibold text-slate-900">{label}</p>
                    <span className="text-xs text-slate-500">{value}h</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('activityBreakdown') ?? 'Activity Breakdown'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('activityBreakdown') ?? 'Top engagement activities for the week.'}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="h-16 rounded-3xl bg-slate-100" />
              <div className="h-16 rounded-3xl bg-slate-100" />
            </div>
          ) : activityBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noData') ?? 'Weekly statistics are not available for this student yet.'}</p>
          ) : (
            <div className="space-y-4">
              {activityBreakdown.map((item: JsonObject, index: number) => (
                <div key={index} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{str(read(item, 'label') ?? (read(item, 'activity') || 'Activity'))}</p>
                    <span className="text-sm font-semibold text-indigo-600">{str(read(item, 'value') ?? (read(item, 'percentage') || 0))}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, num(read(item, 'value') ?? read(item, 'percentage')))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900">{t('learningConsistency') ?? 'Learning Consistency'}</h3>
            <p className="mt-2 text-sm text-slate-500">{t('consistencyMessage') ?? 'Great consistency! Your child has maintained regular learning sessions over the past few weeks.'}</p>
          </div>
        </section>
      </div>
    </div>
  );
}