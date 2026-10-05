import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateOrder, type CreateOrderPayload } from './useCreateOrder';

vi.mock('./useCustomerAuth', () => ({
  useCustomerAuth: () => ({ token: 'token-cliente' }),
}));

const payload: CreateOrderPayload = {
  customer_id: 5,
  delivery_date: '2026-10-05T12:00:00.000Z',
  payment_method: 'CREDIT',
  notes: 'Portaria',
  delivery_address_text: 'Rua A, 10, Centro, Limeira, SP, 13480000',
  items: [{ product_id: 2, quantity: 3 }],
};

describe('useCreateOrder backend contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('cria o pedido com POST autenticado e o payload recebido', async () => {
    const created = { id: 8, order_number: '8', status: 'PENDING' };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => created,
    } as Response);
    const { result } = renderHook(() => useCreateOrder());

    let response: unknown;
    await act(async () => {
      response = await result.current.createOrder(payload);
    });

    expect(response).toEqual(created);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/bakery/orders/');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer token-cliente',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });

  it('expõe o detail do backend como erro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Customer is not approved.' }),
    } as Response);
    const { result } = renderHook(() => useCreateOrder());

    let response: unknown = 'pendente';
    await act(async () => {
      response = await result.current.createOrder(payload);
    });

    expect(response).toBeNull();
    expect(result.current.error).toBe('Customer is not approved.');
  });

  it.each([
    [{ items: 'Order total exceeds the available credit.' }, 'Order total exceeds the available credit.'],
    [{ customer_id: ['Customer is not approved.'] }, 'Customer is not approved.'],
    [{}, 'Erro ao criar pedido: 400'],
  ])('exibe o erro de validação por campo do DRF: %j', async (body, expected) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => body,
    } as Response);
    const { result } = renderHook(() => useCreateOrder());

    await act(async () => {
      await result.current.createOrder(payload);
    });

    expect(result.current.error).toBe(expected);
  });
});
