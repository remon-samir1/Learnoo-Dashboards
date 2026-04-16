'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useCreateCenter } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function AddCenterPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createCenter, isLoading, error, progress } = useCreateCenter();
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties();

  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCenter({
        name: formData.name,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        image: formData.image || undefined,
      });
      router.push('/centers');
    } catch {
      // Error handled by hook
    }
  };

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
  })) || [];

  return (
    <EntityForm
      title={t('centers.form.addTitle')}
      description={t('centers.form.addDescription')}
      backHref="/centers"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingFaculties}
      error={error}
    >
      <FormSection title={t('centers.form.sectionTitle')} icon={<Building2 className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('centers.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : undefined}
            onClear={() => setFormData({ ...formData, image: null })}
            progress={isLoading ? progress : undefined}
          />
        </div>

        <FormInput
          label={t('centers.form.nameLabel')}
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('centers.form.namePlaceholder')}
        />
        <FormSelect
          label={t('centers.form.parentFacultyLabel')}
          value={formData.parent_id}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: t('centers.form.selectFaculty') }, ...facultyOptions]}
        />
      </FormSection>
    </EntityForm>
  );
}
