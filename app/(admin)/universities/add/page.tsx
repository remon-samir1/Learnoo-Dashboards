'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useCreateUniversity } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function AddUniversityPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createUniversity, isLoading, error, progress } = useCreateUniversity();
  
  const [formData, setFormData] = useState({
    name: '',
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createUniversity({
        name: formData.name,
        image: formData.image || undefined,
      });
      router.push('/universities');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <EntityForm
      title={t('universities.form.addTitle')}
      description={t('universities.form.addDescription')}
      backHref="/universities"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      <FormSection title={t('universities.form.sectionTitle')} icon={<Building2 className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('universities.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : undefined}
            onClear={() => setFormData({ ...formData, image: null })}
            progress={isLoading ? progress : undefined}
          />
        </div>

        <div className="md:col-span-2">
          <FormInput
            label={t('universities.form.nameLabel')}
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('universities.form.namePlaceholder')}
          />
        </div>
      </FormSection>
    </EntityForm>
  );
}
