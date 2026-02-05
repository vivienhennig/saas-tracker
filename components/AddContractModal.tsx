import React, { useState } from 'react';
import {
  Contract,
  ContractBillingCycle,
  ContractCategory,
  Event,
} from '../types';

interface AddContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contract: Omit<Contract, 'id'>) => Promise<void>;
  onUpdate?: (id: string, contract: Partial<Contract>) => Promise<boolean | void>;
  initialData?: Contract | null;
  events: Event[];
  categories?: string[];
  onAddCategory?: (name: string) => Promise<boolean | void>;
}

export const AddContractModal: React.FC<AddContractModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  initialData,
  events,
  categories = [],
  onAddCategory,
}) => {
  const [formData, setFormData] = useState({
    provider: '',
    description: '',
    amount: '',
    currency: 'EUR',
    billing_cycle: 'monthly' as ContractBillingCycle,
    status: 'active' as const,
    category: 'Other' as string, // Relaxed type
    assigned_event: '',
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Reset or Populated on Open
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          provider: initialData.provider,
          description: initialData.description || '',
          amount: initialData.amount.toString(),
          currency: initialData.currency,
          billing_cycle: initialData.billing_cycle,
          status: initialData.status as any,
          category: initialData.category,
          assigned_event: initialData.assigned_event || '',
        });
        // Check if category is in the list, if not, it's custom (or if we want to treat it as custom)
        // Actually, simpler logic: if it's not in the passed categories list, maybe show as custom? 
        // For now, let's just stick to the value.
      } else {
        setFormData({
          provider: '',
          description: '',
          amount: '',
          currency: 'EUR',
          billing_cycle: 'monthly',
          status: 'active',
          category: 'Other',
          assigned_event: '',
        });
        setIsCustomCategory(false);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.provider || !formData.amount) return;

    // If custom category, add it first
    if (isCustomCategory && onAddCategory && formData.category) {
      await onAddCategory(formData.category);
    }

    const contractData = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (initialData && onUpdate) {
      await onUpdate(initialData.id, contractData);
    } else {
      await onAdd(contractData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in zoom-in-95 relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-k5-deepBlue p-8 shadow-2xl duration-200">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              {initialData ? 'Vertrag Bearbeiten' : 'Neuer Vertrag'}
            </h2>
            <p className="text-sm font-medium text-k5-sand/60">
              {initialData
                ? 'Änderungen am Vertrag speichern'
                : 'Manueller Vertragseintrag (Non-SaaS)'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Provider */}
          <div className="col-span-2 space-y-2 md:col-span-1">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Vertragspartner *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              placeholder="z.B. Messe München"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="col-span-2 space-y-2 md:col-span-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
                Kategorie
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) setFormData({ ...formData, category: '' });
                  else setFormData({ ...formData, category: 'Other' });
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-k5-lime hover:underline"
              >
                {isCustomCategory ? 'Aus Liste wählen' : '+ Neu anlegen'}
              </button>
            </div>
            
            {isCustomCategory ? (
              <input
                type="text"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
                placeholder="Neue Kategorie eingeben..."
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                autoFocus
              />
            ) : (
              <select
                className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
                value={formData.category}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__NEW__') {
                    setIsCustomCategory(true);
                    setFormData({ ...formData, category: '' });
                  } else {
                    setFormData({ ...formData, category: val });
                  }
                }}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-k5-deepBlue">
                    {cat}
                  </option>
                ))}
                <option value="__NEW__" className="bg-k5-deepBlue font-bold text-k5-lime">
                  + Neue Kategorie...
                </option>
              </select>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Betrag (Netto) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-white/40">
                €
              </span>
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Zyklus
            </label>
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              value={formData.billing_cycle}
              onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
            >
              <option value="monthly" className="bg-k5-deepBlue">
                Monatlich
              </option>
              <option value="yearly" className="bg-k5-deepBlue">
                Jährlich
              </option>
              <option value="quarterly" className="bg-k5-deepBlue">
                Vierteljährlich
              </option>
              <option value="one_time" className="bg-k5-deepBlue">
                Einmalig
              </option>
            </select>
          </div>

          {/* Event Assignment */}
          <div className="col-span-2 space-y-2">
            <label className="flex justify-between text-xs font-bold uppercase tracking-widest text-k5-sand">
              <span>Zugeordnetes Event</span>
              {events.length === 0 && (
                <span className="font-normal normal-case text-orange-400 opacity-80">
                  (Keine Events verfügbar)
                </span>
              )}
            </label>
            <select
              className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              value={formData.assigned_event}
              onChange={(e) => setFormData({ ...formData, assigned_event: e.target.value })}
            >
              <option value="" className="bg-k5-deepBlue text-white/50">
                -- Kein Event --
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.name} className="bg-k5-deepBlue">
                  {event.name}
                </option>
              ))}
            </select>
            <p className="px-1 text-[10px] text-white/40">
              Wähle ein Event, um die Kosten entsprechend zu gruppieren.
            </p>
          </div>

          {/* Description */}
          <div className="col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Beschreibung / Notiz
            </label>
            <textarea
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              placeholder="Details zum Vertrag..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Footer Actions */}
          <div className="col-span-2 flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-k5-sand transition-all hover:bg-white/5 hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="transform rounded-xl bg-k5-lime px-8 py-2.5 text-xs font-black uppercase tracking-widest text-k5-deepBlue shadow-lg shadow-k5-lime/20 transition-all hover:brightness-110 active:scale-95"
            >
              {initialData ? 'Änderungen Speichern' : 'Vertrag Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
