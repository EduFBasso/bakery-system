import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdminLogin } from './useAdminLogin';

const tenant = { slug: 'admin-panificadora', trade_name: 'Panificadora' };
const professional = { id: 4, email: 'dono@email.com' };

function mockLoginResponse(body: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => body,
  } as Response);
}

describe('useAdminLogin', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('chama o endpoint de login administrativo', async () => {
    const fetchSpy = mockLoginResponse({
      access: 'a',
      refresh: 'r',
      role: 'owner',
      tenant,
      professional,
    });
    const { result } = renderHook(() => useAdminLogin());

    await result.current.login('dono@email.com', 'senha');

    expect(String(fetchSpy.mock.calls[0][0])).toContain('/api/v1/auth/bakery/login/admin/');
  });

  it.each(['owner', 'admin'])(
    'persiste a sessão admin para %s e descarta a sessão de cliente',
    async (role) => {
      localStorage.setItem('bread_customer_token', 'token-cliente');
      localStorage.setItem('bread_customer_user', '{}');
      mockLoginResponse({ access: 'a', refresh: 'r', role, tenant, professional });
      const { result } = renderHook(() => useAdminLogin());

      await expect(result.current.login('dono@email.com', 'senha')).resolves.toBe(true);

      expect(localStorage.getItem('bread_admin_token')).toBe('a');
      expect(localStorage.getItem('bread_admin_refresh')).toBe('r');
      expect(localStorage.getItem('bread_admin_role')).toBe(role);
      expect(JSON.parse(localStorage.getItem('bread_admin_user') || '{}').tenant).toEqual(tenant);
      expect(localStorage.getItem('bread_customer_token')).toBeNull();
      expect(localStorage.getItem('bread_customer_user')).toBeNull();
    }
  );

  it('não persiste sessão quando o backend retorna member', async () => {
    mockLoginResponse({ access: 'a', refresh: 'r', role: 'member', tenant, professional });
    const { result } = renderHook(() => useAdminLogin());

    await expect(result.current.login('cliente@email.com', 'senha')).resolves.toBe(false);

    await waitFor(() => expect(result.current.error).toContain('login de cliente'));
    expect(localStorage.getItem('bread_admin_token')).toBeNull();
  });

  it('exibe a orientação devolvida pelo backend', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        non_field_errors: ['Esta conta não possui acesso administrativo. Use o login de cliente.'],
      }),
    } as Response);
    const { result } = renderHook(() => useAdminLogin());

    await result.current.login('cliente@email.com', 'senha');

    await waitFor(() => expect(result.current.error).toContain('login de cliente'));
    expect(localStorage.getItem('bread_admin_token')).toBeNull();
  });
});
