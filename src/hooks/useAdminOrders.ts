import { useState, useEffect } from 'react';

export interface AdminOrder {
  id: number;
  order_number: string;
  customer_id: number;
  customer_nickname: string;
  status: string;
  status_display: string;
  created_at: string;
  delivery_date: string;
  total_value: string;
  payment_method: string;
  paid_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  items: any[];
  order_items?: any[];
}

export interface AdminOrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminOrder[];
}

export function useAdminOrders(filters?: {
  status?: string;
  customer_nickname?: string;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null as string | null,
    previous: null as string | null,
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('bread_admin_token');

    if (!adminToken) {
      setError('Token de admin não disponível');
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query string
        const params = new URLSearchParams();
        if (filters?.status) {
          const statusValue = filters.status === 'PAID' ? 'CONFIRMED,DELIVERED' : filters.status;
          params.append('status', statusValue);
        }
        if (filters?.customer_nickname)
          params.append('customer_nickname', filters.customer_nickname);
        if (filters?.customer_id) params.append('customer_id', filters.customer_id.toString());
        if (filters?.date_from) params.append('date_from', filters.date_from);
        if (filters?.date_to) params.append('date_to', filters.date_to);
        if (filters?.page) params.append('page', filters.page.toString());
        if (filters?.page_size) params.append('page_size', filters.page_size.toString());

        const queryString = params.toString();
        const url = `/api/v1/bakery/orders/${queryString ? '?' + queryString : ''}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          let detail = '';
          try {
            const errorData = await response.json();
            detail = errorData?.detail || '';
          } catch {
            detail = '';
          }

          const suffix = detail ? ` - ${detail}` : '';
          throw new Error(`HTTP ${response.status}: ${response.statusText}${suffix}`);
        }

        const data: AdminOrdersResponse = await response.json();
        setOrders(
          data.results.map((order) => ({
            ...order,
            created_at: order.created_at ?? (order as { order_date?: string }).order_date ?? '',
            items: order.order_items ?? order.items ?? [],
          }))
        );
        setPagination({
          count: data.count,
          next: data.next,
          previous: data.previous,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar pedidos';
        setError(message);
        console.error('Admin orders fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  return {
    orders,
    loading,
    error,
    pagination,
  };
}
