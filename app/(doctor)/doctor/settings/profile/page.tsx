'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import SettingsPageHeader from '@/components/settings/SettingsPageHeader';
import SettingsSection from '@/components/settings/SettingsSection';
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useAuthStore } from '@/src/stores/authStore';
import { api } from '@/src/lib/api';
import toast, { Toaster } from 'react-hot-toast';

export default function ProfileSettingsPage() {
  const { user } = useCurrentUser();
  const { updateUser } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.attributes?.first_name || '',
        lastName: user.attributes?.last_name || '',
        email: user.attributes?.email || '',
        phone: user.attributes?.phone || '',
      });
      // Set preview image from user data (already a full URL)
      if (user.attributes?.image) {
        setPreviewImage(user.attributes.image);
      }
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL and store file
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);
      setSelectedImageFile(file);
    }
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    setIsLoading(true);
    try {
      // Get existing values that are required by the API
      const existingAttrs = user?.attributes;

      // Use FormData to handle file upload
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.firstName.trim());
      formDataToSend.append('last_name', formData.lastName.trim());
      formDataToSend.append('email', formData.email.trim());
      if (formData.phone && typeof formData.phone === 'string') {
        formDataToSend.append('phone', formData.phone.replace(/\D/g, ''));
      }

      // Handle centers as JSON string
      if (existingAttrs?.centers) {
        formDataToSend.append('centers', JSON.stringify(existingAttrs.centers));
      }

      // Add image file if selected
      if (selectedImageFile) {
        formDataToSend.append('image', selectedImageFile);
      }

      const response = await api.auth.update(formDataToSend as any);

      if (response.data) {
        updateUser(response.data);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.attributes?.first_name || '',
        lastName: user.attributes?.last_name || '',
        email: user.attributes?.email || '',
        phone: user.attributes?.phone || '',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Toaster position="top-right" />
      <SettingsPageHeader
        title="Profile Settings"
        description="Update your personal information"
      />

      <SettingsSection title="Personal Information">
        <div className="space-y-6">
          {/* Profile Image */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#F8FAFC] border border-[#EEEEEE]">
              {previewImage ? (
                <Image
                  src={previewImage}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#4B5563]">Profile Photo</label>
              <div className="flex gap-2">
                <label className="px-4 py-2 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors cursor-pointer">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {previewImage && (
                  <button
                    onClick={() => {
                      setPreviewImage(null);
                      setSelectedImageFile(null);
                    }}
                    className="px-4 py-2 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[12px] text-[#6B7280]">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <label className="text-[13px] font-medium text-[#4B5563]">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-[13px] font-medium text-[#4B5563]">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
            />
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            <label className="text-[13px] font-medium text-[#4B5563]">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-[#EEEEEE] rounded-xl text-[14px] text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2137D6]/20 focus:border-[#2137D6] transition-all hover:border-[#D1D5DB]"
            />
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end gap-4 mt-8 pb-8">
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
