"use client"
import React, { useState, useEffect } from 'react';
import DoctorSidebar from '../../components/DoctorSidebar';
import DoctorHeader from '../../components/DoctorHeader';
import { usePathname, useRouter } from 'next/navigation';

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const readOnlyRoute = /^\/doctor\/(universities|centers|faculties|departments)\/(add|[^/]+\/edit)$/.test(pathname) || /^\/doctor\/courses\/[^/]+\/edit$/.test(pathname);
  useEffect(() => {
    if (readOnlyRoute) router.replace('/doctor/departments');
  }, [readOnlyRoute, router]);
  if (readOnlyRoute) return null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      {/* Sidebar - Dynamically handle width based on collapse state */}
      <DoctorSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-0' : ''}`}>
        <DoctorHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
