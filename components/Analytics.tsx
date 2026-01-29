
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Subscription } from '../types';

interface AnalyticsProps {
  subscriptions: Subscription[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ subscriptions }) => {
  const categoryDataMap: Record<string, number> = {};
  subscriptions.forEach(sub => {
    categoryDataMap[sub.category] = (categoryDataMap[sub.category] || 0) + sub.monthlyCost;
  });

  const categoryData = Object.entries(categoryDataMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#052364', '#092AFF', '#E9FF86', '#C5B8AE', '#00a5e5', '#F3FCCF'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      <div className="bg-white p-8 rounded-2xl border border-k5-sand/20 shadow-sm">
        <h3 className="text-[10px] font-black text-k5-sand uppercase tracking-[0.2em] mb-6">Verteilung nach Kategorien</h3>
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
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(5,35,100,0.1)', fontWeight: 'bold', color: '#052364' }}
                itemStyle={{ color: '#052364' }}
                formatter={(value) => `${value} €`}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => <span className="text-k5-deepBlue font-bold ml-1 text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-k5-sand/20 shadow-sm">
        <h3 className="text-[10px] font-black text-k5-sand uppercase tracking-[0.2em] mb-6">Einfluss der Top-Investitionen</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...subscriptions].sort((a, b) => b.monthlyCost - a.monthlyCost).slice(0, 5)}
              layout="vertical"
              margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 900, fill: '#052364' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(5,35,100,0.1)', fontWeight: 'bold', color: '#052364' }}
                itemStyle={{ color: '#052364' }}
                formatter={(value) => `${value} €`}
              />
              <Bar dataKey="monthlyCost" fill="#092AFF" radius={[0, 8, 8, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
