"use client"
import React, { useState } from 'react';
import SupportSidebar from '@/components/SupportSidebar';
import SupportHeader from '@/components/SupportHeader';

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <SupportSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[260px]'}`}>
        <SupportHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-[1264px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
