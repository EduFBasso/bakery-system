import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';

export interface CustomerData {
  id: number;
  customer_id?: number;
  user?: number;
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

interface CustomerSession {
  token: string;
  customer: CustomerData;
}

let customerBootstrapPromise: Promise<CustomerSession | null> | null = null;
let cachedCustomerSession: CustomerSession | null = null;

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

const getTokenUserId = (token: string): number | null => {
  try {
    const encodedPayload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const payload = JSON.parse(atob(paddedPayload));
    return Number(payload.user_id ?? payload.sub) || null;
  } catch {
    return null;
  }
};

const matchesTokenCustomer = (token: string, customerData: CustomerData | null) => {
  const tokenUserId = getTokenUserId(token);
  return Boolean(customerData && tokenUserId && customerData.user === tokenUserId);
};

const clearCustomerSession = () => {
  cachedCustomerSession = null;
  customerBootstrapPromise = null;
  localStorage.removeItem('bread_customer_token');
  localStorage.removeItem('bread_customer_refresh');
  localStorage.removeItem('bread_customer_user');
};

const bootstrapCustomerSession = async (): Promise<CustomerSession | null> => {
  const storedToken = localStorage.getItem('bread_customer_token');
  const storedCustomer = localStorage.getItem('bread_customer_user');

  if (!storedToken) {
    if (storedCustomer) {
      clearCustomerSession();
    }
    return null;
  }

  try {
    const response = await fetch(apiUrl('/api/v1/bakery/customers/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedToken}`,
      },
    });

    if (!response.ok) {
      clearCustomerSession();
      return null;
    }

    const payload = await response.json();
    const customer = parseCurrentCustomer(payload);
    if (!matchesTokenCustomer(storedToken, customer)) {
      clearCustomerSession();
      return null;
    }

    localStorage.setItem('bread_customer_user', JSON.stringify(customer));
    return customer ? { token: storedToken, customer } : null;
  } catch (err) {
    console.error('Erro ao carregar dados do cliente:', err);
    clearCustomerSession();
    return null;
  }
};

const loadCustomerSession = (forceRefresh = false) => {
  const storedToken = localStorage.getItem('bread_customer_token');
  if (!forceRefresh && cachedCustomerSession?.token === storedToken) {
    return Promise.resolve(cachedCustomerSession);
  }

  if (customerBootstrapPromise) {
    return customerBootstrapPromise;
  }

  customerBootstrapPromise = bootstrapCustomerSession()
    .then((session) => {
      cachedCustomerSession = session;
      return session;
    })
    .finally(() => {
      customerBootstrapPromise = null;
    });

  return customerBootstrapPromise;
};

export function useCustomerAuth() {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    void loadCustomerSession(refreshKey > 0).then((session) => {
      if (session) {
        setToken(session.token);
        setCustomer(session.customer);
      } else {
        setToken(null);
        setCustomer(null);
      }
      setIsLoading(false);
    });
  }, [refreshKey]);

  useEffect(() => {
    const refreshCustomer = () => setRefreshKey((value) => value + 1);
    const refreshVisibleCustomer = () => {
      if (document.visibilityState === 'visible') {
        refreshCustomer();
      }
    };
    window.addEventListener('bakery:customer-data-changed', refreshCustomer);
    window.addEventListener('focus', refreshCustomer);
    document.addEventListener('visibilitychange', refreshVisibleCustomer);
    return () => {
      window.removeEventListener('bakery:customer-data-changed', refreshCustomer);
      window.removeEventListener('focus', refreshCustomer);
      document.removeEventListener('visibilitychange', refreshVisibleCustomer);
    };
  }, []);

  const logout = useCallback(() => {
    clearCustomerSession();
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
