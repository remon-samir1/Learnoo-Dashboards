'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useCreateFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function AddFacultyPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createFaculty, isLoading, error, progress } = useCreateFaculty();
  const { data: universities, isLoading: isLoadingUniversities } = useUniversities();
  
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.parent_id) {
      return;
    }

    try {
      await createFaculty({
        name: formData.name,
        parent_id: parseInt(formData.parent_id),
        image: formData.image || undefined,
      });
      router.push('/faculties');
    } catch {
      // Error handled by hook
    }
  };

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  return (
    <EntityForm
      title={t('faculties.form.addTitle')}
      description={t('faculties.form.addDescription')}
      backHref="/faculties"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingUniversities}
      error={error}
    >
      <FormSection title={t('faculties.form.sectionTitle')} icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('faculties.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : undefined}
            onClear={() => setFormData({ ...formData, image: null })}
            progress={isLoading ? progress : undefined}
          />
        </div>

        <FormInput
          label={t('faculties.form.nameLabel')}
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('faculties.form.namePlaceholder')}
          className="md:col-span-2"
        />
        <FormSelect
          label={t('faculties.form.universityLabel')}
          required
          value={String(formData.parent_id)}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: t('faculties.form.selectUniversity') }, ...universityOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
