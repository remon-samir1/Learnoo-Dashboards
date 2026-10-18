'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateCourse } from '@/src/hooks/useCourses';
import { useDepartments } from '@/src/hooks/useDepartments';

export default function AddCoursePage() {
  const t = useTranslations('courses');
  const router = useRouter();
  const { data: departments, isLoading: loadingDepartments } = useDepartments();
  const { mutate, isLoading, error } = useCreateCourse();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!thumbnail) return;
    await mutate({ title, description, category_id: Number(category), thumbnail, sub_title: '', objectives: '', visibility: 'public', status: 1 });
    router.push('/doctor/courses');
  }

  return <form onSubmit={event => { submit(event).catch(() => {}); }} className="mx-auto max-w-2xl space-y-5 rounded-xl border bg-white p-6">
    <h1 className="text-xl font-bold">{t('createCourse')}</h1>
    <p className="text-sm text-slate-600">{t('review.description')}</p>
    <label className="block text-sm">{t('form.fields.title')}
      <input required maxLength={255} value={title} onChange={event => setTitle(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
    </label>
    <label className="block text-sm">{t('form.fields.department')}
      <select required value={category} disabled={loadingDepartments} onChange={event => setCategory(event.target.value)} className="mt-1 block w-full rounded-lg border p-2">
        <option value="">{t('messages.pleaseSelectDepartment')}</option>
        {departments?.map(department => <option key={department.id} value={department.id}>{department.attributes.name}</option>)}
      </select>
    </label>
    {!loadingDepartments && !departments?.length && <p className="text-sm text-amber-800">{t('review.noDepartments')}</p>}
    <label className="block text-sm">{t('form.fields.description')}
      <textarea value={description} onChange={event => setDescription(event.target.value)} className="mt-1 block w-full rounded-lg border p-2" />
    </label>
    <label className="block text-sm">{t('review.thumbnail')}
      <input required type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setThumbnail(event.target.files?.[0] || null)} className="mt-1 block w-full" />
    </label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="flex gap-3">
      <button disabled={isLoading || !departments?.length} className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50">{t('review.submit')}</button>
      <Link href="/doctor/courses" className="rounded-lg border px-4 py-2">{t('form.buttons.cancel')}</Link>
    </div>
  </form>;
}
