"use client";

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Calendar,
  FileText,
  Award,
  RotateCcw,
  Loader2,
  FolderOpen,
  BookOpen,
  X,
  ImagePlus
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';
import { useCreateQuiz } from '@/src/hooks/useQuizzes';
import { useUniversities } from '@/src/hooks/useUniversities';
import { useFaculties } from '@/src/hooks/useFaculties';
import { useCenters } from '@/src/hooks/useCenters';
import { useDepartments } from '@/src/hooks/useDepartments';
import type { University, Faculty, Center, Department, Course } from '@/src/types';

interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  reason: string;
  image?: File | null;
  imagePreview?: string;
}

interface Question {
  id: string;
  quizId: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';
  score: number;
  autoCorrect: boolean;
  answers: Answer[];
  image?: File | null;
  imagePreview?: string;
}

interface ExamDetails {
  title: string;
  course: string;
  chapter: string;
  type: 'exam' | 'homework';
  duration: string;
  totalMarks: string;
  passingMarks: string;
  maxAttempts: string;
  status: 'Draft' | 'Active';
  startTime: string;
  endTime: string;
  is_public: boolean;
}

type NodeType = 'university' | 'faculty' | 'center' | 'department' | 'course';

interface TreeNode {
  id: string;
  type: NodeType;
  name: string;
  data: University | Faculty | Center | Department | Course;
  children: TreeNode[];
  level: number;
  parentId?: string | null;
}

