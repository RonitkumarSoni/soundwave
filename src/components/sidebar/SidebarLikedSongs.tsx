import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

export interface SidebarLikedSongsProps {
  active?: boolean;
  likedCount?: number;
  collapsed?: boolean;
  onClick?: () => void;
}

export default function SidebarLikedSongs({
  active = false,
  likedCount = 0,
  collapsed = false,
  onClick
}: SidebarLikedSongsProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* SVG Gradient Defs for Heart Icon */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#00A8E1" offset="0%" />
            <stop stopColor="#1DB954" offset="100%" />
          </linearGradient>
        </defs>
      </svg>

      <motion.button
        onClick={onClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        title={collapsed ? "Liked Songs" : undefined}
        initial={false}
        whileHover={{ 
          x: 6, 
          scale: 1.02, 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.08)'
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`
          relative flex items-center gap-[14px] w-full h-[56px] px-[18px] py-[16px] rounded-[16px] 
          outline-none group overflow-hidden cursor-pointer border border-transparent
          ${active ? 'bg-[rgba(255,255,255,0.08)] shadow-[0_0_25px_rgba(29,185,84,0.25)]' : 'bg-transparent'}
        `}
        aria-label="Liked Songs"
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
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[32px] rounded-r-full bg-gradient-to-b from-[#1DB954] to-[#00A8E1]"
              style={{ transformOrigin: 'center' }}
            />
          )}
        </AnimatePresence>

        <motion.div 
          className="relative flex-shrink-0 flex items-center justify-center z-10"
          variants={{
            hover: { rotate: 5, scale: [1, 1.15, 1] },
            initial: { rotate: 0, scale: 1 }
          }}
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          transition={{ duration: 0.25 }}
        >
          {/* Heart Icon handling the complex stroke/fill requirements */}
          <Heart 
            size={22} 
            strokeWidth={active ? 2.5 : 2}
            className="transition-colors duration-300"
            style={{
              stroke: isHovered || active ? "url(#heart-gradient)" : "#00A8E1",
              fill: active ? "url(#heart-gradient)" : "none",
              filter: isHovered || active ? "drop-shadow(0px 0px 16px rgba(0,168,225,0.45))" : "none"
            }}
          />
        </motion.div>
        
        {!collapsed && (
          <span className={`
            text-[16px] font-[600] tracking-[0.2px] transition-colors duration-300 truncate flex-1 text-left
            ${active || isHovered ? 'text-white' : 'text-[#B3B3B3]'}
          `}>
            Liked Songs
          </span>
        )}

        {/* Optional Badge */}
        {!collapsed && likedCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto bg-[#1DB954] text-white text-[12px] font-[600] px-3 py-1 rounded-full shadow-md"
          >
            {likedCount}
          </motion.div>
        )}
        
        {/* Accessibility Focus Ring */}
        <div className="absolute inset-0 rounded-[16px] ring-2 ring-[#00A8E1]/0 focus-visible:ring-[#00A8E1]/100 transition-shadow pointer-events-none" />
      </motion.button>
    </>
  );
}
