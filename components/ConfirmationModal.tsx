import React, { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  isDestructive = false,
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-k5-deepBlue/80 p-4 backdrop-blur-md duration-200">
      <div className="animate-in zoom-in-95 flex w-full max-w-md flex-col overflow-hidden rounded-3xl border border-k5-sand/10 bg-white shadow-2xl duration-200 dark:border-white/10 dark:bg-k5-deepBlue">
        <div className="flex items-center justify-between border-b border-k5-sand/10 bg-white p-6 dark:border-white/10 dark:bg-black/20">
          <h2 className="text-xl font-black tracking-tight text-k5-deepBlue dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-k5-sand/10 text-k5-deepBlue transition-all hover:bg-k5-sand/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <p className="font-medium leading-relaxed text-k5-deepBlue/80 dark:text-k5-sand">
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-4 border-t border-k5-sand/10 bg-k5-sand/5 p-6 dark:border-white/10 dark:bg-white/5">
          <button
            onClick={onClose}
            className="rounded-xl border border-k5-sand/20 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-k5-deepBlue transition-all hover:bg-k5-sand/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest shadow-lg transition-all ${
              isDestructive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-k5-lime text-k5-deepBlue hover:brightness-110'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
