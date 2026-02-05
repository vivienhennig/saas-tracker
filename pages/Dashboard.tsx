import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  Subscription,
  SubscriptionStatus,
  Stats,
  TOOL_CATEGORIES,
  OWNERS,
  PREDEFINED_TAGS,
} from '../types';
import { StatsCards } from '../components/StatsCards';
import { SubscriptionTable } from '../components/SubscriptionTable';
import { useConfirmation } from '../hooks/useConfirmation.tsx';
import { useFilters } from '../hooks/useFilters';
import { StatsCardSkeleton } from '../components/SkeletonLoader';

const Analytics = lazy(() =>
  import('../components/Analytics').then((module) => ({ default: module.Analytics }))
);

type FilterTab = 'Alle' | 'Aktiv' | 'Inaktiv' | 'Demnächst fällig';

interface DashboardProps {
  subscriptions: Subscription[];
  loading: boolean;
  darkMode: boolean;

  onDelete: (id: string) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkUpdate: (ids: string[], updates: Partial<Subscription>) => Promise<void>;
  onEdit: (subscription: Subscription) => void;
  loadData: () => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subscriptions,
  loading,
  darkMode,
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  onEdit,
  loadData,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { confirm, ConfirmationDialog } = useConfirmation();

  const {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    selectedCategories,
    setSelectedCategories,
    selectedOwners,
    setSelectedOwners,
    filteredSubs,
    selectedTags,
    setSelectedTags,
  } = useFilters(subscriptions);

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

