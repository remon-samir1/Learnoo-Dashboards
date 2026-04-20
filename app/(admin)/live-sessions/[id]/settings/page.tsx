"use client";

import React, { useState, useEffect, use } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, MessageCircle, Video, Loader2, ChevronDown, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import FeatureToggle from '@/components/live-sessions/FeatureToggle';
import { api } from '@/src/lib/api';
import type { LiveRoom, Chapter, Department, Course, Lecture } from '@/src/types';

export default function SessionSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [liveRoom, setLiveRoom] = useState<LiveRoom | null>(null);
  const [settings, setSettings] = useState({
    enable_chat: true,
    enable_recording: false,
    chapter_id: null as number | null
  });
  const [chapters, setChapters] = useState<Array<{
    chapter: Chapter;
    lecture: Lecture;
    course: Course;
    department: Department;
  }>>([]);
  const [isChapterPopupOpen, setIsChapterPopupOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchLiveRoom = async () => {
      try {
        const response = await api.liveRooms.get(Number(id));
        setLiveRoom(response.data);
        setSettings({
          enable_chat: response.data.attributes.enable_chat ?? true,
          enable_recording: response.data.attributes.enable_recording ?? false,
          chapter_id: response.data.attributes.chapter_id ?? null
        });
        
        // Fetch chapters for the live room's course
        try {
          const allChapters: Array<{
            chapter: Chapter;
            lecture: Lecture;
            course: Course;
            department: Department;
          }> = [];
          
          // Get the course ID from the live room
          const courseId = response.data.attributes.course?.data?.id || 
                          response.data.relationships?.course?.data?.id;
          
          if (courseId) {
            // Get the course details
            const courseRes = await api.courses.get(Number(courseId));
            const course = courseRes.data;
            
            // Try to get department info from course
            let dept: Department | null = null;
            const deptId = course.attributes?.category?.data?.id;
            if (deptId) {
              try {
                const deptRes = await api.departments.get(Number(deptId));
                dept = deptRes.data;
              } catch {
                // Fallback department
                dept = { id: '0', type: 'department', attributes: { name: 'Unknown' } } as Department;
              }
            }
            
            if (!dept) {
              dept = { id: '0', type: 'department', attributes: { name: 'Unknown' } } as Department;
            }
            
            // Get lectures for this course
            const lecturesRes = await api.lectures.list({ course_id: Number(courseId) });
            
            for (const lecture of lecturesRes.data || []) {
              // Get chapters for this lecture
              const chaptersRes = await api.chapters.list({ lecture_id: lecture.id });
              
              for (const chapter of chaptersRes.data || []) {
                allChapters.push({
                  chapter,
                  lecture,
                  course,
                  department: dept
                });
              }
            }
          }
          
          setChapters(allChapters);
        } catch (err) {
          console.error('Failed to fetch chapters:', err);
        }
      } catch (error) {
        console.error('Error fetching live room:', error);
        toast.error(t('liveSessions.settings.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchLiveRoom();
  }, [id]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.liveRooms.update(Number(id), {
        enable_chat: settings.enable_chat,
        enable_recording: settings.enable_recording,
        chapter_id: settings.chapter_id,
      });
      toast.success(t('liveSessions.settings.saveSuccess'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('liveSessions.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/live-sessions/${id}`}>
            <button className="p-2 hover:bg-[#F1F5F9] rounded-full transition-colors border border-transparent hover:border-[#E2E8F0]">
              <ChevronLeft className="w-6 h-6 text-[#1E293B]" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">{t('liveSessions.settings.pageTitle')}</h1>
            <p className="text-[#64748B] text-[14px]">{t('liveSessions.settings.pageDescription')}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl flex flex-col gap-8">
        {/* Communication Settings */}
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#2563EB]" />
            {t('liveSessions.settings.communication')}
          </h2>

          <div className="flex flex-col">
            <FeatureToggle
              label={t('liveSessions.settings.enableChat')}
              description={t('liveSessions.settings.enableChatDescription')}
              enabled={settings.enable_chat}
              onChange={() => handleToggle('enable_chat')}
            />
          </div>
        </div>

        {/* Recording & Playback Settings */}
        <div className="bg-white border border-[#F1F5F9] rounded-2xl p-8 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1E293B] mb-6 flex items-center gap-2">
            <Video className="w-5 h-5 text-[#7C3AED]" />
            {t('liveSessions.settings.recordingPlayback')}
          </h2>

          <div className="flex flex-col gap-4">
            <FeatureToggle
              label={t('liveSessions.settings.enableRecording')}
              description={t('liveSessions.settings.enableRecordingDescription')}
              enabled={settings.enable_recording}
              onChange={() => handleToggle('enable_recording')}
            />
            
            {settings.enable_recording && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-[#1E293B] mb-1">
                  Select Chapter for Recording
                </label>
                <button
                  onClick={() => setIsChapterPopupOpen(true)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-left text-sm bg-white hover:bg-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] flex items-center justify-between"
                >
                  <span className={settings.chapter_id ? 'text-[#1E293B]' : 'text-[#94A3B8]'}>
                    {settings.chapter_id 
                      ? (() => {
                          const selected = chapters.find(c => c.chapter.id === String(settings.chapter_id));
                          return selected 
                            ? selected.chapter.attributes.title
                            : 'Select a chapter...';
                        })()
                      : 'Select a chapter...'
                    }
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#64748B]" />
                </button>
                <p className="text-xs text-[#64748B] mt-1">
                  Recording will be saved as an attachment to the selected chapter
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-4">
          <Link href={`/live-sessions/${id}`}>
            <button className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl font-bold text-[14px] hover:bg-[#F8FAFC] transition-all">
              {t('liveSessions.settings.backToSession')}
            </button>
          </Link>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-bold text-[14px] hover:bg-[#1D4ED8] transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? t('liveSessions.settings.saving') : t('liveSessions.settings.saveChanges')}
          </button>
        </div>
      </div>

      {/* Chapter Tree View Popup */}
      {isChapterPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-[#1E293B]">Select Chapter</h3>
              <button
                onClick={() => setIsChapterPopupOpen(false)}
                className="p-2 hover:bg-[#F8FAFC] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[#64748B]" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* Build tree structure */}
              {(() => {
                // Group by department
                const deptMap = new Map();
                const seenChapters = new Set<string>(); // Track unique chapters
                
                chapters.forEach(({ chapter, lecture, course, department }) => {
                  // Skip if we've already seen this chapter for this lecture
                  const key = `${lecture.id}-${chapter.id}`;
                  if (seenChapters.has(key)) return;
                  seenChapters.add(key);
                  
                  if (!deptMap.has(department.id)) {
                    deptMap.set(department.id, { dept: department, courses: new Map() });
                  }
                  const courseMap = deptMap.get(department.id).courses;
                  if (!courseMap.has(course.id)) {
                    courseMap.set(course.id, { course, lectures: new Map() });
                  }
                  const lectureMap = courseMap.get(course.id).lectures;
                  if (!lectureMap.has(lecture.id)) {
                    lectureMap.set(lecture.id, { lecture, chapters: [] });
                  }
                  lectureMap.get(lecture.id).chapters.push(chapter);
                });

                const toggleNode = (nodeId: string) => {
                  setExpandedNodes(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(nodeId)) {
                      newSet.delete(nodeId);
                    } else {
                      newSet.add(nodeId);
                    }
                    return newSet;
                  });
                };

                return Array.from(deptMap.values()).map(({ dept, courses }) => (
                  <div key={dept.id} className="mb-2">
                    {/* Department */}
                    <button
                      onClick={() => toggleNode(`dept-${dept.id}`)}
                      className="flex items-center gap-2 w-full p-2 hover:bg-[#F8FAFC] rounded-lg text-left font-semibold text-[#1E293B]"
                    >
                      {expandedNodes.has(`dept-${dept.id}`) ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                      )}
                      <span className="text-sm">{dept.attributes.name}</span>
                    </button>
                    
                    {/* Courses */}
                    {expandedNodes.has(`dept-${dept.id}`) && (
                      <div className="ml-6">
                        {(Array.from(courses.values()) as { course: any; lectures: any }[]).map(({ course, lectures }) => (
                          <div key={course.id} className="mb-1">
                            <button
                              onClick={() => toggleNode(`course-${course.id}`)}
                              className="flex items-center gap-2 w-full p-2 hover:bg-[#F8FAFC] rounded-lg text-left font-medium text-[#334155]"
                            >
                              {expandedNodes.has(`course-${course.id}`) ? (
                                <ChevronDown className="w-4 h-4 text-[#64748B]" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-[#64748B]" />
                              )}
                              <span className="text-sm">{course.attributes.title}</span>
                            </button>
                            
                            {/* Lectures */}
                            {expandedNodes.has(`course-${course.id}`) && (
                              <div className="ml-6">
                                {(Array.from(lectures.values()) as { lecture: any; chapters: any }[]).map(({ lecture, chapters: lectureChapters }) => (
                                  <div key={lecture.id} className="mb-1">
                                    <button
                                      onClick={() => toggleNode(`lecture-${lecture.id}`)}
                                      className="flex items-center gap-2 w-full p-2 hover:bg-[#F8FAFC] rounded-lg text-left text-[#475569]"
                                    >
                                      {expandedNodes.has(`lecture-${lecture.id}`) ? (
                                        <ChevronDown className="w-4 h-4 text-[#64748B]" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                                      )}
                                      <span className="text-sm">{lecture.attributes.title}</span>
                                    </button>
                                    
                                    {/* Chapters */}
                                    {expandedNodes.has(`lecture-${lecture.id}`) && (
                                      <div className="ml-6">
                                        {lectureChapters
                                          .filter((chapter: Chapter) => String(chapter.attributes.lecture_id) === String(lecture.id))
                                          .map((chapter: Chapter) => (
                                          <button
                                            key={chapter.id}
                                            onClick={() => {
                                              setSettings(prev => ({ ...prev, chapter_id: Number(chapter.id) }));
                                              setIsChapterPopupOpen(false);
                                            }}
                                            className={`flex items-center gap-2 w-full p-2 rounded-lg text-left text-sm transition-colors ${
                                              settings.chapter_id === Number(chapter.id)
                                                ? 'bg-[#EEF2FF] text-[#2137D6] font-medium'
                                                : 'hover:bg-[#F8FAFC] text-[#64748B]'
                                            }`}
                                          >
                                            <span className="w-2 h-2 rounded-full bg-[#94A3B8]"></span>
                                            <span className="flex-1">{chapter.attributes.title}</span>
                                            <span className="text-xs text-[#94A3B8]">#{chapter.id}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
            
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <button
                onClick={() => setIsChapterPopupOpen(false)}
                className="w-full px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] rounded-xl text-sm font-bold hover:bg-[#F8FAFC] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
