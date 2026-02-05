import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CostHistoryEntry, SubscriptionStatus } from '../types';

interface CostHistoryChartProps {
  history: CostHistoryEntry[];
  darkMode: boolean;
}

export const CostHistoryChart: React.FC<CostHistoryChartProps> = ({ history, darkMode }) => {
  // Daten für Chart aufbereiten
  // Wir nutzen eine "Carry-Forward"-Logik: Für jeden Monat wird der letzte bekannte Stand
  // jedes Tools genommen und aufsummiert.
  const chartData = React.useMemo(() => {
    if (!history || history.length === 0) return [];

    // 1. Alle einzigartigen Subscription IDs finden
    const subIds = Array.from(new Set(history.map((h) => h.subscription_id)));

    // 2. Zeitrahmen bestimmen (von erstem Eintrag bis heute)
    const timestamps = history.map((h) => new Date(h.recorded_at).getTime());
    const firstDate = new Date(Math.min(...timestamps));
    const now = new Date();

    // Start auf den 1. des Start-Monats setzen
    let currentIter = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    const months: Date[] = [];

    // Bis zum aktuellen Monat iterieren
    while (currentIter <= now) {
      months.push(new Date(currentIter));
      currentIter.setMonth(currentIter.getMonth() + 1);
    }

    // Wenn nur ein Monat da ist (Startmonat == Jetzt), füge keinen zweiten hinzu,
    // aber stelle sicher, dass wir mindestens einen Punkt haben.

    // 3. Datenpunkte generieren
    return months.map((month) => {
      // Das Ende des Monats nehmen, um alle Änderungen DIESES Monats mitzunehmen
      const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

      let totalMonthlyCost = 0;

      subIds.forEach((subId) => {
        // Finde den LETZTEN Eintrag für dieses Tool VOR dem Monatsende
        const validEntries = history.filter(
          (h) =>
            h.subscription_id === subId && new Date(h.recorded_at).getTime() <= endOfMonth.getTime()
        );

        if (validEntries.length > 0) {
          // Sortiere nach Datum absteigend -> Neuster Eintrag zuerst
          validEntries.sort(
            (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
          );
          const lastEntry = validEntries[0];

          // Nur addieren wenn aktiv
          if (
            lastEntry.status === SubscriptionStatus.ACTIVE ||
            lastEntry.status === SubscriptionStatus.TRIAL
          ) {
            totalMonthlyCost += lastEntry.monthly_cost;
          }
        }
      });

      return {
        date: month.toISOString(),
        formattedDate: month.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
        cost: totalMonthlyCost,
      };
    });
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-k5-sand/10 bg-white/5 p-8 text-center dark:border-white/5">
        <p className="text-sm font-medium text-k5-sand dark:text-k5-sand/60">
          Noch keine historischen Daten verfügbar.
          <br />
          <span className="text-xs opacity-70">
            Daten werden automatisch gesammelt, wenn du Tools aktualisierst.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4FF00" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
            vertical={false}
          />
          <XAxis
            dataKey="formattedDate"
            stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke={darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `${value}€`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: darkMode ? '#1A1A1A' : '#FFFFFF',
              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
            formatter={(value: number) => [`${value.toFixed(2)} €`, 'Kosten']}
            labelStyle={{ color: darkMode ? '#fff' : '#000', marginBottom: '0.25rem' }}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#D4FF00"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
