'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers } from 'lucide-react';
import { useCreateLevel } from '@/src/hooks/useLevels';
import { EntityForm, FormSection, FormInput, FormTextarea } from '@/src/components/admin/EntityForm';

export default function AddLevelPage() {
  const router = useRouter();
  const { mutate: createLevel, isLoading, error } = useCreateLevel();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createLevel({
        name: formData.name,
        description: formData.description,
      });
      router.push('/levels');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <EntityForm
      title="Add New Level"
      description="Create a new student level or grade"
      backHref="/levels"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    >
      <FormSection title="Level Information" icon={<Layers className="w-4 h-4" />}>
        <FormInput
          label="Level Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., First Year"
        />
        <FormTextarea
          label="Description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe this level..."
          rows={3}
        />
      </FormSection>
    </EntityForm>
  );
}
