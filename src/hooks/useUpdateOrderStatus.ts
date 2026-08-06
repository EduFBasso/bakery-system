import { useState } from 'react';

export interface UpdateOrderStatusPayload {
  status: string;
}

export interface UpdateOrderStatusResponse {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  [key: string]: any;
}

export function useUpdateOrderStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    orderId: number,
    newStatus: string,
    adminPassword: string
  ): Promise<UpdateOrderStatusResponse | null> => {
    const token = localStorage.getItem('bread_admin_token');
    if (!token) {
      setError('Token de admin não disponível');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/bakery/orders/${orderId}/status/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus, admin_password: adminPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const data: UpdateOrderStatusResponse = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(message);
      console.error('Update order status error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
