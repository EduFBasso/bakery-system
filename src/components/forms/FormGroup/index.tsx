import styles from './FormGroup.module.css';

interface FormGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export function FormGroup({ label, required = false, error, children }: FormGroupProps) {
  return (
    <div className={styles.formGroup}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
