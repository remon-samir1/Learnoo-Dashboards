'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layers, Loader2 } from 'lucide-react';
import { useLevel, useUpdateLevel } from '@/src/hooks/useLevels';
import { EntityForm, FormSection, FormInput, FormTextarea } from '@/src/components/admin/EntityForm';

export default function EditLevelPage() {
  const router = useRouter();
  const params = useParams();
  const levelId = parseInt(params.id as string);
  
  const { data: level, isLoading: isLoadingLevel } = useLevel(levelId);
  const { mutate: updateLevel, isLoading: isUpdating, error } = useUpdateLevel();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (level) {
      setFormData({
        name: level.attributes.name,
        description: level.attributes.description,
      });
    }
  }, [level]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateLevel(levelId, {
        name: formData.name,
        description: formData.description,
      });
      router.push('/levels');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingLevel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">Loading level...</p>
      </div>
    );
  }

  if (!level) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">Level not found</p>
      </div>
    );
  }

  return (
    <EntityForm
      title="Edit Level"
      description="Update level information"
      backHref="/levels"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
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
