"use client";

import React, { useState } from 'react';
import { Search, Grid3X3, List, Filter, ChevronDown, MoreVertical, Pencil, Eye, Trash2, FileEdit } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
interface Course {
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

// Mock data matching the images
const mockCourses: Course[] = [
  {
    id: '1',
    name: 'Advanced Biochemistry',
    subject: 'Biochemistry',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 12,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  },
  {
    id: '2',
    name: 'Advanced Biochemistry',
    subject: 'Biochemistry',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 12,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  },
  {
    id: '3',
    name: 'Advanced Biochemistry',
    subject: 'Biochemistry',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 12,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  },
  {
    id: '4',
    name: 'Advanced Biochemistry',
    subject: 'Biochemistry',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 12,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  },
  {
    id: '5',
    name: 'Advanced Biochemistry',
    subject: 'Biochemistry',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 12,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  }
];

// Extended data for list view
const listCourses: Course[] = [
  {
    id: '1',
    name: 'Advanced Mathematics - Grade 12',
    subject: 'Mathematics',
    center: 'Cairo Center',
    students: 342,
    exams: 8,
    lectures: 47,
    notes: 6,
    progress: 78,
    status: 'active',
    category: 'active',
    color: 'blue'
  },
  {
    id: '2',
    name: 'Physics Fundamentals - Grade 11',
    subject: 'Physics',
    center: 'Alexandria Center',
    students: 289,
    exams: 8,
    lectures: 47,
    notes: 6,
    progress: 55,
    status: 'active',
    category: 'active',
    color: 'purple'
  },
  {
    id: '3',
    name: 'Organic Chemistry - Grade 12',
    subject: 'Chemistry',
    center: 'Cairo Center',
    students: 198,
    exams: 8,
    lectures: 47,
    notes: 6,
    progress: 90,
    status: 'active',
    category: 'active',
    color: 'green'
  },
  {
    id: '4',
    name: 'Trigonometry & Geometry - Grade 10',
    subject: 'Mathematics',
    center: 'Giza Center',
    students: 251,
    exams: 8,
    lectures: 47,
    notes: 6,
    progress: 40,
    status: 'active',
    category: 'active',
    color: 'orange'
  },
  {
    id: '5',
    name: 'Mechanics & Dynamics - Grade 11',
    subject: 'Physics',
    center: 'Cairo Center',
    students: 167,
    exams: 8,
    lectures: 47,
    notes: 6,
    progress: 62,
    status: 'draft',
    category: 'draft',
    color: 'red'
  }
];

// Course Card Component (Grid View)
function CourseCard({ course }: { course: Course }) {
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
function CourseListView({ courses }: { courses: Course[] }) {
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
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track all your courses</p>
        </div>
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
                <option>All Centers</option>
                <option>Cairo Center</option>
                <option>Alexandria Center</option>
                <option>Giza Center</option>
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
          {mockCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <CourseListView courses={listCourses} />
      )}
    </div>
  );
}
