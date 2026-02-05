import React, { useState, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { OnboardingTour } from './components/OnboardingTour';
import { useDarkMode } from './hooks/useDarkMode';
import { useSubscriptions } from './hooks/useSubscriptions';
import { useContracts } from './hooks/useContracts';
import { useEvents } from './hooks/useEvents';
import { Subscription, Contract } from './types';
import { auditStack } from './services/geminiService';
import { exportToCSV } from './utils/exportCSV';
import { exportContractsToCSV } from './utils/exportContractsCSV';

// Pages
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/History';
import { ContractsDashboard } from './pages/Contracts';
import { AddContractModal } from './components/AddContractModal';
import { AddEventModal } from './components/AddEventModal';

// Lazy loaded modals
const AddToolModal = lazy(() =>
  import('./components/AddToolModal').then((module) => ({ default: module.AddToolModal }))
);
const StackAuditModal = lazy(() =>
  import('./components/StackAuditModal').then((module) => ({ default: module.StackAuditModal }))
);

// Navigation Component
const HeaderContent: React.FC<{
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  onRunAudit: () => void;
  onExport: (type: 'tools' | 'contracts') => void;
  onOpenAddToolModal: () => void;
  onOpenAddContractModal: () => void;
  onOpenAddEventModal: () => void;
}> = ({
  darkMode,
  setDarkMode,
  onRunAudit,
  onExport,
  onOpenAddToolModal,
  onOpenAddContractModal,
  onOpenAddEventModal,
}) => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const isHistory = location.pathname === '/history';
  const isContracts = location.pathname === '/contracts';

  const navLinkClass = (isActive: boolean) =>
    `relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
      isActive
        ? 'text-white bg-white/10 shadow-inner'
        : 'text-white/60 hover:text-white hover:bg-white/5'
    }`;

  const navIndicator = (
    <div className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-k5-lime shadow-[0_0_8px_#ccff00]"></div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-k5-digitalBlue/20 bg-k5-deepBlue shadow-xl shadow-k5-deepBlue/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Left: Branding & Navigation combined */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img src="/logo-white.png" alt="K5 Logo" className="h-7 w-auto object-contain" />
            <div className="hidden h-6 w-px bg-white/10 sm:block"></div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black uppercase leading-none tracking-tighter text-white">
                SaaSStack
              </h1>
            </div>
          </Link>

          {/* Navigation - Segmented Control Style */}
          <nav className="hidden rounded-2xl border border-white/5 bg-black/20 p-1 backdrop-blur-sm md:flex">
            <Link to="/" className={navLinkClass(isDashboard)}>
              Tools
              {isDashboard && navIndicator}
            </Link>
            <Link to="/contracts" className={navLinkClass(isContracts)}>
              Verträge
              {isContracts && navIndicator}
            </Link>
            <Link to="/history" className={navLinkClass(isHistory)}>
              Historie
              {isHistory && navIndicator}
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Contextual Actions */}
          {(isDashboard || isHistory || isContracts) && (
            <div className="mr-2 flex items-center gap-2 border-r border-white/10 pr-4">
              {isDashboard && (
                <button
                  onClick={onRunAudit}
                  className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex"
                  title="KI Stack Audit"
                >
                  <span className="text-sm">✨</span>
                </button>
              )}
              <button
                onClick={() => onExport(isContracts ? 'contracts' : 'tools')}
                className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex"
                title="CSV Export"
              >
                <span className="text-sm">📊</span>
              </button>
            </div>
          )}

          {isContracts && (
            <div className="mr-2 flex items-center gap-2 border-r border-white/10 pr-4">
              <button
                onClick={onOpenAddEventModal}
                className="hidden items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:flex"
                title="Event hinzufügen"
              >
                <span>📅</span>
                <span>Event</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="rounded-xl p-2 text-white/60 transition-all hover:bg-white/10 hover:text-white"
            title="Dark Mode"
          >
            {darkMode ? '🌙' : '☀️'}
          </button>

          {/* Primary Action Button - Changes based on Page */}
          {isDashboard && (
            <button
              onClick={onOpenAddToolModal}
              className="k5-glow-blue flex items-center gap-2 rounded-xl bg-k5-digitalBlue px-5 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-k5-digitalBlue/20 transition-all hover:brightness-110"
            >
              <span>+ Tool</span>
            </button>
          )}

          {isContracts && (
            <button
              onClick={onOpenAddContractModal}
              className="flex items-center gap-2 rounded-xl bg-k5-lime px-5 py-2 text-[10px] font-black uppercase tracking-widest text-k5-deepBlue shadow-lg shadow-k5-lime/20 transition-all hover:brightness-110"
            >
              <span>+ Vertrag</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  // Custom Hooks
  const [darkMode, setDarkMode] = useDarkMode();

  // Tools Logic
  const {
    subscriptions,
    loading: loadingTools,
    loadData: loadTools,
    handleAdd,
    handleUpdate: updateSubscription,
    handleDelete: deleteSubscription,
    handleBulkDelete: bulkDeleteSubscriptions,
    handleBulkUpdate: bulkUpdateSubscriptions,
  } = useSubscriptions();

  // Contracts & Events Logic
  const {
    contracts,
    categories,
    loading: loadingContracts,
    loadContracts,
    handleAddContract,
    handleDeleteContract,
    handleUpdateContract,
    handleAddCategory,
  } = useContracts();

  const { events, loadEvents, handleAddEvent } = useEvents();

  // Load data on mount
  useEffect(() => {
    loadTools();
    loadContracts();
    loadEvents();
  }, []);

  // State
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Subscription | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const handleRunAudit = async () => {
    if (subscriptions.length === 0) {
      toast.warning('Fügen Sie zuerst Tools hinzu, um eine Analyse zu starten.');
      return;
    }
    setIsAuditModalOpen(true);
    setLoadingAudit(true);
    const result = await auditStack(subscriptions);
    setAuditResult(result ?? null);
    setLoadingAudit(false);
  };

  const handleExport = (type: 'tools' | 'contracts') => {
    if (type === 'contracts') {
      exportContractsToCSV(contracts);
      toast.success('Verträge exportiert');
    } else {
      exportToCSV(subscriptions);
      toast.success('CSV Export erfolgreich');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Subscription>) => {
    await updateSubscription(id, updates);
    setEditingTool(null);
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingTool(subscription);
    setIsToolModalOpen(true);
  };

  const handleCloseToolModal = () => {
    setIsToolModalOpen(false);
    setEditingTool(null);
  };

  return (
    <Router>
      <div className="min-h-screen">
        <Toaster richColors position="top-right" theme={darkMode ? 'dark' : 'light'} />
        <OnboardingTour />
        <HeaderContent
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onRunAudit={handleRunAudit}
          onExport={handleExport}
          onOpenAddToolModal={() => setIsToolModalOpen(true)}
          onOpenAddContractModal={() => setIsContractModalOpen(true)}
          onOpenAddEventModal={() => setIsEventModalOpen(true)}
        />

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  subscriptions={subscriptions}
                  loading={loadingTools}
                  darkMode={darkMode}
                  onDelete={async (id) => {
                    await deleteSubscription(id);
                  }}
                  onBulkDelete={bulkDeleteSubscriptions}
                  onBulkUpdate={bulkUpdateSubscriptions}
                  onEdit={handleEdit}
                  loadData={loadTools}
                />
              }
            />
            <Route path="/history" element={<HistoryPage darkMode={darkMode} />} />
            <Route
              path="/contracts"
              element={
                <ContractsDashboard
                  contracts={contracts}
                  loading={loadingContracts}
                  onDelete={handleDeleteContract}
                  onEdit={(contract) => {
                    setEditingContract(contract);
                    setIsContractModalOpen(true);
                  }}
                  darkMode={darkMode}
                />
              }
            />
          </Routes>
        </main>

        <Suspense fallback={null}>
          <AddToolModal
            isOpen={isToolModalOpen}
            onClose={handleCloseToolModal}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            initialData={editingTool}
          />
        </Suspense>

        <AddContractModal
          isOpen={isContractModalOpen}
          onClose={() => {
            setIsContractModalOpen(false);
            setEditingContract(null);
          }}
          onAdd={async (c) => {
            await handleAddContract(c);
          }}
          onUpdate={handleUpdateContract}
          initialData={editingContract}
          events={events}
          categories={categories}
          onAddCategory={handleAddCategory}
        />

        <AddEventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onAdd={handleAddEvent}
        />

        <Suspense fallback={null}>
          <StackAuditModal
            isOpen={isAuditModalOpen}
            onClose={() => setIsAuditModalOpen(false)}
            result={auditResult}
            loading={loadingAudit}
          />
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
