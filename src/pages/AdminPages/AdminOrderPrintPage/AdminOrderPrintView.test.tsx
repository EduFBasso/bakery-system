import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminOrderPrintView } from './AdminOrderPrintView';
import styles from './AdminOrderPrintView.module.css';

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
  paid_at: null,
  notes: 'Entregar na portaria.\nNão substituir o produto.',
  payment_method: 'CREDIT',
  status: 'PENDING',
  order_items: [
    {
      id: 1,
      product_name: 'Pão francês',
      product_description: 'Embalagem com 6 unidades',
      quantity: 10,
      unit_price: '2.50',
      subtotal: '25.00',
    },
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

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pedido nº 7 - Criado em: 13/09/2026'
    );
    expect(screen.getByText('Pão francês')).toBeInTheDocument();
    expect(screen.getByText('"Item 1" - Embalagem com 6 unidades')).toBeInTheDocument();
    expect(screen.queryByText('Observações')).not.toBeInTheDocument();
    expect(screen.getByText('Pendente')).toHaveClass(styles.pendingStatus);
    expect(screen.getAllByText('Telefone:')).toHaveLength(1);
    expect(
      screen.getByText(/Entregar na portaria\.\s*Não substituir o produto\./)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/"Notas" - Entregar na portaria\.\s*Não substituir o produto\./)
    ).toBeInTheDocument();
    expect(screen.queryByText('Pedido')).not.toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(1);
    expect(screen.getByText('Cliente:')).toBeInTheDocument();
    expect(screen.getAllByText(/Endereço:/)).toHaveLength(1);
    const deliveryAddress = screen.getByText(
      /Endereço: Rua Beijamin Mesquita, 55 Jardim Boa Esperança - Limeira - SP CEP 13486-465/
    );
    expect(deliveryAddress.tagName).toBe('P');
    expect(screen.getByText('Recebido por')).toBeInTheDocument();
    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Assinatura')).toBeInTheDocument();
    expect(screen.getByText('(19) 98515-2541')).toBeInTheDocument();
    expect(screen.getByText('(19) 98515-2541').closest('p')).toHaveClass(styles.customerPhone);
    expect(screen.queryByText('Cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Recebimento')).not.toBeInTheDocument();
    expect(screen.queryByText('Assinatura do cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Data prevista')).not.toBeInTheDocument();
    expect(screen.queryByText('Forma de pagamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Status de pagamento')).not.toBeInTheDocument();
    expect(screen.getByText('Produto')).toHaveClass(styles.productHeader);
    expect(screen.queryByText(/Endereço de entrega:/)).not.toBeInTheDocument();
  });

  it('cria uma segunda página quando os produtos ultrapassam a capacidade da primeira', () => {
    const manyItems = Array.from({ length: 4 }, (_, index) => ({
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
    expect(screen.getByText('Total de pedidos')).toBeInTheDocument();
    expect(screen.getAllByText('Página 2 de 2')).toHaveLength(1);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('exibe a data de cancelamento e o status', () => {
    render(
      <AdminOrderPrintView
        order={{ ...order, status: 'CANCELLED', cancelled_at: '2026-09-14T10:00:00Z' }}
        customer={{ nickname: 'Carlos' }}
        companyName="Panificadora Boa Esperança"
        companyAddress="Rua Armando Martins, 123"
        screenPreview
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pedido nº 7 - Criado em: 13/09/2026 - Cancelado em: 14/09/2026'
    );
    expect(screen.getByText('Cancelado')).toHaveClass(styles.cancelledStatus);
  });

  it('exibe endereco de entrega sublinhado quando diverge do original', () => {
    render(
      <AdminOrderPrintView
        order={{
          ...order,
          original_address_text: 'Rua A, 10 Centro - Limeira - SP CEP 13480-000',
          delivery_address_text: 'Entregar na Rua B, fundos da loja',
        }}
        customer={{ nickname: 'Carlos' }}
        companyName="Panificadora Boa Esperança"
        companyAddress="Rua Armando Martins, 123"
        screenPreview
      />
    );

    expect(screen.getByText(/Endereço de entrega: Entregar na Rua B, fundos da loja/)).toHaveClass(
      styles.deliveryAddressChanged
    );
  });

  it('exibe a data de pagamento e o status', () => {
    render(
      <AdminOrderPrintView
        order={{ ...order, paid_at: '2026-09-14T10:00:00Z' }}
        customer={{ nickname: 'Carlos' }}
        companyName="Panificadora Boa Esperança"
        companyAddress="Rua Armando Martins, 123"
        screenPreview
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pedido nº 7 - Criado em: 13/09/2026 - Pago em: 14/09/2026'
    );
    expect(screen.getByText('Pago')).toHaveClass(styles.paidStatus);
  });
});
