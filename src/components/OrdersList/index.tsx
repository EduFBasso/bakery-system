import { useEffect, useRef } from 'react';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import styles from './styles.module.css';

interface OrdersListProps {
  showHeader?: boolean;
  isExpanded?: boolean;
}

export function OrdersList({ showHeader = true, isExpanded = false }: OrdersListProps) {
  const { orders, loading, error } = useCustomerOrders();
  const lastOrderRef = useRef<HTMLDivElement | null>(null);
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(a.order_date).getTime() - new Date(b.order_date).getTime()
  );

  useEffect(() => {
    if (!isExpanded || sortedOrders.length === 0) {
      return;
    }

    // Aguarda a animacao do bloco para posicionar na ultima linha (pedido mais recente).
    const timer = window.setTimeout(() => {
      lastOrderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [isExpanded, sortedOrders.length]);

  const renderHeader = (count?: number) => {
    if (!showHeader) {
      return null;
    }

    return (
      <div className={styles.header}>
        <h3>📦 Meus Pedidos</h3>
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

  if (orders.length === 0) {
    return (
      <div className={styles.container}>
        {renderHeader()}
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

  return (
    <div className={styles.container}>
      {renderHeader(sortedOrders.length)}

      <div className={styles.list}>
        {sortedOrders.map((order, index) => (
          <div
            key={order.id}
            className={styles.orderCard}
            ref={index === sortedOrders.length - 1 ? lastOrderRef : null}
          >
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.orderNumber}>{formatOrderTitle(order.order_date)}</div>
              </div>
              <div className={`${styles.status} ${getStatusClass(order.status)}`}>
                {`Pagamento: ${getStatusLabel(order.status)}`}
              </div>
            </div>

            <div className={styles.cardContent}>
              <div className={styles.items}>
                <div className={styles.itemCount}>
                  {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                </div>
                <div className={styles.itemsList}>
                  {order.items.slice(0, 2).map((item) => (
                    <div key={item.id} className={styles.itemPreview}>
                      • {item.product_name} (qty: {item.quantity})
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className={styles.itemPreview}>• +{order.items.length - 2} mais</div>
                  )}
                </div>
              </div>

              <div className={styles.amount}>R$ {parseFloat(order.total_value).toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
