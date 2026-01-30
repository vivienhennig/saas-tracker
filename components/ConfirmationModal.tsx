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
    isDestructive = false
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-k5-deepBlue/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-k5-deepBlue rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-k5-sand/10 dark:border-white/10 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-k5-sand/10 dark:border-white/10 flex justify-between items-center bg-white dark:bg-black/20">
                    <h2 className="text-xl font-black text-k5-deepBlue dark:text-white tracking-tight">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center bg-k5-sand/10 dark:bg-white/10 rounded-full text-k5-deepBlue dark:text-white hover:bg-k5-sand/20 dark:hover:bg-white/20 transition-all"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-k5-deepBlue/80 dark:text-k5-sand font-medium leading-relaxed">
                        {message}
                    </p>
                </div>

                <div className="p-6 bg-k5-sand/5 dark:bg-white/5 border-t border-k5-sand/10 dark:border-white/10 flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white dark:bg-white/5 border border-k5-sand/20 dark:border-white/10 hover:bg-k5-sand/10 dark:hover:bg-white/10 text-k5-deepBlue dark:text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${isDestructive
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
