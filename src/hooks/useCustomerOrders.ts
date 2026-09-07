import { useState, useEffect } from 'react';
import { useCustomerAuth } from './useCustomerAuth';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  order_date: string;
  created_at?: string;
  paid_at?: string | null;
  updated_at?: string;
  total_value: string;
  delivery_date: string | null;
  notes: string | null;
  items: OrderItem[];
  order_items?: OrderItem[];
}

export function useCustomerOrders() {
  const { token, isAuthenticated } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/bakery/orders/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
          throw new Error(`Erro ao carregar pedidos: ${response.status}`);
        }

        const data = await response.json();
        const rows = (Array.isArray(data) ? data : data.results || []) as Order[];
        setOrders(
          rows.map((row) => ({
            ...row,
            order_date: row.order_date ?? row.created_at ?? '',
            items: row.items ?? row.order_items ?? [],
          }))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar pedidos';
        setError(message);
        console.error('Orders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, isAuthenticated, refreshKey]);

  useEffect(() => {
    const refreshOrders = () => setRefreshKey((value) => value + 1);
    const refreshVisibleOrders = () => {
      if (document.visibilityState === 'visible') {
        refreshOrders();
      }
    };
    window.addEventListener('bakery:customer-data-changed', refreshOrders);
    window.addEventListener('focus', refreshOrders);
    document.addEventListener('visibilitychange', refreshVisibleOrders);
    return () => {
      window.removeEventListener('bakery:customer-data-changed', refreshOrders);
      window.removeEventListener('focus', refreshOrders);
      document.removeEventListener('visibilitychange', refreshVisibleOrders);
    };
  }, []);

  return {
    orders,
    loading,
    error,
    refetch: () => setRefreshKey((value) => value + 1),
  };
}
