import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installAuthExpiryHandler } from './authExpiry';

describe('auth expiry handler', () => {
  let restoreFetch: (() => void) | undefined;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bread_admin_token', 'token-admin');
  });

  afterEach(() => {
    restoreFetch?.();
    restoreFetch = undefined;
    vi.restoreAllMocks();
  });

  it.each([
    '/api/v1/bakery/customers/12/block/',
    '/api/v1/bakery/customers/12/reject/',
    '/api/v1/bakery/orders/12/cancel/',
    '/api/v1/bakery/orders/12/status/',
  ])(
    'nao encerra a sessao quando a senha administrativa esta incorreta em %s',
    async (endpoint) => {
      const originalFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
      vi.stubGlobal('fetch', originalFetch);
      restoreFetch = installAuthExpiryHandler();

      const response = await window.fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: 'Bearer token-admin' },
        body: JSON.stringify({ admin_password: 'senha-errada' }),
      });

      expect(response.status).toBe(401);
      expect(localStorage.getItem('bread_admin_token')).toBe('token-admin');
    }
  );
});
