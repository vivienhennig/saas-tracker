import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import { Subscription } from '../types';

interface AnalyticsProps {
  subscriptions: Subscription[];
  darkMode?: boolean;
}

export const Analytics: React.FC<AnalyticsProps> = ({ subscriptions, darkMode }) => {
  const categoryDataMap: Record<string, number> = {};
  subscriptions.forEach((sub) => {
    categoryDataMap[sub.category] = (categoryDataMap[sub.category] || 0) + sub.monthlyCost;
  });

  const categoryData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));
  const COLORS = darkMode
    ? ['#5c4aff', '#ccff00', '#00e5ff', '#ff00ff', '#ff3d71', '#00d68f'] // Neon: Electric Blue, Lime, Cyan, Magenta, Hot Pink, Mint
    : ['#052364', '#092AFF', '#E9FF86', '#C5B8AE', '#00a5e5', '#F3FCCF'];

  // Trend Chart Logic
  const months = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];
  const currentMonthIdx = new Date().getMonth();

  const trendData = Array.from({ length: 12 }, (_, i) => {
    const monthIdx = (currentMonthIdx + i) % 12;
    const monthName = months[monthIdx];

    const total = subscriptions.reduce((acc, sub) => {
      const renewalDate = new Date(sub.renewalDate);
      const renewalMonth = renewalDate ? renewalDate.getMonth() : 0;

      if (sub.billingCycle === 'yearly') {
        return monthIdx === renewalMonth ? acc + sub.yearlyCost : acc;
      } else {
        // Monthly or undefined (fallback to monthly)
        const usageDuration = sub.monthsPerYear || 12;
        if (usageDuration === 12) return acc + sub.monthlyCost;

        // Seasonal: check usageMonths if available
        if (sub.usageMonths && sub.usageMonths.length > 0) {
          return sub.usageMonths.includes(monthIdx) ? acc + sub.monthlyCost : acc;
        }

        // Fallback: assume usageDuration months starting from renewalMonth
        const monthDiff = (monthIdx - renewalMonth + 12) % 12;
        return monthDiff < usageDuration ? acc + sub.monthlyCost : acc;
      }
    }, 0);

    return { name: monthName, value: Math.round(total) };
  });

  return (
    <div id="analytics" className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-k5-digitalBlue/20 hover:shadow-xl dark:border-white/5 dark:from-black/40 dark:to-black/40 dark:hover:shadow-[0_0_20px_rgba(92,74,255,0.1)]">
        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-k5-sand dark:text-k5-sand/60">
          Verteilung nach Kategorien
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
                style={{
                  filter: darkMode ? 'drop-shadow(0 0 10px rgba(92, 74, 255, 0.4))' : 'none',
                }}
              >
                {categoryData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke={darkMode ? 'rgba(0,0,0,0.5)' : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  backgroundColor: darkMode ? '#0a0a0a' : 'white',
                  boxShadow: darkMode
                    ? '0 0 20px rgba(92, 74, 255, 0.2)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                  fontWeight: 'bold',
                  color: darkMode ? '#fff' : '#052364',
                }}
                itemStyle={{ color: darkMode ? '#fff' : '#052364' }}
                labelStyle={{ color: darkMode ? '#888' : '#052364' }}
                formatter={(value) => `${value} €`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="ml-1 text-xs font-bold text-k5-deepBlue dark:text-white/80">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-k5-digitalBlue/20 hover:shadow-xl dark:border-white/5 dark:from-black/40 dark:to-black/40 dark:hover:shadow-[0_0_20px_rgba(204,255,0,0.1)]">
        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-k5-sand dark:text-k5-sand/60">
          Einfluss der Top-Investitionen
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...subscriptions]
                .sort((a, b) => b.monthlyCost - a.monthlyCost)
                .slice(0, 5)
                .map((sub) => {
                  const catIndex = categoryData.findIndex((c) => c.name === sub.category);
                  const color =
                    catIndex >= 0
                      ? COLORS[catIndex % COLORS.length]
                      : darkMode
                        ? '#ccff00'
                        : '#092AFF';
                  return { ...sub, fill: color };
                })}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 11, fontWeight: 900, fill: darkMode ? '#fff' : '#052364' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'transparent' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  backgroundColor: darkMode ? '#0a0a0a' : 'white',
                  boxShadow: darkMode
                    ? '0 0 20px rgba(204, 255, 0, 0.2)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                  fontWeight: 'bold',
                }}
                itemStyle={{ color: darkMode ? '#ccff00' : '#052364' }}
                formatter={(value) => `${value} €`}
              />
              <Bar
                dataKey="monthlyCost"
                radius={[0, 8, 8, 0]}
                barSize={32}
                style={{
                  filter: darkMode ? 'drop-shadow(0 0 8px rgba(204, 255, 0, 0.5))' : 'none',
                }}
              >
                {
                  // We need to re-map the data here to render individual cells,
                  // but Recharts Bar can take data directly if we map it in the data prop and utilize Cell.
                  // Actually, simpler: map the data in the BarChart data prop (done above)
                  // and then use Cell mapped from that data.
                  [...subscriptions]
                    .sort((a, b) => b.monthlyCost - a.monthlyCost)
                    .slice(0, 5)
                    .map((sub, index) => {
                      const catIndex = categoryData.findIndex((c) => c.name === sub.category);
                      const color =
                        catIndex >= 0
                          ? COLORS[catIndex % COLORS.length]
                          : darkMode
                            ? '#ccff00'
                            : '#092AFF';
                      /* Use softer shadow for individual bars matching their color in dark mode? 
                         Currently style prop on Bar applies to all. We can't easily change filter per Cell in Recharts without custom shape.
                         Will stick to universal filter but correct fill color. */
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-k5-digitalBlue/20 hover:shadow-xl dark:border-white/5 dark:from-black/40 dark:to-black/40 dark:hover:shadow-[0_0_30px_rgba(0,229,255,0.1)] lg:col-span-2">
        <h3 className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-k5-sand dark:text-k5-sand/60">
          Kostentrend (Nächste 12 Monate)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={darkMode ? '#00e5ff' : '#092AFF'}
                    stopOpacity={0.3}
                  />
                  <stop offset="95%" stopColor={darkMode ? '#00e5ff' : '#092AFF'} stopOpacity={0} />
                </linearGradient>
                {darkMode && (
                  <filter id="neonGlow" height="200%" width="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                )}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(5,35,100,0.05)'}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#fff' : '#052364' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#fff' : '#052364' }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  backgroundColor: darkMode ? '#0a0a0a' : 'white',
                  boxShadow: darkMode
                    ? '0 0 20px rgba(0, 229, 255, 0.2)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                  fontWeight: 'bold',
                }}
                itemStyle={{ color: darkMode ? '#00e5ff' : '#052364' }}
                formatter={(value) => [`${value} €`, 'Gesamtkosten']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={darkMode ? '#00e5ff' : '#092AFF'}
                strokeWidth={4}
                fillOpacity={1}
                fill="url(#colorValue)"
                style={{ filter: darkMode ? 'url(#neonGlow)' : 'none' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
