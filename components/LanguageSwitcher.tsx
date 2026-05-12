'use client';

import React, { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { Globe, Check } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const languages = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' },
];

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (locale: string) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Set cookie with 1 year expiry
    Cookies.set('locale', locale, { expires: 365, path: '/' });

    // Reload page to apply new language
    window.location.reload();
  };

  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#64748B] hover:bg-[#F4F5FD] hover:text-[#4F46E5] transition-colors"
        aria-label={t('switcher')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {currentLanguage?.code === 'en' ? t('english') : t('arabic')}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl border border-[#E2E8F0] shadow-lg z-50 overflow-hidden">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                currentLocale === language.code
                  ? 'bg-[#F4F5FD] text-[#4F46E5] font-medium'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }`}
            >
              <span>{language.label}</span>
              {currentLocale === language.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
