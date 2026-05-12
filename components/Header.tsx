'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { logout } from '@/lib/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const getPageTitle = (pathname: string, t: (key: string) => string): string => {
  // Remove trailing slash and split path
  const cleanPath = pathname.replace(/\/$/, '');
  const pathSegments = cleanPath.split('/').filter(Boolean);
  
  // Map routes to titles
  const routeTitles: Record<string, string> = {
    'dashboard': t('header.titles.dashboard'),
    'students': t('header.titles.students'),
    'courses': t('header.titles.courses'),
    'centers': t('header.titles.centers'),
    'faculties': t('header.titles.faculties'),
    'universities': t('header.titles.universities'),
    'levels': t('header.titles.levels'),
    'lectures': t('header.titles.lectures'),
    'chapters': t('header.titles.chapters'),
    'exams': t('header.titles.exams'),
    'departments': t('header.titles.academicStructure'),
    'community': t('header.titles.community'),
    'electronic-library': t('header.titles.electronicLibrary'),
    'notes-summaries': t('header.titles.notesSummaries'),
    'live-sessions': t('header.titles.liveSessions'),
    'notifications': t('header.titles.notifications'),
    'downloads': t('header.titles.downloads'),
    'settings': t('header.titles.settings'),
    'feature-control': t('header.titles.featureControl'),
    'activation': t('header.titles.activation'),
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
    
    if (action === 'edit') return `${t('header.titles.edit')} ${routeTitles[parentRoute] || parentRoute}`;
    if (action === 'add' || action === 'create') return `${t('header.titles.create')} ${routeTitles[parentRoute] || parentRoute}`;
    if (action === 'room') return t('header.titles.liveRoom');
    if (!isNaN(Number(action))) return `${routeTitles[parentRoute] || parentRoute} ${t('header.titles.details')}`;
  }

  return t('header.titles.dashboard');
};

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname, t);

  return (
    <header className="h-16 bg-white border-b border-[#EEEEEE] flex items-center justify-between px-8 flex-shrink-0 z-30 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      {/* Title */}
      <h2 className="text-[17px] font-semibold text-[#111827]">{pageTitle}</h2>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <button
          onClick={logout}
          className="p-2 text-[#9CA3AF] hover:bg-[#F4F5FD] rounded-full transition-colors"
          title={t('common.logout')}
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
