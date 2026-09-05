import { useState, useCallback, useRef, useEffect } from 'react';

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface AdminLoginResponse {
  access: string;
  refresh: string;
  professional: AdminUser;
  ecosystem: string;
}

interface UseAdminLoginOptions {
  onSuccess?: (response: AdminLoginResponse) => void;
  onError?: (error: string) => void;
}

export function useAdminLogin(options?: UseAdminLoginOptions) {
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

  const extractApiErrorMessage = (data: any): string => {
    if (typeof data?.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
    if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) {
      return String(data.non_field_errors[0]);
    }
    if (Array.isArray(data?.password) && data.password[0]) {
      return String(data.password[0]);
    }
    if (Array.isArray(data?.email) && data.email[0]) {
      return String(data.email[0]);
    }
    return 'Erro ao fazer login';
  };

  const login = useCallback(
    async (loginValue: string, password: string) => {
      setLoading(true);
      setError(null);

      const sanitizedLogin = removeInvisibleCharacters(loginValue).trim();
      const sanitizedPassword = removeInvisibleCharacters(password).trim();
      // Slug do tenant definido por variável de ambiente — com fallback para o tenant local padrao
      const tenantSlug = import.meta.env.VITE_BAKERY_TENANT_SLUG || 'admin-panificadora';

      try {
        const response = await fetch('/api/v1/auth/bakery/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: sanitizedLogin,
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

        // Salvar tokens e info do admin
        localStorage.setItem('bread_admin_token', data.access);
        localStorage.setItem('bread_admin_refresh', data.refresh);
        localStorage.setItem('bread_admin_role', 'admin');
        localStorage.setItem('bread_admin_user', JSON.stringify(data.professional || {}));

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
    localStorage.removeItem('bread_admin_token');
    localStorage.removeItem('bread_admin_refresh');
    localStorage.removeItem('bread_admin_role');
    localStorage.removeItem('bread_admin_user');
  }, []);

  return {
    login,
    loading,
    error,
    clearError,
    logout,
  };
}
