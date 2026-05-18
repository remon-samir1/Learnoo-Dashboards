'use client';

import React, { useState, useEffect } from 'react';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { usePlatformFeature, useUpdatePlatformFeature } from '@/src/hooks';
import api from '@/src/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function BrandingSettingsPage() {
  const { data: features, isLoading } = usePlatformFeature();
  const updateFeature = useUpdatePlatformFeature();

  const [formData, setFormData] = useState({
    primaryColor: '#2563EB',
    accentColor: '#10B981',
    fontFamily: 'Inter',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper to get feature value by key
  const getFeatureValue = (key: string, defaultValue: string = ''): string => {
    if (!features) return defaultValue;
    const feature = features.find((f) => f.attributes.key === key);
    return feature?.attributes.value || defaultValue;
  };

  useEffect(() => {
    if (features) {
      setFormData({
        primaryColor: getFeatureValue('primary_color', '#2563EB'),
        accentColor: getFeatureValue('accent_color', '#10B981'),
        fontFamily: getFeatureValue('font_family', 'Inter'),
      });
      // Load logo from API if exists (key is 'logo', not 'logo_url')
      const logoUrl = getFeatureValue('logo', '');
      if (logoUrl) {
        setLogoPreview(logoUrl);
      }
    }
  }, [features]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setLogoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    toast.success('Logo selected. Click Save Changes to upload.');
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    const requests = [];

    // Handle text values via JSON
    if (formData.primaryColor.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'primary_color', value: formData.primaryColor.trim() }));
    }
    if (formData.accentColor.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'accent_color', value: formData.accentColor.trim() }));
    }
    if (formData.fontFamily.trim()) {
      requests.push(updateFeature.mutateAsync({ key: 'font_family', value: formData.fontFamily.trim() }));
    }

    try {
      // Send text values first
      if (requests.length > 0) {
        await Promise.all(requests);
      }

      // Handle logo file via multipart/form-data to same endpoint
      if (logoFile) {
        const response = await api.platformFeature.storeOrUpdateFile('logo', logoFile);
        // Extract logo URL from response - handle both array and single object
        let logoUrl = '';
        const responseData = response.data as any;
        if (Array.isArray(responseData)) {
          const logoFeature = responseData.find((f: any) => f.attributes?.key === 'logo');
          logoUrl = logoFeature?.attributes?.value || '';
        } else if (responseData?.attributes) {
          logoUrl = responseData.attributes.value || '';
        }
        if (logoUrl) {
          setLogoPreview(logoUrl);
        }
      }

      toast.success('Branding settings saved successfully!');
      setLogoFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save branding settings');
    }
  };

  const handleCancel = () => {
    if (features) {
      setFormData({
        primaryColor: getFeatureValue('primary_color', '#2563EB'),
        accentColor: getFeatureValue('accent_color', '#10B981'),
        fontFamily: getFeatureValue('font_family', 'Inter'),
      });
      // Reset logo to saved value (key is 'logo')
      const savedLogoUrl = getFeatureValue('logo', '');
      setLogoPreview(savedLogoUrl || null);
      setLogoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <SettingsPageHeader 
        title="Branding" 
        description="Logos, colors, and visual identity" 
      />

      <SettingsSection title="Logo">
        <div className="flex items-center gap-6">
          <div 
            className="w-[100px] h-[100px] rounded-[16px] flex items-center justify-center border border-[#EEEEEE] shadow-sm shrink-0 overflow-hidden"
            style={{ backgroundColor: logoPreview ? 'transparent' : '#E0E7FF' }}
          >
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Logo preview" 
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[28px] font-bold" style={{ color: formData.primaryColor }}>L</span>
            )}
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoChange}
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              className="hidden"
            />
            <div className="flex items-center gap-3 mb-3">
              <button 
                onClick={handleLogoClick}
                className="flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] rounded-xl transition-colors"
              >
                <Upload className="w-4 h-4" />
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logoPreview && (
                <button 
                  onClick={removeLogo}
                  className="px-4 py-2.5 text-[13px] font-semibold text-[#EF4444] hover:bg-[#FEE2E2] rounded-xl transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[12px] text-[#9CA3AF]">PNG, JPG, SVG. Max 2MB. Recommended 512x512px.</p>
            {logoFile && (
              <p className="text-[12px] text-[#10B981] mt-1">{logoFile.name} (ready to upload)</p>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Colors & Typography">
        {isLoading ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="grid grid-cols-1 gap-1.5 relative">
              <label className="text-[13px] font-medium text-[#4B5563]">Primary Color</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div 
                    className="absolute left-[5px] top-[5px] bottom-[5px] w-10 rounded-lg shadow-sm cursor-pointer overflow-hidden"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Click to pick color"
                    />
                  </div>
                  <input 
                    type="text" 
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={handleChange}
                    className="w-full pl-[60px] pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 relative">
              <label className="text-[13px] font-medium text-[#4B5563]">Accent Color</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div 
                    className="absolute left-[5px] top-[5px] bottom-[5px] w-10 rounded-lg shadow-sm cursor-pointer overflow-hidden"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      title="Click to pick color"
                    />
                  </div>
                  <input 
                    type="text" 
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    className="w-full pl-[60px] pr-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 relative">
               <label className="text-[13px] font-medium text-[#4B5563]">Font Family</label>
                <select
                  name="fontFamily"
                  value={formData.fontFamily}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all appearance-none cursor-pointer hover:border-[#D1D5DB]"
                >
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                  <option>Poppins</option>
                  <option>Montserrat</option>
                  <option>Lato</option>
                  <option>Nunito</option>
                  <option>Ubuntu</option>
                  <option>Playfair Display</option>
                  <option>Merriweather</option>
                  <option>Noto Sans</option>
                  <option>Raleway</option>
                  <option>Work Sans</option>
                  <option>Source Sans Pro</option>
                  <option>Fira Sans</option>
                  <option>Libre Franklin</option>
                  <option>Cairo</option>
                  <option>Tajawal</option>
                  <option>Noto Naskh Arabic</option>
                  <option>Changa</option>
                  <option>Almarai</option>
                  <option>Amiri</option>
                </select>
                <div className="absolute right-4 top-[38px] pointer-events-none text-[#9CA3AF]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
            </div>

            {/* Font Family Preview */}
            <div className="xl:col-span-3">
              <label className="text-[13px] font-medium text-[#4B5563] block mb-2">Font Preview</label>
              <link
                rel="stylesheet"
                href={`https://fonts.googleapis.com/css2?family=${formData.fontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`}
              />
              <div
                key={formData.fontFamily}
                className="p-6 bg-white border border-[#EEEEEE] rounded-xl min-h-[120px] flex flex-col justify-center gap-3"
                style={{ fontFamily: `"${formData.fontFamily}", sans-serif` }}
              >
                <p className="text-[32px] font-bold" style={{ color: formData.primaryColor }}>
                  Aa Bb Cc 123
                </p>
                <p className="text-[16px] text-[#4B5563]">
                  The quick brown fox jumps over the lazy dog.
                </p>
                <p className="text-[14px] text-[#6B7280]">
                  Pack my box with five dozen liquor jugs.
                </p>
                <div className="flex gap-4 mt-2 pt-3 border-t border-[#F3F4F6]">
                  <span className="text-[12px] text-[#9CA3AF]">Light</span>
                  <span className="text-[12px] text-[#4B5563] font-normal">Normal</span>
                  <span className="text-[12px] text-[#111827] font-medium">Medium</span>
                  <span className="text-[12px]" style={{ color: formData.primaryColor, fontWeight: 600 }}>Semibold</span>
                  <span className="text-[12px] text-[#111827] font-bold">Bold</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      <div className="flex justify-end gap-4 mt-8 pb-8">
        <button 
          onClick={handleCancel}
          disabled={isLoading || updateFeature.isPending}
          className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isLoading || updateFeature.isPending}
          className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateFeature.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
