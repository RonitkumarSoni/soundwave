import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Crown, ChevronLeft, ChevronRight, LogOut, User, Users } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

interface TopNavProps {
  onToggleFriendsActivity?: () => void;
}

export default function TopNav({ onToggleFriendsActivity }: TopNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchFocus = () => {
    if (location.pathname !== '/search') {
      navigate('/search');
    }
  };

  return (
    <header className="h-20 w-full px-8 flex items-center justify-between z-10 sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#121212] flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={() => navigate(1)}
            className="w-10 h-10 rounded-full bg-[#121212] flex items-center justify-center text-text-secondary hover:text-white transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        <div className="relative group hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-white transition-colors" size={20} />
          <input 
            type="text" 
            onFocus={handleSearchFocus}
            placeholder="What do you want to listen to?" 
            className="w-96 h-12 bg-[#121212] rounded-full pl-12 pr-6 text-sm text-white placeholder:text-text-secondary border border-transparent focus:outline-none focus:border-white/20 transition-all focus:bg-[#1A1A1A]"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="hidden md:flex items-center gap-2 h-10 px-4 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#00A8E1] text-white font-semibold text-sm hover:scale-105 transition-transform shadow-lg">
          <Crown size={16} />
          <span>Premium</span>
        </button>
        
        {onToggleFriendsActivity && (
          <button 
            onClick={onToggleFriendsActivity}
            className="hidden xl:flex w-10 h-10 rounded-full items-center justify-center text-text-secondary hover:text-white transition-colors hover:bg-white/5"
            title="Toggle Friends Activity"
          >
            <Users size={20} />
          </button>
        )}

        <button className="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-white transition-colors relative hover:bg-white/5">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#F59E0B] rounded-full" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-10 h-10 rounded-full bg-[#121212] border border-white/10 overflow-hidden cursor-pointer hover:border-white/30 transition-colors flex items-center justify-center"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-text-secondary" />
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-[#18181B] rounded-xl shadow-2xl border border-white/10 overflow-hidden py-1 z-50"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                  <p className="text-xs text-text-secondary truncate">{user?.email}</p>
                </div>
                
                <button 
                  className="w-full text-left px-4 py-3 text-sm text-text-secondary hover:text-white hover:bg-white/5 transition-colors flex items-center justify-between group"
                >
                  <span>Account Settings</span>
                  <User size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors flex items-center justify-between group"
                >
                  <span>Log out</span>
                  <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
