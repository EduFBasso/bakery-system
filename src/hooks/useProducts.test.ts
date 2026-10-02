import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeJwt } from '../test/fakeJwt';
import { useProducts } from './useProducts';

describe('useProducts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('envia o token administrativo no carregamento dos produtos', async () => {
    const token = fakeJwt({ ecosystem: 'bakery', role: 'admin' });
    localStorage.setItem('bread_admin_token', token);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    } as Response);

    const { result } = renderHook(() => useProducts('admin'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/bakery/products/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      })
    );
    expect(result.current.error).toBeNull();
  });

  it('não faz fetch de produtos sem sessão administrativa', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useProducts('admin'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Sessão administrativa não autenticada');
  });
});
