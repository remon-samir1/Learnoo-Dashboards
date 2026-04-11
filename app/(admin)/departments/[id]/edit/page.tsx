'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useDepartment, useUpdateDepartment } from '@/src/hooks/useDepartments';
import { useFaculties } from '@/src/hooks/useFaculties';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = parseInt(params.id as string);
  
  const { data: department, isLoading: isLoadingDepartment } = useDepartment([departmentId]);
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties([]);
  const { mutate: updateDepartment, isLoading: isUpdating, error } = useUpdateDepartment();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_id: '',
    image: null as File | null,
    existingImage: null as string | null,
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.attributes.name,
        code: department.attributes.code || '',
        faculty_id: String(department.attributes.faculty_id),
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
        code: formData.code || undefined,
        faculty_id: parseInt(formData.faculty_id),
        image: formData.image || undefined,
      });
      router.push('/departments');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingDepartment || isLoadingFaculties) {
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

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
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
        <FormInput
          label="Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., MED"
        />
        <FormSelect
          label="Faculty"
          required
          value={formData.faculty_id}
          onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
          options={[{ value: '', label: 'Select Faculty' }, ...facultyOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
