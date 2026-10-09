import React from 'react';
import { useLocale } from 'next-intl';
import type { ActivityData } from '@/src/types';

interface EngagementChartProps {
  data?: ActivityData | null;
}

export default function EngagementChart({ data }: EngagementChartProps) {
  const locale = useLocale();
  const ar = locale === 'ar';
  const values = data?.datasets[0]?.data ?? [];
  const maximum = Math.ceil(Math.max(4, ...values) / 4) * 4;
  const bars = (data?.labels ?? []).map((day, index) => ({
    day,
    value: `${((values[index] ?? 0) / maximum) * 100}%`,
  }));

  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 shadow-sm flex flex-col gap-6 h-[404px]">
      <h4 className="text-[15.3px] font-medium text-[#111827]">{ar ? 'التفاعل مع الكورسات' : 'Course Engagement'}</h4>
      
      <div className="flex-1 relative mt-4">
        {/* Y-Axis Labels */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] text-[#6B7280] w-8">
          {[1, 0.75, 0.5, 0.25, 0].map((fraction) => <span key={fraction}>{fraction * maximum}</span>)}
        </div>

        {/* Chart Area */}
        <div className="absolute inset-x-12 top-0 bottom-8 border-b border-gray-100 flex items-end justify-between px-4">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between z-0 pointer-events-none">
            <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
            <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
            <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
            <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          </div>

          {/* Bar elements */}
          {bars.map((bar, i) => (
            <div key={i} className="group relative h-full w-12 flex flex-col justify-end items-center z-10 hover:scale-105 transition-transform duration-200">
               <div 
                className="w-10 bg-[#2137D6] rounded-t-lg shadow-sm group-hover:bg-[#4F39F6] transition-colors" 
                style={{ height: typeof bar.value === 'string' ? bar.value : `${bar.value}px` }}
               ></div>
            </div>
          ))}
        </div>

        {/* X-Axis Labels */}
        <div className="absolute inset-x-12 bottom-0 flex justify-between text-[12px] text-[#6B7280] px-4">
          {bars.map((bar, i) => (
            <span key={bar.day === 'Invalid Date' || !bar.day ? `day-${i}` : bar.day} className="w-12 text-center">{bar.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
