import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminOrdersPanel } from './AdminOrdersPanel';

const updateStatusMock = vi.fn();
const cancelOrderMock = vi.fn();

vi.mock('../hooks/useAdminOrders', () => ({
  useAdminOrders: vi.fn(),
}));

vi.mock('../hooks/useUpdateOrderStatus', () => ({
  useUpdateOrderStatus: vi.fn(),
}));

vi.mock('../hooks/useCancelOrder', () => ({
  useCancelOrder: vi.fn(),
}));

import { useAdminOrders } from '../hooks/useAdminOrders';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import { useCancelOrder } from '../hooks/useCancelOrder';

const mockedUseAdminOrders = vi.mocked(useAdminOrders);
const mockedUseUpdateOrderStatus = vi.mocked(useUpdateOrderStatus);
const mockedUseCancelOrder = vi.mocked(useCancelOrder);

const makeOrder = (overrides: Record<string, any> = {}) => ({
  id: 1,
  order_number: 'ORD-001',
  customer_id: 1,
  customer_nickname: 'Cliente A',
  status: 'PENDING',
  status_display: 'Pendente',
  order_date: '2026-07-15T10:00:00Z',
  delivery_date: '2026-07-16T10:00:00Z',
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

    mockedUseUpdateOrderStatus.mockReturnValue({
      updateStatus: updateStatusMock,
      loading: false,
      error: null,
    });

    mockedUseCancelOrder.mockReturnValue({
      cancelOrder: cancelOrderMock,
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

  it('nao exibe acoes de pagamento/cancelamento para pedido ja cancelado', async () => {
    mockedUseAdminOrders.mockReturnValue({
      orders: [makeOrder({ id: 2, order_number: 'ORD-002', status: 'CANCELLED' })],
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
    });

    const user = userEvent.setup();
    render(<AdminOrdersPanel />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));

    expect(screen.queryByRole('button', { name: '✅ Marcar como pago' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '✖ Cancelar Pedido' })).not.toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Ver' }));

    expect(screen.queryByRole('button', { name: '✖ Cancelar Pedido' })).not.toBeInTheDocument();
  });

  it('exige senha admin para confirmar cancelamento do pedido', async () => {
    cancelOrderMock.mockResolvedValue({ id: 1, status: 'CANCELLED' });

    const user = userEvent.setup();
    render(<AdminOrdersPanel />);

    await user.click(screen.getByRole('button', { name: 'Ver' }));
    await user.click(screen.getByRole('button', { name: '✖ Cancelar Pedido' }));

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
});
