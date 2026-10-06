import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuthExpiryMessage, installAuthExpiryHandler } from './authExpiry';

describe('auth expiry handler', () => {
  let restoreFetch: (() => void) | undefined;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('bread_admin_token', 'token-admin');
  });

  afterEach(() => {
    restoreFetch?.();
    restoreFetch = undefined;
    window.history.replaceState({}, '', '/');
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

  it('encerra a sessão quando uma ação protegida retorna token inválido', async () => {
    window.history.replaceState({}, '', '/admin');
    const originalFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'token_not_valid',
          detail: 'Given token not valid for any token type',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );
    vi.stubGlobal('fetch', originalFetch);
    restoreFetch = installAuthExpiryHandler();

    const response = await window.fetch('/api/v1/bakery/customers/12/reveal-password/', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-admin' },
      body: JSON.stringify({ admin_password: 'senha-do-dono' }),
    });

    expect(response.status).toBe(401);
    expect(localStorage.getItem('bread_admin_token')).toBeNull();
    expect(sessionStorage.getItem('bread_auth_expiry_message')).toBe(
      'Sua sessão expirou. Faça login novamente para continuar.'
    );
  });

  it('permite limpar mensagem residual antes de iniciar cadastro', () => {
    sessionStorage.setItem(
      'bread_auth_expiry_message',
      'Sua sessão expirou. Faça login novamente para continuar.'
    );

    clearAuthExpiryMessage();

    expect(sessionStorage.getItem('bread_auth_expiry_message')).toBeNull();
  });
});
