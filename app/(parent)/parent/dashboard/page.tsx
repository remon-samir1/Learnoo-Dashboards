"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  Award
} from 'lucide-react';
import { useCurrentUser } from '@/src/hooks/useAuth';

export default function ParentDashboard() {
  const t = useTranslations('parentDashboard');
  const { user } = useCurrentUser();
  
  // Mock data for linked students (usually fetched via API)
  const [selectedStudent, setSelectedStudent] = useState('1');
  const linkedStudents = [
    { id: '1', name: 'Omar Ahmed', grade: 'Grade 10' },
    { id: '2', name: 'Sara Ahmed', grade: 'Grade 8' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full pb-10 mt-6 lg:mt-0 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">
            {t('welcome') || 'Welcome'}, {user?.attributes?.first_name || 'Parent'}
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{t('subtitle') || 'Here is an overview of your children\'s progress.'}</p>
        </div>
        
        {/* Student Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[#64748B]">{t('selectChild') || 'Select Child:'}</span>
          <select 
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="h-10 px-4 rounded-xl border border-[#E5E7EB] bg-white text-[#1E293B] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
          >
            {linkedStudents.map(student => (
              <option key={student.id} value={student.id}>{student.name} ({student.grade})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('attendance') || 'Attendance Rate'} 
          value="95%" 
          trend="+2%" 
          icon={<Clock className="w-5 h-5 text-[#4F46E5]" />}
          color="bg-[#4F46E5]/10" 
        />
        <StatCard 
          title={t('courseProgress') || 'Course Progress'} 
          value="78%" 
          trend="+5%" 
          icon={<BookOpen className="w-5 h-5 text-[#10B981]" />}
          color="bg-[#10B981]/10" 
        />
        <StatCard 
          title={t('examAverage') || 'Exam Average'} 
          value="88/100" 
          trend="+12%" 
          icon={<Award className="w-5 h-5 text-[#F59E0B]" />}
          color="bg-[#F59E0B]/10" 
        />
        <StatCard 
          title={t('engagement') || 'Engagement Level'} 
          value="High" 
          trend="Stable" 
          icon={<TrendingUp className="w-5 h-5 text-[#8B5CF6]" />}
          color="bg-[#8B5CF6]/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#F1F5F9] shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-4">{t('recentActivity') || 'Recent Activity'}</h2>
          <div className="flex flex-col gap-4">
            <ActivityItem 
              icon={<CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
              title="Completed Math Quiz"
              time="2 hours ago"
              description="Scored 92% on Algebra Fundamentals"
            />
            <ActivityItem 
              icon={<BookOpen className="w-5 h-5 text-[#3B82F6]" />}
              title="Started New Module"
              time="Yesterday"
              description="Began studying Intro to Physics"
            />
            <ActivityItem 
              icon={<Calendar className="w-5 h-5 text-[#8B5CF6]" />}
              title="Attended Live Session"
              time="2 days ago"
              description="Chemistry Review with Mr. Hassan"
            />
          </div>
        </div>

        {/* Notifications & Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-[#F1F5F9] shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-4">{t('alerts') || 'Alerts & Reminders'}</h2>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#FEE2E2]">
              <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#991B1B]">Upcoming Exam</p>
                <p className="text-xs text-[#DC2626] mt-1">Physics Midterm is tomorrow at 10:00 AM.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7]">
              <Clock className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#92400E]">Low Attendance Warning</p>
                <p className="text-xs text-[#B45309] mt-1">Missed 2 consecutive Math classes.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string, value: string, trend: string, icon: React.ReactNode, color: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#F1F5F9] shadow-sm flex flex-col gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#F3F4F6] text-[#4B5563]'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[#64748B]">{title}</p>
        <h3 className="text-2xl font-bold text-[#1E293B] mt-1">{value}</h3>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, time, description }: { icon: React.ReactNode, title: string, time: string, description: string }) {
  return (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
      <div className="shrink-0 mt-1">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <p className="text-sm font-bold text-[#1E293B]">{title}</p>
          <span className="text-xs font-medium text-[#94A3B8]">{time}</span>
        </div>
        <p className="text-sm text-[#64748B] mt-1">{description}</p>
      </div>
    </div>
  );
}
