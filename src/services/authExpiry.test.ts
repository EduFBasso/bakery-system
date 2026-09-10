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

  it.each(['/block/', '/reject/'])(
    'nao encerra a sessao quando a senha administrativa esta incorreta em %s',
    async (action) => {
      const originalFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 401 }));
      vi.stubGlobal('fetch', originalFetch);
      restoreFetch = installAuthExpiryHandler();

      const response = await window.fetch(`/api/v1/bakery/customers/12${action}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer token-admin' },
        body: JSON.stringify({ admin_password: 'senha-errada' }),
      });

      expect(response.status).toBe(401);
      expect(localStorage.getItem('bread_admin_token')).toBe('token-admin');
    }
  );
});
