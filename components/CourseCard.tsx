import React from 'react';
import { Eye, Edit2, Trash2, Video, BookOpen, FileText } from 'lucide-react';

interface CourseCardProps {
  image: string;
  title: string;
  instructor: string;
  center: string;
  status: 'ACTIVE' | 'DRAFT';
  approval?: 'Approved' | 'Pending' | 'Declined';
  lectures: number;
  notes: number;
  exams: number;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  image,
  title,
  instructor,
  center,
  status,
  approval,
  lectures,
  notes,
  exams,
  onView,
  onEdit,
  onDelete
}) => {
  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-700',
    DRAFT: 'bg-amber-100 text-amber-700',
    ARCHIVED: 'bg-gray-100 text-gray-700'
  };

  const approvalColors = {
    Approved: 'bg-blue-100 text-blue-700',
    Pending: 'bg-orange-100 text-orange-700',
    Declined: 'bg-orange-100 text-orange-700'
  };

  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div className="relative h-48 w-full overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${statusColors[status]}`}>
            {status}
          </span>
          {approval && (
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${approvalColors[approval]}`}>
              {approval}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-[#1E293B] line-clamp-1">{title}</h3>
          <p className="text-xs text-[#64748B] mt-1">{instructor}</p>
          <div className="mt-2.5 inline-flex items-center px-2 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[10px] text-[#64748B]">
            {center}
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-[#F1F5F9] pt-4">
          <div className="flex flex-col items-center gap-1 border-r border-[#F1F5F9]">
            <Video className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[11px] font-bold text-[#1E293B]">{lectures}</span>
            <span className="text-[9px] text-[#94A3B8]">Lectures</span>
          </div>
          <div className="flex flex-col items-center gap-1 border-r border-[#F1F5F9]">
            <BookOpen className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[11px] font-bold text-[#1E293B]">{notes}</span>
            <span className="text-[9px] text-[#94A3B8]">Notes</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <FileText className="w-4 h-4 text-[#94A3B8]" />
            <span className="text-[11px] font-bold text-[#1E293B]">{exams}</span>
            <span className="text-[9px] text-[#94A3B8]">Exams</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button onClick={onView} className="p-1.5 text-[#94A3B8] hover:text-[#2137D6] hover:bg-blue-50 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 text-[#94A3B8] hover:text-[#2137D6] hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
