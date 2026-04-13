'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileEdit,
  Video,
  ClipboardList,
  MessageSquare,
  Users2,
  StickyNote,
  Library,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Download,
  ShieldCheck,
  Building2,
  School
} from 'lucide-react';

import Logo from '@/components/Logo';
import { logout } from '@/lib/auth';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { usePlatformFeature } from '@/src/hooks';
import { initializeAuthStore } from '@/src/stores/authStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path?: string;
  comingSoon?: boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    name: 'Academic Structure',
    icon: School,
    children: [
      { name: 'Universities', icon: Building2, path: '/universities' },
      { name: 'Faculties', icon: GraduationCap, path: '/faculties' },
      { name: 'Centers', icon: Users, path: '/centers' },
      { name: 'Departments', icon: Library, path: '/departments' },
    ],
  },
  { name: 'Students', icon: Users2, path: '/students' },
  { name: 'My Courses', icon: BookOpen, path: '/courses' },
  { name: 'Content Manager', icon: FileEdit, path: '/content-manager' },
  { name: 'Live Sessions', icon: Video, path: '/live-sessions' },
  { name: 'Exams & Q&A', icon: ClipboardList, path: '/exams' },
  { name: 'Community', icon: MessageSquare, path: '/community' },
  { name: 'Notes & Summaries', icon: StickyNote, path: '/notes-summaries' },
  { name: 'Electronic Library', icon: BookOpen, path: '/electronic-library' },
  { name: 'Notifications', icon: Bell, path: '/notifications', comingSoon: true },
  { name: 'Downloads', icon: Download, path: '/downloads', comingSoon: true },
  { name: 'Profile & Settings', icon: Settings, path: '/settings' },
  { name: 'Feature Control', icon: ShieldCheck, path: '/feature-control' },
];

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, fullName, role } = useCurrentUser();
  const { data: features } = usePlatformFeature();
  const [openDropdowns, setOpenDropdowns] = React.useState<Record<string, boolean>>({});

  // Initialize auth store from cookies on mount
  useEffect(() => {
    initializeAuthStore();
  }, []);

  // Get platform branding from features
  const getFeatureValue = (key: string, defaultValue: string = ''): string => {
    if (!features) return defaultValue;
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || defaultValue;
  };

  const platformName = getFeatureValue('platform_name', 'MedLearn');
  const primaryColor = getFeatureValue('primary_color', '#4F46E5');
  const logoUrl = getFeatureValue('logo', '');
  const tagline = getFeatureValue('tagline', 'Pro Instructor');

  // Get user initials
  const getInitials = () => {
    if (!user) return '??';
    const first = user.attributes.first_name?.charAt(0) || '';
    const last = user.attributes.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  // Get display name
  const getDisplayName = () => {
    if (fullName) return fullName;
    if (user) return `${user.attributes.first_name} ${user.attributes.last_name}`;
    return 'User';
  };

  // Get role display text
  const getRoleDisplay = () => {
    if (role === 'Admin') return 'Admin Dashboard';
    if (role === 'Doctor') return 'Doctor Dashboard';
    return role || 'User';
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isDropdownActive = (item: MenuItem): boolean => {
    if (!item.children) return false;
    return item.children.some((child) => pathname === child.path);
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.path || (item.path === '/dashboard' && pathname === '/');
    const hasChildren = !!item.children;
    const isOpen = openDropdowns[item.name] || isDropdownActive(item);

    if (hasChildren && !isCollapsed) {
      return (
        <div key={item.name} className="flex flex-col">
          <button
            onClick={() => toggleDropdown(item.name)}
            className={`group flex items-center p-3 rounded-xl transition-all duration-300 w-full ${
              isDropdownActive(item)
                ? 'bg-[#4F46E5]/10 text-[#4F46E5] shadow-sm ring-1 ring-[#4F46E5]/20'
                : 'text-[#64748B] hover:bg-white/60 hover:text-[#4F46E5]'
            }`}
          >
            <div className="shrink-0 mr-3">
              <Icon className="w-5 h-5 transition-transform duration-200" />
            </div>
            <span className="text-[13px] font-medium flex-1 text-left">{item.name}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {isOpen && (
            <div className="ml-4 pl-4 border-l border-[#E5E7EB] mt-1 flex flex-col gap-1">
              {item.children?.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    if (hasChildren && isCollapsed) {
      // When collapsed, show first child's path or just icon
      return (
        <Link
          key={item.name}
          href={item.children?.[0]?.path || '#'}
          className={`group flex items-center p-3 rounded-xl transition-all duration-300 relative ${
            isDropdownActive(item)
              ? 'text-[#4F46E5] scale-110 z-10'
              : 'text-[#64748B] hover:bg-white/60 hover:text-[#4F46E5]'
          } justify-center mx-1.5`}
          title={item.name}
        >
          <div className="shrink-0">
            <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          </div>
        </Link>
      );
    }

    return (
      <Link
        key={item.path || item.name}
        href={item.path || '#'}
        className={`group flex items-center p-3 rounded-xl transition-all duration-300 relative ${
          isActive
            ? isCollapsed
              ? 'text-[#4F46E5] scale-110 z-10'
              : 'bg-[#4F46E5]/10 text-[#4F46E5] shadow-sm ring-1 ring-[#4F46E5]/20'
            : 'text-[#64748B] hover:bg-white/60 hover:text-[#4F46E5]'
        } ${isCollapsed ? 'justify-center mx-1.5' : ''} ${isChild ? 'text-[12px]' : ''}`}
        title={isCollapsed ? item.name : ''}
      >
        {isActive && !isCollapsed && !isChild && (
          <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#4F46E5] rounded-r-full shadow-[2px_0px_10px_rgba(79,70,229,0.4)]" />
        )}
        <div className={`shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
          <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-2 flex-1">
            <span className={`font-medium ${isActive ? 'font-bold' : ''} ${isChild ? 'text-[12px]' : 'text-[13px]'}`}>
              {item.name}
            </span>
            {item.comingSoon && (
              <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-[#FEF3C7] text-[#D97706] rounded-full">
                Soon
              </span>
            )}
          </div>
        )}
        {isActive && isCollapsed && (
          <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 w-1.5 h-10 bg-[#4F46E5] rounded-r-full shadow-[2px_0px_12px_rgba(79,70,229,0.5)] animate-in fade-in slide-in-from-left-2 duration-300" />
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`bg-[#F9FAFF] flex flex-col min-h-screen sticky top-0 border-r border-[#E5E7EB] transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      {/* Brand Logo and Title */}
      <div className={`h-20 flex items-center px-5 gap-3 border-b border-[#F0F2F5] ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ 
            background: logoUrl ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <Logo className="w-8 h-8 text-white" />
          )}
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg text-[#1E293B] tracking-tight">{platformName}</span>
            <span 
              className="text-[10px] font-semibold flex items-center gap-1"
              style={{ color: primaryColor }}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              ></span>
              {tagline}
            </span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide flex flex-col gap-1">
        {!isCollapsed && (
          <p className="text-[10px] font-bold tracking-[1.5px] text-[#94A3B8] uppercase px-3 mb-4">MAIN MENU</p>
        )}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      {/* Admin Profile Section */}
      <div className={`p-4 border-t border-[#F0F2F5] mt-auto ${isCollapsed ? 'items-center' : ''}`}>
        {!isCollapsed && (
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-[#F1F5F9] mb-3 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ 
                backgroundColor: `${primaryColor}15`,
                borderColor: `${primaryColor}20`,
              }}
            >
              <span 
                className="text-[15px] font-bold"
                style={{ color: primaryColor }}
              >
                {getInitials()}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-[13px] font-bold text-[#1E293B] truncate">{getDisplayName()}</p>
              <p className="text-[11px] font-medium text-[#64748B] truncate">{getRoleDisplay()}</p>
            </div>
            <button
              onClick={logout}
              className="ml-auto text-[#64748B] hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-[#FEF2F2]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
        {isCollapsed && (
          <div className="flex flex-col gap-4 items-center">
            <div 
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 border border-[#F1F5F9] shadow-sm"
            >
              <span 
                className="text-[14px] font-bold"
                style={{ color: primaryColor }}
              >
                {getInitials()}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-[#64748B] hover:text-[#EF4444] transition-colors p-2.5 rounded-xl hover:bg-[#FEF2F2] bg-white border border-[#F1F5F9] shadow-sm"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={onToggle}
        className="absolute right-[-14px] top-[100px] w-7 h-7 bg-white rounded-full border border-[#E5E7EB] flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 active:scale-95 transition-all z-[60]"
        style={{ color: primaryColor }}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
