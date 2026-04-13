'use client';

import React, { useState } from 'react';
import { ArrowLeft, FileText, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateNote } from '@/src/hooks/useNotes';
import { useCourses } from '@/src/hooks/useCourses';

const NOTE_TYPES = [
  { value: 'summary', label: 'Summary' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'key_point', label: 'Key Point' },
  { value: 'important_notice', label: 'Important Notice' }
];

export default function AddNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('summary');
  const [content, setContent] = useState('');
  const [courseId, setCourseId] = useState('');
  const [linkedLecture, setLinkedLecture] = useState('');
  const [isPublish, setIsPublish] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: createNote, isLoading } = useCreateNote();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!type.trim()) {
      newErrors.type = 'Type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      await createNote({
        title: title.trim(),
        type: type as any,
        content: content.trim() || '',
        course_id: courseId ? parseInt(courseId) : undefined,
        linked_lecture: linkedLecture.trim() || undefined,
        is_publish: isPublish
      });
      
      router.push('/notes-summaries');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/notes-summaries"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Add New Note</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Create a new note or summary.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">
              Title <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] ${
                errors.title ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-[#EF4444]">{errors.title}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">
              Type <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all ${
                errors.type ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
              }`}
            >
              {NOTE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-[#EF4444]">{errors.type}</p>
            )}
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">
              Course
            </label>
            <div className="relative">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={isLoadingCourses}
                className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
              >
                <option value="">Select a course (optional)</option>
                {courses?.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.attributes.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
            {isLoadingCourses && (
              <p className="mt-1 text-xs text-[#94A3B8]">Loading courses...</p>
            )}
          </div>

          {/* Linked Lecture */}
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">
              Linked Lecture
            </label>
            <input
              type="text"
              value={linkedLecture}
              onChange={(e) => setLinkedLecture(e.target.value)}
              placeholder="Enter linked lecture (optional)"
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-[#475569] mb-2">
              Content
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 w-5 h-5 text-[#94A3B8]" />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter note content..."
                rows={8}
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
              />
            </div>
            <p className="mt-2 text-xs text-[#94A3B8]">
              {content.length} characters
            </p>
          </div>

          {/* Publish Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublish"
              checked={isPublish}
              onChange={(e) => setIsPublish(e.target.checked)}
              className="w-5 h-5 rounded border-[#E2E8F0] text-[#2137D6] focus:ring-[#2137D6]"
            />
            <label htmlFor="isPublish" className="text-sm font-semibold text-[#475569]">
              Publish immediately
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between">
          <Link
            href="/notes-summaries"
            className="px-5 py-2.5 text-sm font-bold text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            Cancel
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
