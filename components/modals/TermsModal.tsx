'use client';

import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const t = useTranslations('auth.createAccount.termsContent');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-color">
          <h2 className="font-sans font-semibold text-lg text-text-main">
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="font-sans text-sm text-text-muted mb-6">
            {t('lastUpdated')}
          </p>

          <div className="space-y-6">
            {Object.entries(t.raw('sections')).map(([key, section]: [string, any]) => (
              <div key={key} className="space-y-2">
                <h3 className="font-sans font-semibold text-base text-text-main">
                  {section.title}
                </h3>
                <div className="font-sans text-sm text-text-main whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-color flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
