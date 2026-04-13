'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  X,
  ChevronDown,
  Info,
  GraduationCap,
  ShieldCheck,
  Loader2,
  Upload,
  Image as ImageIcon,
  FolderTree
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { useCreateCourse } from '@/src/hooks/useCourses';
import { useDepartments } from '@/src/hooks/useDepartments';

import type { CourseVisibility, CourseStatus, Department } from '@/src/types';

export default function AddCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createCourse, isLoading, error } = useCreateCourse();

  // Fetch data from APIs
  const { data: departments, isLoading: departmentsLoading } = useDepartments();

  const [formData, setFormData] = useState({
    title: '',
    sub_title: '',
    description: '',
    objectives: '',
    user_id: '',
    instructorName: '',
    category_id: '',
    price: '0',
    max_views_per_student: '10',
    visibility: 'public',
    status: 0 as unknown as CourseStatus,
    approval: 1 as unknown as number,
    thumbnail: null as File | null,
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  // Handle thumbnail file selection
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, JPEG)');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, thumbnail: file });
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      toast.success('Image selected successfully');
    }
  };

  // Handle click on thumbnail box
  const handleThumbnailClick = () => {
    fileInputRef.current?.click();
  };

  // Handle removing thumbnail
  const handleRemoveThumbnail = () => {
    setFormData({ ...formData, thumbnail: null });
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show error in toast when error occurs
  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.thumbnail) {
      toast.error('Please upload a course thumbnail');
      return;
    }

    if (!formData.category_id) {
      toast.error('Please enter a category ID');
      return;
    }

    try {
      await createCourse({
        category_id: Number(formData.category_id) || 1,
        title: formData.title,
        sub_title: formData.sub_title,
        description: formData.description,
        thumbnail: formData.thumbnail!,
        objectives: formData.objectives,
        price: parseFloat(formData.price) || 0,
        max_views_per_student: parseInt(formData.max_views_per_student) || 10,
        visibility: formData.visibility as CourseVisibility,
        status: formData.status,
        // approval: 1,
      })

      toast.success('Course created successfully!');
      router.push('/courses');
    } catch {
      // Error is handled by toast in useEffect
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      <Toaster position="top-right" />
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/courses"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Add New Course</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Create a new course and assign instructors and centers.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Course Information Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Course Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Course Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Physics 101: Mechanics"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Subtitle <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Introduction to Classical Mechanics"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.sub_title}
                onChange={(e) => setFormData({ ...formData, sub_title: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[13px] font-bold text-[#475569]">Description <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Enter course description..."
                rows={3}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[13px] font-bold text-[#475569]">Objectives <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Enter course objectives and learning outcomes..."
                rows={3}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                required
              />
            </div>
          </div>
        </section>

        {/* Academic Information Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Academic Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Department <span className="text-red-500">*</span></label>
              <select
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                disabled={departmentsLoading}
              >
                <option value="">{departmentsLoading ? 'Loading departments...' : 'Select Department'}</option>
                {departments?.map((dept: Department) => (
                  <option key={dept.id} value={dept.id}>{dept.attributes?.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
            {/* <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Instructor Name</label>
              <input
                type="text"
                placeholder="Dr. Ahmed Hassan"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.instructorName}
                onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
              />
            </div> */}
          </div>
        </section>

        {/* Pricing & Settings Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Pricing & Settings</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Price (EGP) <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Max Views Per Student <span className="text-red-500">*</span></label>
              <input
                type="number"
                placeholder="10"
                min="1"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.max_views_per_student}
                onChange={(e) => setFormData({ ...formData, max_views_per_student: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Visibility <span className="text-red-500">*</span></label>
              <select
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                required
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Course Thumbnail Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Course Thumbnail <span className="text-red-500">*</span></h2>
          </div>
          <div className="p-6">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleThumbnailSelect}
            />

            {/* Clickable Box */}
            <div
              onClick={handleThumbnailClick}
              className={`
                border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
                ${thumbnailPreview ? 'border-[#2137D6] bg-blue-50/50' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'}
              `}
            >
              {thumbnailPreview ? (
                <div className="relative w-full max-w-md aspect-video">
                  <Image
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveThumbnail();
                    }}
                    className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-200 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[#F8FAFC] rounded-full">
                    <Upload className="w-6 h-6 text-[#94A3B8]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-[#1E293B]">Click to upload thumbnail</p>
                    <p className="text-xs text-[#94A3B8] mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </>
              )}
            </div>

            {formData.thumbnail && (
              <p className="mt-3 text-sm text-[#64748B] text-center">
                Selected: <span className="font-medium">{formData.thumbnail.name}</span> ({(formData.thumbnail.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => router.push('/courses')}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}