function buildCourseTree(
  universities: University[],
  faculties: Faculty[],
  centers: Center[],
  departments: Department[],
  courses: Course[]
): TreeNode[] {
  const universityMap = new Map<string, TreeNode>();
  const facultyMap = new Map<string, TreeNode>();
  const centerMap = new Map<string, TreeNode>();
  const departmentMap = new Map<string, TreeNode>();
  const courseMap = new Map<string, TreeNode>();

  universities.forEach((univ) => {
    const univNode: TreeNode = {
      id: `univ-${univ.id}`,
      type: 'university',
      name: univ.attributes.name,
      data: univ,
      children: [],
      level: 0,
    };
    universityMap.set(univ.id, univNode);
  });

  faculties.forEach((faculty) => {
    const facultyNode: TreeNode = {
      id: `faculty-${faculty.id}`,
      type: 'faculty',
      name: faculty.attributes.name,
      data: faculty,
      children: [],
      level: 0,
    };
    facultyMap.set(faculty.id, facultyNode);
  });

  centers.forEach((center) => {
    const centerNode: TreeNode = {
      id: `center-${center.id}`,
      type: 'center',
      name: center.name,
      data: center,
      children: [],
      level: 0,
    };
    centerMap.set(center.id, centerNode);

    if (center.childrens && Array.isArray(center.childrens)) {
      center.childrens.forEach((child) => {
        const childType = child.type || "department";
        if (childType === "faculty") {
          const facultyNode: TreeNode = {
            id: `faculty-${child.id}`,
            type: "faculty",
            name: child.attributes.name,
            data: { id: child.id, type: "faculty", attributes: child.attributes } as Faculty,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };
          facultyMap.set(child.id, facultyNode);
          centerNode.children.push(facultyNode);
        }
      });

      center.childrens.forEach((child) => {
        const childType = child.type || "department";
        if (childType !== "faculty") {
          const deptNode: TreeNode = {
            id: `dept-${child.id}`,
            type: "department",
            name: child.attributes.name,
            data: { id: child.id, type: "department", attributes: child.attributes } as Department,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };
          const parentFacultyId = (child.attributes as any).parent?.data?.id;
          if (parentFacultyId && facultyMap.has(String(parentFacultyId))) {
            const parentFaculty = facultyMap.get(String(parentFacultyId))!;
            deptNode.level = parentFaculty.level + 1;
            deptNode.parentId = parentFaculty.id;
            parentFaculty.children.push(deptNode);
          } else {
            centerNode.children.push(deptNode);
          }
          departmentMap.set(child.id, deptNode);
        }
      });
    }
  });

  departments.forEach((dept) => {
    if (departmentMap.has(dept.id)) return;
    const deptNode: TreeNode = {
      id: `dept-${dept.id}`,
      type: 'department',
      name: dept.attributes.name,
      data: dept,
      children: [],
      level: 0,
    };
    departmentMap.set(dept.id, deptNode);
  });

  courses.forEach((course) => {
    const courseNode: TreeNode = {
      id: `course-${course.id}`,
      type: 'course',
      name: course.attributes.title,
      data: course,
      children: [],
      level: 0,
    };
    courseMap.set(course.id, courseNode);
  });

  const rootNodes: TreeNode[] = [];

  universityMap.forEach((univ) => {
    rootNodes.push(univ);
  });

  centers.forEach((center) => {
    const node = centerMap.get(center.id);
    if (!node) return;
    const parentId = center.parent?.data?.id || center.parent_id;
    if (parentId && universityMap.has(String(parentId))) {
      universityMap.get(String(parentId))!.children.push(node);
      node.level = 1;
    } else {
      node.level = 0;
      rootNodes.push(node);
    }
  });

  facultyMap.forEach((faculty) => {
    if (faculty.parentId) return;
    const parentId = (faculty.data as Faculty).attributes.parent?.data?.id;
    if (parentId && universityMap.has(parentId)) {
      universityMap.get(parentId)!.children.push(faculty);
      faculty.level = 1;
    }
  });

  const processedDeptIds = new Set<string>();
  departmentMap.forEach((dept) => {
    if (processedDeptIds.has(dept.id)) return;
    processedDeptIds.add(dept.id);
    if (dept.parentId) return;
    const parentId = (dept.data as Department).attributes.parent?.data?.id;
    const centerId = (dept.data as Department).attributes.center_id;
    if (parentId && facultyMap.has(parentId)) {
      facultyMap.get(parentId)!.children.push(dept);
      dept.level = 2;
      dept.parentId = facultyMap.get(parentId)!.id;
    } else if (centerId) {
      let centerNode = centerMap.get(String(centerId));
      if (!centerNode) centerNode = centerMap.get(`center-${centerId}`);
      if (centerNode) {
        centerNode.children.push(dept);
        dept.level = 2;
        dept.parentId = centerNode.id;
      }
    } else if (parentId) {
      let parentDept = departmentMap.get(parentId);
      if (!parentDept) parentDept = departmentMap.get(`dept-${parentId}`);
      if (!parentDept) {
        for (const [key, d] of departmentMap) {
          if (key === parentId || key === `dept-${parentId}` || d.id === parentId || d.id === `dept-${parentId}`) {
            parentDept = d;
            break;
          }
        }
      }
      if (parentDept) {
        parentDept.children.push(dept);
        dept.level = parentDept.level + 1;
        dept.parentId = parentDept.id;
      }
    } else {
      dept.level = 1;
      rootNodes.push(dept);
    }
  });

  courseMap.forEach((course) => {
    const deptId =
      (course.data as Course).attributes.department?.data?.id ||
      (course.data as Course).attributes.category?.data?.id;
    if (deptId && departmentMap.has(String(deptId))) {
      const dept = departmentMap.get(String(deptId))!;
      course.level = dept.level + 1;
      course.parentId = dept.id;
      dept.children.push(course);
    }
  });

  return rootNodes;
}

interface CourseTreeItemProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  selectedCourseId: string;
}

