import { useState } from 'react';

interface UseDeleteProductReturn {
  deleteProduct: (productId: number) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useDeleteProduct(): UseDeleteProductReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProduct = async (productId: number): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const adminToken = localStorage.getItem('bread_admin_token');
      if (!adminToken) {
        throw new Error('Admin não autenticado');
      }

      const response = await fetch(`/api/v1/bakery/products/${productId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar produto';
      setError(message);
      console.error('Delete product error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteProduct,
    loading,
    error,
  };
}
