'use client';

import React, { useState } from 'react';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateLibrary } from '@/src/hooks/useLibraries';
import { useCourses } from '@/src/hooks/useCourses';

const MATERIAL_TYPES = [
  { value: 'booklet', label: 'Booklet' },
  { value: 'reference', label: 'Reference' },
  { value: 'guide', label: 'Guide' }
];

function getPreviewUrl(path: string | null): string {
  if (!path) return '';
  // blob: URLs are for local previews, return as-is
  if (path.startsWith('blob:')) return path;
  // API returns full URLs, return as-is
  return path;
}

export default function AddLibraryItemPage() {
  const router = useRouter();
  const { mutate: createLibrary, isLoading } = useCreateLibrary();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [materialType, setMaterialType] = useState('booklet');
  const [codeActivation, setCodeActivation] = useState(false);
  const [isPublish, setIsPublish] = useState(false);
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!courseId) newErrors.courseId = 'Course is required';
    if (!price.trim() || isNaN(parseFloat(price))) newErrors.price = 'Valid price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachments([file]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createLibrary({
        cover_image: coverImage || 'libraries/covers/default.jpg',
        title: title.trim(),
        description: description.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        course_id: parseInt(courseId),
        material_type: materialType as any,
        code_activation: codeActivation,
        is_publish: isPublish,
        price: parseFloat(price)
      });
      router.push('/electronic-library');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/electronic-library"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Add Library Item</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Add a new book or material to the electronic library and send a notification to students</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Item Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">Item Details</h2>
          
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">Title <span className="text-[#EF4444]">*</span></label>
            <input 
              type="text" 
              placeholder="e.g., Math Reference Guide"
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] ${errors.title ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-[#EF4444]">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">Description <span className="text-[#EF4444]">*</span></label>
            <textarea 
              placeholder="Describe the item..."
              rows={4}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] resize-none ${errors.description ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className="text-xs text-[#EF4444]">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Course <span className="text-[#EF4444]">*</span></label>
              <div className="relative">
                <select 
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all appearance-none cursor-pointer ${errors.courseId ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={isLoadingCourses}
                >
                  <option value="">Select Course</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>{course.attributes.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
              {errors.courseId && <p className="text-xs text-[#EF4444]">{errors.courseId}</p>}
            </div>

            {/* Material Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Material Type</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all appearance-none cursor-pointer"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                >
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">Price <span className="text-[#EF4444]">*</span></label>
            <input 
              type="number" 
              step="0.01"
              placeholder="19.99"
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] ${errors.price ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="text-xs text-[#EF4444]">{errors.price}</p>}
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">Cover Image</h2>
          <div className="flex flex-col gap-4">
            {/* Preview */}
            {coverImagePreview && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#F8FAFC]">
                <img 
                  src={getPreviewUrl(coverImagePreview)} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverImagePreview('');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-all"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Upload Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Upload Cover Image</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  id="coverImageUpload"
                />
                <label 
                  htmlFor="coverImageUpload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                >
                  {coverImage ? coverImage.name : 'Click to upload image'}
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">Supported formats: JPG, PNG, WebP</p>
            </div>
          </div>
        </section>

        {/* Attachment Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">Attachment File</h2>
          <div className="flex flex-col gap-4">
            {/* Selected File Display */}
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{file.name}</p>
                  <p className="text-xs text-[#94A3B8]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="p-1.5 hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] rounded-lg transition-all"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Upload Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Upload File</label>
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleAttachmentChange}
                  className="hidden"
                  id="attachmentUpload"
                />
                <label 
                  htmlFor="attachmentUpload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                >
                  {attachments.length > 0 ? 'Change file' : 'Click to upload file'}
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">PDF, DOC, DOCX, or any file type</p>
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">Settings</h2>
          
          {/* Code Activation */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">Code Activation Required</span>
              <span className="text-[13px] text-[#64748B]">Students need a code to access this item</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={codeActivation}
                onChange={(e) => setCodeActivation(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            </label>
          </div>

          {/* Publish Status */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">Publish Item</span>
              <span className="text-[13px] text-[#64748B]">Make this item visible to students</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isPublish}
                onChange={(e) => setIsPublish(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <button 
            type="button"
            onClick={() => router.push('/electronic-library')}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Library'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
