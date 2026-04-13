'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { useUniversity, useUpdateUniversity } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput } from '@/src/components/admin/EntityForm';

export default function EditUniversityPage() {
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
        <p className="mt-4 text-[#64748B]">Loading university...</p>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">University not found</p>
      </div>
    );
  }

  return (
    <EntityForm
      title="Edit University"
      description="Update university information"
      backHref="/universities"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title="University Information" icon={<Building2 className="w-4 h-4" />}>
        <FormInput
          label="University Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Cairo University"
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
