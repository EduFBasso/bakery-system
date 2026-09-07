import { useEffect } from 'react';
import styles from './SystemMessageToast.module.css';

interface SystemMessageToastProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  autoCloseMs?: number;
}

export function SystemMessageToast({
  open,
  title,
  message,
  onClose,
  autoCloseMs = 10000,
}: SystemMessageToastProps) {
  useEffect(() => {
    if (!open || autoCloseMs <= 0) {
      return;
    }

    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [autoCloseMs, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <strong>{title}</strong>
      <span>{message}</span>
      <button type="button" onClick={onClose} className={styles.closeButton}>
        OK
      </button>
    </div>
  );
}
