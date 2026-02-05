import { useState, useCallback } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ConfirmationConfig | null>(null);

  const confirm = useCallback((newConfig: ConfirmationConfig) => {
    setConfig(newConfig);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setConfig(null), 300); // Clear after animation
  }, []);

  const handleConfirm = async () => {
    if (config?.onConfirm) {
      await config.onConfirm();
    }
    close();
  };

  const ConfirmationDialog = () => (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={close}
      onConfirm={handleConfirm}
      title={config?.title || ''}
      message={config?.message || ''}
      confirmText={config?.confirmText}
      cancelText={config?.cancelText}
      isDestructive={config?.isDestructive}
    />
  );

  return { confirm, ConfirmationDialog };
};
