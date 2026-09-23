import { useEffect, useMemo, useState } from 'react';
import { ApiService } from '../../../services/api';
import { useAdminCustomers, type AdminCustomer } from '../../../hooks/useAdminCustomers';
import { useAdminOrders, type AdminOrder } from '../../../hooks/useAdminOrders';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatPhone } from '../../../utils/formatPhone';
import styles from './AdminOpenBalanceReportPage.module.css';

const formatDate = (value: Date) => value.toLocaleDateString('pt-BR');
const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : 'Não informado';
const formatPaymentMethod = (value?: string) => {
  switch (value) {
    case 'CREDIT':
      return 'Fiado';
    case 'CASH':
      return 'Dinheiro';
    case 'PIX':
      return 'PIX';
    case 'TRANSFER':
      return 'Transferência';
    default:
      return value || 'Não informado';
  }
};

const formatAddress = (customer: AdminCustomer) =>
  [
    [customer.street, customer.number].filter(Boolean).join(', '),
    [customer.neighborhood, customer.city, customer.state].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join(' | ') || 'Não informado';

const groupCustomersIntoPages = (customers: AdminCustomer[], isComplete: boolean) => {
  const pageSize = isComplete ? 3 : 28;
  return Array.from({ length: Math.ceil(customers.length / pageSize) }, (_, index) =>
    customers.slice(index * pageSize, (index + 1) * pageSize)
  );
};

export function AdminOpenBalanceReportPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const customerStatus =
    searchParams.get('customer_status') === 'BLOQUEADO' ? 'BLOQUEADO' : 'APROVADO';
  const reportMode = searchParams.get('mode') === 'complete' ? 'complete' : 'summary';
  const isComplete = reportMode === 'complete';
  const hasOpenBalanceFilter = searchParams.get('has_open_balance') === 'true';
  const { allCustomers, loading, error, fetchAllCustomers } = useAdminCustomers();
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
  } = useAdminOrders({
    enabled: true,
    open_only: true,
    ordering: 'created_at',
    page: 1,
    page_size: 100,
  });
  const [tenant, setTenant] = useState<{ trade_name?: string; street?: string; number?: string }>();
  const [tenantError, setTenantError] = useState('');

  useEffect(() => {
    void fetchAllCustomers({
      status: customerStatus,
      has_open_balance: hasOpenBalanceFilter,
      page_size: 100,
    });
    void ApiService.getTenantProfile()
      .then(setTenant)
      .catch((err: unknown) => {
        setTenantError(err instanceof Error ? err.message : 'Dados da empresa indisponíveis');
      });
  }, [customerStatus, fetchAllCustomers, hasOpenBalanceFilter]);

  const totalOpenBalance = useMemo(
    () =>
      allCustomers.reduce(
        (total, customer) =>
          total + Number(customer.financial_used || customer.current_balance || 0),
        0
      ),
    [allCustomers]
  );

  const ordersByCustomer = useMemo(() => {
    const grouped = new Map<number, AdminOrder[]>();
    orders.forEach((order) => {
      const customerOrders = grouped.get(order.customer_id) || [];
      grouped.set(order.customer_id, [...customerOrders, order]);
    });
    return grouped;
  }, [orders]);

  const customerPages = useMemo(
    () => groupCustomersIntoPages(allCustomers, isComplete),
    [allCustomers, isComplete]
  );

  if (loading || ordersLoading)
    return <div className={styles.state}>Carregando relatório de saldo...</div>;
  if (error || ordersError) return <div className={styles.state}>{error || ordersError}</div>;

  return (
    <main className={styles.page}>
      <div className={styles.toolbar} data-screen-only>
        <button type="button" onClick={() => window.close()} className={styles.backButton}>
          ← Voltar
        </button>
        <button type="button" onClick={() => window.print()} className={styles.printButton}>
          🖨️ Gerar cópia
        </button>
      </div>

      <div className={styles.reportPages} data-print-card="open-balance-report">
        {(customerPages.length ? customerPages : [[]]).map((pageCustomers, pageIndex) => (
          <section className={styles.paper} key={pageIndex} data-page-number={pageIndex + 1}>
            <header className={styles.companyHeader}>
              <div>
                <h1>{tenant?.trade_name || 'Panificadora'}</h1>
                <p>
                  {tenant ? [tenant.street, tenant.number].filter(Boolean).join(', ') : tenantError}
                </p>
              </div>
              <div className={styles.documentMeta}>
                <strong
                  className={customerStatus === 'BLOQUEADO' ? styles.blockedTitle : undefined}
                >
                  {customerStatus === 'BLOQUEADO'
                    ? 'RELATÓRIO DE CLIENTES BLOQUEADOS'
                    : 'RELATÓRIO DE SALDO EM ABERTO'}
                </strong>
                <span>{isComplete ? 'Modelo completo' : 'Resumo'}</span>
                <span>Emitido em {formatDate(new Date())}</span>
              </div>
            </header>

            <div className={styles.divider} />

            {pageIndex === 0 && (
              <section className={styles.summary}>
                <div>
                  <span>
                    {customerStatus === 'BLOQUEADO' ? 'Clientes bloqueados' : 'Clientes com saldo'}
                  </span>
                  <strong>{allCustomers.length}</strong>
                </div>
                <div>
                  <span>Total em aberto</span>
                  <strong>{formatCurrency(totalOpenBalance)}</strong>
                </div>
              </section>
            )}

            {allCustomers.length === 0 ? (
              <p className={styles.emptyState}>
                {customerStatus === 'BLOQUEADO'
                  ? 'Nenhum cliente bloqueado encontrado.'
                  : 'Nenhum cliente com saldo em aberto.'}
              </p>
            ) : isComplete ? (
              <div className={styles.customerList}>
                {pageCustomers.map((customer) => {
                  const customerOrders = ordersByCustomer.get(customer.id) || [];
                  return (
                    <section key={customer.id} className={styles.customerBlock}>
                      <div className={styles.customerSummary}>
                        <div className={styles.customerInfo}>
                          <h2>{customer.nickname}</h2>
                          <p className={styles.phone}>{formatPhone(customer.phone)}</p>
                          <p>{formatAddress(customer)}</p>
                        </div>
                        <strong className={styles.balance}>
                          {formatCurrency(customer.financial_used || customer.current_balance)}
                        </strong>
                      </div>

                      {isComplete && (
                        <div className={styles.ordersList}>
                          {customerOrders.length === 0 ? (
                            <p className={styles.missingOrders}>
                              Pedidos em aberto não encontrados.
                            </p>
                          ) : (
                            customerOrders.map((order) => (
                              <article key={order.id} className={styles.orderBlock}>
                                <header className={styles.orderHeader}>
                                  <strong>Pedido {order.order_number}</strong>
                                  <span>Feito em {formatDateTime(order.created_at)}</span>
                                  <span>Entrega {formatDateTime(order.delivery_date)}</span>
                                  <span>{formatPaymentMethod(order.payment_method)}</span>
                                  <strong>{formatCurrency(order.total_value)}</strong>
                                </header>
                                <div className={styles.orderDetails}>
                                  <div>
                                    <strong>Itens</strong>
                                    <ul>
                                      {order.items.map((item) => (
                                        <li key={item.id || `${order.id}-${item.product_name}`}>
                                          {item.product_name} x {item.quantity} ·{' '}
                                          {formatCurrency(item.unit_price)}/un.
                                          {item.product_description?.trim() && (
                                            <small>{item.product_description.trim()}</small>
                                          )}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <strong>Entrega</strong>
                                    <p>
                                      {[
                                        order.shipping_street,
                                        order.shipping_number,
                                        order.shipping_complement,
                                      ]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </p>
                                    <p>
                                      {[
                                        order.shipping_neighborhood,
                                        order.shipping_city,
                                        order.shipping_state,
                                      ]
                                        .filter(Boolean)
                                        .join(' - ')}
                                    </p>
                                  </div>
                                </div>
                                {order.notes?.trim() && (
                                  <p className={styles.notes}>
                                    <strong>Observações:</strong> {order.notes.trim()}
                                  </p>
                                )}
                              </article>
                            ))
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Saldo em aberto</th>
                    <th>Quantidade de pedidos</th>
                  </tr>
                </thead>
                <tbody>
                  {pageCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.nickname}</td>
                      <td className={styles.reportPhone}>{formatPhone(customer.phone)}</td>
                      <td className={styles.balance}>
                        {formatCurrency(customer.financial_used || customer.current_balance)}
                      </td>
                      <td className={styles.orderCount}>
                        {ordersByCustomer.get(customer.id)?.length || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <footer className={styles.pageFooter}>
              Página {pageIndex + 1} de {customerPages.length || 1}
            </footer>
          </section>
        ))}
      </div>
    </main>
  );
}
