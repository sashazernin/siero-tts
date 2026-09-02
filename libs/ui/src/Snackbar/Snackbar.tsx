import React, { useEffect } from 'react';
import styles from './Snackbar.module.css';

export interface SnackbarProps {
  open: boolean;
  message: string;
  severity?: 'info' | 'error' | 'success';
  onClose: () => void;
  autoHideDuration?: number;
}

export function Snackbar({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 4000,
}: SnackbarProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const timer = window.setTimeout(onClose, autoHideDuration);
    return () => window.clearTimeout(timer);
  }, [open, onClose, autoHideDuration]);

  return (
    <div
      className={[
        styles.snackbar,
        open ? styles.open : '',
        severity === 'error' ? styles.error : '',
        severity === 'success' ? styles.success : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
    >
      <p className={styles.message}>{message}</p>
    </div>
  );
}
