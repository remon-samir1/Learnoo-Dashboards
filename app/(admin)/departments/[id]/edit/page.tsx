'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useDepartment, useUpdateDepartment } from '@/src/hooks/useDepartments';
import { useCenters } from '@/src/hooks/useCenters';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = parseInt(params.id as string);
  
  const { data: department, isLoading: isLoadingDepartment } = useDepartment([departmentId]);
  const { data: centers, isLoading: isLoadingCenters } = useCenters([]);
  const { mutate: updateDepartment, isLoading: isUpdating, error } = useUpdateDepartment();
  
  const [formData, setFormData] = useState({
    name: '',
    center_id: '',
    image: null as File | null,
    existingImage: null as string | null,
  });

  useEffect(() => {
    if (department) {
      const centerId = department.attributes.center_id
        || department.attributes.parent?.data?.id
        || '';
      setFormData({
        name: department.attributes.name,
        center_id: String(centerId),
        image: null,
        existingImage: department.attributes.image,
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateDepartment(departmentId, {
        name: formData.name,
        center_id: parseInt(formData.center_id),
        image: formData.image || undefined,
      });
      router.push('/departments');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingDepartment || isLoadingCenters) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        <p className="mt-4 text-[#64748B]">Loading department...</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">Department not found</p>
      </div>
    );
  }

  const centerOptions = centers?.map(c => ({
    value: c.id,
    label: c.name,
  })) || [];

  return (
    <EntityForm
      title="Edit Department"
      description="Update department details and category information"
      backHref="/departments"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title="Department Information" icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label="Department Image"
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : (formData.existingImage || undefined)}
            onClear={() => setFormData({ ...formData, image: null, existingImage: null })}
          />
        </div>

        <FormInput
          label="Department Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Medicine"
        />
        <FormSelect
          label="Center"
          required
          value={formData.center_id}
          onChange={(e) => setFormData({ ...formData, center_id: e.target.value })}
          options={[{ value: '', label: 'Select Center' }, ...centerOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
