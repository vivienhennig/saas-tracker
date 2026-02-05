import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Contract } from '../types';

interface EventAnalyticsProps {
  contracts: Contract[];
  selectedEvent?: string;
  darkMode: boolean;
}

export const EventAnalytics: React.FC<EventAnalyticsProps> = ({
  contracts,
  selectedEvent,
  darkMode,
}) => {
  console.log('EventAnalytics Render:', { contractsLength: contracts.length, selectedEvent });

  const chartData = useMemo(() => {
    // Scenario 1: No Event Selected -> Show Top Events by Cost
    if (!selectedEvent) {
      // Group by Event
      const eventCosts: Record<string, number> = {};
      contracts.forEach((c) => {
        const eventName = c.assigned_event || 'General / Other';
        eventCosts[eventName] = (eventCosts[eventName] || 0) + c.amount;
      });

      const data = Object.entries(eventCosts)
        .map(([name, cost]) => ({ name, cost }))
        .sort((a, b) => b.cost - a.cost);

      console.log('EventAnalytics Overview Data:', data);
      return data;
    }

    // Scenario 2: Event Selected -> Show Breakdown by Category
    else {
      const filtered = contracts.filter((c) => c.assigned_event === selectedEvent);
      const catCosts: Record<string, number> = {};

      filtered.forEach((c) => {
        catCosts[c.category] = (catCosts[c.category] || 0) + c.amount;
      });

      const data = Object.entries(catCosts)
        .map(([name, cost]) => ({ name, cost }))
        .sort((a, b) => b.cost - a.cost);

      console.log('EventAnalytics Detail Data:', data);
      return data;
    }
  }, [contracts, selectedEvent]);

  if (chartData.length === 0) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 mb-12 w-full duration-700">
        <div className="flex h-64 items-center justify-center rounded-3xl border border-k5-sand/10 bg-white p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue">
          <div className="text-center">
            <p className="mb-1 font-bold text-k5-deepBlue dark:text-white">
              Keine Daten für Analytics
            </p>
            <p className="text-sm text-k5-sand dark:text-k5-sand/60">
              Füge Verträge hinzu, um die Kostenanalyse zu sehen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom Colors
  const COLORS = ['#D4FF00', '#0099FF', '#9E9E9E', '#E0E0E0', '#666666'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mb-12 w-full duration-700">
      <div className="rounded-3xl border border-k5-sand/10 bg-white p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
              Analytics
            </h3>
            <p className="text-xl font-black text-k5-deepBlue dark:text-white">
              {selectedEvent ? `Kostenstruktur: ${selectedEvent}` : 'Kosten nach Events'}
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {!selectedEvent ? (
              // Bar Chart for Overview
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val}€`}
                  tick={{
                    fontSize: 10,
                    fill: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)} €`, 'Kosten']}
                  cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1A1A1A' : '#FFFFFF',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: darkMode ? '#fff' : '#000',
                  }}
                />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#D4FF00' : '#2A2A2A'} />
                    // Top cost is Lime, others Dark
                  ))}
                </Bar>
              </BarChart>
            ) : (
              // Bar Chart for Categories (easier to read levels than Pie sometimes, but let's stick to Bar for consistency)
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{
                    fontSize: 10,
                    fill: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  }}
                />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(2)} €`, 'Kosten']}
                  cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                  contentStyle={{
                    backgroundColor: darkMode ? '#1A1A1A' : '#FFFFFF',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
