import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import styles from './styles.module.css';

interface TransactionHistoryProps {
  showHeader?: boolean;
}

export function TransactionHistory({ showHeader = true }: TransactionHistoryProps) {
  const { orders, loading, error } = useCustomerOrders();

  const paidOrders = orders
    .filter((order) => order.status === 'CONFIRMED' || order.status === 'DELIVERED')
    .map((order) => {
      const paidDate = order.paid_at ? new Date(order.paid_at) : null;
      const fallbackDate = order.updated_at
        ? new Date(order.updated_at)
        : new Date(order.order_date);
      return {
        ...order,
        paymentDate: paidDate || fallbackDate,
        isApproximateDate: !order.paid_at,
      };
    })
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

  const latestPayment = paidOrders[0];

  const renderHeader = (count?: number) => {
    if (!showHeader) {
      return null;
    }

    return (
      <div className={styles.header}>
        <h3>💳 Histórico de Pagamentos</h3>
        {typeof count === 'number' && <span className={styles.count}>{count}</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (paidOrders.length === 0) {
    return (
      <div className={styles.container}>
        {renderHeader()}
        <div className={styles.emptyState}>
          <p>Nenhum pagamento confirmado ainda</p>
          <small>Quando um pedido for pago, ele aparecerá aqui com data e valor.</small>
        </div>
      </div>
    );
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: string) => {
    const amount = Number.parseFloat(value || '0');
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return safeAmount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatItemsPreview = (orderItems: Array<{ product_name: string; quantity: number }>) => {
    const previewItems = orderItems
      .slice(0, 2)
      .map((item) => `${item.product_name} x ${item.quantity}`);
    const extraCount = Math.max(orderItems.length - 2, 0);

    if (extraCount > 0) {
      previewItems.push(`+${extraCount} item(ns)`);
    }

    return previewItems.join(' • ');
  };

  return (
    <div className={styles.container}>
      {renderHeader(paidOrders.length)}

      {latestPayment && (
        <div className={styles.latestPaymentCard}>
          <div className={styles.latestLabel}>Ultimo pagamento</div>
          <div className={styles.latestAmount}>{formatCurrency(latestPayment.total_value)}</div>
          <div className={styles.latestMeta}>
            {formatDateTime(latestPayment.paymentDate)}
            {latestPayment.isApproximateDate && (
              <span className={styles.approximate}> (data aproximada)</span>
            )}
          </div>
          <div className={styles.latestItems}>
            {latestPayment.items.length} item(ns) - {formatItemsPreview(latestPayment.items)}
          </div>
        </div>
      )}

      <div className={styles.list}>
        {paidOrders.map((order) => (
          <article key={order.id} className={styles.paymentCard}>
            <div className={styles.paymentHeader}>
              <strong>{order.order_number}</strong>
              <span className={styles.paidBadge}>Pago</span>
            </div>

            <div className={styles.paymentRow}>
              <span className={styles.label}>Data do pagamento</span>
              <span className={styles.value}>
                {formatDateTime(order.paymentDate)}
                {order.isApproximateDate && (
                  <span className={styles.approximate}> (data aproximada)</span>
                )}
              </span>
            </div>

            <div className={styles.paymentRow}>
              <span className={styles.label}>Valor pago</span>
              <span className={styles.amount}>{formatCurrency(order.total_value)}</span>
            </div>

            <div className={styles.paymentRow}>
              <span className={styles.label}>Itens</span>
              <span className={styles.value}>{formatItemsPreview(order.items)}</span>
            </div>

            <div className={styles.paymentRow}>
              <span className={styles.label}>Quantidade</span>
              <span className={styles.value}>
                {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
