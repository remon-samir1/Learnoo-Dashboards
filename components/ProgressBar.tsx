import React from 'react';

interface ProgressBarProps {
  label: string;
  value: number;
  colorClass?: string;
  percentagePosition?: 'side' | 'top';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  label, 
  value, 
  colorClass = "bg-[#10B981]",
  percentagePosition = 'side'
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#475569]">{label}</span>
        {(percentagePosition === 'side' || percentagePosition === 'top') && (
          <span className="text-xs font-bold text-[#1E293B]">{value}%</span>
        )}
      </div>
      <div className="w-full h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
