'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useDepartments, useDeleteDepartment } from '@/src/hooks/useDepartments';
import { GraduationCap, ChevronRight, ChevronDown, GitBranch, Edit2, Trash2, Users, BookOpen } from 'lucide-react';
import { AdminPageHeader } from '@/src/components/admin/AdminPageHeader';
import { DeleteModal } from '@/src/components/ui/DeleteModal';
import Link from 'next/link';
import type { Department } from '@/src/types';

// Tree node type with children
interface TreeNode extends Department {
  children: TreeNode[];
  level: number;
}

// Build tree structure from flat departments list
function buildDepartmentTree(departments: Department[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create nodes
  departments.forEach(dept => {
    nodeMap.set(dept.id, {
      ...dept,
      children: [],
      level: 0
    });
  });

  // Second pass: build hierarchy
  departments.forEach(dept => {
    const node = nodeMap.get(dept.id)!;
    const parentId = dept.attributes.parent?.data?.id;

    if (parentId && nodeMap.has(parentId)) {
      const parent = nodeMap.get(parentId)!;
      node.level = parent.level + 1;
      parent.children.push(node);
    } else {
      node.level = 0;
      roots.push(node);
    }
  });

  return roots;
}

// Filter tree based on search query
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();

  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchesNode = node.attributes.name.toLowerCase().includes(lowerQuery) ||
      (node.attributes.code?.toLowerCase() || '').includes(lowerQuery);

    const filteredChildren = filterTree(node.children, query);

    if (matchesNode || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: matchesNode ? node.children : filteredChildren
      });
    }

    return acc;
  }, []);
}

// Tree Item Component
interface TreeItemProps {
  node: TreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (dept: Department) => void;
}

function TreeItem({ node, expanded, onToggle, onDelete }: TreeItemProps) {
  const t = useTranslations();
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSubDepartment = node.level > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
          isSubDepartment
            ? 'bg-gray-50/80 border-gray-100 ml-8'
            : 'bg-white border-gray-200'
        }`}
        style={{ marginLeft: `${node.level * 32}px` }}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={() => hasChildren && onToggle(node.id)}
          className={`p-1 rounded-lg transition-colors ${
            hasChildren
              ? 'hover:bg-gray-100 text-gray-500'
              : 'text-transparent cursor-default'
          }`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4 h-4" />
          )}
        </button>

        {/* Department Image */}
        <div className={`rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 ${
          isSubDepartment ? 'w-8 h-8' : 'w-10 h-10'
        }`}>
          {node.attributes.image ? (
            <img
              src={node.attributes.image}
              alt={node.attributes.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <GraduationCap className={`text-gray-400 ${isSubDepartment ? 'w-4 h-4' : 'w-5 h-5'}`} />
          )}
        </div>

        {/* Department Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${isSubDepartment ? 'text-gray-700 text-sm' : 'text-gray-900'}`}>
              {node.attributes.name}
            </span>
            {isSubDepartment && (
              <>
                <GitBranch className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {t('departments.subDepartment')}
                </span>
              </>
            )}
          </div>
          {node.attributes.code && (
            <p className="text-xs text-gray-400">{node.attributes.code}</p>
          )}
        </div>

        {/* Parent Name (for sub-departments) */}
        {isSubDepartment && node.attributes.parent?.data && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <span className="text-gray-300">←</span>
            <span className="truncate max-w-[120px]">
              {node.attributes.parent.data.attributes.name}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-blue-600">
            <BookOpen className="w-3.5 h-3.5" />
            {node.attributes.stats?.courses || 0}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <Users className="w-3.5 h-3.5" />
            {node.attributes.stats?.students || 0}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href={`/departments/${node.id}/edit`}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title={t('departments.editDepartment')}
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            onClick={() => onDelete(node)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={t('departments.deleteTitle')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading, error, refetch } = useDepartments();
  const { mutate: deleteDepartment, isLoading: isDeleting } = useDeleteDepartment();

  // Build and filter tree
  const treeData = useMemo(() => {
    if (!departments) return [];
    const tree = buildDepartmentTree(departments);
    return filterTree(tree, searchQuery);
  }, [departments, searchQuery]);

  // Auto-expand when searching
  useMemo(() => {
    if (searchQuery.trim() && treeData.length > 0) {
      const allIds = new Set<string>();
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id);
          collectIds(node.children);
        });
      };
      collectIds(treeData);
      setExpanded(allIds);
    }
  }, [searchQuery, treeData]);

  const handleToggle = (id: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDepartment) return;

    try {
      await deleteDepartment(parseInt(selectedDepartment.id));
      setDeleteModalOpen(false);
      setSelectedDepartment(null);
      refetch();
    } catch {
      // Error handled by hook
    }
  };

  // Expand all / Collapse all
  const expandAll = () => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        collectIds(node.children);
      });
    };
    collectIds(treeData);
    setExpanded(allIds);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title={t('departments.pageTitle')}
          description={t('departments.pageDescription')}
          actionLabel={t('departments.addDepartment')}
          actionHref="/departments/add"
        />
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600">{t('departments.loadError')}: {error}</p>
          <button
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('departments.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <AdminPageHeader
        title={t('departments.pageTitle')}
        description={t('departments.pageDescription')}
        actionLabel={t('departments.addDepartment')}
        actionHref="/departments/add"
      />

      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder={t('departments.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('departments.tree.expandAll') || 'Expand All'}
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
          >
            {t('departments.tree.collapseAll') || 'Collapse All'}
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">{t('departments.loading') || 'Loading...'}</p>
            </div>
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-center">
              {searchQuery ? t('departments.noSearchResults') || 'No departments match your search' : t('departments.noDepartments')}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {treeData.map(node => (
              <TreeItem
                key={node.id}
                node={node}
                expanded={expanded}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-white border border-gray-200" />
          <span>{t('departments.tree.parentDepartment') || 'Parent Department'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
          <GitBranch className="w-3 h-3 text-gray-400" />
          <span>{t('departments.subDepartment')}</span>
        </div>
      </div>

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedDepartment(null);
        }}
        onConfirm={handleConfirmDelete}
        title={t('departments.deleteTitle')}
        itemName={selectedDepartment?.attributes.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
}
