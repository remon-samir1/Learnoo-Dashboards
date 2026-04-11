import React from 'react';
import type { RecentActivityItem } from '@/src/types';

const defaultActivities = [
  {
    id: 1,
    type: 'registration',
    content: 'New student registered: Ahmed Ali',
    time: '5 mins ago',
    iconColor: '#2137D6',
    iconBg: 'bg-[#E9EBFB]',
  },
  {
    id: 2,
    type: 'session',
    content: 'Live session "Physics 101" started',
    time: '15 mins ago',
    iconColor: '#EF4444',
    iconBg: 'bg-[#FEF1F1]',
  },
  {
    id: 3,
    type: 'note',
    content: 'New note created in "Math Chapter 2"',
    time: '1 hour ago',
    iconColor: '#EAB308',
    iconBg: 'bg-[#FEFCE8]',
  },
  {
    id: 4,
    type: 'course',
    content: 'Course "Biology Advanced" published',
    time: '2 hours ago',
    iconColor: '#6366F1',
    iconBg: 'bg-[#EEF2FF]',
  },
  {
    id: 5,
    type: 'question',
    content: 'Question asked in "Chemistry Q&A"',
    time: '3 hours ago',
    iconColor: '#6366F1',
    iconBg: 'bg-[#EEF2FF]',
  },
  {
    id: 6,
    type: 'purchase',
    content: 'Purchase: Advanced Math Bundle',
    time: '4 hours ago',
    iconColor: '#22C55E',
    iconBg: 'bg-[#F0FDF4]',
  },
];

interface RecentActivityProps {
  activities?: RecentActivityItem[];
}

export default function RecentActivity({ activities: propActivities }: RecentActivityProps) {
  const getColorClasses = (color?: string) => {
    switch (color) {
      case 'red': return { color: '#EF4444', bg: 'bg-[#FEF1F1]' };
      case 'blue': return { color: '#2137D6', bg: 'bg-[#E9EBFB]' };
      case 'green': return { color: '#22C55E', bg: 'bg-[#F0FDF4]' };
      case 'indigo': return { color: '#6366F1', bg: 'bg-[#EEF2FF]' };
      case 'yellow': return { color: '#EAB308', bg: 'bg-[#FEFCE8]' };
      default: return { color: '#2137D6', bg: 'bg-[#E9EBFB]' };
    }
  };

  const activities = propActivities && propActivities.length > 0
    ? propActivities.map((item, i) => {
      const colors = getColorClasses(item.color);
      return {
        id: i + 1,
        type: item.icon || 'registration',
        content: item.title || 'New activity',
        time: item.time || 'Just now',
        iconColor: colors.color,
        iconBg: colors.bg,
      };
    })
    : defaultActivities;

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl p-6 shadow-sm flex flex-col gap-6 min-h-[586px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[15.3px] font-medium text-[#111827]">Recent Activity</h4>
        {/* <button className="text-[11.9px] font-medium text-[#374151] hover:text-[#2137D6] transition-colors">View All</button> */}
      </div>

      <div className="flex-1 flex flex-col pt-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4 relative pb-8">
            {/* Timeline Line */}
            {index < activities.length - 1 && (
              <div className="absolute left-[15px] top-[32px] w-[2px] h-full bg-[#E5E7EB]"></div>
            )}

            {/* Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${activity.iconBg}`}>
              <div style={{ color: activity.iconColor }}>
                <ActivityIcon type={activity.type} />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <p className="text-[11.9px] text-[#1F2937] leading-tight font-normal">{activity.content}</p>
              <span className="text-[10.2px] text-[#6B7280] font-normal">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  // Simple icons based on type or icon string from API
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(type === 'registration' || type === 'user') && <><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
      {(type === 'session' || type === 'video') && <><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></>}
      {type === 'note' && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></>}
      {type === 'course' && <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>}
      {(type === 'question' || type === 'message-circle') && <><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></>}
      {(type === 'purchase' || type === 'dollar-sign') && <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></>}
    </svg>
  );
}

