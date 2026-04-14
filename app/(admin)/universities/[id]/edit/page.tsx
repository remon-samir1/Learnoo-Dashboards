'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { useUniversity, useUpdateUniversity } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput } from '@/src/components/admin/EntityForm';

export default function EditUniversityPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const universityId = parseInt(params.id as string);
  
  const { data: university, isLoading: isLoadingUniversity } = useUniversity(universityId);
  const { mutate: updateUniversity, isLoading: isUpdating, error } = useUpdateUniversity();
  
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (university) {
      setFormData({
        name: university.attributes.name,
      });
    }
  }, [university]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateUniversity(universityId, {
        name: formData.name,
      });
      router.push('/universities');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingUniversity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">{t('universities.loading')}</p>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">{t('universities.notFound')}</p>
      </div>
    );
  }

  return (
    <EntityForm
      title={t('universities.form.editTitle')}
      description={t('universities.form.editDescription')}
      backHref="/universities"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title={t('universities.form.sectionTitle')} icon={<Building2 className="w-4 h-4" />}>
        <FormInput
          label={t('universities.form.nameLabel')}
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('universities.form.namePlaceholder')}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
