import { useState } from 'react';
import { useCustomerAuth } from './useCustomerAuth';

export interface OrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  delivery_date: string;
  payment_method: string;
  notes?: string;
  items: OrderItem[];
  shipping_zip_code?: string;
  shipping_street?: string;
  shipping_number?: string;
  shipping_complement?: string;
  shipping_neighborhood?: string;
  shipping_city?: string;
  shipping_state?: string;
}

export interface CreateOrderResponse {
  id: number;
  order_number: string;
  customer_id: number;
  status: string;
  order_date: string;
  delivery_date: string;
  payment_method: string;
  total_value: string;
  items: any[];
}

export function useCreateOrder() {
  const { token } = useCustomerAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch('/api/v1/bakery/orders/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.detail || errorData.errors || `Erro ao criar pedido: ${response.status}`;
        throw new Error(
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)
        );
      }

      const data = await response.json();
      return data as CreateOrderResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar pedido';
      setError(message);
      console.error('Create order error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading,
    error,
  };
}
