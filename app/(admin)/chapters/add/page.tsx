'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileVideo } from 'lucide-react';
import { useCreateChapter } from '@/src/hooks/useChapters';
import { useLectures } from '@/src/hooks/useLectures';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function AddChapterPage() {
  const router = useRouter();
  const { mutate: createChapter, isLoading, error } = useCreateChapter();
  const { data: lectures, isLoading: isLoadingLectures } = useLectures();
  
  const [formData, setFormData] = useState({
    title: '',
    lecture_id: '',
    duration: '',
    is_free_preview: 0 as 0 | 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createChapter({
        title: formData.title,
        lecture_id: parseInt(formData.lecture_id),
        duration: formData.duration,
        is_free_preview: formData.is_free_preview,
        attachments: [],
      });
      router.push('/chapters');
    } catch {
      // Error handled by hook
    }
  };

  const lectureOptions = lectures?.map(l => ({
    value: l.id,
    label: l.attributes.title,
  })) || [];

  return (
    <EntityForm
      title="Add New Chapter"
      description="Create a new chapter for a lecture"
      backHref="/chapters"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingLectures}
      error={error}
    >
      <FormSection title="Chapter Information" icon={<FileVideo className="w-4 h-4" />}>
        <FormSelect
          label="Lecture"
          required
          value={formData.lecture_id}
          onChange={(e) => setFormData({ ...formData, lecture_id: e.target.value })}
          options={[{ value: '', label: 'Select Lecture' }, ...lectureOptions]}
          className="md:col-span-2"
        />
        <FormInput
          label="Chapter Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Chapter 1: Introduction"
        />
        <FormInput
          label="Duration"
          required
          value={formData.duration}
          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
          placeholder="e.g., 15:30"
        />
        <div className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            id="is_free_preview"
            checked={formData.is_free_preview === 1}
            onChange={(e) => setFormData({ ...formData, is_free_preview: e.target.checked ? 1 : 0 })}
            className="w-4 h-4 rounded border-gray-300 text-[#2137D6] focus:ring-[#2137D6]"
          />
          <label htmlFor="is_free_preview" className="text-sm text-[#475569]">
            Free Preview (available without purchase)
          </label>
        </div>
      </FormSection>
    </EntityForm>
  );
}
