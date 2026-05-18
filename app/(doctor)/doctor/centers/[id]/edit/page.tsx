'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { useCenter, useUpdateCenter } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function EditCenterPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const centerId = parseInt(params.id as string);

  const { data: center, isLoading: isLoadingCenter } = useCenter(centerId);
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties();
  const { mutate: updateCenter, isLoading: isUpdating, error, progress } = useUpdateCenter();

  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    image: null as File | null,
    existingImage: null as string | null,
  });

  useEffect(() => {
    if (center) {
      setFormData({
        name: center.name,
        parent_id: String(center.parent?.data?.id || center.parent_id || ''),
        image: null,
        existingImage: center.image,
      });
    }
  }, [center]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCenter(centerId, {
        name: formData.name,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
        image: formData.image || undefined,
      });
      router.push('/centers');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingCenter || isLoadingFaculties) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">{t('centers.loading')}</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">{t('centers.notFound')}</p>
      </div>
    );
  }

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
  })) || [];

  return (
    <EntityForm
      title={t('centers.form.editTitle')}
      description={t('centers.form.editDescription')}
      backHref="/centers"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title={t('centers.form.sectionTitle')} icon={<Building2 className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('centers.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : (formData.existingImage || undefined)}
            onClear={() => setFormData({ ...formData, image: null, existingImage: null })}
            progress={isUpdating ? progress : undefined}
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
