"use client";

import React, { useState, useEffect, useRef } from "react";
import { useInstructors } from "@/src/hooks/useInstructors";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";
import { useDebounce } from "use-debounce";

interface InstructorSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function InstructorSelect({
    value,
    onChange,
    disabled,
}: InstructorSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch] = useDebounce(searchQuery, 400);
    const [page, setPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [instructorsList, setInstructorsList] = useState<any[]>([]);

    // Track the selected name separately so we don't have to look it up on every render
    const [selectedName, setSelectedName] = useState<string>("");

    const { data, isLoading } = useInstructors({
        search: debouncedSearch,
        page,
        per_page: 20,
    });

    // Reset pagination and list when search query changes
    useEffect(() => {
        setPage(1);
        setInstructorsList([]);
    }, [debouncedSearch]);

    // Aggregate results when data changes
    useEffect(() => {
        if (data?.data) {
            if (page === 1) {
                setInstructorsList(data.data);
            } else {
                setInstructorsList((prev) => [...prev, ...data.data]);
            }
        }
    }, [data, page]);

    // Try to set the selected name when we have the value and a matching instructor in list
    useEffect(() => {
        if (value) {
            const found = instructorsList.find(
                (i: any) => String(i.id) === String(value)
            );
            if (found) {
                setSelectedName(
                    `${found.attributes.first_name} ${found.attributes.last_name}`
                );
            }
        } else {
            setSelectedName("");
        }
    }, [value, instructorsList]);

    // Handle click outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const meta = data?.meta;
    const hasMore = meta ? page < meta.last_page : false;

    const handleSelect = (id: string, name: string) => {
        setSelectedName(name);
        onChange(id);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSelectedName("");
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-left flex items-center justify-between transition-colors ${isOpen ? "ring-2 ring-green-500 border-green-500" : ""
                    }`}
            >
                <span className="truncate flex-1">
                    {value
                        ? selectedName || `Instructor #${value}`
                        : "Select Instructor"}
                </span>
                <div className="flex items-center gap-1">
                    {value && !disabled && (
                        <span
                            onClick={handleClear}
                            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400"
                        >
                            <X className="w-3.5 h-3.5" />
                        </span>
                    )}
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""
                            }`}
                    />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E8F0] overflow-hidden rounded-xl shadow-xl">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search instructors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-sm focus:outline-none placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="p-1 rounded-full hover:bg-gray-200 text-gray-400"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {instructorsList.length === 0 && !isLoading ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                                No instructors found
                            </div>
                        ) : (
                            instructorsList.map((inst: any) => {
                                const name = `${inst.attributes.first_name} ${inst.attributes.last_name}`;
                                const isSelected = String(value) === String(inst.id);
                                return (
                                    <button
                                        key={inst.id}
                                        type="button"
                                        onClick={() => handleSelect(String(inst.id), name)}
                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors ${isSelected
                                            ? "bg-green-50 text-green-700 font-semibold"
                                            : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        {name}
                                    </button>
                                );
                            })
                        )}

                        {hasMore && (
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                disabled={isLoading}
                                className="w-full mt-1 py-2.5 text-sm text-[#2137D6] hover:bg-blue-50 rounded-lg flex items-center justify-center font-medium transition-colors"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : (
                                    "Load More"
                                )}
                            </button>
                        )}

                        {isLoading && page === 1 && (
                            <div className="p-4 flex justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-[#2137D6]" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
