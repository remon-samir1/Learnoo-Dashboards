import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  onFileSelect?: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ label, description, onFileSelect }) => {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect?.(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-bold text-[#475569]">{label}</label>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
          ${isDragging ? 'border-[#2137D6] bg-blue-50' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}
        `}
      >
        <div className="p-3 bg-[#F8FAFC] rounded-full">
          <Upload className="w-6 h-6 text-[#94A3B8]" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1E293B]">Click to upload {description || 'image'}</p>
          <p className="text-xs text-[#94A3B8] mt-1">PNG, JPG up to 5MB</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={(e) => e.target.files && onFileSelect?.(e.target.files[0])}
        />
      </div>
    </div>
  );
};
