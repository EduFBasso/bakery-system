import { useState, useCallback } from 'react';
import { Customer } from '../types';
import { ApiService } from '../services/api';

interface UseCustomerReturn {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  register: (data: Omit<Customer, 'id'>) => Promise<void>;
  login: (nickname: string, password: string) => Promise<void>;
  logout: () => void;
  setCustomer: (customer: Customer, token: string) => void;
}

const STORAGE_KEYS = {
  CUSTOMER: 'bread_customer',
  TOKEN: 'bread_token',
};

export function useCustomer(): UseCustomerReturn {
  const [customer, setCustomerState] = useState<Customer | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!token && !!customer && customer.status === 'APROVADO';

  const register = useCallback(async (data: Omit<Customer, 'id'>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.registerCustomer(data as any);

      // Após registro, cliente é PENDENTE, aguarda aprovação
      // Salvar apenas para referência, mas ainda não fazer login automático
      const newCustomer: Customer = {
        ...result.customer,
        access_token: result.access_token,
      };

      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(newCustomer));
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.access_token);

      setCustomerState(newCustomer);
      setTokenState(result.access_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao registrar';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (nickname: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.loginCustomer(nickname, password);

      // Salvar dados do cliente autenticado
      const newCustomer: Customer = {
        ...result.customer,
        access_token: result.access_token,
      };

      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(newCustomer));
      localStorage.setItem(STORAGE_KEYS.TOKEN, result.access_token);

      setCustomerState(newCustomer);
      setTokenState(result.access_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setCustomerState(null);
    setTokenState(null);
    setError(null);
  }, []);

  const setCustomer = useCallback((newCustomer: Customer, newToken: string) => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(newCustomer));
    localStorage.setItem(STORAGE_KEYS.TOKEN, newToken);
    setCustomerState(newCustomer);
    setTokenState(newToken);
  }, []);

  return {
    customer,
    token,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    setCustomer,
  };
}
