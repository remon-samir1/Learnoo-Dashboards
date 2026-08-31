'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Plus, Loader2, Copy, CheckCircle, Download, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { useCreateCode } from '@/src/hooks';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useLibraries } from '@/src/hooks/useLibraries';
import { useLiveRooms } from '@/src/hooks/useLiveRooms';
import { useQuizzes } from '@/src/hooks/useQuizzes';
import { useDepartments } from '@/src/hooks/useDepartments';

import { CourseTreeSelect } from '@/src/components/admin/CourseTreeSelect';

import toast from 'react-hot-toast';

function SearchableItemSelect({
  items,
  value,
  onChange,
  searchValue,
  onSearchChange,
  placeholder,
  label,
  isLoading
}: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-bold text-[#475569]">{label} <span className="text-red-500">*</span></label>
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
          <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm text-[#1E293B] border-none focus:outline-none placeholder:text-[#94A3B8]"
          />
        </div>
        <div className="max-h-48 overflow-y-auto p-2 custom-scrollbar">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2137D6]" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="flex flex-col gap-1">
              {items.map((item: any) => {
                const isSelected = String(value) === String(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange(String(item.id))}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                      ? 'bg-[#2137D6] text-white font-medium'
                      : 'hover:bg-slate-50 text-[#1E293B]'
                      }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[#64748B]">No items found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function useCodeTypes(t: any) {
  return [
    { value: 'App\\Models\\Course', label: t('activation.types.course') },
    { value: 'App\\Models\\Chapter', label: t('activation.types.chapter') },
    { value: 'App\\Models\\Library', label: t('activation.types.library') },
    { value: 'App\\Models\\LiveRoom', label: t('activation.types.liveRoom') },
    { value: 'App\\Models\\Quiz', label: t('activation.types.quiz') },
  ];
}

function GenerateCodeForm() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate: createCode, isLoading } = useCreateCode();
  const CODE_TYPES = useCodeTypes(t);
  const { data: courses } = useCourses();
  const { data: libraries } = useLibraries();
  const { data: departments } = useDepartments();

  const [codeType, setCodeType] = useState('App\\Models\\Course');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [liveRoomSearch, setLiveRoomSearch] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [quizSearch, setQuizSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const [debouncedQuizSearch] = useDebounce(quizSearch, 500);
  const [debouncedLiveRoomSearch] = useDebounce(liveRoomSearch, 500);

  const { data: liveRooms, isLoading: isLoadingLiveRooms } = useLiveRooms({ search: debouncedLiveRoomSearch });

  // Handle query params for pre-selection
  useEffect(() => {
    const courseId = searchParams.get('course_id');
    const chapterId = searchParams.get('chapter_id');
    const libraryId = searchParams.get('library_id');
    const liveRoomId = searchParams.get('live_room_id');
    const quizId = searchParams.get('quiz_id');
    const departmentId = searchParams.get('department_id');

    if (courseId) {
      setCodeType('App\\Models\\Course');
      setItemId(courseId);
    } else if (chapterId) {
      setCodeType('App\\Models\\Chapter');
      setItemId(chapterId);
    } else if (libraryId) {
      setCodeType('App\\Models\\Library');
      setItemId(libraryId);
    } else if (liveRoomId) {
      setCodeType('App\\Models\\LiveRoom');
      setItemId(liveRoomId);
    } else if (quizId) {
      setCodeType('App\\Models\\Quiz');
      setItemId(quizId);
    } else if (departmentId) {
      setCodeType('App\\Models\\Department');
      setItemId(departmentId);
    }
  }, [searchParams]);

  const getItemsData = () => {
    switch (codeType) {
      case 'App\\Models\\Library':
        const searchLibraries = (libraries || []).filter((lib: any) =>
          (lib.attributes?.title || lib.title || '').toLowerCase().includes(librarySearch.toLowerCase())
        );
        return {
          items: searchLibraries.map((item: any) => ({
            id: item.id,
            label: item.attributes?.title || item.title || `Library ${item.id}`,
          })),
          searchValue: librarySearch,
          onSearchChange: setLibrarySearch,
          placeholder: t('activation.sections.searchStudents') || 'Search libraries...',
        };
      case 'App\\Models\\LiveRoom':
        const searchLiveRooms = liveRooms || [];
        return {
          items: searchLiveRooms.map((item: any) => ({
            id: item.id,
            label: item.attributes?.title || item.title || `Live Room ${item.id}`,
          })),
          searchValue: liveRoomSearch,
          onSearchChange: setLiveRoomSearch,
          placeholder: t('activation.sections.searchStudents') || 'Search live rooms...',
          isLoading: isLoadingLiveRooms,
        };
      case 'App\\Models\\Quiz':
        const searchQuizzes = quizzes || [];
        return {
          items: searchQuizzes.map((item: any) => ({
            id: item.id,
            label: item.attributes?.title || item.title || `Quiz ${item.id}`,
          })),
          searchValue: quizSearch,
          onSearchChange: setQuizSearch,
          placeholder: t('activation.sections.searchStudents') || 'Search quizzes...',
          isLoading: isLoadingQuizzes,
        };
      case 'App\\Models\\Department':
        const searchDeps = (departments || []).filter((d: any) =>
          (d.attributes?.name || d.name || '').toLowerCase().includes(departmentSearch.toLowerCase())
        );
        return {
          items: searchDeps.map((item: any) => ({
            id: item.id,
            label: item.attributes?.name || item.name || `Department ${item.id}`,
          })),
          searchValue: departmentSearch,
          onSearchChange: setDepartmentSearch,
          placeholder: t('activation.sections.searchStudents') || 'Search departments...',
        };
      default:
        return { items: [], searchValue: '', onSearchChange: () => { }, placeholder: '' };
    }
  };

  // Generate a random 8-character alphanumeric code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent, shouldDownload = false) => {
    e.preventDefault();
    if (!itemId) {
      toast.error(t('activation.messages.selectItem'));
      return;
    }

    try {
      // Generate the requested number of codes
      const codesToGenerate: string[] = [];
      for (let i = 0; i < quantity; i++) {
        codesToGenerate.push(generateRandomCode());
      }

      const result = await createCode({
        codeable_id: parseInt(itemId),
        codeable_type: codeType,
        codes: codesToGenerate,
      });

      if (result && Array.isArray(result)) {
        const returnedCodes = result.map((c) => c.attributes.code);
        setGeneratedCodes(returnedCodes);
        toast.success(`${quantity} ${t('activation.messages.codesGenerated')}`);

        if (shouldDownload) {
          handleDownload(returnedCodes);
        }
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    toast.success(t('activation.messages.codeCopied'));
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = (codes: string[]) => {
    import('xlsx').then((XLSX) => {
      const worksheet = XLSX.utils.aoa_to_sheet([
        ['#', 'Activation Code'],
        ...codes.map((code, index) => [index + 1, code])
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activation Codes');

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `activation-codes-${date}.xlsx`);
      toast.success(t('activation.generate.downloaded'));
    });
  };

  const currentItemData = getItemsData();

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
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('activation.generate.title')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('activation.generate.description')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Configuration Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 rounded-t-2xl">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('activation.generate.sectionTitle')}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {codeType === 'App\\Models\\Course' ? (
              <CourseTreeSelect
                value={itemId}
                onChange={(val) => setItemId(val)}
                label={t('activation.generate.assignedItem')}
                required
              />
            ) : codeType === 'App\\Models\\Chapter' ? (
              <CourseTreeSelect
                value={itemId}
                onChange={(val) => setItemId(val)}
                label={t('activation.generate.assignedItem')}
                selectChapters
                required
              />
            ) : (
              <SearchableItemSelect
                items={currentItemData.items}
                value={itemId}
                onChange={setItemId}
                searchValue={currentItemData.searchValue}
                onSearchChange={currentItemData.onSearchChange}
                placeholder={currentItemData.placeholder}
                label={t('activation.generate.assignedItem')}
                isLoading={currentItemData.isLoading}
              />
            )}

            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('activation.generate.quantity')} <span className="text-red-500">*</span></label>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-[#94A3B8]">{t('activation.generate.quantityHint')}</p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/activation"
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            {t('activation.generate.cancel')}
          </Link>
          <button
            type="button"
            disabled={isLoading || !itemId}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('activation.generate.generating')}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                {t('activation.generate.generateAndDownload')}
              </>
            )}
          </button>
          <button
            type="submit"
            disabled={isLoading || !itemId}
            className="flex items-center gap-2 px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('activation.generate.generating')}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {t('activation.generate.generate')}
              </>
            )}
          </button>
        </div>

        {/* Generated Codes Display */}
        {generatedCodes.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm">
            <div className="px-6 py-4 border-b border-[#F1F5F9] bg-green-50/50">
              <h2 className="text-sm font-bold text-green-700 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('activation.generate.generatedCodes')} ({generatedCodes.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
                  >
                    <span className="font-mono font-medium text-[#1E293B] flex-1">{code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(code, index)}
                      className="p-1.5 hover:bg-[#EEF2FF] rounded-lg transition-colors"
                      title={t('activation.actions.copyCode')}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-[#64748B]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </form>
    </div>
  );
}

// Loading fallback for Suspense
function GenerateCodeSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
          <ArrowLeft className="w-5 h-5 text-[#94A3B8]" />
        </div>
        <div className="h-8 w-48 bg-[#F1F5F9] rounded animate-pulse" />
      </div>
      <div className="h-64 bg-[#F1F5F9] rounded-2xl animate-pulse" />
    </div>
  );
}

// Export wrapped in Suspense boundary for useSearchParams compatibility
export default function GenerateCodePage() {
  return (
    <Suspense fallback={<GenerateCodeSkeleton />}>
      <GenerateCodeForm />
    </Suspense>
  );
}
