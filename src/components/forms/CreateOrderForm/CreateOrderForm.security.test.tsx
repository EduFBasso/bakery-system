import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateOrderForm } from './CreateOrderForm';

const navigateMock = vi.fn();
const createOrderMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../../../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('../../../hooks/useCreateOrder', () => ({
  useCreateOrder: vi.fn(),
}));

vi.mock('../../../hooks/useCustomerAuth', () => ({
  useCustomerAuth: vi.fn(),
}));

import { useProducts } from '../../../hooks/useProducts';
import { useCreateOrder } from '../../../hooks/useCreateOrder';
import { useCustomerAuth } from '../../../hooks/useCustomerAuth';

const mockedUseProducts = vi.mocked(useProducts);
const mockedUseCreateOrder = vi.mocked(useCreateOrder);
const mockedUseCustomerAuth = vi.mocked(useCustomerAuth);

const defaultCustomer = {
  id: 1,
  nickname: 'Cliente Teste',
  customer_type: 'PF',
  status: 'APPROVED',
  street: 'Rua A',
  number: '10',
  neighborhood: 'Centro',
  city: 'Limeira',
  state: 'SP',
  zip_code: '13486465',
  financial_limit: '1000.00',
  financial_used: '100.00',
  financial_available: '900.00',
  credit_limit: '1000.00',
};

describe('CreateOrderForm security rules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createOrderMock.mockResolvedValue(null);

    mockedUseProducts.mockReturnValue({
      products: [
        {
          id: 1,
          name: 'Pao para Hamburguer',
          description: 'Produto teste',
          price: '5.00',
          is_active: true,
          created_at: '2026-07-15T00:00:00',
        },
      ],
      loading: false,
      refreshing: false,
      error: null,
      refetch: vi.fn(),
    });

    mockedUseCreateOrder.mockReturnValue({
      createOrder: createOrderMock,
      loading: false,
      error: null,
    });

    mockedUseCustomerAuth.mockReturnValue({
      customer: defaultCustomer,
      token: null,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });
  });

  const addItemToCart = async (qty: string) => {
    const user = userEvent.setup();
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.type(screen.getByLabelText('Quantidade'), qty);
    await user.click(screen.getByRole('button', { name: 'Adicionar ao Carrinho' }));
  };

  const submitForm = () => {
    const submitButton = screen.getByRole('button', { name: 'Criar Pedido' });
    const form = submitButton.closest('form');
    if (!form) {
      throw new Error('Formulario nao encontrado');
    }
    fireEvent.submit(form);
  };

  it('bloqueia pedido quando ultrapassa limite de credito', async () => {
    mockedUseCustomerAuth.mockReturnValue({
      customer: { ...defaultCustomer, financial_available: '10.00' },
      token: null,
      isAuthenticated: true,
      isLoading: false,
      logout: vi.fn(),
    });

    render(<CreateOrderForm />);

    await addItemToCart('3');

    expect(screen.getByText('Limite de crédito:')).toHaveTextContent('Limite excedido');
    expect(screen.getByRole('button', { name: 'Adicionar ao Carrinho' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Carrinho (0 itens)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar Pedido' })).toBeDisabled();

    submitForm();

    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('abre o carrinho e confirma ao adicionar um produto', async () => {
    render(<CreateOrderForm />);

    await addItemToCart('2');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Pao para Hamburguer adicionado ao carrinho.'
    );
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Carrinho (1 itens)' })).toBeInTheDocument();
    expect(screen.getByText('Produto teste')).toBeInTheDocument();
    expect(screen.getByText('Quantidade')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '-' })).not.toBeInTheDocument();
  });

  it('remove item do rascunho somente após confirmação', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<CreateOrderForm />);

    await addItemToCart('2');
    await userEvent.click(
      screen.getByRole('button', { name: 'Remover Pao para Hamburguer do carrinho' })
    );

    expect(confirmSpy).toHaveBeenCalledWith('Remover Pao para Hamburguer deste pedido?');
    expect(screen.getByText('Carrinho vazio. Adicione produtos acima.')).toBeInTheDocument();
  });

  it('aceita endereco livre antes de criar pedido', async () => {
    render(<CreateOrderForm />);

    await addItemToCart('2');

    fireEvent.change(screen.getByPlaceholderText(/Rua, Número, Complemento opcional/i), {
      target: { value: 'Entregar na loja ao lado do mercado, fundos' },
    });

    submitForm();

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    expect(createOrderMock.mock.calls[0][0]).toMatchObject({
      delivery_address_text: 'Entregar na loja ao lado do mercado, fundos',
    });
  });

  it('aceita endereco sem CEP estruturado', async () => {
    render(<CreateOrderForm />);

    await addItemToCart('1');

    fireEvent.change(screen.getByPlaceholderText(/Rua, Número, Complemento opcional/i), {
      target: { value: 'Rua A, 10, Centro, Limeira' },
    });

    submitForm();

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1));
    expect(createOrderMock.mock.calls[0][0]).toMatchObject({
      delivery_address_text: 'Rua A, 10, Centro, Limeira',
    });
  });

  it('envia payload seguro e prepara a tela para outro pedido após sucesso', async () => {
    createOrderMock.mockResolvedValue({ order_number: 'ORD-999' });

    render(<CreateOrderForm />);

    await addItemToCart('2');

    fireEvent.change(screen.getByPlaceholderText(/Rua, Número, Complemento opcional/i), {
      target: { value: 'Rua A, 10, Centro, Limeira, SP, 13486465' },
    });

    submitForm();

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledTimes(1);
    });

    const payload = createOrderMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      customer_id: 1,
      payment_method: 'CREDIT',
      shipping_street: 'Rua A',
      shipping_number: '10',
      shipping_neighborhood: 'Centro',
      shipping_city: 'Limeira',
      shipping_state: 'SP',
      shipping_zip_code: '13486465',
      items: [{ product_id: 1, quantity: 2 }],
    });

    expect(screen.getByRole('status')).toHaveTextContent('Pedido #ORD-999 criado com sucesso.');
    expect(screen.getByRole('status')).toHaveTextContent('Pedido confirmado.');
    expect(screen.getByRole('status')).not.toHaveTextContent('Entrega');
    expect(screen.getByRole('status')).not.toHaveTextContent('Total');
    expect(screen.getByRole('heading', { name: 'Carrinho (0 itens)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar Pedido' })).toBeDisabled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
