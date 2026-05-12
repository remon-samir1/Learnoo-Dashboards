"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import { Course, CreateLiveRoomRequest } from '@/src/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ScheduleSessionPage() {
  const t = useTranslations();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    started_at: '',
    max_students: 50,
    max_join_time: 15
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.courses.list();
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error(t('courses.messages.loadError'));
      } finally {
        setIsFetchingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.course_id || !formData.title || !formData.started_at) {
      toast.error(t('liveSessions.schedule.validation.fillRequired'));
      return;
    }

    setLoading(true);
    try {
      // Format started_at as Y-m-d H:i:s
      const sqlFormat = (dateStr: string) => {
        const date = new Date(dateStr);
        const iso = date.toISOString();
        return iso.replace('T', ' ').slice(0, 19);
      };

      const requestData: CreateLiveRoomRequest = {
        course_id: Number(formData.course_id),
        title: formData.title,
        description: formData.description,
        started_at: sqlFormat(formData.started_at),
        max_students: Number(formData.max_students),
        max_join_time: formData.max_join_time ? Number(formData.max_join_time) : null,
      };

      await api.liveRooms.create(requestData);
      toast.success(t('liveSessions.schedule.success'));
      router.push('/live-sessions');
    } catch (error: any) {
      console.error('Error scheduling session:', error);
      toast.error(error.message || t('liveSessions.schedule.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/live-sessions">
          <button className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors border border-transparent hover:border-[#E2E8F0]">
            <ChevronLeft className="w-6 h-6 text-[#1E293B]" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('liveSessions.schedule.pageTitle')}</h1>
          <p className="text-[#64748B] text-[14px]">{t('liveSessions.schedule.pageDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Session Details Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              {t('liveSessions.schedule.sessionDetails')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Title */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.sessionTitle')}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t('liveSessions.schedule.titlePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Course */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.course')} *</label>
                <div className="relative">
                  <select 
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    disabled={isFetchingCourses}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none appearance-none transition-all text-[14px] bg-white disabled:bg-gray-50"
                  >
                    <option value="">{isFetchingCourses ? t('liveSessions.schedule.loadingCourses') : t('liveSessions.schedule.selectCourse')}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.attributes.title}
                      </option>
                    ))}
                  </select>
                  <ChevronLeft className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Start Time */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.startTime')} *</label>
                <input 
                  type="datetime-local" 
                  name="started_at"
                  value={formData.started_at}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Max Students */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.maxStudents')}</label>
                <input 
                  type="number" 
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Max Join Time */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.maxJoinTime')}</label>
                <input
                  type="number"
                  name="max_join_time"
                  value={formData.max_join_time}
                  onChange={handleChange}
                  min={0}
                  placeholder="15"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
                <p className="text-[11px] text-[#94A3B8]">{t('liveSessions.schedule.maxJoinTimeHint')}</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">{t('liveSessions.schedule.description')}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t('liveSessions.schedule.descriptionPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px] resize-none"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Form Summary & Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-[#F8FAFF] border border-[#E0E7FF] rounded-2xl p-6 flex flex-col gap-4">
             <div className="flex items-center gap-3 text-[#2563EB] mb-2">
                <Info className="w-5 h-5" />
                <span className="font-bold text-[14px]">{t('liveSessions.schedule.quickHelp')}</span>
             </div>
             <p className="text-[12.5px] text-[#475569] leading-relaxed">
               {t('liveSessions.schedule.helpText')}
             </p>
             <ul className="text-[12.5px] text-[#475569] flex flex-col gap-2 mt-2">
                <li className="flex items-center gap-2">• {t('liveSessions.schedule.helpItems.notify')}</li>
                <li className="flex items-center gap-2">• {t('liveSessions.schedule.helpItems.links')}</li>
                <li className="flex items-center gap-2">• {t('liveSessions.schedule.helpItems.recording')}</li>
             </ul>
          </div>

          <div className="flex flex-col gap-3">
             <button
               onClick={handleSubmit}
               disabled={loading}
               className="w-full py-3.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? t('liveSessions.schedule.scheduling') : t('liveSessions.schedule.scheduleButton')}
             </button>
             <Link href="/live-sessions">
               <button className="w-full py-3.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all text-center">
                 {t('liveSessions.schedule.cancel')}
               </button>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
