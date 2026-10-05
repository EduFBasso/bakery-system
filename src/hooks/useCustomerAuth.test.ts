import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCustomerAuth } from './useCustomerAuth';

function fakeJwt(payload: Record<string, unknown>) {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${encodedPayload}.signature`;
}

describe('useCustomerAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('mantém a sessão quando o payload JWT não possui padding Base64URL', async () => {
    const token = fakeJwt({ user_id: 7 });
    localStorage.setItem('bread_customer_token', token);
    localStorage.setItem(
      'bread_customer_user',
      JSON.stringify({ id: 12, user: 7, nickname: 'Fabricio', status: 'APROVADO' })
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: 12, user: 7, nickname: 'Fabricio', status: 'APROVADO' }],
      }),
    } as Response);

    const { result } = renderHook(() => useCustomerAuth());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.customer?.nickname).toBe('Fabricio');
    expect(localStorage.getItem('bread_customer_token')).toBe(token);
  });

  it('compartilha o bootstrap entre instâncias e reutiliza a sessão em novos consumidores', async () => {
    const token = fakeJwt({ user_id: 8 });
    const customer = { id: 13, user: 8, nickname: 'Marina', status: 'APROVADO' };
    localStorage.setItem('bread_customer_token', token);
    localStorage.setItem('bread_customer_user', JSON.stringify(customer));
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ results: [customer] }),
    } as Response);

    const first = renderHook(() => useCustomerAuth());
    const second = renderHook(() => useCustomerAuth());

    await waitFor(() => {
      expect(first.result.current.isLoading).toBe(false);
      expect(second.result.current.isLoading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const third = renderHook(() => useCustomerAuth());
    await waitFor(() => expect(third.result.current.isLoading).toBe(false));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(third.result.current.customer?.nickname).toBe('Marina');
  });
});
