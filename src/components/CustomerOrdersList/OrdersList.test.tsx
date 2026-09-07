import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersList } from './CustomerOrdersList';
import { useCustomerOrders, type Order } from '../../hooks/useCustomerOrders';
import { useCancelOrder } from '../../hooks/useCancelOrder';

vi.mock('../../hooks/useCustomerOrders', () => ({
  useCustomerOrders: vi.fn(),
}));

vi.mock('../../hooks/useCancelOrder', () => ({
  useCancelOrder: vi.fn(),
}));

const mockedUseCustomerOrders = vi.mocked(useCustomerOrders);
const mockedUseCancelOrder = vi.mocked(useCancelOrder);
const refetchMock = vi.fn();
const cancelCustomerOrderMock = vi.fn();

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  order_number: 'ORD-001',
  customer_id: 1,
  status: 'PENDING',
  order_date: '2026-07-10T12:00:00',
  paid_at: null,
  updated_at: '2026-07-10T12:00:00',
  total_value: '100.00',
  delivery_date: null,
  notes: null,
  items: [
    {
      id: 1,
      product_id: 1,
      product_name: 'Pao para Hamburguer',
      quantity: 3,
      unit_price: '5.00',
      subtotal: '15.00',
    },
  ],
  ...overrides,
});

describe('OrdersList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCustomerOrders.mockReturnValue({
      orders: [],
      loading: false,
      error: null,
      refetch: refetchMock,
    });
    mockedUseCancelOrder.mockReturnValue({
      cancelOrder: vi.fn(),
      cancelCustomerOrder: cancelCustomerOrderMock,
      loading: false,
      error: null,
    });
  });

  it('mostra estado vazio quando nao ha pedidos', () => {
    render(<OrdersList />);

    expect(screen.getByText('Nenhum pedido realizado ainda')).toBeInTheDocument();
  });

  it('mostra labels de pagamento por status corretamente', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 1, status: 'CONFIRMED' }),
        makeOrder({ id: 2, status: 'PENDING', order_date: '2026-07-11T12:00:00' }),
        makeOrder({ id: 3, status: 'CANCELLED', order_date: '2026-07-12T12:00:00' }),
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<OrdersList />);

    expect(screen.getByText('✅ Pago')).toBeInTheDocument();
    expect(screen.getByText('⏳ Pendente')).toBeInTheDocument();
    expect(screen.getByText('✕ Cancelado')).toBeInTheDocument();
  });

  it('ordena pedidos por data crescente no componente', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 2, order_date: '2026-07-12T12:00:00' }),
        makeOrder({ id: 1, order_date: '2026-07-10T12:00:00' }),
      ],
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<OrdersList />);

    const titleNodes = screen.getAllByText(/Pedido .* as .*/i);
    expect(titleNodes).toHaveLength(2);

    const firstTitle = titleNodes[0].textContent || '';
    const secondTitle = titleNodes[1].textContent || '';

    expect(firstTitle).toContain('10/07/2026');
    expect(secondTitle).toContain('12/07/2026');
  });

  it('mostra erro quando o hook retorna falha', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [],
      loading: false,
      error: 'Erro de rede',
      refetch: vi.fn(),
    });

    render(<OrdersList />);

    expect(screen.getByText('Erro de rede')).toBeInTheDocument();
  });

  it('cancela somente pedido pendente com motivo e atualiza os dados', async () => {
    cancelCustomerOrderMock.mockResolvedValue({
      id: 1,
      order_number: 'ORD-001',
      status: 'CANCELLED',
      cancelled_at: '2026-07-10T13:00:00',
      cancellation_reason: 'Pedido duplicado',
    });
    mockedUseCustomerOrders.mockReturnValue({
      orders: [makeOrder()],
      loading: false,
      error: null,
      refetch: refetchMock,
    });
    const eventSpy = vi.spyOn(window, 'dispatchEvent');
    render(<OrdersList />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Motivo do cancelamento' }),
      'Pedido duplicado'
    );
    await userEvent.type(screen.getByLabelText('Sua senha'), 'senha-cliente');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(cancelCustomerOrderMock).toHaveBeenCalledWith(1, 'Pedido duplicado', 'senha-cliente');
    await waitFor(() => expect(refetchMock).toHaveBeenCalled());
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bakery:customer-data-changed' })
    );
  });

  it('bloqueia cancelamento sem motivo e informa o cliente', async () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [makeOrder()],
      loading: false,
      error: null,
      refetch: refetchMock,
    });

    render(<OrdersList />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar pedido' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o motivo para cancelar o pedido.');
    expect(cancelCustomerOrderMock).not.toHaveBeenCalled();
  });
});
