import { useEffect } from 'react';
import styles from './PageFlashMessage.module.css';

export type PageFlashMessageType = 'success' | 'error' | 'info' | 'warning';

interface PageFlashMessageProps {
  open: boolean;
  message: string | null;
  type?: PageFlashMessageType;
  autoCloseMs?: number;
  onClose: () => void;
}

export function PageFlashMessage({
  open,
  message,
  type = 'info',
  autoCloseMs = 3000,
  onClose,
}: PageFlashMessageProps) {
  useEffect(() => {
    if (!open || !message || autoCloseMs <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timeoutId);
  }, [autoCloseMs, message, onClose, open]);

  if (!open || !message) {
    return null;
  }

  return (
    <div className={styles.container} role="status" aria-live="polite">
      <button type="button" className={`${styles.message} ${styles[type]}`} onClick={onClose}>
        {message}
      </button>
    </div>
  );
}
