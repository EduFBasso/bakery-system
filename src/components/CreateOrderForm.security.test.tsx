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

vi.mock('../hooks/useProducts', () => ({
  useProducts: vi.fn(),
}));

vi.mock('../hooks/useCreateOrder', () => ({
  useCreateOrder: vi.fn(),
}));

vi.mock('../hooks/useCustomerAuth', () => ({
  useCustomerAuth: vi.fn(),
}));

import { useProducts } from '../hooks/useProducts';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useCustomerAuth } from '../hooks/useCustomerAuth';

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

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateOrderForm />);

    await addItemToCart('3');

    expect(screen.getByText(/Limite insuficiente para este pedido/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar Pedido' })).toBeDisabled();

    submitForm();

    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Pedido excede o limite disponível')
    );
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('rejeita endereco em formato invalido antes de criar pedido', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateOrderForm />);

    await addItemToCart('2');

    fireEvent.change(screen.getByPlaceholderText(/Rua, Número, Complemento opcional/i), {
      target: { value: 'Rua Curta, 10' },
    });

    submitForm();

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Revise o endereço de entrega'));
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('rejeita CEP com quantidade de digitos diferente de 8', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<CreateOrderForm />);

    await addItemToCart('1');

    fireEvent.change(screen.getByPlaceholderText(/Rua, Número, Complemento opcional/i), {
      target: { value: 'Rua A, 10, Centro, Limeira, SP, 12345' },
    });

    submitForm();

    expect(alertSpy).toHaveBeenCalledWith('O CEP do endereço de entrega deve conter 8 dígitos.');
    expect(createOrderMock).not.toHaveBeenCalled();
  });

  it('envia payload seguro no formato esperado e navega apos sucesso', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
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
      payment_method: 'CREDIT',
      shipping_street: 'Rua A',
      shipping_number: '10',
      shipping_neighborhood: 'Centro',
      shipping_city: 'Limeira',
      shipping_state: 'SP',
      shipping_zip_code: '13486465',
      items: [{ product_id: 1, quantity: 2 }],
    });

    expect(alertSpy).toHaveBeenCalledWith('Pedido criado com sucesso! ID: ORD-999');
    expect(navigateMock).toHaveBeenCalledWith('/customer/dashboard');
  });
});
