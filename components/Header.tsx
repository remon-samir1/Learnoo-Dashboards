'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth';

const getPageTitle = (pathname: string): string => {
  // Remove trailing slash and split path
  const cleanPath = pathname.replace(/\/$/, '');
  const pathSegments = cleanPath.split('/').filter(Boolean);
  
  // Map routes to titles
  const routeTitles: Record<string, string> = {
    'dashboard': 'Dashboard Overview',
    'students': 'Students Management',
    'courses': 'My Courses',
    'centers': 'Centers',
    'departments': 'Departments',
    'faculties': 'Faculties',
    'universities': 'Universities',
    'levels': 'Levels',
    'lectures': 'Lectures',
    'chapters': 'Chapters',
    'exams': 'Exams & Q&A',
    'content-manager': 'Content Manager',
    'community': 'Community',
    'electronic-library': 'Electronic Library',
    'notes-summaries': 'Notes & Summaries',
    'live-sessions': 'Live Sessions',
    'notifications': 'Notifications',
    'downloads': 'Downloads',
    'settings': 'Settings',
    'feature-control': 'Feature Control',
  };

  // Get first meaningful segment
  const firstSegment = pathSegments[0];
  
  if (firstSegment && routeTitles[firstSegment]) {
    return routeTitles[firstSegment];
  }

  // Handle nested routes like /students/123/edit
  if (pathSegments.length >= 2) {
    const parentRoute = pathSegments[0];
    const action = pathSegments[pathSegments.length - 1];
    
    if (action === 'edit') return `Edit ${routeTitles[parentRoute] || parentRoute}`;
    if (action === 'add' || action === 'create') return `Create ${routeTitles[parentRoute] || parentRoute}`;
    if (action === 'room') return 'Live Room';
    if (!isNaN(Number(action))) return `${routeTitles[parentRoute] || parentRoute} Details`;
  }

  return 'Dashboard Overview';
};

export default function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="h-16 bg-white border-b border-[#EEEEEE] flex items-center justify-between px-8 sticky top-0 z-30 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      {/* Title */}
      <h2 className="text-[17px] font-semibold text-[#111827]">{pageTitle}</h2>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="p-2 text-[#9CA3AF] hover:bg-[#F4F5FD] rounded-full transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
