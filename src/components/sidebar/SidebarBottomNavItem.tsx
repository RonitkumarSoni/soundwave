import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface SidebarBottomNavItemProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string;
  badgeStyle?: string;
  avatar?: string;
  collapsed?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'downloads' | 'settings' | 'profile';
}

export default function SidebarBottomNavItem({
  icon: Icon,
  label,
  active = false,
  badge,
  badgeStyle,
  avatar,
  collapsed = false,
  disabled = false,
  onClick,
  variant = 'profile'
}: SidebarBottomNavItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Variant Configuration
  const isDownloads = variant === 'downloads';
  const isSettings = variant === 'settings';
  const isProfile = variant === 'profile';

  let hoverColor = '#00A8E1'; // Profile / Downloads default
  if (isSettings) hoverColor = '#8B5CF6';

  let activeColor = '#00A8E1';
  if (isSettings) activeColor = '#8B5CF6';
  if (isDownloads) activeColor = '#1DB954';

  const defaultIconColor = isProfile ? '#00A8E1' : '#A1A1AA';
  
  let glowShadow = `0 0 20px rgba(0,168,225,0.35)`;
  if (isSettings) glowShadow = `0 0 20px rgba(139,92,246,0.35)`;
  if (isDownloads) glowShadow = `0 0 20px rgba(29,185,84,0.35)`;

  // Icon Animations
  let hoverRotate = 3;
  if (isSettings) hoverRotate = 90;

  const hoverScale = isDownloads ? 1.08 : 1.1;

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      title={collapsed ? label : undefined}
      initial={false}
      whileHover={!disabled ? { 
        x: 6, 
        y: isSettings ? -2 : 0,
        scale: 1.02, 
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.06)'
      } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative flex items-center gap-[14px] w-full h-[56px] px-[18px] py-[16px] rounded-[16px] 
        outline-none group overflow-hidden border border-transparent
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-transparent'}
      `}
      style={{
        boxShadow: active || isHovered ? glowShadow : 'none'
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
              isProfile ? 'bg-gradient-to-b from-[#1DB954] to-[#00A8E1]' : 
              isSettings ? 'bg-[#8B5CF6]' : 'bg-[#1DB954]'
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
        {avatar ? (
          <div className="w-[24px] h-[24px] rounded-full overflow-hidden border border-white/20">
            <img src={avatar} alt={label} className="w-full h-full object-cover" />
          </div>
        ) : (
          <Icon 
            size={22} 
            strokeWidth={active ? 2.5 : 2}
            className="transition-colors duration-300"
            style={{
              color: active ? activeColor : (isHovered ? hoverColor : defaultIconColor),
              filter: isHovered || active ? `drop-shadow(${glowShadow})` : "none"
            }}
          />
        )}
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
          className={`ml-auto text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shadow-md ${
            badgeStyle ? badgeStyle : 'bg-white/10 text-white'
          }`}
        >
          {badge}
        </motion.div>
      )}
      
      {/* Accessibility Focus Ring */}
      <div className={`absolute inset-0 rounded-[16px] ring-2 transition-shadow pointer-events-none ${
        isSettings ? 'ring-[#8B5CF6]/0 focus-visible:ring-[#8B5CF6]/100' : 'ring-[#00A8E1]/0 focus-visible:ring-[#00A8E1]/100'
      }`} />
    </motion.button>
  );
}
