'use client';

<<<<<<< HEAD
import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, ChevronDown, ChevronRight, FolderOpen, BookOpen } from 'lucide-react';
=======
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Loader2, ChevronDown } from 'lucide-react';
>>>>>>> origin/master
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCreateLibrary } from '@/src/hooks/useLibraries';
import { useCourses } from '@/src/hooks/useCourses';
<<<<<<< HEAD
import { useCurrentUser } from '@/src/hooks/useAuth';
import { useUniversities } from '@/src/hooks/useUniversities';
import { useCenters } from '@/src/hooks/useCenters';
import { useFaculties } from '@/src/hooks/useFaculties';
import { useDepartments } from '@/src/hooks/useDepartments';
import type { University, Faculty, Center, Department, Course } from '@/src/types';

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

// Build simplified tree structure for courses (same logic as departments page)
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

  // Create university nodes
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

  // Create faculty nodes
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

  // Create center nodes and process their childrens (departments or faculties)
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

    // Process center's childrens (departments or faculties) if available
    if (center.childrens && Array.isArray(center.childrens)) {
      // First pass: create all faculty nodes and add to center
      center.childrens.forEach((child) => {
        const childType = child.type || "department";

        if (childType === "faculty") {
          const facultyNode: TreeNode = {
            id: `faculty-${child.id}`,
            type: "faculty",
            name: child.attributes.name,
            data: {
              id: child.id,
              type: "faculty",
              attributes: child.attributes,
            } as Faculty,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };

          facultyMap.set(child.id, facultyNode);
          centerNode.children.push(facultyNode);
        }
      });

      // Second pass: create department nodes and assign to correct parent
      center.childrens.forEach((child) => {
        const childType = child.type || "department";

        if (childType !== "faculty") {
          const deptNode: TreeNode = {
            id: `dept-${child.id}`,
            type: "department",
            name: child.attributes.name,
            data: {
              id: child.id,
              type: "department",
              attributes: child.attributes,
            } as Department,
            children: [],
            level: centerNode.level + 1,
            parentId: centerNode.id,
          };

          // Check if department has a faculty parent and nest it there
          const parentFacultyId = (child.attributes as any).parent?.data?.id;

          if (parentFacultyId && facultyMap.has(String(parentFacultyId))) {
            const parentFaculty = facultyMap.get(String(parentFacultyId))!;
            deptNode.level = parentFaculty.level + 1;
            deptNode.parentId = parentFaculty.id;
            parentFaculty.children.push(deptNode);
          } else {
            // No faculty parent, add to center
            centerNode.children.push(deptNode);
          }

          // Store with direct ID only
          departmentMap.set(child.id, deptNode);
        }
      });
    }
  });

  // Create department nodes (for departments not in center.childrens)
  departments.forEach((dept) => {
    // Skip if already created from center.childrens
    if (departmentMap.has(dept.id)) return;

    const deptNode: TreeNode = {
      id: `dept-${dept.id}`,
      type: 'department',
      name: dept.attributes.name,
      data: dept,
      children: [],
      level: 0,
    };
    // Store with direct ID only
    departmentMap.set(dept.id, deptNode);
  });

  // Create course nodes
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

  // Build strict hierarchy: Universities -> Centers -> Faculties -> Departments -> Sub-departments -> Courses
  const rootNodes: TreeNode[] = [];

  // Add universities as root nodes (level 0)
  universityMap.forEach((univ) => {
    rootNodes.push(univ);
  });

  // Build center hierarchy under universities (level 1), with fallback to root
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

  // Link faculties to universities (for faculties not in center.childrens)
  facultyMap.forEach((faculty) => {
    // Skip if already has a parent (from center.childrens)
    if (faculty.parentId) return;

    const parentId = (faculty.data as Faculty).attributes.parent?.data?.id;
    if (parentId && universityMap.has(parentId)) {
      universityMap.get(parentId)!.children.push(faculty);
      faculty.level = 1;
    }
  });

  // Link departments to faculties or centers or other departments (for departments not in center.childrens)
  const processedDeptIds = new Set<string>();
  departmentMap.forEach((dept) => {
    // Skip if already processed (to handle duplicate keys in map)
    if (processedDeptIds.has(dept.id)) return;
    processedDeptIds.add(dept.id);

    // Skip if already has a parent (from center.childrens)
    if (dept.parentId) return;

    const parentId = (dept.data as Department).attributes.parent?.data?.id;
    const centerId = (dept.data as Department).attributes.center_id;

    // First check if parent is a faculty
    if (parentId && facultyMap.has(parentId)) {
      facultyMap.get(parentId)!.children.push(dept);
      dept.level = 2;
      dept.parentId = facultyMap.get(parentId)!.id;
    }
    // Then check if parent is a center
    else if (centerId) {
      // Try both direct ID and center- prefixed ID
      let centerNode = centerMap.get(String(centerId));
      if (!centerNode) {
        centerNode = centerMap.get(`center-${centerId}`);
      }
      if (centerNode) {
        centerNode.children.push(dept);
        dept.level = 2;
        dept.parentId = centerNode.id;
      }
    }
    // Then check if parent is another department (sub-department)
    else if (parentId) {
      // Try both direct ID and dept- prefixed ID
      let parentDept = departmentMap.get(parentId);
      if (!parentDept) {
        parentDept = departmentMap.get(`dept-${parentId}`);
      }
      // Try iterating through all departments to find a match
      if (!parentDept) {
        for (const [key, dept] of departmentMap) {
          if (key === parentId || key === `dept-${parentId}` || dept.id === parentId || dept.id === `dept-${parentId}`) {
            parentDept = dept;
            break;
          }
        }
      }
      if (parentDept) {
        parentDept.children.push(dept);
        dept.level = parentDept.level + 1;
        dept.parentId = parentDept.id;
      }
    }
    else {
      // Department without a valid parent, add to root to ensure courses can appear under it
      dept.level = 1;
      rootNodes.push(dept);
    }
  });

  // Link courses to departments (same logic as departments page)
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

