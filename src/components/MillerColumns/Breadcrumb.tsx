import React from "react";
import { ChevronRight } from "lucide-react";
import type { SelectionPath } from "./useMillerState";

interface BreadcrumbProps {
  path: SelectionPath;
  onJump: (level: keyof SelectionPath | null) => void;
}

function getName(item: any): string {
  if (!item) return "";
  if (item.attributes) {
    return item.attributes.name || item.attributes.title || "";
  }
  return item.name || item.title || "";
}

export function Breadcrumb({ path, onJump }: BreadcrumbProps) {
  const segments = Object.entries(path)
    .filter(([_, v]) => v != null)
    .map(([key, val]) => ({ key: key as keyof SelectionPath, label: getName(val) }));

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap">
      <button
        className="hover:text-blue-600 transition-colors"
        onClick={() => onJump(null)}
      >
        Content manager
      </button>
      {segments.map((seg, i) => (
        <React.Fragment key={seg.key}>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            className="hover:text-blue-600 transition-colors"
            onClick={() => onJump(seg.key)}
            style={{ fontWeight: i === segments.length - 1 ? 500 : 400 }}
          >
            {seg.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
