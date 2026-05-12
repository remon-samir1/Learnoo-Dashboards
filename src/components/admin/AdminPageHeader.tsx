'use client';

import React from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface AdminPageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  backHref?: string;
  onAction?: () => void;
}

export function AdminPageHeader({
  title,
  description,
  actionLabel,
  actionHref,
  backHref,
  onAction,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#1E293B] hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">{title}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{description}</p>
        </div>
      </div>
      {(actionHref || onAction) && actionLabel && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2137D6] hover:bg-[#1a2bb3] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
