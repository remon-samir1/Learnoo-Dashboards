import React, { useRef, useEffect, useMemo } from "react";
import { useMillerState, type TreeNode } from "./useMillerState";
import { Breadcrumb } from "./Breadcrumb";
import { Column } from "./Column";
import { DetailPanel } from "./DetailPanel";

interface MillerColumnsProps {
  // Pre-built tree from the parent page (avoids id-mismatch rebuilding issues)
  treeData: TreeNode[];
  searchQuery: string;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onAdd: (type: TreeNode["type"], parentId: string, subType?: string) => void;
  onCopyMove: (node: TreeNode, mode: "copy" | "move") => void;
  openViewers: (node: TreeNode) => void;
  isInstructor: boolean;

  // Activation & Student States (passed down to DetailPanel)
  canUseActivations: boolean;
  codesLoading: boolean;
  selectedCode: string;
  setSelectedCode: (val: string) => void;
  selectedStudent: string;
  setSelectedStudent: (val: string) => void;
  studentSearch: string;
  setStudentSearch: (val: string) => void;
  students: any;
  activationTab: "code" | "preactivation";
  setActivationTab: (val: "code" | "preactivation") => void;
  preactivationNumbers: string[];
  setPreactivationNumbers: (val: string[]) => void;
  copiedCode: string | null;
  preactivationResults: any;
  preactivationFileRef: React.RefObject<HTMLInputElement | null>;
  isActivating: boolean;
  isUploadingPreActivation: boolean;
  getCodesForItem: (type: "course" | "chapter" | "department", itemId: number) => any[];
  handleCopyCode: (code: string) => void;
  handleActivate: (itemId: number, itemType: "course" | "chapter") => void;
  handlePreactivationUpload: (itemId: number, itemType: "course" | "chapter" | "category", file?: File) => void;
  clearPreactivationNumbers: () => void;
  onGenerateCodes: (type: "course" | "chapter" | "department", id: string) => void;

  // Hook ref sharing (so parent can access/reset path on search, etc. if needed)
  stateHook?: ReturnType<typeof useMillerState>;
}

export function MillerColumns({
  treeData,
  searchQuery,
  onEdit,
  onDelete,
  onAdd,
  onCopyMove,
  openViewers,
  isInstructor,

  canUseActivations,
  codesLoading,
  selectedCode,
  setSelectedCode,
  selectedStudent,
  setSelectedStudent,
  studentSearch,
  setStudentSearch,
  students,
  activationTab,
  setActivationTab,
  preactivationNumbers,
  setPreactivationNumbers,
  copiedCode,
  preactivationResults,
  preactivationFileRef,
  isActivating,
  isUploadingPreActivation,
  getCodesForItem,
  handleCopyCode,
  handleActivate,
  handlePreactivationUpload,
  clearPreactivationNumbers,
  onGenerateCodes,
  stateHook,
}: MillerColumnsProps) {
  // Use shared state hook, or hook initialized inside
  const internalHook = useMillerState();
  const { selectedNodes, path, selectNode, selectAt, setSelectedNodes } = stateHook || internalHook;

  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to the newly opened column — works correctly in both LTR and RTL.
  // inline: "end" is a logical (not physical) value: the browser resolves it from
  // the document's dir attribute automatically, so no manual RTL check is needed.
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "end",    // logical end: right in LTR, left in RTL
      block: "nearest", // prevent unwanted vertical page scroll
    });
  }, [selectedNodes.length]);

  // Generate lists of items for each column level
  // treeData is already filtered by the parent page
  const columnsData = useMemo(() => {
    const columns: { title: string; items: TreeNode[] }[] = [
      { title: "Universities & Centers", items: treeData },
    ];

    selectedNodes.forEach((node) => {
      // Find the live node in the tree so children are always up to date
      const liveNode = findNodeById(treeData, node.id);
      const children = liveNode?.children ?? node.children;
      if (children && children.length > 0) {
        columns.push({
          title: node.name,
          items: children,
        });
      }
    });

    return columns;
  }, [treeData, selectedNodes]);

  // Determine active viewNode for Detail Panel
  const detailPanelNode = useMemo(() => {
    if (selectedNodes.length === 0) return null;
    const lastNode = selectedNodes[selectedNodes.length - 1];

    // Show details for courses, lectures, chapters, notes, or departments
    if (
      lastNode.type === "course" ||
      lastNode.type === "lecture" ||
      lastNode.type === "chapter" ||
      lastNode.type === "note" ||
      lastNode.type === "department"
    ) {
      // Use the live node from the tree so data is always fresh
      return findNodeById(treeData, lastNode.id) ?? lastNode;
    }
    return null;
  }, [selectedNodes, treeData]);

  // Handles item click in a column
  const handleSelectItem = (item: TreeNode, colIndex: number) => {
    selectNode(item, colIndex);
  };

  return (
    <div className="flex flex-col space-y-4 w-full">
      {/* Breadcrumb */}
      <Breadcrumb path={path} onJump={selectAt} />

      {/* Miller Columns Scroll View */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin max-w-full items-start"
      >
        {columnsData.map((col, index) => (
          <Column
            key={`${col.title}-${index}`}
            title={col.title}
            items={col.items}
            selectedId={selectedNodes[index]?.id || null}
            searchQuery={searchQuery}
            onSelectItem={(item) => handleSelectItem(item, index)}
            onEditItem={onEdit}
            onDeleteItem={onDelete}
            onAddItem={onAdd}
            onCopyMove={onCopyMove}
            isInstructor={isInstructor}
          />
        ))}

        {/* Detail Panel at the end */}
        {detailPanelNode && (
          <div className="flex-shrink-0 w-80">
            <DetailPanel
              node={detailPanelNode}
              canUseActivations={canUseActivations}
              isInstructor={isInstructor}
              codesLoading={codesLoading}
              selectedCode={selectedCode}
              setSelectedCode={setSelectedCode}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              students={students}
              activationTab={activationTab}
              setActivationTab={setActivationTab}
              preactivationNumbers={preactivationNumbers}
              setPreactivationNumbers={setPreactivationNumbers}
              copiedCode={copiedCode}
              preactivationResults={preactivationResults}
              preactivationFileRef={preactivationFileRef}
              isActivating={isActivating}
              isUploadingPreActivation={isUploadingPreActivation}
              getCodesForItem={getCodesForItem}
              handleCopyCode={handleCopyCode}
              handleActivate={handleActivate}
              handlePreactivationUpload={handlePreactivationUpload}
              clearPreactivationNumbers={clearPreactivationNumbers}
              onGenerateCodes={onGenerateCodes}
              onCopyMove={onCopyMove}
              openViewers={openViewers}
              onEdit={onEdit}
              onDelete={onDelete}
              onClose={() => {
                setSelectedNodes((prev) => prev.slice(0, -1));
              }}
            />
          </div>
        )}

        {/* Sentinel: empty element used as the scroll target */}
        <div ref={endRef} className="flex-shrink-0 w-px h-px" aria-hidden="true" />
      </div>
    </div>
  );
}

// Recursively find a node by id in the tree
function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

export default MillerColumns;
