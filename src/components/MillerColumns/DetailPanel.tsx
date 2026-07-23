import React from "react";
import {
  X,
  Plus,
  Power,
  Search,
  Key,
  Copy,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowRightLeft,
  Users,
  FileText,
  ChevronRight,
  BookOpen,
  FolderOpen,
  PlayCircle,
} from "lucide-react";
import type { TreeNode } from "./useMillerState";
import type { Course, Lecture, Chapter, Note } from "@/src/types";

interface DetailPanelProps {
  node: TreeNode;
  canUseActivations: boolean;
  isInstructor: boolean;
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
  onCopyMove: (node: TreeNode, mode: "copy" | "move") => void;
  openViewers: (node: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
  onClose: () => void;
}

export function DetailPanel({
  node,
  canUseActivations,
  isInstructor,
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
  onCopyMove,
  openViewers,
  onEdit,
  onDelete,
  onClose,
}: DetailPanelProps) {
  const handlePreactivationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const numbers = text
        .split(/[\n,\r,;]/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);
      setPreactivationNumbers(numbers);
    };
    reader.readAsText(file);
  };

  const itemId = parseInt(node.data.id);

  return (
    <div className="flex-1 min-width-[280px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-220px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {node.type} Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {/* Name / Title */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Name
          </label>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {node.name}
          </p>
        </div>

        {/* Section based on Node Type */}
        {node.type === "department" && (
          <div className="space-y-4">
            {node.meta?.code && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Code
                </label>
                <p className="text-xs text-gray-700 mt-1">{node.meta.code}</p>
              </div>
            )}

            <div className="flex gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Courses
                </label>
                <p className="text-base font-bold text-blue-600">
                  {node.stats?.courses || 0}
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Students
                </label>
                <p className="text-base font-bold text-green-600">
                  {node.stats?.students || 0}
                </p>
              </div>
            </div>

            {/* Department Actions for Activations */}
            {canUseActivations && (
              <div className="pt-3 border-t border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Activation</span>
                  {!isInstructor && (
                    <button
                      onClick={() => onGenerateCodes("department", node.data.id)}
                      className="p-1 hover:text-blue-600 transition-colors border rounded bg-gray-50"
                      title="Generate Codes"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {/* Department codes rendering */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Department code activation is managed through courses. Pre-activate numbers under Course details instead.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {node.type === "course" && (
          <div className="space-y-4">
            {node.meta?.thumbnail && (
              <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-100">
                <img
                  src={node.meta.thumbnail}
                  alt={node.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
              <div>
                <label className="text-[10px] text-gray-400 block">Status</label>
                <span
                  className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-md ${node.meta?.status === "active"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                >
                  {node.meta?.status === "active" ? "Active" : "Draft"}
                </span>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block">Instructor</label>
                <p className="text-xs text-gray-700 truncate">
                  {(node.data as Course).attributes.instructor?.data?.attributes?.full_name || "N/A"}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block">Price</label>
                <p className="text-xs font-bold text-blue-600">
                  EGP {(node.data as Course).attributes.price}
                </p>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block font-normal">Max Views</label>
                <p className="text-xs text-gray-700">
                  {(node.data as Course).attributes.max_views_per_student}
                </p>
              </div>
              <div className="col-span-2 border-t border-gray-100 pt-2 flex justify-between">
                <div>
                  <label className="text-[10px] text-gray-400 block">Lectures</label>
                  <p className="text-xs font-bold text-purple-600">{node.stats?.lectures || 0}</p>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block">Students</label>
                  <p className="text-xs font-bold text-green-600">{node.stats?.students || 0}</p>
                </div>
              </div>
            </div>

            {(node.data as Course).attributes.description && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Description
                </label>
                <p className="text-xs text-gray-600 mt-1 max-h-24 overflow-y-auto bg-gray-50 p-2 rounded">
                  {(node.data as Course).attributes.description}
                </p>
              </div>
            )}

            {/* Course activation section */}
            {canUseActivations && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Power className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">Activate Course</span>
                  </div>
                  {!isInstructor && (
                    <button
                      onClick={() => onGenerateCodes("course", node.data.id)}
                      className="p-1 hover:text-blue-600 transition-colors border rounded bg-gray-50"
                      title="Generate Codes"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setActivationTab("code")}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activationTab === "code" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                      }`}
                  >
                    By Code
                  </button>
                  <button
                    onClick={() => setActivationTab("preactivation")}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activationTab === "preactivation" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                      }`}
                  >
                    Preactivation
                  </button>
                </div>

                {activationTab === "code" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">
                        Available Codes ({getCodesForItem("course", itemId).filter((c) => !c.attributes.is_used).length})
                      </label>
                      {codesLoading ? (
                        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /></div>
                      ) : (
                        <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1.5 space-y-1">
                          {getCodesForItem("course", itemId)
                            .filter((c) => !c.attributes.is_used)
                            .map((code) => (
                              <label
                                key={code.id}
                                className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs ${selectedCode === code.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="course-code"
                                  value={code.id}
                                  checked={selectedCode === code.id}
                                  onChange={(e) => setSelectedCode(e.target.value)}
                                  className="w-3.5 h-3.5 text-blue-600"
                                />
                                <span className="flex-1 font-mono text-[11px] truncate">{code.attributes.code}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopyCode(code.attributes.code); }}
                                  className="p-0.5 hover:bg-blue-100 rounded"
                                >
                                  {copiedCode === code.attributes.code ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400" />
                                  )}
                                </button>
                              </label>
                            ))}
                          {getCodesForItem("course", itemId).filter((c) => !c.attributes.is_used).length === 0 && (
                            <p className="text-[10px] text-gray-400 italic text-center py-1">No codes available</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Student list search */}
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Select Student</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      {studentSearch && students?.data && (
                        <div className="mt-1.5 max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1 space-y-1 bg-white">
                          {students.data
                            .filter((student: any) => {
                              const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
                              return fullName.includes(studentSearch.toLowerCase());
                            })
                            .map((student: any) => (
                              <label
                                key={student.id}
                                className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs ${selectedStudent === student.id ? "bg-blue-50" : "hover:bg-gray-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="course-student"
                                  value={student.id}
                                  checked={selectedStudent === student.id}
                                  onChange={() => {
                                    setSelectedStudent(student.id);
                                    setStudentSearch(`${student.attributes.first_name} ${student.attributes.last_name}`);
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600"
                                />
                                <span className="text-[11px] text-gray-800">{student.attributes.first_name} {student.attributes.last_name}</span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleActivate(itemId, "course")}
                      disabled={isActivating || !selectedCode || !selectedStudent}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {isActivating ? "Activating..." : "Activate Student"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Preactivation Phone Numbers input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Phone Numbers</span>
                        {preactivationNumbers.length > 0 && (
                          <button onClick={clearPreactivationNumbers} className="text-[9px] text-red-500">Clear</button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {preactivationNumbers.map((num, idx) => (
                          <div key={idx} className="flex gap-1">
                            <input
                              type="text"
                              value={num}
                              onChange={(e) => {
                                const copy = [...preactivationNumbers];
                                copy[idx] = e.target.value;
                                setPreactivationNumbers(copy);
                              }}
                              placeholder="+123..."
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
                            />
                            <button
                              onClick={() => setPreactivationNumbers(preactivationNumbers.filter((_, i) => i !== idx))}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setPreactivationNumbers([...preactivationNumbers, ""])}
                          className="w-full py-1 border border-dashed border-gray-300 rounded text-xs text-gray-500 text-center"
                        >
                          + Add Number
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 my-1.5"><div className="flex-grow h-px bg-gray-100" /> <span className="text-[9px] text-gray-400">OR FILE</span> <div className="flex-grow h-px bg-gray-100" /></div>

                    <input ref={preactivationFileRef} type="file" accept=".txt,.csv" onChange={handlePreactivationFileSelect} className="hidden" />
                    <button
                      onClick={() => preactivationFileRef.current?.click()}
                      className="w-full py-1 border border-gray-200 rounded bg-gray-50 text-xs text-gray-700 flex justify-center items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" /> Choose Text File
                    </button>

                    <button
                      onClick={() => {
                        const content = preactivationNumbers.filter(n => n.trim().length > 0).join('\n');
                        if (content.length === 0) return;
                        const file = new File([new Blob([content], { type: 'text/plain' })], 'phones.txt', { type: 'text/plain' });
                        handlePreactivationUpload(itemId, "course", file);
                      }}
                      disabled={preactivationNumbers.filter(n => n.trim().length > 0).length === 0 || isUploadingPreActivation}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {isUploadingPreActivation ? "Uploading..." : "Upload Preactivations"}
                    </button>

                    {preactivationResults && (
                      <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded">
                        Processed: {preactivationResults.success} success, {preactivationResults.failed} skipped.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {node.type === "lecture" && (
          <div className="space-y-4">
            {(node.data as Lecture).attributes.description && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Description
                </label>
                <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 rounded">
                  {(node.data as Lecture).attributes.description}
                </p>
              </div>
            )}
          </div>
        )}

        {node.type === "chapter" && (
          <div className="space-y-4">
            {/* Video preview iframe */}
            {(node.data as Chapter).attributes.video && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Video Preview
                </label>
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-black">
                  <iframe
                    src={(node.data as Chapter).attributes.video}
                    className="w-full h-full"
                    allowFullScreen
                    allow="encrypted-media"
                    frameBorder="0"
                  />
                </div>
              </div>
            )}

            {/* Thumbnail */}
            {(node.data as Chapter).attributes.thumbnail && !(node.data as Chapter).attributes.video && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Thumbnail
                </label>
                <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={(node.data as Chapter).attributes.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Attachments */}
            {((node.data as Chapter).attributes.attachments?.length ?? 0) > 0 && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Attachments & Resources
                </label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(node.data as Chapter).attributes.attachments?.map((att: any) => (
                    <a
                      key={att.id}
                      href={att.attributes?.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-1.5 border border-gray-200 hover:border-blue-200 rounded bg-gray-50 text-[11px] text-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{att.attributes?.name || "Unnamed"}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter Activation codes */}
            {canUseActivations && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <Power className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-gray-800">Activate Lesson</span>
                  </div>
                  {!isInstructor && (
                    <button
                      onClick={() => onGenerateCodes("chapter", node.data.id)}
                      className="p-1 hover:text-blue-600 transition-colors border rounded bg-gray-50"
                      title="Generate Codes"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setActivationTab("code")}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activationTab === "code" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                      }`}
                  >
                    By Code
                  </button>
                  <button
                    onClick={() => setActivationTab("preactivation")}
                    className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${activationTab === "preactivation" ? "bg-white text-blue-600 shadow-xs" : "text-gray-500"
                      }`}
                  >
                    Preactivation
                  </button>
                </div>

                {activationTab === "code" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">
                        Available Codes ({getCodesForItem("chapter", itemId).filter((c) => !c.attributes.is_used).length})
                      </label>
                      {codesLoading ? (
                        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-blue-500" /></div>
                      ) : (
                        <div className="max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1.5 space-y-1 bg-white">
                          {getCodesForItem("chapter", itemId)
                            .filter((c) => !c.attributes.is_used)
                            .map((code) => (
                              <label
                                key={code.id}
                                className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs ${selectedCode === code.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="chapter-code"
                                  value={code.id}
                                  checked={selectedCode === code.id}
                                  onChange={(e) => setSelectedCode(e.target.value)}
                                  className="w-3.5 h-3.5 text-blue-600"
                                />
                                <span className="flex-1 font-mono text-[11px] truncate">{code.attributes.code}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopyCode(code.attributes.code); }}
                                  className="p-0.5 hover:bg-blue-100 rounded"
                                >
                                  {copiedCode === code.attributes.code ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400" />
                                  )}
                                </button>
                              </label>
                            ))}
                          {getCodesForItem("chapter", itemId).filter((c) => !c.attributes.is_used).length === 0 && (
                            <p className="text-[10px] text-gray-400 italic text-center py-1">No codes available</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 block mb-1">Select Student</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search students"
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      {studentSearch && students?.data && (
                        <div className="mt-1.5 max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1 space-y-1 bg-white">
                          {students.data
                            .filter((student: any) => {
                              const fullName = `${student.attributes.first_name} ${student.attributes.last_name}`.toLowerCase();
                              return fullName.includes(studentSearch.toLowerCase());
                            })
                            .map((student: any) => (
                              <label
                                key={student.id}
                                className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs ${selectedStudent === student.id ? "bg-blue-50" : "hover:bg-gray-50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="chapter-student"
                                  value={student.id}
                                  checked={selectedStudent === student.id}
                                  onChange={() => {
                                    setSelectedStudent(student.id);
                                    setStudentSearch(`${student.attributes.first_name} ${student.attributes.last_name}`);
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600"
                                />
                                <span className="text-[11px] text-gray-800">{student.attributes.first_name} {student.attributes.last_name}</span>
                              </label>
                            ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleActivate(itemId, "chapter")}
                      disabled={isActivating || !selectedCode || !selectedStudent}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {isActivating ? "Activating..." : "Activate Student"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Phone Numbers</span>
                        {preactivationNumbers.length > 0 && (
                          <button onClick={clearPreactivationNumbers} className="text-[9px] text-red-500">Clear</button>
                        )}
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {preactivationNumbers.map((num, idx) => (
                          <div key={idx} className="flex gap-1">
                            <input
                              type="text"
                              value={num}
                              onChange={(e) => {
                                const copy = [...preactivationNumbers];
                                copy[idx] = e.target.value;
                                setPreactivationNumbers(copy);
                              }}
                              placeholder="+123..."
                              className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs"
                            />
                            <button
                              onClick={() => setPreactivationNumbers(preactivationNumbers.filter((_, i) => i !== idx))}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setPreactivationNumbers([...preactivationNumbers, ""])}
                          className="w-full py-1 border border-dashed border-gray-300 rounded text-xs text-gray-500 text-center"
                        >
                          + Add Number
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 my-1.5"><div className="flex-grow h-px bg-gray-100" /> <span className="text-[9px] text-gray-400">OR FILE</span> <div className="flex-grow h-px bg-gray-100" /></div>

                    <input ref={preactivationFileRef} type="file" accept=".txt,.csv" onChange={handlePreactivationFileSelect} className="hidden" />
                    <button
                      onClick={() => preactivationFileRef.current?.click()}
                      className="w-full py-1 border border-gray-200 rounded bg-gray-50 text-xs text-gray-700 flex justify-center items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-500" /> Choose Text File
                    </button>

                    <button
                      onClick={() => {
                        const content = preactivationNumbers.filter(n => n.trim().length > 0).join('\n');
                        if (content.length === 0) return;
                        const file = new File([new Blob([content], { type: 'text/plain' })], 'phones.txt', { type: 'text/plain' });
                        handlePreactivationUpload(itemId, "chapter", file);
                      }}
                      disabled={preactivationNumbers.filter(n => n.trim().length > 0).length === 0 || isUploadingPreActivation}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {isUploadingPreActivation ? "Uploading..." : "Upload Preactivations"}
                    </button>

                    {preactivationResults && (
                      <div className="text-[10px] text-gray-600 bg-gray-50 p-2 rounded">
                        Processed: {preactivationResults.success} success, {preactivationResults.failed} skipped.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {node.type === "note" && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Type
              </label>
              <p className="text-xs text-gray-700 capitalize mt-1 border border-gray-100 bg-gray-50 px-2 py-1 rounded inline-block">
                {(node.data as Note).attributes.type}
              </p>
            </div>

            {(node.data as Note).attributes.content && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Content
                </label>
                <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap bg-gray-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed max-h-48 overflow-y-auto">
                  {(node.data as Note).attributes.content}
                </p>
              </div>
            )}

            {(node.data as Note).attributes.linked_lecture && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Linked Lecture
                </label>
                <p className="text-xs text-gray-700 mt-1">
                  {(node.data as Note).attributes.linked_lecture}
                </p>
              </div>
            )}

            {(node.data as Note).attributes.attachment && (
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Attachment
                </label>
                <a
                  href={(node.data as Note).attributes.attachment?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-1.5 border border-gray-200 hover:border-blue-200 rounded bg-gray-50 text-[11px] text-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{(node.data as Note).attributes.attachment?.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </a>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
              <div className="mt-1">
                <span
                  className={`inline-block px-1.5 py-0.5 text-[9px] font-bold rounded-md ${(node.data as Note).attributes.is_publish
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                >
                  {(node.data as Note).attributes.is_publish ? "Published" : "Draft"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0 flex gap-2 flex-wrap">
        {node.type === "chapter" && (
          <>
            <button
              onClick={() => onCopyMove(node, "copy")}
              className="px-2.5 py-1.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button
              onClick={() => onCopyMove(node, "move")}
              className="px-2.5 py-1.5 bg-purple-50 text-purple-600 text-xs font-semibold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" /> Move
            </button>
            <button
              onClick={() => openViewers(node)}
              className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5 text-gray-500" /> Viewers
            </button>
          </>
        )}

        <button
          onClick={() => onEdit(node)}
          className="flex-grow px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-lg transition-colors text-center"
        >
          Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
        </button>

        {!isInstructor && (
          <button
            onClick={() => onDelete(node)}
            className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
