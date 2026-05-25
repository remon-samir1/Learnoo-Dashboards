'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LifeBuoy, Send } from 'lucide-react';
import api, { getApiErrorMessage } from '@/src/lib/api';
import Logo from '@/components/Logo';

interface IssuesFormProps {
  isAdmin?: boolean;
}

interface IssueFormData {
  category: string;
  type: string;
  priority: string;
  description: string;
  steps_before_problem_appears: string;
  expected_result: string;
  actual_result: string;
  status: string;
}

export default function IssuesForm({ isAdmin = false }: IssuesFormProps) {
  const t = useTranslations('issues');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null);
  const [attachmentError, setAttachmentError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IssueFormData>({
    defaultValues: {
      status: 'opened',
    },
  });

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setAttachmentFile(null);
      setAttachmentError(null);
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      setAttachmentError('Only PNG, JPG, JPEG, or MP4 files are allowed.');
      setAttachmentFile(null);
      return;
    }

    setAttachmentError(null);
    setAttachmentFile(file);
  };

  const onSubmit = async (data: IssueFormData) => {
    if (attachmentError) {
      toast.error(attachmentError);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (attachmentFile) {
        formData.append('attachment', attachmentFile);
      }

      await api.issues.create(formData);
      toast.success(t('success'));
      reset();
      setAttachmentFile(null);
      setAttachmentError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, t('error'));
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-[28px] overflow-hidden shadow-2xl border border-gray-100">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#f8fbff] to-[#eef4ff] p-10 text-center border-b border-[#e5ecff]">
          {/* Decorative circles */}
          <div className="absolute -top-32 -left-24 w-72 h-72 bg-blue-500/5 rounded-full" />
          <div className="absolute -bottom-32 -right-20 w-56 h-56 bg-red-500/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4F46E5] to-[#2437ff] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <Logo className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-[#1f2a6b] mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed max-w-2xl mx-auto">
              {isAdmin ? "Admin Support Channel" : "Doctor Support Channel"} - We are here to help you solve any problems you face.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-8 lg:p-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {t('category')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category', { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">{t('placeholders.category')}</option>
                  <option value="videos">{t('categories.videos')}</option>
                  <option value="live">{t('categories.live')}</option>
                  <option value="exams">{t('categories.exams')}</option>
                  <option value="community">{t('categories.community')}</option>
                  <option value="library">{t('categories.library')}</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">Field required</p>}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {t('type')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('type', { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">{t('placeholders.type')}</option>
                  <option value="website">{t('types.website')}</option>
                  <option value="app">{t('types.app')}</option>
                  <option value="login">{t('types.login')}</option>
                  <option value="content">{t('types.content')}</option>
                  <option value="payment">{t('types.payment')}</option>
                  <option value="suggestion">{t('types.suggestion')}</option>
                  <option value="other">{t('types.other')}</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">Field required</p>}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {t('priority')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('priority', { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="">{t('placeholders.priority')}</option>
                  <option value="urgent">{t('priorities.urgent')}</option>
                  <option value="medium">{t('priorities.medium')}</option>
                  <option value="low">{t('priorities.low')}</option>
                </select>
                {errors.priority && <p className="text-red-500 text-xs mt-1">Field required</p>}
              </div>

              {/* Status Hidden/Default */}
              <input type="hidden" {...register('status')} />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                {t('description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description', { required: true })}
                placeholder={t('placeholders.description')}
                className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[120px] resize-none"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">Field required</p>}
            </div>

            {/* Steps */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                {t('steps')} <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('steps_before_problem_appears', { required: true })}
                placeholder={t('placeholders.steps')}
                className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[100px] resize-none"
              />
              {errors.steps_before_problem_appears && <p className="text-red-500 text-xs mt-1">Field required</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expected Result */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {t('expected')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('expected_result', { required: true })}
                  placeholder={t('placeholders.expected')}
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[80px] resize-none"
                />
                {errors.expected_result && <p className="text-red-500 text-xs mt-1">Field required</p>}
              </div>

              {/* Actual Result */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  {t('actual')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('actual_result', { required: true })}
                  placeholder={t('placeholders.actual')}
                  className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-[#f8faff] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[80px] resize-none"
                />
                {errors.actual_result && <p className="text-red-500 text-xs mt-1">Field required</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Attachment
              </label>
              <label className="group flex flex-col md:flex-row items-center justify-between gap-4 rounded-3xl border border-dashed border-blue-200 bg-[#f7fbff] p-5 text-left transition hover:border-blue-300 hover:bg-[#eef6ff] cursor-pointer">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900 truncate">
                    {attachmentFile ? attachmentFile.name : 'Upload PNG, JPG, JPEG or MP4'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Optional attachment to help explain the issue.
                  </p>
                  {attachmentFile && (
                    <p className="text-xs text-slate-400 mt-1">
                      {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
                  Browse file
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,video/mp4"
                  className="sr-only"
                  onChange={handleAttachmentChange}
                />
              </label>
              {attachmentError && <p className="text-red-500 text-xs mt-1">{attachmentError}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full py-5 mt-4 overflow-hidden rounded-2xl bg-[#2437ff] text-black text-xl font-extrabold shadow-[0_10px_20px_-5px_rgba(36,55,255,0.4)] hover:shadow-[0_20px_35px_-10px_rgba(36,55,255,0.5)] hover:-translate-y-0.5 active:translate-y-0.5 transition-all duration-300 disabled:color-black disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

              {isSubmitting ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className={`w-6 h-6 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 ${t('submit') === 'إرسال الطلب' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                  <span>{t('submit')}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm font-medium tracking-wide bg-gray-50 py-3 px-6 rounded-full inline-block border border-gray-100">
              {t('submit') === 'إرسال الطلب'
                ? "فريقنا التقني سيقوم بمراجعة طلبك والرد عليك في أقرب وقت ممكن."
                : "Our technical team will review your request and get back to you shortly."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
