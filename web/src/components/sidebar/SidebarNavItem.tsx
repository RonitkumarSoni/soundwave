import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string;
  collapsed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'artists' | 'podcasts';
}

export default function SidebarNavItem({
  icon: Icon,
  label,
  active = false,
  badge,
  collapsed = false,
  disabled = false,
  onClick,
  variant = 'artists'
}: SidebarNavItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Variant Configuration
  const isArtists = variant === 'artists';
  const isPodcasts = variant === 'podcasts';

  const defaultIconColor = isArtists ? '#00A8E1' : '#A1A1AA';
  const glowShadow = isArtists 
    ? '0 0 20px rgba(0,168,225,0.25)' 
    : '0 0 20px rgba(255,153,0,0.30)';
    
  const badgeColor = isArtists ? 'bg-accent-blue text-white' : 'bg-[#FF9900] text-black';

  // Icon Animations
  const hoverRotate = isArtists ? 4 : 0;
  const hoverScale = isArtists ? [1, 1.08, 1.08] : [1, 1.15, 1]; // Pulse for podcasts

  return (
    <>
      {/* SVG Gradient Defs for Artists Variant */}
      {isArtists && (
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="artists-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop stopColor="#00A8E1" offset="0%" />
              <stop stopColor="#1DB954" offset="100%" />
            </linearGradient>
          </defs>
        </svg>
      )}

      <motion.button
        onClick={disabled ? undefined : onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        title={collapsed ? label : undefined}
        initial={false}
        whileHover={!disabled ? { 
          x: 6, 
          y: -2,
          scale: 1.02, 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative flex items-center gap-[14px] w-full h-[56px] px-[18px] py-[16px] rounded-[16px] 
          outline-none group overflow-hidden border border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${active ? 'bg-[rgba(255,255,255,0.08)]' : 'bg-transparent'}
        `}
        style={{
          boxShadow: active ? glowShadow : 'none'
        }}
        aria-label={label}
        aria-current={active ? "page" : undefined}
      >
        {/* Active Left Indicator */}
        <AnimatePresence>
          {active && (
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              exit={{ scaleY: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[32px] rounded-r-full ${
                isArtists ? 'bg-gradient-to-b from-[#1DB954] to-[#00A8E1]' : 'bg-[#FF9900]'
              }`}
              style={{ transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className="relative flex-shrink-0 flex items-center justify-center z-10"
          variants={{
            hover: { rotate: hoverRotate, scale: hoverScale },
            initial: { rotate: 0, scale: 1 }
          }}
          initial="initial"
          animate={isHovered && !disabled ? "hover" : "initial"}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {/* Dynamic Icon Styling */}
          <Icon 
            size={22} 
            strokeWidth={active ? 2.5 : 2}
            className="transition-colors duration-300"
            style={{
              stroke: isArtists 
                ? (isHovered || active ? "url(#artists-gradient)" : defaultIconColor)
                : (isHovered || active ? "#FF9900" : defaultIconColor),
              fill: active ? (isArtists ? "url(#artists-gradient)" : "#FF9900") : "none",
              filter: isHovered || active ? `drop-shadow(${glowShadow})` : "none"
            }}
          />
        </motion.div>
        
        {!collapsed && (
          <span className={`
            text-[16px] font-[600] tracking-[0.2px] transition-colors duration-300 truncate flex-1 text-left
            ${active || isHovered ? 'text-white' : 'text-[#A1A1AA]'}
          `}>
            {label}
          </span>
        )}

        {/* Optional Badge */}
        {!collapsed && badge && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-md ${badgeColor}`}
          >
            {badge}
          </motion.div>
        )}
        
        {/* Accessibility Focus Ring */}
        <div className={`absolute inset-0 rounded-[16px] ring-2 transition-shadow pointer-events-none ${
          isArtists ? 'ring-[#00A8E1]/0 focus-visible:ring-[#00A8E1]/100' : 'ring-[#FF9900]/0 focus-visible:ring-[#FF9900]/100'
        }`} />
      </motion.button>
    </>
  );
}
