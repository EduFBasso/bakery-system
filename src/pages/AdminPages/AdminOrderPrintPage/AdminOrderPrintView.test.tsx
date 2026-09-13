import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminOrderPrintView } from './AdminOrderPrintView';

const order = {
  order_number: '7',
  created_at: '2026-09-13T13:21:00Z',
  delivery_date: '2026-09-14T10:00:00Z',
  shipping_zip_code: '13486465',
  shipping_street: 'Rua Beijamin Mesquita',
  shipping_number: '55',
  shipping_complement: '',
  shipping_neighborhood: 'Jardim Boa Esperança',
  shipping_city: 'Limeira',
  shipping_state: 'SP',
  total_value: '375.00',
  payment_method: 'CREDIT',
  status: 'PENDING',
  order_items: [
    { id: 1, product_name: 'Pão francês', quantity: 10, unit_price: '2.50', subtotal: '25.00' },
  ],
};

describe('AdminOrderPrintView', () => {
  it('imprime um pedido com entrega, itens e assinatura sem dados de pagamento', () => {
    render(
      <AdminOrderPrintView
        order={order}
        customer={{
          nickname: 'Silvio',
          company_name: 'Silvio Fernandes Carvalho',
          phone: '(19) 98515-2541',
        }}
        companyName="Panificadora Boa Esperança"
        companyAddress="Rua Armando Martins, 123 - Vila Monumento - São Paulo - SP"
        screenPreview
      />
    );

    expect(screen.getByText('Pedido nº 7 - 13/09/2026')).toBeInTheDocument();
    expect(screen.getByText('Pão francês')).toBeInTheDocument();
    expect(screen.getByText('Cliente:')).toBeInTheDocument();
    expect(screen.getByText(/Endereço:/)).toBeInTheDocument();
    expect(screen.getByText('Recebido por')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Assinatura')).toBeInTheDocument();
    expect(screen.getByText('(19) 98515-2541')).toBeInTheDocument();
    expect(screen.queryByText('Cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Recebimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Assinatura do cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Data prevista')).not.toBeInTheDocument();
    expect(screen.queryByText('Forma de pagamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Status de pagamento')).not.toBeInTheDocument();
  });

  it('cria uma segunda página quando os produtos ultrapassam a capacidade da primeira', () => {
    const manyItems = Array.from({ length: 9 }, (_, index) => ({
      id: index + 1,
      product_name: `Produto ${index + 1}`,
      quantity: 1,
      unit_price: '10.00',
      subtotal: '10.00',
    }));

    const { container } = render(
      <AdminOrderPrintView
        order={{ ...order, order_items: manyItems }}
        customer={{ nickname: 'Carlos', company_name: 'Cliente', phone: '19998587457' }}
        companyName="Panificadora Boa Esperança"
        companyAddress="Rua Armando Martins, 123"
        screenPreview
      />
    );

    expect(container.querySelectorAll('[data-page-number]')).toHaveLength(2);
    expect(screen.getByText('Produtos Solicitados (continuação)')).toBeInTheDocument();
    expect(screen.getByText('Total do pedido')).toBeInTheDocument();
    expect(screen.getAllByText('Página 2 de 2')).toHaveLength(1);
  });
});
