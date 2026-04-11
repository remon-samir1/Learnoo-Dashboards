"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  BookOpen, 
  Users2, 
  Video, 
  Radio, 
  Library, 
  Laptop,
  Check
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface FeatureCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  features: Feature[];
}

const initialCategories: FeatureCategory[] = [
  {
    id: 'auth',
    title: 'Authentication & Security',
    description: 'Manage how students access the platform.',
    icon: ShieldCheck,
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    features: [
      { id: 'otp', name: 'Enable OTP Verification', description: 'Require One-Time Password for student login.', enabled: true },
      { id: 'no-otp', name: 'Allow Login Without OTP', description: 'Fallback for students who cannot receive SMS.', enabled: false },
    ]
  },
  {
    id: 'content',
    title: 'Content Features',
    description: 'Control what content features are available to students.',
    icon: BookOpen,
    iconColor: '#0EA5E9',
    iconBg: '#F0F9FF',
    features: [
      { id: 'notes', name: 'Enable Notes System', description: 'Allow students to create and share notes.', enabled: true },
      { id: 'downloads', name: 'Enable File Downloads', description: 'Allow students to download attached PDFs and resources.', enabled: false },
      { id: 'video-desc', name: 'Show Video Descriptions', description: 'Display instructor notes below video player.', enabled: true },
    ]
  },
  {
    id: 'community',
    title: 'Community & Interaction',
    description: 'Manage social features and student communication.',
    icon: Users2,
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    features: [
      { id: 'comments', name: 'Enable Comments', description: 'Allow students to comment on lectures and posts.', enabled: true },
      { id: 'voice-notes', name: 'Enable Voice Notes', description: 'Allow voice recordings in comments and Q&A.', enabled: false },
    ]
  },
  {
    id: 'video',
    title: 'Video Controls',
    description: 'Configure video playback restrictions.',
    icon: Video,
    iconColor: '#F59E0B',
    iconBg: '#FFFBEB',
    features: [
      { id: 'limits', name: 'Enable View Limits', description: 'Restrict how many times a student can watch a lecture.', enabled: true },
    ]
  },
  {
    id: 'live',
    title: 'Live Features',
    description: 'Global controls for live streaming features.',
    icon: Radio,
    iconColor: '#EF4444',
    iconBg: '#FEF2F2',
    features: [
      { id: 'sessions', name: 'Enable Live Sessions', description: 'Master switch for all live streaming functionality.', enabled: true },
      { id: 'chat', name: 'Enable Live Chat', description: 'Allow real-time text chat during live sessions.', enabled: true },
      { id: 'qa', name: 'Enable Live Q&A', description: 'Allow structured questions during live sessions.', enabled: true },
    ]
  },
  {
    id: 'library',
    title: 'Library Features',
    description: 'Control electronic library access.',
    icon: Library,
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    features: [
      { id: 'e-library', name: 'Enable Electronic Library', description: 'Show the library tab to students.', enabled: true },
      { id: 'purchases', name: 'Enable Purchases', description: 'Allow students to buy premium materials.', enabled: true },
    ]
  },
  {
    id: 'experience',
    title: 'Student Experience',
    description: 'Toggle UI elements in the student app.',
    icon: Laptop,
    iconColor: '#6366F1',
    iconBg: '#EEF2FF',
    features: [
      { id: 'watch', name: 'Enable Continue Watching', description: 'Show recently watched lectures on home.', enabled: true },
      { id: 'profile', name: 'Enable Profile Editing', description: 'Allow students to change their details.', enabled: true },
    ]
  }
];

const Switch = ({ enabled, onChange }: { enabled: boolean, onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
      enabled ? 'bg-indigo-600' : 'bg-gray-200'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function FeatureControlPage() {
  const [categories, setCategories] = useState(initialCategories);

  const toggleFeature = (categoryId: string, featureId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          features: cat.features.map(feat => {
            if (feat.id === featureId) {
              return { ...feat, enabled: !feat.enabled };
            }
            return feat;
          })
        };
      }
      return cat;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-[#1E293B]">Feature Control Panel</h1>
        <p className="text-sm text-[#64748B]">Instantly toggle platform features on or off. Changes apply immediately to all students.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#F1F5F9]">
              <div className="flex items-start gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: category.iconBg }}
                >
                  <category.icon className="w-6 h-6" style={{ color: category.iconColor }} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-[#1E293B]">{category.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{category.description}</p>
                </div>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-6">
              {category.features.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[13px] font-semibold text-[#1E293B]">{feature.name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{feature.description}</p>
                  </div>
                  <Switch 
                    enabled={feature.enabled} 
                    onChange={() => toggleFeature(category.id, feature.id)} 
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
