'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  School,
  MapPin,
  GraduationCap,
  Folder,
  FolderOpen,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useUniversities } from '@/src/hooks/useUniversities';
import { useCenters } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { useDepartments } from '@/src/hooks/useDepartments';
import { useCourses } from '@/src/hooks/useCourses';
import { useChapters } from '@/src/hooks/useChapters';

interface CourseTreeSelectProps {
  value: string | number | string[];
  onChange?: (value: string) => void;
  onMultiChange?: (value: string[]) => void;
  multiple?: boolean;
  inline?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  selectLectures?: boolean;
  selectChapters?: boolean;
  lecturesData?: any[];
  chaptersData?: any[];
  excludeIds?: string[];
}

interface TreeNode {
  id: string;
  type: 'university' | 'center' | 'faculty' | 'department' | 'course' | 'lecture' | 'chapter';
  name: string;
  children: TreeNode[];
  level: number;
  originalId: string;
  path: string[];
}

export function CourseTreeSelect({
  value,
  onChange,
  onMultiChange,
  multiple = false,
  inline = false,
  required = false,
  label,
  error,
  coursesData: outerCoursesData,
  selectLectures = false,
  selectChapters = false,
  lecturesData: outerLecturesData,
  chaptersData: outerChaptersData,
  excludeIds = [],
}: CourseTreeSelectProps & { coursesData?: any[]; lecturesData?: any[]; chaptersData?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const displayLabel = label || (selectLectures ? 'Lecture' : 'Course');

  const { data: universitiesData, isLoading: isLoadingUnivs } = useUniversities();
  const { data: centersData, isLoading: isLoadingCenters } = useCenters();
  const { data: facultiesData, isLoading: isLoadingFacs } = useFaculties();
  const { data: departmentsData, isLoading: isLoadingDepts } = useDepartments();
  const { data: internalCoursesData, isLoading: isLoadingCourses } = useCourses();
  const { data: internalChaptersData, isLoading: isLoadingChapters } = useChapters();

  const universities = useMemo(() => universitiesData ?? [], [universitiesData]);
  const centers = useMemo(() => centersData ?? [], [centersData]);
  const faculties = useMemo(() => facultiesData ?? [], [facultiesData]);
  const departments = useMemo(() => departmentsData ?? [], [departmentsData]);

  const courses = useMemo(() => (outerCoursesData !== undefined ? outerCoursesData : internalCoursesData) ?? [], [outerCoursesData, internalCoursesData]);
  const lectures = useMemo(() => outerLecturesData ?? [], [outerLecturesData]);
  const chapters = useMemo(() => (outerChaptersData !== undefined ? outerChaptersData : internalChaptersData) ?? [], [outerChaptersData, internalChaptersData]);

  const isLoading = isLoadingUnivs || isLoadingCenters || isLoadingFacs || isLoadingDepts || (outerCoursesData === undefined && isLoadingCourses) || (outerChaptersData === undefined && isLoadingChapters);

  const selectedValues: string[] = useMemo(() => {
    if (multiple) {
      if (Array.isArray(value)) return value.map(String);
      if (value === '' || value === undefined || value === null) return [];
      return [String(value)];
    }
    if (value === '' || value === undefined || value === null) return [];
    return [String(value)];
  }, [value, multiple]);

  const { tree, flatCourses, flatLectures, flatChapters } = useMemo(() => {
    if (isLoading && !universities.length && !centers.length && !faculties.length && !departments.length && !courses.length) {
      return { tree: [], flatCourses: new Map<string, TreeNode>(), flatLectures: new Map<string, TreeNode>(), flatChapters: new Map<string, TreeNode>() };
    }

    const universityMap = new Map<string, TreeNode>();
    const centerMap = new Map<string, TreeNode>();
    const facultyMap = new Map<string, TreeNode>();
    const departmentMap = new Map<string, TreeNode>();
    const courseMap = new Map<string, TreeNode>();
    const lectureMap = new Map<string, TreeNode>();
    const chapterMap = new Map<string, TreeNode>();

    universities.forEach((univ: any) => {
      const name = univ.attributes?.name || univ.name || 'University';
      universityMap.set(String(univ.id), {
        id: `univ-${univ.id}`,
        type: 'university',
        name,
        children: [],
        level: 0,
        originalId: String(univ.id),
        path: [name],
      });
    });

    centers.forEach((center: any) => {
      const name = center.attributes?.name || center.name || 'Center';
      centerMap.set(String(center.id), {
        id: `center-${center.id}`,
        type: 'center',
        name,
        children: [],
        level: 0,
        originalId: String(center.id),
        path: [name],
      });
    });

    faculties.forEach((fac: any) => {
      const name = fac.attributes?.name || fac.name || 'Faculty';
      facultyMap.set(String(fac.id), {
        id: `faculty-${fac.id}`,
        type: 'faculty',
        name,
        children: [],
        level: 0,
        originalId: String(fac.id),
        path: [name],
      });
    });

    departments.forEach((dept: any) => {
      const name = dept.attributes?.name || dept.name || 'Department';
      departmentMap.set(String(dept.id), {
        id: `dept-${dept.id}`,
        type: 'department',
        name,
        children: [],
        level: 0,
        originalId: String(dept.id),
        path: [name],
      });
    });

    faculties.forEach((fac: any) => {
      const node = facultyMap.get(String(fac.id));
      if (!node) return;
      const parentId = fac.attributes?.parent?.data?.id || fac.relationships?.parent?.data?.id || fac.attributes?.center_id || fac.parent_id || fac.center_id;
      if (parentId && centerMap.has(String(parentId))) {
        const parentNode = centerMap.get(String(parentId))!;
        node.level = parentNode.level + 1;
        node.path = [...parentNode.path, node.name];
        parentNode.children.push(node);
      }
    });

    departments.forEach((dept: any) => {
      const node = departmentMap.get(String(dept.id));
      if (!node) return;
      const parentId = dept.attributes?.parent?.data?.id || dept.relationships?.parent?.data?.id || dept.attributes?.center_id?.toString() || dept.attributes?.faculty_id || dept.parent_id || dept.faculty_id;
      if (parentId) {
        if (facultyMap.has(String(parentId))) {
          const parentNode = facultyMap.get(String(parentId))!;
          node.level = parentNode.level + 1;
          node.path = [...parentNode.path, node.name];
          parentNode.children.push(node);
        } else if (departmentMap.has(String(parentId))) {
          const parentNode = departmentMap.get(String(parentId))!;
          node.level = parentNode.level + 1;
          node.path = [...parentNode.path, node.name];
          parentNode.children.push(node);
        } else if (centerMap.has(String(parentId))) {
          const parentNode = centerMap.get(String(parentId))!;
          node.level = parentNode.level + 1;
          node.path = [...parentNode.path, node.name];
          parentNode.children.push(node);
        }
      }
    });

    centers.forEach((center: any) => {
      const node = centerMap.get(String(center.id));
      if (!node) return;
      const parentId = center.attributes?.parent?.data?.id || center.relationships?.parent?.data?.id || center.parent?.data?.id || center.parent_id || center.university_id || center.attributes?.university_id;
      if (parentId && universityMap.has(String(parentId))) {
        const parentNode = universityMap.get(String(parentId))!;
        node.level = parentNode.level + 1;
        node.path = [...parentNode.path, node.name];
        parentNode.children.push(node);
      }
    });

    courses.forEach((course: any) => {
      const deptId =
        course.attributes?.category?.data?.id ||
        course.relationships?.category?.data?.id ||
        course.attributes?.department?.data?.id ||
        course.relationships?.department?.data?.id ||
        course.attributes?.category_id?.toString() ||
        course.category_id?.toString();

      const name = course.attributes?.title || course.title || 'Course';
      const courseNode: TreeNode = {
        id: `course-${course.id}`,
        type: 'course',
        name,
        children: [],
        level: 0,
        originalId: String(course.id),
        path: [name],
      };

      courseMap.set(String(course.id), courseNode);

      if (deptId && departmentMap.has(String(deptId))) {
        const parentNode = departmentMap.get(String(deptId))!;
        courseNode.level = parentNode.level + 1;
        courseNode.path = [...parentNode.path, courseNode.name];
        parentNode.children.push(courseNode);
      } else if (deptId && facultyMap.has(String(deptId))) {
        const parentNode = facultyMap.get(String(deptId))!;
        courseNode.level = parentNode.level + 1;
        courseNode.path = [...parentNode.path, courseNode.name];
        parentNode.children.push(courseNode);
      }
    });

    // Create lecture nodes if selectLectures is enabled
    if (selectLectures && lectures.length > 0) {
      lectures.forEach((lecture: any) => {
        const courseId =
          lecture.attributes?.course?.data?.id ||
          lecture.relationships?.course?.data?.id ||
          lecture.attributes?.course_id?.toString() ||
          lecture.course_id?.toString();

        const name = lecture.attributes?.title || lecture.title || 'Lecture';
        const lectureNode: TreeNode = {
          id: `lecture-${lecture.id}`,
          type: 'lecture',
          name,
          children: [],
          level: 0,
          originalId: String(lecture.id),
          path: [name],
        };

        lectureMap.set(String(lecture.id), lectureNode);

        if (courseId && courseMap.has(String(courseId))) {
          const parentNode = courseMap.get(String(courseId))!;
          lectureNode.level = parentNode.level + 1;
          lectureNode.path = [...parentNode.path, lectureNode.name];
          parentNode.children.push(lectureNode);
        }
      });
    }

    // Create chapter nodes if selectChapters is enabled
    if (selectChapters && chapters.length > 0) {
      chapters.forEach((chapter: any) => {
        // Try course_id directly first, then fall back to lecture_id → course lookup
        const directCourseId =
          chapter.attributes?.course_id?.toString() ||
          chapter.course_id?.toString();

        const lectureId =
          chapter.attributes?.lecture_id?.toString() ||
          chapter.lecture_id?.toString();

        // Resolve courseId: prefer direct, fallback via lecture
        let resolvedCourseId: string | undefined = directCourseId;
        if (!resolvedCourseId && lectureId) {
          // Find the course that owns this lecture
          const ownerLecture = lectures.find((l: any) => String(l.id) === lectureId);
          if (ownerLecture) {
            resolvedCourseId =
              ownerLecture.attributes?.course_id?.toString() ||
              ownerLecture.course_id?.toString();
          }
        }

        const name = chapter.attributes?.title || chapter.title || 'Chapter';
        const chapterNode: TreeNode = {
          id: `chapter-${chapter.id}`,
          type: 'chapter',
          name,
          children: [],
          level: 0,
          originalId: String(chapter.id),
          path: [name],
        };

        chapterMap.set(String(chapter.id), chapterNode);

        if (resolvedCourseId && courseMap.has(resolvedCourseId)) {
          const parentNode = courseMap.get(resolvedCourseId)!;
          chapterNode.level = parentNode.level + 1;
          chapterNode.path = [...parentNode.path, chapterNode.name];
          parentNode.children.push(chapterNode);
        }
      });
    }

    const rootNodes: TreeNode[] = [];

    universityMap.forEach(node => {
      rootNodes.push(node);
    });

    centerMap.forEach((node, id) => {
      const center = centers.find((c: any) => String(c.id) === id);
      const parentId = (center as any)?.attributes?.parent?.data?.id || (center as any)?.relationships?.parent?.data?.id || center?.parent?.data?.id || center?.parent_id || (center as any)?.university_id;
      if (!parentId || !universityMap.has(String(parentId))) {
        rootNodes.push(node);
      }
    });

    facultyMap.forEach((node, id) => {
      const fac = faculties.find((f: any) => String(f.id) === id);
      const parentId = fac?.attributes?.parent?.data?.id || (fac as any)?.relationships?.parent?.data?.id || (fac?.attributes as any)?.center_id || (fac as any)?.parent_id || (fac as any)?.center_id;
      if (!parentId || !centerMap.has(String(parentId))) {
        rootNodes.push(node);
      }
    });

    departmentMap.forEach((node, id) => {
      const dept = departments.find((d: any) => String(d.id) === id);
      const parentId = dept?.attributes?.parent?.data?.id || (dept as any)?.relationships?.parent?.data?.id || (dept?.attributes as any)?.center_id?.toString() || (dept?.attributes as any)?.faculty_id || (dept as any)?.parent_id || (dept as any)?.faculty_id;
      if (!parentId || (!facultyMap.has(String(parentId)) && !departmentMap.has(String(parentId)) && !centerMap.has(String(parentId)))) {
        rootNodes.push(node);
      }
    });

    courseMap.forEach((node) => {
      const course = courses.find((c: any) => String(c.id) === node.originalId);
      const deptId = course?.attributes?.category?.data?.id || (course as any)?.relationships?.category?.data?.id || course?.attributes?.department?.data?.id || (course as any)?.relationships?.department?.data?.id || course?.attributes?.category_id?.toString() || (course as any)?.category_id?.toString();
      if (!deptId || (!departmentMap.has(String(deptId)) && !facultyMap.has(String(deptId)))) {
        rootNodes.push(node);
      }
    });

    const cleanTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map(node => {
          const cleanedChildren = cleanTree(node.children);
          return { ...node, children: cleanedChildren };
        })
        .filter(node => {
          // Leaf selectable nodes: always keep
          if (selectLectures && node.type === 'lecture') return true;
          if (selectChapters && node.type === 'chapter') return true;
          if (!selectLectures && !selectChapters && node.type === 'course') return true;
          // Container nodes: keep only if they have children after cleaning
          return node.children.length > 0;
        });
    };

    return {
      tree: cleanTree(rootNodes),
      flatCourses: courseMap,
      flatLectures: lectureMap,
      flatChapters: chapterMap,
    };
  }, [isLoading, universities, centers, faculties, departments, courses, lectures, chapters, selectLectures, selectChapters]);

  useEffect(() => {
    if (!searchQuery) return;

    const query = searchQuery.toLowerCase();
    const newExpandedNodes: Record<string, boolean> = {};

    const findMatches = (nodes: TreeNode[]): boolean => {
      let matchInBranch = false;
      nodes.forEach(node => {
        const nameMatches = node.name.toLowerCase().includes(query);
        const childrenMatch = findMatches(node.children);

        if (childrenMatch) {
          newExpandedNodes[node.id] = true;
          matchInBranch = true;
        }
        if (nameMatches) matchInBranch = true;
      });
      return matchInBranch;
    };

    findMatches(tree);
    if (Object.keys(newExpandedNodes).length > 0) {
      setExpandedNodes(prev => ({ ...prev, ...newExpandedNodes }));
    }
  }, [searchQuery, tree]);

  const filteredTree = useMemo(() => {
    if (!searchQuery) return tree;

    const query = searchQuery.toLowerCase();

    const filterNodes = (nodes: TreeNode[]): { filtered: TreeNode[]; hasMatch: boolean } => {
      let treeHasMatch = false;
      const filtered: TreeNode[] = [];

      nodes.forEach(node => {
        const nameMatches = node.name.toLowerCase().includes(query);
        const { filtered: childFiltered, hasMatch: childHasMatch } = filterNodes(node.children);

        if (nameMatches || childHasMatch) {
          filtered.push({ ...node, children: childFiltered });
          treeHasMatch = true;
        }
      });

      return { filtered, hasMatch: treeHasMatch };
    };

    return filterNodes(tree).filtered;
  }, [searchQuery, tree]);

  const selectedCourse = useMemo(() => {
    if (multiple || selectedValues.length !== 1) return null;
    if (selectLectures) {
      return flatLectures?.get(selectedValues[0]) || null;
    }
    if (selectChapters) {
      return flatChapters?.get(selectedValues[0]) || null;
    }
    return flatCourses.get(selectedValues[0]);
  }, [selectedValues, flatCourses, flatLectures, flatChapters, multiple, selectLectures, selectChapters]);

  const isAllExpandedDefault = inline && !searchQuery;

  useEffect(() => {
    if (isAllExpandedDefault && tree.length > 0) {
      const allExpanded: Record<string, boolean> = {};
      const collectAll = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.children.length > 0) {
            allExpanded[node.id] = true;
            collectAll(node.children);
          }
        });
      };
      collectAll(tree);
      setExpandedNodes(allExpanded);
    }
  }, [isAllExpandedDefault, tree]);

  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inline]);

  const handleSelectCourse = (courseId: string) => {
    if (multiple && onMultiChange) {
      const current = selectedValues;
      if (current.includes(courseId)) {
        onMultiChange(current.filter(id => id !== courseId));
      } else {
        onMultiChange([...current, courseId]);
      }
    } else if (!multiple && onChange) {
      onChange(courseId);
      if (!inline) setIsOpen(false);
    }
  };

  const renderTreeItem = (node: TreeNode) => {
    const isExpanded = !!expandedNodes[node.id];
    const isSelectable = selectLectures
      ? (node.type === 'lecture')
      : selectChapters
        ? (node.type === 'chapter')
        : (node.type === 'course');
    const itemId = node.originalId;
    const isExcluded = excludeIds.includes(itemId);
    const isSelected = isSelectable && selectedValues.includes(itemId);
    const hasChildren = node.children && node.children.length > 0;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'university': return <School className="w-4 h-4 text-slate-500" />;
        case 'center': return <MapPin className="w-4 h-4 text-emerald-500" />;
        case 'faculty': return <GraduationCap className="w-4 h-4 text-indigo-500" />;
        case 'department': return <Folder className="w-4 h-4 text-amber-500" />;
        case 'course': return <BookOpen className={`w-4 h-4 ${isSelected && !multiple ? 'text-white' : 'text-blue-500'}`} />;
        case 'lecture': return <FolderOpen className={`w-4 h-4 ${isExcluded ? 'text-gray-400' : isSelected && !multiple ? 'text-white' : 'text-purple-500'}`} />;
        case 'chapter': return <FolderOpen className={`w-4 h-4 ${isExcluded ? 'text-gray-400' : isSelected && !multiple ? 'text-white' : 'text-orange-500'}`} />;
      }
    };

    return (
      <div key={node.id} className="flex flex-col select-none">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (isSelectable && !isExcluded) {
              handleSelectCourse(itemId);
            } else {
              toggleNode(node.id, e);
            }
          }}
          style={{ paddingLeft: `${Math.max(node.level * 16, 8)}px` }}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all cursor-pointer ${isExcluded
            ? 'text-gray-400 cursor-not-allowed'
            : isSelectable
              ? multiple
                ? 'hover:bg-slate-50 text-[#1E293B] font-medium'
                : isSelected
                  ? 'bg-[#2137D6] text-white font-semibold hover:bg-[#1a2bb5]'
                  : 'hover:bg-slate-50 text-[#1E293B] font-medium'
              : 'hover:bg-slate-50 text-[#64748B]'
            }`}
        >
          {!isSelectable && hasChildren ? (
            <span
              onClick={(e) => toggleNode(node.id, e)}
              className="p-1 rounded hover:bg-slate-200/50 transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : !isSelectable ? (
            <span className="w-[22px] flex-shrink-0" />
          ) : null}

          {isSelectable && multiple && !isExcluded ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-[#2137D6] border-[#2137D6]' : 'border-[#CBD5E1]'
                }`}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
          ) : null}

          {getNodeIcon()}

          <span className="truncate flex-1">{node.name}</span>

          {isExcluded && <span className="text-xs text-gray-400">(Current)</span>}
          {isSelected && !multiple && <Check className="w-4 h-4 text-white flex-shrink-0" />}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col mt-0.5 border-l border-slate-100 ml-3">
            {node.children.map(child => renderTreeItem(child))}
          </div>
        )}
      </div>
    );
  };

  const treeContent = (
    <div className="flex flex-col gap-1">
      {filteredTree.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#64748B]">
          {searchQuery ? `No matching ${selectLectures ? 'lectures' : selectChapters ? 'chapters' : 'courses'} found` : `No ${selectLectures ? 'lectures' : selectChapters ? 'chapters' : 'courses'} available`}
        </div>
      ) : (
        filteredTree.map(node => renderTreeItem(node))
      )}
    </div>
  );

  const searchBar = (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F1F5F9] bg-[#F8FAFC]/50">
      <Search className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
      <input
        type="text"
        placeholder={`Search ${selectLectures ? 'lectures' : selectChapters ? 'chapters' : 'courses'}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent text-sm text-[#1E293B] border-none focus:outline-none placeholder:text-[#94A3B8]"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="p-1 rounded-full hover:bg-slate-200 text-[#94A3B8] flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  if (inline) {
    return (
      <div ref={containerRef} className="flex flex-col gap-2 w-full md:col-span-2 overflow-y-auto max-h-[min(80vh,600px)] custom-scrollbar">
        <label className="text-[13px] font-bold text-[#475569]">
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
          {searchBar}
          <div className="p-2 overflow-y-auto max-h-[300px] custom-scrollbar">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2137D6]" />
                Loading structure...
              </div>
            ) : (
              treeContent
            )}
          </div>
        </div>

        {multiple && selectedValues.length > 0 && (
          <div className="p-2.5 bg-[#EEF2FF] rounded-lg border border-[#2137D6]/20">
            <p className="text-xs text-[#2137D6]">
              Selected ({selectedValues.length}): {selectedValues.map(id =>
                selectLectures
                  ? lectures?.find(l => String(l.id) === id)?.attributes?.title
                  : selectChapters
                    ? chapters?.find(c => String(c.id) === id)?.attributes?.title
                    : courses?.find(c => String(c.id) === id)?.attributes?.title
              ).filter(Boolean).join(', ')}
            </p>
          </div>
        )}

        {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
      </div>
    );
  }

  const selectedNames = multiple && selectedValues.length > 0
    ? selectedValues.map(id =>
      selectLectures
        ? lectures?.find(l => String(l.id) === id)?.attributes?.title
        : selectChapters
          ? chapters?.find(c => String(c.id) === id)?.attributes?.title
          : courses?.find(c => String(c.id) === id)?.attributes?.title
    ).filter(Boolean)
    : [];

  return (
    <div ref={containerRef} className="flex flex-col gap-2 relative w-full md:col-span-2">
      <label className="text-[13px] font-bold text-[#475569]">
        {displayLabel}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm focus:outline-none transition-all ${isOpen ? 'border-[#2137D6] ring-2 ring-[#2137D6] ring-opacity-10 shadow-sm' : 'border-[#E2E8F0]'
          } ${error ? 'border-red-500' : ''} disabled:opacity-50 text-left`}
      >
        <div className="flex flex-col gap-0.5 truncate flex-1 pr-4">
          {isLoading ? (
            <span className="text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2137D6]" /> Loading structure...
            </span>
          ) : multiple ? (
            selectedValues.length > 0 ? (
              <>
                <span className="font-semibold text-[#1E293B] truncate">
                  {selectedValues.length} course{selectedValues.length !== 1 ? 's' : ''} selected
                </span>
                <span className="text-[10px] text-[#64748B] truncate">
                  {selectedNames.join(', ')}
                </span>
              </>
            ) : (
              <span className="text-[#94A3B8]">Select courses</span>
            )
          ) : selectedCourse ? (
            <>
              <span className="font-semibold text-[#1E293B] truncate">{selectedCourse.name}</span>
              {selectedCourse.path.length > 1 && (
                <span className="text-[10px] text-[#64748B] truncate">
                  {selectedCourse.path.slice(0, -1).join(' \u203A ')}
                </span>
              )}
            </>
          ) : (
            <span className="text-[#94A3B8]">Select a {displayLabel}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8] flex-shrink-0">
          {selectedValues.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (multiple && onMultiChange) onMultiChange([]);
                else if (!multiple && onChange) onChange('');
              }}
              className="p-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-[#2137D6]' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 flex flex-col animate-in fade-in duration-200 max-h-[min(80vh,600px)] overflow-hidden">
          {searchBar}

          <div className="p-2 overflow-y-auto min-h-0 flex-1 custom-scrollbar">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2137D6]" />
                Loading structure...
              </div>
            ) : (
              treeContent
            )}
          </div>
        </div>
      )}

      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
