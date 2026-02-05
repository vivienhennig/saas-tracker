import React, { useState } from 'react';
import { Event } from '../types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (event: Omit<Event, 'id'>) => Promise<boolean | void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    await onAdd(formData);
    setFormData({ name: '', date: '', description: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-k5-deepBlue p-8 shadow-2xl duration-200">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Neues Event</h2>
            <p className="text-sm font-medium text-k5-sand/60">
              Event für Vertragszuordnung anlegen
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Event Name *
            </label>
            <input
              type="text"
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              placeholder="z.B. K5 2026"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Datum (Optional)
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-k5-sand">
              Beschreibung
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-medium text-white placeholder-white/20 transition-all focus:border-k5-lime focus:outline-none focus:ring-1 focus:ring-k5-lime"
              placeholder="Zusätzliche Infos..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
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
              Event Anlegen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
