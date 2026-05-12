'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, ChevronDown, Loader2, Eye, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLibraries, useDeleteLibrary } from '@/src/hooks/useLibraries';
import { useCourses } from '@/src/hooks/useCourses';
import type { Library } from '@/src/types';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
}

function getMaterialTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'booklet': 'bg-[#EEF2FF] text-[#4F46E5]',
    'reference': 'bg-[#FEF3C7] text-[#D97706]',
    'guide': 'bg-[#ECFDF5] text-[#10B981]'
  };
  return colors[type] || 'bg-[#F1F5F9] text-[#64748B]';
}

export default function ElectronicLibraryPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [materialTypeFilter, setMaterialTypeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: librariesResponse, isLoading, error, refetch } = useLibraries();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
  const { mutate: deleteLibrary, isLoading: isDeleting } = useDeleteLibrary();

  const libraries = librariesResponse || [];

  const filteredLibraries = useMemo(() => {
    return libraries.filter((item: Library) => {
      const matchesSearch = debouncedSearch === '' ||
        item.attributes.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.attributes.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesType = materialTypeFilter === 'all' ||
        item.attributes.material_type === materialTypeFilter;
      
      const matchesCourse = courseFilter === 'all' ||
        String(item.attributes.course_id) === courseFilter;
      
      return matchesSearch && matchesType && matchesCourse;
    });
  }, [libraries, debouncedSearch, materialTypeFilter, courseFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm(t('electronicLibrary.deleteConfirm'))) return;
    try {
      await deleteLibrary(id);
      await refetch();
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('electronicLibrary.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('electronicLibrary.pageDescription')}</p>
        </div>
        <Link 
          href="/electronic-library/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          {t('electronicLibrary.addItem')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder={t('electronicLibrary.searchPlaceholder')} 
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={materialTypeFilter}
              onChange={(e) => setMaterialTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">{t('electronicLibrary.filters.allTypes')}</option>
              <option value="booklet">{t('electronicLibrary.filters.booklet')}</option>
              <option value="reference">{t('electronicLibrary.filters.reference')}</option>
              <option value="guide">{t('electronicLibrary.filters.guide')}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              disabled={isLoadingCourses}
              className="appearance-none pl-4 pr-10 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer disabled:opacity-50"
            >
              <option value="all">{t('electronicLibrary.filters.allCourses')}</option>
              {courses?.map((course) => (
                <option key={course.id} value={course.id}>{course.attributes.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="text-center py-12 text-[#EF4444]">
          {t('electronicLibrary.loadError')}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredLibraries.length === 0 && (
        <div className="text-center py-12 text-[#64748B]">
          {t('electronicLibrary.noItems')}
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && filteredLibraries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLibraries.map((item: Library) => (
            <div key={item.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden group">
              {/* Image */}
              <div className="relative h-48 bg-[#F8FAFC] overflow-hidden">
                {item.attributes.cover_image ? (
                  <Image
                    src={item.attributes.cover_image}
                    alt={item.attributes.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-[#94A3B8]">
                    {t('electronicLibrary.card.noImage')}
                  </div>
                )}
                {/* Status Badge */}
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                  item.attributes.is_publish
                    ? 'bg-[#EBFDF5] text-[#10B981]'
                    : 'bg-[#F1F5F9] text-[#64748B]'
                }`}>
                  {item.attributes.is_publish ? t('electronicLibrary.status.published') : t('electronicLibrary.status.draft')}
                </span>
                {/* Type Badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${getMaterialTypeColor(item.attributes.material_type)}`}>
                  {item.attributes.material_type}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-sm font-bold text-[#1E293B] truncate mb-1">{item.attributes.title}</h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-4">{item.attributes.description}</p>
                
                <div className="flex items-center justify-between mb-4">
<<<<<<< HEAD
                  <span className="text-sm font-bold text-[#2137D6]">EGP {Number(item.attributes.price).toFixed(2)}</span>
=======
                  <span className="text-sm font-bold text-[#2137D6]">${Number(item.attributes.price).toFixed(2)}</span>
>>>>>>> origin/master
                  <span className="text-xs text-[#94A3B8]">{formatDate(item.attributes.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#F1F5F9]">
                  <Link 
                    href={`/electronic-library/${item.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-lg transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t('electronicLibrary.card.view')}
                  </Link>
                  <Link 
                    href={`/electronic-library/${item.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#4F46E5] hover:bg-[#EEF2FF] rounded-lg transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('electronicLibrary.card.edit')}
                  </Link>
                  <button 
                    onClick={() => handleDelete(parseInt(item.id))}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('electronicLibrary.card.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
