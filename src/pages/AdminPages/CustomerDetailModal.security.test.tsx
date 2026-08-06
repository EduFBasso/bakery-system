import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerDetailModal } from './CustomerDetailModal';

const fetchCustomerDetailMock = vi.fn();
const onCustomerUpdatedMock = vi.fn();
const onCloseMock = vi.fn();

vi.mock('../../hooks/useAdminCustomers', () => ({
  useAdminCustomers: vi.fn(),
}));

vi.mock('../../utils/whatsapp', () => ({
  buildAccessWhatsAppMessage: vi.fn(() => 'mensagem-whatsapp'),
  openWhatsAppMessage: vi.fn(),
}));

import { useAdminCustomers } from '../../hooks/useAdminCustomers';

const mockedUseAdminCustomers = vi.mocked(useAdminCustomers);

const approvedCustomer = {
  id: 12,
  nickname: 'Cliente Aprovado',
  customer_type: 'PF',
  phone: '19999999999',
  status: 'APROVADO',
  cpf: '12345678901',
  created_at: '2026-07-10T10:00:00Z',
  credit_limit: '1000.00',
  financial_limit: '1000.00',
  financial_used: '100.00',
  financial_available: '900.00',
  street: 'Rua A',
  number: '10',
  neighborhood: 'Centro',
  city: 'Limeira',
  state: 'SP',
  zip_code: '13486465',
};

describe('CustomerDetailModal security flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('bread_admin_token', 'token-admin');

    mockedUseAdminCustomers.mockReturnValue({
      customerDetail: approvedCustomer,
      fetchCustomerDetail: fetchCustomerDetailMock,
      loading: false,
      error: null,
      pendingCustomers: [],
      allCustomers: [],
      stats: null,
      fetchAdminStats: vi.fn(),
      fetchPendingCustomers: vi.fn(),
      fetchAllCustomers: vi.fn(),
      approveCustomer: vi.fn(),
      blockCustomer: vi.fn(),
      clearError: vi.fn(),
    });
  });

  const renderModal = () =>
    render(
      <CustomerDetailModal
        customerId={12}
        isOpen
        onClose={onCloseMock}
        onCustomerUpdated={onCustomerUpdatedMock}
      />
    );

  it('mostra erro e nao revela senha quando admin_password e invalido', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Senha do dono inválida' }),
    } as Response);

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Visualizar senha' }));
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Visualizar Senha' }));

    await waitFor(() => {
      expect(screen.getAllByText('Senha do dono inválida').length).toBeGreaterThan(0);
    });

    expect(screen.getByDisplayValue('********')).toBeInTheDocument();
  });

  it('revela senha quando admin_password e valido', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ password_plain_text: 'NovaSenha@123' }),
    } as Response);

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Visualizar senha' }));
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Visualizar Senha' }));

    await waitFor(() => {
      expect(screen.getByDisplayValue('NovaSenha@123')).toBeInTheDocument();
    });

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/bakery/customers/12/reveal-password',
      expect.any(Object)
    );
    expect(requestInit.body).toContain('"admin_password":"senha-correta"');
  });

  it('bloqueia alteracao de limite quando valor informado e invalido', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Editar limite de crédito' }));

    const numberInput = screen.getByPlaceholderText('Ex: 5000.00');
    fireEvent.change(numberInput, { target: { value: '0' } });

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Salvar Limite' }));

    expect(screen.getAllByText('Limite de crédito deve ser maior que 0').length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('atualiza limite quando admin_password e valor sao validos', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ detail: 'ok' }),
    } as Response);

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Editar limite de crédito' }));

    const numberInput = screen.getByPlaceholderText('Ex: 5000.00');
    fireEvent.change(numberInput, { target: { value: '1500' } });

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Salvar Limite' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/bakery/customers/12/update-credit-limit',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit.body).toContain('"admin_password":"senha-correta"');
    expect(requestInit.body).toContain('"credit_limit":"1500"');
    expect(onCustomerUpdatedMock).toHaveBeenCalledTimes(1);
  });
});
