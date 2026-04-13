'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Building2, Loader2 } from 'lucide-react';
import { useCenter, useUpdateCenter } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function EditCenterPage() {
  const router = useRouter();
  const params = useParams();
  const centerId = parseInt(params.id as string);

  const { data: center, isLoading: isLoadingCenter } = useCenter(centerId);
  const { data: faculties, isLoading: isLoadingFaculties } = useFaculties();
  const { mutate: updateCenter, isLoading: isUpdating, error } = useUpdateCenter();

  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
  });

  useEffect(() => {
    if (center) {
      setFormData({
        name: center.name,
        parent_id: String(center.parent?.data?.id || center.parent_id || ''),
      });
    }
  }, [center]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateCenter(centerId, {
        name: formData.name,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : undefined,
      });
      router.push('/centers');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingCenter || isLoadingFaculties) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">Loading center...</p>
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">Center not found</p>
      </div>
    );
  }

  const facultyOptions = faculties?.map(f => ({
    value: f.id,
    label: f.attributes.name,
  })) || [];

  return (
    <EntityForm
      title="Edit Center"
      description="Update center information"
      backHref="/centers"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
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
        <FormSelect
          label="Parent Faculty"
          value={formData.parent_id}
          onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
          options={[{ value: '', label: 'Select Faculty' }, ...facultyOptions]}
        />
      </FormSection>
    </EntityForm>
  );
}
