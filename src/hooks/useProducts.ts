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
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem('bread_admin_token');
    if (!adminToken) {
      throw new Error('Token de admin não disponível');
    }

    return {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