function CourseTreeItem({ node, expanded, onToggle, onSelect, selectedCourseId }: CourseTreeItemProps) {
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = node.type === 'course' && selectedCourseId === node.id.replace('course-', '');

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'university': return <FolderOpen className="w-4 h-4 text-blue-500" />;
      case 'faculty': return <FolderOpen className="w-4 h-4 text-purple-500" />;
      case 'center': return <FolderOpen className="w-4 h-4 text-green-500" />;
      case 'department': return <FolderOpen className="w-4 h-4 text-orange-500" />;
      case 'course': return <BookOpen className="w-4 h-4 text-indigo-500" />;
      default: return <FolderOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
        }`}
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.type === 'course') {
            onSelect(node);
          } else {
            onToggle(node.id);
          }
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
        {getNodeIcon(node.type)}
        <span className="text-sm">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CourseTreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedCourseId={selectedCourseId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateExamPage() {
  const t = useTranslations('exams');
  const router = useRouter();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { mutate: createQuiz, isLoading: isCreatingQuiz, isError: isQuizError, error: quizError } = useCreateQuiz();
  const { data: universities } = useUniversities();
  const { data: faculties } = useFaculties();
  const { data: centers } = useCenters();
  const { data: departments } = useDepartments();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [examDetails, setExamDetails] = useState<ExamDetails>({
    title: '',
    course: '',
    chapter: '',
    type: 'exam',
    duration: '60',
    totalMarks: '100',
    passingMarks: '60',
    maxAttempts: '1',
    status: 'Draft',
    startTime: '',
    endTime: '',
    is_public: false
  });

  // Tree selection state
  const [courseTreeExpanded, setCourseTreeExpanded] = useState<Set<string>>(new Set());

  // Build course tree
  const courseTree = useMemo(() => {
    if (!universities || !faculties || !centers || !departments || !courses) {
      return [];
    }
    return buildCourseTree(universities, faculties, centers, departments, courses);
  }, [universities, faculties, centers, departments, courses]);

  // Handle tree node toggle
  const handleCourseTreeToggle = (nodeId: string) => {
    setCourseTreeExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Handle tree node selection
  const handleCourseTreeSelect = (node: TreeNode) => {
    if (node.type === 'course') {
      const courseId = node.id.replace('course-', '');
      setExamDetails((prev) => ({ ...prev, course: courseId, chapter: '' }));
    }
  };

  // Filter chapters based on selected course
  const filteredChapters = examDetails.course
    ? chapters?.filter(ch => ch.attributes.course_id === parseInt(examDetails.course))
    : chapters;

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      quizId: '',
      text: '',
      type: 'single_choice',
      score: 1,
      autoCorrect: true,
      answers: [
        { id: '1', text: '', isCorrect: false, reason: '' },
        { id: '2', text: '', isCorrect: false, reason: '' }
      ]
    }
  ]);

  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([...questions, {
      id: newId,
      quizId: '',
      text: '',
      type: 'single_choice',
      score: 1,
      autoCorrect: true,
      image: null,
      imagePreview: '',
      answers: [
        { id: '1', text: '', isCorrect: false, reason: '', image: null, imagePreview: '' },
        { id: '2', text: '', isCorrect: false, reason: '', image: null, imagePreview: '' }
      ]
    }]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addAnswer = (qId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newAnswerId = (q.answers.length + 1).toString();
        return {
          ...q,
          answers: [...q.answers, { id: newAnswerId, text: '', isCorrect: false, reason: '' }]
        };
      }
      return q;
    }));
  };

  const removeAnswer = (qId: string, answerId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId && q.answers.length > 2) {
        return {
          ...q,
          answers: q.answers.filter(a => a.id !== answerId)
        };
      }
      return q;
    }));
  };

  const updateAnswer = (qId: string, answerId: string, updates: Partial<Answer>) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          answers: q.answers.map(a => a.id === answerId ? { ...a, ...updates } : a)
        };
      }
      return q;
    }));
  };

  const toggleCorrectAnswer = (qId: string, answerId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (q.type === 'single_choice' || q.type === 'true_false') {
          // Single choice - only one correct answer
          return {
            ...q,
            answers: q.answers.map(a => ({
              ...a,
              isCorrect: a.id === answerId ? !a.isCorrect : false
            }))
          };
        } else {
          // Multiple choice - toggle without affecting others
          return {
            ...q,
            answers: q.answers.map(a =>
              a.id === answerId ? { ...a, isCorrect: !a.isCorrect } : a
            )
          };
        }
      }
      return q;
    }));
  };

  const handleQuestionImageChange = (qId: string, file: File | null) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          image: file,
          imagePreview: file ? URL.createObjectURL(file) : ''
        };
      }
      return q;
    }));
  };

  const handleAnswerImageChange = (qId: string, answerId: string, file: File | null) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          answers: q.answers.map(a =>
            a.id === answerId
              ? { ...a, image: file, imagePreview: file ? URL.createObjectURL(file) : '' }
              : a
          )
        };
      }
      return q;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate course is selected
      if (!examDetails.course) {
        alert('Please select a course');
        setIsSubmitting(false);
        return;
      }

      // Create FormData for the API route - ALL as form fields
      const formData = new FormData();
      
      // Add quiz fields
      formData.append('course_id', examDetails.course);
      if (examDetails.chapter) formData.append('chapter_id', examDetails.chapter);
      formData.append('title', examDetails.title);
      formData.append('type', examDetails.type);
      formData.append('duration', examDetails.duration);
      formData.append('total_marks', examDetails.totalMarks);
      formData.append('passing_marks', examDetails.passingMarks);
      formData.append('max_attempts', examDetails.maxAttempts);
      formData.append('is_public', examDetails.is_public ? '1' : '0');
      formData.append('status', examDetails.status.toLowerCase());
      if (examDetails.startTime) formData.append('start_time', examDetails.startTime);
      if (examDetails.endTime) formData.append('end_time', examDetails.endTime);

      // Add questions with answers and images
      questions.forEach((q, qIndex) => {
        formData.append(`questions[${qIndex}][text]`, q.text);
        formData.append(`questions[${qIndex}][type]`, q.type);
        formData.append(`questions[${qIndex}][score]`, String(q.score));
        formData.append(`questions[${qIndex}][auto_correct]`, q.autoCorrect ? '1' : '0');
        formData.append(`questions[${qIndex}][order]`, String(qIndex + 1));

        // Add question image if exists
        if (q.image && q.image instanceof File) {
          console.log(`✓ Adding question ${qIndex} image: ${q.image.name} (${q.image.size} bytes)`);
          formData.append(`questions[${qIndex}][image]`, q.image);
        }

        // Add answers
        if (q.type !== 'short_answer' && q.answers) {
          q.answers.forEach((a, aIndex) => {
            formData.append(`questions[${qIndex}][answers][${aIndex}][text]`, a.text);
            formData.append(`questions[${qIndex}][answers][${aIndex}][is_correct]`, a.isCorrect ? '1' : '0');
            if (a.reason) {
              formData.append(`questions[${qIndex}][answers][${aIndex}][reason]`, a.reason);
            }

            // Add answer image if exists
            if (a.image && a.image instanceof File) {
              console.log(`✓ Adding question ${qIndex} answer ${aIndex} image: ${a.image.name} (${a.image.size} bytes)`);
              formData.append(`questions[${qIndex}][answers][${aIndex}][image]`, a.image);
            }
          });
        }
      });

      // Debug log
      console.log('=== FormData Contents ===');
      let fileCount = 0;
      for (const [key, value] of Array.from(formData.entries())) {
        if (value instanceof File) {
          console.log(`📁 ${key}: ${value.name} (${value.size} bytes)`);
          fileCount++;
        } else {
          console.log(`📝 ${key}: ${String(value).substring(0, 50)}`);
        }
      }
      console.log(`Total files: ${fileCount}`);

      // Get token
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') || '' : '';
      
      console.log('🚀 Sending FormData POST to /api/quiz-upload...');
      const quizResponse = await fetch('/api/quiz-upload', {
        method: 'POST',
        body: formData,
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      console.log('Response status:', quizResponse.status);
      const responseData = await quizResponse.json().catch(() => ({ message: 'Failed to parse response' }));

      if (!quizResponse.ok) {
        console.error('❌ Quiz creation error:', responseData);
        alert(responseData.message || responseData.details || t('create.error'));
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Quiz created successfully:', responseData);
      if (!responseData.data && !responseData.id) {
        throw new Error(t('create.error'));
      }

      // Success - redirect to exams page
      router.push('/exams');
    } catch (error) {
      console.error('Error creating exam:', error);
      alert(error instanceof Error ? error.message : t('create.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/exams"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('create.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('create.pageDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Exam Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2137D6]" />
            <h2 className="text-sm font-bold text-[#1E293B] uppercase tracking-wider">{t('create.examTitle')}</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            {/* Title */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('create.examTitle')} <span className="text-[#EF4444]">*</span></label>
              <input
                type="text"
                placeholder={t('create.titlePlaceholder')}
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                value={examDetails.title}
                onChange={(e) => setExamDetails({...examDetails, title: e.target.value})}
                required
              />
            </div>

            {/* Course Tree */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('create.course')} <span className="text-[#EF4444]">*</span></label>
              <div className="border border-[#E2E8F0] rounded-xl max-h-64 overflow-y-auto">
                {courseTree.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">{coursesLoading ? t('create.loading') : t('create.selectCourse')}</div>
                ) : (
                  <div className="py-2">
                    {courseTree.map((node) => (
                      <CourseTreeItem
                        key={node.id}
                        node={node}
                        expanded={courseTreeExpanded}
                        onToggle={handleCourseTreeToggle}
                        onSelect={handleCourseTreeSelect}
                        selectedCourseId={examDetails.course}
                      />
                    ))}
                  </div>
                )}
              </div>
              {examDetails.course && (
                <div className="mt-1 p-2 bg-[#EEF2FF] rounded-lg border border-[#2137D6]/20">
                  <p className="text-xs text-[#2137D6]">
                    Selected: {courses?.find(c => c.id === examDetails.course)?.attributes.title || `Course ${examDetails.course}`}
                  </p>
                </div>
              )}
            </div>

            {/* Type, Chapter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.examType')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.type}
                  onChange={(e) => setExamDetails({...examDetails, type: e.target.value as 'exam' | 'homework'})}
                  required
                >
                  <option value="exam">{t('create.exam')}</option>
                  <option value="homework">{t('create.homework')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.chapter')}</label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer disabled:opacity-50"
                  value={examDetails.chapter}
                  onChange={(e) => setExamDetails({...examDetails, chapter: e.target.value})}
                  disabled={!examDetails.course || chaptersLoading}
                >
                  <option value="">
                    {!examDetails.course
                      ? t('create.selectCourseFirst')
                      : chaptersLoading
                        ? t('create.loading')
                        : t('create.selectChapter')}
                  </option>
                  {filteredChapters?.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.attributes.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                {chaptersLoading && examDetails.course && <Loader2 className="absolute right-10 top-[42px] w-4 h-4 text-[#2137D6] animate-spin" />}
              </div>
            </div>

            {/* Duration, Marks, Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.duration')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.duration}
                    onChange={(e) => setExamDetails({...examDetails, duration: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.totalMarks')} <span className="text-[#EF4444]">*</span></label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.totalMarks}
                    onChange={(e) => setExamDetails({...examDetails, totalMarks: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.passingMarks')}</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.passingMarks}
                    onChange={(e) => setExamDetails({...examDetails, passingMarks: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.maxAttempts')}</label>
                <div className="relative">
                  <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="number"
                    min="1"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.maxAttempts}
                    onChange={(e) => setExamDetails({...examDetails, maxAttempts: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Start/End Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.startTime')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.startTime}
                    onChange={(e) => setExamDetails({...examDetails, startTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.endTime')}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="datetime-local"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                    value={examDetails.endTime}
                    onChange={(e) => setExamDetails({...examDetails, endTime: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Status & Published */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[13px] font-bold text-[#475569]">{t('status.label')} <span className="text-[#EF4444]">*</span></label>
                <select
                  className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                  value={examDetails.status}
                  onChange={(e) => setExamDetails({...examDetails, status: e.target.value as 'Draft' | 'Active'})}
                  required
                >
                  <option value="Draft">{t('status.draft')}</option>
                  <option value="Active">{t('status.active')}</option>
                </select>
                <ChevronDown className="absolute right-4 top-[42px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-[#475569]">{t('create.visibility')}</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <input
                    type="checkbox"
                    id="is_public"
                    className="w-4 h-4 text-[#2137D6] rounded border-[#E2E8F0] focus:ring-[#2137D6]"
                    checked={examDetails.is_public}
                    onChange={(e) => setExamDetails({...examDetails, is_public: e.target.checked})}
                  />
                  <label htmlFor="is_public" className="text-sm text-[#475569] cursor-pointer">
                    {t('create.public')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Questions Section */}
        <div className="flex flex-col gap-6">
          {questions.map((q, index) => (
            <section key={q.id} className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#1E293B]">{t('create.question')} {index + 1}</h3>
                  <span className="text-xs px-2 py-1 bg-[#E0E7FF] text-[#2137D6] rounded-full">
                    {q.type === 'single_choice' ? t('create.singleChoice') :
                     q.type === 'multiple_choice' ? t('create.multipleChoice') :
                     q.type === 'true_false' ? t('create.trueFalse') :
                     t('create.shortAnswer')}
                  </span>
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="p-6 flex flex-col gap-6">
                {/* Question Type & Score & Auto-correct */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2 relative">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.questionType')}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all appearance-none cursor-pointer"
                      value={q.type}
                      onChange={(e) => updateQuestion(q.id, { type: e.target.value as Question['type'] })}
                    >
                      <option value="single_choice">{t('create.singleChoice')}</option>
                      <option value="multiple_choice">{t('create.multipleChoice')}</option>
                      <option value="true_false">{t('create.trueFalse')}</option>
                      <option value="short_answer">{t('create.shortAnswer')}</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-[38px] w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.score')}</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all"
                      value={q.score}
                      onChange={(e) => updateQuestion(q.id, { score: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">Auto-correct</label>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl h-[42px]">
                      <input
                        type="checkbox"
                        id={`autoCorrect-${q.id}`}
                        className="w-4 h-4 text-[#2137D6] rounded border-[#E2E8F0] focus:ring-[#2137D6]"
                        checked={q.autoCorrect}
                        onChange={(e) => updateQuestion(q.id, { autoCorrect: e.target.checked })}
                      />
                      <label htmlFor={`autoCorrect-${q.id}`} className="text-sm text-[#475569] cursor-pointer">
                        {t('create.enableAutoCorrection')}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">{t('create.questionText')}</label>
                  <input
                    type="text"
                    placeholder={t('create.questionPlaceholder')}
                    className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                    value={q.text}
                    onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                  />
                </div>

                {/* Question Image */}
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-bold text-[#475569]">Question Image</label>
                  {q.imagePreview ? (
                    <div className="relative w-fit">
                      <img
                        src={q.imagePreview}
                        alt="Question preview"
                        className="h-32 w-auto rounded-xl border border-[#E2E8F0] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuestionImageChange(q.id, null)}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-[#EF4444] rounded-full shadow-sm transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-fit">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`q-img-${q.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleQuestionImageChange(q.id, file);
                        }}
                      />
                      <label
                        htmlFor={`q-img-${q.id}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                      >
                        <ImagePlus className="w-4 h-4" />
                        Upload Image
                      </label>
                    </div>
                  )}
                </div>

                {/* Answers Section */}
                {q.type !== 'short_answer' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-bold text-[#475569]">{t('create.answers')}</label>
                      {q.type !== 'true_false' && (
                        <button
                          type="button"
                          onClick={() => addAnswer(q.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#2137D6] bg-[#E0E7FF] rounded-lg hover:bg-[#C7D2FF] transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          {t('create.addAnswer')}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {q.answers.map((answer, ansIndex) => (
                        <div key={answer.id} className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleCorrectAnswer(q.id, answer.id)}
                              className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                answer.isCorrect
                                  ? 'bg-[#10B981] border-[#10B981] text-white'
                                  : 'border-[#E2E8F0] hover:border-[#10B981]'
                              }`}
                            >
                              {answer.isCorrect && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <input
                              type="text"
                              placeholder={`${t('create.answer')} ${ansIndex + 1}`}
                              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8]"
                              value={answer.text}
                              onChange={(e) => updateAnswer(q.id, answer.id, { text: e.target.value })}
                              required
                            />
                            {/* Answer reason */}
                            <input
                              type="text"
                              placeholder={`Reason for answer ${ansIndex + 1}`}
                              className="flex-1 px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] mt-2"
                              value={answer.reason}
                              onChange={(e) => updateAnswer(q.id, answer.id, { reason: e.target.value })}
                            />
                            {/* Answer image toggle */}
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`a-img-${q.id}-${answer.id}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  handleAnswerImageChange(q.id, answer.id, file);
                                }}
                              />
                              <label
                                htmlFor={`a-img-${q.id}-${answer.id}`}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-all ${
                                  answer.imagePreview ? 'bg-[#E0E7FF] text-[#2137D6]' : 'bg-[#F8FAFC] text-[#94A3B8] hover:text-[#64748B]'
                                }`}
                                title={answer.imagePreview ? 'Change image' : 'Add image'}
                              >
                                <ImagePlus className="w-4 h-4" />
                              </label>
                            </div>
                            {q.answers.length > 2 && q.type !== 'true_false' && (
                              <button
                                type="button"
                                onClick={() => removeAnswer(q.id, answer.id)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {/* Answer image preview */}
                          {answer.imagePreview && (
                            <div className="flex items-center gap-2 ml-9">
                              <img
                                src={answer.imagePreview}
                                alt={`Answer ${ansIndex + 1} preview`}
                                className="h-16 w-auto rounded-lg border border-[#E2E8F0] object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleAnswerImageChange(q.id, answer.id, null)}
                                className="p-1.5 text-[#EF4444] hover:bg-[#FEE2E2] rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-xs text-[#64748B]">
                      {t('create.markCorrectHint')}
                      {q.type === 'multiple_choice' && t('create.multipleAllowed')}
                    </p>
                  </div>
                )}

                {/* Short Answer Expected Response */}
                {q.type === 'short_answer' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-bold text-[#475569]">{t('create.expectedAnswer')}</label>
                    <textarea
                      placeholder={t('create.expectedAnswerPlaceholder')}
                      rows={3}
                      className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] focus:ring-opacity-10 transition-all placeholder:text-[#94A3B8] resize-none"
                      value={q.answers[0]?.text || ''}
                      onChange={(e) => {
                        if (q.answers.length === 0) {
                          updateAnswer(q.id, '1', { text: e.target.value });
                        } else {
                          updateAnswer(q.id, q.answers[0].id, { text: e.target.value });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        {/* Add Question Button */}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#1E293B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all w-fit"
        >
          <Plus className="w-4 h-4" />
          {t('create.addQuestion')}
        </button>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => router.push('/exams')}
            disabled={isSubmitting}
            className="px-8 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('create.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCreatingQuiz}
            className="px-10 py-3 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {(isSubmitting || isCreatingQuiz) && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isSubmitting || isCreatingQuiz ? t('create.creating') : t('create.createExam')}
          </button>
        </div>
      </form>
    </div>
  );
}
