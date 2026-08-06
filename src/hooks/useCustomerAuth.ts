import { useState, useEffect, useCallback } from 'react';

interface CustomerData {
  id: number;
  customer_id?: number;
  nickname: string;
  customer_type: string;
  company_name?: string;
  cnpj_cpf?: string;
  phone?: string;
  status: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  created_at?: string;
  current_balance?: string;
  financial_limit?: string;
  financial_used?: string;
  available_credit?: string;
  financial_available?: string;
  credit_limit?: string;
}

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseCurrentCustomer = (payload: unknown): CustomerData | null => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const maybePaginated = payload as { results?: unknown };
    if (Array.isArray(maybePaginated.results)) {
      return (maybePaginated.results[0] as CustomerData) ?? null;
    }

    if (Array.isArray(payload)) {
      return (payload[0] as CustomerData) ?? null;
    }

    return payload as CustomerData;
  };

  useEffect(() => {
    // Carregar dados do localStorage
    const storedToken = localStorage.getItem('bread_customer_token');
    const storedCustomer = localStorage.getItem('bread_customer_user');

    const bootstrapCustomerSession = async () => {
      // Sessão válida completa no storage
      if (storedToken && storedCustomer) {
        try {
          setToken(storedToken);
          setCustomer(JSON.parse(storedCustomer));

          // Sincroniza com backend para evitar dados financeiros defasados.
          const response = await fetch('/api/v1/bakery/customers/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const payload = await response.json();
            const freshCustomerData = parseCurrentCustomer(payload);
            if (freshCustomerData) {
              localStorage.setItem('bread_customer_user', JSON.stringify(freshCustomerData));
              setCustomer(freshCustomerData);
            }
          }

          setIsLoading(false);
          return;
        } catch (err) {
          console.error('Erro ao carregar dados do cliente:', err);
          logout();
          setIsLoading(false);
          return;
        }
      }

      // Token sem customer no storage: tenta reconstruir sessão via /me
      if (storedToken && !storedCustomer) {
        try {
          const response = await fetch('/api/v1/bakery/customers/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (!response.ok) {
            logout();
            setIsLoading(false);
            return;
          }

          const payload = await response.json();
          const customerData = parseCurrentCustomer(payload);
          if (!customerData) {
            logout();
            setIsLoading(false);
            return;
          }
          localStorage.setItem('bread_customer_user', JSON.stringify(customerData));
          setToken(storedToken);
          setCustomer(customerData);
          setIsLoading(false);
          return;
        } catch (err) {
          console.error('Erro ao reconstruir sessão do cliente:', err);
          logout();
          setIsLoading(false);
          return;
        }
      }

      // Sem sessão válida
      if (!storedToken && storedCustomer) {
        // Evita estado inconsistente de customer sem token
        logout();
      }

      setIsLoading(false);
    };

    void bootstrapCustomerSession();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bread_customer_token');
    localStorage.removeItem('bread_customer_refresh');
    localStorage.removeItem('bread_customer_user');
    setCustomer(null);
    setToken(null);
  }, []);

  const isAuthenticated = !!token && !!customer;

  return {
    customer,
    token,
    isAuthenticated,
    isLoading,
    logout,
  };
}
