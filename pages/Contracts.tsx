import React, { useState } from 'react';
import { Contract } from '../types';
import { EventAnalytics } from '../components/EventAnalytics';
import { useConfirmation } from '../hooks/useConfirmation.tsx';

interface ContractsDashboardProps {
  contracts: Contract[];
  loading: boolean;
  onDelete: (id: string) => Promise<boolean | void>;
  onEdit: (contract: Contract) => void;
  darkMode: boolean;
}

export const ContractsDashboard: React.FC<ContractsDashboardProps> = ({
  contracts,
  loading,
  onDelete,
  onEdit,
  darkMode,
}) => {
  const [eventFilter, setEventFilter] = useState<string>('');
  const { confirm, ConfirmationDialog } = useConfirmation();

  const handleDelete = async (id: string) => {
    confirm({
      title: 'Vertrag löschen?',
      message: 'Möchten und Sie diesen Vertrag wirklich unwiderruflich löschen?',
      confirmText: 'Löschen',
      isDestructive: true,
      onConfirm: async () => {
        await onDelete(id);
      },
    });
  };

  // Get unique events for filter
  const uniqueEvents = Array.from(
    new Set(contracts.map((c) => c.assigned_event).filter(Boolean))
  ) as string[];

  const filteredContracts = eventFilter
    ? contracts.filter((c) => c.assigned_event === eventFilter)
    : contracts;

  const totalCost = filteredContracts.reduce((acc, c) => acc + c.amount, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-32 rounded-3xl bg-gray-200 dark:bg-white/5"></div>
        <div className="h-64 rounded-3xl bg-gray-200 dark:bg-white/5"></div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <h2 className="mb-2 text-4xl font-black tracking-tight text-k5-deepBlue dark:text-white">
            Vertrags-Management
          </h2>
          <p className="font-medium leading-relaxed text-k5-sand dark:text-k5-sand/80">
            Locations, Dienstleister und Event-Kosten im Überblick.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        <div className="rounded-3xl border border-k5-sand/10 bg-white p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
            Anzahl Verträge
          </h3>
          <p className="text-3xl font-black text-k5-deepBlue dark:text-white">
            {filteredContracts.length}
          </p>
        </div>
        <div className="rounded-3xl border border-k5-sand/10 bg-white p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
            Gesamtkosten (Auswahl)
          </h3>
          <p className="text-3xl font-black text-k5-digitalBlue">{totalCost.toFixed(2)} €</p>
        </div>
        <div className="rounded-3xl border border-k5-sand/10 bg-white p-6 shadow-lg backdrop-blur-sm dark:border-white/10 dark:bg-k5-deepBlue">
          <h3 className="mb-2 text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
            Events
          </h3>
          <p className="text-3xl font-black text-k5-lime">{uniqueEvents.length}</p>
        </div>
      </div>

      {/* Event Analytics Chart */}
      <EventAnalytics contracts={contracts} selectedEvent={eventFilter} darkMode={darkMode} />

      {/* Filter Bar */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border border-k5-sand/10 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-white/5">
        <span className="text-xs font-bold uppercase tracking-wider text-k5-sand">Filter:</span>
        <select
          className="rounded-lg border border-k5-sand/20 bg-white px-3 py-1.5 text-xs font-bold text-k5-deepBlue outline-none focus:ring-2 focus:ring-k5-digitalBlue/20 dark:border-white/10 dark:bg-k5-deepBlue dark:text-white"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          <option value="">Alle Events</option>
          {uniqueEvents.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
        {eventFilter && (
          <button
            onClick={() => setEventFilter('')}
            className="text-xs font-bold text-red-500 hover:text-red-600"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-k5-sand/10 bg-white/50 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-k5-deepBlue">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-k5-sand/10 bg-k5-sand/5 text-[10px] uppercase tracking-widest text-k5-sand dark:border-white/5 dark:bg-white/5 dark:text-k5-sand/80">
                <th className="px-6 py-4 font-black">Partner</th>
                <th className="px-6 py-4 font-black">Event</th>
                <th className="px-6 py-4 font-black">Kategorie</th>
                <th className="px-6 py-4 font-black">Zyklus</th>
                <th className="px-6 py-4 text-right font-black">Betrag</th>
                <th className="px-6 py-4 text-right font-black">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-k5-sand/10 dark:divide-white/5">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-k5-sand">
                    Keine Verträge gefunden.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="group transition-colors hover:bg-k5-digitalBlue/5 dark:hover:bg-white/5"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-bold text-k5-deepBlue dark:text-white">
                        {contract.provider}
                      </div>
                      <div className="text-xs text-k5-sand">{contract.description}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {contract.assigned_event ? (
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                          {contract.assigned_event}
                        </span>
                      ) : (
                        <span className="text-xs text-k5-sand/50">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-xs font-medium text-k5-deepBlue dark:text-k5-sand/80">
                        {contract.category}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-xs font-medium capitalize text-k5-deepBlue dark:text-k5-sand/80">
                        {contract.billing_cycle.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <span className="font-bold text-k5-digitalBlue">
                        {contract.amount.toFixed(2)} €
                      </span>
                    </td>
                    <td className="flex items-center justify-end gap-2 whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => onEdit(contract)}
                        className="rounded-lg p-2 text-k5-sand transition-colors hover:bg-white/5 hover:text-k5-digitalBlue"
                        title="Bearbeiten"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(contract.id)}
                        className="rounded-lg p-2 text-k5-sand transition-colors hover:bg-white/5 hover:text-red-500"
                        title="Löschen"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationDialog />
    </div>
  );
};
