"use client";

import React, { useState, useMemo } from 'react';
import { Search, Grid3X3, List, ChevronDown, MoreVertical, Pencil, Eye, Trash2, FileEdit, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCourses, useDeleteCourse } from '@/src/hooks/useCourses';
import { useCurrentUser } from '@/src/hooks/useAuth';
import type { Course as ApiCourse } from '@/src/types';

interface CourseDisplay {
  id: string;
  name: string;
  subject: string;
  center: string;
  students: number;
  exams: number;
  lectures: number;
  notes: number;
  progress: number;
  status: 'active' | 'draft';
  category: string;
  color: string;
}

// Course Card Component (Grid View)
function CourseCard({ course }: { course: CourseDisplay }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
      {/* Header with status and menu */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            course.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {course.status}
          </span>
          <span className="text-xs text-gray-400">{course.subject}</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Course Title and Center */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{course.center}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.students}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.exams}</p>
          <p className="text-xs text-gray-500">{course.exams} Exams</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.lectures}</p>
          <p className="text-xs text-gray-500">Lectures</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.notes}</p>
          <p className="text-xs text-gray-500">Notes</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Content Progress</span>
          <span className="text-sm font-semibold text-blue-600">{course.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* View Course Button */}
      <button 
        onClick={() => router.push(`/doctor/courses/${course.id}`)}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
      >
        View Course
      </button>
    </div>
  );
}

// List View Component
function CourseListView({ courses, onDelete }: { courses: CourseDisplay[]; onDelete: (id: string) => void }) {
  const router = useRouter();

  const getProgressColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color] || 'bg-blue-600';
  };

  const getIndicatorColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[color] || 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full ${getIndicatorColor(course.color)}`} />
                    <div>
                      <p className="font-semibold text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-500">{course.center}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">{course.subject}</td>
                <td className="py-4 px-4 text-sm font-medium text-gray-900">{course.students}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getProgressColor(course.color)}`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{course.progress}%</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">{course.exams}</td>
                <td className="py-4 px-4 text-sm text-gray-600">{course.notes}</td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    course.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {course.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => router.push(`/doctor/courses/${course.id}`)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => router.push(`/doctor/courses/${course.id}/edit`)}
                       className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => onDelete(course.id)}
                       className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Page Component
export default function MyCoursesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('All Centers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: allCourses, isLoading } = useCourses();
  const deleteMutation = useDeleteCourse();

  // Filter courses by current doctor/instructor
  const courses = useMemo(() => {
    if (!allCourses || !user) return [];

    return allCourses
      .filter((c: ApiCourse) =>
        String(c.attributes.doctor_id) === String(user.id) ||
        c.attributes.instructor?.data?.id === String(user.id)
      )
      .map((c: ApiCourse): CourseDisplay => ({
        id: c.id,
        name: c.attributes.title,
        subject: c.attributes.sub_title || '-',
        center: c.attributes.category?.data?.attributes?.name || '-',
        students: c.attributes.stats?.students || 0,
        exams: c.attributes.stats?.exams || 0,
        lectures: c.attributes.stats?.lectures || 0,
        notes: 0,
        progress: 0,
        status: c.attributes.status === 1 ? 'active' as const : 'draft' as const,
        category: c.attributes.status === 1 ? 'active' : 'draft',
        color: 'blue',
      }));
  }, [allCourses, user]);

  // Extract unique centers for filter dropdown
  const centers = useMemo(() => {
    const unique = new Set(courses.map(c => c.center).filter(Boolean));
    return ['All Centers', ...Array.from(unique)];
  }, [courses]);

  // Filter by search and dropdowns
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCenter = centerFilter === 'All Centers' || c.center === centerFilter;
      const matchesStatus = statusFilter === 'All Status' || c.status === statusFilter.toLowerCase();
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [courses, searchQuery, centerFilter, statusFilter]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteMutation.mutate(Number(id));
      } catch {
        // error handled by hook
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your courses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/doctor/courses/add')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Create Course
          </button>
          {viewMode === 'list' && (
            <button 
              onClick={() => router.push('/doctor/content-manager')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileEdit className="w-4 h-4" />
              Edit Content
            </button>
          )}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-auto sm:flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and View Toggle */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Center Filter */}
            <div className="relative">
              <select
                value={centerFilter}
                onChange={(e) => setCenterFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {centers.map(center => (
                  <option key={center}>{center}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Draft</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <CourseListView courses={filteredCourses} onDelete={handleDelete} />
      )}
    </div>
  );
}
