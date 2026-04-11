import React from 'react';
import type { ActivityData } from '@/src/types';

interface ActivityChartProps {
  data?: ActivityData[] | null;
}

function generatePathFromData(data: ActivityData[], field: 'students' | 'revenue'): string {
  if (!data || data.length === 0) return '';
  
  const maxValue = field === 'students' ? 400 : 2400;
  const width = 640;
  const height = 200;
  
  const points = data.map((item, index) => {
    const x = (index * width) / Math.max(data.length - 1, 1);
    const value = item[field] || 0;
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
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-xl p-8 shadow-sm flex flex-col gap-6 h-[436px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[15.3px] font-medium text-[#111827]">Student Activity & Revenue</h4>
        <div className="flex items-center gap-2 px-3 py-1.5 border border-[#EEEEEE] rounded-lg cursor-pointer hover:bg-[#F8FAFC] transition-colors">
          <span className="text-sm font-normal text-[#111827]">This Week</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      <div className="flex-1 relative mt-4">
        {/* Y-Axis Labels - Left (Activity) */}
        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[12px] text-[#6B7280] w-8">
          <span>400</span>
          <span>300</span>
          <span>200</span>
          <span>100</span>
          <span>0</span>
        </div>

        {/* Y-Axis Labels - Right (Revenue) */}
        <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-[12px] text-[#6B7280] w-12 text-right">
          <span>2400</span>
          <span>1800</span>
          <span>1200</span>
          <span>600</span>
          <span>0</span>
        </div>

        {/* Chart Area */}
        <div className="absolute inset-x-12 top-0 bottom-8 border-b border-gray-100 flex flex-col justify-between">
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          <div className="h-px w-full border-t border-dashed border-[#E5E7EB]"></div>
          
          {/* Main SVG Chart with Bezier Curves */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Student Activity Line (Blue) - Uses data if provided */}
            <path 
              d={data ? generatePathFromData(data, 'students') : "M 0 50 Q 80 150 160 180 Q 240 210 320 150 Q 400 90 480 50 Q 560 10 640 100"}
              fill="none" 
              stroke="#2137D6" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            {/* Dots on Blue Line */}
            {data && data.map((item, i) => {
              const x = (i * 640) / Math.max(data.length - 1, 1);
              const y = 200 - ((item.students || 0) / 400) * 200;
              return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#2137D6" strokeWidth="2" />;
            })}

            {/* Revenue Line (Green) */}
            <path 
              d={data ? generatePathFromData(data, 'revenue') : "M 0 170 Q 80 180 160 120 Q 240 50 320 180 Q 400 240 480 200 Q 560 160 640 120"}
              fill="none" 
              stroke="#10B981" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
             {/* Dots on Green Line */}
            {data && data.map((item, i) => {
              const x = (i * 640) / Math.max(data.length - 1, 1);
              const y = 200 - ((item.revenue || 0) / 2400) * 200;
              return <circle key={i} cx={x} cy={y} r="4" fill="white" stroke="#10B981" strokeWidth="2" />;
            })}
          </svg>
        </div>

        {/* X-Axis Labels */}
        <div className="absolute inset-x-12 bottom-0 flex justify-between text-[12px] text-[#6B7280]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#2137D6] rounded-full"></div>
          <span className="text-xs text-[#6B7280]">Students</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
          <span className="text-xs text-[#6B7280]">Revenue</span>
        </div>
      </div>
    </div>
  );
}
