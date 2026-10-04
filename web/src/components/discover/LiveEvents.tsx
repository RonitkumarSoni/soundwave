import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Ticket } from 'lucide-react';

const EVENTS = [
  { id: 1, artist: 'The Weeknd', venue: 'Wembley Stadium', city: 'London, UK', date: 'Aug 18, 2026', time: '19:00', image: 'https://images.unsplash.com/photo-1540039155732-d674d1e2eb0b?w=500&q=80', countdownDate: new Date(Date.now() + 86400000 * 12) },
  { id: 2, artist: 'Taylor Swift', venue: 'MetLife Stadium', city: 'New York, USA', date: 'Sept 5, 2026', time: '20:00', image: 'https://images.unsplash.com/photo-1470229722913-7c090be18b44?w=500&q=80', countdownDate: new Date(Date.now() + 86400000 * 25) },
];

export default function LiveEvents() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCountdown = (target: Date) => {
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Live Events <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EVENTS.map((event, i) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col md:flex-row group hover:shadow-2xl transition-all duration-300 hover:border-white/20"
          >
            <div className="w-full md:w-48 h-48 relative overflow-hidden flex-shrink-0">
              <img src={event.image} alt={event.artist} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:hidden" />
              <div className="absolute bottom-4 left-4 md:hidden">
                <h3 className="text-white font-black text-2xl">{event.artist}</h3>
              </div>
            </div>
            
            <div className="p-6 flex flex-col justify-between flex-1 bg-gradient-to-br from-surface to-surface-light">
              <div>
                <h3 className="text-white font-black text-xl mb-3 hidden md:block">{event.artist}</h3>
                <div className="flex flex-col gap-2 text-text-secondary text-sm">
                  <span className="flex items-center gap-2"><MapPin size={16} className="text-accent-blue" /> {event.venue}, {event.city}</span>
                  <span className="flex items-center gap-2"><Calendar size={16} className="text-accent-orange" /> {event.date}</span>
                  <span className="flex items-center gap-2"><Clock size={16} className="text-accent-purple" /> {event.time}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <div className="font-mono text-sm font-bold text-accent-green">
                  {getCountdown(event.countdownDate)}
                </div>
                <button className="bg-white text-black font-bold text-sm px-4 py-2 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-md">
                  <Ticket size={16} /> Buy Ticket
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
