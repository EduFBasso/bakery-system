import styles from './CustomerPrintView.module.css';
import type { AdminOrder } from '../../../hooks/useAdminOrders';

export interface PrintableCustomer {
  nickname?: string;
  company_name?: string;
  customer_type?: string;
  cpf?: string;
  cnpj?: string;
  cnpj_cpf?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  status?: string;
  created_at?: string;
  credit_limit?: string;
  financial_limit?: string;
  financial_used?: string;
  financial_available?: string;
  available_credit?: string;
}

interface CustomerPrintViewProps {
  customer: PrintableCustomer;
  formatCurrency: (value?: string | number | null) => string;
  formatDocument: (value?: string | null, type?: string) => string;
  formatPhone: (value?: string | null) => string;
  formatDate: (value?: string | null) => string;
  formatAddress: (customer: PrintableCustomer) => string;
  companyName?: string;
  companyAddress?: string;
  screenPreview?: boolean;
  orders?: AdminOrder[];
  ordersTotal?: number;
  ordersLimit?: number;
  ordersLoading?: boolean;
  ordersError?: string | null;
}

export function CustomerPrintView({
  customer,
  formatCurrency,
  formatDocument,
  formatPhone,
  formatDate,
  formatAddress,
  companyName = 'Sistema de Pedidos da Panificadora',
  companyAddress,
  screenPreview = false,
  orders = [],
  ordersTotal = 0,
  ordersLimit = 5,
  ordersLoading = false,
  ordersError = null,
}: CustomerPrintViewProps) {
  const documentValue =
    customer.customer_type === 'PF'
      ? customer.cpf || customer.cnpj_cpf
      : customer.cnpj || customer.cnpj_cpf;
  const issuedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formatOrderDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString('pt-BR') : 'Não informado';
  const getOrderItems = (order: AdminOrder) => order.order_items ?? order.items ?? [];
  const formatOrderItems = (order: AdminOrder) => {
    const items = getOrderItems(order);
    return items.length
      ? items.map((item) => `${item.product_name || 'Produto'} x${item.quantity || 0}`).join(', ')
      : 'Pedido sem itens';
  };
  const formatOrderQuantity = (order: AdminOrder) =>
    getOrderItems(order).reduce((total, item) => total + Number(item.quantity || 0), 0);
  const displayedOrders = orders.slice(0, ordersLimit);
  const displayedOrdersTotal = displayedOrders.reduce(
    (total, order) => total + Number.parseFloat(order.total_value || '0'),
    0
  );

  return (
    <article
      className={`${styles.printSheet} ${screenPreview ? styles.screenPreview : ''}`}
      data-print-card="customer-summary"
    >
      <header className={styles.printHeader}>
        <div>
          <p className={styles.tenantName}>{companyName}</p>
          <p className={styles.printSubtitle}>{companyAddress || 'Endereço não informado'}</p>
        </div>
        <div className={styles.headerMeta}>
          <strong>Resumo do cliente</strong>
          <p className={styles.printDate}>Emitido em {issuedAt}</p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <h2>Dados cadastrais</h2>
          <span
            className={`${styles.sectionStatus} ${customer.status === 'APROVADO' ? styles.statusApproved : ''} ${customer.status === 'BLOQUEADO' ? styles.statusBlocked : ''}`}
          >
            Status: {customer.status || 'Não informado'}
          </span>
        </div>
        <dl className={styles.dataGrid}>
          <div>
            <dt>Apelido:</dt>
            <dd>{customer.nickname || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Nome:</dt>
            <dd>{customer.company_name || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Tipo:</dt>
            <dd>{customer.customer_type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</dd>
          </div>
          <div>
            <dt>{customer.customer_type === 'PF' ? 'CPF:' : 'CNPJ:'}</dt>
            <dd>{formatDocument(documentValue, customer.customer_type)}</dd>
          </div>
          <div>
            <dt>Telefone:</dt>
            <dd>{formatPhone(customer.phone)}</dd>
          </div>
          <div>
            <dt>Cadastro em:</dt>
            <dd>{formatDate(customer.created_at)}</dd>
          </div>
          <div className={styles.fullWidth}>
            <dt>Endereço de entrega:</dt>
            <dd>{formatAddress(customer)}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.section}>
        <h2>Resumo financeiro</h2>
        <dl className={styles.financeGrid}>
          <div>
            <dt>Limite de crédito:</dt>
            <dd>{formatCurrency(customer.credit_limit ?? customer.financial_limit)}</dd>
          </div>
          <div>
            <dt>Pedidos em aberto:</dt>
            <dd>{formatCurrency(customer.financial_used)}</dd>
          </div>
          <div>
            <dt>Saldo disponível:</dt>
            <dd>{formatCurrency(customer.financial_available ?? customer.available_credit)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${styles.section} ${styles.ordersSection}`}>
        <h2>Histórico de pedidos (em aberto)</h2>
        {ordersLoading ? (
          <p className={styles.ordersMessage}>Carregando pedidos...</p>
        ) : ordersError ? (
          <p className={styles.ordersMessage}>{ordersError}</p>
        ) : displayedOrders.length === 0 ? (
          <p className={styles.ordersMessage}>Nenhum pedido registrado.</p>
        ) : (
          <>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Valor unitário</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {displayedOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{formatOrderDate(order.created_at)}</td>
                    <td>{formatOrderItems(order)}</td>
                    <td>{formatOrderQuantity(order)}</td>
                    <td>
                      {getOrderItems(order).length === 1
                        ? formatCurrency(getOrderItems(order)[0].unit_price)
                        : 'Vários'}
                    </td>
                    <td>{formatCurrency(order.total_value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={4}>Saldo dos pedidos (em aberto):</th>
                  <th className={styles.ordersTotalValue}>
                    {formatCurrency(displayedOrdersTotal)}
                  </th>
                </tr>
              </tfoot>
            </table>
            {ordersTotal > displayedOrders.length && (
              <p className={styles.ordersNote}>
                Exibindo {displayedOrders.length} de {ordersTotal} pedidos.
              </p>
            )}
          </>
        )}
      </section>

      <footer className={styles.printFooter}>Documento informativo para uso administrativo.</footer>
    </article>
  );
}
