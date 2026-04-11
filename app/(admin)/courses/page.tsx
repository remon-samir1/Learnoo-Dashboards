'use client';

import React, { useState } from 'react';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { CourseCard } from '@/components/CourseCard';
import Link from 'next/link';
import { useCourses } from '@/src/hooks/useCourses';
import { CourseCardSkeleton } from '@/src/components/ui/Skeleton';
import type { Course } from '@/src/types';

// Helper function to transform API course data to CourseCard props
function transformCourseToCardProps(course: Course) {
  const attrs = course.attributes;
  // Status: 0 = draft, 1 = active
  const statusMap: { [key: number]: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' } = {
    0: 'DRAFT',
    1: 'ACTIVE',
  };
  return {
    id: parseInt(course.id),
    image: attrs.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60',
    title: attrs.title,
    instructor: 'Instructor', // Will be populated from API when available
    center: 'Main Center', // Will be populated from API when available
    status: statusMap[attrs.status] || 'DRAFT',
    lectures: 0, // Will be populated from API when available
    notes: 0, // Will be populated from API when available
    exams: 0, // Will be populated from API when available
  };
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: courses, isLoading, error } = useCourses([], {});

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Courses Management</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Create and manage courses, assign instructors and centers.</p>
        </div>
        <Link 
          href="/courses/add"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          Create Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors">
              <option>All Centers</option>
              <option>Main Center</option>
              <option>Nasr City</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
          </div>
          <div className="relative">
            <select className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#475569] font-medium focus:outline-none cursor-pointer hover:border-[#CBD5E1] transition-colors">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Draft</option>
              <option>Archived</option>
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
            Failed to load courses: {error}
          </div>
        ) : courses && courses.length > 0 ? (
          courses.map((course) => {
            const cardProps = transformCourseToCardProps(course);
            return (
              <Link href={`/courses/${cardProps.id}`} key={course.id}>
                <CourseCard {...cardProps} />
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-[#64748B]">
            No courses found. Create your first course!
          </div>
        )}
      </div>
    </div>
  );
}
