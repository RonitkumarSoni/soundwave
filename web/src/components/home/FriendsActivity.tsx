import React from 'react';
import { UserPlus, Play, Circle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FRIENDS = [
  { id: 1, name: 'Alex Johnson', status: 'Listening to', track: 'Blinding Lights', artist: 'The Weeknd', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', active: true, time: 'Now' },
  { id: 2, name: 'Sarah Chen', status: 'Listening to', track: 'Levitating', artist: 'Dua Lipa', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', active: false, time: '2h' },
  { id: 3, name: 'Mike Ross', status: 'Listening to playlist', track: 'Deep Focus', artist: 'Spotify', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', active: true, time: 'Now' },
  { id: 4, name: 'Emma Wilson', status: 'Listening to', track: 'Cruel Summer', artist: 'Taylor Swift', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', active: false, time: '5h' },
];

interface FriendsActivityProps {
  onClose?: () => void;
}

export default function FriendsActivity({ onClose }: FriendsActivityProps) {
  return (
    <motion.aside 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden xl:flex w-72 bg-secondary border-l border-border h-full flex-col pt-6 pb-24 flex-shrink-0"
    >
      <div className="px-6 mb-6 flex items-center justify-between">
        <h2 className="text-white font-bold text-sm">Friends Activity</h2>
        <div className="flex items-center gap-3">
          <button className="text-text-secondary hover:text-white transition-colors" title="Add friend">
            <UserPlus size={18} />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-text-secondary hover:text-white transition-colors"
              title="Close Friends Activity"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar flex flex-col gap-6">
        {FRIENDS.map((friend) => (
          <div key={friend.id} className="flex gap-3 group cursor-pointer">
            <div className="relative flex-shrink-0">
              <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full bg-surface" />
              {friend.active && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-accent-green rounded-full border-2 border-secondary" />
              )}
            </div>
            
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-white text-sm font-semibold truncate group-hover:underline">{friend.name}</span>
                <span className="text-xs text-text-secondary flex-shrink-0">{friend.time}</span>
              </div>
              
              <div className="text-text-secondary text-xs truncate">
                <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                  {friend.active && <Play size={10} fill="currentColor" className="text-accent-green" />}
                  {friend.track}
                </span>
                <span className="block truncate opacity-80 flex items-center gap-1 mt-0.5">
                  <Circle size={4} fill="currentColor" /> {friend.artist}
                </span>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-8 p-4 bg-surface rounded-xl border border-border">
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            Connect with Facebook to see what your friends are playing.
          </p>
          <button className="w-full py-2 rounded-full border border-text-secondary hover:border-white text-white text-xs font-bold transition-colors">
            Connect
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
