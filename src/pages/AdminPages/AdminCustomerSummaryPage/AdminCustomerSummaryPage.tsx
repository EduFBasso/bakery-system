import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiService } from '../../../services/api';
import { useAdminCustomers } from '../../../hooks/useAdminCustomers';
import {
  CustomerPrintView,
  type PrintableCustomer,
} from '../AdminCustomerDetailModal/CustomerPrintView';
import styles from './AdminCustomerSummaryPage.module.css';

const formatCurrency = (value?: string | number | null) => {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  return `R$ ${(Number.isFinite(numeric) ? numeric : 0).toFixed(2).replace('.', ',')}`;
};

const formatDocument = (value?: string | null, type?: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'Não informado';
  if (type === 'PF' && digits.length === 11)
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (type !== 'PF' && digits.length === 14)
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return value || 'Não informado';
};

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
    const id = Number(customerId);
    if (!Number.isInteger(id) || id <= 0) return;

    void fetchCustomerDetail(id).then((result) => {
      if (result) setCustomer(result);
    });
    void ApiService.getTenantProfile()
      .then(setTenant)
      .catch((err: unknown) => {
        setTenantError(err instanceof Error ? err.message : 'Dados da empresa indisponíveis');
      });
  }, [customerId, fetchCustomerDetail]);

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
          screenPreview
        />
      </section>
    </main>
  );
}
