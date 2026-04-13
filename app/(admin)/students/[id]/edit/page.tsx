"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  ChevronDown,
  Info,
  GraduationCap,
  Building2,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
import { 
  useStudent,
  useUpdateStudent, 
  useUniversities, 
  useFaculties, 
  useCenters, 
  useCourses 
} from '@/src/hooks';
import type { CreateStudentRequest, StudentStatus } from '@/src/types';
import { StudentStatusLabels, parseStudentStatus } from '@/src/types';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  
  // Queries
  const { data: studentResponse, isLoading: isStudentLoading } = useStudent(studentId);
  const { data: universities, isLoading: isUniversitiesLoading } = useUniversities();
  const { data: faculties, isLoading: isFacultiesLoading } = useFaculties();
  const { data: centersData, isLoading: isCentersLoading } = useCenters();
  const { data: coursesData, isLoading: isCoursesLoading } = useCourses();
  
  // Mutation
  const { mutate: updateStudent, isLoading: isUpdating, error: updateError } = useUpdateStudent();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    university_id: '',
    faculty_id: '',
    center_ids: [] as number[],
    course_ids: [] as number[],
    status: 1 as StudentStatus,
    image: null as File | null
  });

  const [selectedCenters, setSelectedCenters] = useState<any[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<any[]>([]);

  // Pre-fill form when student data is loaded
  useEffect(() => {
    if (studentResponse?.data) {
      const attrs = studentResponse.data.attributes;
      setFormData({
        first_name: attrs.first_name || '',
        last_name: attrs.last_name || '',
        phone: attrs.phone?.toString() || '',
        email: attrs.email || '',
        password: '', // Don't pre-fill password
        university_id: attrs.university?.data?.id?.toString() || '',
        faculty_id: attrs.faculty?.data?.id?.toString() || '',
        center_ids: attrs.centers?.map((c: any) => parseInt(c.id)) || [],
        course_ids: attrs.enrolled_courses?.map((c: any) => parseInt(c.id)) || [],
        status: parseStudentStatus(attrs.status),
        image: null
      });

      // Set selected centers with proper name from attributes
      if (attrs.centers) {
        setSelectedCenters(attrs.centers.map((c: any) => ({
          id: c.id,
          name: c.attributes?.name || 'Unknown'
        })));
      }

      // Set selected courses with proper title from attributes
      if (attrs.enrolled_courses) {
        setSelectedCourses(attrs.enrolled_courses.map((c: any) => ({
          id: c.id,
          attributes: {
            title: c.attributes?.title || 'Untitled'
          }
        })));
      }
    }
  }, [studentResponse]);

  const handleCenterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const centerId = parseInt(e.target.value);
    if (!centerId) return;
    
    const center = centersData?.find(c => parseInt(c.id) === centerId);
    if (center && !formData.center_ids.includes(centerId)) {
      setFormData(prev => ({
        ...prev,
        center_ids: [...prev.center_ids, centerId]
      }));
      setSelectedCenters(prev => [...prev, center]);
    }
  };

  const removeCenter = (centerId: number) => {
    setFormData(prev => ({
      ...prev,
      center_ids: prev.center_ids.filter(id => id !== centerId)
    }));
    setSelectedCenters(prev => prev.filter(c => parseInt(c.id) !== centerId));
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const courseId = parseInt(e.target.value);
    if (!courseId) return;
    
    const course = coursesData?.find(c => parseInt(c.id) === courseId);
    if (course && !formData.course_ids.includes(courseId)) {
      setFormData(prev => ({
        ...prev,
        course_ids: [...prev.course_ids, courseId]
      }));
      setSelectedCourses(prev => [...prev, course]);
    }
  };

  const removeCourse = (courseId: number) => {
    setFormData(prev => ({
      ...prev,
      course_ids: prev.course_ids.filter(id => id !== courseId)
    }));
    setSelectedCourses(prev => prev.filter(c => parseInt(c.id) !== courseId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload: Partial<CreateStudentRequest> = {
        ...formData,
        university_id: formData.university_id ? parseInt(formData.university_id) : undefined,
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id) : undefined,
        image: formData.image || undefined,
        password: formData.password || undefined // Only send password if changed
      };

      await updateStudent(studentId, payload);
      router.push(`/students/${studentId}`);
    } catch (err) {
      console.error('Failed to update student:', err);
    }
  };

  if (isStudentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#2137D6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/students/${studentId}`}
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Edit Student</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Update student account details and course assignments.</p>
        </div>
      </div>

      {updateError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {updateError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Personal Information Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Personal Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">First Name</label>
              <input 
                type="text" 
                placeholder="Ahmed"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Last Name</label>
              <input 
                type="text" 
                placeholder="Ali"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Phone Number</label>
              <input
                type="text"
                placeholder="+20 100 123 4567"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">Email Address</label>
              <input 
                type="email" 
                placeholder="student@university.edu"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[13px] font-bold text-[#475569]">Password (Leave blank to keep current)</label>
              <input 
                type="password" 
                placeholder="********"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>
        </section>

        {/* Academic Information Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Academic Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">University</label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                value={formData.university_id}
                onChange={(e) => setFormData({...formData, university_id: e.target.value})}
                required
              >
                <option value="">Select University</option>
                {universities?.map((uni: any) => (
                  <option key={uni.id} value={uni.id}>{uni.attributes.name}</option>
                ))}
              </select>
              {isUniversitiesLoading ? (
                <Loader2 className="absolute right-10 top-[38px] w-4 h-4 text-[#94A3B8] animate-spin" />
              ) : (
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              )}
            </div>
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Faculty</label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                value={formData.faculty_id}
                onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
                required
              >
                <option value="">Select Faculty</option>
                {faculties?.map((fac: any) => (
                  <option key={fac.id} value={fac.id}>{fac.attributes.name}</option>
                ))}
              </select>
              {isFacultiesLoading ? (
                <Loader2 className="absolute right-10 top-[38px] w-4 h-4 text-[#94A3B8] animate-spin" />
              ) : (
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              )}
            </div>
          </div>
        </section>

        {/* Centers & Courses Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Centers & Courses</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
             <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Centers (Multiple Selection)</label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                onChange={handleCenterChange}
                value=""
              >
                <option value="">Select Center</option>
                {centersData?.map((center: any) => (
                  <option key={center.id} value={center.id}>{center.attributes?.name || center.name}</option>
                ))}
              </select>
              {isCentersLoading ? (
                <Loader2 className="absolute right-10 top-[38px] w-4 h-4 text-[#94A3B8] animate-spin" />
              ) : (
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              )}
              <div className="mt-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl min-h-[60px]">
                 <div className="flex flex-wrap gap-2">
                    {selectedCenters.map(center => (
                      <div key={center.id} className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1E293B] flex items-center gap-2 shadow-sm">
                         {center.name}
                         <button 
                           type="button" 
                           onClick={() => removeCenter(parseInt(center.id))}
                           className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                         >
                           <X className="w-3 h-3"/>
                         </button>
                      </div>
                    ))}
                    {selectedCenters.length === 0 && <span className="text-sm text-[#94A3B8]">No centers selected</span>}
                 </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] font-bold text-[#475569]">Assigned Courses (Multiple Selection)</label>
              <select 
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                onChange={handleCourseChange}
                value=""
              >
                <option value="">Select Course</option>
                {coursesData?.map((course: any) => (
                  <option key={course.id} value={course.id}>{course.attributes.title}</option>
                ))}
              </select>
              {isCoursesLoading ? (
                <Loader2 className="absolute right-10 top-[38px] w-4 h-4 text-[#94A3B8] animate-spin" />
              ) : (
                <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              )}
              <div className="mt-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl min-h-[60px]">
                 <div className="flex flex-wrap gap-2">
                    {selectedCourses.map(course => (
                      <div key={course.id} className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1E293B] flex items-center gap-2 shadow-sm">
                         {course.attributes.title}
                         <button 
                           type="button" 
                           onClick={() => removeCourse(parseInt(course.id))}
                           className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                         >
                           <X className="w-3 h-3"/>
                         </button>
                      </div>
                    ))}
                    {selectedCourses.length === 0 && <span className="text-sm text-[#94A3B8]">No courses selected</span>}
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Image Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Profile Image</h2>
          </div>
          <div className="p-6">
            <FileUpload 
              label="Profile Image" 
              onFileSelect={(file) => setFormData({...formData, image: file})}
            />
          </div>
        </section>

        {/* Account Status Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">Account Status</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-2 relative max-w-md">
              <label className="text-[13px] font-bold text-[#475569]">Status</label>
              <select
                className={`w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer font-bold ${
                  formData.status === 1 ? 'text-[#10B981]' : formData.status === 0 ? 'text-red-500' : 'text-orange-500'
                }`}
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: parseInt(e.target.value) as StudentStatus})}
              >
                <option value={1}>{StudentStatusLabels[1]}</option>
                <option value={0}>{StudentStatusLabels[0]}</option>
                <option value={2}>{StudentStatusLabels[2]}</option>
              </select>
              <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <button 
            type="button"
            onClick={() => router.push(`/students/${studentId}`)}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all shadow-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isUpdating}
            className="px-8 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUpdating ? 'Updating...' : 'Update Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
