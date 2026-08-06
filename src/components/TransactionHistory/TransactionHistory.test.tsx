import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionHistory } from './index';
import { useCustomerOrders, type Order } from '../../hooks/useCustomerOrders';

vi.mock('../../hooks/useCustomerOrders', () => ({
  useCustomerOrders: vi.fn(),
}));

const mockedUseCustomerOrders = vi.mocked(useCustomerOrders);

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
      product_name: 'Pao Frances',
      quantity: 2,
      unit_price: '5.00',
      subtotal: '10.00',
    },
  ],
  ...overrides,
});

describe('TransactionHistory', () => {
  beforeEach(() => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [],
      loading: false,
      error: null,
    });
  });

  it('mostra estado vazio quando nao ha pagamentos confirmados', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [makeOrder({ status: 'PENDING' }), makeOrder({ status: 'CANCELLED', id: 2 })],
      loading: false,
      error: null,
    });

    render(<TransactionHistory />);

    expect(screen.getByText('Nenhum pagamento confirmado ainda')).toBeInTheDocument();
    expect(screen.queryByText('Ultimo pagamento')).not.toBeInTheDocument();
  });

  it('filtra apenas pedidos pagos e ordena por data de pagamento mais recente', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 10, order_number: 'ORD-010', status: 'PENDING', total_value: '999.99' }),
        makeOrder({
          id: 1,
          order_number: 'ORD-001',
          status: 'CONFIRMED',
          paid_at: '2026-07-10T08:00:00',
          total_value: '75.00',
        }),
        makeOrder({
          id: 2,
          order_number: 'ORD-002',
          status: 'DELIVERED',
          paid_at: '2026-07-11T08:00:00',
          total_value: '150.00',
        }),
      ],
      loading: false,
      error: null,
    });

    render(<TransactionHistory />);

    expect(screen.queryByText('ORD-010')).not.toBeInTheDocument();
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();

    const orderLabels = screen.getAllByText(/^ORD-/).map((node) => node.textContent);
    expect(orderLabels).toEqual(['ORD-002', 'ORD-001']);

    expect(screen.getAllByText(/150,00/).length).toBeGreaterThan(0);
  });

  it('exibe aviso de data aproximada quando paid_at nao existe', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [
        makeOrder({
          id: 3,
          order_number: 'ORD-003',
          status: 'CONFIRMED',
          paid_at: null,
          updated_at: '2026-07-13T09:15:00',
        }),
      ],
      loading: false,
      error: null,
    });

    render(<TransactionHistory />);

    expect(screen.getAllByText(/data aproximada/i).length).toBeGreaterThan(0);
  });

  it('mostra erro do hook quando falha ao carregar', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [],
      loading: false,
      error: 'Falha ao carregar',
    });

    render(<TransactionHistory />);

    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
  });
});
