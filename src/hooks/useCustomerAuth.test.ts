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
});
