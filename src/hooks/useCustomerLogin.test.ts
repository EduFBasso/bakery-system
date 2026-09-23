import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerLogin } from './useCustomerLogin';

describe('useCustomerLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('exibe a mensagem de erro devolvida em non_field_errors', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        non_field_errors: ['Credenciais inválidas ou usuário não encontrado.'],
      }),
    } as Response);
    const { result } = renderHook(() => useCustomerLogin());

    await result.current.login('cliente', 'senha-incorreta');

    await waitFor(() => {
      expect(result.current.error).toBe('Credenciais inválidas ou usuário não encontrado.');
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it('preserva a sessão admin ao autenticar o cliente', async () => {
    localStorage.setItem('bread_admin_token', 'token-admin');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access: 'token-cliente',
        refresh: 'refresh-cliente',
        customer: {
          id: 1,
          customer_id: 1,
          nickname: 'cliente',
          customer_type: 'PJ',
          status: 'ACTIVE',
        },
      }),
    } as Response);
    const { result } = renderHook(() => useCustomerLogin());

    await result.current.login('cliente', 'senha-correta');

    expect(localStorage.getItem('bread_admin_token')).toBe('token-admin');
    expect(localStorage.getItem('bread_customer_token')).toBe('token-cliente');
  });
});
