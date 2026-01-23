
import React, { useState, useMemo, useEffect } from 'react';
import { Subscription, SubscriptionStatus, Stats } from './types';
import { databaseService } from './services/databaseService';
import { StatsCards } from './components/StatsCards';
import { SubscriptionTable } from './components/SubscriptionTable';
import { AddToolModal } from './components/AddToolModal';
import { Analytics } from './components/Analytics';
import { StackAuditModal } from './components/StackAuditModal';
import { auditStack } from './services/geminiService';

type FilterTab = 'Alle' | 'Aktiv' | 'Inaktiv' | 'Demnächst fällig';

const App: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Subscription | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Alle');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await databaseService.fetchAll();
      setSubscriptions(data);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo<Stats>(() => {
    const active = subscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = subscriptions.filter(s => {
      if (!s.renewalDate) return false;
      const renewal = new Date(s.renewalDate);
      return renewal >= now && renewal <= sevenDaysFromNow;
    });
    return {
      totalMonthly: subscriptions.reduce((acc, s) => acc + (s.monthlyCost || 0), 0),
      totalYearly: subscriptions.reduce((acc, s) => acc + (s.yearlyCost || 0), 0),
      activeTools: active.length,
      upcomingRenewals: upcoming.length
    };
  }, [subscriptions]);

  const handleRunAudit = async () => {
    if (subscriptions.length === 0) return alert("Fügen Sie zuerst Tools hinzu, um eine Analyse zu starten.");
    setIsAuditModalOpen(true);
    setLoadingAudit(true);
    const result = await auditStack(subscriptions);
    setAuditResult(result ?? null);
    setLoadingAudit(false);
  };

  const filteredSubs = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return subscriptions.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.owner && s.owner.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesTab = true;
      if (activeTab === 'Aktiv') matchesTab = s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL;
      if (activeTab === 'Inaktiv') matchesTab = s.status === SubscriptionStatus.INACTIVE;
      if (activeTab === 'Demnächst fällig') {
        const renewal = new Date(s.renewalDate);
        matchesTab = renewal >= now && renewal <= sevenDaysFromNow;
      }

      return matchesSearch && matchesTab;
    });
  }, [subscriptions, searchTerm, activeTab]);

  const handleAdd = async (newSub: Omit<Subscription, 'id'>) => {
    try {
      const added = await databaseService.add(newSub);
      setSubscriptions(prev => [added, ...prev]);
    } catch (err) {
      alert("Fehler beim Speichern");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Subscription>) => {
    try {
      const updated = await databaseService.update(id, updates);
      setSubscriptions(prev => prev.map(s => s.id === id ? updated : s));
      setEditingTool(null);
    } catch (err) {
      alert("Fehler beim Update");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tool aus dem Stack entfernen?')) {
      try {
        await databaseService.remove(id);
        setSubscriptions(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        alert("Löschen fehlgeschlagen");
      }
    }
  };

  const handleEdit = (sub: Subscription) => {
    setEditingTool(sub);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const tabs: FilterTab[] = ['Alle', 'Aktiv', 'Inaktiv', 'Demnächst fällig'];

  return (
    <div className="min-h-screen">
      <header className="bg-k5-deepBlue border-b border-k5-digitalBlue/20 sticky top-0 z-40 shadow-xl shadow-k5-deepBlue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-k5-glow-blue rounded-lg flex items-center justify-center shadow-lg shadow-k5-digitalBlue/30">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">K5 SaaSStack</h1>
              <p className="text-[10px] text-k5-digitalBlueLight uppercase tracking-[0.2em] font-bold">Integrierte Tool-Intelligenz</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRunAudit}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-k5-lime hover:text-k5-deepBlue border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-k5-lime shadow-lg"
            >
              <span>✨ Stack Audit</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-k5-lime text-k5-deepBlue rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-k5-lime/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
              <span>Neues Tool</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black text-k5-deepBlue tracking-tight mb-2">Bestandsübersicht</h2>
            <p className="text-k5-sand font-medium leading-relaxed">Zentrales Management aller Unternehmens-Lizenzen. Vollautomatisch synchronisiert.</p>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Suchen..."
              className="pl-11 pr-4 py-3 bg-white border border-k5-sand/30 rounded-xl text-sm focus:ring-2 focus:ring-k5-digitalBlue outline-none w-72 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-5 h-5 text-k5-sand absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <StatsCards stats={stats} />

        <Analytics subscriptions={subscriptions} />

        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex bg-k5-sand/10 p-1.5 rounded-2xl">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                    ? 'bg-k5-deepBlue text-white shadow-lg'
                    : 'text-k5-deepBlue/50 hover:text-k5-deepBlue hover:bg-white/50'
                  }`}
              >
                {tab}
                {tab === 'Demnächst fällig' && stats.upcomingRenewals > 0 && (
                  <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[8px] animate-pulse">
                    {stats.upcomingRenewals}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-k5-sand uppercase tracking-widest">{filteredSubs.length} Tools</span>
            <button onClick={loadData} className="p-2 text-k5-digitalBlue hover:bg-k5-digitalBlue/5 rounded-full transition-all">
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className={loading ? 'opacity-40 pointer-events-none' : ''}>
          <SubscriptionTable
            subscriptions={filteredSubs}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      </main>

      <AddToolModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        initialData={editingTool}
      />
      <StackAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={auditResult}
        loading={loadingAudit}
      />
    </div>
  );
};

export default App;
