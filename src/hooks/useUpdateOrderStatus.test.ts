import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateOrderStatus } from './useUpdateOrderStatus';

describe('useUpdateOrderStatus security contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('envia admin_password no body ao atualizar status', async () => {
    localStorage.setItem('bread_admin_token', 'token-teste');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 7,
        order_number: 'ORD-007',
        status: 'CONFIRMED',
        status_display: 'Confirmado',
      }),
    } as Response);

    const { result } = renderHook(() => useUpdateOrderStatus());

    const response = await result.current.updateStatus(7, 'CONFIRMED', 'senha-dono');

    expect(response?.status).toBe('CONFIRMED');
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/v1/bakery/orders/7/status/',
      expect.objectContaining({
        method: 'PATCH',
      })
    );

    const requestInit = fetchSpy.mock.calls[0][1] as RequestInit;
    expect(requestInit.body).toContain('"admin_password":"senha-dono"');
  });

  it('falha quando token admin nao existe', async () => {
    const { result } = renderHook(() => useUpdateOrderStatus());

    const response = await result.current.updateStatus(3, 'CONFIRMED', 'senha');

    expect(response).toBeNull();
    await waitFor(() => {
      expect(result.current.error).toBe('Token de admin não disponível');
    });
  });
});
