import React from 'react';
import { Edit2, Trash2, Download } from 'lucide-react';

interface LibraryItemCardProps {
  image: string;
  title: string;
  center: string;
  price: number;
  downloads: number;
  status: 'Active' | 'Draft' | 'Archived';
  onEdit?: () => void;
  onDelete?: () => void;
}

export const LibraryItemCard: React.FC<LibraryItemCardProps> = ({
  image,
  title,
  center,
  price,
  downloads,
  status,
  onEdit,
  onDelete
}) => {
  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    Draft: 'bg-amber-100 text-amber-700',
    Archived: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
      <div className="relative h-[250px] w-full overflow-hidden bg-[#F8FAFC]">
        <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[11px] font-bold ${statusColors[status]} shadow-sm`}>
          {status}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-[#1E293B] line-clamp-1">{title}</h3>
        <p className="text-[13px] text-[#64748B] mt-1.5">{center}</p>
        
        <div className="flex items-center justify-between mt-6">
          <span className="text-[15px] font-bold text-[#2137D6]">EGP {price}</span>
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <Download className="w-4 h-4" />
            <span className="text-[13px] font-medium">{downloads}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#F1F5F9] mt-5 pt-4">
          <button onClick={onEdit} className="p-2 -ml-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-lg transition-colors">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 -mr-2 text-[#EF4444] hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
