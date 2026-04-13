"use client";

import React from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Video, 
  BookOpen, 
  FileText, 
  Users, 
  Layers, 
  Edit3,
  BarChart3,
  ClipboardList,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { StatCard } from '@/components/StatCard';
import { ProgressBar } from '@/components/ProgressBar';
import { useCourse } from '@/src/hooks/useCourses';
import { useLectures } from '@/src/hooks/useLectures';
import { useChapters } from '@/src/hooks/useChapters';

export default function CourseDetailPage() {
  const { id } = useParams();
  const courseId = Number(id);

  const { data: course, isLoading: courseLoading, error: courseError } = useCourse([courseId]);
  const { data: lectures, isLoading: lecturesLoading } = useLectures([{ course_id: courseId }]);
  
  // For simplicity in this view, we'll show lectures and their chapter counts.
  // If we wanted to show all chapters, we might need a more complex join or multiple fetches.
  // The original design had "chapters" as the main list items, but typical structure is Course -> Lectures -> Chapters.
  // The provided design shows "Lecture 1: Kinematics" as an item with "4 Chapters".
  
  const isLoading = courseLoading || lecturesLoading;

  if (courseLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#2137D6]" />
        <p className="text-[#64748B] font-medium">Loading course details...</p>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-600 max-w-md text-center">
          <p className="font-bold mb-1">Error Loading Course</p>
          <p className="text-sm">{courseError || "Course not found"}</p>
        </div>
        <Link 
          href="/courses"
          className="px-6 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  const attributes = course.attributes;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/courses"
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1E293B]">{attributes.title}</h1>
              <span className={`px-2 py-1 ${attributes.status === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} rounded-md text-[10px] font-bold uppercase tracking-wider`}>
                {attributes.status === 1 ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-[#64748B] mt-0.5">
              {attributes.sub_title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/content-manager"
            className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
          >
            Manage Content
          </Link>
          <Link 
            href={`/courses/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Edit3 className="w-4 h-4" />
            Edit Course
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Layers} value={attributes.stats?.lectures?.toString() || "0"} label="Lectures" />
        <StatCard icon={Video} value={attributes.stats?.chapters?.toString() || "0"} label="Chapters" />
        <StatCard icon={BookOpen} value={attributes.stats?.notes?.toString() || "0"} label="Notes" />
        <StatCard icon={FileText} value={attributes.stats?.exams?.toString() || "0"} label="Exams" />
        <StatCard icon={Users} value={attributes.stats?.students?.toString() || "0"} label="Students" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">Description</h2>
            <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
              {attributes.description}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-4">Objectives</h2>
            <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
              {attributes.objectives}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#1E293B] mb-6">Lectures & Content</h2>
            <div className="flex flex-col gap-3">
              {attributes.lectures && attributes.lectures.length > 0 ? (
                attributes.lectures.map((lecture: any, idx: number) => (
                  <div key={lecture.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl hover:border-[#2137D6]/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border border-[#E2E8F0] flex items-center justify-center text-sm font-bold text-[#2137D6]">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1E293B]">{lecture.attributes.title}</h4>
                        <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{lecture.attributes.description}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-[10px] font-bold text-[#64748B] hover:border-[#2137D6] hover:text-[#2137D6] transition-colors">
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#94A3B8]">No lectures available.</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          {/* Performance Card */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-[#2137D6]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Performance</h2>
            </div>
            <div className="flex flex-col gap-6">
              <ProgressBar label="Avg. Score" value={0} colorClass="bg-[#10B981]" />
              <ProgressBar label="Completion Rate" value={0} colorClass="bg-[#2137D6]" />
            </div>
          </section>

          {/* Details Card */}
          <section className="bg-white rounded-2xl border border-[#F1F5F9] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <ClipboardList className="w-4 h-4 text-[#2137D6]" />
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Course Details</h2>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Price</p>
                <p className="text-xs font-bold text-[#475569] mt-1">{attributes.price} EGP</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Visibility</p>
                <p className="text-xs font-bold text-[#475569] mt-1 capitalize">{attributes.visibility}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Max Views</p>
                <p className="text-xs font-bold text-[#475569] mt-1">{attributes.max_views_per_student} per student</p>
              </div>
               <div>
                <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold">Created At</p>
                <p className="text-xs font-bold text-[#475569] mt-1">
                  {attributes.created_at ? new Date(attributes.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

