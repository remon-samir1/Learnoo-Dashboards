'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Video, Loader2 } from 'lucide-react';
import { useLecture, useUpdateLecture } from '@/src/hooks/useLectures';
import { useCourses } from '@/src/hooks/useCourses';
import { EntityForm, FormSection, FormInput, FormTextarea, FormSelect } from '@/src/components/admin/EntityForm';

export default function EditLecturePage() {
  const router = useRouter();
  const params = useParams();
  const lectureId = parseInt(params.id as string);
  
  const { data: lecture, isLoading: isLoadingLecture } = useLecture(lectureId);
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { mutate: updateLecture, isLoading: isUpdating, error } = useUpdateLecture();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
  });

  useEffect(() => {
    if (lecture) {
      setFormData({
        title: lecture.attributes.title,
        description: lecture.attributes.description,
        course_id: String(lecture.attributes.course_id),
      });
    }
  }, [lecture]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateLecture(lectureId, {
        title: formData.title,
        description: formData.description,
        course_id: parseInt(formData.course_id),
      });
      router.push('/lectures');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingLecture || isLoadingCourses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="mt-4 text-[#64748B]">Loading lecture...</p>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-[#64748B]">Lecture not found</p>
      </div>
    );
  }

  const courseOptions = courses?.map(c => ({
    value: c.id,
    label: c.attributes.title,
  })) || [];

  return (
    <EntityForm
      title="Edit Lecture"
      description="Update lecture information"
      backHref="/lectures"
      onSubmit={handleSubmit}
      isLoading={isUpdating}
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
