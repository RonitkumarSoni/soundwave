import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import MiniPlayer from '../components/MiniPlayer';
import FullPlayerOverlay from '../components/FullPlayerOverlay';
import FriendsActivity from '../components/home/FriendsActivity';
import { Outlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

export default function MainLayout() {
  const [isFriendsActivityOpen, setIsFriendsActivityOpen] = useState(true);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-primary text-text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onToggleFriendsActivity={() => setIsFriendsActivityOpen(!isFriendsActivityOpen)} />
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          <Outlet />
        </main>
      </div>
      
      <AnimatePresence>
        {isFriendsActivityOpen && (
          <FriendsActivity onClose={() => setIsFriendsActivityOpen(false)} />
        )}
      </AnimatePresence>
      
      <MiniPlayer />
      <FullPlayerOverlay />
    </div>
  );
}
