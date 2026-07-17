"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { 
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  Bell,
  RefreshCcw,
  Award
} from 'lucide-react';
import type { LinkedStudent } from '@/src/types/parent.types';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useLinkedStudents, useStudentActivity, useStudentAlerts, useStudentDashboard } from '@/src/hooks';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

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

const STORAGE_KEY = 'parentStudentId';

export default function ParentDashboard() {
  const t = useTranslations('parentDashboard');
  const { user } = useCurrentUser();
  const { data: linkedResponse, isLoading: isStudentsLoading, isError: linkedError, error: linkedErrorMessage, refetch: refetchStudents } = useLinkedStudents();
  const linkedStudents = linkedResponse?.data ?? [] as LinkedStudent[];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persistedId = localStorage.getItem(STORAGE_KEY);
    if (persistedId) {
      setSelectedStudentId(persistedId);
      return;
    }

    if (linkedStudents.length > 0) {
      const firstId = String(linkedStudents[0].id);
      localStorage.setItem(STORAGE_KEY, firstId);
      setSelectedStudentId(firstId);
    }
  }, [linkedStudents]);

  const dashboardQuery = useStudentDashboard(selectedStudentId ?? '', {
    enabled: Boolean(selectedStudentId),
  });
  const activityQuery = useStudentActivity(selectedStudentId ?? '', {
    enabled: Boolean(selectedStudentId),
  });
  const alertsQuery = useStudentAlerts(selectedStudentId ?? '', {
    enabled: Boolean(selectedStudentId),
  });

  useEffect(() => {
    if (selectedStudentId) {
      localStorage.setItem(STORAGE_KEY, selectedStudentId);
    }
  }, [selectedStudentId]);

  const isLoading = isStudentsLoading || dashboardQuery.isLoading || activityQuery.isLoading || alertsQuery.isLoading;
  const hasError = linkedError || dashboardQuery.isError || activityQuery.isError || alertsQuery.isError;
  const errorMessage = linkedErrorMessage ?? dashboardQuery.error ?? activityQuery.error ?? alertsQuery.error;
  const errorMessageText = typeof errorMessage === 'string' ? errorMessage : errorMessage?.message ?? '';

  // The API returns { student, quick_overview } at the top level — no `.data` wrapper.
  const rawDash = dashboardQuery.data as unknown as Record<string, unknown>;
  const dashboardData: Record<string, unknown> = (
    rawDash && ('student' in rawDash || 'quick_overview' in rawDash)
      ? rawDash
      : (rawDash?.data as Record<string, unknown>) ?? {}
  );
  const overview = (dashboardData.quick_overview ?? dashboardData.overview ?? {}) as Record<string, any>;
  // Activity API returns { activities: [...] }, Alerts API returns { alerts: [...] }
  const rawActivity = activityQuery.data as unknown as Record<string, unknown>;
  const rawAlerts = alertsQuery.data as unknown as Record<string, unknown>;
  const recentActivity = ((dashboardData.recent_activity ?? rawActivity?.activities ?? rawActivity?.data ?? []) as any[]);
  const alerts = ((dashboardData.alerts ?? rawAlerts?.alerts ?? rawAlerts?.data ?? []) as any[]);

  const studentOptions = useMemo(() => {
    return linkedStudents.map((student) => {
      const attrs = student.attributes ?? student;
      const id = String(student.id ?? attrs?.id ?? attrs?.attributes?.id ?? '');
      const firstName = (attrs?.first_name ?? '') as string;
      const lastName = (attrs?.last_name ?? '') as string;
      const fullName = (attrs?.full_name ?? `${firstName} ${lastName}`.trim() ?? attrs?.name ?? attrs?.label) as string;
      const rel = (attrs?.grade ?? attrs?.relationship ?? '') as string;
      return { id, label: rel ? `${fullName} (${rel})` : fullName };
    });
  }, [linkedStudents]);

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('welcome') || 'Welcome'}, {user?.attributes?.first_name || 'Parent'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t('subtitle') || 'Here is an overview of your children\'s progress.'}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">{t('selectChild') || 'Select Child:'}</span>
            <select
              value={selectedStudentId ?? ''}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={studentOptions.length === 0}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {studentOptions.length === 0 ? (
                <option value="">{t('noStudentSelected') || 'No linked children'}</option>
              ) : (
                studentOptions.map((student) => (
                  <option key={student.id} value={student.id}>{student.label}</option>
                ))
              )}
            </select>
          </div>
          <Link href="/parent/students" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition">
            {t('manageChildren') || 'Manage Children'}
          </Link>
        </div>
      </div>

      {hasError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{t('errorTitle') || 'Unable to load parent dashboard'}</p>
              <p className="mt-2 text-sm text-rose-700/80">{errorMessageText || t('errorMessage') || 'There was an error fetching data. Please try again.'}</p>
            </div>
            <button
              onClick={() => {
                refetchStudents();
                dashboardQuery.refetch();
                activityQuery.refetch();
                alertsQuery.refetch();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('retry') || 'Retry'}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('attendance') || 'Attendance Rate'}
          value={String(overview.attendance?.value ?? overview.attendance_rate ?? overview.attendance ?? '—')}
          trend={String(overview.attendance?.change ?? overview.attendance_trend ?? overview.attendance_change ?? '')}
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
          color="bg-indigo-100"
        />
        <StatCard
          title={t('courseProgress') || 'Course Progress'}
          value={String(overview.progress?.value ?? overview.course_progress ?? overview.progress ?? '—')}
          trend={String(overview.progress?.status ?? overview.course_trend ?? overview.progress_change ?? '')}
          icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
          color="bg-emerald-100"
        />
        <StatCard
          title={t('examAverage') || 'Exam Average'}
          value={String(overview.exam_avg?.value ?? overview.exam_average ?? overview.average_score ?? '—')}
          trend={String(overview.exam_avg?.change ?? overview.exam_trend ?? overview.score_change ?? '')}
          icon={<Award className="w-5 h-5 text-amber-600" />}
          color="bg-amber-100"
        />
        <StatCard
          title={t('engagement') || 'Engagement Level'}
          value={String(overview.engagement?.value ?? overview.engagement_level ?? overview.engagement ?? '—')}
          trend={String(overview.engagement?.change ?? overview.engagement_trend ?? overview.engagement_change ?? '')}
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
          color="bg-violet-100"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('recentActivity') || 'Recent Activity'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('recentActivitySubtitle') || 'Latest learning events and course activity'}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <PlaceholderRow />
              <PlaceholderRow />
              <PlaceholderRow />
            </div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noRecentActivity') || 'No recent activity is available yet.'}</p>
          ) : (
            <div className="space-y-4">
              {recentActivity.slice(0, 3).map((item: any, index: number) => (
                <ActivityItem
                  key={index}
                  title={String(item.title ?? item.name ?? item.subject ?? '')}
                  time={String(item.time ?? item.date ?? '')}
                  description={String(item.description ?? item.detail ?? item.summary ?? '')}
                  icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('alerts') || 'Alerts & Reminders'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('alertsSubtitle') || 'Urgent updates for attendance, exams, and learning progress'}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <PlaceholderRow />
              <PlaceholderRow />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noAlerts') || 'No alerts at the moment.'}</p>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 3).map((item: any, index: number) => (
                <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{String(item.title ?? item.subject ?? '')}</p>
                  <p className="text-sm text-slate-600 mt-1">{String(item.message ?? item.description ?? '')}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{String(item.category ?? item.type ?? '')}</span>
                    <span>{String(item.date ?? item.time ?? '')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string; value: string; trend: string; icon: React.ReactNode; color: string }) {
  const cleanedTrend = trend?.toString().trim();
  const isPositive = cleanedTrend.startsWith('+');
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          {icon}
        </div>
        {cleanedTrend ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {cleanedTrend}
          </span>
        ) : null}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold text-slate-900">{value}</h3>
    </div>
  );
}

function ActivityItem({ title, time, description, icon }: { title: string; time: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-1 text-slate-900">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <span className="text-xs text-slate-500">{time}</span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function PlaceholderRow() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-slate-100 p-5"> 
      <div className="h-4 w-3/4 rounded-full bg-slate-200" />
      <div className="mt-3 h-3 w-full rounded-full bg-slate-200" />
      <div className="mt-2 h-3 w-5/6 rounded-full bg-slate-200" />
    </div>
  );
}
