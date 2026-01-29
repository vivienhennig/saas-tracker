
import React from 'react';
import { Subscription, SubscriptionStatus } from '../types';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => void;
  onEdit: (sub: Subscription) => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions, onDelete, onEdit }) => {
  const isUrgent = (dateStr: string) => {
    const now = new Date();
    const renewal = new Date(dateStr);
    const diff = (renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const getStatusStyle = (status: SubscriptionStatus) => {
    switch (status) {
      case SubscriptionStatus.ACTIVE: return 'bg-k5-lime text-k5-deepBlue';
      case SubscriptionStatus.TRIAL: return 'bg-k5-digitalBlue text-white';
      case SubscriptionStatus.PAUSED: return 'bg-k5-sand/20 text-k5-deepBlue';
      case SubscriptionStatus.INACTIVE: return 'bg-red-100 text-red-600';
      case SubscriptionStatus.EXPIRED: return 'bg-gray-100 text-gray-400';
      default: return 'bg-gray-50 text-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-k5-sand/20 shadow-xl shadow-k5-deepBlue/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-k5-deepBlue text-white">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Plattform</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Owner</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Kategorie</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Finanzen</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Verlängerung</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-k5-sand/10">
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-8 py-20 text-center">
                  <p className="text-k5-sand font-bold italic">Keine Tools gefunden.</p>
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => {
                const urgent = isUrgent(sub.renewalDate);
                return (
                  <tr key={sub.id} className={`hover:bg-k5-limeLight/30 transition-colors group ${urgent ? 'bg-red-50/30' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl bg-k5-deepBlue text-k5-lime flex items-center justify-center mr-4 font-black shadow-inner relative ${urgent ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
                          {sub.name.charAt(0)}
                          {urgent && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                        </div>
                        <div>
                          <div className="font-black text-k5-deepBlue text-lg leading-tight">{sub.name}</div>
                          <div className="text-xs text-k5-sand font-medium mt-1 truncate max-w-[150px]">{sub.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-k5-sand/20 text-k5-deepBlue flex items-center justify-center text-[10px] font-black">
                          {sub.owner ? sub.owner.charAt(0) : '?'}
                        </div>
                        <span className="text-xs font-bold text-k5-deepBlue/80">{sub.owner || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-k5-sand/10 text-k5-deepBlue rounded-lg">
                        {sub.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-k5-deepBlue">
                        {(sub.monthlyCost || 0).toLocaleString('de-DE')} € <span className="text-[10px] text-k5-sand">/MO</span>
                      </div>
                      <div className="text-[10px] text-k5-digitalBlue font-bold uppercase tracking-tight">
                        {(sub.yearlyCost || 0).toLocaleString('de-DE')} € jährlich
                      </div>
                      {sub.quantity && sub.quantity > 1 && (
                        <div className="text-[9px] text-k5-sand font-bold mt-1 uppercase italic">
                          {sub.quantity} Lizenzen à {((sub.monthlyCost || 0) / sub.quantity).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-k5-deepBlue'}`}>
                        {new Date(sub.renewalDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      {sub.cancellationDate && (
                        <div className="text-[10px] text-red-500 font-black uppercase mt-1">
                          Kündigung: {new Date(sub.cancellationDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                        </div>
                      )}
                      {urgent && (
                        <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">Fällig in &lt; 7 Tagen!</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusStyle(sub.status)} shadow-sm`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button
                        onClick={() => onEdit(sub)}
                        className="text-k5-sand hover:text-k5-digitalBlue transition-colors p-2 opacity-0 group-hover:opacity-100"
                        title="Tool bearbeiten"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(sub.id)}
                        className="text-k5-sand hover:text-red-600 transition-colors p-2 opacity-0 group-hover:opacity-100"
                        title="Tool entfernen"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
};
