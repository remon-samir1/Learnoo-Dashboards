'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { useCreateCenter } from '@/src/hooks/useCenters';
import { useCenters } from '@/src/hooks/useCenters';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function AddCenterPage() {
  const router = useRouter();
  const { mutate: createCenter, isLoading, error } = useCreateCenter();
  const { data: centers, isLoading: isLoadingCenters } = useCenters([]);

  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createCenter({
        name: formData.name,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
      });
      router.push('/centers');
    } catch {
      // Error handled by hook
    }
  };

  const parentOptions = centers?.map(c => ({
    value: c.id,
    label: c.name,
  })) || [];

  return (
    <EntityForm
      title="Add New Center"
      description="Create a new physical or virtual center"
      backHref="/centers"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingCenters}
      error={error}
    >
      <FormSection title="Center Information" icon={<Building2 className="w-4 h-4" />}>
        <FormInput
          label="Center Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Main Center, Dokki"
        />
        {/* <FormSelect
          label="Parent Center (Optional)"
          value={formData.parent_id}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: 'No Parent' }, ...parentOptions]}
        /> */}
      </FormSection>
    </EntityForm>
  );
}
