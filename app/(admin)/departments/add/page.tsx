'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';
import { useCreateDepartment } from '@/src/hooks/useDepartments';
import { useCenters } from '@/src/hooks/useCenters';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';
import { FileUpload } from '@/components/FileUpload';

export default function AddDepartmentPage() {
  const router = useRouter();
  const { mutate: createDepartment, isLoading, error } = useCreateDepartment();
  const { data: centers, isLoading: isLoadingCenters } = useCenters([]);
  
  const [formData, setFormData] = useState({
    name: '',
    faculty_id: '',
    image: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createDepartment({
        name: formData.name,
        center_id: parseInt(formData.faculty_id),
        image: formData.image || undefined,
      });
      router.push('/departments');
    } catch {
      // Error handled by hook
    }
  };

  const centerOptions = centers?.map(c => ({
    value: c.id,
    label: c.name,
  })) || [];

  return (
    <EntityForm
      title="Add New Department"
      description="Create a new department or course category"
      backHref="/departments"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingCenters}
      error={error}
    >
      <FormSection title="Department Information" icon={<GraduationCap className="w-4 h-4" />}>
        <div className="md:col-span-2 flex justify-center mb-6">
          <FileUpload
            label="Department Image"
            onFileSelect={(file) => setFormData({ ...formData, image: file })}
            previewUrl={formData.image ? URL.createObjectURL(formData.image) : undefined}
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
          value={formData.faculty_id}
          onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
          options={[{ value: '', label: 'Select Center' }, ...centerOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