// Simplified Tree Item Component for course selection
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
      case 'university':
        return <FolderOpen className="w-4 h-4 text-blue-500" />;
      case 'faculty':
        return <FolderOpen className="w-4 h-4 text-purple-500" />;
      case 'center':
        return <FolderOpen className="w-4 h-4 text-green-500" />;
      case 'department':
        return <FolderOpen className="w-4 h-4 text-orange-500" />;
      case 'course':
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
      default:
        return <FolderOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
          isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
        }`}
        style={{ 
          paddingLeft: `${node.level * 24 + 12}px`,
        }}
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
=======
>>>>>>> origin/master

export default function AddLibraryItemPage() {
  const t = useTranslations();
  const router = useRouter();
  const { mutate: createLibrary, isLoading, progress } = useCreateLibrary();
  const { data: courses, isLoading: isLoadingCourses } = useCourses();
<<<<<<< HEAD
  const { canUseActivations } = useCurrentUser();
  
  // Tree data hooks
  const { data: universities } = useUniversities();
  const { data: faculties } = useFaculties();
  const { data: centers } = useCenters();
  const { data: departments } = useDepartments();
=======
>>>>>>> origin/master

function getPreviewUrl(path: string | null): string {
  if (!path) return '';
  // blob: URLs are for local previews, return as-is
  if (path.startsWith('blob:')) return path;
  // API returns full URLs, return as-is
  return path;
}


  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [materialType, setMaterialType] = useState('booklet');
  const [codeActivation, setCodeActivation] = useState(false);
  const [isPublish, setIsPublish] = useState(false);
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

<<<<<<< HEAD
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
      setCourseId(courseId);
    }
  };

  // Helper to find parent node IDs for selected course
  const findParentIdsForCourse = (nodes: TreeNode[], selectedId: string): Set<string> => {
    const parentIds = new Set<string>();
    const selectedCourseId = `course-${selectedId}`;

    const findParents = (node: TreeNode) => {
      if (node.id === selectedCourseId) {
        // Found the course, add all parents to the set
        let current = node;
        while (current.parentId) {
          parentIds.add(current.parentId);
          const parentNode = nodes.find(n => n.id === current.parentId || 
            findNodeInChildren(n, current.parentId!));
          if (parentNode) {
            current = parentNode;
          } else {
            break;
          }
        }
        return true;
      }
      
      if (node.children.length > 0) {
        for (const child of node.children) {
          if (findParents(child)) {
            return true;
          }
        }
      }
      return false;
    };

    const findNodeInChildren = (node: TreeNode, targetId: string): TreeNode | null => {
      if (node.id === targetId) return node;
      for (const child of node.children) {
        const found = findNodeInChildren(child, targetId);
        if (found) return found;
      }
      return null;
    };

    for (const node of nodes) {
      if (findParents(node)) {
        break;
      }
    }

    return parentIds;
  };

=======
>>>>>>> origin/master
  const MATERIAL_TYPES = [
    { value: 'booklet', label: t('electronicLibrary.filters.booklet') },
    { value: 'reference', label: t('electronicLibrary.filters.reference') },
    { value: 'guide', label: t('electronicLibrary.filters.guide') }
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('electronicLibrary.add.fields.titleRequired');
    if (!description.trim()) newErrors.description = t('electronicLibrary.add.fields.descriptionRequired');
    if (!courseId) newErrors.courseId = t('electronicLibrary.add.fields.courseRequired');
    if (!price.trim() || isNaN(parseFloat(price))) newErrors.price = t('electronicLibrary.add.fields.priceRequired');
    if (!coverImage) newErrors.coverImage = t('electronicLibrary.add.fields.coverImageRequired');
    if (attachments.length === 0) newErrors.attachment = t('electronicLibrary.add.fields.attachmentRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachments([file]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createLibrary({
        cover_image: coverImage!,
        title: title.trim(),
        description: description.trim(),
        attachment: attachments[0],
        course_id: parseInt(courseId),
        material_type: materialType as any,
        code_activation: codeActivation,
        is_publish: isPublish,
        price: parseFloat(price)
      });
      router.push('/electronic-library');
    } catch {
      // Error handled by hook
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/electronic-library"
          className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{t('electronicLibrary.add.pageTitle')}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{t('electronicLibrary.add.pageDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Item Details Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.add.sections.itemDetails')}</h2>
          
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.title')} <span className="text-[#EF4444]">*</span></label>
            <input 
              type="text" 
              placeholder={t('electronicLibrary.add.fields.titlePlaceholder')}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] ${errors.title ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-[#EF4444]">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.description')} <span className="text-[#EF4444]">*</span></label>
            <textarea 
              placeholder={t('electronicLibrary.add.fields.descriptionPlaceholder')}
              rows={4}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] resize-none ${errors.description ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && <p className="text-xs text-[#EF4444]">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course */}
<<<<<<< HEAD
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.course')} <span className="text-[#EF4444]">*</span></label>
              <div className={`border rounded-xl max-h-64 overflow-y-auto ${errors.courseId ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}>
                {courseTree.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Loading courses...</div>
                ) : (
                  <div className="py-2">
                    {courseTree.map((node) => (
                      <CourseTreeItem
                        key={node.id}
                        node={node}
                        expanded={courseTreeExpanded}
                        onToggle={handleCourseTreeToggle}
                        onSelect={handleCourseTreeSelect}
                        selectedCourseId={courseId}
                      />
                    ))}
                  </div>
                )}
              </div>
              {errors.courseId && <p className="text-xs text-[#EF4444]">{errors.courseId}</p>}
              {courseId && (
                <div className="mt-2 p-2 bg-[#EEF2FF] rounded-lg border border-[#2137D6]/20">
                  <p className="text-xs text-[#2137D6]">
                    Selected: {courses?.find(c => c.id === courseId)?.attributes.title || `Course ${courseId}`}
                  </p>
                </div>
              )}
