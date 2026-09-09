import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Shield, Volume2, HardDrive, Monitor, Moon, Key, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Settings() {
  const { user } = useAuthStore();

  const settingSections = [
    {
      title: 'Account',
      icon: <Key className="text-[#8B5CF6]" size={20} />,
      items: [
        { label: 'Email Address', value: user?.email || 'Not provided', type: 'text' },
        { label: 'Subscription', value: 'Premium Member', type: 'badge' },
        { label: 'Payment Method', value: 'Visa ending in 4242', type: 'text' },
      ]
    },
    {
      title: 'Audio Quality',
      icon: <Volume2 className="text-[#8B5CF6]" size={20} />,
      items: [
        { label: 'Streaming Quality', value: 'Very High (320kbps)', type: 'select' },
        { label: 'Download Quality', value: 'Lossless (FLAC)', type: 'select' },
        { label: 'Normalize Volume', value: true, type: 'toggle' },
      ]
    },
    {
      title: 'Appearance',
      icon: <Moon className="text-[#8B5CF6]" size={20} />,
      items: [
        { label: 'Theme', value: 'Dark Mode', type: 'select' },
        { label: 'Hardware Acceleration', value: true, type: 'toggle' },
        { label: 'Reduce Motion', value: false, type: 'toggle' },
      ]
    }
  ];

  return (
    <div className="relative min-h-full pb-24 overflow-x-hidden p-8">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#8B5CF6]/20 via-[#8B5CF6]/5 to-transparent -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 mt-8 mb-10">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
        >
          Settings
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 text-sm text-text-secondary"
        >
          <SettingsIcon size={16} className="text-[#8B5CF6]" />
          <span>Manage your Soundwave preferences</span>
        </motion.div>
      </div>

      <div className="max-w-4xl flex flex-col gap-8">
        {settingSections.map((section, idx) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-[#121212]/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md"
          >
            <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
              {section.icon}
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
            </div>
            
            <div className="divide-y divide-white/5">
              {section.items.map((item, itemIdx) => (
                <div key={itemIdx} className="px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium text-white/90">{item.label}</span>
                  
                  {item.type === 'text' && (
                    <span className="text-sm text-text-secondary">{item.value}</span>
                  )}
                  
                  {item.type === 'badge' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8B5CF6]/20 text-[#8B5CF6]">
                      {item.value}
                    </span>
                  )}
                  
                  {item.type === 'select' && (
                    <button className="text-sm text-text-secondary hover:text-white transition-colors flex items-center gap-2">
                      {item.value}
                      <span className="text-[10px]">▼</span>
                    </button>
                  )}
                  
                  {item.type === 'toggle' && (
                    <button 
                      className={`w-11 h-6 rounded-full relative transition-colors ${item.value ? 'bg-[#8B5CF6]' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.value ? 'left-6' : 'left-1'}`} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
