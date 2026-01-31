import React from 'react';

interface StackAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: string | null;
  loading: boolean;
}

export const StackAuditModal: React.FC<StackAuditModalProps> = ({
  isOpen,
  onClose,
  result,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-k5-deepBlue/90 p-4 backdrop-blur-xl">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-k5-deepBlue">
        <div className="flex items-center justify-between border-b border-k5-sand/10 p-8 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-k5-lime">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-k5-deepBlue dark:text-white">
                Stack Audit Einsichten
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-k5-sand dark:text-k5-sand/60">
                KI-gestützte Portfolio-Analyse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-k5-sand/10 text-k5-deepBlue transition-all hover:bg-k5-sand/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto bg-gray-50/50 p-8 dark:bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-k5-digitalBlue border-t-transparent"></div>
              <p className="animate-pulse text-xs font-black uppercase tracking-widest text-k5-deepBlue">
                Analysiere Portfolio-Struktur...
              </p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none text-k5-deepBlue dark:text-white">
              <div className="whitespace-pre-wrap rounded-2xl border border-k5-sand/20 bg-white p-6 font-medium leading-relaxed shadow-sm dark:border-white/10 dark:bg-white/5">
                {result}
              </div>
            </div>
          ) : (
            <p className="text-center font-bold italic text-k5-sand dark:text-k5-sand/60">
              Keine Analyseergebnisse verfügbar.
            </p>
          )}
        </div>

        <div className="border-t border-k5-sand/10 bg-white p-8 text-center dark:border-white/10 dark:bg-k5-deepBlue">
          <p className="mb-4 text-[10px] font-medium text-k5-sand dark:text-k5-sand/60">
            Hinweis: Diese Analyse basiert auf allgemeinen Marktvergleichen und Redundanz-Mustern.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-k5-deepBlue px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-k5-deepBlue/20 transition-all hover:brightness-110 dark:bg-k5-digitalBlue dark:shadow-k5-digitalBlue/20"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};
