
import React from 'react';
import { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Monatliche Ausgaben', value: `${(stats.totalMonthly || 0).toLocaleString('de-DE')} €`, color: 'text-k5-digitalBlue', glow: 'shadow-k5-digitalBlue/10' },
    { label: 'Jährliche Verpflichtung', value: `${(stats.totalYearly || 0).toLocaleString('de-DE')} €`, color: 'text-k5-deepBlue', glow: 'shadow-k5-deepBlue/10' },
    { label: 'Aktiver Stack', value: stats.activeTools, color: 'text-k5-digitalBlue', glow: 'shadow-k5-digitalBlue/10' },
    { label: 'Anstehende Verlängerungen', value: stats.upcomingRenewals, color: 'text-k5-sand', glow: 'shadow-k5-sand/10' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {cards.map((card, i) => (
        <div key={i} className={`p-8 bg-white border border-k5-sand/20 rounded-2xl shadow-sm transition-all hover:shadow-xl ${card.glow}`}>
          <p className="text-[10px] font-black text-k5-sand uppercase tracking-[0.2em] mb-3">{card.label}</p>
          <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
};
