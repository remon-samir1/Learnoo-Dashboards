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
  Check, 
  X,
  Loader2
} from 'lucide-react';
import { useUniversities } from '@/src/hooks/useUniversities';
import { useCenters } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { useDepartments } from '@/src/hooks/useDepartments';
import { useCourses } from '@/src/hooks/useCourses';

interface CourseTreeSelectProps {
  value: string | number;
  onChange: (value: string) => void;
  required?: boolean;
  label?: string;
  error?: string;
}

interface TreeNode {
  id: string; // e.g. univ-1, center-2, course-3
  type: 'university' | 'center' | 'faculty' | 'department' | 'course';
  name: string;
  children: TreeNode[];
  level: number;
  originalId: string;
  path: string[];
}

export function CourseTreeSelect({
  value,
  onChange,
  required = false,
  label = 'Course',
  error,
}: CourseTreeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all structural data
  const { data: universitiesData, isLoading: isLoadingUnivs } = useUniversities();
  const { data: centersData, isLoading: isLoadingCenters } = useCenters();
  const { data: facultiesData, isLoading: isLoadingFacs } = useFaculties();
  const { data: departmentsData, isLoading: isLoadingDepts } = useDepartments();
  const { data: coursesData, isLoading: isLoadingCourses } = useCourses();

  const universities = useMemo(() => universitiesData ?? [], [universitiesData]);
  const centers = useMemo(() => centersData ?? [], [centersData]);
  const faculties = useMemo(() => facultiesData ?? [], [facultiesData]);
  const departments = useMemo(() => departmentsData ?? [], [departmentsData]);
  const courses = useMemo(() => coursesData ?? [], [coursesData]);

  const isLoading = isLoadingUnivs || isLoadingCenters || isLoadingFacs || isLoadingDepts || isLoadingCourses;

  // Build the hierarchical tree
  const { tree, flatCourses } = useMemo(() => {
    // Only return empty if everything is still loading. 
    // If some succeeded and others failed (null), we still try to build what we have.
    if (isLoading && !universities.length && !centers.length && !faculties.length && !departments.length && !courses.length) {
      return { tree: [], flatCourses: new Map<string, TreeNode>() };
    }

    const universityMap = new Map<string, TreeNode>();
    const centerMap = new Map<string, TreeNode>();
    const facultyMap = new Map<string, TreeNode>();
    const departmentMap = new Map<string, TreeNode>();
    const courseMap = new Map<string, TreeNode>();

    // 1. Universities
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

    // 2. Centers
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

    // 3. Faculties
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

    // 4. Departments
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

    // Nest Faculties under Centers
    faculties.forEach((fac: any) => {
      const node = facultyMap.get(String(fac.id));
      if (!node) return;

      const parentId = fac.attributes?.parent?.data?.id || fac.attributes?.center_id || fac.parent_id || fac.center_id;
      if (parentId && centerMap.has(String(parentId))) {
        const parentNode = centerMap.get(String(parentId))!;
        node.level = parentNode.level + 1;
        node.path = [...parentNode.path, node.name];
        parentNode.children.push(node);
      }
    });

    // Nest Departments under Faculties or Centers or other Departments
    departments.forEach((dept: any) => {
      const node = departmentMap.get(String(dept.id));
      if (!node) return;

      const parentId = dept.attributes?.parent?.data?.id || dept.attributes?.faculty_id || dept.parent_id || dept.faculty_id;
      
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

    // Nest Centers under Universities
    centers.forEach((center: any) => {
      const node = centerMap.get(String(center.id));
      if (!node) return;

      const parentId = center.attributes?.parent?.data?.id || center.parent?.data?.id || center.parent_id || center.university_id || center.attributes?.university_id;
      if (parentId && universityMap.has(String(parentId))) {
        const parentNode = universityMap.get(String(parentId))!;
        node.level = parentNode.level + 1;
        node.path = [...parentNode.path, node.name];
        parentNode.children.push(node);
      }
    });

    // Build Courses
    courses.forEach((course: any) => {
      const deptId = 
        course.attributes?.category?.data?.id ||
        course.attributes?.department?.data?.id ||
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

    // Collect Root Nodes (Universities and Centers/Faculties/Departments that have no parents)
    const rootNodes: TreeNode[] = [];
    
    universityMap.forEach(node => {
      rootNodes.push(node);
    });

    centerMap.forEach((node, id) => {
      const center = centers.find((c: any) => String(c.id) === id);
      const parentId = (center as any)?.attributes?.parent?.data?.id || center?.parent?.data?.id || center?.parent_id || (center as any)?.university_id;
      if (!parentId || !universityMap.has(String(parentId))) {
        rootNodes.push(node);
      }
    });

    facultyMap.forEach((node, id) => {
      const fac = faculties.find((f: any) => String(f.id) === id);
      const parentId = fac?.attributes?.parent?.data?.id || (fac?.attributes as any)?.center_id || (fac as any)?.parent_id || (fac as any)?.center_id;
      if (!parentId || !centerMap.has(String(parentId))) {
        rootNodes.push(node);
      }
    });

    departmentMap.forEach((node, id) => {
      const dept = departments.find((d: any) => String(d.id) === id);
      const parentId = dept?.attributes?.parent?.data?.id || (dept?.attributes as any)?.faculty_id || (dept as any)?.parent_id || (dept as any)?.faculty_id;
      if (!parentId || (!facultyMap.has(String(parentId)) && !departmentMap.has(String(parentId)) && !centerMap.has(String(parentId)))) {
        rootNodes.push(node);
      }
    });

    // Fallback: If any course was not placed, add it as a root-level course
    courseMap.forEach((node) => {
      const course = courses.find((c: any) => String(c.id) === node.originalId);
      const deptId = course?.attributes?.category?.data?.id || course?.attributes?.department?.data?.id || course?.attributes?.category_id?.toString() || (course as any)?.category_id?.toString();
      if (!deptId || (!departmentMap.has(String(deptId)) && !facultyMap.has(String(deptId)))) {
        rootNodes.push(node);
      }
    });

    // Deep copy and clean up empty structural branches (branches that don't lead to any courses)
    const cleanTree = (nodes: TreeNode[]): TreeNode[] => {
      return nodes
        .map(node => {
          const cleanedChildren = cleanTree(node.children);
          return {
            ...node,
            children: cleanedChildren
          };
        })
        .filter(node => {
          // Keep it if it is a course, or if it has children with courses
          if (node.type === 'course') return true;
          return node.children.length > 0;
        });
    };

    return {
      tree: cleanTree(rootNodes),
      flatCourses: courseMap,
    };
  }, [isLoading, universities, centers, faculties, departments, courses]);

  // Handle auto-expansion when searching
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

  // Expand parent paths for matching searched nodes
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
          filtered.push({
            ...node,
            children: childFiltered,
          });
          treeHasMatch = true;
        }
      });

      return { filtered, hasMatch: treeHasMatch };
    };

    return filterNodes(tree).filtered;
  }, [searchQuery, tree]);

  // Selected Course details
  const selectedCourse = useMemo(() => {
    return flatCourses.get(String(value));
  }, [value, flatCourses]);

  // Toggle node expansion
  const toggleNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCourse = (courseNode: TreeNode) => {
    onChange(courseNode.originalId);
    setIsOpen(false);
  };

  // Rendering individual tree items recursively
  const renderTreeItem = (node: TreeNode) => {
    const isExpanded = !!expandedNodes[node.id];
    const isCourse = node.type === 'course';
    const isSelected = isCourse && String(value) === node.originalId;
    const hasChildren = node.children && node.children.length > 0;

    const getNodeIcon = () => {
      switch (node.type) {
        case 'university': return <School className="w-4 h-4 text-slate-500" />;
        case 'center': return <MapPin className="w-4 h-4 text-emerald-500" />;
        case 'faculty': return <GraduationCap className="w-4 h-4 text-indigo-500" />;
        case 'department': return <Folder className="w-4 h-4 text-amber-500" />;
        case 'course': return <BookOpen className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />;
      }
    };

    return (
      <div key={node.id} className="flex flex-col select-none">
        <div 
          onClick={(e) => {
            if (isCourse) {
              handleSelectCourse(node);
            } else {
              toggleNode(node.id, e);
            }
          }}
          style={{ paddingLeft: `${Math.max(node.level * 16, 8)}px` }}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-all cursor-pointer ${
            isSelected 
              ? 'bg-[#2137D6] text-white font-semibold' 
              : isCourse 
                ? 'hover:bg-slate-50 text-[#1E293B] font-medium' 
                : 'hover:bg-slate-50 text-[#64748B]'
          }`}
        >
          {/* Chevron for nesting */}
          {!isCourse && hasChildren ? (
            <span 
              onClick={(e) => toggleNode(node.id, e)} 
              className="p-1 rounded hover:bg-slate-200/50 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : !isCourse ? (
            <span className="w-5.5" />
          ) : null}

          {getNodeIcon()}
          
          <span className="truncate flex-1">{node.name}</span>
          
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>

        {hasChildren && isExpanded && (
          <div className="flex flex-col mt-0.5 border-l border-slate-100 ml-3">
            {node.children.map(child => renderTreeItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2 relative w-full md:col-span-2">
      <label className="text-[13px] font-bold text-[#475569]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#F8FAFC] border rounded-xl text-sm focus:outline-none transition-all ${
          isOpen ? 'border-[#2137D6] ring-2 ring-[#2137D6] ring-opacity-10 shadow-sm' : 'border-[#E2E8F0]'
        } ${error ? 'border-red-500' : ''} disabled:opacity-50 text-left`}
      >
        <div className="flex flex-col gap-0.5 truncate flex-1 pr-4">
          {isLoading ? (
            <span className="text-slate-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#2137D6]" /> Loading structure...
            </span>
          ) : selectedCourse ? (
            <>
              <span className="font-semibold text-[#1E293B] truncate">{selectedCourse.name}</span>
              {selectedCourse.path.length > 1 && (
                <span className="text-[10px] text-[#64748B] truncate">
                  {selectedCourse.path.slice(0, -1).join(' › ')}
                </span>
              )}
            </>
          ) : (
            <span className="text-[#94A3B8]">Select a Course</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#94A3B8]">
          {selectedCourse && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 text-[#2137D6]' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-[#E2E8F0] rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[380px] animate-in fade-in duration-200">
          
          {/* Search box */}
          <div className="p-3 border-b border-[#F1F5F9] bg-[#F8FAFC]/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search courses or structural paths..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#1E293B] border-none focus:outline-none placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-slate-200 text-[#94A3B8]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tree list */}
          <div className="p-2 overflow-y-auto max-h-[300px] flex flex-col gap-1 custom-scrollbar">
            {filteredTree.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#64748B]">
                {searchQuery ? 'No matching courses found' : 'No courses available'}
              </div>
            ) : (
              filteredTree.map(node => renderTreeItem(node))
            )}
          </div>
        </div>
      )}

      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
}
