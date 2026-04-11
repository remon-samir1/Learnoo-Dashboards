import React from 'react';
import { 
  Users, 
  BookOpen, 
  Video, 
  MessageCircle,
  Play,
  Clock,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react';

export default function DoctorDashboardPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Students" 
          value="1,284" 
          subtext="Across all courses"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-[#EEF2FF]"
          iconColor="text-[#4F46E5]"
          borderColor="border-l-4 border-l-[#4F46E5]"
        />
        <StatCard 
          label="Active Courses" 
          value="8" 
          subtext="Currently teaching"
          icon={<BookOpen className="w-5 h-5" />}
          iconBg="bg-[#FEF2F2]"
          iconColor="text-[#EF4444]"
          borderColor="border-l-4 border-l-[#EF4444]"
        />
        <StatCard 
          label="Live Classes" 
          value="3" 
          subtext="This week"
          icon={<Video className="w-5 h-5" />}
          iconBg="bg-[#FEFCE8]"
          iconColor="text-[#EAB308]"
          borderColor="border-l-4 border-l-[#EAB308]"
        />
        <StatCard 
          label="Pending Questions" 
          value="12" 
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
          <EnrollmentChart />
        </div>
        <div>
          <CourseActivityChart />
        </div>
      </div>

      {/* Activity and Live Classes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <UpcomingLiveClasses />
      </div>

      {/* Students Needing Attention */}
      <StudentsNeedingAttention />
    </div>
  );
}

function WelcomeBanner() {
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
          <p className="text-sm text-white/80 mb-1">Monday, March 9, 2026</p>
          <h1 className="text-2xl font-bold mb-2">Good morning, Dr. Nada! 👋</h1>
          <p className="text-sm text-white/90 mb-4">
            You have <span className="font-bold">3 live classes</span> this week and <span className="font-bold">47 new submissions</span> to review.
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

function EnrollmentChart() {
  const data = [
    { month: 'Oct', value: 220 },
    { month: 'Nov', value: 280 },
    { month: 'Dec', value: 250 },
    { month: 'Jan', value: 320 },
    { month: 'Feb', value: 380 },
    { month: 'Mar', value: 450 },
  ];

  const maxValue = 600;

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
                data.map((d, i) => {
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
                data.map((d, i) => {
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
            {data.map((d, i) => {
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
          {data.map(d => (
            <span key={d.month}>{d.month}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseActivityChart() {
  const courses = ['Anatomy', 'Pharma', 'Cardio', 'Neuro', 'Pathology'];
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Course Activity</h3>
        <p className="text-xs text-[#64748B]">Lectures · Exams · Live</p>
      </div>

      <div className="flex items-end justify-between h-40 gap-2">
        {courses.map((course, i) => (
          <div key={course} className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-end gap-1 h-32 w-full justify-center">
              <div 
                className="w-3 bg-[#4F46E5] rounded-t-sm" 
                style={{ height: `${[85, 78, 92, 72, 88][i]}%` }}
              />
              <div 
                className="w-3 bg-[#EAB308] rounded-t-sm" 
                style={{ height: `${[65, 70, 75, 58, 72][i]}%` }}
              />
              <div 
                className="w-3 bg-[#EF4444] rounded-t-sm" 
                style={{ height: `${[55, 48, 68, 45, 60][i]}%` }}
              />
            </div>
            <span className="text-xs text-[#64748B]">{course}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#4F46E5] rounded-sm" />
          <span className="text-xs text-[#64748B]">Lectures</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#EAB308] rounded-sm" />
          <span className="text-xs text-[#64748B]">Live</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-[#EF4444] rounded-sm" />
          <span className="text-xs text-[#64748B]">Exams</span>
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { id: 1, name: 'Ahmed Khalid', action: 'submitted Exam #3', detail: 'Scored 87%', time: '2 min ago', avatar: 'AK', color: 'bg-[#4F46E5]' },
    { id: 2, name: 'Sara Fathi', action: 'enrolled in', detail: 'Cardiology 101', time: '18 min ago', avatar: 'SF', color: 'bg-[#22C55E]' },
    { id: 3, name: 'Mohamed Hassan', action: 'watched', detail: 'Lecture 9: Pharmacokinetics', time: '1 hr ago', avatar: 'MH', color: 'bg-[#EAB308]' },
    { id: 4, name: 'Nour Abbas', action: 'asked a question in', detail: 'Anatomy Module', time: '2 hr ago', avatar: 'NA', color: 'bg-[#EF4444]' },
    { id: 5, name: 'Yara Samir', action: 'completed', detail: 'Pathology final exam', time: '3 hr ago', avatar: 'YS', color: 'bg-[#4F46E5]' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Recent Activity</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>
              {activity.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1E293B]">
                <span className="font-semibold">{activity.name}</span>{' '}
                <span className="text-[#64748B]">{activity.action}</span>{' '}
                <span className="text-[#64748B]">{activity.detail}</span>
              </p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingLiveClasses() {
  const classes = [
    { id: 1, title: 'Advanced Cardiology', time: 'Today · 4:00 PM', students: 34, color: 'bg-[#EF4444]' },
    { id: 2, title: 'Pharmacology Review', time: 'Tomorrow · 10:00 AM', students: 52, color: 'bg-[#EAB308]' },
    { id: 3, title: 'Neurology Fundamentals', time: 'Mar 11 · 2:00 PM', students: 28, color: 'bg-[#4F46E5]' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Upcoming Live Classes</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {classes.map((cls) => (
          <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors">
            <div className={`w-10 h-10 ${cls.color} rounded-xl flex items-center justify-center shrink-0`}>
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1E293B] truncate">{cls.title}</p>
              <p className="text-xs text-[#64748B] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {cls.time}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1E293B]">{cls.students}</p>
              <p className="text-xs text-[#94A3B8]">students</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentsNeedingAttention() {
  const students = [
    { id: 1, name: 'Yasmin Adel', progress: 56, avatar: 'YA', color: 'bg-[#EF4444]' },
    { id: 2, name: 'Ahmed Khaled', progress: 45, avatar: 'AK', color: 'bg-[#EF4444]' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1E293B]">Students Needing Attention</h3>
        <button className="text-xs text-[#4F46E5] font-medium flex items-center gap-1 hover:underline">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {students.map((student) => (
          <div key={student.id} className="bg-[#FEF2F2] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 ${student.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                {student.avatar}
              </div>
              <p className="text-sm font-semibold text-[#1E293B]">{student.name}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">{student.progress}% progress</span>
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
