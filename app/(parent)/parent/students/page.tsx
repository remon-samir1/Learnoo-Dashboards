"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus, Users, RefreshCcw } from 'lucide-react';
import { useLinkStudent, useLinkedStudents } from '@/src/hooks';
import type { LinkedStudent } from '@/src/types/parent.types';

const STORAGE_KEY = 'parentStudentId';

export default function ParentStudentLinkPage() {
  const t = useTranslations('parentStudents');
  const { data: linkedResponse, isLoading, isError, error, refetch } = useLinkedStudents();
  const linkStudentMutation = useLinkStudent();
  const linkedStudents = useMemo<LinkedStudent[]>(() => linkedResponse?.data ?? [], [linkedResponse]);

  const [studentCode, setStudentCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (linkedStudents.length > 0 && typeof window !== 'undefined') {
      const persistedId = localStorage.getItem(STORAGE_KEY);
      if (!persistedId) {
        localStorage.setItem(STORAGE_KEY, String(linkedStudents[0].id));
      }
    }
  }, [linkedStudents]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studentCode.trim()) {
      setMessage({ type: 'error', text: t('errorLinked') ?? 'Please enter a valid student code.' });
      return;
    }

    try {
      const response = await linkStudentMutation.mutateAsync(studentCode.trim());
      setMessage({ type: 'success', text: t('successLinked') ?? 'Student linked successfully.' });
      setStudentCode('');
      refetch();
      const newStudentId = response?.data?.data?.id;
      if (newStudentId && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(newStudentId));
      }
    } catch {
      setMessage({ type: 'error', text: t('errorLinked') ?? 'Unable to link the student. Please check the code and try again.' });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title') ?? 'Student Management'}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('description') ?? 'Link a child to your parent account and view their learning progress.'}</p>
        </div>
        <Link href="/parent/dashboard" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition">
          {t('manageChildren') ?? 'Manage Children'}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('linkButton') ?? 'Link Student'}</p>
              <p className="text-sm text-slate-500 mt-1">{t('codePlaceholder') ?? 'Enter student code'}</p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Plus className="h-5 w-5" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              {t('codeLabel') ?? 'Student Code'}
              <input
                value={studentCode}
                onChange={(event) => setStudentCode(event.target.value)}
                placeholder={t('codePlaceholder') ?? 'Enter student code'}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </label>
            {message ? (
              <div className={`rounded-2xl px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {message.text}
              </div>
            ) : null}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={linkStudentMutation.isLoading}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {linkStudentMutation.isLoading ? 'Linking...' : t('linkButton') ?? 'Link Student'}
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCcw className="h-4 w-4" />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('linkedStudentsTitle') ?? 'Linked Students'}</p>
              <p className="text-sm text-slate-500 mt-1">{t('noStudents') ?? 'No children are linked yet.'}</p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              <PlaceholderRow />
              <PlaceholderRow />
            </div>
          ) : isError ? (
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error?.toString() ?? 'Failed to fetch linked students.'}</div>
          ) : linkedStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              {t('noStudents') ?? 'No children are linked yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {linkedStudents.map((student) => (
                <div key={student.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{student.name ?? student.full_name ?? ''}</p>
                      <p className="text-sm text-slate-500 mt-1">{student.relationship ?? student.grade ?? ''}</p>
                    </div>
                    <Link href={`/parent/students/${student.id}/dashboard`} className="inline-flex h-10 items-center justify-center rounded-2xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 transition">
                      {t('viewDashboard') ?? 'View Dashboard'}
                    </Link>
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

function PlaceholderRow() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-slate-100 p-5">
      <div className="h-4 w-2/5 rounded-full bg-slate-200" />
      <div className="mt-3 h-3 w-full rounded-full bg-slate-200" />
      <div className="mt-2 h-3 w-4/5 rounded-full bg-slate-200" />
    </div>
  );
}
