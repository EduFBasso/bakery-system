import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerLogin } from './useCustomerLogin';

const approvedCustomer = {
  id: 1,
  customer_id: 1,
  nickname: 'cliente',
  customer_type: 'PJ',
  status: 'APROVADO',
};

function mockLoginResponse(body: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => body,
  } as Response);
}

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

  it('chama o endpoint de login de cliente', async () => {
    const fetchSpy = mockLoginResponse({
      access: 'token-cliente',
      refresh: 'refresh-cliente',
      role: 'member',
      customer: approvedCustomer,
    });
    const { result } = renderHook(() => useCustomerLogin());

    await result.current.login('cliente', 'senha-correta');

    expect(String(fetchSpy.mock.calls[0][0])).toContain('/api/v1/auth/bakery/login/customer/');
  });

  it('persiste a sessão de cliente sem descartar a sessão admin de outra rota', async () => {
    localStorage.setItem('bread_admin_token', 'token-admin');
    localStorage.setItem('bread_admin_user', '{}');
    mockLoginResponse({
      access: 'token-cliente',
      refresh: 'refresh-cliente',
      role: 'member',
      customer: approvedCustomer,
    });
    const { result } = renderHook(() => useCustomerLogin());

    await expect(result.current.login('cliente', 'senha-correta')).resolves.toBe(true);

    expect(localStorage.getItem('bread_admin_token')).toBe('token-admin');
    expect(localStorage.getItem('bread_admin_user')).toBe('{}');
    expect(localStorage.getItem('bread_customer_token')).toBe('token-cliente');
    expect(localStorage.getItem('bread_customer_refresh')).toBe('refresh-cliente');
    expect(JSON.parse(localStorage.getItem('bread_customer_user') || '{}').nickname).toBe(
      'cliente'
    );
  });

  it('rejeita resposta sem customer e não salva sessão', async () => {
    mockLoginResponse({ access: 'a', refresh: 'r', role: 'member' });
    const { result } = renderHook(() => useCustomerLogin());

    await expect(result.current.login('cliente', 'senha')).resolves.toBe(false);

    expect(localStorage.getItem('bread_customer_token')).toBeNull();
  });

  it('rejeita cliente não aprovado e não salva sessão', async () => {
    mockLoginResponse({
      access: 'a',
      refresh: 'r',
      role: 'member',
      customer: { ...approvedCustomer, status: 'PENDENTE' },
    });
    const { result } = renderHook(() => useCustomerLogin());

    await expect(result.current.login('cliente', 'senha')).resolves.toBe(false);

    expect(localStorage.getItem('bread_customer_token')).toBeNull();
  });

  it('rejeita perfil administrativo orientando o login administrativo', async () => {
    mockLoginResponse({
      access: 'a',
      refresh: 'r',
      role: 'owner',
      customer: approvedCustomer,
    });
    const { result } = renderHook(() => useCustomerLogin());

    await expect(result.current.login('dono', 'senha')).resolves.toBe(false);

    await waitFor(() => expect(result.current.error).toContain('login administrativo'));
    expect(localStorage.getItem('bread_customer_token')).toBeNull();
  });
});
