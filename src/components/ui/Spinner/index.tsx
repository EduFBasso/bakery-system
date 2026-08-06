import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export function Spinner({ size = 'medium' }: SpinnerProps) {
  return <div className={`${styles.spinner} ${styles[size]}`} />;
}
