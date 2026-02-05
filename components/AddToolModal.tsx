import React, { useState, useEffect, useRef } from 'react';
import { Subscription, SubscriptionStatus, TOOL_CATEGORIES, OWNERS, ToolCategory } from '../types';
import { suggestToolDetails, analyzeInvoice } from '../services/geminiService';

// Type guard to check if a string is a valid ToolCategory
const isValidCategory = (cat: string): cat is ToolCategory => {
  return TOOL_CATEGORIES.includes(cat as ToolCategory);
};

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Omit<Subscription, 'id'>) => void;
  onUpdate: (id: string, sub: Partial<Subscription>) => void;
  initialData?: Subscription | null;
}

const EXCHANGE_RATE_DEFAULT = 0.92;
const FRANKFURTER_API = 'https://www.frankfurter.app/latest?from=USD&to=EUR';

export const AddToolModal: React.FC<AddToolModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  onUpdate,
  initialData,
}) => {
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingOCR, setLoadingOCR] = useState(false);
  const [currency, setCurrency] = useState<'EUR' | 'USD'>('EUR');
  const [priceMode, setPriceMode] = useState<'unit' | 'total'>('total');
  const [exchangeRate, setExchangeRate] = useState(EXCHANGE_RATE_DEFAULT);
  const [_loadingRate, setLoadingRate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [costInput, setCostInput] = useState<number>(0);
  const [isGross, setIsGross] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: TOOL_CATEGORIES[0] as string,
    description: '',
    monthlyCost: 0,
    yearlyCost: 0,
    renewalDate: '',
    cancellationDate: '',
    status: SubscriptionStatus.ACTIVE,
    addedBy: '',
    owner: '',
    url: '',
    quantity: 1,
    monthsPerYear: 12 as number | string,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    usageMonths: [] as number[],
    notes: '',
    tags: [] as string[],
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
        usageMonths: initialData.usageMonths || [],
        notes: initialData.notes || '',
        tags: initialData.tags || [],
      });
      setCurrency('EUR');
      setPriceMode('total');
      setIsGross(false);
      // Initialize cost input based on billing cycle
      if (initialData.billingCycle === 'yearly') {
        const cost = initialData.yearlyCost || (initialData.monthlyCost || 0) * 12;
        setCostInput(cost);
      } else {
        setCostInput(initialData.monthlyCost || 0);
      }
    } else if (isOpen) {
      setFormData({
        name: '',
        category: TOOL_CATEGORIES[0],
        description: '',
        monthlyCost: 0,
        yearlyCost: 0,
        renewalDate: '',
        cancellationDate: '',
        status: SubscriptionStatus.ACTIVE,
        addedBy: '',
        owner: '',
        url: '',
        quantity: 1,
        monthsPerYear: 12,
        billingCycle: 'monthly',
        usageMonths: [],
        notes: '',
        tags: [],
      });
      setCostInput(0);
      setIsGross(false);

      const fetchRate = async () => {
        setLoadingRate(true);
        try {
          const res = await fetch(FRANKFURTER_API);
          const data = await res.json();
          if (data.rates && data.rates.EUR) {
            setExchangeRate(data.rates.EUR);
          }
        } catch (err) {
          console.error('Rate fetch failed', err);
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
        setFormData((prev) => ({
          ...prev,
          name: result.name || prev.name,
          category: isValidCategory(result.category) ? result.category : prev.category,
          monthlyCost: result.monthlyCost || prev.monthlyCost,
          yearlyCost: (result.monthlyCost || 0) * 12,
          renewalDate: result.renewalDate || prev.renewalDate,
          description: result.description || prev.description,
          monthsPerYear: 12,
          billingCycle: 'monthly',
        }));
        setCostInput(result.monthlyCost || 0);
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
      const matchedCategory = isValidCategory(suggestion.category)
        ? suggestion.category
        : TOOL_CATEGORIES[0];

      setFormData((prev) => ({
        ...prev,
        category: matchedCategory,
        description: suggestion.description,
        monthlyCost: suggestion.estimatedMonthlyCost,
        yearlyCost: suggestion.estimatedMonthlyCost * 12,
        url: suggestion.url,
        monthsPerYear: 12,
        billingCycle: 'monthly',
      }));
      setCostInput(suggestion.estimatedMonthlyCost);
      setPriceMode('total');
      setCurrency('EUR');
    }
    setLoadingAI(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let calculatedMonthly = 0;
    const qty = Number(formData.quantity) || 1;
    const months = Number(formData.monthsPerYear) || 12;
    let basePrice = costInput;

    // 1. Adjust for unit price (if "Per License" is selected, multiply by qty)
    if (priceMode === 'unit') {
      basePrice *= qty;
    }

    // 2. Adjust for Currency (Convert USD input to EUR)
    if (currency === 'USD') {
      basePrice *= exchangeRate;
    }

    // 3. Adjust for Tax (Convert Gross to Net)
    if (isGross) {
      basePrice = basePrice / 1.19;
    }

    // 4. Calculate Monthly and Yearly based on Cycle
    if (formData.billingCycle === 'yearly') {
      // Input was Yearly Price
      calculatedMonthly = basePrice / months;
    } else {
      // Input was Monthly Price
      calculatedMonthly = basePrice;
    }

    const finalYearly = calculatedMonthly * months;

    const submissionData = {
      ...formData,
      monthlyCost: parseFloat(calculatedMonthly.toFixed(2)),
      yearlyCost: parseFloat(finalYearly.toFixed(2)),
      quantity: qty,
      monthsPerYear: months,
      billingCycle: formData.billingCycle,
    };

    if (initialData) {
      onUpdate(initialData.id, submissionData);
    } else {
      onAdd(submissionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-k5-deepBlue/80 p-4 backdrop-blur-md">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-k5-deepBlue">
        <div className="flex items-center justify-between border-b border-k5-sand/10 bg-white p-8 dark:border-white/10 dark:bg-black/20">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-k5-deepBlue dark:text-white">
              {initialData ? 'Tool bearbeiten' : 'Tool hinzufügen'}
            </h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
              Stack Component Manager
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-k5-sand/10 text-k5-deepBlue transition-all hover:bg-k5-sand/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto p-8">
          {/* File Upload / OCR */}
          {!initialData && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 transition-all ${loadingOCR ? 'animate-pulse border-k5-digitalBlue bg-k5-digitalBlue/5 dark:bg-k5-digitalBlue/10' : 'border-k5-sand/30 hover:border-k5-digitalBlue hover:bg-k5-digitalBlue/5 dark:border-white/10 dark:hover:bg-k5-digitalBlue/10'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <svg
                className={`h-8 w-8 ${loadingOCR ? 'text-k5-digitalBlue dark:text-k5-digitalBlueLight' : 'text-k5-sand'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-center text-xs font-black uppercase tracking-widest text-k5-deepBlue dark:text-white">
                {loadingOCR
                  ? 'Rechnung wird analysiert...'
                  : 'Rechnung (Bild) hochladen für Auto-Fill'}
              </span>
            </div>
          )}

          {/* Basic Info */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Name des Dienstes
              </label>
              <input
                required
                type="text"
                placeholder="z.B. AWS, Slack, K5 Analytics"
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none transition-all focus:ring-2 focus:ring-k5-digitalBlue dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            {!initialData && (
              <button
                type="button"
                onClick={handleAIHelp}
                disabled={loadingAI || !formData.name}
                className="rounded-2xl bg-k5-digitalBlue px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loadingAI ? 'Analysiere...' : '✨ KI'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Kategorie
              </label>
              <select
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {TOOL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Owner
              </label>
              <select
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              >
                <option value="">Bitte wählen...</option>
                {OWNERS.map((owner) => (
                  <option key={owner} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Status
              </label>
              <select
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as SubscriptionStatus })
                }
              >
                {Object.values(SubscriptionStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Section - Redesigned */}
          <div className="space-y-6 rounded-3xl border border-k5-sand/10 bg-k5-sand/5 p-6 dark:bg-white/5">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-k5-deepBlue dark:text-white">
              <svg
                className="h-4 w-4 text-k5-lime"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Preis & Abrechnung
            </h3>

            <div className="mb-2 flex gap-2 rounded-xl bg-k5-sand/10 p-1 dark:bg-white/5">
              {/* Billing Cycle Toggle */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                className={`flex-1 rounded-lg py-3 text-[10px] font-black uppercase tracking-widest transition-all ${formData.billingCycle === 'monthly' ? 'bg-white text-k5-deepBlue shadow-md dark:bg-k5-digitalBlue dark:text-white' : 'text-k5-sand hover:text-k5-deepBlue dark:hover:text-white'}`}
              >
                Monatlich
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, billingCycle: 'yearly' })}
                className={`flex-1 rounded-lg py-3 text-[10px] font-black uppercase tracking-widest transition-all ${formData.billingCycle === 'yearly' ? 'bg-white text-k5-deepBlue shadow-md dark:bg-k5-digitalBlue dark:text-white' : 'text-k5-sand hover:text-k5-deepBlue dark:hover:text-white'}`}
              >
                Jährlich
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Cost Input */}
              <div className="relative">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                  {formData.billingCycle === 'monthly' ? 'Monatliche Kosten' : 'Jährliche Kosten'}
                </label>
                <div className="group relative">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full rounded-2xl border border-k5-sand/20 bg-white p-4 pl-12 text-xl font-bold text-k5-deepBlue outline-none focus:ring-2 focus:ring-k5-digitalBlue dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={costInput || ''}
                    onChange={(e) => setCostInput(parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-k5-sand group-focus-within:text-k5-digitalBlue">
                    {currency === 'EUR' ? '€' : '$'}
                  </div>
                </div>
              </div>

              {/* Settings: Quantity & Currency & Tax */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                    Lizenzen
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-2xl border border-k5-sand/20 bg-white p-4 text-center text-xl font-bold text-k5-deepBlue outline-none focus:ring-2 focus:ring-k5-digitalBlue dark:border-white/10 dark:bg-black/20 dark:text-white"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand opacity-0 dark:text-k5-sand/60">
                    Opt
                  </label>
                  <div className="flex h-full gap-2">
                    {/* Currency Toggle */}
                    <div className="flex rounded-2xl border border-k5-sand/20 bg-white p-1 dark:border-white/10 dark:bg-black/20">
                      <button
                        type="button"
                        onClick={() => setCurrency('EUR')}
                        className={`w-10 rounded-xl text-[10px] font-black transition-all ${currency === 'EUR' ? 'bg-k5-deepBlue text-white dark:bg-white dark:text-k5-deepBlue' : 'text-k5-sand'}`}
                      >
                        €
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className={`w-10 rounded-xl text-[10px] font-black transition-all ${currency === 'USD' ? 'bg-k5-deepBlue text-white dark:bg-white dark:text-k5-deepBlue' : 'text-k5-sand'}`}
                      >
                        $
                      </button>
                    </div>

                    {/* Tax Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsGross(!isGross)}
                      className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                        isGross
                          ? 'border-k5-digitalBlue bg-k5-digitalBlue/10 text-k5-digitalBlue dark:border-k5-digitalBlueLight dark:text-k5-digitalBlueLight'
                          : 'border-k5-sand/20 bg-white text-k5-sand dark:border-white/10 dark:bg-black/20'
                      }`}
                      title={isGross ? 'Eingabe ist Brutto (inkl. 19% MwSt)' : 'Eingabe ist Netto'}
                    >
                      <span>{isGross ? 'Brutto' : 'Netto'}</span>
                      <span className="text-[9px] opacity-60">{isGross ? '19%' : '0%'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Mode Toggle */}
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl border border-k5-sand/10 bg-k5-sand/10 p-1 dark:bg-white/5">
                <button
                  type="button"
                  onClick={() => setPriceMode('total')}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${priceMode === 'total' ? 'bg-k5-sand/20 text-k5-deepBlue dark:text-white' : 'text-k5-sand'}`}
                >
                  Gesamtpreis
                </button>
                <div className="mx-1 w-px bg-k5-sand/20"></div>
                <button
                  type="button"
                  onClick={() => setPriceMode('unit')}
                  className={`rounded-lg px-4 py-1.5 text-[10px] font-black transition-all ${priceMode === 'unit' ? 'bg-k5-sand/20 text-k5-deepBlue dark:text-white' : 'text-k5-sand'}`}
                >
                  Preis pro Lizenz
                </button>
              </div>
            </div>

            {/* Dynamic Summary */}
            <div className="flex items-center justify-between rounded-2xl border border-k5-lime/20 bg-k5-lime/10 p-4 dark:bg-k5-lime/5">
              <div className="text-xs font-bold text-k5-deepBlue dark:text-white">
                {currency === 'USD' && (
                  <span className="mb-1 block text-[9px] text-k5-sand">
                    Wechselkurs: {exchangeRate}
                  </span>
                )}
                {isGross && (
                  <span className="mb-1 block text-[9px] text-k5-digitalBlue dark:text-k5-digitalBlueLight">
                    Brutto → Netto (-19%)
                  </span>
                )}
                Errechnete Jahreskosten (Netto):
              </div>
              <div className="text-xl font-black text-k5-deepBlue dark:text-white">
                {/* Calculation Preview */}
                {(() => {
                  let val = costInput;
                  if (priceMode === 'unit') val *= formData.quantity || 1;
                  if (currency === 'USD') val *= exchangeRate;
                  if (isGross) val = val / 1.19; // Remove 19% VAT
                  if (formData.billingCycle === 'monthly')
                    val *= Number(formData.monthsPerYear) || 12;
                  return val.toFixed(2);
                })()}{' '}
                €
              </div>
            </div>
          </div>

          {/* Seasonal / Usage Months */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
              Monate pro Jahr (Saisonalität)
            </label>
            <input
              required
              type="number"
              min="1"
              max="12"
              className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none focus:ring-2 focus:ring-k5-digitalBlue dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={formData.monthsPerYear}
              onFocus={() => setFormData({ ...formData, monthsPerYear: '' })}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setFormData({ ...formData, monthsPerYear: '' });
                } else {
                  const parsed = parseInt(val);
                  if (parsed <= 12) setFormData({ ...formData, monthsPerYear: parsed });
                }
              }}
            />
          </div>

          {(Number(formData.monthsPerYear) || 0) < 12 && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="mb-4 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                In welchen Monaten wird das Tool genutzt?
              </label>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                {[
                  'Jan',
                  'Feb',
                  'Mär',
                  'Apr',
                  'Mai',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Okt',
                  'Nov',
                  'Dez',
                ].map((month, idx) => {
                  const isActive = formData.usageMonths.includes(idx);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        const newMonths = isActive
                          ? formData.usageMonths.filter((m) => m !== idx)
                          : [...formData.usageMonths, idx];
                        setFormData({
                          ...formData,
                          usageMonths: newMonths,
                          monthsPerYear: newMonths.length || 1, // Fallback to 1 if user clears all but stays in seasonal mode
                        });
                      }}
                      className={`rounded-xl border py-2 text-[9px] font-black transition-all ${isActive ? 'border-k5-digitalBlue bg-k5-digitalBlue text-white shadow-lg' : 'border-k5-sand/20 bg-transparent text-k5-sand hover:border-k5-digitalBlue'}`}
                    >
                      {month}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Start / Verlängerung
              </label>
              <input
                required
                type="date"
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.renewalDate}
                onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                Kündigung (Opt.)
              </label>
              <input
                type="date"
                className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-bold text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={formData.cancellationDate}
                onChange={(e) => setFormData({ ...formData, cancellationDate: e.target.value })}
              />
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
              Notizen (Optional)
            </label>
            <textarea
              className="w-full rounded-2xl border border-k5-sand/20 bg-k5-sand/5 p-4 font-medium text-k5-deepBlue outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              rows={3}
              placeholder="Notizen zum Tool..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
              Tags (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'kritisch',
                'kündigen',
                'evaluieren',
                'wichtig',
                'optional',
                'veraltet',
                'team',
                'personal',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag)
                        ? prev.tags.filter((t) => t !== tag)
                        : [...prev.tags, tag],
                    }));
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-k5-digitalBlue text-white dark:bg-k5-lime dark:text-k5-deepBlue'
                      : 'bg-k5-sand/10 text-k5-sand hover:bg-k5-sand/20 dark:bg-white/5 dark:text-k5-sand/60 dark:hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="k5-glow-blue w-full rounded-2xl bg-k5-lime py-5 text-sm font-black uppercase tracking-[0.2em] text-k5-deepBlue shadow-xl transition-all hover:brightness-105"
          >
            {initialData ? 'Update Tool' : 'Tool hinzufügen'}
          </button>
        </form>
      </div>
    </div>
  );
};
