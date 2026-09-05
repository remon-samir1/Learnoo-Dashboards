'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

export interface CountryCode {
  code: string;
  iso: string;
  flag: string;
  name: string;
}

/**
 * Comprehensive list of country calling codes with emoji flags.
 * Egypt is placed first as the default.
 */
export const COUNTRY_CODES: CountryCode[] = [
  { code: '20', iso: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '966', iso: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '971', iso: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '965', iso: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '974', iso: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '962', iso: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '961', iso: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '964', iso: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '968', iso: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '973', iso: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '967', iso: 'YE', flag: '🇾🇪', name: 'Yemen' },
  { code: '963', iso: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '970', iso: 'PS', flag: '🇵🇸', name: 'Palestine' },
  { code: '218', iso: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '216', iso: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '213', iso: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '212', iso: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '249', iso: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: '252', iso: 'SO', flag: '🇸🇴', name: 'Somalia' },
  { code: '253', iso: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { code: '269', iso: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: '222', iso: 'MR', flag: '🇲🇷', name: 'Mauritania' },
  // Europe
  { code: '44', iso: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '49', iso: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '33', iso: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '39', iso: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '34', iso: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '351', iso: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '31', iso: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '32', iso: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '41', iso: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '43', iso: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '46', iso: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '47', iso: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '45', iso: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '358', iso: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '48', iso: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '30', iso: 'GR', flag: '🇬🇷', name: 'Greece' },
  { code: '90', iso: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '380', iso: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '40', iso: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '420', iso: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '36', iso: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '353', iso: 'IE', flag: '🇮🇪', name: 'Ireland' },
  { code: '354', iso: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '370', iso: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '371', iso: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '372', iso: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '385', iso: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '386', iso: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '421', iso: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: '359', iso: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '381', iso: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '355', iso: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '389', iso: 'MK', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '382', iso: 'ME', flag: '🇲🇪', name: 'Montenegro' },
  { code: '387', iso: 'BA', flag: '🇧🇦', name: 'Bosnia' },
  { code: '352', iso: 'LU', flag: '🇱🇺', name: 'Luxembourg' },
  { code: '356', iso: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '357', iso: 'CY', flag: '🇨🇾', name: 'Cyprus' },
  // Americas
  { code: '1', iso: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '1', iso: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '52', iso: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '55', iso: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '54', iso: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '57', iso: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '56', iso: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '51', iso: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '58', iso: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '593', iso: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '591', iso: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '595', iso: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '598', iso: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '507', iso: 'PA', flag: '🇵🇦', name: 'Panama' },
  { code: '506', iso: 'CR', flag: '🇨🇷', name: 'Costa Rica' },
  { code: '503', iso: 'SV', flag: '🇸🇻', name: 'El Salvador' },
  { code: '502', iso: 'GT', flag: '🇬🇹', name: 'Guatemala' },
  { code: '504', iso: 'HN', flag: '🇭🇳', name: 'Honduras' },
  { code: '505', iso: 'NI', flag: '🇳🇮', name: 'Nicaragua' },
  { code: '53', iso: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '509', iso: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '1809', iso: 'DO', flag: '🇩🇴', name: 'Dominican Republic' },
  { code: '1876', iso: 'JM', flag: '🇯🇲', name: 'Jamaica' },
  { code: '1868', iso: 'TT', flag: '🇹🇹', name: 'Trinidad & Tobago' },
  // Asia
  { code: '91', iso: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '86', iso: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '81', iso: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '82', iso: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '62', iso: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '63', iso: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '66', iso: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '60', iso: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '65', iso: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '84', iso: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '880', iso: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '92', iso: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '94', iso: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '95', iso: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '977', iso: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '93', iso: 'AF', flag: '🇦🇫', name: 'Afghanistan' },
  { code: '855', iso: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '856', iso: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '976', iso: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '852', iso: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '886', iso: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  { code: '998', iso: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '7', iso: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '993', iso: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '992', iso: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '996', iso: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '994', iso: 'AZ', flag: '🇦🇿', name: 'Azerbaijan' },
  { code: '995', iso: 'GE', flag: '🇬🇪', name: 'Georgia' },
  { code: '374', iso: 'AM', flag: '🇦🇲', name: 'Armenia' },
  { code: '972', iso: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '98', iso: 'IR', flag: '🇮🇷', name: 'Iran' },
  // Africa
  { code: '234', iso: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '27', iso: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '254', iso: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '233', iso: 'GH', flag: '🇬🇭', name: 'Ghana' },
  { code: '255', iso: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '256', iso: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '251', iso: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '237', iso: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '225', iso: 'CI', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '221', iso: 'SN', flag: '🇸🇳', name: 'Senegal' },
  { code: '243', iso: 'CD', flag: '🇨🇩', name: 'DR Congo' },
  { code: '244', iso: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '258', iso: 'MZ', flag: '🇲🇿', name: 'Mozambique' },
  { code: '260', iso: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '263', iso: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '250', iso: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { code: '261', iso: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '230', iso: 'MU', flag: '🇲🇺', name: 'Mauritius' },
  { code: '226', iso: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '223', iso: 'ML', flag: '🇲🇱', name: 'Mali' },
  { code: '227', iso: 'NE', flag: '🇳🇪', name: 'Niger' },
  { code: '228', iso: 'TG', flag: '🇹🇬', name: 'Togo' },
  { code: '229', iso: 'BJ', flag: '🇧🇯', name: 'Benin' },
  { code: '235', iso: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: '236', iso: 'CF', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '241', iso: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { code: '242', iso: 'CG', flag: '🇨🇬', name: 'Congo' },
  { code: '257', iso: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '291', iso: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: '231', iso: 'LR', flag: '🇱🇷', name: 'Liberia' },
  { code: '232', iso: 'SL', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: '224', iso: 'GN', flag: '🇬🇳', name: 'Guinea' },
  { code: '220', iso: 'GM', flag: '🇬🇲', name: 'Gambia' },
  { code: '245', iso: 'GW', flag: '🇬🇼', name: 'Guinea-Bissau' },
  { code: '238', iso: 'CV', flag: '🇨🇻', name: 'Cape Verde' },
  { code: '239', iso: 'ST', flag: '🇸🇹', name: 'São Tomé & Príncipe' },
  { code: '248', iso: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { code: '265', iso: 'MW', flag: '🇲🇼', name: 'Malawi' },
  { code: '264', iso: 'NA', flag: '🇳🇦', name: 'Namibia' },
  { code: '267', iso: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '266', iso: 'LS', flag: '🇱🇸', name: 'Lesotho' },
  { code: '268', iso: 'SZ', flag: '🇸🇿', name: 'Eswatini' },
  // Oceania
  { code: '61', iso: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '64', iso: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '679', iso: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '675', iso: 'PG', flag: '🇵🇬', name: 'Papua New Guinea' },
  // Russia & CIS
  { code: '7', iso: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '375', iso: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '373', iso: 'MD', flag: '🇲🇩', name: 'Moldova' },
];

export const DEFAULT_COUNTRY_CODE = '20'; // Egypt

interface CountryCodeSelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

export default function CountryCodeSelect({ value, onChange, className }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCountry = useMemo(
    () => COUNTRY_CODES.find((c) => c.code === value) ?? COUNTRY_CODES[0],
    [value]
  );

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_CODES;
    const q = search.trim().toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearch('');
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }
  }, [isOpen]);

  // Focus search when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the DOM is rendered before focusing
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected into view when opened
  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedEl = listRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [isOpen]);

  // Lock body scroll on mobile when dropdown is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-[100px] sm:w-[130px] flex items-center gap-1 sm:gap-1.5 rounded-md border border-border-color bg-white px-2 sm:px-2.5 py-[9px] font-sans text-sm leading-5 text-text-main shadow-[0px_1px_2px_rgba(0,0,0,0.05)] outline-none transition-colors hover:bg-gray-50 focus:border-primary focus:shadow-[0px_0px_0px_3px_rgba(33,55,214,0.1)]"
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="font-sans text-xs sm:text-sm text-text-main">+{selectedCountry.code}</span>
        <svg
          className={`ms-auto h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mobile: bottom-sheet overlay | Desktop: positioned dropdown */}
      {isOpen && (
        <>
          {/* Backdrop overlay (mobile only) */}
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={() => { setIsOpen(false); setSearch(''); }}
          />

          {/* Dropdown panel */}
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-border-color bg-white shadow-[0px_-4px_20px_rgba(0,0,0,0.15)] overflow-hidden animate-[slideUp_0.2s_ease-out] sm:animate-[fadeIn_0.15s_ease-out] sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:bottom-auto sm:mt-1 sm:w-[280px] sm:rounded-lg sm:border sm:shadow-lg">
            {/* Mobile drag handle */}
            <div className="flex justify-center pt-2 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Search */}
            <div className="p-2 sm:p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full h-9 sm:h-8 px-3 sm:px-2.5 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-md font-sans text-sm sm:text-xs leading-5 text-text-main outline-none transition-colors placeholder:text-text-placeholder focus:border-primary focus:bg-white"
              />
            </div>

            {/* List */}
            <div ref={listRef} className="max-h-[50vh] sm:max-h-[240px] overflow-y-auto overscroll-contain">
              {filteredCountries.length === 0 ? (
                <div className="px-3 py-6 sm:py-4 text-center font-sans text-sm sm:text-xs text-text-muted">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = country.code === value && country.iso === selectedCountry.iso;
                  return (
                    <button
                      key={`${country.iso}-${country.code}`}
                      type="button"
                      data-selected={isSelected}
                      onClick={() => {
                        onChange(country.code);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-2.5 sm:gap-2.5 px-4 sm:px-3 py-3 sm:py-2 font-sans text-sm transition-colors cursor-pointer border-none outline-none ${
                        isSelected
                          ? 'bg-primary/5 text-primary'
                          : 'bg-white text-text-main hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg sm:text-base leading-none shrink-0">{country.flag}</span>
                      <span className="truncate text-start flex-1">{country.name}</span>
                      <span className="text-text-muted text-xs shrink-0">+{country.code}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Mobile safe area padding */}
            <div className="h-[env(safe-area-inset-bottom,0px)] sm:hidden" />
          </div>
        </>
      )}
    </div>
  );
}

