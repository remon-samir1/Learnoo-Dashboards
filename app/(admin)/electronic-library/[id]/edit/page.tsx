'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useLibrary, useUpdateLibrary } from '@/src/hooks/useLibraries';
import { useCourses } from '@/src/hooks/useCourses';
import type { Attachment } from '@/src/types';

export default function EditLibraryItemPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const libraryId = parseInt(params.id as string);

function getPreviewUrl(path: string | null): string {
  if (!path) return '';
  // blob: URLs are for local previews, return as-is
  if (path.startsWith('blob:')) return path;
  // API returns full URLs, return as-is
  return path;
}


  const { data: library, isLoading: isLoadingLibrary, error } = useLibrary(libraryId);
  const { mutate: updateLibrary, isLoading: isUpdating } = useUpdateLibrary();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();

  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [materialType, setMaterialType] = useState('booklet');
  const [codeActivation, setCodeActivation] = useState(false);
  const [isPublish, setIsPublish] = useState(false);
  const [price, setPrice] = useState('');

  const MATERIAL_TYPES = [
    { value: 'booklet', label: t('electronicLibrary.filters.booklet') },
    { value: 'reference', label: t('electronicLibrary.filters.reference') },
    { value: 'guide', label: t('electronicLibrary.filters.guide') }
  ];

  // Populate form when data loads
  useEffect(() => {
    if (library) {
      setCoverImagePreview(library.attributes.cover_image || '');
      setExistingAttachments(library.attributes.attachments || []);
      setTitle(library.attributes.title || '');
      setDescription(library.attributes.description || '');
      setCourseId(String(library.attributes.course_id) || '');
      setMaterialType(library.attributes.material_type || 'booklet');
      setCodeActivation(library.attributes.code_activation || false);
      setIsPublish(library.attributes.is_publish || false);
      setPrice(library.attributes.price || '');
    }
  }, [library]);

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
    if (!title.trim()) return;

    try {
      await updateLibrary(libraryId, {
        ...(coverImage && { cover_image: coverImage }),
        ...(attachments.length > 0 && { attachment: attachments[0] }),
        title: title.trim(),
        description: description.trim(),
        course_id: parseInt(courseId || '0'),
        material_type: materialType as any,
        code_activation: codeActivation,
        is_publish: isPublish,
        price: price ? parseFloat(price) : 0
      });
      router.push(`/electronic-library/${libraryId}`);
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingLibrary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-[#EF4444]">{t('electronicLibrary.detail.loadError')}</p>
        <Link 
          href="/electronic-library"
          className="flex items-center gap-2 px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('electronicLibrary.backToLibrary')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/electronic-library/${libraryId}`}
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('electronicLibrary.edit.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('electronicLibrary.edit.pageDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Item Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.edit.sections.itemDetails')}</h2>
          
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.title')} <span className="text-[#EF4444]">*</span></label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.description')}</label>
            <textarea 
              rows={4}
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.course')}</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={isLoadingCourses}
                >
                  <option value="">{t('electronicLibrary.edit.fields.selectCourse')}</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>{course.attributes.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>

            {/* Material Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.materialType')}</label>
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
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.price')}</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.edit.sections.coverImage')}</h2>
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
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.uploadNewCoverImage')}</label>
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
                  {coverImage ? coverImage.name : t('electronicLibrary.edit.fields.clickToUploadNewImage')}
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">{t('electronicLibrary.edit.fields.supportedFormats')}</p>
            </div>
          </div>
        </section>

        {/* Attachment Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.edit.sections.attachment')}</h2>
          <div className="flex flex-col gap-4">
            {/* Existing Attachments Display */}
            {existingAttachments.length > 0 && attachments.length === 0 && (
              existingAttachments.map((att) => (
                <div key={att.id} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">{att.attributes.name}</p>
                    <p className="text-xs text-[#94A3B8]">{att.attributes.extension.toUpperCase()} • {(parseInt(att.attributes.size) / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExistingAttachments(existingAttachments.filter(a => a.id !== att.id))}
                    className="p-1.5 hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] rounded-lg transition-all"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
            
            {/* Selected New File Display */}
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
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.edit.fields.uploadNewFile')}</label>
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
                  {attachments.length > 0 ? t('electronicLibrary.edit.fields.changeFile') : t('electronicLibrary.edit.fields.clickToUploadNewFile')}
                </label>
              </div>
              <p className="text-xs text-[#94A3B8]">{t('electronicLibrary.add.fields.fileTypes')}</p>
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.edit.sections.settings')}</h2>
          
          {/* Code Activation */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">{t('electronicLibrary.edit.settings.codeActivation')}</span>
              <span className="text-[13px] text-[#64748B]">{t('electronicLibrary.edit.settings.codeActivationDescription')}</span>
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
              <span className="text-[14px] font-bold text-[#1E293B]">{t('electronicLibrary.edit.settings.publishItem')}</span>
              <span className="text-[13px] text-[#64748B]">{t('electronicLibrary.edit.settings.publishItemDescription')}</span>
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
          <Link 
            href={`/electronic-library/${libraryId}`}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
          >
            {t('electronicLibrary.edit.buttons.cancel')}
          </Link>
          <button 
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('electronicLibrary.edit.buttons.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('electronicLibrary.edit.buttons.saveChanges')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
