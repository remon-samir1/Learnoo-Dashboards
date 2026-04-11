import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ 
  className = '', 
  width, 
  height, 
  circle = false 
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 animate-pulse';
  const shapeClasses = circle ? 'rounded-full' : 'rounded-lg';
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div 
      className={`${baseClasses} ${shapeClasses} ${className}`}
      style={style}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white border border-[#F1F5F9] rounded-2xl p-4 flex items-start justify-start gap-3 shadow-sm">
      <div className="p-3 rounded-xl bg-[#F8FAFC]">
        <Skeleton width={24} height={24} className="rounded-md" />
      </div>
      <div className="flex-1">
        <Skeleton width={80} height={14} className="mb-1" />
        <Skeleton width={60} height={20} />
      </div>
      <Skeleton width={40} height={20} className="rounded-md" />
    </div>
  );
}

export function QuickActionSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-w-[150px] flex-1 h-[115px] bg-white border border-[#EEEEEE] rounded-xl">
      <Skeleton width={48} height={48} circle className="mb-3" />
      <Skeleton width={80} height={12} />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white border border-[#F1F5F9] rounded-2xl p-6 shadow-sm">
      <Skeleton width={150} height={20} className="mb-4" />
      <div className="flex items-end gap-2 h-[200px] mt-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton 
            key={i} 
            width={`${100 / 7}%`} 
            height={`${Math.random() * 60 + 40}%`}
            className="rounded-t-lg"
          />
        ))}
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3">
      <Skeleton width={36} height={36} circle />
      <div className="flex-1 min-w-0">
        <Skeleton width="80%" height={14} className="mb-1" />
        <Skeleton width="60%" height={12} />
      </div>
      <Skeleton width={50} height={12} />
    </div>
  );
}

export function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-[#F1F5F9] rounded-2xl overflow-hidden shadow-sm">
      <Skeleton width="100%" height={192} />
      <div className="p-4">
        <Skeleton width="90%" height={18} className="mb-2" />
        <Skeleton width="60%" height={14} className="mb-4" />
        <div className="flex items-center gap-2 mb-4">
          <Skeleton width={24} height={24} circle />
          <Skeleton width={100} height={14} />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton width={60} height={24} className="rounded-full" />
          <Skeleton width={80} height={14} />
        </div>
      </div>
    </div>
  );
}

export function StudentRowSkeleton() {
  return (
    <tr className="hover:bg-[#F8FAFC]/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} circle />
          <div className="flex flex-col min-w-0">
            <Skeleton width={120} height={14} className="mb-1" />
            <Skeleton width={150} height={12} className="mb-0.5" />
            <Skeleton width={100} height={11} />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton width={140} height={14} />
      </td>
      <td className="px-6 py-4">
        <Skeleton width={120} height={14} />
      </td>
      <td className="px-6 py-4 text-center">
        <Skeleton width={60} height={24} className="rounded-full mx-auto" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} width={32} height={32} circle />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              <th className="px-6 py-4"><Skeleton width={100} height={14} /></th>
              <th className="px-6 py-4"><Skeleton width={100} height={14} /></th>
              <th className="px-6 py-4"><Skeleton width={80} height={14} /></th>
              <th className="px-6 py-4 text-center"><Skeleton width={60} height={14} className="mx-auto" /></th>
              <th className="px-6 py-4 text-right"><Skeleton width={80} height={14} className="ml-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {[...Array(rows)].map((_, i) => (
              <StudentRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between">
        <Skeleton width={150} height={14} />
        <div className="flex gap-2">
          <Skeleton width={80} height={32} className="rounded-lg" />
          <Skeleton width={80} height={32} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <Skeleton width={200} height={28} className="mb-2" />
        <Skeleton width={250} height={14} />
      </div>
      <Skeleton width={140} height={40} className="rounded-xl" />
    </div>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="bg-white p-4 rounded-2xl border border-[#F1F5F9] shadow-sm flex flex-col md:flex-row items-center gap-4 mb-6">
      <Skeleton width="100%" height={40} className="rounded-xl flex-1" />
      <Skeleton width={200} height={40} className="rounded-xl" />
    </div>
  );
}
