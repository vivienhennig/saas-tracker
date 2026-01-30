
import React from 'react';
import { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Monatliche Ausgaben', value: `${(stats.totalMonthly || 0).toLocaleString('de-DE')} €`, color: 'text-k5-digitalBlue dark:text-[#5c4aff] dark:drop-shadow-[0_0_8px_rgba(92,74,255,0.8)]', glow: 'shadow-k5-digitalBlue/10 dark:shadow-[0_0_30px_-5px_rgba(92,74,255,0.3)] dark:border-[#5c4aff]/30' },
    { label: 'Jährliche Verpflichtung', value: `${(stats.totalYearly || 0).toLocaleString('de-DE')} €`, color: 'text-k5-deepBlue dark:text-white dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]', glow: 'shadow-k5-deepBlue/10 dark:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)] dark:border-white/20' },
    { label: 'Aktiver Stack', value: stats.activeTools, color: 'text-k5-digitalBlue dark:text-[#ccff00] dark:drop-shadow-[0_0_8px_rgba(204,255,0,0.8)]', glow: 'shadow-k5-digitalBlue/10 dark:shadow-[0_0_30px_-5px_rgba(204,255,0,0.3)] dark:border-[#ccff00]/30' },
    { label: 'Anstehende Verlängerungen', value: stats.upcomingRenewals, color: 'text-k5-sand dark:text-[#ff00ff] dark:drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]', glow: 'shadow-k5-sand/10 dark:shadow-[0_0_30px_-5px_rgba(255,0,255,0.3)] dark:border-[#ff00ff]/30' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {cards.map((card, i) => (
        <div key={i} className={`p-8 bg-gradient-to-br from-white to-k5-sand/5 dark:from-k5-deepBlue dark:to-k5-deepBlue border border-k5-deepBlue/5 dark:border-white/10 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-k5-digitalBlue/20 dark:hover:shadow-k5-digitalBlue/10 ${card.glow} ${i === 0 || i === 2 ? 'dark:k5-glow-blue' : ''}`}>
          <p className="text-[10px] font-black text-k5-sand dark:text-k5-sand/80 uppercase tracking-[0.2em] mb-3">{card.label}</p>
          <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};
