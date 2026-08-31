import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { useStudents } from "@/src/hooks/useStudents";
import { useTranslations } from "next-intl";

interface StudentSelectorProps {
    selectedStudent: string;
    setSelectedStudent: (val: string) => void;
    studentSearch: string;
    setStudentSearch: (val: string) => void;
}

export function StudentSelector({
    selectedStudent,
    setSelectedStudent,
    studentSearch,
    setStudentSearch,
}: StudentSelectorProps) {
    const t = useTranslations("courses.detailPanel");
    const [page, setPage] = useState(1);
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(false);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState(studentSearch);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(studentSearch);
            setPage(1); // reset to page 1 on search change
            setStudentsList([]);
        }, 300);
        return () => clearTimeout(handler);
    }, [studentSearch]);

    const { data, isLoading } = useStudents({
        search: debouncedSearch,
        page: page,
        per_page: 15,
    });

    useEffect(() => {
        if (data?.data && Array.isArray(data.data)) {
            if (page === 1) {
                setStudentsList(data.data);
            } else {
                setStudentsList((prev) => {
                    const newItems = data.data.filter(
                        (item: any) => !prev.some((p: any) => p.id === item.id)
                    );
                    return [...prev, ...newItems];
                });
            }

            const meta = (data as any)?.meta?.pagination || (data as any)?.meta;
            if (meta && meta.last_page) {
                setHasMore(page < meta.last_page);
            } else if (meta && meta.total_pages) {
                setHasMore(page < meta.total_pages);
            } else {
                // Fallback
                setHasMore(data.data.length === 15);
            }
        }
    }, [data, page]);

    const handleLoadMore = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isLoading && hasMore) {
            setPage((prevPage) => prevPage + 1);
        }
    };

    return (
        <div>
            <label className="text-[10px] text-gray-500 block mb-1">
                {t("selectStudent")}
            </label>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                    type="text"
                    placeholder={t("searchStudents")}
                    value={studentSearch}
                    onChange={(e) => {
                        setStudentSearch(e.target.value);
                    }}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
            </div>

            <div className="mt-1.5 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-1 space-y-1 bg-white">
                {studentsList.map((student: any) => {
                    const isSelected = String(selectedStudent) === String(student.id);
                    return (
                        <label
                            key={student.id}
                            className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs transition-colors ${isSelected
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            <input
                                type="radio"
                                name="selector-student"
                                value={student.id}
                                checked={isSelected}
                                onChange={() => {
                                    setSelectedStudent(String(student.id));
                                    setStudentSearch(
                                        `${student.attributes.first_name} ${student.attributes.last_name}`
                                    );
                                }}
                                className="w-3.5 h-3.5 text-blue-600"
                            />
                            <span className="text-[11px] text-gray-800 truncate">
                                {student.attributes.first_name} {student.attributes.last_name}
                            </span>
                        </label>
                    );
                })}

                {isLoading && page === 1 && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                )}

                {!isLoading && studentsList.length === 0 && (
                    <div className="text-center py-2 text-[10px] text-gray-400 italic">
                        {t("noStudentsFound")}
                    </div>
                )}

                {hasMore && (
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="w-full py-1.5 mt-1 border border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-md text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                        {isLoading && page > 1 ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                <span>{t("loading")}</span>
                            </>
                        ) : (
                            <span>{t("showMore")}</span>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
