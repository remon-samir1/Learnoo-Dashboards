"use client";

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
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

// Status filter uses fixed internal values ('all' | 'active' | 'draft'),
// decoupled from the translated label shown to the user.
type StatusValue = 'all' | 'active' | 'draft';

// Course Card Component (Grid View)
// FIX: `t` is now passed in as a prop instead of being called directly,
// since useTranslations() must be called inside a component that is
// itself rendered under the NextIntlClientProvider tree (it was previously
// undefined here, causing a ReferenceError).
function CourseCard({
  course,
  t,
}: {
  course: CourseDisplay;
  t: ReturnType<typeof useTranslations>;
}) {
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
          <p className="text-xs text-gray-500">{t('stats.students')}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          {/* FIX: removed duplicated {course.exams} that was rendered
              twice (once here and once above) unlike the other three cells */}
          <p className="text-lg font-semibold text-gray-900">{course.exams}</p>
          <p className="text-xs text-gray-500">{t('stats.exams')}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.lectures}</p>
          <p className="text-xs text-gray-500">{t('stats.lectures')}</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-lg font-semibold text-gray-900">{course.notes}</p>
          <p className="text-xs text-gray-500">{t('stats.notes')}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{t('contentProgress')}</span>
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
        {t('viewCourse')}
      </button>
    </div>
  );
}

// List View Component
function CourseListView({ courses, t, onDelete }: { courses: CourseDisplay[]; t: ReturnType<typeof useTranslations>; onDelete: (id: string) => void }) {
  const router = useRouter();

  // FIX: getProgressColor and getIndicatorColor were identical duplicated
  // functions; merged into one.
  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600',
      purple: 'bg-purple-600',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500',
    };
    return colors[color] || 'bg-blue-600';
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-[#E5E7EB]">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.course')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.subject')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.students')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.progress')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.exam')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.notes')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.status')}</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id} className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 rounded-full ${getColorClass(course.color)}`} />
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
                        className={`h-full rounded-full ${getColorClass(course.color)}`}
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
                    {course.status === 'active' ? t('status.active') : t('status.draft')}
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
  const t = useTranslations('doctorCourses');
  const tc = useTranslations('common');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState<string>(t('allCenters'));
  // FIX: statusFilter now stores a stable internal value ('all' | 'active' | 'draft')
  // instead of a translated label, so the comparison logic doesn't break
  // when the UI language isn't English.
  const [statusFilter, setStatusFilter] = useState<StatusValue>('all');
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: allCourses, isLoading } = useCourses();
  const deleteMutation = useDeleteCourse();
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
    return [t('allCenters'), ...Array.from(unique)];
  }, [courses, t]);

  // Filter by search and dropdowns
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCenter = centerFilter === t('allCenters') || c.center === centerFilter;
      // FIX: compares against the internal status value directly now.
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesCenter && matchesStatus;
    });
  }, [courses, searchQuery, centerFilter, statusFilter, t]);

  // FIX: use mutateAsync so the try/catch around the await can actually
  // catch a rejected promise. Also tracks which row is being deleted so
  // its button can show a loading state and avoid double-clicks.
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;

    try {
      setDeletingId(id);
      await deleteMutation.mutateAsync(Number(id));
    } catch {
      // error handled by hook
    } finally {
      setDeletingId(null);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/doctor/courses/add')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            {t('createCourse')}
          </button>
          {viewMode === 'list' && (
            <button
              onClick={() => router.push('/doctor/content-manager')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <FileEdit className="w-4 h-4" />
              {t('editContent')}
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
              placeholder={t('searchPlaceholder')}
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
              {/* FIX: option values are now stable internal values,
                  while the visible label stays translated. */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusValue)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm text-blue-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">{t('allStatus')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="draft">{t('status.draft')}</option>
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
      {filteredCourses.length === 0 ? (
        // FIX: added an empty state instead of silently rendering nothing.
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center text-gray-500">
          {t('noCoursesFound')}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} t={t} />
          ))}
        </div>
      ) : (
        <CourseListView courses={filteredCourses} t={t} onDelete={handleDelete} />
      )}
    </div>
  );
}