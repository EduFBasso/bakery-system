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
  open_only?: boolean;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}) {
  const status = filters?.status;
  const customerNickname = filters?.customer_nickname;
  const customerId = filters?.customer_id;
  const openOnly = filters?.open_only;
  const dateFrom = filters?.date_from;
  const dateTo = filters?.date_to;
  const page = filters?.page;
  const pageSize = filters?.page_size;
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
        if (status) {
          const statusValue = status === 'PAID' ? 'CONFIRMED,DELIVERED' : status;
          params.append('status', statusValue);
        }
        if (customerNickname) params.append('customer_nickname', customerNickname);
        if (customerId) params.append('customer_id', customerId.toString());
        if (openOnly) params.append('open_only', 'true');
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        if (page) params.append('page', page.toString());
        if (pageSize) params.append('page_size', pageSize.toString());

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
  }, [status, customerNickname, customerId, openOnly, dateFrom, dateTo, page, pageSize]);

  return {
    orders,
    loading,
    error,
    pagination,
  };
}
