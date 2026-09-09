import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminLogin } from '../../../hooks/useAdminLogin';
import { ApiService } from '../../../services/api';
import { resolveTenantSlug } from '../../../config/tenant';
import styles from './AdminLoginPage.module.css';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tenantName, setTenantName] = useState('Painel Admin');
  const [tenantLoading, setTenantLoading] = useState(true);

  useEffect(() => {
    ApiService.getTenantIdentity(resolveTenantSlug())
      .then((identity) => setTenantName(identity.trade_name || 'Painel Admin'))
      .catch(() => setTenantName('Painel Admin'))
      .finally(() => setTenantLoading(false));
  }, []);

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
          <p className={styles.eyebrow}>🛠️ Painel Admin</p>
          <h1>{tenantLoading ? 'Carregando empresa...' : tenantName}</h1>
          <p className={styles.subtitle}>Acesso restrito</p>
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
          <button type="button" className={styles.backButton} onClick={() => navigate('/')}>
            ← Voltar para Home
          </button>
          <p>Sistema de Administração</p>
        </footer>
      </div>
    </div>
  );
}
