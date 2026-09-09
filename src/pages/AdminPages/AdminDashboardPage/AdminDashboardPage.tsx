import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import styles from './AdminDashboardPage.module.css';

interface AdminDashboardPageProps {
  onNavigateToCustomers?: (filter?: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function AdminDashboardPage({
  onNavigateToCustomers,
  onError,
  onSuccess,
}: AdminDashboardPageProps) {
  const { stats, loading, error, fetchAdminStats } = useAdminCustomers({
    onError,
    onSuccess,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const showInitialLoading = loading && !stats;

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  useEffect(() => {
    const refreshStats = () => {
      fetchAdminStats();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshStats();
      }
    };

    window.addEventListener('focus', refreshStats);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const intervalId = window.setInterval(refreshStats, 15000);

    return () => {
      window.removeEventListener('focus', refreshStats);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [fetchAdminStats]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePendingClick = () => {
    onNavigateToCustomers?.('PENDENTE');
  };

  const handleActiveClick = () => {
    onNavigateToCustomers?.('APROVADO');
  };

  const handleBlockedClick = () => {
    onNavigateToCustomers?.('BLOQUEADO');
  };

  return (
    <div aria-busy={loading}>
      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* KPIs Section */}
      <section className={styles.kpisSection}>
        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handleActiveClick}
          title="Clique para ver clientes ativos"
        >
          <h3>👥 Clientes Ativos</h3>
          <p className={styles.kpiValue}>
            {showInitialLoading ? '...' : stats?.active_customers || 0}
          </p>
          <p className={styles.kpiHint}>
            Saldo em aberto: R$ {stats?.active_open_balance || '0.00'}
          </p>
        </button>

        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handlePendingClick}
          title="Clique para ver pendentes"
        >
          <h3>⏳ Pendentes</h3>
          <p className={styles.kpiValue}>
            {showInitialLoading ? '...' : stats?.pending_customers || 0}
          </p>
          <p className={styles.kpiHint}>Clique para listar</p>
        </button>

        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handleBlockedClick}
          title="Clique para ver clientes bloqueados"
        >
          <h3>🚫 Bloqueados</h3>
          <p className={styles.kpiValue}>
            {showInitialLoading ? '...' : stats?.blocked_customers || 0}
          </p>
          <p className={styles.kpiHint}>
            Saldo em aberto: R$ {stats?.blocked_open_balance || '0.00'}
          </p>
        </button>
      </section>
    </div>
  );
}
