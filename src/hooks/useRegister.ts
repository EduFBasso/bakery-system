import { useState, useCallback } from 'react';
import { RegistrationFormData, RegistrationResponse, ApiErrorResponse } from '../types/forms';
import { ApiService } from '../services/api';

interface UseRegisterOptions {
  onSuccess?: (response: RegistrationResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Hook para gerenciar o registro de novo cliente
 *
 * @param options - Callbacks para sucesso e erro
 * @returns Object com loading, error, submit function
 *
 * @example
 * const { loading, error, register } = useRegister({
 *   onSuccess: (res) => navigate('/pending'),
 *   onError: (err) => setErrorMessage(err),
 * });
 *
 * const handleSubmit = async (formData) => {
 *   await register(formData);
 * };
 */
export function useRegister(options: UseRegisterOptions = {}) {
  const { onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (data: RegistrationFormData) => {
      setLoading(true);
      setError(null);

      try {
        // Limpar dados desnecessários baseado no tipo de cliente
        const submitData = { ...data };
        if (submitData.customer_type === 'PF') {
          delete submitData.cnpj;
          delete submitData.company_name;
        } else {
          delete submitData.cpf;
        }

        // Chamar API
        const response = await ApiService.registerCustomer(submitData);

        // Sucesso
        const result: RegistrationResponse = {
          id: response.id,
          nickname: response.customer.nickname,
          phone: response.customer.phone,
          status: response.customer.status || 'PENDENTE',
          access_token: response.access_token,
          refresh_token: response.refresh_token,
        };

        onSuccess?.(result);
        return result;
      } catch (err) {
        // Tratamento de erro
        let errorMessage = 'Erro ao registrar cliente';

        if (err instanceof Error) {
          errorMessage = err.message;

          // Tentar extrair mensagem mais específica
          try {
            const parsed = JSON.parse(err.message) as ApiErrorResponse;
            errorMessage = parsed.detail || errorMessage;
          } catch {
            // Não é JSON, usar mensagem original
          }
        }

        setError(errorMessage);
        onError?.(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError]
  );

  return {
    loading,
    error,
    register,
    clearError: () => setError(null),
  };
}
