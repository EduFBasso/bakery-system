import { useEffect, useState } from 'react';
import { AdminOrdersPanel } from '../../../components/AdminOrdersPanel/AdminOrdersPanel';
import { PageFlashMessage } from '../../../components/PageFlashMessage/PageFlashMessage';
import { useAdminCustomers, type AdminCustomer } from '../../../hooks/useAdminCustomers';
import { formatCurrency } from '../../../utils/formatCurrency';
import styles from './AdminOrdersPage.module.css';

interface AdminOrdersPageProps {
  customerNickname?: string;
  customerId?: number;
  initialStatus?: string;
}

export function AdminOrdersPage({
  customerNickname,
  customerId,
  initialStatus = 'PENDING',
}: AdminOrdersPageProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customer, setCustomer] = useState<AdminCustomer | null>(null);
  const { fetchCustomerDetail } = useAdminCustomers();

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      return;
    }
    void fetchCustomerDetail(customerId).then(setCustomer);
  }, [customerId, fetchCustomerDetail]);

  const handleRefresh = (message?: string) => {
    setRefreshTrigger((prev) => prev + 1);
    setErrorMessage(null);
    setSuccessMessage(message || null);
  };

  const handleCustomerFilterChange = (value: string) => {
    if (!value || value !== customerNickname) {
      setCustomer(null);
    }
  };

  return (
    <div className={styles.container}>
      <AdminOrdersPanel
        key={`${refreshTrigger}-${customerNickname ?? 'all'}-${customerId ?? 'all'}-${initialStatus}`}
        initialCustomerNickname={customerNickname}
        initialCustomerId={customerId}
        initialStatus={initialStatus}
        onRefresh={handleRefresh}
        onActionError={setErrorMessage}
        onCustomerFilterChange={handleCustomerFilterChange}
      />
      {customer && (
        <section className={styles.customerSummary} aria-label="Limite de saldo do cliente">
          <h2>Limite de saldo</h2>
          <div className={styles.customerSummaryGrid}>
            <div>
              <strong>{customer.nickname}</strong>
              <span>{customer.phone || 'Telefone não informado'}</span>
            </div>
            <div>
              <span>Saldo em aberto</span>
              <strong>{formatCurrency(customer.financial_used || customer.current_balance)}</strong>
            </div>
            <div>
              <span>Limite disponível</span>
              <strong>
                {formatCurrency(customer.financial_available || customer.available_credit)}
              </strong>
            </div>
          </div>
        </section>
      )}
      <PageFlashMessage
        open={!!errorMessage}
        message={errorMessage}
        type="error"
        autoCloseMs={0}
        onClose={() => setErrorMessage(null)}
      />
      <PageFlashMessage
        open={!!successMessage}
        message={successMessage}
        type="success"
        autoCloseMs={0}
        onClose={() => setSuccessMessage(null)}
      />
    </div>
  );
}
