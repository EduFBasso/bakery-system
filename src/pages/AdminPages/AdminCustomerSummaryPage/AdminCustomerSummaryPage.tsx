import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiService } from '../../../services/api';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDocument } from '../../../utils/formatDocument';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import { useAdminOrders } from '../../../hooks/useAdminOrders';
import {
  CustomerPrintView,
  type PrintableCustomer,
} from '../AdminCustomerDetailModal/CustomerPrintView';
import styles from './AdminCustomerSummaryPage.module.css';

const DEFAULT_PRINT_ORDER_LIMIT = 5;

const formatPhone = (value?: string | null) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return value || 'Não informado';
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : 'Não informado';

const formatAddress = (customer: PrintableCustomer) =>
  [
    [customer.street, customer.number].filter(Boolean).join(', '),
    [customer.neighborhood, customer.city, customer.state].filter(Boolean).join(' - '),
    customer.zip_code ? `CEP ${customer.zip_code}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ') || 'Não informado';

export function AdminCustomerSummaryPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const { fetchCustomerDetail, loading, error } = useAdminCustomers();
  const numericCustomerId = Number(customerId);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    pagination,
  } = useAdminOrders({
    customer_id:
      Number.isInteger(numericCustomerId) && numericCustomerId > 0 ? numericCustomerId : undefined,
    open_only: true,
    page_size: showAllOrders ? 100 : DEFAULT_PRINT_ORDER_LIMIT,
  });
  const [customer, setCustomer] = useState<PrintableCustomer | null>(null);
  const [tenant, setTenant] = useState<{
    trade_name?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null>(null);
  const [tenantError, setTenantError] = useState('');

  useEffect(() => {
    const id = numericCustomerId;
    if (!Number.isInteger(id) || id <= 0) return;

    void fetchCustomerDetail(id).then((result) => {
      if (result) setCustomer(result);
    });
    void ApiService.getTenantProfile()
      .then(setTenant)
      .catch((err: unknown) => {
        setTenantError(err instanceof Error ? err.message : 'Dados da empresa indisponíveis');
      });
  }, [numericCustomerId, fetchCustomerDetail]);

  const tenantAddress = tenant
    ? [
        [tenant.street, tenant.number].filter(Boolean).join(', '),
        [tenant.neighborhood, tenant.city, tenant.state].filter(Boolean).join(' - '),
        tenant.zip_code ? `CEP ${tenant.zip_code}` : undefined,
      ]
        .filter(Boolean)
        .join(' | ')
    : '';

  if (loading) return <div className={styles.state}>Carregando resumo do cliente...</div>;
  if (error || !customer) {
    return <div className={styles.state}>{error || 'Cliente não encontrado.'}</div>;
  }

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
        <CustomerPrintView
          customer={customer}
          formatCurrency={formatCurrency}
          formatDocument={formatDocument}
          formatPhone={formatPhone}
          formatDate={formatDate}
          formatAddress={formatAddress}
          companyName={tenant?.trade_name || 'Panificadora'}
          companyAddress={tenantAddress || tenantError}
          orders={orders}
          ordersTotal={pagination.count}
          ordersLimit={showAllOrders ? pagination.count : DEFAULT_PRINT_ORDER_LIMIT}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          screenPreview
        />
      </section>
      {!showAllOrders && pagination.count > DEFAULT_PRINT_ORDER_LIMIT && (
        <button
          type="button"
          className={styles.showAllOrdersButton}
          onClick={() => setShowAllOrders(true)}
        >
          Ver todos os pedidos ({pagination.count})
        </button>
      )}
    </main>
  );
}
