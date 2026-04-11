'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { useCreateLecture } from '@/src/hooks/useLectures';
import { useCourses } from '@/src/hooks/useCourses';
import { EntityForm, FormSection, FormInput, FormTextarea, FormSelect } from '@/src/components/admin/EntityForm';

export default function AddLecturePage() {
  const router = useRouter();
  const { mutate: createLecture, isLoading, error } = useCreateLecture();
  const { data: courses, isLoading: isLoadingCourses } = useCourses([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createLecture({
        title: formData.title,
        description: formData.description,
        course_id: parseInt(formData.course_id),
      });
      router.push('/lectures');
    } catch {
      // Error handled by hook
    }
  };

  const courseOptions = courses?.map(c => ({
    value: c.id,
    label: c.attributes.title,
  })) || [];

  return (
    <EntityForm
      title="Add New Lecture"
      description="Create a new lecture for a course"
      backHref="/lectures"
      onSubmit={handleSubmit}
      isLoading={isLoading || isLoadingCourses}
      error={error}
    >
      <FormSection title="Lecture Information" icon={<Video className="w-4 h-4" />}>
        <FormSelect
          label="Course"
          required
          value={formData.course_id}
          onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
          options={[{ value: '', label: 'Select Course' }, ...courseOptions]}
          className="md:col-span-2"
        />
        <FormInput
          label="Lecture Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Introduction to Physics"
        />
        <FormTextarea
          label="Description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter lecture description..."
          rows={4}
        />
      </FormSection>
    </EntityForm>
  );
}
