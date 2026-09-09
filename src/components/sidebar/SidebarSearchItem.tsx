import React from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export interface SidebarSearchItemProps {
  label?: string;
  onClick?: () => void;
  collapsed?: boolean;
  disabled?: boolean;
}

export default function SidebarSearchItem({
  label = 'Search',
  onClick,
  collapsed = false,
  disabled = false,
}: SidebarSearchItemProps) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={collapsed ? "Search Music" : undefined}
      initial={false}
      whileHover={!disabled ? { x: 5, scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`
        relative flex items-center gap-[14px] w-full h-[56px] px-[18px] py-[16px] rounded-[18px] 
        bg-transparent text-[#B3B3B3] outline-none group
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-white'}
      `}
      aria-label="Search Music"
    >
      <div className="flex-shrink-0 flex items-center justify-center transition-colors duration-250 group-hover:text-white">
        <Search size={24} strokeWidth={2.5} />
      </div>
      
      {!collapsed && (
        <span className="text-[16px] font-medium transition-colors duration-250 group-hover:text-white truncate">
          {label}
        </span>
      )}
      
      {/* Accessibility Focus Ring */}
      <div className="absolute inset-0 rounded-[18px] ring-2 ring-accent-blue/0 focus-visible:ring-accent-blue/100 transition-shadow pointer-events-none" />
    </motion.button>
  );
}
