import { useState, useCallback, useRef, useEffect } from 'react';
import { resolveTenantSlug } from '../config/tenant';
import { apiUrl } from '../config/api';
import { clearCustomerSession, persistCustomerSession } from '../services/session';

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
  role: string;
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

  const extractApiErrorMessage = (data: unknown): string => {
    const payload =
      typeof data === 'object' && data !== null
        ? (data as Record<string, unknown>)
        : {};
    if (typeof payload.detail === 'string' && payload.detail.trim()) {
      return payload.detail;
    }
    if (Array.isArray(payload.non_field_errors) && payload.non_field_errors[0]) {
      return String(payload.non_field_errors[0]);
    }
    if (Array.isArray(payload.login) && payload.login[0]) {
      return String(payload.login[0]);
    }
    if (Array.isArray(payload.password) && payload.password[0]) {
      return String(payload.password[0]);
    }
    return 'Erro ao fazer login';
  };

  const login = useCallback(
    async (nickname: string, password: string) => {
      setLoading(true);
      setError(null);

      const sanitizedEmail = removeInvisibleCharacters(nickname).trim();
      const sanitizedPassword = removeInvisibleCharacters(password).trim();

      const tenantSlug = resolveTenantSlug();

      try {
        const response = await fetch(apiUrl('/api/v1/auth/bakery/login/customer/'), {
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
          const errorMessage = extractApiErrorMessage(data);
          setError(errorMessage);
          optionsRef.current?.onError?.(errorMessage);
          return false;
        }

        // Só persiste a sessão se for member com cliente aprovado
        const sessionError = persistCustomerSession(data);
        if (sessionError) {
          setError(sessionError);
          optionsRef.current?.onError?.(sessionError);
          return false;
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
    clearCustomerSession();
  }, []);

  return {
    login,
    loading,
    error,
    clearError,
    logout,
  };
}
