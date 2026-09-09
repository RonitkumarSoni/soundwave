import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, Search, Library, Music, Heart, Disc, Mic, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom Sidebar Components
import SidebarSectionTitle from './sidebar/SidebarSectionTitle';
import SidebarDownloads from './sidebar/SidebarDownloads';
import SidebarSettings from './sidebar/SidebarSettings';
import SidebarProfile from './sidebar/SidebarProfile';
import SidebarPlaylistItem from './sidebar/SidebarPlaylistItem';
import SidebarLikedSongs from './sidebar/SidebarLikedSongs';
import SidebarArtists from './sidebar/SidebarArtists';
import SidebarPodcasts from './sidebar/SidebarPodcasts';
import { useAuthStore } from '../store/useAuthStore';

const MAIN_LINKS = [
  { name: 'Home', icon: Home, path: '/' },
  { name: 'Discover', icon: Compass, path: '/discover' },
  { name: 'Search', icon: Search, path: '/search' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-[#0A0A0A] border-r border-border flex flex-col pt-6 pb-24 z-20 flex-shrink-0"
    >
      <div className="px-6 mb-8 flex items-center justify-between">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center">
              <Music size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Soundwave</span>
          </motion.div>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)} 
          className="p-2 rounded-full hover:bg-surface/50 text-text-secondary hover:text-white transition-colors ml-auto"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar flex flex-col gap-2">
        <NavSection title="MENU" links={MAIN_LINKS} collapsed={collapsed} />
        
        {/* Custom Premium LIBRARY Section */}
        <div className="mt-2 flex flex-col gap-1">
          <SidebarSectionTitle label="LIBRARY" collapsed={collapsed} />
          <SidebarPlaylistItem 
            icon={Library}
            label="Playlists"
            collapsed={collapsed} 
            active={location.pathname === '/playlists'} 
            onClick={() => navigate('/playlists')} 
          />
          <SidebarLikedSongs 
            collapsed={collapsed} 
            active={location.pathname === '/liked'} 
            onClick={() => navigate('/liked')} 
            likedCount={128}
          />
          <SidebarPlaylistItem 
            icon={Disc}
            label="Albums"
            collapsed={collapsed} 
            active={location.pathname === '/albums'} 
            onClick={() => navigate('/albums')} 
          />
          <SidebarArtists 
            collapsed={collapsed} 
            active={location.pathname === '/artists'} 
            onClick={() => navigate('/artists')} 
          />
          <SidebarPodcasts 
            collapsed={collapsed} 
            active={location.pathname === '/podcasts'} 
            onClick={() => navigate('/podcasts')} 
            badge="LIVE"
          />
        </div>
        
        {/* Custom Premium APP Section */}
        <div className="mt-2 flex flex-col gap-1">
          <SidebarSectionTitle label="APP" collapsed={collapsed} />
          <SidebarDownloads 
            collapsed={collapsed} 
            active={location.pathname === '/downloads'} 
            onClick={() => navigate('/downloads')} 
          />
          <SidebarSettings 
            collapsed={collapsed} 
            active={location.pathname === '/settings'} 
            onClick={() => navigate('/settings')} 
          />
          <SidebarProfile 
            collapsed={collapsed} 
            active={location.pathname === '/profile'} 
            avatar={user?.photoURL || undefined}
            onClick={() => {
              if (user) {
                navigate('/profile');
              } else {
                navigate('/login');
              }
            }} 
          />
        </div>
      </div>
    </motion.aside>
  );
}

function NavSection({ title, links, collapsed }: { title: string, links: any[], collapsed: boolean }) {
  return (
    <div className="flex flex-col gap-1 mb-2">
      {!collapsed && (
        <span className="text-xs font-semibold text-[#71717A] px-3 mb-2 tracking-[2px] uppercase">
          {title}
        </span>
      )}
      {links.map((link) => (
        <NavLink
          key={link.name}
          to={link.path}
          className={({ isActive }) => `
            flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative
            ${isActive ? 'text-white bg-[rgba(255,255,255,0.06)]' : 'text-text-secondary hover:text-white hover:bg-[rgba(255,255,255,0.05)]'}
          `}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-transparent border border-transparent rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <link.icon size={22} className={`transition-colors ${isActive ? 'text-accent-blue' : 'group-hover:text-white'}`} />
              {!collapsed && (
                <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                  {link.name}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
