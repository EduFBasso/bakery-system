import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import styles from './CustomerTransactionHistory.module.css';

export function TransactionHistory() {
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  if (paidOrders.length === 0) {
    return (
      <div className={styles.container}>
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

  const formatUnitPrice = (value: string) => {
    const amount = Number.parseFloat(value || '0');
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatItemsPreview = (
    orderItems: Array<{ product_name: string; quantity: number; unit_price: string }>
  ) => {
    const previewItems = orderItems
      .slice(0, 2)
      .map(
        (item) =>
          `${item.product_name} x ${item.quantity} · ${formatUnitPrice(item.unit_price)}/un.`
      );
    const extraCount = Math.max(orderItems.length - 2, 0);

    if (extraCount > 0) {
      previewItems.push(`+${extraCount} item(ns)`);
    }

    return previewItems.join(' • ');
  };

  return (
    <div className={styles.container}>
      {latestPayment && (
        <div className={styles.latestPaymentCard}>
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
    </div>
  );
}
