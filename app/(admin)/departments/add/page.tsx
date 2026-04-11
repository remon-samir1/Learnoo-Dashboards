'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { useCreateDepartment } from '@/src/hooks/useDepartments';
import { useFaculties } from '@/src/hooks/useFaculties';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function AddDepartmentPage() {
  const router = useRouter();
  const { mutate: createDepartment, isLoading, error } = useCreateDepartment();
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties([]);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDepartment({
        name: formData.name,
        code: formData.code || undefined,
        faculty_id: parseInt(formData.faculty_id),
      });
      router.push('/departments');
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
      title="Add New Subject"
      description="Create a new subject (department)"
      backHref="/departments"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingFaculties}
      error={error}
    >
      <FormSection title="Subject Information" icon={<BookOpen className="w-4 h-4" />}>
        <FormInput
          label="Subject Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Mathematics"
        />
        <FormInput
          label="Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., MATH"
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
