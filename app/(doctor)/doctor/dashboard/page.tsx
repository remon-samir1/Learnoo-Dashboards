'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Video, 
  MessageCircle,
  Play,
  Clock,
  ChevronRight,
  Star,
  TrendingUp,
  UserPlus,
  HelpCircle,
  FileText
} from 'lucide-react';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { instructorDashboardApi } from '@/src/lib/api';

export default function DoctorDashboardPage() {
  const [headerData, setHeaderData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [studentGrowthData, setStudentGrowthData] = useState<any>(null);
  const [courseActivityData, setCourseActivityData] = useState<any>(null);
  const [recentActivityData, setRecentActivityData] = useState<any>(null);
  const [upcomingLiveClassesData, setUpcomingLiveClassesData] = useState<any>(null);
  const [studentsNeedingAttentionData, setStudentsNeedingAttentionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [header, stats, growth, activity, recent, live, students] = await Promise.all([
          instructorDashboardApi.getHeader(),
          instructorDashboardApi.getStats(),
          instructorDashboardApi.getStudentGrowth({ period: 'month' }),
          instructorDashboardApi.getCourseActivity(),
          instructorDashboardApi.getRecentActivity(),
          instructorDashboardApi.getUpcomingLiveClasses(),
          instructorDashboardApi.getStudentsNeedingAttention(),
        ]);

        setHeaderData(header.data);
        setStatsData(stats.data);
        setStudentGrowthData(growth.data);
        setCourseActivityData(activity.data);
        setRecentActivityData(recent.data);
        setUpcomingLiveClassesData(live.data);
        setStudentsNeedingAttentionData(students.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Welcome Banner */}
      <WelcomeBanner data={headerData} />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Students" 
          value={statsData?.students?.value?.toLocaleString() || '0'}
          subtext={`Growth: ${statsData?.students?.growth || 0}%`}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-[#EEF2FF]"
          iconColor="text-[#4F46E5]"
          borderColor="border-l-4 border-l-[#4F46E5]"
        />
        <StatCard 
          label="Active Courses" 
          value={statsData?.courses?.value?.toString() || '0'}
          subtext="Currently teaching"
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#EF4444]"
          borderColor="border-l-4 border-l-[#EF4444]"
        />
        <StatCard 
          label="Live Classes" 
          value={statsData?.live_sessions_today?.value?.toString() || '0'}
          subtext="Today"
          icon={<Video className="w-5 h-5" />}
          iconBg="bg-[#FEFCE8]"
          iconColor="text-[#EAB308]"
          borderColor="border-l-4 border-l-[#EAB308]"
        />
        <StatCard 
          label="Pending Questions" 
          value={headerData?.summary?.pending_questions?.toString() || '0'}
          subtext="Need your response"
          icon={<MessageCircle className="w-5 h-5" />}
          iconBg="bg-[#F0FDF4]"
          iconColor="text-[#22C55E]"
          borderColor="border-l-4 border-l-[#22C55E]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnrollmentChart data={studentGrowthData} />
        </div>
        <div>
          <CourseActivityChart data={courseActivityData} />
        </div>
      </div>

      {/* Activity and Live Classes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity data={recentActivityData} />
        <UpcomingLiveClasses data={upcomingLiveClassesData} />
      </div>

      {/* Students Needing Attention */}
      <StudentsNeedingAttention data={studentsNeedingAttentionData} />
    </div>
  );
}

function WelcomeBanner({ data }: { data: any }) {
  const { user } = useCurrentUser();
  const firstName = user?.attributes.first_name || data?.name?.split(' ')[0] || 'Doctor';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] p-6 text-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <circle cx="350" cy="50" r="100" fill="white" />
          <circle cx="300" cy="150" r="80" fill="white" />
        </svg>
      </div>
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-white/80 mb-1">{data?.date || 'Loading...'}</p>
          <h1 className="text-2xl font-bold mb-2">{data?.greeting || 'Good morning'}, {firstName}! 👋</h1>
          <p className="text-sm text-white/90 mb-4">
            You have <span className="font-bold">{data?.summary?.today_live_classes || 0} live classes</span> today and <span className="font-bold">{data?.summary?.pending_questions || 0} pending questions</span> to review.
          </p>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-[#4F46E5] rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors">
              <Video className="w-4 h-4" />
              Start Live Sessions
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Quick Create
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end gap-2">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold">4.9</span>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">98%</span>
              <p className="text-xs text-white/70">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

function StatCard({ label, value, subtext, icon, iconBg, iconColor, borderColor }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm ${borderColor}`}>
      <div className={`w-12 h-12 ${iconBg} ${iconColor} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-[#64748B] mb-0.5">{label}</p>
        <p className="text-xl font-bold text-[#1E293B]">{value}</p>
        <p className="text-xs text-[#94A3B8]">{subtext}</p>
      </div>
    </div>
  );
}

function EnrollmentChart({ data: growthData }: { data: any }) {
  const data = growthData?.labels?.map((label: string, i: number) => ({
    month: label,
    value: growthData.datasets[0]?.data[i] || 0,
  })) || [];

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-[#1E293B]">Student Enrollment</h3>
            <p className="text-xs text-[#64748B]">Monthly growth trend</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-48 text-[#94A3B8] text-sm">
          No data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d: { value: number }) => d.value), 100) * 1.2;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#1E293B]">Student Enrollment</h3>
          <p className="text-xs text-[#64748B]">Monthly growth trend</p>
        </div>
        <div className="flex bg-[#F1F5F9] rounded-lg p-1">
          {['Week', 'Month', 'Year'].map((period, i) => (
            <button 
              key={period}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                i === 1 ? 'bg-white text-[#1E293B] shadow-sm' : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-48">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-[#94A3B8] w-8">
          <span>600</span>
          <span>450</span>
          <span>300</span>
          <span>150</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="absolute inset-x-10 top-0 bottom-8">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="absolute w-full border-t border-dashed border-[#E2E8F0]" style={{ top: `${i * 25}%` }} />
          ))}

          {/* Line chart */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <path
              d={`M 0 ${200 - (data[0].value / maxValue) * 200} ${
                data.map((d: { month: string; value: number }, i: number) => {
                  const x = (i / (data.length - 1)) * 100 + '%';
                  const y = 200 - (d.value / maxValue) * 200;
                  return `L ${x} ${y}`;
                }).join(' ')
              } L 100% 200 L 0 200 Z`}
              fill="url(#lineGradient)"
            />
            
            {/* Line */}
            <path
              d={`M 0 ${200 - (data[0].value / maxValue) * 200} ${
                data.map((d: { month: string; value: number }, i: number) => {
                  const x = (i / (data.length - 1)) * 100 + '%';
                  const y = 200 - (d.value / maxValue) * 200;
                  return `L ${x} ${y}`;
                }).join(' ')
              }`}
              fill="none"
              stroke="#4F46E5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((d: { month: string; value: number }, i: number) => {
              const x = (i / (data.length - 1)) * 100 + '%';
              const y = 200 - (d.value / maxValue) * 200;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="white"
                  stroke="#4F46E5"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute inset-x-10 bottom-0 flex justify-between text-xs text-[#94A3B8]">
          {data.map((d: { month: string; value: number }) => (
            <span key={d.month}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseActivityChart({ data: activityData }: { data: any }) {
  const courses = activityData?.labels || [];
  const lecturesData = activityData?.datasets?.[0]?.data || [];
  const liveClassesData = activityData?.datasets?.[1]?.data || [];
  const quizzesData = activityData?.datasets?.[2]?.data || [];
  
  const maxValue = Math.max(
    ...lecturesData,
    ...liveClassesData,
    ...quizzesData,
    1
  );

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Course Activity</h3>
        <p className="text-xs text-[#64748B]">Lectures · Live Classes · Quizzes</p>
      </div>

      <div className="flex items-end justify-between h-40 gap-2">
        {courses.map((course: string, i: number) => (
          <div key={course} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-end gap-1 h-32 w-full justify-center">
              <div 
                className="w-3 bg-[#3B82F6] rounded-t-sm" 
                style={{ height: `${(lecturesData[i] / maxValue) * 100}%` }}
              />
              <div 
                className="w-3 bg-[#10B981] rounded-t-sm" 
                style={{ height: `${(liveClassesData[i] / maxValue) * 100}%` }}
              />
              <div 
                className="w-3 bg-[#F59E0B] rounded-t-sm" 
                style={{ height: `${(quizzesData[i] / maxValue) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[#64748B] truncate w-full text-center">{course}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#3B82F6] rounded-sm" />
          <span className="text-xs text-[#64748B]">Lectures</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#10B981] rounded-sm" />
          <span className="text-xs text-[#64748B]">Live Classes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#F59E0B] rounded-sm" />
          <span className="text-xs text-[#64748B]">Quizzes</span>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ data: activities }: { data: any }) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'user-plus': return <UserPlus className="w-4 h-4" />;
      case 'help-circle': return <HelpCircle className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'file-text': return <FileText className="w-4 h-4" />;
      default: return <UserPlus className="w-4 h-4" />;
    }
  };

  const getColor = (colorName: string) => {
    switch (colorName) {
      case 'green': return 'bg-[#22C55E]';
      case 'indigo': return 'bg-[#6366F1]';
      case 'red': return 'bg-[#EF4444]';
      case 'yellow': return 'bg-[#EAB308]';
      default: return 'bg-[#4F46E5]';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Recent Activity</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4">
        {activities?.map((activity: any, i: number) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-8 h-8 ${getColor(activity.color)} rounded-full flex items-center justify-center text-white shrink-0`}>
              {getIcon(activity.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1E293B]">{activity.title}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingLiveClasses({ data: classes }: { data: any }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Upcoming Live Classes</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {classes?.map((cls: any) => (
          <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
            <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E293B] truncate">{cls.title}</p>
              <p className="text-xs text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {cls.starts_in}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1E293B]">{cls.participants}</p>
              <p className="text-xs text-[#94A3B8]">students</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsNeedingAttention({ data: students }: { data: any }) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Students Needing Attention</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {students?.map((student: any) => (
          <div key={student.id} className="bg-[#FEF2F2] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#EF4444] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {getInitials(student.full_name)}
              </div>
              <p className="text-sm font-semibold text-[#1E293B]">{student.full_name}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">{student.progress.toFixed(1)}% progress</span>
              </div>
              <div className="h-1.5 bg-[#FECACA] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#EF4444] rounded-full"
                  style={{ width: `${student.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
