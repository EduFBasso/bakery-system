import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSubmit: (nickname: string, password: string) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit('', '');
      }}
    >
      {/* Será preenchido durante implementação */}
    </form>
  );
}
