import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersList } from './index';
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
    mockedUseCustomerOrders.mockReturnValue({
      orders: [],
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
    });

    render(<OrdersList />);

    expect(screen.getByText('Pagamento: ✅ Pago')).toBeInTheDocument();
    expect(screen.getByText('Pagamento: ⏳ Pendente')).toBeInTheDocument();
    expect(screen.getByText('Pagamento: ✕ Não aplicável')).toBeInTheDocument();
  });

  it('ordena pedidos por data crescente no componente', () => {
    mockedUseCustomerOrders.mockReturnValue({
      orders: [
        makeOrder({ id: 2, order_date: '2026-07-12T12:00:00' }),
        makeOrder({ id: 1, order_date: '2026-07-10T12:00:00' }),
      ],
      loading: false,
      error: null,
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
    });

    render(<OrdersList />);

    expect(screen.getByText('Erro de rede')).toBeInTheDocument();
  });
});
