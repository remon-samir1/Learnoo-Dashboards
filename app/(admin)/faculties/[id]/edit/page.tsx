'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useFaculty, useUpdateFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function EditFacultyPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const facultyId = parseInt(params.id as string);
  
  const { data: faculty, isLoading: isLoadingFaculty } = useFaculty(facultyId);
  const { data: universities, isLoading: isLoadingUniversities } = useUniversities();
  const { mutate: updateFaculty, isLoading: isUpdating, error, progress } = useUpdateFaculty();
  
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    image: null as File | null,
    existingImage: null as string | null,
  });

  useEffect(() => {
    if (faculty && universities) {
      const parentId = faculty.attributes.parent?.data?.id;
      setFormData({
        name: faculty.attributes.name,
        parent_id: parentId ? String(parentId) : '',
        image: null,
        existingImage: faculty.attributes.image,
      });
    }
  }, [faculty, universities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.parent_id) {
      return;
    }

    try {
      await updateFaculty(facultyId, {
        name: formData.name,
        parent_id: parseInt(formData.parent_id),
        image: formData.image || undefined,
      });
      router.push('/faculties');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingFaculty || isLoadingUniversities) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">{t('faculties.loading')}</p>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">{t('faculties.notFound')}</p>
      </div>
    );
  }

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  return (
    <EntityForm
      title={t('faculties.form.editTitle')}
      description={t('faculties.form.editDescription')}
      backHref="/faculties"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title={t('faculties.form.sectionTitle')} icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('faculties.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : (formData.existingImage || undefined)}
            onClear={() => setFormData({ ...formData, image: null, existingImage: null })}
            progress={isUpdating ? progress : undefined}
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
