import { useState } from 'react';
import { useAdminLogin } from '../../hooks/useAdminLogin';
import styles from './AdminLoginPage.module.css';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, loading, error, clearError } = useAdminLogin({
    onSuccess: (response) => {
      const displayName =
        [response.professional.first_name, response.professional.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || response.professional.email;
      setSuccessMessage(`✅ Bem-vindo, ${displayName}!`);
      // Token já salvo no localStorage pelo hook — forçar navegação completa
      setTimeout(() => {
        window.location.replace('/admin');
      }, 1500);
    },
    onError: (err) => {
      console.error('Erro no login:', err);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    await login(email.trim(), password);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <header className={styles.header}>
          <h1>🛠️ Painel Admin</h1>
          <p className={styles.subtitle}>Acesso Restrito</p>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          {successMessage && <div className={styles.successAlert}>{successMessage}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="Digite seu e-mail cadastrado"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className={styles.submitButton}
          >
            {loading ? '⏳ Aguarde...' : '🔐 Entrar como Dono'}
          </button>
        </form>

        <footer className={styles.footer}>
          <p>Sistema de Administração</p>
        </footer>
      </div>
    </div>
  );
}
