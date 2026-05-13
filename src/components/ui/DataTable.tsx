'use client';

import React from 'react';
import { Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  loadingRows?: number;
  onDelete?: (item: T) => void;
  onEdit?: (item: T) => void;
  onView?: (item: T) => void;
  editHref?: (item: T) => string;
  viewHref?: (item: T) => string;
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  showActions?: boolean;
}

export function DataTableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                </th>
              ))}
              <th className="px-6 py-4 text-right">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {[...Array(rows)].map((_, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[#F8FAFC]/50">
                {[...Array(columns)].map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  loadingRows = 5,
  onDelete,
  onEdit,
  onView,
  editHref,
  viewHref,
  keyExtractor,
  emptyMessage = 'No items found',
  showActions = true,
}: DataTableProps<T>) {
  if (isLoading) {
    return <DataTableSkeleton rows={loadingRows} columns={columns.length} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm p-12 text-center">
        <p className="text-[#64748B]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F1F5F9] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-sm font-bold text-[#475569] uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {showActions && (
                <th className="px-6 py-4 text-right text-sm font-bold text-[#475569] uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-[#F8FAFC]/50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-[#1E293B]">
                    {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as string}
                  </td>
                ))}
                {showActions && (
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {viewHref && (
                        <Link
                          href={viewHref(item)}
                          className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-full transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      )}
                      {onView && !viewHref && (
                        <button
                          onClick={() => onView(item)}
                          className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-full transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {editHref && (
                        <Link
                          href={editHref(item)}
                          className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-full transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                      {onEdit && !editHref && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 text-[#64748B] hover:text-[#2137D6] hover:bg-blue-50 rounded-full transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 text-[#64748B] hover:text-[#EF4444] hover:bg-red-50 rounded-full transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const from = (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between">
      <p className="text-sm text-[#64748B]">
        Showing {from} to {to} of {totalItems} results
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-[#64748B]">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
