import React from "react";
import { ChevronRight } from "lucide-react";
import type { TreeNode } from "./useMillerState";
import { useTranslations } from "next-intl";

interface BreadcrumbProps {
  nodes: TreeNode[];
  onJump: (index: number | null) => void;
}

export function Breadcrumb({ nodes, onJump }: BreadcrumbProps) {
  const t = useTranslations("Breadcrumb");

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap">
      <button
        className="hover:text-blue-600 transition-colors"
        onClick={() => onJump(null)}
      >
        {t("ContentManager")}
      </button>
      {nodes.map((node, i) => (
        <React.Fragment key={node.id}>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            className="hover:text-blue-600 transition-colors"
            onClick={() => onJump(i)}
            style={{ fontWeight: i === nodes.length - 1 ? 500 : 400 }}
          >
            {node.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
