"use client";

import Image from "next/image";
import { useId } from "react";
import type { AcademicSelectOption } from "@/src/types/student-academic.types";

export default function AcademicOptions({ label, options, value, onChange, disabled }: {
  label: string; options: AcademicSelectOption[]; value: string;
  onChange: (value: string) => void; disabled?: boolean;
}) {
  const name = useId();
  return <fieldset disabled={disabled} aria-label={label} className="max-h-64 space-y-2 overflow-y-auto rounded-xl border p-2 disabled:opacity-60">
    {options.map(option => <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${value === option.id ? 'border-[var(--primary)] bg-blue-50' : 'border-transparent'}`}>
      <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      {option.image && <Image src={option.image} alt="" width={48} height={48} unoptimized className="size-12 shrink-0 object-contain" />}
      <span>{option.label}</span>
    </label>)}
  </fieldset>;
}
