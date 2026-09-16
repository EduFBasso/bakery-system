import React, { useEffect, useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { AdminPasswordDialog } from '../../pages/AdminPages/AdminPasswordDialog/AdminPasswordDialog';
import { AdminOrder, useAdminOrders } from '../../hooks/useAdminOrders';
import { useUpdateOrderStatus } from '../../hooks/useUpdateOrderStatus';
import { useCancelOrder } from '../../hooks/useCancelOrder';
import styles from './AdminOrdersPanel.module.css';

const PAYMENT_FILTERS = [
  { value: 'PAID', label: 'Pagamentos Confirmados', icon: '✅' },
  { value: 'PENDING', label: 'Pagamentos Pendentes', icon: '⏳' },
  { value: 'CANCELLED', label: 'Cancelados', icon: '🚫' },
];

const formatOrderDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

const getOrderNumberClass = (status: string) => {
  switch (status) {
    case 'CONFIRMED':
    case 'DELIVERED':
      return styles.orderNumberPaid;
    case 'CANCELLED':
      return styles.orderNumberCancelled;
    default:
      return styles.orderNumberPending;
  }
};

interface AdminOrdersPanelProps {
  initialCustomerNickname?: string;
  onRefresh?: (successMessage?: string) => void;
  onActionError?: (errorMessage: string) => void;
}

export function AdminOrdersPanel({
  initialCustomerNickname,
  onRefresh,
  onActionError,
}: AdminOrdersPanelProps) {
  const [filters, setFilters] = useState({
    status: 'PENDING',
    customer_nickname: initialCustomerNickname || '',
    date_from: '',
    date_to: '',
    page: 1,
    page_size: 20,
  });

  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [securityAction, setSecurityAction] = useState<'pay' | 'cancel' | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);

  const { orders, loading, error, pagination } = useAdminOrders(filters);
  const { updateStatus, loading: statusLoading, error: statusError } = useUpdateOrderStatus();
  const { cancelOrder, loading: cancelLoading, error: cancelError } = useCancelOrder();

  const isActionLoading = statusLoading || cancelLoading;
  const actionError = statusError || cancelError;

  useEffect(() => {
    if (actionError) {
      onActionError?.(actionError);
    }
  }, [actionError, onActionError]);

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
        onRefresh?.(`✅ Pedido ${selectedOrder.order_number} marcado como pago.`);
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
      onRefresh?.(`✅ Pedido ${selectedOrder.order_number} cancelado com sucesso.`);
    }
  };

  if (loading && orders.length === 0) {
    return <div className={styles.loading}>Carregando pedidos...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <div className={styles.statusTabs} role="group" aria-label="Filtrar por pagamento">
          {PAYMENT_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`${styles.statusTab} ${filters.status === filter.value ? styles.active : ''}`}
              aria-pressed={filters.status === filter.value}
              aria-label={filter.label}
              onClick={() => setFilters({ ...filters, status: filter.value, page: 1 })}
            >
              {filter.icon} {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.filterFields}>
          <div className={styles.searchField}>
            <input
              type="text"
              placeholder="🔍 Pesquisar por apelido do cliente..."
              value={filters.customer_nickname}
              onChange={(e) =>
                setFilters({ ...filters, customer_nickname: e.target.value, page: 1 })
              }
              className={styles.filterInput}
            />
            {filters.customer_nickname && (
              <button
                type="button"
                className={styles.clearSearchButton}
                aria-label="Limpar pesquisa de cliente"
                onClick={() => setFilters({ ...filters, customer_nickname: '', page: 1 })}
              >
                ×
              </button>
            )}
          </div>

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
            className={`${styles.filterInput} ${styles.dateFilter}`}
            aria-label="Data inicial"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
            className={`${styles.filterInput} ${styles.dateFilter}`}
            aria-label="Data final"
          />
        </div>
      </div>

      {error && <div className={styles.error}>Erro: {error}</div>}

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
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th className={styles.actionsHeader}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className={styles.orderRow}>
                        <td
                          className={`${styles.orderNumber} ${getOrderNumberClass(order.status)}`}
                        >
                          {order.order_number}
                        </td>
                        <td className={styles.orderDate}>{formatOrderDate(order.created_at)}</td>
                        <td className={styles.customerCell}>{order.customer_nickname}</td>
                        <td className={styles.value}>{formatCurrency(order.total_value)}</td>
                        <td className={styles.actions}>
                          {filters.status === 'PAID' && order.paid_at && (
                            <span className={styles.paidAt}>
                              <span className={styles.paidAtLabel}>PAGO EM</span>
                              {formatOrderDate(order.paid_at)}
                            </span>
                          )}
                          {filters.status === 'CANCELLED' && order.cancelled_at && (
                            <span className={styles.cancelledAt}>
                              <span className={styles.cancelledAtLabel}>CANCELADO EM</span>
                              {formatOrderDate(order.cancelled_at)}
                            </span>
                          )}
                          <button
                            type="button"
                            className={styles.actionButton}
                            onClick={() =>
                              window.open(
                                `/admin/orders/${order.id}/print`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                          >
                            📋 Detalhes
                          </button>
                          {order.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.payBtn}`}
                                disabled={isActionLoading}
                                onClick={() => openSecurityAction('pay', order)}
                              >
                                ✅ Marcar Pago
                              </button>
                              <button
                                type="button"
                                className={`${styles.actionButton} ${styles.cancelBtn}`}
                                disabled={isActionLoading}
                                onClick={() => openSecurityAction('cancel', order)}
                              >
                                🗑️ Cancelar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
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
        onClose={closeSecurityDialog}
        onConfirm={handleSecurityConfirm}
      />
    </div>
  );
}
