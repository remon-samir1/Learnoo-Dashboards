"use client";

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clock, BookOpen, Award, TrendingUp } from 'lucide-react';
import { useStudentActivity, useStudentAlerts, useStudentDashboard } from '@/src/hooks';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };
type ActivityRecord = JsonObject;
type AlertRecord = JsonObject;

const STORAGE_KEY = 'parentStudentId';

/** Safely read a nested value from a loosely-typed API object. */
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

export default function ParentStudentOverviewPage() {
  const t = useTranslations('parentStudentOverview');
  const params = useParams();
  const studentId = params?.id as string | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const dashboardQuery = useStudentDashboard(studentId ?? '', { enabled: Boolean(studentId) });
  const activityQuery = useStudentActivity(studentId ?? '', { enabled: Boolean(studentId) });
  const alertsQuery = useStudentAlerts(studentId ?? '', { enabled: Boolean(studentId) });

  const isLoading = dashboardQuery.isLoading || activityQuery.isLoading || alertsQuery.isLoading;
  const hasError = dashboardQuery.isError || activityQuery.isError || alertsQuery.isError;
  const errorMessage =
    (dashboardQuery.error instanceof Error ? dashboardQuery.error.message : String(dashboardQuery.error ?? '')) ||
    (activityQuery.error instanceof Error ? activityQuery.error.message : String(activityQuery.error ?? '')) ||
    (alertsQuery.error instanceof Error ? alertsQuery.error.message : String(alertsQuery.error ?? '')) ||
    '';

  // The dashboard endpoint returns { student, quick_overview } directly at the top level,
  // NOT wrapped in a { data: ... } envelope. Fall back to the raw response when `.data` is not an object.
  const rawResponse = dashboardQuery.data as unknown as JsonValue;
  const dashboardData = (
    isObject(rawResponse) && (isObject((rawResponse as JsonObject)['student']) || isObject((rawResponse as JsonObject)['quick_overview']))
      ? rawResponse
      : isObject((rawResponse as JsonObject | undefined)?.['data' as keyof typeof rawResponse] as unknown as JsonValue)
        ? (rawResponse as JsonObject)['data'] as JsonObject
        : {}
  ) as JsonObject;
  const overview = (isObject(read(dashboardData, 'quick_overview')) ? read(dashboardData, 'quick_overview') : isObject(read(dashboardData, 'overview')) ? read(dashboardData, 'overview') : {}) as JsonObject;
  const studentAttr = (isObject(read(dashboardData, 'student', 'data', 'attributes')) ? read(dashboardData, 'student', 'data', 'attributes') : {}) as JsonObject;

  const enrolledCoursesRaw = read(studentAttr, 'enrolled_courses');
  const enrolledCourses = asArray(isObject(enrolledCoursesRaw) && Array.isArray(enrolledCoursesRaw.data) ? (enrolledCoursesRaw.data as JsonValue[]) : enrolledCoursesRaw);
  const examResultsRaw = read(studentAttr, 'exam_results') ?? read(dashboardData, 'exam_results');
  const examResults = asArray(isObject(examResultsRaw) && Array.isArray(examResultsRaw.data) ? (examResultsRaw.data as JsonValue[]) : examResultsRaw);

  const recentActivity = (() => {
    const fromDash = asArray(read(dashboardData, 'recent_activity'));
    const fromQuery = asArray(activityQuery.data?.data as unknown as JsonValue);
    return fromDash.length > 0 ? fromDash : fromQuery;
  })();

  const alerts = (() => {
    const fromDash = asArray(read(dashboardData, 'alerts'));
    const fromQuery = asArray(alertsQuery.data?.data as unknown as JsonValue);
    return fromDash.length > 0 ? fromDash : fromQuery;
  })();

  const str = (value: JsonValue | undefined) => (value === undefined || value === null ? '' : String(value));
  const examAverage = examResults.length > 0
    ? `${Math.round((examResults.reduce((s, r) => s + Number(read(r, 'attributes', 'percentage') ?? read(r, 'percentage') ?? 0), 0) / examResults.length) * 10) / 10}%`
    : '—';

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {str(read(studentAttr, 'full_name')) ||
            (str(read(studentAttr, 'first_name'))
              ? `${str(read(studentAttr, 'first_name'))} ${str(read(studentAttr, 'last_name'))}`
              : (t('title') ?? 'Student Overview'))}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {str(read(studentAttr, 'university', 'data', 'attributes', 'name')) || t('subtitle') || 'Summary of learning progress and recent performance.'}
        </p>
      </div>

      {hasError ? (
        <ErrorBlock message={errorMessage || t('retry') || 'Unable to load the student overview.'} onRetry={() => { dashboardQuery.refetch(); activityQuery.refetch(); alertsQuery.refetch(); }} />
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={t('attendance') ?? 'Attendance Rate'}
          value={str(read(overview, 'attendance', 'value') ?? read(overview, 'attendance_rate') ?? (read(overview, 'attendance') || '—'))}
          change={str(read(overview, 'attendance', 'change') ?? '') || undefined}
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title={t('courseProgress') ?? 'Course Progress'}
          value={str(read(overview, 'progress', 'value') ?? read(overview, 'course_progress') ?? (read(overview, 'progress') || `${enrolledCourses.length} courses`))}
          badge={str(read(overview, 'progress', 'status') ?? '') || undefined}
          icon={<BookOpen className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title={t('examAverage') ?? 'Exam Average'}
          value={str(read(overview, 'exam_avg', 'value') ?? read(overview, 'exam_average') ?? (read(overview, 'average_score') || examAverage))}
          change={str(read(overview, 'exam_avg', 'change') ?? '') || undefined}
          icon={<Award className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          title={t('engagement') ?? 'Engagement Level'}
          value={str(read(overview, 'engagement', 'value') ?? read(overview, 'engagement_level') ?? '—')}
          change={str(read(overview, 'engagement', 'change') ?? '') || undefined}
          icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('recentActivity') ?? 'Recent Activity'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('recentActivitySubtitle') ?? 'Latest course events and activity updates.'}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <PlaceholderRow />
              <PlaceholderRow />
            </div>
          ) : recentActivity.length === 0 && enrolledCourses.length === 0 && examResults.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noRecentActivity') ?? 'No recent activity found.'}</p>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.slice(0, 4).map((item, index) => (
                <ActivityItem
                  key={index}
                  title={str(read(item, 'title') ?? (read(item, 'subject') || 'Activity'))}
                  time={str(read(item, 'time') ?? (read(item, 'date') || '—'))}
                  description={str(read(item, 'description') ?? (read(item, 'summary') || 'No details available.'))}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {enrolledCourses.map((course, index) => {
                const attr = isObject(read(course, 'attributes')) ? (read(course, 'attributes') as JsonObject) : course;
                const examAttempts = examResults.filter(r => String(read(r, 'attributes', 'quiz_id') ?? read(r, 'quiz_id') ?? '') !== '');
                const lastAttempt = examAttempts.length > 0 ? examAttempts[examAttempts.length - 1] : null;
                const lastPct = lastAttempt ? Number(read(lastAttempt, 'attributes', 'percentage') ?? read(lastAttempt, 'percentage') ?? 0) : null;
                return (
                  <ActivityItem
                    key={index}
                    title={str(read(attr, 'title') || t('enrolledCourse') || 'Enrolled Course')}
                    time={str(read(attr, 'updated_at') ?? read(attr, 'created_at') ?? '—')}
                    description={
                      lastPct !== null
                        ? `${t('lastExamScore') ?? 'Last exam score'}: ${lastPct}%  •  ${str(read(attr, 'sub_title') ?? '')}`.trim().replace(/•\s*$/, '')
                        : str(read(attr, 'sub_title') ?? read(attr, 'description') ?? t('noExamsTaken') ?? 'No exams taken yet.')
                    }
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{t('alerts') ?? 'Alerts'}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('alertsSubtitle') ?? 'Current notifications and reminders for this student.'}</p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <PlaceholderRow />
              <PlaceholderRow />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noAlerts') ?? 'No alerts available.'}</p>
          ) : (
            <div className="space-y-4">
              {alerts.slice(0, 5).map((item, index) => (
                <div key={index} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{str(read(item, 'title') ?? (read(item, 'subject') || 'Alert'))}</p>
                      <p className="text-sm text-slate-600 mt-1">{str(read(item, 'message') ?? (read(item, 'description') || 'No additional details.'))}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{str(read(item, 'priority') ?? (read(item, 'level') || 'Info'))}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{str(read(item, 'category') ?? (read(item, 'type') || 'General'))}</span>
                    <span>{str(read(item, 'date') ?? (read(item, 'time') || ''))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, change, badge }: { title: string; value: string; icon: React.ReactNode; change?: string; badge?: string }) {
  const isPositive = change ? change.startsWith('+') : false;
  const isNegative = change ? change.startsWith('-') : false;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">{icon}</div>
        {badge && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge === 'Behind' ? 'bg-rose-100 text-rose-700' :
              badge === 'On Track' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-600'
            }`}>{badge}</span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="mt-3 flex items-end gap-3">
        <h3 className="text-3xl font-semibold text-slate-900">{value}</h3>
        {change && (
          <span className={`mb-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-500' : 'text-slate-500'
            }`}>{change}</span>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ title, time, description }: { title: string; time: string; description: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-500">{time}</span>
      </div>
      <p className="mt-3 text-sm text-slate-600">{description}</p>
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

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>{message}</p>
        <button onClick={onRetry} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
          Retry
        </button>
      </div>
    </div>
  );
}