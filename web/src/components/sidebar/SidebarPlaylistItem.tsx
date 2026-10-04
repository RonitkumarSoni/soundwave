import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface SidebarPlaylistItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
  collapsed?: boolean;
  disabled?: boolean;
}

export default function SidebarPlaylistItem({
  icon: Icon,
  label,
  active = false,
  onClick,
  badge,
  collapsed = false,
  disabled = false,
}: SidebarPlaylistItemProps) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={collapsed ? label : undefined}
      initial={false}
      whileHover={!disabled && !active ? { y: -2, scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.03)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative flex items-center gap-[14px] w-full h-[56px] px-[18px] py-[16px] rounded-[18px] 
        outline-none group overflow-hidden
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-transparent'}
      `}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      {/* Active Indicator Bar */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[32px] rounded-r-full bg-gradient-to-b from-[#1DB954] to-[#00A8E1]"
            style={{ transformOrigin: 'center' }}
          />
        )}
      </AnimatePresence>

      <motion.div 
        className="relative flex-shrink-0 flex items-center justify-center z-10"
        variants={{
          hover: { rotate: 3 },
          initial: { rotate: 0 }
        }}
        initial="initial"
        whileHover={!disabled ? "hover" : "initial"}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Icon 
          size={24} 
          strokeWidth={active ? 2.5 : 2} 
          className={`
            transition-colors duration-300
            ${active ? 'text-white drop-shadow-[0_0_10px_rgba(29,185,84,0.5)]' : 'text-[#A1A1AA] group-hover:text-white'}
          `}
        />
        {/* Soft Glow Behind Icon when Active */}
        {active && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954] to-[#00A8E1] blur-md opacity-30 rounded-full" />
        )}
      </motion.div>
      
      {!collapsed && (
        <span className={`
          text-[16px] transition-colors duration-300 truncate flex-1 text-left
          ${active ? 'text-white font-bold' : 'text-[#A1A1AA] font-medium group-hover:text-white'}
        `}>
          {label}
        </span>
      )}

      {/* Optional Badge */}
      {!collapsed && badge && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="ml-auto bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10 backdrop-blur-md"
        >
          {badge}
        </motion.div>
      )}
      
      {/* Accessibility Focus Ring */}
      <div className="absolute inset-0 rounded-[18px] ring-2 ring-[#1DB954]/0 focus-visible:ring-[#1DB954]/100 transition-shadow pointer-events-none" />
    </motion.button>
  );
}
