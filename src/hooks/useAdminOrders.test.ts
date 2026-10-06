import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeJwt } from '../test/fakeJwt';
import { useAdminOrders } from './useAdminOrders';

const pagedResponse = (results: unknown[]) =>
  ({
    ok: true,
    json: async () => ({ count: results.length, next: null, previous: null, results }),
  }) as Response;

describe('useAdminOrders backend contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('bread_admin_token', fakeJwt({ ecosystem: 'bakery', role: 'owner' }));
  });

  it('envia os filtros do relatório como query string da listagem de pedidos', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(pagedResponse([]));

    const { result } = renderHook(() =>
      useAdminOrders({ open_only: true, ordering: 'created_at', page: 1, page_size: 100 })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const url = new URL(String(fetchSpy.mock.calls[0][0]), 'http://localhost');
    expect(url.pathname).toBe('/api/v1/bakery/orders/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      ordering: 'created_at',
      open_only: 'true',
      page: '1',
      page_size: '100',
    });
  });

  it('traduz o filtro PAID para os status pagos aceitos pelo backend', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(pagedResponse([]));

    const { result } = renderHook(() => useAdminOrders({ status: 'PAID' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const url = new URL(String(fetchSpy.mock.calls[0][0]), 'http://localhost');
    expect(url.searchParams.get('status')).toBe('CONFIRMED,DELIVERED');
  });

  it('não envia status quando o filtro é ALL', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(pagedResponse([]));

    const { result } = renderHook(() => useAdminOrders({ status: 'ALL' }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(String(fetchSpy.mock.calls[0][0])).not.toContain('status=');
  });

  it('expõe order_items do backend como items e preserva a paginação', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        count: 7,
        next: '/api/v1/bakery/orders/?page=2',
        previous: null,
        results: [{ id: 3, order_number: '3', created_at: '2026-10-05T10:00:00Z', order_items: [{ id: 1 }] }],
      }),
    } as Response);

    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orders[0].items).toEqual([{ id: 1 }]);
    expect(result.current.pagination).toEqual({
      count: 7,
      next: '/api/v1/bakery/orders/?page=2',
      previous: null,
    });
  });

  it('reporta o detalhe devolvido pelo backend em respostas de erro', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({ detail: 'Sem permissão.' }),
    } as Response);

    const { result } = renderHook(() => useAdminOrders());
    await waitFor(() => expect(result.current.error).toBe('HTTP 403: Forbidden - Sem permissão.'));
  });
});
