"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import { ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/src/lib/api';
import { Course, CreateLiveRoomRequest } from '@/src/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function ScheduleSessionPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingCourses, setIsFetchingCourses] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    course_id: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    max_students: 50
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.courses.list();
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
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
    if (!formData.title || !formData.date || !formData.time) {
      toast.error('Please fill in title, date, and time');
      return;
    }

    setLoading(true);
    try {
      // Create started_at and ended_at
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

      // Format as Y-m-d H:i:s
      const formatDateTime = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d} ${h}-${min}-${s}`; // Wait, API example shows space between date and time
      };
      
      // Actually standard SQL format is Y-m-d H:i:s
      const sqlFormat = (date: Date) => {
        const iso = date.toISOString(); // 2026-04-11T18:40:56.000Z
        return iso.replace('T', ' ').slice(0, 19);
      };

      const requestData: CreateLiveRoomRequest = {
        title: formData.title,
        description: formData.description,
        course_id: formData.course_id ? Number(formData.course_id) : undefined,
        started_at: sqlFormat(startDateTime),
        ended_at: sqlFormat(endDateTime),
        max_students: Number(formData.max_students),
      };

      await api.liveRooms.create(requestData);
      toast.success('Session scheduled successfully!');
      router.push('/live-sessions');
    } catch (error: any) {
      console.error('Error scheduling session:', error);
      toast.error(error.message || 'Failed to schedule session');
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
          <h1 className="text-2xl font-bold text-[#1E293B]">Schedule Live Session</h1>
          <p className="text-[#64748B] text-[14px]">Create and configure a new live streaming session.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Session Details Card */}
          <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
            <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
              Session Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Session Title */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Session Title</label>
                <input 
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Physics 101: Q&A Session"
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Course */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Course</label>
                <div className="relative">
                  <select 
                    name="course_id"
                    value={formData.course_id}
                    onChange={handleChange}
                    disabled={isFetchingCourses}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none appearance-none transition-all text-[14px] bg-white disabled:bg-gray-50"
                  >
                    <option value="">{isFetchingCourses ? 'Loading courses...' : 'Select Course (Optional)'}</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.attributes.title}
                      </option>
                    ))}
                  </select>
                  <ChevronLeft className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-[#64748B] pointer-events-none" />
                </div>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                  />
                </div>
              </div>

              {/* Time */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Time</label>
                <div className="relative">
                  <input 
                    type="time" 
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Duration (minutes)</label>
                <input 
                  type="number" 
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  step={15}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Max Students */}
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Max Students (0 for unlimited)</label>
                <input 
                  type="number" 
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all text-[14px]"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#1E293B]">Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Provide a brief description of the session..."
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
                <span className="font-bold text-[14px]">Quick Help</span>
             </div>
             <p className="text-[12.5px] text-[#475569] leading-relaxed">
               Make sure all details are correct. All session settings can be adjusted later through the session settings page.
             </p>
             <ul className="text-[12.5px] text-[#475569] flex flex-col gap-2 mt-2">
                <li className="flex items-center gap-2">• Students will be notified</li>
                <li className="flex items-center gap-2">• Session links generated automatically</li>
                <li className="flex items-center gap-2">• Recording available post-session</li>
             </ul>
          </div>

          <div className="flex flex-col gap-3">
             <button 
               onClick={handleSubmit}
               disabled={loading}
               className="w-full py-3.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? 'Scheduling...' : 'Schedule Session'}
             </button>
             <Link href="/live-sessions">
               <button className="w-full py-3.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all text-center">
                 Cancel
               </button>
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
