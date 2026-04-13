'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useCreateFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function AddFacultyPage() {
  const router = useRouter();
  const { mutate: createFaculty, isLoading, error } = useCreateFaculty();
  const { data: universities, isLoading: isLoadingUniversities } = useUniversities([]);
  
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.parent_id) {
      return;
    }

    try {
      await createFaculty({
        name: formData.name,
        parent_id: parseInt(formData.parent_id),
      });
      router.push('/faculties');
    } catch {
      // Error handled by hook
    }
  };

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  return (
    <EntityForm
      title="Add New Faculty"
      description="Create a new faculty or college"
      backHref="/faculties"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingUniversities}
      error={error}
    >
      <FormSection title="Faculty Information" icon={<GraduationCap className="w-4 h-4" />}>
        <FormInput
          label="Faculty Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Faculty of Engineering"
          className="md:col-span-2"
        />
        <FormSelect
          label="University"
          required
          value={String(formData.parent_id)}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: 'Select University' }, ...universityOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
