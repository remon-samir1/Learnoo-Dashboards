'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickAction';
import ActivityChart from '@/components/dashboard/ActivityChart';
import EngagementChart from '@/components/dashboard/EngagementChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { useDashboardStats, useActivityData, useEngagementData, useRecentActivity } from '@/src/hooks/useDashboard';
import { StatCardSkeleton, QuickActionSkeleton, ChartSkeleton, ActivityItemSkeleton, Skeleton } from '@/src/components/ui/Skeleton';
<<<<<<< HEAD
import { useCurrentUser } from '@/src/hooks/useAuth';
=======
>>>>>>> origin/master

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
<<<<<<< HEAD
  const { role } = useCurrentUser();
  const isInstructor = role === 'Instructor';
=======
>>>>>>> origin/master
  const { data: statsResponse, isLoading: statsLoading } = useDashboardStats({});
  const { data: activityResponse, isLoading: activityLoading } = useActivityData('week', {});
  const { data: engagementResponse, isLoading: engagementLoading } = useEngagementData('week', {});
  const { data: recentActivityResponse, isLoading: activityListLoading } = useRecentActivity(10, {});

  const stats = statsResponse?.data;
  const activityData = activityResponse?.data;
  const engagementData = engagementResponse?.data;
  const recentActivities = recentActivityResponse?.data;

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label={t('stats.totalStudents')}
              value={stats?.total_students?.value?.toLocaleString() || '0'}
              trend={stats?.total_students?.trend === 'up' ? `+${stats?.total_students?.growth}%` : stats?.total_students?.growth ? `-${stats?.total_students?.growth}%` : undefined}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              }
            />
            <StatCard
              label={t('stats.activeCourses')}
              value={stats?.active_courses?.value?.toString() || '0'}
              trend={stats?.active_courses?.growth ? `+${stats?.active_courses?.growth}` : undefined}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                </svg>
              }
            />
            <StatCard
              label={t('stats.liveSessionsToday')}
              value={stats?.live_sessions_today?.value?.toString() || '0'}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              }
            />
            <StatCard
              label={t('stats.notesCreated')}
              value={stats?.notes_created?.value?.toLocaleString() || '0'}
              trend={stats?.notes_created?.growth ? `+${stats?.notes_created?.growth}%` : undefined}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>
                </svg>
              }
            />
            <StatCard
              label={t('stats.monthlyRevenue')}
              value={`EGP ${stats?.monthly_revenue?.value?.toLocaleString() || '0'}`}
              trend={stats?.monthly_revenue?.growth ? `+${stats?.monthly_revenue?.growth}%` : undefined}
              icon={
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                 </svg>
              }
            />
            <StatCard
              label={t('stats.communityPosts')}
              value={stats?.community_posts?.value?.toLocaleString() || '0'}
              trend={stats?.community_posts?.growth ? `+${stats?.community_posts?.growth}%` : undefined}
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2137D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <section className="flex flex-col gap-4">
        <h3 className="text-[15.3px] font-medium text-[#111827]">{t('quickActions.title')}</h3>
        <div className="flex flex-wrap gap-4">
<<<<<<< HEAD
          {!isInstructor && (
            <QuickAction
              label={t('quickActions.addStudent')}
              bgColor="bg-white"
              iconBgColor="bg-[#F4F5FD]"
              iconColor="#2137D6"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>}
              href="/students/add"
            />
          )}
          <QuickAction
            label={t('quickActions.addCourse')}
            bgColor="bg-white"
            iconBgColor="bg-[#E8F9F0]"
            iconColor="#2FBF71"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>}
            href="/courses/add"
          />
          <QuickAction
            label={t('quickActions.liveSession')}
            bgColor="bg-white"
            iconBgColor="bg-[#FEF1F1]"
            iconColor="#EF7373"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><circle cx="8.5" cy="12" r="1.5"/></svg>}
            href="/live-sessions"
          />
          {!isInstructor && (
            <QuickAction
              label={t('quickActions.notify')}
              bgColor="bg-white"
              iconBgColor="bg-[#F8FAFC]"
              iconColor="#777774"
              icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
              href="/notifications"
            />
          )}
          <QuickAction
            label={t('quickActions.addToLibrary')}
            bgColor="bg-white"
            iconBgColor="bg-[#E8F9F0]"
            iconColor="#2FBF71"
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>}
=======
          <QuickAction 
            label={t('quickActions.addStudent')} 
            bgColor="bg-white" 
            iconBgColor="bg-[#F4F5FD]" 
            iconColor="#2137D6" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>} 
            href="/students/add"
          />
          <QuickAction 
            label={t('quickActions.addCourse')} 
            bgColor="bg-white" 
            iconBgColor="bg-[#E8F9F0]" 
            iconColor="#2FBF71" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>} 
            href="/courses/add"
          />
          <QuickAction 
            label={t('quickActions.liveSession')} 
            bgColor="bg-white" 
            iconBgColor="bg-[#FEF1F1]" 
            iconColor="#EF7373" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><circle cx="8.5" cy="12" r="1.5"/></svg>} 
            href="/live-sessions"
          />
          <QuickAction 
            label={t('quickActions.notify')} 
            bgColor="bg-white" 
            iconBgColor="bg-[#F8FAFC]" 
            iconColor="#777774" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>} 
            href="/notifications"
          />
          <QuickAction 
            label={t('quickActions.addToLibrary')} 
            bgColor="bg-white" 
            iconBgColor="bg-[#E8F9F0]" 
            iconColor="#2FBF71" 
            icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>} 
>>>>>>> origin/master
            href="/electronic-library"
          />
        </div>
      </section>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {activityLoading || engagementLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
               <ActivityChart data={activityData} />
               <EngagementChart data={engagementData} />
            </>
          )}
        </div>
        <div className="lg:col-span-1">
          {activityListLoading ? (
            <div className="bg-white border border-[#EEEEEE] rounded-xl p-6 shadow-sm h-[586px]">
              <Skeleton width={120} height={18} className="mb-6" />
              <div className="flex flex-col pt-4">
                {[...Array(6)].map((_, i) => (
                  <ActivityItemSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <RecentActivity activities={recentActivities || []} />
          )}
        </div>
      </div>
    </div>
  );
}
