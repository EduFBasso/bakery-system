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

    expect(screen.getByText('Pedido')).toBeInTheDocument();
    expect(screen.getByText('Pedido nº 7')).toBeInTheDocument();
    expect(screen.getByText('Pão francês')).toBeInTheDocument();
    expect(screen.getByText('Nome de quem recebeu')).toBeInTheDocument();
    expect(screen.getByText('Assinatura do cliente')).toBeInTheDocument();
    expect(screen.queryByText('Forma de pagamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Status de pagamento')).not.toBeInTheDocument();
  });
});
