'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { CourseCard } from '@/components/CourseCard';
import Link from 'next/link';
import { useCourses, useDeleteCourse } from '@/src/hooks/useCourses';
import { CourseCardSkeleton } from '@/src/components/ui/Skeleton';
import type { Course } from '@/src/types';
import toast from 'react-hot-toast';

// Helper function to transform API course data to CourseCard props
function transformCourseToCardProps(course: Course, t: (key: string) => string) {
  const attrs = course.attributes;
  // Status: 0 = draft, 1 = active
  const statusMap: { [key: number]: 'ACTIVE' | 'DRAFT' } = {
    0: 'DRAFT',
    1: 'ACTIVE',
  };
  // Approval: 0 = pending, 1 = approved
  const approvalMap: { [key: number]: 'Approved' | 'Pending' | 'Declined' } = {
    0: 'Pending',
    1: 'Approved',
    2: 'Declined',
  };
  return {
    id: parseInt(course.id),
    image: attrs.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
    title: attrs.title || t('courses.card.untitled'),
    instructor: attrs.instructor?.data?.attributes?.full_name || t('courses.card.noInstructor'),
    center: attrs.category?.data?.attributes?.name
      || attrs.center?.data?.attributes?.name
      || attrs.department?.data?.attributes?.name
      || t('courses.card.noCenter'),
    status: statusMap[attrs.status] || 'DRAFT',
    approval: approvalMap[attrs.approval],
    lectures: attrs.stats?.lectures || 0,
    notes: attrs.stats?.notes || 0,
    exams: attrs.stats?.exams || 0,
  };
}

export default function CoursesPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(t('courses.allStatuses'));
  const [approvalFilter, setApprovalFilter] = useState(t('courses.allApprovals'));
  const { data: courses, isLoading, error, refetch } = useCourses({});
  const { mutate: deleteCourse } = useDeleteCourse();

  const handleDelete = async (courseId: number) => {
    if (!confirm(t('courses.deleteConfirm'))) return;
    try {
      await deleteCourse(courseId);
      toast.success(t('courses.deleteSuccess'));
      refetch();
    } catch {
      toast.error(t('courses.deleteError'));
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('courses.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('courses.pageDescription')}</p>
        </div>
        <Link
          href="/courses/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          {t('courses.createCourse')}
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            placeholder={t('courses.searchPlaceholder')}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors"
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
            >
              <option>{t('courses.allApprovals')}</option>
              <option>{t('courses.approved')}</option>
              <option>{t('courses.pending')}</option>
              <option>{t('courses.declined')}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>{t('courses.allStatuses')}</option>
              <option>{t('courses.active')}</option>
              <option>{t('courses.draft')}</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
            <CourseCardSkeleton />
          </>
        ) : error ? (
          <div className="col-span-full text-center py-12 text-red-500">
            {t('common.error')}: {error}
          </div>
        ) : courses && courses.length > 0 ? (
          courses
            .filter((course) => {
              if (statusFilter === t('courses.allStatuses')) return true;
              const statusMap: { [key: number]: string } = { 0: 'Draft', 1: 'Active' };
              const courseStatus = statusMap[course.attributes.status] || 'Draft';
              return courseStatus === statusFilter;
            })
            .filter((course) => {
              if (approvalFilter === t('courses.allApprovals')) return true;
              const approvalMap: { [key: number]: string } = { 0: 'Pending', 1: 'Approved', 2: 'Declined' };
              const courseApproval = approvalMap[course.attributes.approval] || 'Pending';
              return courseApproval === approvalFilter;
            })
            .map((course) => {
              const cardProps = transformCourseToCardProps(course, t);
              return (
                <CourseCard
                  key={course.id}
                  {...cardProps}
                  onView={() => window.location.href = `/courses/${cardProps.id}`}
                  onEdit={() => window.location.href = `/courses/${cardProps.id}/edit`}
                  onDelete={() => handleDelete(cardProps.id)}
                />
              );
            })
        ) : (
          <div className="col-span-full text-center py-12 text-[#64748B]">
            {t('courses.noCourses')}
          </div>
        )}
      </div>
    </div>
  );
}
