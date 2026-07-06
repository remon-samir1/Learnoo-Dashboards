import React, { useState, useRef, useEffect, forwardRef } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Award,
  MapPin,
  Folder,
  BookOpen,
  FileVideo,
  FileText,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  GraduationCap,
  Copy,
  ArrowRightLeft,
} from "lucide-react";
import type { TreeNode } from "./useMillerState";

interface ColumnItemProps {
  item: TreeNode;
  isSelected: boolean;
  searchQuery: string;
  onSelect: () => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAdd: (type: TreeNode["type"], parentId: string, subType?: string) => void;
  onCopyMove?: (node: TreeNode, mode: "copy" | "move") => void;
  isInstructor: boolean;
}

function escapeRegExp(val: string) {
  return val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, search: string) {
  if (!search.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${escapeRegExp(search)})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 font-medium px-0.5 rounded-sm"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function getNodeIcon(type: TreeNode["type"]) {
  switch (type) {
    case "university":
      return <Building2 className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />;
    case "faculty":
      return <Award className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />;
    case "center":
      return <MapPin className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />;
    case "department":
      return <Folder className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
    case "course":
      return <BookOpen className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
    case "lecture":
      return <FileVideo className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />;
    case "chapter":
      return <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />;
    case "note":
      return <FileText className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
    default:
      return <Folder className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />;
  }
}

// Small icon button used for all inline actions - note: may receive ref from parent
const ActionBtn = forwardRef<HTMLButtonElement, {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}>(({ onClick, title, className = "", children }, ref) => {
  return (
    <button
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onClick(e); }}
      title={title}
      className={`p-1 rounded transition-colors ${className}`}
    >
      {children}
    </button>
  );
});
ActionBtn.displayName = "ActionBtn";

export function ColumnItem({
  item,
  isSelected,
  searchQuery,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
  onCopyMove,
  isInstructor,
}: ColumnItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const openDropdown = () => {
    if (addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      const menuWidth = 176; // w-44
      setDropdownPos({
        top: rect.bottom + 4,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      });
    }
    setAddDropdownOpen((prev) => !prev);
  };

  // Close on scroll/resize/outside click so it doesn't float stale
  useEffect(() => {
    if (!addDropdownOpen) return;

    const close = () => setAddDropdownOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [addDropdownOpen]);

  // ── Add buttons ────────────────────────────────────────────────────────────
  const renderAddButtons = () => {
    if (isInstructor) return null;
    switch (item.type) {
      case "university":
        return (
          <>
            <ActionBtn onClick={() => onAdd("center", item.id)} title="Add Center" className="text-teal-500 hover:bg-teal-50">
              <MapPin className="w-3 h-3" />
            </ActionBtn>
            <ActionBtn onClick={() => onAdd("faculty", item.id)} title="Add Faculty" className="text-pink-500 hover:bg-pink-50">
              <Award className="w-3 h-3" />
            </ActionBtn>
          </>
        );
      case "center":
        return (
          <ActionBtn onClick={() => onAdd("faculty", item.id)} title="Add Faculty" className="text-pink-500 hover:bg-pink-50">
            <Award className="w-3 h-3" />
          </ActionBtn>
        );
      case "faculty":
        return (
          <ActionBtn onClick={() => onAdd("department", item.id)} title="Add Department" className="text-blue-500 hover:bg-blue-50">
            <GraduationCap className="w-3 h-3" />
          </ActionBtn>
        );
      case "department":
        return (
          <>
            <ActionBtn onClick={() => onAdd("department", item.id)} title="Add Sub-Department" className="text-blue-400 hover:bg-blue-50">
              <GraduationCap className="w-3 h-3" />
            </ActionBtn>
            <ActionBtn onClick={() => onAdd("course", item.id)} title="Add Course" className="text-amber-500 hover:bg-amber-50">
              <BookOpen className="w-3 h-3" />
            </ActionBtn>
          </>
        );
      case "course":
        return (
          <>
            <ActionBtn onClick={() => onAdd("lecture", item.id)} title="Add Lecture" className="text-purple-500 hover:bg-purple-50">
              <Plus className="w-3 h-3" />
            </ActionBtn>
            <ActionBtn onClick={() => onAdd("note", item.id)} title="Add Note" className="text-slate-500 hover:bg-slate-50">
              <FileText className="w-3 h-3" />
            </ActionBtn>
          </>
        );
      case "lecture":
        return (
          <div className="relative">
            <ActionBtn
              ref={addButtonRef}
              onClick={() => openDropdown()}
              title="Add Lesson"
              className={addDropdownOpen ? "text-orange-600 bg-orange-100" : "text-orange-400 hover:bg-orange-50"}
            >
              <Plus className="w-3 h-3" />
            </ActionBtn>
            {addDropdownOpen &&
              dropdownPos &&
              createPortal(
                <>
                  {/* invisible overlay to catch outside clicks */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAddDropdownOpen(false)}
                  />
                  <div
                    className="fixed w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50"
                    style={{ top: dropdownPos.top, left: dropdownPos.left }}
                  >
                    {[
                      { label: "Video and PDF", subType: "video-pdf" },
                      { label: "Video Only", subType: "video" },
                      { label: "PDF Only", subType: "pdf" },
                      { label: "Rich Text", subType: "rich-text" },
                    ].map(({ label, subType }) => (
                      <button
                        key={subType}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdd("chapter", item.id, subType);
                          setAddDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
                      >
                        <Plus className="w-3 h-3" /> {label}
                      </button>
                    ))}
                  </div>
                </>,
                document.body
              )}
          </div>
        );
      default:
        return null;
    }
  };

  // ── Copy/Move for chapters ─────────────────────────────────────────────────
  const renderCopyMove = () => {
    if (item.type !== "chapter" || !onCopyMove || isInstructor) return null;
    return (
      <>
        <ActionBtn onClick={() => onCopyMove(item, "copy")} title="Copy" className="text-blue-400 hover:bg-blue-50">
          <Copy className="w-3 h-3" />
        </ActionBtn>
        <ActionBtn onClick={() => onCopyMove(item, "move")} title="Move" className="text-purple-400 hover:bg-purple-50">
          <ArrowRightLeft className="w-3 h-3" />
        </ActionBtn>
      </>
    );
  };

  return (
    <div
      onClick={onSelect}
      className={`relative flex flex-col gap-1 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer border-l-2 select-none ${
        isSelected
          ? "bg-blue-50/70 border-blue-500 text-blue-700"
          : "border-transparent hover:bg-slate-50 text-slate-700"
      }`}
    >
      {/* Row 1: icon + name + chevron */}
      <div className="flex items-center gap-1.5 min-w-0">
        {getNodeIcon(item.type)}
        <span className="truncate text-[11px] font-medium flex-1 leading-snug">
          {highlightText(item.name, searchQuery)}
        </span>
        {/* Status dot for courses */}
        {item.type === "course" && item.meta?.status && (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.meta.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
            title={item.meta.status}
          />
        )}
        {hasChildren && <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />}
      </div>

      {/* Row 2: action buttons — always visible */}
      <div className="flex items-center gap-0.5">
        {renderAddButtons()}
        {renderCopyMove()}

        {/* Edit */}
        <ActionBtn onClick={() => onEdit(item)} title="Edit" className="text-gray-400 hover:text-orange-600 hover:bg-orange-50">
          <Edit className="w-3 h-3" />
        </ActionBtn>

        {/* Delete */}
        {!isInstructor && (
          <ActionBtn onClick={() => onDelete(item)} title="Delete" className="text-gray-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="w-3 h-3" />
          </ActionBtn>
        )}
      </div>
    </div>
  );
}
