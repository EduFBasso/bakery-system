import { useCancelOrder } from '../../hooks/useCancelOrder';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import styles from './styles.module.css';

export function OrdersList() {
  const { orders, loading, error, refetch } = useCustomerOrders();
  const { cancelCustomerOrder, loading: cancelLoading, error: cancelError } = useCancelOrder();
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
  );

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

  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Nenhum pedido realizado ainda</p>
          <small>Comece a fazer seus pedidos agora!</small>
        </div>
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return styles.statusDelivered;
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return '✅ Pago';
      case 'CANCELLED':
        return '✕ Não aplicável';
      default:
        return '⏳ Pendente';
    }
  };

  const formatOrderTitle = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString('pt-BR');
    const timePart = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `Pedido ${datePart} as ${timePart}`;
  };

  const formatUnitPrice = (value: string) => {
    const amount = Number.parseFloat(value || '0');
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleCancel = async (orderId: number) => {
    const reason = window.prompt('Informe o motivo do cancelamento:')?.trim();
    if (!reason) {
      return;
    }
    const result = await cancelCustomerOrder(orderId, reason);
    if (result) {
      refetch();
      window.dispatchEvent(new Event('bakery:customer-data-changed'));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {sortedOrders.map((order) => (
          <div key={order.id} className={`${styles.orderCard} ${getStatusClass(order.status)}`}>
            <div className={styles.cardHeader}>
              <div className={styles.orderNumber}>{formatOrderTitle(order.order_date)}</div>
              <div className={styles.status}>{getStatusLabel(order.status)}</div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.itemsList}>
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className={styles.itemPreview}>
                    {item.product_name} x {item.quantity} · {formatUnitPrice(item.unit_price)}/un.
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className={styles.itemPreview}>+{order.items.length - 2} mais</div>
                )}
              </div>

              <div className={styles.amount}>
                R$ {parseFloat(order.total_value).toFixed(2).replace('.', ',')}
              </div>
            </div>
            {order.status === 'PENDING' && (
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => void handleCancel(order.id)}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancelando...' : 'Cancelar pedido'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {cancelError && <div className={styles.errorMessage}>{cancelError}</div>}
    </div>
  );
}
