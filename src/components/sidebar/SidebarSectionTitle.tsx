import React from 'react';

export interface SidebarSectionTitleProps {
  label: string;
  collapsed?: boolean;
}

export default function SidebarSectionTitle({
  label,
  collapsed = false,
}: SidebarSectionTitleProps) {
  if (collapsed) {
    return (
      <div className="w-full flex justify-center mt-[32px] mb-[14px]">
        <div className="w-4 h-px bg-[#6B7280]/30 rounded-full" />
      </div>
    );
  }

  return (
    <div 
      className="w-full pl-[18px] mt-[32px] mb-[14px]"
      aria-hidden="true"
    >
      <h2 className="text-[12px] font-bold text-[#6B7280] uppercase tracking-[2px] select-none">
        {label}
      </h2>
    </div>
  );
}
