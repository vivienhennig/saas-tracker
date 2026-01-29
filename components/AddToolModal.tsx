
import React, { useState, useEffect, useRef } from 'react';
import { Subscription, SubscriptionStatus, TOOL_CATEGORIES, OWNERS } from '../types';
import { suggestToolDetails, analyzeInvoice } from '../services/geminiService';

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
  onUpdate: (id: string, sub: Partial<Subscription>) => void;
  initialData?: Subscription | null;
}

export const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onAdd, onUpdate, initialData }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('total');
  const EXCHANGE_RATE = 0.93; // 1 USD = 0.93 EUR
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', category: TOOL_CATEGORIES[0] as string, description: '', monthlyCost: 0, yearlyCost: 0,
    renewalDate: '', cancellationDate: '', status: SubscriptionStatus.ACTIVE, addedBy: '', owner: '', url: '', quantity: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category: initialData.category || TOOL_CATEGORIES[0],
        description: initialData.description || '',
        monthlyCost: initialData.monthlyCost || 0,
        yearlyCost: initialData.yearlyCost || 0,
        renewalDate: initialData.renewalDate || '',
        cancellationDate: initialData.cancellationDate || '',
        status: initialData.status || SubscriptionStatus.ACTIVE,
        addedBy: initialData.addedBy || '',
        owner: initialData.owner || '',
        url: initialData.url || '',
        quantity: initialData.quantity || 1
      });
      setCurrency('EUR'); // Data is stored in EUR
      setPriceMode('total'); // Default to total for editing existing data
    } else {
      setFormData({
        name: '', category: TOOL_CATEGORIES[0], description: '', monthlyCost: 0, yearlyCost: 0,
        renewalDate: '', cancellationDate: '', status: SubscriptionStatus.ACTIVE, addedBy: '', owner: '', url: '', quantity: 1
      });
    }
  }, [initialData, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingOCR(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      const result = await analyzeInvoice(base64, file.type);
      if (result) {
        setFormData(prev => ({
          ...prev,
          name: result.name || prev.name,
          category: TOOL_CATEGORIES.includes(result.category as any) ? result.category : prev.category,
          monthlyCost: result.monthlyCost || prev.monthlyCost,
          yearlyCost: (result.monthlyCost || 0) * 12,
          renewalDate: result.renewalDate || prev.renewalDate,
          description: result.description || prev.description
        }));
        setPriceMode('total'); // OCR usually gives total
        setCurrency('EUR'); // Assuming EUR for now
      }
      setLoadingOCR(false);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleAIHelp = async () => {
    if (!formData.name) return;
    setLoadingAI(true);
    const suggestion = await suggestToolDetails(formData.name);
    if (suggestion) {
      const matchedCategory = TOOL_CATEGORIES.includes(suggestion.category as any)
        ? suggestion.category
        : TOOL_CATEGORIES[0];

      setFormData(prev => ({
        ...prev,
        category: matchedCategory,
        description: suggestion.description,
        monthlyCost: suggestion.estimatedMonthlyCost,
        yearlyCost: suggestion.estimatedMonthlyCost * 12,
        url: suggestion.url
      }));
      setPriceMode('total');
      setCurrency('EUR');
    }
    setLoadingAI(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // The background calculation happens here:
    // 1. Start with the raw input values
    let finalMonthly = formData.monthlyCost;
    let finalYearly = formData.yearlyCost;

    // 2. Apply Quantity if in unit price mode
    const qty = parseInt(formData.quantity as any) || 1;
    if (priceMode === 'unit') {
      finalMonthly *= qty;
      finalYearly *= qty;
    }

    // 3. Apply Currency Conversion if in USD
    if (currency === 'USD') {
      finalMonthly *= EXCHANGE_RATE;
      finalYearly *= EXCHANGE_RATE;
    }

    const submissionData = {
      ...formData,
      monthlyCost: parseFloat(finalMonthly.toFixed(2)),
      yearlyCost: parseFloat(finalYearly.toFixed(2)),
      quantity: qty
    };

    if (initialData) {
      onUpdate(initialData.id, submissionData);
    } else {
      onAdd(submissionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-k5-deepBlue/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-k5-sand/10 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-k5-deepBlue tracking-tight">
              {initialData ? 'Tool bearbeiten' : 'Tool hinzufügen'}
            </h2>
            <p className="text-xs text-k5-sand font-bold uppercase tracking-widest mt-1">Stack Component Manager</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-k5-sand/10 rounded-full text-k5-deepBlue hover:bg-k5-sand/20 transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          {!initialData && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${loadingOCR ? 'border-k5-digitalBlue bg-k5-digitalBlue/5 animate-pulse' : 'border-k5-sand/30 hover:border-k5-digitalBlue hover:bg-k5-digitalBlue/5'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <svg className={`w-8 h-8 ${loadingOCR ? 'text-k5-digitalBlue' : 'text-k5-sand'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest text-k5-deepBlue">
                {loadingOCR ? 'Rechnung wird analysiert...' : 'Rechnung (Bild) hochladen für Auto-Fill'}
              </span>
              <span className="text-[10px] text-k5-sand">Extrahiert Preis, Datum & Name via KI</span>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Name des Dienstes</label>
              <input
                required type="text" placeholder="z.B. AWS, Slack, K5 Analytics"
                className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {!initialData && (
              <button
                type="button" onClick={handleAIHelp} disabled={loadingAI || !formData.name}
                className="px-6 py-4 bg-k5-digitalBlue text-white rounded-2xl hover:brightness-110 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-k5-digitalBlue/20"
              >
                {loadingAI ? 'Analysiere...' : '✨ KI-Vorschlag'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Anzahl Lizenzen</label>
              <input
                required type="number" min="1"
                className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue transition-all"
                value={formData.quantity}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, quantity: val === '' ? '' as any : parseInt(val) });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Kategorie</label>
              <div className="relative">
                <select
                  required
                  className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {TOOL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-k5-sand">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Verantwortliche Person (Owner)</label>
              <div className="relative">
                <select
                  required
                  className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue appearance-none"
                  value={formData.owner}
                  onChange={e => setFormData({ ...formData, owner: e.target.value })}
                >
                  <option value="">Bitte wählen...</option>
                  {OWNERS.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-k5-sand">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Status</label>
              <div className="relative">
                <select
                  required
                  className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue appearance-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
                >
                  {Object.values(SubscriptionStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-k5-sand">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest">Kosten</label>
              <div className="flex gap-2">
                <div className="flex bg-k5-sand/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPriceMode('total')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${priceMode === 'total' ? 'bg-white text-k5-deepBlue shadow-sm' : 'text-k5-deepBlue/50 hover:text-k5-deepBlue'}`}
                  >
                    Gesamt
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode('unit')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${priceMode === 'unit' ? 'bg-white text-k5-deepBlue shadow-sm' : 'text-k5-deepBlue/50 hover:text-k5-deepBlue'}`}
                  >
                    Pro Lizenz
                  </button>
                </div>
                <div className="flex bg-k5-sand/10 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCurrency('EUR')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${currency === 'EUR' ? 'bg-k5-deepBlue text-white shadow-sm' : 'text-k5-deepBlue/50 hover:text-k5-deepBlue'}`}
                  >
                    EUR (€)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${currency === 'USD' ? 'bg-k5-deepBlue text-white shadow-sm' : 'text-k5-deepBlue/50 hover:text-k5-deepBlue'}`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">
                  Monatlich ({currency === 'EUR' ? '€' : '$'}) {priceMode === 'unit' ? '/ Lizenz' : ''}
                </label>
                <input
                  required type="number" step="0.01"
                  className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-black text-k5-deepBlue"
                  value={formData.monthlyCost || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, monthlyCost: val, yearlyCost: parseFloat((val * 12).toFixed(2)) });
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">
                  Jährlich ({currency === 'EUR' ? '€' : '$'}) {priceMode === 'unit' ? '/ Lizenz' : ''}
                </label>
                <input
                  required type="number" step="0.01"
                  className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-black text-k5-deepBlue"
                  value={formData.yearlyCost || ''}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, yearlyCost: val, monthlyCost: parseFloat((val / 12).toFixed(2)) });
                  }}
                />
              </div>
            </div>
            {priceMode === 'unit' && formData.quantity > 1 && (
              <p className="text-[10px] text-k5-sand font-bold italic">
                * Automatisch berechnet: {formData.quantity} Lizenzen x Preis
              </p>
            )}
            {currency === 'USD' && (
              <p className="text-[10px] text-k5-digitalBlue font-bold italic">
                * Wird automatisch mit 1 USD = {EXCHANGE_RATE} EUR umgerechnet
              </p>
            )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Nächste Verlängerung</label>
              <input
                required type="date"
                className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue"
                value={formData.renewalDate}
                onChange={e => setFormData({ ...formData, renewalDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Kündigungsdatum (Optional)</label>
              <input
                type="date"
                className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue"
                value={formData.cancellationDate}
                onChange={e => setFormData({ ...formData, cancellationDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-k5-sand uppercase tracking-widest mb-2">Beschreibung</label>
            <textarea
              className="w-full p-4 bg-k5-sand/5 border border-k5-sand/20 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-medium text-k5-deepBlue"
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Kurze Beschreibung des Tools..."
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full py-5 bg-k5-lime text-k5-deepBlue rounded-2xl font-black uppercase text-sm tracking-[0.2em] hover:brightness-105 transition-all shadow-xl shadow-k5-lime/20"
            >
              {initialData ? 'Änderungen speichern' : 'Zum Stack hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
