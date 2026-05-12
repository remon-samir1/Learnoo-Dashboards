'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useCode, useUpdateCode } from '@/src/hooks';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useLibraries } from '@/src/hooks/useLibraries';
import toast from 'react-hot-toast';

function useCodeTypes(t: any) {
  return [
    { value: 'App\\Models\\Course', label: t('activation.types.course') },
    { value: 'App\\Models\\Chapter', label: t('activation.types.chapter') },
    { value: 'App\\Models\\Library', label: t('activation.types.library') },
  ];
}

export default function EditCodePage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const codeId = parseInt(params.id as string);
  const CODE_TYPES = useCodeTypes(t);

  const { data: code, isLoading: isLoadingCode } = useCode(codeId);
  const { mutate: updateCode, isLoading: isUpdating } = useUpdateCode();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { data: chapters, isLoading: isLoadingChapters } = useChapters();
  const { data: libraries, isLoading: isLoadingLibraries } = useLibraries();

  const isLoadingItems = isLoadingCourses || isLoadingChapters || isLoadingLibraries;

  const [codeType, setCodeType] = useState('');
  const [itemId, setItemId] = useState('');
  const [codeValue, setCodeValue] = useState('');

  useEffect(() => {
    if (code) {
      setCodeType(code.attributes.codeable_type);
      setItemId(String(code.attributes.codeable_id));
      setCodeValue(code.attributes.code);
    }
  }, [code]);

  const getItems = () => {
    // Handle both array and { data: array } response formats
    const extractItems = (response: any) => {
      if (Array.isArray(response)) return response;
      if (response?.data) return response.data;
      return [];
    };

    switch (codeType) {
      case 'App\\Models\\Course':
        return extractItems(courses);
      case 'App\\Models\\Chapter':
        return extractItems(chapters);
      case 'App\\Models\\Library':
        return extractItems(libraries);
      default:
        return [];
    }
  };

  const getCurrentItemName = () => {
    const items = getItems();
    if (!items.length) return 'Loading items...';
    const currentItem = items.find((item: any) =>
      String(item.id) === itemId ||
      parseInt(item.id) === parseInt(itemId)
    );
    if (!currentItem) return `Item #${itemId} (not found)`;
    const attrs = currentItem.attributes as any;
    return attrs?.title || attrs?.name || `Item #${itemId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      toast.error(t('activation.messages.selectItem'));
      return;
    }

    try {
      await updateCode(codeId, {
        codeable_id: parseInt(itemId),
        codeable_type: codeType,
        code: codeValue,
      });
      toast.success(t('activation.messages.codeUpdated'));
      router.push('/activation');
    } catch {
      // Error handled by hook
    }
  };

  if (isLoadingCode || isLoadingItems) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="text-[#64748B]">{isLoadingCode ? t('activation.edit.loadingCode') : t('activation.edit.loadingItems')}</p>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">{t('activation.edit.notFound')}</p>
        <Link
          href="/activation"
          className="px-4 py-2 bg-[#2137D6] text-white rounded-xl text-sm font-bold"
        >
          {t('activation.edit.back')}
        </Link>
      </div>
    );
  }

  const items = getItems();

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/activation"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('activation.edit.title')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('activation.edit.description')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Code Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('activation.edit.sectionTitle')}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Code Value */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('activation.edit.codeLabel')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                value={codeValue}
                onChange={(e) => setCodeValue(e.target.value)}
                required
              />
              <p className="text-xs text-[#94A3B8]">{t('activation.edit.codeHint')}</p>
            </div>

            {/* Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('activation.generate.codeType')} <span className="text-red-500">*</span></label>
              <select
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                value={codeType}
                onChange={(e) => {
                  setCodeType(e.target.value);
                  setItemId('');
                }}
                required
              >
                {CODE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Item */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('activation.generate.assignedItem')} <span className="text-red-500">*</span></label>
              {itemId && (
                <div className="px-3 py-2 bg-[#EEF2FF] border border-[#2137D6]/20 rounded-lg">
                  <span className="text-sm font-medium text-[#2137D6]">{t('activation.edit.current')}: {getCurrentItemName()}</span>
                </div>
              )}
              <select
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
              >
                <option value="">{t('activation.generate.selectType')} {CODE_TYPES.find(t => t.value === codeType)?.label}</option>
                {items.map((item: any) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.attributes.title || item.attributes.name || `Item ${item.id}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/activation"
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            {t('activation.edit.cancel')}
          </Link>
          <button
            type="submit"
            disabled={isUpdating || !itemId}
            className="flex items-center gap-2 px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('activation.edit.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('activation.edit.save')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
