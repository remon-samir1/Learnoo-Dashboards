'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useCreateUniversity } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput } from '@/src/components/admin/EntityForm';

export default function AddUniversityPage() {
  const router = useRouter();
  const { mutate: createUniversity, isLoading, error } = useCreateUniversity();
  
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createUniversity({
        name: formData.name,
      });
      router.push('/universities');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <EntityForm
      title="Add New University"
      description="Create a new university or institution"
      backHref="/universities"
      onSubmit={handleSubmit}
      isLoading={isLoading}
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
