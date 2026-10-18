import React from 'react';
import { useLocale } from 'next-intl';
import type { ActivityData } from '@/src/types';

interface ActivityChartProps {
  data?: ActivityData | null;
}

function generatePathFromData(data: number[], maxValue: number): string {
  if (!data || !Array.isArray(data) || data.length === 0) return '';
  
  const width = 640;
  const height = 200;
  
  const points = data.map((item, index) => {
    const x = (index * width) / Math.max(data.length - 1, 1);
    const value = item;
    const y = height - (value / maxValue) * height;
    return { x, y };
  });
  
  if (points.length === 0) return '';
  
  // Generate smooth bezier curve path
  let path = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 3;
    const cpy1 = prev.y;
    const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
    const cpy2 = curr.y;
    path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
  }
  
  return path;
}

export default function ActivityChart({ data }: ActivityChartProps) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const students = data?.datasets[0]?.data ?? [];
  const revenue = data?.datasets[1]?.data ?? [];
  const studentMax = Math.ceil(Math.max(4, ...students) / 4) * 4;
  const revenueMax = Math.ceil(Math.max(4, ...revenue) / 4) * 4;
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 shadow-sm flex flex-col gap-6 h-[436px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[15.3px] font-medium text-[#111827]">{ar ? 'نشاط الطلاب والإيرادات' : 'Student Activity & Revenue'}</h4>
        <span className="text-sm text-[#6B7280]">{ar ? 'هذا الأسبوع' : 'This Week'}</span>
      </div>

      <div className="flex-1 relative mt-4">
        {/* Y-Axis Labels - Left (Activity) */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] text-[#6B7280] w-8">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => <span key={fraction}>{fraction * studentMax}</span>)}
        </div>

        {/* Y-Axis Labels - Right (Revenue) */}
        <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[12px] text-[#6B7280] w-12 text-right">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => <span key={fraction}>{fraction * revenueMax}</span>)}
        </div>

        {/* Chart Area */}
        <div className="absolute inset-x-12 top-0 bottom-8 border-b border-gray-100 flex flex-col justify-between">
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          
          {/* Main SVG Chart with Bezier Curves */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 640 200" preserveAspectRatio="none">
            {/* Student Activity Line (Blue) - Uses data if provided */}
            <path 
              d={generatePathFromData(students, studentMax)}
              fill="none" 
              stroke="#2137D6" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            {/* Dots on Blue Line */}
            {students.map((value, i) => {
              const x = (i * 640) / Math.max(students.length - 1, 1);
              const y = 200 - (value / studentMax) * 200;
              return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#2137D6" strokeWidth="2" />;
            })}

            {/* Revenue Line (Green) */}
            <path 
              d={generatePathFromData(revenue, revenueMax)}
              fill="none" 
              stroke="#10B981" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
             {/* Dots on Green Line */}
            {revenue.map((value, i) => {
              const x = (i * 640) / Math.max(revenue.length - 1, 1);
              const y = 200 - (value / revenueMax) * 200;
              return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#10B981" strokeWidth="2" />;
            })}
          </svg>
        </div>

        {/* X-Axis Labels */}
        <div className="absolute inset-x-12 bottom-0 flex justify-between text-[12px] text-[#6B7280]">
          {(data?.labels ?? []).map((label, i) => <span key={i}>{label}</span>)}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#2137D6] rounded-full"></div>
          <span className="text-xs text-[#6B7280]">{ar ? 'الطلاب' : 'Students'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
          <span className="text-xs text-[#6B7280]">{ar ? 'الإيرادات' : 'Revenue'}</span>
        </div>
      </div>
    </div>
  );
}
