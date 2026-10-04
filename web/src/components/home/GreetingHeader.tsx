import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Crown, Settings, Moon, Sun } from 'lucide-react';

export default function GreetingHeader() {
  const [greeting, setGreeting] = useState('');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
    >
      <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
        {greeting}
      </h1>

      {/* Actions removed as they are now handled by global TopNav */}
    </motion.div>
  );
}
