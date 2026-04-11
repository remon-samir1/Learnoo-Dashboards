"use client";

import React, { useState, useEffect } from 'react';
import {
  FileEdit, Plus, ChevronRight, ChevronDown, Video, Play, Settings, Trash2,
  FileText, Link as LinkIcon, Save, Eye, Building2, BookOpen, Loader2, X
} from 'lucide-react';
import { api } from '@/src/lib/api';
import { useCourses } from '@/src/hooks/useCourses';
import type { Course, Lecture, Chapter } from '@/src/types';
import { toast } from 'react-hot-toast';

export default function ContentManagerPage() {
  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useCourses([]);
  const [courses, setCourses] = useState<Course[]>([]);

  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedLectures, setExpandedLectures] = useState<Set<string>>(new Set());

  const [lecturesByCourse, setLecturesByCourse] = useState<Record<string, Lecture[]>>({});
  const [chaptersByLecture, setChaptersByLecture] = useState<Record<string, Chapter[]>>({});

  const [loadingLectures, setLoadingLectures] = useState<Set<string>>(new Set());
  const [loadingChapters, setLoadingChapters] = useState<Set<string>>(new Set());

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modals state
  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [isAddChapterModalOpen, setIsAddChapterModalOpen] = useState(false);
  const [addLectureData, setAddLectureData] = useState({ title: '', description: '' });
  const [addChapterData, setAddChapterData] = useState({
    title: '',
    duration: '',
    is_free_preview: 0 as 0 | 1,
    thumbnail: null as File | null,
    attachments: [] as File[]
  });

  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const attachmentInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const modalAttachmentInputRef = React.useRef<HTMLInputElement>(null);
  const modalThumbnailInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (coursesData) {
      setCourses(coursesData);
    }
  }, [coursesData]);

  const toggleCourse = async (course: Course) => {
    const courseId = course.id;
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
      if (!lecturesByCourse[courseId]) {
        try {
          setLoadingLectures(prev => new Set(prev).add(courseId));
          const lectures = await api.lectures.list({ course_id: courseId });
          setLecturesByCourse(prev => ({ ...prev, [courseId]: lectures.data }));
        } catch (error) {
          toast.error("Failed to load lectures");
        } finally {
          setLoadingLectures(prev => {
            const next = new Set(prev);
            next.delete(courseId);
            return next;
          });
        }
      }
    }
    setExpandedCourses(newExpanded);
    setSelectedCourse(course);
  };

  const toggleLecture = async (lecture: Lecture) => {
    const lectureId = lecture.id;
    const newExpanded = new Set(expandedLectures);
    if (newExpanded.has(lectureId)) {
      newExpanded.delete(lectureId);
    } else {
      newExpanded.add(lectureId);
      if (!chaptersByLecture[lectureId]) {
        try {
          setLoadingChapters(prev => new Set(prev).add(lectureId));
          const chapters = await api.chapters.list({ lecture_id: lectureId });
          setChaptersByLecture(prev => ({ ...prev, [lectureId]: chapters.data }));
        } catch (error) {
          toast.error("Failed to load chapters");
        } finally {
          setLoadingChapters(prev => {
            const next = new Set(prev);
            next.delete(lectureId);
            return next;
          });
        }
      }
    }
    setExpandedLectures(newExpanded);
    setSelectedLecture(lecture);
  };

  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  const handleCreateLecture = async () => {
    if (!selectedCourse) return;
    try {
      await api.lectures.create({
        course_id: Number(selectedCourse.id),
        title: addLectureData.title,
        description: addLectureData.description,
      });
      toast.success("Lecture created successfully");
      setIsAddLectureModalOpen(false);
      setAddLectureData({ title: '', description: '' });
      // Refresh lectures
      const lectures = await api.lectures.list({ course_id: selectedCourse.id });
      setLecturesByCourse(prev => ({ ...prev, [selectedCourse.id]: lectures.data }));
    } catch (error) {
      toast.error("Failed to create lecture");
    }
  };

  const handleCreateChapter = async () => {
    if (!selectedLecture) return;
    try {
      await api.chapters.create({
        lecture_id: Number(selectedLecture.id),
        title: addChapterData.title,
        duration: addChapterData.duration,
        thumbnail: addChapterData.thumbnail || undefined,
        is_free_preview: addChapterData.is_free_preview,
        attachments: addChapterData.attachments,
      });
      toast.success("Chapter created successfully");
      setIsAddChapterModalOpen(false);
      setAddChapterData({
        title: '',
        duration: '',
        is_free_preview: 0,
        thumbnail: null,
        attachments: []
      });
      // Refresh chapters
      const chapters = await api.chapters.list({ lecture_id: selectedLecture.id });
      setChaptersByLecture(prev => ({ ...prev, [selectedLecture.id]: chapters.data }));
    } catch (error) {
      toast.error("Failed to create chapter");
    }
  };

  const handleUpdateChapter = async () => {
    if (!selectedChapter) return;
    setIsUpdating(true);
    try {
      // If we have a thumbnailFile (video/preview), we add it to attachments as requested
      const finalAttachments = [...pendingAttachments];
      if (thumbnailFile) {
        finalAttachments.push(thumbnailFile);
      }

      await api.chapters.update(Number(selectedChapter.id), {
        title: selectedChapter.attributes.title,
        duration: selectedChapter.attributes.duration,
        is_free_preview: selectedChapter.attributes.is_free_preview ? 1 : 0,
        // thumbnail is technically for the image preview, but we can send it if thumbnailFile is an image
        thumbnail: (thumbnailFile && thumbnailFile.type.startsWith('image/')) ? thumbnailFile : undefined,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
      });
      toast.success("Chapter updated successfully");
      // Reset pending
      setPendingAttachments([]);
      setThumbnailFile(null);
      // Update local state
      const lectureId = selectedChapter.attributes.lecture_id.toString();
      const chapters = await api.chapters.list({ lecture_id: lectureId });
      setChaptersByLecture(prev => ({ ...prev, [lectureId]: chapters.data }));
    } catch (error) {
      toast.error("Failed to update chapter");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    try {
      await api.chapters.delete(Number(chapterId));
      toast.success("Chapter deleted successfully");
      if (selectedChapter?.id === chapterId) setSelectedChapter(null);
      // Refresh chapters
      if (selectedLecture) {
        const chapters = await api.chapters.list({ lecture_id: selectedLecture.id });
        setChaptersByLecture(prev => ({ ...prev, [selectedLecture.id]: chapters.data }));
      }
    } catch (error) {
      toast.error("Failed to delete chapter");
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await api.lectures.delete(Number(lectureId));
      toast.success("Lecture deleted successfully");
      if (selectedLecture?.id === lectureId) {
        setSelectedLecture(null);
        setSelectedChapter(null);
      }
      // Refresh lectures
      if (selectedCourse) {
        const lectures = await api.lectures.list({ course_id: selectedCourse.id });
        setLecturesByCourse(prev => ({ ...prev, [selectedCourse.id]: lectures.data }));
      }
    } catch (error) {
      toast.error("Failed to delete lecture");
    }
  };

  const handleToggleFreePreview = () => {
    if (!selectedChapter) return;
    setSelectedChapter({
      ...selectedChapter,
      attributes: {
        ...selectedChapter.attributes,
        is_free_preview: selectedChapter.attributes.is_free_preview ? 0 : 1
      }
    });
  };

  if (coursesLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Content Manager</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage course structure, upload videos, and configure lecture settings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* Left Panel: Course Structure */}
        <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-6 flex flex-col gap-6 self-start sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#1E293B]">Course Structure</h2>
            <button className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#4F46E5] transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {courses.map((course) => (
              <div key={course.id} className="flex flex-col gap-1">
                <div
                  onClick={() => toggleCourse(course)}
                  className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${expandedCourses.has(course.id) ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'hover:bg-[#F8FAFC] text-[#64748B]'
                    }`}
                >
                  {expandedCourses.has(course.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <BookOpen className="w-4 h-4" />
                  <span className="text-[13px] font-bold truncate">{course.attributes.title}</span>
                </div>

                {expandedCourses.has(course.id) && (
                  <div className="pl-4 flex flex-col gap-1 mt-1">
                    {loadingLectures.has(course.id) ? (
                      <div className="p-2 text-xs text-[#94A3B8] italic flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading lectures...
                      </div>
                    ) : (
                      <>
                        {lecturesByCourse[course.id]?.map((lecture) => (
                          <div key={lecture.id} className="flex flex-col gap-1">
                            <div
                              onClick={() => toggleLecture(lecture)}
                              className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors group ${expandedLectures.has(lecture.id) ? 'bg-[#F0FDF4] text-[#10B981]' : 'hover:bg-[#F8FAFC] text-[#64748B]'
                                }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {expandedLectures.has(lecture.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                <span className="text-[13px] font-bold truncate">{lecture.attributes.title}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLecture(lecture.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {expandedLectures.has(lecture.id) && (
                              <div className="pl-6 flex flex-col gap-1">
                                {loadingChapters.has(lecture.id) ? (
                                  <div className="p-2 text-xs text-[#94A3B8] italic flex items-center gap-2">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Loading chapters...
                                  </div>
                                ) : (
                                  <>
                                    {chaptersByLecture[lecture.id]?.map((chapter) => (
                                      <div
                                        key={chapter.id}
                                        onClick={() => selectChapter(chapter)}
                                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all group ${selectedChapter?.id === chapter.id
                                            ? 'bg-[#2137D6] text-white shadow-md shadow-indigo-100'
                                            : 'hover:bg-[#F8FAFC] text-[#64748B]'
                                          }`}
                                      >
                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                          <Video className={`w-4 h-4 flex-shrink-0 ${selectedChapter?.id === chapter.id ? 'text-white' : 'text-[#94A3B8]'}`} />
                                          <span className={`text-[13px] truncate ${selectedChapter?.id === chapter.id ? 'font-bold' : 'font-medium'}`}>
                                            {chapter.attributes.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {chapter.attributes.is_locked && (
                                            <span className="px-1.5 py-0.5 bg-[#FEF3C7] text-[#D97706] text-[9px] font-bold rounded">Locked</span>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteChapter(chapter.id);
                                            }}
                                            className={`p-1 rounded hover:bg-black/10 transition-colors ${selectedChapter?.id === chapter.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 text-[#94A3B8]'
                                              }`}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        setSelectedLecture(lecture);
                                        setIsAddChapterModalOpen(true);
                                      }}
                                      className="flex items-center gap-2 p-2 text-[#4F46E5] hover:bg-indigo-50 rounded-xl transition-all mt-1"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="text-[12px] font-bold">Add Chapter</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setSelectedCourse(course);
                            setIsAddLectureModalOpen(true);
                          }}
                          className="flex items-center gap-2 p-2 text-[#4F46E5] hover:bg-indigo-50 rounded-xl transition-all mt-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-[12px] font-bold">Add Lecture</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Chapter Details */}
        <div className="flex flex-col gap-8">
          {selectedChapter ? (
            <>
              {/* Action Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-3xl border border-[#F1F5F9] shadow-sm gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border uppercase tracking-tighter ${!selectedChapter.attributes.is_locked ? 'bg-[#EBFDF5] text-[#10B981] border-emerald-100' : 'bg-[#FFF7ED] text-[#F97316] border-orange-100'
                      }`}>
                      {selectedChapter.attributes.is_locked ? 'Locked' : 'Published'}
                    </span>
                    <span className="text-[11px] font-bold text-[#94A3B8]">{selectedChapter.attributes.duration}</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#1E293B]">{selectedChapter.attributes.title}</h2>
                  <p className="text-[12px] text-[#64748B]">Lecture ID: {selectedChapter.attributes.lecture_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all">
                    Preview
                  </button>
                  <button
                    onClick={handleUpdateChapter}
                    disabled={isUpdating}
                    className={`px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Video Content */}
              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#4F46E5]" />
                  <h3 className="text-[15px] font-bold text-[#1E293B]">Video Content</h3>
                </div>
                <div className="relative aspect-video bg-[#0F172A] rounded-2xl overflow-hidden group cursor-pointer flex items-center justify-center">
                  {thumbnailFile ? (
                    thumbnailFile.type.startsWith('video/') ? (
                      <video 
                        src={URL.createObjectURL(thumbnailFile)} 
                        className="w-full h-full object-cover" 
                        controls 
                      />
                    ) : (
                      <img src={URL.createObjectURL(thumbnailFile)} alt="Preview" className="w-full h-full object-cover" />
                    )
                  ) : selectedChapter.attributes.thumbnail ? (
                    // Check if the thumbnail attribute is actually a video link
                    selectedChapter.attributes.thumbnail.match(/\.(mp4|webm|ogg)$/) ? (
                      <video 
                        src={selectedChapter.attributes.thumbnail} 
                        className="w-full h-full object-cover" 
                        controls
                        poster={selectedChapter.attributes.thumbnail} // Fallback poster
                      />
                    ) : (
                      <img src={selectedChapter.attributes.thumbnail} alt={selectedChapter.attributes.title} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full bg-[#1E293B] flex items-center justify-center">
                      <p className="text-[#64748B] text-sm">No video or thumbnail</p>
                    </div>
                  )}
                  
                  {!thumbnailFile && !selectedChapter.attributes.thumbnail?.match(/\.(mp4|webm|ogg)$/) && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white rounded-lg text-[12px] font-bold text-[#1E293B] hover:bg-[#F8FAFC] transition-all"
                    >
                      {thumbnailFile ? "Change Selection" : "Replace Video/Link"}
                    </button>
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*,image/*"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnailFile(null);
                      }}
                      className="p-1.5 bg-[#EF4444] rounded-lg text-white hover:bg-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Chapter Settings */}
              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-8">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#4F46E5]" />
                  <h3 className="text-[15px] font-bold text-[#1E293B]">Chapter Settings</h3>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[13px] font-bold text-[#1E293B]">Free Preview</p>
                      <p className="text-[12px] text-[#94A3B8]">Allow students to watch this chapter without enrolling.</p>
                    </div>
                    <div
                      onClick={handleToggleFreePreview}
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${selectedChapter.attributes.is_free_preview ? 'bg-[#2137D6]' : 'bg-[#E2E8F0]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${selectedChapter.attributes.is_free_preview ? 'right-1' : 'left-1'}`}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[13px] font-bold text-[#1E293B]">Max Views</p>
                      <p className="text-[12px] text-[#94A3B8]">Set the maximum number of views allowed for this chapter.</p>
                    </div>
                    <div className="w-16 h-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-center font-bold text-[#1E293B]">
                      {selectedChapter.attributes.max_views}
                    </div>
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-8 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#4F46E5]" />
                    <h3 className="text-[15px] font-bold text-[#1E293B]">Attachments & Resources</h3>
                  </div>
                  <button
                    onClick={() => attachmentInputRef.current?.click()}
                    className="px-4 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-bold text-[#64748B] hover:text-[#4F46E5] transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setPendingAttachments(prev => [...prev, ...files]);
                    }}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {pendingAttachments.length === 0 && (
                    <p className="text-sm text-[#94A3B8] italic">No new attachments to upload.</p>
                  )}
                  {pendingAttachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-2xl border border-[#F1F5F9]">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#4F46E5]" />
                        <span className="text-[13px] font-medium text-[#1E293B]">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setPendingAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="p-1 text-[#94A3B8] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-[#F1F5F9] shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl flex items-center justify-center">
                <Video className="w-8 h-8 text-[#94A3B8]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1E293B]">Select a Chapter</h3>
                <p className="text-sm text-[#64748B] max-w-[280px]">Select a chapter from the structure tree to view and manage its content and settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Lecture Modal */}
      {isAddLectureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1E293B]">Add New Lecture</h3>
              <button onClick={() => setIsAddLectureModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Title</label>
                <input
                  type="text"
                  value={addLectureData.title}
                  onChange={(e) => setAddLectureData({ ...addLectureData, title: e.target.value })}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
                  placeholder="Enter lecture title"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Description</label>
                <textarea
                  value={addLectureData.description}
                  onChange={(e) => setAddLectureData({ ...addLectureData, description: e.target.value })}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all resize-none h-24"
                  placeholder="Enter lecture description"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddLectureModalOpen(false)}
                className="flex-1 px-6 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#64748B] hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLecture}
                className="flex-1 px-6 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100"
              >
                Create Lecture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Chapter Modal */}
      {isAddChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#1E293B]">Add New Chapter</h3>
              <button onClick={() => setIsAddChapterModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Title</label>
                <input
                  type="text"
                  value={addChapterData.title}
                  onChange={(e) => setAddChapterData({ ...addChapterData, title: e.target.value })}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
                  placeholder="Enter chapter title"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Duration (e.g. 45:00)</label>
                <input
                  type="text"
                  value={addChapterData.duration}
                  onChange={(e) => setAddChapterData({ ...addChapterData, duration: e.target.value })}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all"
                  placeholder="00:00"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Thumbnail / Video</label>
                <button
                  onClick={() => modalThumbnailInputRef.current?.click()}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-sm text-[#94A3B8] hover:bg-gray-50 transition-all font-medium"
                >
                  {addChapterData.thumbnail ? addChapterData.thumbnail.name : "Select file"}
                </button>
                <input
                  type="file"
                  ref={modalThumbnailInputRef}
                  className="hidden"
                  onChange={(e) => setAddChapterData({ ...addChapterData, thumbnail: e.target.files?.[0] || null })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-bold text-[#64748B]">Attachments</label>
                <button
                  onClick={() => modalAttachmentInputRef.current?.click()}
                  className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-sm text-[#94A3B8] hover:bg-gray-50 transition-all font-medium"
                >
                  {addChapterData.attachments.length > 0 ? `${addChapterData.attachments.length} files selected` : "Select files"}
                </button>
                <input
                  type="file"
                  ref={modalAttachmentInputRef}
                  className="hidden"
                  multiple
                  onChange={(e) => setAddChapterData({ ...addChapterData, attachments: Array.from(e.target.files || []) })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                <span className="text-[13px] font-bold text-[#1E293B]">Free Preview</span>
                <div
                  onClick={() => setAddChapterData({ ...addChapterData, is_free_preview: addChapterData.is_free_preview ? 0 : 1 })}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${addChapterData.is_free_preview ? 'bg-[#2137D6]' : 'bg-[#E2E8F0]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${addChapterData.is_free_preview ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddChapterModalOpen(false)}
                className="flex-1 px-6 py-3 bg-white border border-[#E2E8F0] rounded-2xl text-sm font-bold text-[#64748B] hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChapter}
                className="flex-1 px-6 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-2xl text-sm font-bold transition-all shadow-md shadow-indigo-100"
              >
                Create Chapter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
