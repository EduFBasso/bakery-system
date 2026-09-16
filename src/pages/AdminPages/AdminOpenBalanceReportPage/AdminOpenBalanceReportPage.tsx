import { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../../../services/api';
import { useAdminCustomers, type AdminCustomer } from '../../../hooks/useAdminCustomers';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './AdminOpenBalanceReportPage.module.css';

const formatDate = (value: Date) => value.toLocaleDateString('pt-BR');

const formatAddress = (customer: AdminCustomer) =>
  [
    [customer.street, customer.number].filter(Boolean).join(', '),
    [customer.neighborhood, customer.city, customer.state].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join(' | ') || 'Não informado';

export function AdminOpenBalanceReportPage() {
  const { allCustomers, loading, error, fetchAllCustomers } = useAdminCustomers();
  const [tenant, setTenant] = useState<{ trade_name?: string; street?: string; number?: string }>();
  const [tenantError, setTenantError] = useState('');

  useEffect(() => {
    void fetchAllCustomers({
      status: 'APROVADO',
      has_open_balance: true,
      page_size: 100,
    });
    void ApiService.getTenantProfile()
      .then(setTenant)
      .catch((err: unknown) => {
        setTenantError(err instanceof Error ? err.message : 'Dados da empresa indisponíveis');
      });
  }, [fetchAllCustomers]);

  const totalOpenBalance = useMemo(
    () =>
      allCustomers.reduce(
        (total, customer) =>
          total + Number(customer.financial_used || customer.current_balance || 0),
        0
      ),
    [allCustomers]
  );

  if (loading) return <div className={styles.state}>Carregando relatório de saldo...</div>;
  if (error) return <div className={styles.state}>{error}</div>;

  return (
    <main className={styles.page}>
      <div className={styles.toolbar} data-screen-only>
        <button type="button" onClick={() => window.close()} className={styles.backButton}>
          ← Voltar
        </button>
        <button type="button" onClick={() => window.print()} className={styles.printButton}>
          🖨️ Imprimir
        </button>
      </div>

      <section className={styles.paper}>
        <header className={styles.companyHeader}>
          <div>
            <h1>{tenant?.trade_name || 'Panificadora'}</h1>
            <p>
              {tenant ? [tenant.street, tenant.number].filter(Boolean).join(', ') : tenantError}
            </p>
          </div>
          <div className={styles.documentMeta}>
            <strong>RELATÓRIO DE SALDO EM ABERTO</strong>
            <span>Emitido em {formatDate(new Date())}</span>
          </div>
        </header>

        <div className={styles.divider} />

        <section className={styles.summary}>
          <div>
            <span>Clientes com saldo</span>
            <strong>{allCustomers.length}</strong>
          </div>
          <div>
            <span>Total em aberto</span>
            <strong>{formatCurrency(totalOpenBalance)}</strong>
          </div>
        </section>

        {allCustomers.length === 0 ? (
          <p className={styles.emptyState}>Nenhum cliente com saldo em aberto.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone</th>
                <th>Endereço</th>
                <th>Saldo em aberto</th>
              </tr>
            </thead>
            <tbody>
              {allCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.nickname}</strong>
                  </td>
                  <td>{customer.phone || 'Não informado'}</td>
                  <td>{formatAddress(customer)}</td>
                  <td className={styles.balance}>
                    {formatCurrency(customer.financial_used || customer.current_balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <footer className={styles.footer}>
          <span>Conferência manual: ____________________________________</span>
          <span>Responsável: ____________________________________</span>
        </footer>
      </section>
    </main>
  );
}
