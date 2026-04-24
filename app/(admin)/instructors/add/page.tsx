"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Info,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { 
  useCreateInstructor
} from '@/src/hooks';
import type { CreateStudentRequest } from '@/src/types';

export default function AddInstructorPage() {
  const t = useTranslations();
  const router = useRouter();
  
  // Mutation
  const { mutate: createInstructor, isLoading: isCreating, error: createError, progress } = useCreateInstructor();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    specialization: '',
    image: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setFormData(prev => ({ ...prev, image: file }));
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClearImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: CreateStudentRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        image: formData.image || undefined
      };

      await createInstructor(payload);
      router.push('/instructors');
    } catch (err) {
      console.error('Failed to create instructor:', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/instructors"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('instructors.form.addTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('instructors.form.addDescription')}</p>
        </div>
      </div>

      {createError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {createError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Personal Information Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('instructors.form.sections.personal')}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.firstName')} *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.firstNamePlaceholder')}
              />
            </div>

            {/* Last Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.lastName')} *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.lastNamePlaceholder')}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.email')} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.emailPlaceholder')}
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.phone')} *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.phonePlaceholder')}
              />
            </div>

            {/* Specialization */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.specialization')}</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.specializationPlaceholder')}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium text-[#1E293B]">{t('instructors.form.password')} *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                placeholder={t('instructors.form.passwordPlaceholder')}
              />
            </div>

            {/* Profile Image */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <FileUpload
                label={t('instructors.form.image')}
                previewUrl={previewUrl || undefined}
                onFileSelect={handleFileSelect}
                onClear={handleClearImage}
                progress={isCreating ? progress : undefined}
              />
            </div>
          </div>
        </section>

        {/* Submit Section */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/instructors"
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isCreating}
            className="px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
