"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Users, 
  FileText, 
  Video, 
  MoreVertical, 
  Edit2, 
  Plus,
  FileEdit,
  Play,
  MonitorPlay,
  MessageSquare,
  Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock data
const courseData = {
  name: 'Advanced Biochemistry',
  subject: 'Biochemistry',
  center: 'Cairo Main Center',
  students: 156,
  exams: 6,
  lectures: 24,
  notes: 12,
  progress: 68,
  description: 'Comprehensive study of biochemical processes'
};

const lectures = [
  { id: '1', title: 'Amino Acids and Peptides', views: 145, status: 'published' },
  { id: '2', title: 'Protein Folding', views: 132, status: 'published' },
  { id: '3', title: 'Enzyme Kinetics', views: 0, status: 'draft' },
];

const exams = [
  { id: '1', title: 'Protein Structure Quiz', questions: 20, duration: 30, status: 'active' },
  { id: '2', title: 'Midterm Exam - Biochemistry', questions: 50, duration: 120, status: 'upcoming' },
  { id: '3', title: 'Enzyme Kinetics Assessment', questions: 15, duration: 25, status: 'active' },
  { id: '4', title: 'Final Exam', questions: 80, duration: 180, status: 'draft' },
  { id: '5', title: 'Lab Safety Quiz', questions: 10, duration: 15, status: 'active' },
];

const notes = [
  { id: '1', title: 'Protein Structure Summary', views: 98, type: 'summary' },
  { id: '2', title: 'Important Enzyme Mechanisms', views: 76, type: 'keypoints' },
];

const students = [
  { id: '1', name: 'Ahmed Mohamed', email: 'ahmed.m@example.com', progress: 75, lastActive: '2 hours ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah.j@example.com', progress: 92, lastActive: '1 day ago' },
  { id: '3', name: 'Michael Chen', email: 'michael.c@example.com', progress: 68, lastActive: '3 hours ago' },
  { id: '4', name: 'Emma Williams', email: 'emma.w@example.com', progress: 85, lastActive: '5 hours ago' },
  { id: '5', name: 'David Brown', email: 'david.b@example.com', progress: 45, lastActive: '2 days ago' },
  { id: '6', name: 'Lisa Anderson', email: 'lisa.a@example.com', progress: 78, lastActive: '1 hour ago' },
];

type TabType = 'overview' | 'lectures' | 'students' | 'exams' | 'notes';

export default function CourseDetailPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [examSearch, setExamSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const courseId = '1'; // In real app, get from params

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'lectures', label: 'Lectures' },
    { id: 'students', label: 'Students' },
    { id: 'exams', label: 'Exams' },
    { id: 'notes', label: 'Notes' },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      upcoming: 'bg-amber-100 text-amber-700',
      published: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-600',
      summary: 'bg-blue-100 text-blue-700',
      keypoints: 'bg-blue-100 text-blue-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/doctor/courses')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Course Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{courseData.name}</h1>
              <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                active
              </span>
            </div>
            <p className="text-sm text-gray-500">{courseData.subject} • {courseData.center}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          <FileEdit className="w-4 h-4" />
          Edit Content
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{courseData.lectures}</p>
            <p className="text-sm text-gray-500">Lectures</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{courseData.students}</p>
            <p className="text-sm text-gray-500">Students</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{courseData.exams}</p>
            <p className="text-sm text-gray-500">Exams</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{courseData.notes}</p>
            <p className="text-sm text-gray-500">Notes</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E5E7EB]">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Course Description</h3>
              <p className="text-sm text-gray-600">{courseData.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Course Progress</h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Progress</span>
                  <span className="text-sm font-semibold text-gray-900">{courseData.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${courseData.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">2 of 3 lectures published</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h4>
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push(`/doctor/courses/${courseId}/lectures/create`)}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <MonitorPlay className="w-4 h-4" />
                    Add New Lecture
                  </button>
                  <button 
                    onClick={() => router.push(`/doctor/courses/${courseId}/exams/create`)}
                    className="w-full flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Create Exam
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-blue-600 hover:bg-gray-50 transition-colors">
                    <Play className="w-4 h-4" />
                    Schedule Live Session
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-[#E5E7EB] text-sm text-blue-600 hover:bg-gray-50 transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    View Community
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lectures Tab */}
        {activeTab === 'lectures' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Lectures</h3>
              <button 
                onClick={() => router.push(`/doctor/courses/${courseId}/lectures/create`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Lecture
              </button>
            </div>
            <div className="space-y-3">
              {lectures.map((lecture) => (
                <div key={lecture.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{lecture.title}</p>
                    <p className="text-xs text-gray-500">{lecture.views} views</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(lecture.status)}`}>
                    {lecture.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Enrolled Students</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>
            <div className="space-y-3">
              {students
                .filter(s => 
                  s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                  s.email.toLowerCase().includes(studentSearch.toLowerCase())
                )
                .map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{student.progress}% Complete</p>
                    <p className="text-xs text-gray-400">Last active: {student.lastActive}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exams Tab */}
        {activeTab === 'exams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Exams</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
                <button 
                  onClick={() => router.push(`/doctor/courses/${courseId}/exams/create`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Exam
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {exams
                .filter(e => e.title.toLowerCase().includes(examSearch.toLowerCase()))
                .map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{exam.title}</p>
                    <p className="text-xs text-gray-500">{exam.questions} questions • {exam.duration} minutes</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(exam.status)}`}>
                    {exam.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Notes & Summaries</h3>
              <button 
                onClick={() => router.push(`/doctor/courses/${courseId}/notes/create`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{note.title}</p>
                    <p className="text-xs text-gray-500">{note.views} views</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(note.type)}`}>
                    {note.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
