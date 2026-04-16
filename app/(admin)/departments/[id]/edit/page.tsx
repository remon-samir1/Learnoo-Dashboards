'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useDepartment, useUpdateDepartment, useDepartments } from '@/src/hooks/useDepartments';
import { useCenters } from '@/src/hooks/useCenters';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function EditDepartmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const departmentId = parseInt(params.id as string);
  
  const { data: department, isLoading: isLoadingDepartment } = useDepartment(departmentId);
  const { data: centers, isLoading: isLoadingCenters } = useCenters();
  const { mutate: updateDepartment, isLoading: isUpdating, error, progress } = useUpdateDepartment();
  
  const [formData, setFormData] = useState({
    name: '',
    parent_type: '' as 'center' | 'department' | '',
    parent_id: '',
    image: null as File | null,
    existingImage: null as string | null,
  });

  const { data: allDepartments, isLoading: isLoadingAllDepartments } = useDepartments();

  const parentTypeOptions = [
    { value: '', label: t('departments.form.selectParentType') },
    { value: 'center', label: t('departments.form.parentTypeCenter') },
    { value: 'department', label: t('departments.form.parentTypeDepartment') },
  ];

  useEffect(() => {
    if (department) {
      const centerId = department.attributes.center_id;
      const parentId = department.attributes.parent?.data?.id;

      // Determine parent type based on which field is set
      let parentType: 'center' | 'department' | '' = '';
      let parentIdValue = '';

      if (centerId) {
        parentType = 'center';
        parentIdValue = String(centerId);
      } else if (parentId) {
        parentType = 'department';
        parentIdValue = String(parentId);
      }

      setFormData({
        name: department.attributes.name,
        parent_type: parentType,
        parent_id: parentIdValue,
        image: null,
        existingImage: department.attributes.image,
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data: { name: string; center_id?: number; parent_id?: number | null; image?: File } = {
        name: formData.name,
        parent_id: null,
      };

      if (formData.parent_id && formData.parent_type) {
        if (formData.parent_type === 'center') {
          data.center_id = parseInt(formData.parent_id);
        } else if (formData.parent_type === 'department') {
          data.parent_id = parseInt(formData.parent_id);
        }
      }

      if (formData.image) {
        data.image = formData.image;
      }

      await updateDepartment(departmentId, data);
      router.push('/departments');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingDepartment || isLoadingCenters || isLoadingAllDepartments) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        <p className="mt-4 text-[#64748B]">{t('departments.loading')}</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">{t('departments.notFound')}</p>
      </div>
    );
  }

  const centerOptions = centers?.map(c => ({
    value: c.id,
    label: c.name,
  })) || [];

  const departmentOptions = allDepartments
    ?.filter(d => d.id !== String(departmentId))
    ?.map(d => ({
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
      title={t('departments.form.editTitle')}
      description={t('departments.form.editDescription')}
      backHref="/departments"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title={t('departments.form.sectionTitle')} icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label={t('departments.form.imageLabel')}
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : (formData.existingImage || undefined)}
            onClear={() => setFormData({ ...formData, image: null, existingImage: null })}
            progress={isUpdating ? progress : undefined}
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
