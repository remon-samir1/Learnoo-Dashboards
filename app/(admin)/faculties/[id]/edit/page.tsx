'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useFaculty, useUpdateFaculty } from '@/src/hooks/useFaculties';
import { useUniversities } from '@/src/hooks/useUniversities';
import { EntityForm, FormSection, FormInput, FormSelect } from '@/src/components/admin/EntityForm';

export default function EditFacultyPage() {
  const router = useRouter();
  const params = useParams();
  const facultyId = parseInt(params.id as string);
  
  const { data: faculty, isLoading: isLoadingFaculty } = useFaculty([facultyId]);
  const { data: universities, isLoading: isLoadingUniversities } = useUniversities([]);
  const { mutate: updateFaculty, isLoading: isUpdating, error } = useUpdateFaculty();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    university_id: '',
  });

  useEffect(() => {
    if (faculty) {
      setFormData({
        name: faculty.attributes.name,
        code: faculty.attributes.code || '',
        university_id: String(faculty.attributes.university_id),
      });
    }
  }, [faculty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateFaculty(facultyId, {
        name: formData.name,
        code: formData.code || undefined,
        university_id: parseInt(formData.university_id),
      });
      router.push('/faculties');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingFaculty || isLoadingUniversities) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">Loading faculty...</p>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">Faculty not found</p>
      </div>
    );
  }

  const universityOptions = universities?.map(u => ({
    value: u.id,
    label: u.attributes.name,
  })) || [];

  return (
    <EntityForm
      title="Edit Faculty"
      description="Update faculty information"
      backHref="/faculties"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
      error={error}
    >
      <FormSection title="Faculty Information" icon={<GraduationCap className="w-4 h-4" />}>
        <FormInput
          label="Faculty Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Faculty of Engineering"
        />
        <FormInput
          label="Code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., ENG"
        />
        <FormSelect
          label="University"
          required
          value={formData.university_id}
          onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
          options={[{ value: '', label: 'Select University' }, ...universityOptions]}
          className="md:col-span-2"
        />
      </FormSection>
    </EntityForm>
  );
}
