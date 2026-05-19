'use client';



import React, { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';

import { FileVideo, Loader2 } from 'lucide-react';

import { useChapter, useUpdateChapter } from '@/src/hooks/useChapters';

import { useLectures } from '@/src/hooks/useLectures';

import { EntityForm, FormSection, FormInput, FormSelect, FormTextarea } from '@/src/components/admin/EntityForm';

import toast from 'react-hot-toast';



export default function EditChapterPage() {

  const router = useRouter();

  const params = useParams();

  const chapterId = parseInt(params.id as string);

  

  const { data: chapter, isLoading: isLoadingChapter } = useChapter(chapterId);

  const { data: lectures, isLoading: isLoadingLectures } = useLectures();

  const { mutate: updateChapter, isLoading: isUpdating, error } = useUpdateChapter();

  

  const [formData, setFormData] = useState({

    title: '',

    lecture_id: '',

    duration: '',

    is_free_preview: 0 as 0 | 1,

    type: 'chapter' as 'chapter' | 'note',

    note_type: '' as 'summary' | 'highlight' | 'key_point' | 'important_notice' | '',

    content: '',

  });



  useEffect(() => {

    if (chapter) {

      setFormData({

        title: chapter.attributes.title,

        lecture_id: String(chapter.attributes.lecture_id),

        duration: chapter.attributes.duration,

        is_free_preview: chapter.attributes.is_free_preview,

        type: (chapter.attributes.type as any) || 'chapter',

        note_type: (chapter.attributes.note_type as any) || '',

        content: chapter.attributes.content || '',

      });

    }

  }, [chapter]);



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    

    if (formData.type === 'note' && !formData.note_type) {

      toast.error('Note type is required when type is set to note');

      return;

    }

    try {

      await updateChapter(chapterId, {

        title: formData.title,

        lecture_id: parseInt(formData.lecture_id),

        duration: formData.duration,

        is_free_preview: formData.is_free_preview,

        type: formData.type,

        note_type: formData.type === 'note' ? (formData.note_type || null) : null,

        content: formData.type === 'note' ? (formData.content || null) : null,

        attachments: [],

      });

      router.push('/chapters');

    } catch {

      // Error handled by hook

    }

  };



  if (isLoadingChapter || isLoadingLectures) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[400px]">

        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />

        <p className="mt-4 text-[#64748B]">Loading chapter...</p>

      </div>

    );

  }



  if (!chapter) {

    return (

      <div className="flex flex-col items-center justify-center min-h-[400px]">

        <p className="text-[#64748B]">Chapter not found</p>

      </div>

    );

  }



  const lectureOptions = lectures?.map(l => ({

    value: l.id,

    label: l.attributes.title,

  })) || [];



  return (

    <EntityForm

      title="Edit Chapter"

      description="Update chapter information"

      backHref="/chapters"

      onSubmit={handleSubmit}

      isLoading={isUpdating}

      error={error}

    >

      <FormSection title="Chapter Information" icon={<FileVideo className="w-4 h-4" />}>

        <FormSelect

          label="Lecture"

          required

          value={formData.lecture_id}

          onChange={(e) => setFormData({ ...formData, lecture_id: e.target.value })}

          options={[{ value: '', label: 'Select Lecture' }, ...lectureOptions]}

          className="md:col-span-2"

        />

        <FormInput

          label="Chapter Title"

          required

          value={formData.title}

          onChange={(e) => setFormData({ ...formData, title: e.target.value })}

          placeholder="e.g., Chapter 1: Introduction"

        />

        <FormInput

          label="Duration"

          required

          value={formData.duration}

          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}

          placeholder="e.g., 15:30"

        />

        <FormSelect

          label="Type"

          required

          value={formData.type}

          onChange={(e) => {

            const nextType = e.target.value as any;

            setFormData({

              ...formData,

              type: nextType,

              note_type: nextType === 'note' ? formData.note_type : '',

            });

          }}

          options={[

            { value: 'chapter', label: 'Chapter (Lesson)' },

            { value: 'note', label: 'Note' },

          ]}

        />

        {formData.type === 'note' && (

          <FormSelect

            label="Note Type"

            required

            value={formData.note_type}

            onChange={(e) => setFormData({ ...formData, note_type: e.target.value as any })}

            options={[

              { value: '', label: 'Select Note Type' },

              { value: 'summary', label: 'Summary' },

              { value: 'highlight', label: 'Highlight' },

              { value: 'key_point', label: 'Key Point' },

              { value: 'important_notice', label: 'Important Notice' },

            ]}

          />

        )}

        {formData.type === 'note' && (

          <FormTextarea

            label="Content / Text"

            placeholder="Enter note content..."

            value={formData.content}

            onChange={(e) => setFormData({ ...formData, content: e.target.value })}

            className="md:col-span-2"

          />

        )}

        <div className="flex items-center gap-2 md:col-span-2">

          <input

            type="checkbox"

            id="is_free_preview"

            checked={formData.is_free_preview === 1}

            onChange={(e) => setFormData({ ...formData, is_free_preview: e.target.checked ? 1 : 0 })}

            className="w-4 h-4 rounded border-gray-300 text-[#2137D6] focus:ring-[#2137D6]"

          />

          <label htmlFor="is_free_preview" className="text-sm text-[#475569]">

            Free Preview (available without purchase)

          </label>

        </div>

      </FormSection>

    </EntityForm>

  );

}

