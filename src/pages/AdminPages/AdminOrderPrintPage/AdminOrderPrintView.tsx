import styles from './AdminOrderPrintView.module.css';
import { formatPhone } from '../../../utils/formatPhone';

export interface PrintableOrderItem {
  id: number;
  product_name?: string;
  product_description?: string;
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
  paid_at?: string | null;
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

const ITEMS_PER_PAGE = 3;

const formatCurrency = (value: string | number | null | undefined) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const itemObservations = items
    .map((item, index) => ({
      item: index + 1,
      text: item.product_description?.trim() || '',
    }))
    .filter((observation) => observation.text);
  const observations = [
    ...itemObservations,
    ...(order.notes?.trim() ? [{ item: 'Pedido', text: order.notes.trim() }] : []),
  ];
  const pages = [];
  for (let index = 0; index < Math.max(items.length, 1); index += ITEMS_PER_PAGE) {
    pages.push(items.slice(index, index + ITEMS_PER_PAGE));
  }
  const totalPages = pages.length;

  return (
    <div
      className={`${styles.printSheet} ${screenPreview ? styles.screenPreview : ''}`}
      data-print-card="order-print"
    >
      {pages.map((pageItems, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;

        return (
          <article className={styles.printPage} key={pageIndex} data-page-number={pageIndex + 1}>
            <header className={styles.printHeader}>
              <div>
                <p className={styles.companyName}>{companyName}</p>
                <p className={styles.companyAddress}>
                  {companyAddress || 'Endereço não informado'}
                  {companyPhone && (
                    <>
                      <br />
                      <strong>Telefone:</strong> {formatPhone(companyPhone)}
                    </>
                  )}
                </p>
              </div>
              <p className={styles.paymentStatus}>{order.paid_at ? 'Pago' : 'Pendente'}</p>
            </header>

            {isFirstPage && (
              <>
                <h1>
                  Pedido nº {order.order_number} - {formatDate(order.created_at)}
                </h1>

                <section className={styles.section}>
                  <div className={styles.customerLine}>
                    <p>
                      <strong>Cliente:</strong> {customer.nickname || 'Não informado'}
                    </p>
                    <p>
                      <strong>Nome:</strong> {customer.company_name || 'Não informado'}
                    </p>
                    <p>
                      <strong>Telefone:</strong>{' '}
                      {customer.phone ? formatPhone(customer.phone) : 'Não informado'}
                    </p>
                  </div>
                  <p className={styles.deliveryAddress}>
                    <strong>Endereço:</strong> {formatAddress(order)}
                  </p>
                </section>
              </>
            )}

            <section className={`${styles.section} ${styles.itemsSection}`}>
              <h2>{isFirstPage ? 'Produtos Solicitados' : 'Produtos Solicitados (continuação)'}</h2>
              {pageItems.length === 0 ? (
                <p>Pedido sem itens registrados.</p>
              ) : (
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Valor unitário</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, itemIndex) => (
                      <tr key={item.id}>
                        <td>{pageIndex * ITEMS_PER_PAGE + itemIndex + 1}</td>
                        <td>{item.product_name || 'Produto'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {isLastPage && (
                    <tfoot>
                      <tr>
                        <th colSpan={4} className={styles.totalLabel}>
                          Total de pedidos
                        </th>
                        <th className={styles.totalValue}>{formatCurrency(order.total_value)}</th>
                      </tr>
                    </tfoot>
                  )}
                </table>
              )}
            </section>

            {isLastPage && observations.length > 0 && (
              <section className={styles.section}>
                <table className={styles.notesTable}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((observation) => (
                      <tr key={String(observation.item)}>
                        <td>{observation.item}</td>
                        <td className={styles.notes}>{observation.text}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {isLastPage && (
              <section className={styles.signatureSection}>
                <div className={styles.signatureGrid}>
                  <div className={styles.signatureField}>
                    <div />
                    <span>Recebido por</span>
                  </div>
                  <div className={styles.signatureField}>
                    <div />
                    <span>Data</span>
                  </div>
                  <div className={styles.signatureField}>
                    <div />
                    <span>Assinatura</span>
                  </div>
                </div>
              </section>
            )}

            <footer className={styles.pageFooter}>
              Página {pageIndex + 1} de {totalPages}
            </footer>
          </article>
        );
      })}
    </div>
  );
}
