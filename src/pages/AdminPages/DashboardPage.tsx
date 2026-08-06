import { useEffect, useState } from 'react';
import { useAdminCustomers } from '../../hooks/useAdminCustomers';
import styles from './AdminPages.module.css';

interface DashboardPageProps {
  onNavigateToCustomers?: (filter?: string) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function DashboardPage({ onNavigateToCustomers, onError, onSuccess }: DashboardPageProps) {
  const { stats, loading, error, fetchAdminStats } = useAdminCustomers({
    onError,
    onSuccess,
  });

  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleTotalClick = () => {
    onNavigateToCustomers?.();
  };

  const handlePendingClick = () => {
    onNavigateToCustomers?.('PENDENTE');
  };

  const handleApprovedClick = () => {
    onNavigateToCustomers?.('APROVADO');
  };

  return (
    <div>
      {successMessage && <div className={styles.successAlert}>{successMessage}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}

      {/* KPIs Section */}
      <section className={styles.kpisSection}>
        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handleTotalClick}
          title="Clique para ver todos os clientes"
        >
          <h3>👥 Total de Clientes</h3>
          <p className={styles.kpiValue}>{loading ? '...' : stats?.total_customers || 0}</p>
          <p className={styles.kpiHint}>Clique para listar</p>
        </button>

        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handlePendingClick}
          title="Clique para ver pendentes"
        >
          <h3>⏳ Pendentes</h3>
          <p className={styles.kpiValue}>{loading ? '...' : stats?.pending_customers || 0}</p>
          <p className={styles.kpiHint}>Clique para listar</p>
        </button>

        <button
          className={`${styles.kpiCard} ${styles.kpiButton}`}
          onClick={handleApprovedClick}
          title="Clique para ver aprovados"
        >
          <h3>✅ Aprovados</h3>
          <p className={styles.kpiValue}>{loading ? '...' : stats?.approved_customers || 0}</p>
          <p className={styles.kpiHint}>Clique para listar</p>
        </button>
      </section>

      {/* Balance Section */}
      <section className={styles.balanceSection}>
        <h2>💰 Saldo Utilizado</h2>
        <div className={styles.balanceCard}>
          <p className={styles.balanceValue}>
            R$ {loading ? '...' : stats?.used_balance || stats?.balance_receivable || '0.00'}
          </p>
          <p className={styles.balanceLabel}>Total de gasto em pedidos no crédito</p>
        </div>
      </section>
    </div>
  );
}
