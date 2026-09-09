import React from 'react';
import { motion } from 'framer-motion';

const CHARTS = [
  { id: 1, name: 'Top 50 - Global', desc: 'Your daily update of the most played tracks right now.', color: 'from-blue-600 to-blue-900' },
  { id: 2, name: 'Top 50 - USA', desc: 'Your daily update of the most played tracks in USA.', color: 'from-green-600 to-green-900' },
  { id: 3, name: 'Top 50 - India', desc: 'Your daily update of the most played tracks in India.', color: 'from-orange-600 to-orange-900' },
  { id: 4, name: 'Viral 50 - Global', desc: 'Your daily update of the most viral tracks right now.', color: 'from-purple-600 to-purple-900' },
];

export default function TopCharts() {
  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Top Charts</h2>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {CHARTS.map((chart, i) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer snap-start flex-shrink-0 w-72"
          >
            <div className={`aspect-square w-full rounded-2xl mb-4 overflow-hidden shadow-lg bg-gradient-to-br ${chart.color} p-6 flex flex-col justify-end group-hover:shadow-2xl transition-all duration-300 relative`}>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <h3 className="text-4xl font-black text-white leading-tight mb-2 relative z-10 drop-shadow-md">
                {chart.name.split(' - ')[0]}<br/>
                <span className="text-2xl text-white/80">{chart.name.split(' - ')[1]}</span>
              </h3>
            </div>
            <p className="text-text-secondary text-sm line-clamp-2 px-2">{chart.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
