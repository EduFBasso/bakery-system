import { useState } from 'react';

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: string;
  is_active?: boolean;
}

export interface UpdateProductResponse {
  id: number;
  name: string;
  description: string;
  price: string;
  is_active: boolean;
  created_at: string;
}

interface UseUpdateProductReturn {
  updateProduct: (
    productId: number,
    data: UpdateProductInput
  ) => Promise<UpdateProductResponse | null>;
  loading: boolean;
  error: string | null;
}

export function useUpdateProduct(): UseUpdateProductReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProduct = async (
    productId: number,
    data: UpdateProductInput
  ): Promise<UpdateProductResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const adminToken = localStorage.getItem('bread_admin_token');
      if (!adminToken) {
        throw new Error('Admin não autenticado');
      }

      const response = await fetch(`/api/v1/bakery/products/${productId}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();
      setError(null);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      setError(message);
      console.error('Update product error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProduct,
    loading,
    error,
  };
}
