
import React, { useState, useMemo, useEffect } from 'react';
import { Subscription, SubscriptionStatus, Stats, TOOL_CATEGORIES, OWNERS } from './types';
import { databaseService } from './services/databaseService';
import { StatsCards } from './components/StatsCards';
import { SubscriptionTable } from './components/SubscriptionTable';
import { AddToolModal } from './components/AddToolModal';
import { OnboardingTour } from './components/OnboardingTour';
import { Analytics } from './components/Analytics';
import { StackAuditModal } from './components/StackAuditModal';
import { ConfirmationModal } from './components/ConfirmationModal';
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDestructive: false
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      const toolName = (s.name || '').toLowerCase();
      const toolCategory = (s.category || '').toLowerCase();
      const toolOwner = (s.owner || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch = toolName.includes(search) ||
        toolCategory.includes(search) ||
        toolOwner.includes(search);

      let matchesTab = true;
      if (activeTab === 'Aktiv') matchesTab = s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL;
      if (activeTab === 'Inaktiv') matchesTab = s.status === SubscriptionStatus.INACTIVE;
      if (activeTab === 'Demnächst fällig') {
        const renewal = new Date(s.renewalDate);
        matchesTab = renewal >= now && renewal <= sevenDaysFromNow;
      }

      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(s.category);

      let matchesOwner = selectedOwners.length === 0;
      if (!matchesOwner) {
        matchesOwner = selectedOwners.some(owner => {
          if (owner === 'Vivien Hennig') return s.owner === 'Vivien Hennig' || s.owner === 'Vivi';
          return s.owner === owner;
        });
      }

      return matchesSearch && matchesTab && matchesCategory && matchesOwner;
    });
  }, [subscriptions, searchTerm, activeTab, selectedCategories, selectedOwners]);

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

  const handleDelete = (id: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Tool entfernen',
      message: 'Möchten Sie dieses Tool wirklich aus dem Stack entfernen? Diese Aktion kann nicht rückgängig gemacht werden.',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await databaseService.remove(id);
          setSubscriptions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
          alert("Löschen fehlgeschlagen");
        }
      }
    });
  };

  const handleEdit = (sub: Subscription) => {
    setEditingTool(sub);
    setIsModalOpen(true);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    setConfirmation({
      isOpen: true,
      title: 'Tools entfernen',
      message: `${selectedIds.length} Tools wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      isDestructive: true,
      onConfirm: async () => {
        try {
          await Promise.all(selectedIds.map(id => databaseService.remove(id)));
          setSubscriptions(prev => prev.filter(s => !selectedIds.includes(s.id)));
          setSelectedIds([]);
        } catch (err) {
          alert("Fehler beim Bulk-Löschen");
        }
      }
    });
  };

  const handleBulkUpdate = async (updates: Partial<Subscription>) => {
    try {
      const updatedTools = await Promise.all(selectedIds.map(id => databaseService.update(id, updates)));
      setSubscriptions(prev => prev.map(s => {
        const updated = updatedTools.find(u => u.id === s.id);
        return updated ? updated : s;
      }));
      setSelectedIds([]);
    } catch (err) {
      alert("Fehler beim Bulk-Update");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTool(null);
  };

  const tabs: FilterTab[] = ['Alle', 'Aktiv', 'Inaktiv', 'Demnächst fällig'];

  return (
    <div className="min-h-screen">
      <OnboardingTour />
      <header id="header" className="bg-k5-deepBlue border-b border-k5-digitalBlue/20 sticky top-0 z-40 shadow-xl shadow-k5-deepBlue/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-white.png" alt="K5 Logo" className="h-8 w-auto object-contain" />
            <div className="h-8 w-px bg-white/10 hidden sm:block"></div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">SaaSStack</h1>
              <p className="text-[10px] text-k5-digitalBlueLight uppercase tracking-[0.2em] font-bold">Integrierte Tool-Intelligenz</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all text-white shadow-lg"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleRunAudit}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-k5-lime hover:text-k5-deepBlue border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-lg"
            >
              <span>✨ Stack Audit</span>
            </button>

            <button
              id="add-button"
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-k5-lime text-k5-deepBlue rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-k5-lime/20 k5-glow-blue"
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
            <h2 className="text-4xl font-black text-k5-deepBlue dark:text-white tracking-tight mb-2">Bestandsübersicht</h2>
            <p className="text-k5-sand dark:text-k5-sand/80 font-medium leading-relaxed">Zentrales Management aller Unternehmens-Lizenzen. Vollautomatisch synchronisiert.</p>
          </div>
        </div>

        <StatsCards stats={stats} />

        <Analytics subscriptions={subscriptions} darkMode={darkMode} />

        <div className="mb-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex bg-k5-sand/10 p-1.5 rounded-2xl">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab
                    ? 'bg-k5-deepBlue dark:bg-k5-digitalBlue text-white shadow-lg k5-glow-blue'
                    : 'text-k5-deepBlue/50 dark:text-white/50 hover:text-k5-deepBlue dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
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
              <span className="text-xs font-bold text-k5-sand dark:text-k5-sand/80 uppercase tracking-widest">{filteredSubs.length} Tools</span>
              <button onClick={loadData} className="p-2 text-k5-digitalBlue dark:text-k5-digitalBlueLight hover:bg-k5-digitalBlue/5 dark:hover:bg-k5-digitalBlueLight/10 rounded-full transition-all">
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div id="search-filter" className="flex flex-wrap gap-4 items-center bg-gray-50/50 dark:bg-black/20 p-6 rounded-3xl border border-k5-sand/10 dark:border-white/5 shadow-inner">
            <div className="flex-1 min-w-[300px] relative group">
              <input
                type="text"
                placeholder="Suche nach Name, Inhaber oder Kategorie... (⌘+K)"
                className="pl-12 pr-4 py-4 bg-white dark:bg-k5-deepBlue border border-k5-sand/30 dark:border-white/10 rounded-2xl text-base focus:ring-4 focus:ring-k5-digitalBlue/20 outline-none w-full shadow-sm transition-all font-bold text-k5-deepBlue dark:text-white placeholder:text-k5-sand/40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="w-6 h-6 text-k5-sand group-focus-within:text-k5-digitalBlue absolute left-4 top-1/2 -translate-y-1/2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex gap-2 p-1.5 bg-white dark:bg-k5-deepBlue border border-k5-sand/20 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto max-w-md">
                <select
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-k5-sand outline-none px-2 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value && !selectedCategories.includes(e.target.value)) {
                      setSelectedCategories([...selectedCategories, e.target.value]);
                    }
                  }}
                  value=""
                >
                  <option value="">+ Kategorie</option>
                  {TOOL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {selectedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-k5-digitalBlue/10 dark:bg-k5-digitalBlue/20 text-k5-digitalBlue dark:text-k5-digitalBlueLight rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                  >
                    {cat} <span>✕</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2 p-1.5 bg-white dark:bg-k5-deepBlue border border-k5-sand/20 dark:border-white/10 rounded-2xl shadow-sm overflow-x-auto max-w-md">
                <select
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-k5-sand outline-none px-2 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.value && !selectedOwners.includes(e.target.value)) {
                      setSelectedOwners([...selectedOwners, e.target.value]);
                    }
                  }}
                  value=""
                >
                  <option value="">+ Owner</option>
                  {OWNERS.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
                {selectedOwners.map(owner => (
                  <button
                    key={owner}
                    onClick={() => setSelectedOwners(selectedOwners.filter(o => o !== owner))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-k5-lime/10 dark:bg-k5-lime/20 text-green-700 dark:text-k5-lime rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all"
                  >
                    {owner} <span>✕</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={loading ? 'opacity-40 pointer-events-none' : ''}>
          <SubscriptionTable
            subscriptions={filteredSubs}
            onDelete={handleDelete}
            onEdit={handleEdit}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onSelectAll={setSelectedIds}
          />
        </div>
      </main>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-k5-deepBlue dark:bg-k5-digitalBlue text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border border-white/20 backdrop-blur-xl">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Ausgewählt</span>
              <span className="text-xl font-black">{selectedIds.length} Tools</span>
            </div>

            <div className="h-10 w-px bg-white/20"></div>

            <div className="flex gap-4">
              <div className="flex bg-white/10 p-1 rounded-xl">
                <select
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none px-2 cursor-pointer"
                  onChange={(e) => handleBulkUpdate({ status: e.target.value as SubscriptionStatus })}
                  value=""
                >
                  <option value="" className="text-k5-deepBlue">Status ändern</option>
                  {Object.values(SubscriptionStatus).map(s => <option key={s} value={s} className="text-k5-deepBlue">{s}</option>)}
                </select>

                <select
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest text-white outline-none px-2 cursor-pointer"
                  onChange={(e) => handleBulkUpdate({ owner: e.target.value })}
                  value=""
                >
                  <option value="" className="text-k5-deepBlue">Owner ändern</option>
                  {OWNERS.map(o => <option key={o} value={o} className="text-k5-deepBlue">{o}</option>)}
                </select>
              </div>

              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-red-500/50"
              >
                Löschen
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

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
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
        isDestructive={confirmation.isDestructive}
      />
    </div>
  );
};

export default App;
