"use client";

import React, { useState } from 'react';

interface ToggleProps {
  initialChecked?: boolean;
}

export default function Toggle({ initialChecked = false }: ToggleProps) {
  const [checked, setChecked] = useState(initialChecked);

  return (
    <button
      type="button"
      className={`relative inline-flex h-[24px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-[#2137D6]' : 'bg-[#E5E7EB]'}`}
      onClick={() => setChecked(!checked)}
    >
      <span className="sr-only">Toggle setting</span>
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}
