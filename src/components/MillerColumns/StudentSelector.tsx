import React, { useState, useEffect, useRef, useCallback } from "react";
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
    const [hasMore, setHasMore] = useState(true);
    const observerRef = useRef<IntersectionObserver | null>(null);

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
            } else {
                // Fallback
                setHasMore(data.data.length === 15);
            }
        }
    }, [data, page]);

    const lastElementRef = useCallback(
        (node: HTMLLabelElement | null) => {
            if (isLoading) return;
            if (observerRef.current) observerRef.current.disconnect();
            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage((prevPage) => prevPage + 1);
                }
            });
            if (node) observerRef.current.observe(node);
        },
        [isLoading, hasMore]
    );

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
                        // Optionally clear selected student when searching if it's no longer valid, 
                        // but for now keeping it simple.
                    }}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                />
            </div>

            <div className="mt-1.5 max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1 space-y-1 bg-white">
                {studentsList.map((student: any, index: number) => {
                    const isLast = index === studentsList.length - 1;
                    return (
                        <label
                            key={student.id}
                            ref={isLast ? lastElementRef : null}
                            className={`flex items-center gap-1.5 p-1 rounded-md cursor-pointer text-xs ${selectedStudent === student.id
                                ? "bg-blue-50"
                                : "hover:bg-gray-50"
                                }`}
                        >
                            <input
                                type="radio"
                                name="selector-student"
                                value={student.id}
                                checked={selectedStudent === student.id}
                                onChange={() => {
                                    setSelectedStudent(student.id);
                                    setStudentSearch(
                                        `${student.attributes.first_name} ${student.attributes.last_name}`
                                    );
                                }}
                                className="w-3.5 h-3.5 text-blue-600"
                            />
                            <span className="text-[11px] text-gray-800">
                                {student.attributes.first_name} {student.attributes.last_name}
                            </span>
                        </label>
                    );
                })}

                {isLoading && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                )}

                {!isLoading && studentsList.length === 0 && (
                    <div className="text-center py-2 text-[10px] text-gray-400">
                        {t?.("noStudentsFound") || "No students found"}
                    </div>
                )}
            </div>
        </div>
    );
}
