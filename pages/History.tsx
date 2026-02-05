import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CostHistoryEntry } from '../types';
import { costHistoryService } from '../services/costHistoryService';
import { CostHistoryChart } from '../components/CostHistoryChart';

interface HistoryPageProps {
  darkMode: boolean;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ darkMode }) => {
  const [history, setHistory] = useState<CostHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      const data = await costHistoryService.getAllHistory();
      setHistory(data);
      setLoading(false);
    };
    loadHistory();
  }, []);

  return (
    <div className="page-enter space-y-8">
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="rounded-xl border border-transparent bg-white/5 p-2 text-k5-sand transition-all hover:border-k5-deepBlue/10 hover:bg-white/10 hover:text-k5-deepBlue dark:hover:border-white/10 dark:hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-k5-deepBlue dark:text-white">
            Kostenentwicklung
          </h2>
          <p className="text-sm font-medium text-k5-sand dark:text-k5-sand/80">
            Historischer Verlauf deiner Ausgaben
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-k5-deepBlue/5 bg-white p-8 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue/50">
        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-k5-digitalBlue border-t-transparent"></div>
          </div>
        ) : (
          <CostHistoryChart history={history} darkMode={darkMode} />
        )}
      </div>
    </div>
  );
};
