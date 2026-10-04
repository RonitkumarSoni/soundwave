import React from 'react';
import { motion } from 'framer-motion';

const MOODS = [
  { name: 'Happy', color: 'bg-yellow-500' },
  { name: 'Sad', color: 'bg-blue-600' },
  { name: 'Workout', color: 'bg-red-500' },
  { name: 'Party', color: 'bg-purple-500' },
  { name: 'Focus', color: 'bg-teal-600' },
  { name: 'Sleep', color: 'bg-indigo-800' },
  { name: 'Travel', color: 'bg-emerald-500' },
  { name: 'Romantic', color: 'bg-pink-500' },
  { name: 'Coding', color: 'bg-slate-700' },
  { name: 'Lo-fi', color: 'bg-orange-400' },
];

export default function MoodCategories() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Mood & Activities</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {MOODS.map((mood, i) => (
          <motion.div
            key={mood.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.05 }}
            className={`${mood.color} h-24 rounded-xl p-4 relative overflow-hidden cursor-pointer shadow-lg`}
          >
            <h3 className="text-white font-bold text-lg relative z-10 drop-shadow-md">{mood.name}</h3>
            {/* Decorative rotated square */}
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black/20 rotate-[25deg] rounded-lg shadow-xl" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
