import { useState, useEffect } from 'react';
import { useCustomerAuth } from './useCustomerAuth';

export interface Transaction {
  id: number;
  customer_id: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: string;
  description: string;
  reference_order_id: number | null;
  transaction_date: string;
  created_at: string;
}

export function useCustomerTransactions() {
  const { token, isAuthenticated } = useCustomerAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/bakery/ledger-entries/', {
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
          throw new Error(`Erro ao carregar transações: ${response.status}`);
        }

        const data = await response.json();
        setTransactions(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar transações';
        setError(message);
        console.error('Transactions fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [token, isAuthenticated]);

  return {
    transactions,
    loading,
    error,
  };
}
