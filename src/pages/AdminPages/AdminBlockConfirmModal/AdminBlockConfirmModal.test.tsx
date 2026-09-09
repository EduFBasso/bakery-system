import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminBlockConfirmModal from './AdminBlockConfirmModal';

const onClose = vi.fn();
const onCustomerUpdated = vi.fn();

const createJsonResponse = (payload: unknown, ok = true) =>
  ({
    ok,
    json: async () => payload,
    headers: { get: () => 'application/json' },
  }) as unknown as Response;

describe('AdminBlockConfirmModal security flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('bread_admin_token', 'token-admin');
  });

  const renderModal = (action: 'block' | 'unblock' = 'block') =>
    render(
      <AdminBlockConfirmModal
        isOpen
        customerId={12}
        customerNickname="Cliente Teste"
        action={action}
        onClose={onClose}
        onCustomerUpdated={onCustomerUpdated}
      />
    );

  it('mantem o erro quando a senha do dono esta incorreta', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ detail: 'Senha do administrador incorreta.' }, false)
    );

    const user = userEvent.setup();
    renderModal('unblock');
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-errada');
    await user.click(screen.getByRole('button', { name: 'Desbloquear Cliente' }));

    await waitFor(() => {
      expect(screen.getByText('Senha do administrador incorreta.')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(onCustomerUpdated).not.toHaveBeenCalled();
  });

  it('envia admin_password e atualiza a lista quando a senha esta correta', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(createJsonResponse({ status: 'BLOQUEADO' }));

    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
    await user.click(screen.getByRole('button', { name: 'Bloquear Cliente' }));

    await waitFor(() => {
      expect(onCustomerUpdated).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/bakery/customers/12/block/',
      expect.objectContaining({ method: 'POST' })
    );
    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit.body).toContain('"admin_password":"senha-correta"');
  });
});
