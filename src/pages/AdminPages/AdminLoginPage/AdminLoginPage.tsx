import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAdminLogin } from '../../../hooks/useAdminLogin';
import styles from './AdminLoginPage.module.css';

export function AdminLoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    login: login_fn,
    loading,
    error,
    clearError,
  } = useAdminLogin({
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!login.trim() || !password.trim()) {
      return;
    }

    await login_fn(login.trim(), password);
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
            <label htmlFor="login">E-mail ou apelido</label>
            <input
              id="login"
              type="text"
              placeholder="Ex: panificadora ou seu@email.com"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value);
                clearError();
              }}
              disabled={loading}
              autoComplete="username"
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
            disabled={loading || !login.trim() || !password.trim()}
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
