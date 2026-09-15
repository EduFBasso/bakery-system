import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import type { AdminOrder } from '../../hooks/useAdminOrders';
import styles from './AdminOrdersPanel.module.css';

const updateStatusMock = vi.fn();
const cancelOrderMock = vi.fn();

vi.mock('../../hooks/useAdminOrders', () => ({
  useAdminOrders: vi.fn(),
}));

vi.mock('../../hooks/useUpdateOrderStatus', () => ({
  useUpdateOrderStatus: vi.fn(),
}));

vi.mock('../../hooks/useCancelOrder', () => ({
  useCancelOrder: vi.fn(),
}));

import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useUpdateOrderStatus } from '../../hooks/useUpdateOrderStatus';
import { useCancelOrder } from '../../hooks/useCancelOrder';

const mockedUseAdminOrders = vi.mocked(useAdminOrders);
const mockedUseUpdateOrderStatus = vi.mocked(useUpdateOrderStatus);
const mockedUseCancelOrder = vi.mocked(useCancelOrder);

const makeOrder = (overrides: Partial<AdminOrder> = {}): AdminOrder => ({
  id: 1,
  order_number: 'ORD-001',
  customer_id: 1,
  customer_nickname: 'Cliente A',
  status: 'PENDING',
  status_display: 'Pendente',
  created_at: '2026-07-15T10:00:00Z',
  delivery_date: '2026-07-16T10:00:00Z',
  shipping_street: 'Rua Teste',
  shipping_number: '10',
  shipping_neighborhood: 'Centro',
  shipping_city: 'Limeira',
  shipping_state: 'SP',
  total_value: '75.00',
  payment_method: 'CREDIT',
  paid_at: null,
  cancelled_at: null,
  cancellation_reason: null,
  items: [{ product_name: 'Mouse Fit', quantity: 5, subtotal: '75.00' }],
  ...overrides,
});

describe('AdminOrdersPanel security and cancelled behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'open').mockImplementation(() => null);

    mockedUseUpdateOrderStatus.mockReturnValue({
      updateStatus: updateStatusMock,
      loading: false,
      error: null,
    });

    mockedUseCancelOrder.mockReturnValue({
      cancelOrder: cancelOrderMock,
      cancelCustomerOrder: vi.fn(),
      loading: false,
      error: null,
    });

    mockedUseAdminOrders.mockReturnValue({
      orders: [makeOrder()],
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
    });
  });

  it('colore o numero do pedido conforme o status de pagamento', () => {
    mockedUseAdminOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 1, order_number: 'ORD-PAID', status: 'CONFIRMED' }),
        makeOrder({ id: 2, order_number: 'ORD-PENDING', status: 'PENDING' }),
        makeOrder({ id: 3, order_number: 'ORD-CANCELLED', status: 'CANCELLED' }),
      ],
      loading: false,
      error: null,
      pagination: { count: 3, next: null, previous: null },
    });

    render(<AdminOrdersPanel />);

    expect(screen.getByText('ORD-PAID')).toHaveClass(styles.orderNumberPaid);
    expect(screen.getByText('ORD-PENDING')).toHaveClass(styles.orderNumberPending);
    expect(screen.getByText('ORD-CANCELLED')).toHaveClass(styles.orderNumberCancelled);
  });

  it('abre com pendentes e permite limpar o apelido preenchido', async () => {
    render(<AdminOrdersPanel initialCustomerNickname="Alfredo" />);

    expect(mockedUseAdminOrders).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING',
        customer_nickname: 'Alfredo',
      })
    );
    expect(screen.getByDisplayValue('Alfredo')).toBeInTheDocument();
    const clearButton = screen.getByRole('button', { name: 'Limpar pesquisa de cliente' });
    expect(clearButton).toBeInTheDocument();

    await userEvent.click(clearButton);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('nao exibe acoes de pagamento/cancelamento para pedido ja cancelado', async () => {
    mockedUseAdminOrders.mockReturnValue({
      orders: [makeOrder({ id: 2, order_number: 'ORD-002', status: 'CANCELLED' })],
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
    });

    const user = userEvent.setup();
    render(<AdminOrdersPanel />);

    await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));

    expect(screen.queryByRole('button', { name: '✅ Marcar como pago' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '✖ Cancelar Pedido' })).not.toBeInTheDocument();
  });

  it('usa filtros de pagamento em linha e remove endereco e data da tabela', async () => {
    render(<AdminOrdersPanel />);

    expect(screen.getByRole('group', { name: 'Filtrar por pagamento' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pagamentos Pendentes' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Pagamentos Confirmados' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelados' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Endereço' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Data' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '15/07/2026' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Pagamento' })).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
  });

  it('mantem bloqueio de acoes para pedido cancelado em viewport mobile', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    window.dispatchEvent(new Event('resize'));

    mockedUseAdminOrders.mockReturnValue({
      orders: [makeOrder({ id: 3, order_number: 'ORD-003', status: 'CANCELLED' })],
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
    });

    const user = userEvent.setup();
    render(<AdminOrdersPanel />);

    await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));

    expect(screen.queryByRole('button', { name: '✖ Cancelar Pedido' })).not.toBeInTheDocument();
  });

  it.each(['CONFIRMED', 'DELIVERED'])(
    'nao exibe cancelamento para pedido com status %s',
    async (status) => {
      mockedUseAdminOrders.mockReturnValue({
        orders: [
          makeOrder({
            id: 4,
            order_number: `ORD-${status}`,
            status,
            paid_at: '2026-09-12T12:00:00Z',
          }),
        ],
        loading: false,
        error: null,
        pagination: { count: 1, next: null, previous: null },
      });

      const user = userEvent.setup();
      render(<AdminOrdersPanel />);

      await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));

      expect(screen.queryByRole('button', { name: '✖ Cancelar Pedido' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '✅ Marcar como pago' })).not.toBeInTheDocument();
    }
  );

  it('exige senha admin para confirmar cancelamento do pedido', async () => {
    cancelOrderMock.mockResolvedValue({ id: 1, status: 'CANCELLED' });

    const user = userEvent.setup();
    render(<AdminOrdersPanel />);

    await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));
    await user.click(screen.getByRole('button', { name: '🗑️ Cancelar' }));

    const confirmButton = screen.getByRole('button', { name: 'Confirmar Cancelamento' });
    expect(confirmButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'SenhaAdmin!123');
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(cancelOrderMock).toHaveBeenCalledWith(
      1,
      'Cancelado pelo administrador',
      'CREDIT',
      'SenhaAdmin!123'
    );
  });

  it('informa sucesso ao pai ao marcar pedido como pago', async () => {
    updateStatusMock.mockResolvedValue({ id: 1, status: 'CONFIRMED' });
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(<AdminOrdersPanel onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));
    await user.click(screen.getByRole('button', { name: '✅ Marcar Pago' }));
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'SenhaAdmin!123');
    await user.click(screen.getByRole('button', { name: 'Confirmar Pagamento' }));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledWith('✅ Pedido ORD-001 marcado como pago.');
    });
  });

  it('informa sucesso ao pai ao cancelar pedido', async () => {
    cancelOrderMock.mockResolvedValue({ id: 1, status: 'CANCELLED' });
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(<AdminOrdersPanel onRefresh={onRefresh} />);

    await user.click(screen.getByRole('button', { name: '📋 Detalhes' }));
    await user.click(screen.getByRole('button', { name: '🗑️ Cancelar' }));
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'SenhaAdmin!123');
    await user.click(screen.getByRole('button', { name: 'Confirmar Cancelamento' }));

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledWith('✅ Pedido ORD-001 cancelado com sucesso.');
    });
  });
});
