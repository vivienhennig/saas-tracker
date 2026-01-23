
import React from 'react';

interface StackAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: string | null;
  loading: boolean;
}

export const StackAuditModal: React.FC<StackAuditModalProps> = ({ isOpen, onClose, result, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-k5-deepBlue/90 backdrop-blur-xl p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-8 border-b border-k5-sand/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-k5-lime rounded-xl flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-k5-deepBlue tracking-tight">Stack Audit Einsichten</h2>
              <p className="text-[10px] text-k5-sand font-bold uppercase tracking-widest">KI-gestützte Portfolio-Analyse</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-k5-sand/10 rounded-full text-k5-deepBlue hover:bg-k5-sand/20 transition-all">✕</button>
        </div>

        <div className="p-8 overflow-y-auto bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-k5-digitalBlue border-t-transparent rounded-full animate-spin"></div>
              <p className="text-k5-deepBlue font-black uppercase text-xs tracking-widest animate-pulse">Analysiere Portfolio-Struktur...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none text-k5-deepBlue">
              <div className="whitespace-pre-wrap font-medium leading-relaxed bg-white p-6 rounded-2xl border border-k5-sand/20 shadow-sm">
                {result}
              </div>
            </div>
          ) : (
            <p className="text-center text-k5-sand font-bold italic">Keine Analyseergebnisse verfügbar.</p>
          )}
        </div>

        <div className="p-8 bg-white border-t border-k5-sand/10 text-center">
          <p className="text-[10px] text-k5-sand font-medium mb-4">Hinweis: Diese Analyse basiert auf allgemeinen Marktvergleichen und Redundanz-Mustern.</p>
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-k5-deepBlue text-white rounded-xl font-black uppercase text-xs tracking-widest hover:brightness-110 transition-all shadow-lg shadow-k5-deepBlue/20"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};
