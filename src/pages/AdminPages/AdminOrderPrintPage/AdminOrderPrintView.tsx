import styles from './AdminOrderPrintView.module.css';

export interface PrintableOrderItem {
  id: number;
  product_name?: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

export interface PrintableOrder {
  order_number: string;
  created_at: string;
  delivery_date: string;
  shipping_zip_code: string;
  shipping_street: string;
  shipping_number: string;
  shipping_complement?: string;
  shipping_neighborhood: string;
  shipping_city: string;
  shipping_state: string;
  total_value: string | number;
  notes?: string;
  order_items?: PrintableOrderItem[];
  items?: PrintableOrderItem[];
}

export interface PrintableOrderCustomer {
  nickname?: string;
  company_name?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
}

interface AdminOrderPrintViewProps {
  order: PrintableOrder;
  customer: PrintableOrderCustomer;
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  screenPreview?: boolean;
}

const formatCurrency = (value: string | number | null | undefined) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDateTime = (value?: string) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR');
};

const formatDate = (value?: string) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleDateString('pt-BR');
};

const formatAddress = (order: PrintableOrder) =>
  [
    [order.shipping_street, order.shipping_number].filter(Boolean).join(', '),
    order.shipping_complement,
    [order.shipping_neighborhood, order.shipping_city, order.shipping_state]
      .filter(Boolean)
      .join(' - '),
    order.shipping_zip_code ? `CEP ${order.shipping_zip_code}` : undefined,
  ]
    .filter(Boolean)
    .join(' | ') || 'Não informado';

export function AdminOrderPrintView({
  order,
  customer,
  companyName,
  companyAddress,
  companyPhone,
  screenPreview = false,
}: AdminOrderPrintViewProps) {
  const items = order.order_items ?? order.items ?? [];

  return (
    <div
      className={`${styles.printSheet} ${screenPreview ? styles.screenPreview : ''}`}
      data-print-card="order-print"
    >
      <article className={styles.printPage}>
        <header className={styles.printHeader}>
          <div>
            <p className={styles.companyName}>{companyName}</p>
            <p className={styles.companyAddress}>{companyAddress || 'Endereço não informado'}</p>
            {companyPhone && <p className={styles.companyAddress}>{companyPhone}</p>}
          </div>
          <div className={styles.headerMeta}>
            <strong>Pedido nº {order.order_number}</strong>
            <span>Realizado em {formatDateTime(order.created_at)}</span>
          </div>
        </header>

        <h1>Pedido</h1>

        <section className={styles.section}>
          <h2>Dados do cliente</h2>
          <div className={styles.dataGrid}>
            <p><strong>Nome:</strong> {customer.company_name || 'Não informado'}</p>
            <p><strong>Apelido:</strong> {customer.nickname || 'Não informado'}</p>
            <p><strong>Telefone:</strong> {customer.phone || 'Não informado'}</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Entrega</h2>
          <div className={styles.dataGrid}>
            <p><strong>Data prevista:</strong> {formatDate(order.delivery_date)}</p>
            <p className={styles.fullWidth}><strong>Endereço:</strong> {formatAddress(order)}</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Itens do pedido</h2>
          {items.length === 0 ? (
            <p>Pedido sem itens registrados.</p>
          ) : (
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor unitário</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name || 'Produto'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={3}>Total do pedido</th>
                  <th>{formatCurrency(order.total_value)}</th>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {order.notes && (
          <section className={styles.section}>
            <h2>Observações</h2>
            <p className={styles.notes}>{order.notes}</p>
          </section>
        )}

        <section className={styles.signatureSection}>
          <h2>Recebimento</h2>
          <p>Confirmo o recebimento do pedido na data abaixo.</p>
          <div className={styles.signatureGrid}>
            <div className={styles.signatureField}>
              <span>Nome de quem recebeu</span>
              <div />
            </div>
            <div className={styles.signatureField}>
              <span>Data da entrega</span>
              <div />
            </div>
          </div>
          <div className={styles.signatureField}>
            <span>Assinatura do cliente</span>
            <div />
          </div>
        </section>

        <footer className={styles.printFooter}>Documento para conferência e assinatura no momento da entrega.</footer>
      </article>
    </div>
  );
}
