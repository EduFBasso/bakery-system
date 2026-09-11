import { useState } from 'react';
import { useCancelOrder } from '../../hooks/useCancelOrder';
import { useCustomerOrders } from '../../hooks/useCustomerOrders';
import { formatCurrency } from '../../utils/formatCurrency';
import styles from './CustomerOrdersList.module.css';

export function OrdersList() {
  const [cancellationOrderId, setCancellationOrderId] = useState<number | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationPassword, setCancellationPassword] = useState('');
  const [cancellationValidationError, setCancellationValidationError] = useState('');
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
        return '✕ Cancelado';
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
    return formatCurrency(amount);
  };

  const openCancellationDialog = (orderId: number) => {
    setCancellationOrderId(orderId);
    setCancellationReason('');
    setCancellationPassword('');
    setCancellationValidationError('');
  };

  const closeCancellationDialog = () => {
    if (cancelLoading) {
      return;
    }
    setCancellationOrderId(null);
    setCancellationReason('');
    setCancellationPassword('');
    setCancellationValidationError('');
  };

  const handleCancel = async () => {
    if (cancellationOrderId === null) {
      return;
    }
    const reason = cancellationReason.trim();
    if (!reason || !cancellationPassword) {
      setCancellationValidationError(
        !reason
          ? 'Informe o motivo para cancelar o pedido.'
          : 'Informe sua senha para confirmar o cancelamento.'
      );
      return;
    }

    const result = await cancelCustomerOrder(cancellationOrderId, reason, cancellationPassword);
    if (result) {
      closeCancellationDialog();
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
              <div className={`${styles.status} ${getStatusClass(order.status)}`}>
                {getStatusLabel(order.status)}
              </div>
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
                {formatCurrency(order.total_value)}
              </div>
            </div>
            {order.status === 'PENDING' && (
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => openCancellationDialog(order.id)}
                  disabled={cancelLoading}
                >
                  Cancelar pedido
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {cancelError && <div className={styles.errorMessage}>{cancelError}</div>}
      {cancellationOrderId !== null && (
        <div className={styles.dialogOverlay} role="presentation">
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancellation-dialog-title"
          >
            <h2 id="cancellation-dialog-title">Cancelar pedido</h2>
            <p className={styles.dialogDescription}>
              Informe o motivo do cancelamento para continuar.
            </p>
            <label className={styles.dialogLabel} htmlFor="cancellation-reason">
              Motivo do cancelamento
            </label>
            <textarea
              id="cancellation-reason"
              className={styles.dialogInput}
              value={cancellationReason}
              onChange={(event) => {
                setCancellationReason(event.target.value);
                setCancellationValidationError('');
              }}
              placeholder="Ex.: pedido duplicado"
              rows={4}
              maxLength={500}
              autoFocus
              aria-invalid={Boolean(cancellationValidationError)}
              aria-describedby={cancellationValidationError ? 'cancellation-error' : undefined}
              disabled={cancelLoading}
            />
            <label className={styles.dialogLabel} htmlFor="cancellation-password">
              Sua senha
            </label>
            <input
              id="cancellation-password"
              className={styles.dialogPassword}
              type="password"
              value={cancellationPassword}
              onChange={(event) => {
                setCancellationPassword(event.target.value);
                setCancellationValidationError('');
              }}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={cancelLoading}
            />
            {cancellationValidationError && (
              <p id="cancellation-error" className={styles.dialogError} role="alert">
                {cancellationValidationError}
              </p>
            )}
            {cancelError && <p className={styles.dialogError}>{cancelError}</p>}
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogSecondaryButton}
                onClick={closeCancellationDialog}
                disabled={cancelLoading}
              >
                Voltar
              </button>
              <button
                type="button"
                className={styles.dialogPrimaryButton}
                onClick={() => void handleCancel()}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
