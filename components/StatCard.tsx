import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon | React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  iconColor?: string;
  bgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  trend,
  iconColor = "text-[#2137D6]",
  bgColor = "bg-white"
}) => {
  const isElement = React.isValidElement(icon);
  const IconComponent = !isElement && icon ? (icon as any) : null;

  return (
    <div className={`${bgColor} border border-[#F1F5F9] rounded-2xl p-4 flex  items-start justify-start gap-3 shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}>
      {trend && (
        <div className="absolute top-4 right-4 px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[10px] font-bold">
          {trend}
        </div>
      )}
      <div className={`p-3 rounded-xl bg-[#F8FAFC] group-hover:bg-[#2137D6]/5 transition-colors`}>
        {isElement ? (
          icon
        ) : IconComponent ? (
          <IconComponent className={`w-6 h-6 ${iconColor}`} />
        ) : (
          null
        )}
      </div>
      <div className="text-start">
        <p className="text-sm font-medium text-[#64748B] mt-0.5">{label}</p>
        <h3 className="text-lg font-bold text-[#1E293B]">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
