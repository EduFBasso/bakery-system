import { useState, useEffect } from 'react';
import { useCustomerAuth } from './useCustomerAuth';

export interface CustomerDashboardData {
  financialUsed: number;
  financialAvailable: number;
  financialLimit: number;
  totalOrders: number;
  pendingOrders: number;
  totalSpent: number;
}

export function useCustomerDashboard() {
  const { customer, token, isAuthenticated } = useCustomerAuth();
  const [data, setData] = useState<CustomerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseMoney = (value?: string) => {
    const parsed = Number.parseFloat(String(value ?? '0'));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  useEffect(() => {
    if (!isAuthenticated || !token || !customer) {
      setData(null);
      return;
    }

    try {
      const financialUsed = parseMoney(customer.financial_used ?? customer.current_balance);
      const financialAvailable = parseMoney(
        customer.financial_available ?? customer.available_credit
      );
      const financialLimit = parseMoney(customer.financial_limit ?? customer.credit_limit);

      const dashboardData: CustomerDashboardData = {
        financialUsed,
        financialAvailable,
        financialLimit,
        totalOrders: 0,
        pendingOrders: 0,
        totalSpent: 0,
      };

      setData(dashboardData);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
      console.error('Dashboard data fetch error:', err);
    }
  }, [isAuthenticated, token, customer]);

  return {
    data,
    error,
  };
}