  const stats = useMemo<Stats>(() => {
    const active = subscriptions.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL
    );
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = subscriptions.filter((s) => {
      if (!s.renewalDate) return false;
      const renewal = new Date(s.renewalDate);
      return renewal >= now && renewal <= sevenDaysFromNow;
    });
    return {
      totalMonthly: subscriptions.reduce((acc, s) => acc + (s.monthlyCost || 0), 0),
      totalYearly: subscriptions.reduce((acc, s) => acc + (s.yearlyCost || 0), 0),
      activeTools: active.length,
      upcomingRenewals: upcoming.length,
    };
  }, [subscriptions]);

  const handleDeleteClick = (id: string) => {
    confirm({
      title: 'Tool löschen?',
      message:
        'Möchten Sie dieses Tool wirklich entfernen? Alle historischen Daten bleiben erhalten.',
      confirmText: 'Löschen',
      isDestructive: true,
      onConfirm: async () => {
        await onDelete(id);
      },
    });
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    confirm({
      title: `${selectedIds.length} Tools löschen?`,
      message: 'Möchten Sie die ausgewählten Tools wirklich entfernen?',
      confirmText: 'Löschen',
      isDestructive: true,
      onConfirm: async () => {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
      },
    });
  };

  const handleBulkUpdate = async (updates: Partial<Subscription>) => {
    await onBulkUpdate(selectedIds, updates);
    setSelectedIds([]);
  };

  const tabs: FilterTab[] = ['Alle', 'Aktiv', 'Inaktiv', 'Demnächst fällig'];

  return (
    <div className="page-enter animate-in fade-in space-y-8 duration-500">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h2 className="mb-2 text-4xl font-black tracking-tight text-k5-deepBlue dark:text-white">
            Tool Übersicht
          </h2>
          <p className="font-medium leading-relaxed text-k5-sand dark:text-k5-sand/80">
            Zentrales Management aller Unternehmens-Lizenzen. Vollautomatisch synchronisiert.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}

      <Suspense
        fallback={
          <div className="mb-12 h-96 animate-pulse rounded-2xl bg-k5-sand/5 dark:bg-white/5" />
        }
      >
        <Analytics subscriptions={subscriptions} darkMode={darkMode} />
      </Suspense>

      <div className="mb-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex rounded-2xl bg-k5-sand/10 p-1.5">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'k5-glow-blue bg-k5-deepBlue text-white shadow-lg dark:bg-k5-digitalBlue'
                    : 'text-k5-deepBlue/50 hover:bg-white/50 hover:text-k5-deepBlue dark:text-white/50 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {tab}
                {tab === 'Demnächst fällig' && stats.upcomingRenewals > 0 && (
                  <span className="ml-2 animate-pulse rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white">
                    {stats.upcomingRenewals}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-k5-sand dark:text-k5-sand/80">
              {filteredSubs.length} Tools
            </span>
            <button
              onClick={loadData}
              className="rounded-full p-2 text-k5-digitalBlue transition-all hover:bg-k5-digitalBlue/5 dark:text-k5-digitalBlueLight dark:hover:bg-k5-digitalBlueLight/10"
            >
              <svg
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        <div
          id="search-filter"
          className="flex flex-wrap items-center gap-4 rounded-3xl border border-k5-sand/10 bg-gray-50/50 p-6 shadow-inner dark:border-white/5 dark:bg-black/20"
        >
          <div className="group relative min-w-[300px] flex-1">
            <input
              type="text"
              placeholder="Suche nach Name, Inhaber oder Kategorie... (⌘+K)"
              className="w-full rounded-2xl border border-k5-sand/30 bg-white py-4 pl-12 pr-4 text-base font-bold text-k5-deepBlue shadow-sm outline-none transition-all placeholder:text-k5-sand/40 focus:ring-4 focus:ring-k5-digitalBlue/20 dark:border-white/10 dark:bg-k5-deepBlue dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-k5-sand transition-colors group-focus-within:text-k5-digitalBlue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex max-w-md gap-2 overflow-x-auto rounded-2xl border border-k5-sand/20 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-k5-deepBlue">
              <select
                className="cursor-pointer bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-k5-sand outline-none"
                onChange={(e) => {
                  if (e.target.value && !selectedCategories.includes(e.target.value)) {
                    setSelectedCategories([...selectedCategories, e.target.value]);
                  }
                }}
                value=""
              >
                <option value="">+ Kategorie</option>
                {TOOL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategories(selectedCategories.filter((c) => c !== cat))}
                  className="flex items-center gap-1.5 rounded-lg bg-k5-digitalBlue/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-k5-digitalBlue transition-all hover:bg-red-500 hover:text-white dark:bg-k5-digitalBlue/20 dark:text-k5-digitalBlueLight"
                >
                  {cat} <span>✕</span>
                </button>
              ))}
            </div>

            <div className="flex max-w-md gap-2 overflow-x-auto rounded-2xl border border-k5-sand/20 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-k5-deepBlue">
              <select
                className="cursor-pointer bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-k5-sand outline-none"
                onChange={(e) => {
                  if (e.target.value && !selectedOwners.includes(e.target.value)) {
                    setSelectedOwners([...selectedOwners, e.target.value]);
                  }
                }}
                value=""
              >
                <option value="">+ Owner</option>
                {OWNERS.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
              {selectedOwners.map((owner) => (
                <button
                  key={owner}
                  onClick={() => setSelectedOwners(selectedOwners.filter((o) => o !== owner))}
                  className="flex items-center gap-1.5 rounded-lg bg-k5-lime/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-green-700 transition-all hover:bg-red-500 hover:text-white dark:bg-k5-lime/20 dark:text-k5-lime"
                >
                  {owner} <span>✕</span>
                </button>
              ))}
            </div>

            <div className="flex max-w-md gap-2 overflow-x-auto rounded-2xl border border-k5-sand/20 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-k5-deepBlue">
              <select
                className="cursor-pointer bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-k5-sand outline-none"
                onChange={(e) => {
                  if (e.target.value && !selectedTags.includes(e.target.value)) {
                    setSelectedTags([...selectedTags, e.target.value]);
                  }
                }}
                value=""
              >
                <option value="">+ Tag</option>
                {PREDEFINED_TAGS.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tag))}
                  className="flex items-center gap-1.5 rounded-lg bg-k5-digitalBlue/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-k5-digitalBlue transition-all hover:bg-red-500 hover:text-white dark:bg-k5-lime/20 dark:text-k5-lime"
                >
                  {tag} <span>✕</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={loading ? 'pointer-events-none opacity-40' : ''}>
        <SubscriptionTable
          subscriptions={filteredSubs}
          onDelete={handleDeleteClick}
          onEdit={onEdit}
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={setSelectedIds}
          loading={loading}
        />
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-50 -translate-x-1/2 duration-300">
          <div className="flex items-center gap-8 rounded-3xl border border-white/20 bg-k5-deepBlue px-8 py-4 text-white shadow-2xl backdrop-blur-xl dark:bg-k5-digitalBlue">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                Ausgewählt
              </span>
              <span className="text-xl font-black">{selectedIds.length} Tools</span>
            </div>

            <div className="h-10 w-px bg-white/20"></div>

            <div className="flex gap-4">
              <div className="flex rounded-xl bg-white/10 p-1">
                <select
                  className="cursor-pointer bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                  onChange={(e) =>
                    handleBulkUpdate({ status: e.target.value as SubscriptionStatus })
                  }
                  value=""
                >
                  <option value="" className="text-k5-deepBlue">
                    Status ändern
                  </option>
                  {Object.values(SubscriptionStatus).map((s) => (
                    <option key={s} value={s} className="text-k5-deepBlue">
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  className="cursor-pointer bg-transparent px-2 text-[10px] font-black uppercase tracking-widest text-white outline-none"
                  onChange={(e) => handleBulkUpdate({ owner: e.target.value })}
                  value=""
                >
                  <option value="" className="text-k5-deepBlue">
                    Owner ändern
                  </option>
                  {OWNERS.map((o) => (
                    <option key={o} value={o} className="text-k5-deepBlue">
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
              >
                Löschen
              </button>

              <button
                onClick={() => setSelectedIds([])}
                className="rounded-xl bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-white/20"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog />
    </div>
  );
};
