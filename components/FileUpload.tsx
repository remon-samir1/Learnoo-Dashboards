import React, { useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  label: string;
  description?: string;
  onFileSelect?: (file: File) => void;
  previewUrl?: string;
  onClear?: () => void;
  progress?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  onFileSelect,
  previewUrl,
  onClear,
  progress,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploading = progress !== undefined && progress >= 0 && progress < 100;

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
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl min-h-[160px] flex flex-col items-center justify-center gap-3 transition-all overflow-hidden
          ${isDragging ? 'border-[#4F46E5] bg-blue-50' : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'}
          ${previewUrl ? 'border-none' : ''}
          ${isUploading ? 'cursor-default' : 'cursor-pointer'}
        `}
      >
        {isUploading && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <div className="w-48 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-medium text-[#1E293B]">{progress}% uploaded</p>
          </div>
        )}

        {previewUrl ? (
          <div className="absolute inset-0 w-full h-full group">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-medium">Click to change</p>
            </div>
            {onClear && !isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-full shadow-sm z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="p-3 bg-[#F8FAFC] rounded-full">
              <Upload className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-bold text-[#1E293B]">Click to upload {description || 'image'}</p>
              <p className="text-xs text-[#94A3B8] mt-1">PNG, JPG up to 5MB</p>
            </div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => e.target.files && onFileSelect?.(e.target.files[0])}
          disabled={isUploading}
        />
      </div>
    </div>
  );
};
