
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

const EXCHANGE_RATE_DEFAULT = 0.92;
const FRANKFURTER_API = 'https://www.frankfurter.app/latest?from=USD&to=EUR';

export const AddToolModal: React.FC<AddToolModalProps> = ({ isOpen, onClose, onAdd, onUpdate, initialData }) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('total');
  const [exchangeRate, setExchangeRate] = useState(EXCHANGE_RATE_DEFAULT);
  const [loadingRate, setLoadingRate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '', category: TOOL_CATEGORIES[0] as string, description: '', monthlyCost: 0, yearlyCost: 0,
    renewalDate: '', cancellationDate: '', status: SubscriptionStatus.ACTIVE, addedBy: '', owner: '', url: '', quantity: 1, monthsPerYear: 12 as number | string,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    usageMonths: [] as number[]
  });

  useEffect(() => {
    if (initialData && isOpen) {
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
        quantity: initialData.quantity || 1,
        monthsPerYear: initialData.monthsPerYear || 12,
        billingCycle: initialData.billingCycle || 'monthly',
        usageMonths: initialData.usageMonths || []
      });
      setCurrency('EUR');
      setPriceMode('total');
    } else if (isOpen) {
      setFormData({
        name: '', category: TOOL_CATEGORIES[0], description: '', monthlyCost: 0, yearlyCost: 0,
        renewalDate: '', cancellationDate: '', status: SubscriptionStatus.ACTIVE, addedBy: '', owner: '', url: '', quantity: 1, monthsPerYear: 12, billingCycle: 'monthly',
        usageMonths: []
      });

      const fetchRate = async () => {
        setLoadingRate(true);
        try {
          const res = await fetch(FRANKFURTER_API);
          const data = await res.json();
          if (data.rates && data.rates.EUR) {
            setExchangeRate(data.rates.EUR);
          }
        } catch (err) {
          console.error("Rate fetch failed", err);
        } finally {
          setLoadingRate(false);
        }
      };
      fetchRate();
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
          description: result.description || prev.description,
          monthsPerYear: 12,
          billingCycle: 'monthly'
        }));
        setPriceMode('total');
        setCurrency('EUR');
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
        url: suggestion.url,
        monthsPerYear: 12,
        billingCycle: 'monthly'
      }));
      setPriceMode('total');
      setCurrency('EUR');
    }
    setLoadingAI(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalMonthly = formData.monthlyCost;
    const qty = parseInt(formData.quantity as any) || 1;

    // Adjust for unit price
    if (priceMode === 'unit') {
      finalMonthly *= qty;
    }

    // Adjust for USD
    if (currency === 'USD') {
      finalMonthly *= exchangeRate;
    }

    const submissionData = {
      ...formData,
      monthlyCost: parseFloat(finalMonthly.toFixed(2)),
      yearlyCost: parseFloat((finalMonthly * (Number(formData.monthsPerYear) || 12)).toFixed(2)),
      quantity: qty,
      monthsPerYear: Number(formData.monthsPerYear) || 12,
      billingCycle: formData.billingCycle
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
      <div className="bg-white dark:bg-k5-deepBlue rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8 border-b border-k5-sand/10 dark:border-white/10 flex justify-between items-center bg-white dark:bg-black/20">
          <div>
            <h2 className="text-2xl font-black text-k5-deepBlue dark:text-white tracking-tight">
              {initialData ? 'Tool bearbeiten' : 'Tool hinzufügen'}
            </h2>
            <p className="text-xs text-k5-sand dark:text-k5-sand/60 font-bold uppercase tracking-widest mt-1">Stack Component Manager</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-k5-sand/10 dark:bg-white/10 rounded-full text-k5-deepBlue dark:text-white hover:bg-k5-sand/20 dark:hover:bg-white/20 transition-all">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="flex gap-2 p-1.5 bg-k5-sand/5 dark:bg-white/5 rounded-2xl mb-4 border border-k5-sand/10">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.billingCycle === 'monthly' ? 'bg-white dark:bg-k5-digitalBlue text-k5-deepBlue dark:text-white shadow-lg' : 'text-k5-sand hover:text-k5-deepBlue dark:hover:text-white'}`}
            >
              Monatlich bezahlen
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, billingCycle: 'yearly' })}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${formData.billingCycle === 'yearly' ? 'bg-white dark:bg-k5-digitalBlue text-k5-deepBlue dark:text-white shadow-lg' : 'text-k5-sand hover:text-k5-deepBlue dark:hover:text-white'}`}
            >
              Jährlich bezahlen
            </button>
          </div>

          {!initialData && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${loadingOCR ? 'border-k5-digitalBlue bg-k5-digitalBlue/5 dark:bg-k5-digitalBlue/10 animate-pulse' : 'border-k5-sand/30 dark:border-white/10 hover:border-k5-digitalBlue hover:bg-k5-digitalBlue/5 dark:hover:bg-k5-digitalBlue/10'}`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <svg className={`w-8 h-8 ${loadingOCR ? 'text-k5-digitalBlue' : 'text-k5-sand'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest text-k5-deepBlue dark:text-white text-center">
                {loadingOCR ? 'Rechnung wird analysiert...' : 'Rechnung (Bild) hochladen für Auto-Fill'}
              </span>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Name des Dienstes</label>
              <input
                required type="text" placeholder="z.B. AWS, Slack, K5 Analytics"
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue dark:text-white transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {!initialData && (
              <button
                type="button" onClick={handleAIHelp} disabled={loadingAI || !formData.name}
                className="px-6 py-4 bg-k5-digitalBlue text-white rounded-2xl hover:brightness-110 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg"
              >
                {loadingAI ? 'Analysiere...' : '✨ KI'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Lizenzen</label>
              <input
                required type="number" min="1"
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Monate / Jahr</label>
              <input
                required type="number" min="1" max="12"
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-k5-digitalBlue outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.monthsPerYear}
                onChange={e => {
                  const val = e.target.value;
                  if (val === '') {
                    setFormData({ ...formData, monthsPerYear: '' });
                  } else {
                    const parsed = parseInt(val);
                    if (parsed <= 12) {
                      setFormData({ ...formData, monthsPerYear: parsed });
                    }
                  }
                }}
                onFocus={() => setFormData({ ...formData, monthsPerYear: '' })}
                onBlur={() => {
                  if (!formData.monthsPerYear || Number(formData.monthsPerYear) === 0) {
                    setFormData({ ...formData, monthsPerYear: 12 });
                  }
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Kategorie</label>
              <select
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {TOOL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {(Number(formData.monthsPerYear) || 0) < 12 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-4">In welchen Monaten wird das Tool genutzt?</label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map((month, idx) => {
                  const isActive = formData.usageMonths.includes(idx);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        const newMonths = isActive
                          ? formData.usageMonths.filter(m => m !== idx)
                          : [...formData.usageMonths, idx];
                        setFormData({
                          ...formData,
                          usageMonths: newMonths,
                          monthsPerYear: newMonths.length || 1 // Fallback to 1 if user clears all but stays in seasonal mode
                        });
                      }}
                      className={`py-2 text-[9px] font-black rounded-xl transition-all border ${isActive ? 'bg-k5-digitalBlue border-k5-digitalBlue text-white shadow-lg' : 'bg-transparent border-k5-sand/20 text-k5-sand hover:border-k5-digitalBlue'}`}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Owner</label>
              <select
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.owner}
                onChange={e => setFormData({ ...formData, owner: e.target.value })}
              >
                <option value="">Bitte wählen...</option>
                {OWNERS.map(owner => <option key={owner} value={owner}>{owner}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Status</label>
              <select
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as SubscriptionStatus })}
              >
                {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 bg-k5-sand/5 dark:bg-white/5 rounded-2xl border border-k5-sand/10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setPriceMode('total')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${priceMode === 'total' ? 'bg-k5-deepBlue dark:bg-k5-digitalBlue text-white' : 'text-k5-sand'}`}
                >
                  Gesamt
                </button>
                <button
                  type="button" onClick={() => setPriceMode('unit')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${priceMode === 'unit' ? 'bg-k5-deepBlue dark:bg-k5-digitalBlue text-white' : 'text-k5-sand'}`}
                >
                  Pro Lizenz
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setCurrency('EUR')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${currency === 'EUR' ? 'bg-white text-k5-deepBlue border-transparent' : 'border-k5-sand/20 text-k5-sand'}`}
                >
                  EUR
                </button>
                <button
                  type="button" onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 text-[10px] font-black rounded-lg border transition-all ${currency === 'USD' ? 'bg-white text-k5-deepBlue border-transparent' : 'border-k5-sand/20 text-k5-sand'}`}
                >
                  USD
                </button>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <label className="block text-[10px] font-black text-k5-sand uppercase mb-2">Kosten ({currency})</label>
                <input
                  type="number" step="0.01"
                  className="w-full p-4 bg-white dark:bg-k5-deepBlue border border-k5-sand/20 dark:border-white/10 rounded-xl outline-none font-bold text-k5-deepBlue dark:text-white"
                  value={formData.monthlyCost || ''}
                  onChange={e => setFormData({ ...formData, monthlyCost: parseFloat(e.target.value) || 0 })}
                />
                {currency === 'USD' && (
                  <div className="absolute right-4 bottom-4 text-[9px] font-black text-k5-digitalBlue animate-pulse">
                    {loadingRate ? 'Lade Kurs...' : `≈ ${(formData.monthlyCost * exchangeRate).toFixed(2)}€`}
                  </div>
                )}
              </div>
              <div className="text-xl font-black text-k5-sand mt-6">➔</div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-k5-sand uppercase mb-2">Anteil Jahr ({currency})</label>
                <div className="p-4 bg-k5-sand/10 dark:bg-white/5 rounded-xl font-black text-k5-deepBlue dark:text-white text-lg">
                  {(formData.monthlyCost * (Number(formData.monthsPerYear) || 12)).toFixed(2)} {currency === 'EUR' ? '€' : '$'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Start / Verlängerung</label>
              <input
                required type="date"
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.renewalDate}
                onChange={e => setFormData({ ...formData, renewalDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-k5-sand dark:text-k5-sand/60 uppercase tracking-widest mb-2">Kündigung (Opt.)</label>
              <input
                type="date"
                className="w-full p-4 bg-k5-sand/5 dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 rounded-2xl outline-none font-bold text-k5-deepBlue dark:text-white"
                value={formData.cancellationDate}
                onChange={e => setFormData({ ...formData, cancellationDate: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-k5-lime text-k5-deepBlue rounded-2xl font-black uppercase text-sm tracking-[0.2em] hover:brightness-105 transition-all shadow-xl k5-glow-blue"
          >
            {initialData ? 'Update Tool' : 'Tool hinzufügen'}
          </button>
        </form>
      </div >
    </div >
  );
};
