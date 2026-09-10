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

  it.each(['block', 'unblock'] as const)(
    'mostra erro em toast quando a senha esta incorreta ao %s',
    async (action) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        createJsonResponse({ detail: 'Senha do administrador incorreta.' }, false)
      );

      const user = userEvent.setup();
      renderModal(action);
      await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-errada');
      await user.click(
        screen.getByRole('button', {
          name: action === 'block' ? 'Bloquear Cliente' : 'Desbloquear Cliente',
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Senha do administrador incorreta.')).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(onCustomerUpdated).not.toHaveBeenCalled();
    }
  );

  it.each(['block', 'unblock'] as const)(
    'envia admin_password e mostra sucesso ao %s',
    async (action) => {
      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(createJsonResponse({ status: 'BLOQUEADO' }));

      const user = userEvent.setup();
      renderModal(action);
      await user.type(screen.getByPlaceholderText('Digite sua senha'), 'senha-correta');
      await user.click(
        screen.getByRole('button', {
          name: action === 'block' ? 'Bloquear Cliente' : 'Desbloquear Cliente',
        })
      );

      await waitFor(() => {
        expect(onCustomerUpdated).toHaveBeenCalledTimes(1);
        expect(
          screen.getByRole('button', {
            name:
              action === 'block'
                ? '✅ Cliente Teste foi bloqueado com sucesso.'
                : '✅ Cliente Teste foi desbloqueado com sucesso.',
          })
        ).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
      await user.click(
        screen.getByRole('button', {
          name:
            action === 'block'
              ? '✅ Cliente Teste foi bloqueado com sucesso.'
              : '✅ Cliente Teste foi desbloqueado com sucesso.',
        })
      );
      expect(onClose).toHaveBeenCalledTimes(1);

      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/v1/bakery/customers/12/${action}/`,
        expect.objectContaining({ method: 'POST' })
      );
      const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(requestInit.body).toContain('"admin_password":"senha-correta"');
    }
  );
});
