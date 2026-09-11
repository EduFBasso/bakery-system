import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { AdminPasswordDialog } from '../../pages/AdminPages/AdminPasswordDialog/AdminPasswordDialog';
import { AdminOrder, useAdminOrders } from '../../hooks/useAdminOrders';
import { useUpdateOrderStatus } from '../../hooks/useUpdateOrderStatus';
import { useCancelOrder } from '../../hooks/useCancelOrder';
import styles from './AdminOrdersPanel.module.css';

const PAYMENT_FILTERS = [
  { value: '', label: 'Todos os Status' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PAID', label: 'Pago' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

interface AdminOrdersPanelProps {
  onRefresh?: () => void;
}

export function AdminOrdersPanel({ onRefresh }: AdminOrdersPanelProps) {
  const [filters, setFilters] = useState({
    status: '',
    customer_nickname: '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20,
  });

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<'pay' | 'cancel' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { orders, loading, error, pagination } = useAdminOrders(filters);
  const { updateStatus, loading: statusLoading, error: statusError } = useUpdateOrderStatus();
  const { cancelOrder, loading: cancelLoading, error: cancelError } = useCancelOrder();

  const isActionLoading = statusLoading || cancelLoading;

  const getPaymentInfo = (order: AdminOrder) => {
    if (order.status === 'CANCELLED') {
      return { value: 'CANCELLED', label: 'Cancelado', color: 'var(--color-danger-strong)' };
    }

    if (order.status === 'CONFIRMED' || order.status === 'DELIVERED') {
      return { value: 'PAID', label: 'Pago', color: 'var(--color-success-strong)' };
    }

    return { value: 'PENDING', label: 'Pendente', color: 'var(--color-warning-strong)' };
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR');
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
  };

  const openSecurityAction = (action: 'pay' | 'cancel', order: AdminOrder) => {
    setSecurityAction(action);
    setSelectedOrder(order);
    setSecurityDialogOpen(true);
  };

  const closeSecurityDialog = () => {
    setSecurityDialogOpen(false);
    setSecurityAction(null);
    setSelectedOrder(null);
  };

  const handleSecurityConfirm = async (adminPassword: string) => {
    if (!selectedOrder || !securityAction) {
      return;
    }

    if (securityAction === 'pay') {
      const result = await updateStatus(selectedOrder.id, 'CONFIRMED', adminPassword);
      if (result) {
        closeSecurityDialog();
        onRefresh?.();
      }
      return;
    }

    const result = await cancelOrder(
      selectedOrder.id,
      'Cancelado pelo administrador',
      'CREDIT',
      adminPassword
    );
    if (result) {
      closeSecurityDialog();
      onRefresh?.();
    }
  };

  const toggleExpanded = (orderId: number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  if (loading && orders.length === 0) {
    return <div className={styles.loading}>Carregando pedidos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Pesquisar por apelido do cliente..."
          value={filters.customer_nickname}
          onChange={(e) => setFilters({ ...filters, customer_nickname: e.target.value, page: 1 })}
          className={styles.filterInput}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          className={styles.filterSelect}
        >
          {PAYMENT_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
          className={styles.filterInput}
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
          className={styles.filterInput}
        />
      </div>

      {(error || statusError || cancelError) && (
        <div className={styles.error}>Erro: {error || statusError || cancelError}</div>
      )}

      <section className={styles.tableSection}>
        <h2>Gerenciamento de Pedidos</h2>

        {orders.length === 0 ? (
          <p className={styles.emptyState}>Nenhum pedido encontrado.</p>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Pagamento</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`${styles.orderRow} ${
                          expandedOrderId === order.id ? styles.orderRowExpanded : ''
                        }`}
                        onClick={() => toggleExpanded(order.id)}
                      >
                        <td className={styles.orderNumber}>{order.order_number}</td>
                        <td>{order.customer_nickname}</td>
                        <td>
                          <span
                            className={styles.statusBadge}
                            style={{ backgroundColor: getPaymentInfo(order).color }}
                          >
                            {getPaymentInfo(order).label}
                          </span>
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td className={styles.value}>{formatCurrency(order.total_value)}</td>
                        <td className={styles.actions}>
                          <button
                            className={`${styles.expandBtn} ${
                              expandedOrderId === order.id ? styles.expandBtnActive : ''
                            }`}
                            aria-expanded={expandedOrderId === order.id}
                            aria-controls={`order-details-${order.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(order.id);
                            }}
                          >
                            {expandedOrderId === order.id ? 'Ocultar' : 'Ver'}
                          </button>
                        </td>
                      </tr>

                      {expandedOrderId === order.id && (
                        <tr className={styles.expandedRow}>
                          <td colSpan={6}>
                            <div id={`order-details-${order.id}`} className={styles.details}>
                              <div className={styles.detailsGrid}>
                                <div>
                                  <strong>Data de Entrega:</strong>
                                  <p>{formatDate(order.delivery_date)}</p>
                                </div>
                                <div>
                                  <strong>Método de Pagamento:</strong>
                                  <p>{order.payment_method}</p>
                                </div>
                                <div>
                                  <strong>Pagamento Confirmado em:</strong>
                                  <p>{formatDateTime(order.paid_at)}</p>
                                </div>
                                <div>
                                  <strong>Cancelado em:</strong>
                                  <p>{formatDateTime(order.cancelled_at)}</p>
                                </div>
                                <div>
                                  <strong>Itens:</strong>
                                  <ul className={styles.itemsList}>
                                    {order.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.product_name} × {item.quantity} ={' '}
                                        {formatCurrency(item.subtotal)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>

                              <div className={styles.actionButtons}>
                                {getPaymentInfo(order).value === 'PENDING' && (
                                  <button
                                    className={styles.payBtn}
                                    disabled={isActionLoading}
                                    onClick={() => openSecurityAction('pay', order)}
                                  >
                                    ✅ Marcar como pago
                                  </button>
                                )}

                                {order.status !== 'CANCELLED' && (
                                  <button
                                    className={styles.cancelBtn}
                                    disabled={isActionLoading}
                                    onClick={() => openSecurityAction('cancel', order)}
                                  >
                                    ✖ Cancelar Pedido
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                disabled={!pagination.previous}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                ← Anterior
              </button>
              <span>
                Página {filters.page} de {Math.ceil(pagination.count / filters.page_size)}
              </span>
              <button
                disabled={!pagination.next}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Próxima →
              </button>
            </div>
          </>
        )}
      </section>

      <AdminPasswordDialog
        isOpen={securityDialogOpen}
        title={securityAction === 'pay' ? 'Confirmar Pagamento' : 'Confirmar Cancelamento'}
        description={
          securityAction === 'pay'
            ? 'Digite a senha do dono para marcar este pedido como pago.'
            : 'Digite a senha do dono para cancelar este pedido.'
        }
        confirmLabel={securityAction === 'pay' ? 'Confirmar Pagamento' : 'Confirmar Cancelamento'}
        isLoading={isActionLoading}
        error={statusError || cancelError}
        onClose={closeSecurityDialog}
        onConfirm={handleSecurityConfirm}
      />
    </div>
  );
}
