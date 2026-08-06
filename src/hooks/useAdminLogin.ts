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

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/auth/bakery/login/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data.detail || data.password?.[0] || data.email?.[0] || 'Erro ao fazer login';
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
