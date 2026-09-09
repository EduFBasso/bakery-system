import { useState, useCallback, useRef, useEffect } from 'react';
import { resolveTenantSlug } from '../config/tenant';

interface CustomerUser {
  id: number;
  customer_id: number;
  nickname: string;
  customer_type: string;
  phone?: string;
  status: string;
}

interface CustomerLoginResponse {
  access: string;
  refresh: string;
  customer?: CustomerUser;
}

interface UseCustomerLoginOptions {
  onSuccess?: (response: CustomerLoginResponse) => void;
  onError?: (error: string) => void;
}

export function useCustomerLogin(options?: UseCustomerLoginOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref para sempre ter acesso ao options mais recente sem recriar o login callback
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const removeInvisibleCharacters = (value: string) => {
    // Remove zero-width and hidden formatting chars commonly introduced by mobile paste.
    return value.replace(/[\u00A0\u200B-\u200D\u2060\uFEFF]/g, '');
  };

  const login = useCallback(
    async (nickname: string, password: string) => {
      setLoading(true);
      setError(null);

      const sanitizedEmail = removeInvisibleCharacters(nickname).trim();
      const sanitizedPassword = removeInvisibleCharacters(password).trim();

      const tenantSlug = resolveTenantSlug();

      try {
        const response = await fetch('/api/v1/auth/bakery/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: sanitizedEmail,
            password: sanitizedPassword,
            tenant_slug: tenantSlug,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data.detail || data.email?.[0] || data.password?.[0] || 'Erro ao fazer login';
          setError(errorMessage);
          optionsRef.current?.onError?.(errorMessage);
          return false;
        }

        // Salvar tokens e info do cliente
        localStorage.removeItem('bread_admin_token');
        localStorage.removeItem('bread_admin_refresh');
        localStorage.removeItem('bread_admin_role');
        localStorage.removeItem('bread_admin_user');
        localStorage.setItem('bread_customer_token', data.access);
        localStorage.setItem('bread_customer_refresh', data.refresh);
        if (data.customer) {
          localStorage.setItem('bread_customer_user', JSON.stringify(data.customer));
        } else {
          localStorage.removeItem('bread_customer_user');
        }

        optionsRef.current?.onSuccess?.(data);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
        setError(errorMessage);
        optionsRef.current?.onError?.(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [] // login nunca muda — usa optionsRef para sempre ter callbacks atualizados
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bread_customer_token');
    localStorage.removeItem('bread_customer_refresh');
    localStorage.removeItem('bread_customer_user');
  }, []);

  return {
    login,
    loading,
    error,
    clearError,
    logout,
  };
}
