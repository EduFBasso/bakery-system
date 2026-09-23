import styles from './AdminOrderPrintView.module.css';
import { formatPhone } from '../../../utils/formatPhone';
import { formatZipCode } from '../../../utils/formatZipCode';

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
  original_address_text?: string;
  delivery_address_text?: string;
  total_value: string | number;
  status?: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
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
    order.shipping_zip_code ? `CEP ${formatZipCode(order.shipping_zip_code)}` : undefined,
  ]
    .filter(Boolean)
    .join(' ') || 'Não informado';

const normalizeAddressText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

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
  const orderNotes = order.notes?.trim() || '';
  const pages = [];
  for (let index = 0; index < Math.max(items.length, 1); index += ITEMS_PER_PAGE) {
    pages.push(items.slice(index, index + ITEMS_PER_PAGE));
  }
  const totalPages = pages.length;
  const isCancelled = order.status === 'CANCELLED';
  const isPaid = Boolean(order.paid_at);
  const statusClass = isCancelled
    ? styles.cancelledStatus
    : isPaid
      ? styles.paidStatus
      : styles.pendingStatus;
  const originalAddress = order.original_address_text?.trim() || '';
  const deliveryAddress = order.delivery_address_text?.trim() || formatAddress(order);
  const hasDifferentDeliveryAddress =
    Boolean(originalAddress) &&
    normalizeAddressText(originalAddress) !== normalizeAddressText(deliveryAddress);

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
              <p className={`${styles.paymentStatus} ${statusClass}`}>
                {isCancelled ? 'Cancelado em' : isPaid ? 'Pago em' : 'Pendente'}
                <span className={styles.statusDate}>
                  {formatDate(
                    isCancelled
                      ? (order.cancelled_at ?? undefined)
                      : isPaid
                        ? (order.paid_at ?? undefined)
                        : order.created_at
                  )}
                </span>
              </p>
            </header>

            {isFirstPage && (
              <>
                <h1 className={styles.orderTitle}>Pedido</h1>

                <section className={styles.section}>
                  <div className={styles.orderInfoLine}>
                    <p>
                      <strong>Número:</strong> {order.order_number}
                    </p>
                    <p>
                      <strong>Data:</strong> {formatDate(order.created_at)}
                    </p>
                    <p>
                      <strong>Cliente:</strong> {customer.nickname || 'Não informado'}
                    </p>
                    <p className={styles.customerPhone}>
                      <strong>Telefone:</strong>{' '}
                      {customer.phone ? formatPhone(customer.phone) : 'Não informado'}
                    </p>
                  </div>
                </section>
              </>
            )}

            <section className={`${styles.section} ${styles.itemsSection}`}>
              {pageItems.length === 0 ? (
                <p>Pedido sem itens registrados.</p>
              ) : (
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className={styles.productHeader}>Produto</th>
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

            {isLastPage && itemObservations.length > 0 && (
              <section className={styles.section}>
                <div className={styles.notesList}>
                  {itemObservations.map((observation) => (
                    <p className={styles.notes} key={String(observation.item)}>
                      &quot;Item {observation.item}&quot; - {observation.text}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {isLastPage && orderNotes && (
              <p className={styles.orderNotes}>&quot;Notas&quot; - {orderNotes}</p>
            )}

            {isLastPage && (
              <section className={`${styles.section} ${styles.addressSection}`}>
                <p className={styles.deliveryAddress}>
                  Endereço: {originalAddress || deliveryAddress}
                </p>
                {hasDifferentDeliveryAddress && (
                  <p className={`${styles.deliveryAddress} ${styles.deliveryAddressChanged}`}>
                    Endereço de entrega: {deliveryAddress}
                  </p>
                )}
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
