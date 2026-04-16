'use client';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useCreateDepartment, useDepartments } from '@/src/hooks/useDepartments';
import { useCenters } from '@/src/hooks/useCenters';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function AddDepartmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createDepartment, isLoading, error, progress } = useCreateDepartment();
  const { data: centers, isLoading: isLoadingCenters } = useCenters();
  
  const [formData, setFormData] = useState({
    name: '',
    parent_type: '' as 'center' | 'department' | '',
    parent_id: '',
    image: null as File | null,
  });

  const { data: departments, isLoading: isLoadingDepartments } = useDepartments();

  const parentTypeOptions = [
    { value: '', label: t('departments.form.selectParentType') },
    { value: 'center', label: t('departments.form.parentTypeCenter') },
    { value: 'department', label: t('departments.form.parentTypeDepartment') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data: { name: string; image?: File; center_id?: number; parent_id?: number | null } = {
        name: formData.name,
        image: formData.image || undefined,
      };

      if (formData.parent_id && formData.parent_type) {
        if (formData.parent_type === 'center') {
          data.center_id = parseInt(formData.parent_id);
        } else if (formData.parent_type === 'department') {
          data.parent_id = parseInt(formData.parent_id);
        }
      }

      await createDepartment(data);
      router.push('/departments');
    } catch {
      // Error handled by hook
    }
  };

  const centerOptions = centers?.map(c => ({
    value: c.id,
    label: c.name,
  })) || [];

  const departmentOptions = departments?.map(d => ({
    value: d.id,
    label: d.attributes.name,
  })) || [];

  const parentOptions = formData.parent_type === 'center'
    ? centerOptions
    : formData.parent_type === 'department'
    ? departmentOptions
    : [];

  return (
    <EntityForm
      title={t('departments.form.addTitle')}
      description={t('departments.form.addDescription')}
      backHref="/departments"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingCenters || isLoadingDepartments}
      error={error}
    >
      <FormSection title={t('departments.form.sectionTitle')} icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('departments.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : undefined}
            onClear={() => setFormData({ ...formData, image: null })}
            progress={isLoading ? progress : undefined}
          />
        </div>

        <FormInput
          label={t('departments.form.nameLabel')}
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('departments.form.namePlaceholder')}
          className="md:col-span-2"
        />
        <FormSelect
          label={t('departments.form.parentTypeLabel')}
          value={formData.parent_type}
          onChange={(e) => setFormData({ ...formData, parent_type: e.target.value as 'center' | 'department', parent_id: '' })}
          options={parentTypeOptions}
        />
        <FormSelect
          label={t('departments.form.parentLabel')}
          value={formData.parent_id}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: t('departments.form.noParent') }, ...parentOptions]}
          disabled={!formData.parent_type}
        />
      </FormSection>
    </EntityForm>
  );
}
