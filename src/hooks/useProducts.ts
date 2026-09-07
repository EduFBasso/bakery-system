import { useState, useEffect } from 'react';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
  created_at: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem('bread_customer_token') || localStorage.getItem('bread_admin_token');
    if (!token) {
      throw new Error('Sessão não autenticada');
    }

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  };

  const fetchProducts = async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const response = await fetch('/api/v1/bakery/products/', {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar produtos: ${response.status}`);
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(message);
      console.error('Products fetch error:', err);
    } finally {
      if (initialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void fetchProducts(true);
  }, []);

  return {
    products,
    loading,
    refreshing,
    error,
    refetch: () => fetchProducts(false),
  };
}
