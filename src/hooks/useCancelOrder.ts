import { useState } from 'react';

export interface CancelOrderPayload {
  reason: string;
  refund_method?: string;
}

export interface CancelOrderResponse {
  id: number;
  order_number: string;
  status: string;
  cancelled_at: string;
  cancellation_reason: string;
  [key: string]: any;
}

export function useCancelOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = async (
    orderId: number,
    reason: string,
    refund_method: string = 'CREDIT',
    adminPassword: string
  ): Promise<CancelOrderResponse | null> => {
    const token = localStorage.getItem('bread_admin_token');
    if (!token) {
      setError('Token de admin não disponível');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/bakery/orders/${orderId}/cancel/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason, refund_method, admin_password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: CancelOrderResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cancelar pedido';
      setError(message);
      console.error('Cancel order error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { cancelOrder, loading, error };
}
