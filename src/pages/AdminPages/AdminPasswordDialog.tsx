import React, { useEffect, useState } from 'react';
import styles from './AdminPages.module.css';

interface AdminPasswordDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isLoading?: boolean;
  error?: string | null;
  extraFieldLabel?: string;
  extraFieldValue?: string;
  extraFieldPlaceholder?: string;
  extraFieldType?: 'text' | 'number';
  extraFieldRequired?: boolean;
  onExtraFieldChange?: (value: string) => void;
  onClose: () => void;
  onConfirm: (password: string) => void;
}

export const AdminPasswordDialog: React.FC<AdminPasswordDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  isLoading = false,
  error,
  extraFieldLabel,
  extraFieldValue,
  extraFieldPlaceholder,
  extraFieldType = 'text',
  extraFieldRequired = false,
  onExtraFieldChange,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const shouldRequireExtraField = extraFieldRequired && !!onExtraFieldChange;
  const isExtraFieldInvalid = shouldRequireExtraField && !(extraFieldValue || '').trim();

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.passwordDialogContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.passwordDialogDescription}>{description}</p>

          {onExtraFieldChange && (
            <div className={styles.passwordDialogField}>
              <label>{extraFieldLabel || 'Valor'}</label>
              <input
                type={extraFieldType}
                value={extraFieldValue || ''}
                onChange={(e) => onExtraFieldChange(e.target.value)}
                placeholder={extraFieldPlaceholder || ''}
                disabled={isLoading}
                className={styles.adminPasswordInput}
                min={extraFieldType === 'number' ? '0' : undefined}
                step={extraFieldType === 'number' ? '0.01' : undefined}
              />
            </div>
          )}

          <div
            className={`${styles.passwordDialogField} ${onExtraFieldChange ? styles.passwordDialogPasswordSpacing : ''}`}
          >
            <label>Sua Senha</label>
            <div className={styles.passwordInlineRow}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                disabled={isLoading}
                className={styles.adminPasswordInput}
              />
              <button
                type="button"
                className={styles.inlinePasswordAction}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
        </div>

        <div className={styles.passwordDialogActions}>
          <button
            className={styles.passwordDialogCancelButton}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className={styles.passwordDialogConfirmButton}
            onClick={() => onConfirm(password)}
            disabled={!password || isLoading || isExtraFieldInvalid}
          >
            {isLoading ? '⏳ Confirmando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
