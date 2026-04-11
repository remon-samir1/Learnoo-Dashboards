"use client";

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Edit2, 
  Key, 
  Mail, 
  Phone, 
  Calendar, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  ShieldCheck, 
  Layout, 
  User,
  ExternalLink,
  ChevronRight,
  MapPin,
  Clock,
  Smartphone,
  Globe,
  MoreVertical,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ResetPasswordModal from '@/components/modals/ResetPasswordModal';

export default function StudentProfilePage() {
  const params = useParams();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Mock student data
  const student = {
    id: params.id || 'stu-0',
    name: 'Ahmed Ali Hassan',
    status: 'Active',
    email: 'ahmed.ali@university.edu',
    phone: '+20 100 123 4501',
    university: 'Cairo University',
    faculty: 'Engineering',
    year: '3rd Year',
    joined: '2024-01-15',
    lastActive: '2 hours ago',
    avatar: 'A',
    enrolledCourses: [
      { name: 'Physics 101: Mechanics', progress: 78, grade: 'A-' },
      { name: 'Advanced Mathematics', progress: 45, grade: 'B+' },
      { name: 'Organic Chemistry Basics', progress: 92, grade: 'A' },
    ],
    exams: [
      { name: 'Midterm: Mechanics', score: 87, total: 100, date: '2024-10-10' },
      { name: 'Quiz: Derivatives', score: 18, total: 20, date: '2024-10-18' },
    ],
    activity: {
      notesCreated: 24,
      downloads: 56,
      liveAttendance: 12,
      communityPosts: 8
    },
    device: {
      name: 'iPhone 15 Pro — iOS 17.2',
      lastIp: '196.153.xx.xx'
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Navigation & Profile Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/students"
            className="p-2 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-[#1E293B]">{student.name}</h1>
            <div className="flex items-center gap-3 text-[12px] text-[#64748B] mt-0.5">
               <span className="font-medium">Student ID: <span className="font-bold text-[#1E293B] uppercase">{student.id}</span></span>
               <span className="w-1 h-1 bg-[#CBD5E1] rounded-full"></span>
               <span>Last active <span className="font-bold text-[#1E293B]">{student.lastActive}</span></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#F8FAFC] hover:shadow-sm transition-all"
          >
            <Key className="w-4 h-4" />
            Reset Password
          </button>
          <Link 
            href={`/students/${student.id}/edit`}
            className="flex-1 md:flex-none px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            <Edit2 className="w-4 h-4" />
            Edit Student
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Details & Stats */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Section 1: Personal Info */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <User className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Personal Information</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Full Name</span>
                  <span className="text-[15px] font-bold text-[#1E293B]">{student.name}</span>
               </div>
               <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Status</span>
                  <span className="inline-flex w-fit px-3 py-1 bg-[#EBFDF5] text-[#10B981] text-[10px] font-bold rounded-lg border border-emerald-100 uppercase">{student.status}</span>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                    <Mail className="w-5 h-5"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Email</span>
                    <span className="text-[14px] font-semibold text-[#475569]">{student.email}</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                    <Phone className="w-5 h-5"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Phone</span>
                    <span className="text-[14px] font-semibold text-[#475569]">{student.phone}</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F4F5FD] rounded-xl flex items-center justify-center border border-indigo-50 text-[#4F46E5]">
                    <Calendar className="w-5 h-5"/>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Joined</span>
                    <span className="text-[14px] font-semibold text-[#475569]">{student.joined}</span>
                  </div>
               </div>
            </div>
          </section>

          {/* Section 2: Academic Info */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <GraduationCap className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Academic Information</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">University</span>
                  <span className="text-[15px] font-bold text-[#1E293B]">{student.university}</span>
               </div>
               <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Faculty</span>
                  <span className="text-[15px] font-bold text-[#1E293B]">{student.faculty}</span>
               </div>
               <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Year</span>
                  <span className="text-[15px] font-bold text-[#1E293B]">{student.year}</span>
               </div>
            </div>
          </section>

          {/* Section 3: Enrolled Courses */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <BookOpen className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Enrolled Courses</h2>
            </div>
            <div className="p-6 flex flex-col gap-5">
               {student.enrolledCourses.map((course, idx) => (
                 <div key={idx} className="p-5 bg-white border border-[#F1F5F9] rounded-2xl flex flex-col gap-4 group hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-bold text-[#1E293B]">{course.name}</h3>
                       <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] text-[11px] font-bold rounded-lg border border-indigo-100 uppercase">{course.grade}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                       <div className="flex justify-between items-center text-[11px] font-medium text-[#64748B]">
                          <span>Progress</span>
                          <span className="font-bold text-[#1E293B]">{course.progress}%</span>
                       </div>
                       <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-all duration-1000" 
                            style={{ width: `${course.progress}%` }}
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          {/* Section 4: Exam Results */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <ClipboardList className="w-4 h-4 text-[#4F46E5]" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Exam Results</h2>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
                    <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Exam</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {student.exams.map((exam, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="px-6 py-5 text-sm font-bold text-[#1E293B]">{exam.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-bold text-[#1E293B]">{exam.score}/{exam.total}</span>
                           <span className="text-[11px] text-[#64748B]">({Math.round((exam.score/exam.total)*100)}%)</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-[#64748B] font-medium">{exam.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Security & Account Access */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden border-orange-100">
            <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
              <div className="p-1.5 bg-orange-50 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Security & Account Access</h2>
            </div>
            <div className="p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                 <label className="text-[13px] font-bold text-[#64748B]">Current Password (Admin View Only)</label>
                 <div className="flex items-center gap-4 max-w-md">
                    <div className="flex-1 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-lg font-mono font-bold tracking-[4px] text-[#1E293B] flex items-center justify-between group">
                       <span>••••••••</span>
                       <button className="text-[11px] text-[#4F46E5] font-bold hover:underline">Show</button>
                    </div>
                 </div>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(true)}
                className="w-fit flex items-center gap-2.5 text-[#4F46E5] hover:bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 font-bold transition-all"
              >
                <Key className="w-4 h-4"/>
                Reset Password
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Cards */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 1: Centers */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
             <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg">
                   <Building2 className="w-4 h-4 text-[#4F46E5]" />
                </div>
                <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Centers</h2>
             </div>
             <div className="p-6 flex flex-col gap-3">
                <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#4F46E5] rounded-full"></div>
                   <span className="text-[13.5px] font-bold text-[#475569]">Main Center, Dokki</span>
                </div>
                <div className="p-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-[#4F46E5] rounded-full"></div>
                   <span className="text-[13.5px] font-bold text-[#475569]">Online Only</span>
                </div>
             </div>
          </section>

          {/* Card 2: Activity Summary */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
             <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
                <Layout className="w-4 h-4 text-[#4F46E5]" />
                <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Activity Summary</h2>
             </div>
             <div className="p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><BookOpen className="w-4 h-4"/></div>
                      <span className="text-[14px] font-medium text-[#64748B]">Notes Created</span>
                   </div>
                   <span className="text-base font-bold text-[#1E293B]">{student.activity.notesCreated}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Globe className="w-4 h-4"/></div>
                      <span className="text-[14px] font-medium text-[#64748B]">Downloads</span>
                   </div>
                   <span className="text-base font-bold text-[#1E293B]">{student.activity.downloads}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Clock className="w-4 h-4"/></div>
                      <span className="text-[14px] font-medium text-[#64748B]">Live Attendance</span>
                   </div>
                   <span className="text-base font-bold text-[#1E293B]">{student.activity.liveAttendance}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9]/50 last:border-0">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-500"><Smartphone className="w-4 h-4"/></div>
                      <span className="text-[14px] font-medium text-[#64748B]">Community Posts</span>
                   </div>
                   <span className="text-base font-bold text-[#1E293B]">{student.activity.communityPosts}</span>
                </div>
             </div>
          </section>

          {/* Card 3: Device & Access */}
          <section className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm overflow-hidden">
             <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#4F46E5]" />
                <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Device & Access</h2>
             </div>
             <div className="p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                   <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Device</span>
                   <span className="text-[14px] font-bold text-[#1E293B]">{student.device.name}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                   <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Last IP</span>
                   <span className="text-[14px] font-bold text-[#1E293B]">{student.device.lastIp}</span>
                </div>
             </div>
          </section>

        </div>
      </div>

      {/* Reset Modal */}
      <ResetPasswordModal 
         isOpen={isResetModalOpen}
         onClose={() => setIsResetModalOpen(false)}
         studentName={student.name}
         onConfirm={() => setIsResetModalOpen(false)}
      />
    </div>
  );
}
