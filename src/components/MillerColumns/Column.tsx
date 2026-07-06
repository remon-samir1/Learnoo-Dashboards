import React from "react";
import { ColumnItem } from "./ColumnItem";
import type { TreeNode } from "./useMillerState";

interface ColumnProps {
  title: string;
  items: TreeNode[];
  selectedId: string | null;
  searchQuery: string;
  onSelectItem: (item: TreeNode) => void;
  onEditItem: (node: TreeNode) => void;
  onDeleteItem: (node: TreeNode) => void;
  onAddItem: (type: TreeNode["type"], parentId: string, subType?: string) => void;
  onCopyMove?: (node: TreeNode, mode: "copy" | "move") => void;
  isInstructor: boolean;
}

export function Column({
  title,
  items,
  selectedId,
  searchQuery,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onAddItem,
  onCopyMove,
  isInstructor,
}: ColumnProps) {
  return (
    <div className="flex-shrink-0 w-[240px] bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden max-h-[calc(100vh-220px)] shadow-xs">
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b border-gray-150 flex-shrink-0">
        <span className="text-xs font-bold text-gray-800 tracking-wide truncate max-w-[150px]" title={title}>
          {title}
        </span>
        <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      {/* Column Items */}
      <div className="flex-grow overflow-y-auto p-2 space-y-0.5 scrollbar-thin">
        {items.map((item) => (
          <ColumnItem
            key={item.id}
            item={item}
            isSelected={selectedId === item.id}
            searchQuery={searchQuery}
            onSelect={() => onSelectItem(item)}
            onEdit={onEditItem}
            onDelete={onDeleteItem}
            onAdd={onAddItem}
            onCopyMove={onCopyMove}
            isInstructor={isInstructor}
          />
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
            <p className="text-xs text-gray-400 italic">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
