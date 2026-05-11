'use client';

import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** Used in the default English body when `description` is not set */
  itemName?: string;
  isLoading?: boolean;
  /** When set, replaces the default confirmation paragraph (use for i18n) */
  description?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  confirmLoadingLabel?: string;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName = '',
  isLoading = false,
  description,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete',
  confirmLoadingLabel = 'Deleting...',
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1E293B] mb-1">{title}</h3>
              <p className="text-sm text-[#64748B]">
                {description ?? (
                  <>
                    Are you sure you want to delete{' '}
                    <strong className="text-[#1E293B]">{itemName}</strong>? This action cannot be undone.
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1 text-[#94A3B8] hover:text-[#64748B] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? confirmLoadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
