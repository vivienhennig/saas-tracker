import React from 'react';
import { Subscription, SubscriptionStatus } from '../types';

import { ToolIcon } from './ToolIcon';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onEdit: (sub: Subscription) => void;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
}

export const SubscriptionTable = React.memo<SubscriptionTableProps>(({
  subscriptions,
  onDelete,
  onEdit,
  selectedIds,
  onToggleSelection,
  onSelectAll,
}) => {
  const isUrgent = (dateStr: string) => {
    const now = new Date();
    const renewal = new Date(dateStr);
    const diff = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const getStatusStyle = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE:
        return 'bg-k5-lime text-k5-deepBlue dark:bg-[#ccff00]/20 dark:text-[#ccff00] dark:border dark:border-[#ccff00]/50 dark:shadow-[0_0_10px_rgba(204,255,0,0.2)]';
      case SubscriptionStatus.TRIAL:
        return 'bg-k5-digitalBlue text-white dark:bg-[#5c4aff]/20 dark:text-[#5c4aff] dark:border dark:border-[#5c4aff]/50 dark:shadow-[0_0_10px_rgba(92,74,255,0.2)]';
      case SubscriptionStatus.PAUSED:
        return 'bg-k5-sand/20 text-k5-deepBlue dark:bg-white/10 dark:text-white dark:border dark:border-white/20';
      case SubscriptionStatus.INACTIVE:
        return 'bg-red-100 text-red-600 dark:bg-[#ff3d71]/20 dark:text-[#ff3d71] dark:border dark:border-[#ff3d71]/50 dark:shadow-[0_0_10px_rgba(255,61,113,0.2)]';
      case SubscriptionStatus.EXPIRED:
        return 'bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-white/40';
      default:
        return 'bg-gray-50 text-gray-300 dark:bg-white/5 dark:text-white/20';
    }
  };

  return (
    <div className="shadow-k5-digitialBlue/5 overflow-hidden rounded-2xl border border-k5-deepBlue/5 bg-gradient-to-br from-white to-k5-sand/5 shadow-xl backdrop-blur-sm transition-all duration-300 hover:border-k5-digitalBlue/10 hover:shadow-2xl dark:border-white/10 dark:from-k5-deepBlue dark:to-k5-deepBlue dark:shadow-k5-deepBlue/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-k5-deepBlue text-white dark:bg-black/20">
            <tr>
              <th className="w-12 px-6 py-5">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 transition-all checked:bg-k5-lime"
                  checked={subscriptions.length > 0 && selectedIds.length === subscriptions.length}
                  onChange={(e) =>
                    onSelectAll(e.target.checked ? subscriptions.map((s) => s.id) : [])
                  }
                />
              </th>
              <th className="px-4 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                Plattform
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Owner</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                Kategorie
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                Finanzen
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                Verlängerung
              </th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em]">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-k5-sand/10 dark:divide-white/5">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <p className="font-bold italic text-k5-sand dark:text-k5-sand/60">
                    Keine Tools gefunden.
                  </p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const urgent = isUrgent(sub.renewalDate);
                return (
                  <tr
                    key={sub.id}
                    className={`group transition-colors hover:bg-k5-limeLight/30 dark:hover:bg-white/5 ${urgent ? 'bg-red-50/30 dark:bg-red-900/10' : ''} ${selectedIds.includes(sub.id) ? 'bg-k5-digitalBlue/5 dark:bg-k5-digitalBlue/10' : ''}`}
                  >
                    <td className="px-6 py-6 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer rounded border-k5-sand/30 bg-transparent transition-all checked:bg-k5-digitalBlue dark:border-white/20"
                        checked={selectedIds.includes(sub.id)}
                        onChange={() => onToggleSelection(sub.id)}
                      />
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center">
                        <div className="relative mr-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-k5-deepBlue font-black text-k5-lime shadow-inner dark:bg-k5-digitalBlue dark:text-white ${urgent ? 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)] ring-2 ring-red-500' : ''}`}
                          >
                            <ToolIcon name={sub.name} url={sub.url} />
                          </div>
                          {urgent && (
                            <span className="absolute -right-1 -top-1 z-10 h-3 w-3 rounded-full border-2 border-white bg-red-500 dark:border-k5-deepBlue"></span>
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-black leading-tight text-k5-deepBlue dark:text-white">
                            {sub.name}
                          </div>
                          <div className="mt-1 max-w-[150px] truncate text-xs font-medium text-k5-sand dark:text-k5-sand/80">
                            {sub.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-k5-sand/20 text-[10px] font-black text-k5-deepBlue dark:bg-white/10 dark:text-k5-sand">
                          {sub.owner ? sub.owner.charAt(0) : '?'}
                        </div>
                        <span className="text-xs font-bold text-k5-deepBlue/80 dark:text-k5-sand">
                          {sub.owner || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="rounded-lg bg-k5-sand/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-k5-deepBlue dark:bg-white/5 dark:text-k5-sand">
                        {sub.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-k5-deepBlue dark:text-white">
                        {(sub.monthlyCost || 0).toLocaleString('de-DE')} €{' '}
                        <span className="text-[10px] text-k5-sand dark:text-k5-sand/60">/MO</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-tight text-k5-digitalBlue dark:text-k5-digitalBlueLight">
                        {(sub.yearlyCost || 0).toLocaleString('de-DE')} € jährlich
                        {sub.monthsPerYear && sub.monthsPerYear < 12 && (
                          <span className="ml-1 text-k5-sand dark:text-k5-sand/60">
                            ({sub.monthsPerYear} Mo/Jahr)
                          </span>
                        )}
                      </div>
                      {sub.quantity && sub.quantity > 1 && (
                        <div className="mt-1 text-[9px] font-bold uppercase italic text-k5-sand dark:text-k5-sand/60">
                          {sub.quantity} Lizenzen à{' '}
                          {((sub.monthlyCost || 0) / sub.quantity).toLocaleString('de-DE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          €
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div
                        className={`text-sm font-bold ${urgent ? 'text-red-600 dark:text-red-400' : 'text-k5-deepBlue dark:text-white'}`}
                      >
                        {new Date(sub.renewalDate).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      {sub.cancellationDate && (
                        <div className="mt-1 text-[10px] font-black uppercase text-red-500">
                          Kündigung:{' '}
                          {new Date(sub.cancellationDate).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      )}
                      {urgent && (
                        <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-red-600">
                          Fällig in &lt; 7 Tagen!
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(sub.status)} shadow-sm`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="space-x-2 px-8 py-6 text-right">
                      <button
                        onClick={() => onEdit(sub)}
                        className="p-2 text-k5-sand opacity-0 transition-colors hover:text-k5-digitalBlue group-hover:opacity-100"
                        title="Tool bearbeiten"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(sub.id)}
                        className="p-2 text-k5-sand opacity-0 transition-colors hover:text-red-600 group-hover:opacity-100"
                        title="Tool entfernen"
                      >
                        <svg
                          className="h-5 w-5"
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
                );
              })
            )}
          </tbody>
        </table>
    </div>
  </div>
);
});
