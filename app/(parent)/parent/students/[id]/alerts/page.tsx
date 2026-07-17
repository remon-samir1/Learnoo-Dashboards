"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Bell, ShieldCheck, RefreshCcw } from 'lucide-react';
import { useStudentAlerts } from '@/src/hooks';

type AlertRecord = Record<string, unknown>;

const STORAGE_KEY = 'parentStudentId';

const alertFilters = [
  { key: 'all', labelKey: 'filterAll' },
  { key: 'attendance', labelKey: 'filterAttendance' },
  { key: 'exams', labelKey: 'filterExams' },
  { key: 'feedback', labelKey: 'filterFeedback' },
  { key: 'performance', labelKey: 'filterPerformance' },
];

export default function ParentStudentAlertsPage() {
  const t = useTranslations('parentAlerts');
  const params = useParams();
  const studentId = params?.id as string | undefined;

  useEffect(() => {
    if (typeof window !== 'undefined' && studentId) {
      localStorage.setItem(STORAGE_KEY, studentId);
    }
  }, [studentId]);

  const alertsQuery = useStudentAlerts(studentId ?? '', { enabled: Boolean(studentId) });
  const isLoading = alertsQuery.isLoading;
  const isError = alertsQuery.isError;
  const alertsData = useMemo<AlertRecord[]>(() => {
    // API returns { alerts: [...] } directly — not wrapped in { data: [...] }
    const raw = alertsQuery.data as unknown as Record<string, unknown>;
    const arr = raw?.alerts ?? raw?.data ?? [];
    return Array.isArray(arr) ? arr as AlertRecord[] : [];
  }, [alertsQuery.data]);

  const [activeFilter, setActiveFilter] = useState('all');

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'all') return alertsData;
    return alertsData.filter((alert) => {
      const type = String(alert.type ?? alert.category ?? '').toLowerCase();
      return type.includes(activeFilter);
    });
  }, [activeFilter, alertsData]);

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Notifications & Alerts'}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('subtitle') ?? 'View alerts and priority updates for your child.'}</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-3">
          {alertFilters.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeFilter === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {t(tab.labelKey) ?? tab.labelKey}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>{alertsQuery.error?.message ?? 'Unable to load alerts.'}</p>
              <button onClick={() => alertsQuery.refetch()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
                <RefreshCcw className="mr-2 h-4 w-4" /> Retry
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            {t('noAlerts') ?? 'No alerts to show.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert, index) => {
              const priority = String(alert.priority ?? alert.importance ?? 'Normal');
              const type = String(alert.type ?? alert.category ?? 'General');
              return (
                <div key={index} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{String(alert.title ?? alert.subject ?? 'Notification')}</p>
                      <p className="text-sm text-slate-600 mt-2">{String(alert.message ?? alert.description ?? 'Details are not available.')}</p>
                    </div>
                    <div className="space-y-2 text-right">
                      <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">{priority}</span>
                      <span className="text-xs text-slate-500">{String(alert.date ?? alert.time ?? '')}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> {type}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                      <Bell className="h-3.5 w-3.5" /> {String(alert.status ?? 'New')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
