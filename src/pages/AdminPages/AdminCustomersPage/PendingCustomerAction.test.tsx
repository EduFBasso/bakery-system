import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PendingCustomerAction } from './PendingCustomerAction';

const onClose = vi.fn();
const onCustomerUpdated = vi.fn();
const { buildAccessWhatsAppMessage, openWhatsAppMessage } = vi.hoisted(() => ({
  buildAccessWhatsAppMessage: vi.fn(() => 'mensagem de acesso'),
  openWhatsAppMessage: vi.fn(),
}));

vi.mock('../../../utils/whatsapp', () => ({
  buildAccessWhatsAppMessage,
  openWhatsAppMessage,
}));

const customer = { id: 12, nickname: 'Cliente Pendente', phone: '19999999999' };

const createJsonResponse = (payload: unknown, ok = true) =>
  ({
    ok,
    json: async () => payload,
  }) as unknown as Response;

describe('PendingCustomerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('bread_admin_token', 'token-admin');
  });

  it('aprova o cliente com limite e compartilha a senha no WhatsApp', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(createJsonResponse({ password_plain_text: 'Senha@123' }));
    const user = userEvent.setup();

    render(
      <PendingCustomerAction
        customer={customer}
        action="approve"
        onClose={onClose}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

    await user.type(screen.getByPlaceholderText('Ex: 5000.00'), '1500');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Confirmar Aprovação' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/bakery/customers/12/approve/',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect((fetchSpy.mock.calls[0][1] as RequestInit).body).toContain('"credit_limit":"1500"');
    expect(openWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect(onCustomerUpdated).toHaveBeenCalledWith(
      '✅ Aprovação de Cliente Pendente efetivada com sucesso.'
    );
  });

  it('descarta o cadastro pendente com a senha do dono', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(createJsonResponse({}));
    const user = userEvent.setup();

    render(
      <PendingCustomerAction
        customer={customer}
        action="discard"
        onClose={onClose}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Descartar cadastro' }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/bakery/customers/12/reject/',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(openWhatsAppMessage).not.toHaveBeenCalled();
    expect(onCustomerUpdated).toHaveBeenCalledWith(
      '✅ Cadastro de Cliente Pendente descartado com sucesso.'
    );
  });
});
