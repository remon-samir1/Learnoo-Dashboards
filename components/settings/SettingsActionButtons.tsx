import React from 'react';

export default function SettingsActionButtons() {
  return (
    <div className="flex justify-end gap-4 mt-8 pb-8">
      <button className="px-5 py-2.5 text-[14px] font-semibold text-[#4B5563] bg-white border border-[#EEEEEE] hover:bg-[#F9FAFB] rounded-xl transition-colors hover:border-[#D1D5DB]">
        Cancel
      </button>
      <button className="px-5 py-2.5 text-[14px] font-semibold text-white bg-[#2137D6] hover:bg-[#1C2EB8] rounded-xl transition-colors shadow-md shadow-[#2137D6]/20">
        Save Changes
      </button>
    </div>
  );
}