=======
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.course')} <span className="text-[#EF4444]">*</span></label>
              <div className="relative">
                <select 
                  className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all appearance-none cursor-pointer ${errors.courseId ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={isLoadingCourses}
                >
                  <option value="">{t('electronicLibrary.add.fields.selectCourse')}</option>
                  {courses?.map((course) => (
                    <option key={course.id} value={course.id}>{course.attributes.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
              {errors.courseId && <p className="text-xs text-[#EF4444]">{errors.courseId}</p>}
>>>>>>> origin/master
            </div>

            {/* Material Type */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.materialType')}</label>
              <div className="relative">
                <select 
                  className="w-full px-4 py-3 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all appearance-none cursor-pointer"
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                >
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.price')} <span className="text-[#EF4444]">*</span></label>
            <input 
              type="number" 
              step="0.01"
              placeholder={t('electronicLibrary.add.fields.pricePlaceholder')}
              className={`w-full px-4 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2137D6] transition-all placeholder:text-[#94A3B8] ${errors.price ? 'border-[#EF4444]' : 'border-[#E2E8F0]'}`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="text-xs text-[#EF4444]">{errors.price}</p>}
          </div>
        </section>

        {/* Cover Image Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.add.sections.coverImage')}</h2>
          <div className="flex flex-col gap-4">
            {/* Preview */}
            {coverImagePreview && (
              <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#F8FAFC]">
                <img 
                  src={getPreviewUrl(coverImagePreview)} 
                  alt="Cover preview" 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImage(null);
                    setCoverImagePreview('');
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] transition-all"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Upload Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.uploadCoverImage')}</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleCoverImageChange}
                  className="hidden"
                  id="coverImageUpload"
                />
                <label 
                  htmlFor="coverImageUpload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                >
                  {coverImage ? coverImage.name : t('electronicLibrary.add.fields.clickToUploadImage')}
                </label>
              </div>
              {errors.coverImage && <p className="text-xs text-[#EF4444]">{errors.coverImage}</p>}
              <p className="text-xs text-[#94A3B8]">{t('electronicLibrary.add.fields.supportedFormats')}</p>
            </div>
          </div>
        </section>

        {/* Attachment Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.add.sections.attachment')}</h2>
          <div className="flex flex-col gap-4">
            {/* Selected File Display */}
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1E293B] truncate">{file.name}</p>
                  <p className="text-xs text-[#94A3B8]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="p-1.5 hover:bg-red-50 text-[#64748B] hover:text-[#EF4444] rounded-lg transition-all"
                >
                  ×
                </button>
              </div>
            ))}
            
            {/* Upload Input */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-[#475569]">{t('electronicLibrary.add.fields.uploadFile')}</label>
              <div className="relative">
                <input 
                  type="file" 
                  onChange={handleAttachmentChange}
                  className="hidden"
                  id="attachmentUpload"
                />
                <label 
                  htmlFor="attachmentUpload"
                  className="flex items-center justify-center w-full px-4 py-3 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-sm text-[#64748B] hover:bg-[#F1F5F9] hover:border-[#94A3B8] transition-all cursor-pointer"
                >
                  {attachments.length > 0 ? t('electronicLibrary.add.fields.changeFile') : t('electronicLibrary.add.fields.clickToUploadFile')}
                </label>
              </div>
              {errors.attachment && <p className="text-xs text-[#EF4444]">{errors.attachment}</p>}
              <p className="text-xs text-[#94A3B8]">{t('electronicLibrary.add.fields.fileTypes')}</p>
            </div>
          </div>
        </section>

        {/* Settings Section */}
        <section className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden p-6 flex flex-col gap-6">
          <h2 className="text-base font-bold text-[#1E293B]">{t('electronicLibrary.add.sections.settings')}</h2>
          
          {/* Code Activation */}
<<<<<<< HEAD
          {canUseActivations && (
=======
>>>>>>> origin/master
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">{t('electronicLibrary.add.settings.codeActivation')}</span>
              <span className="text-[13px] text-[#64748B]">{t('electronicLibrary.add.settings.codeActivationDescription')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
<<<<<<< HEAD
              <input
                type="checkbox"
=======
              <input 
                type="checkbox" 
>>>>>>> origin/master
                className="sr-only peer"
                checked={codeActivation}
                onChange={(e) => setCodeActivation(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            </label>
          </div>
<<<<<<< HEAD
          )}
=======
>>>>>>> origin/master

          {/* Publish Status */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[14px] font-bold text-[#1E293B]">{t('electronicLibrary.add.settings.publishItem')}</span>
              <span className="text-[13px] text-[#64748B]">{t('electronicLibrary.add.settings.publishItemDescription')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isPublish}
                onChange={(e) => setIsPublish(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#E2E8F0] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2137D6]"></div>
            </label>
          </div>
        </section>

        {/* Upload Progress */}
        {isLoading && progress > 0 && (
          <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#1E293B]">{t('electronicLibrary.uploading')}</span>
              <span className="text-sm font-bold text-[#2137D6]">{progress}%</span>
            </div>
            <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#2137D6] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-2">
          <button 
            type="button"
            onClick={() => router.push('/electronic-library')}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#64748B] hover:bg-[#F8FAFC] transition-all"
          >
            {t('electronicLibrary.add.buttons.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('electronicLibrary.add.buttons.adding')}
              </>
            ) : (
              t('electronicLibrary.add.buttons.addToLibrary')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
