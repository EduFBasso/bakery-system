import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCancelOrder } from './useCancelOrder';

describe('useCancelOrder security contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('envia admin_password no body ao cancelar pedido', async () => {
    localStorage.setItem('bread_admin_token', 'token-admin');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 9,
        order_number: 'ORD-009',
        status: 'CANCELLED',
        cancelled_at: '2026-07-15T10:00:00',
        cancellation_reason: 'teste',
      }),
    } as Response);

    const { result } = renderHook(() => useCancelOrder());

    const response = await result.current.cancelOrder(
      9,
      'Cancelado pelo dono',
      'CREDIT',
      'senha-dono'
    );

    expect(response?.status).toBe('CANCELLED');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/bakery/orders/9/cancel/',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit.body).toContain('"admin_password":"senha-dono"');
  });

  it('falha quando token admin nao existe', async () => {
    const { result } = renderHook(() => useCancelOrder());

    const response = await result.current.cancelOrder(5, 'motivo', 'CREDIT', 'senha');

    expect(response).toBeNull();
    await waitFor(() => {
      expect(result.current.error).toBe('Token de admin não disponível');
    });
  });

  it('usa token do cliente sem enviar senha administrativa', async () => {
    localStorage.setItem('bread_customer_token', 'token-cliente');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ id: 5, status: 'CANCELLED' }),
    } as Response);
    const { result } = renderHook(() => useCancelOrder());

    await result.current.cancelCustomerOrder(5, 'Pedido duplicado');

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit.headers).toMatchObject({ Authorization: 'Bearer token-cliente' });
    expect(requestInit.body).toBe(JSON.stringify({ reason: 'Pedido duplicado' }));
  });
});
