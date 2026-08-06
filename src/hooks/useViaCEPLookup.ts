import { useCallback, useRef } from 'react';

interface ViaCEPResponse {
  street: string; // Rua
  neighborhood: string; // Bairro
  city: string; // Cidade
  state: string; // Estado (UF)
  zip_code: string; // CEP
  erro?: boolean; // Erro na busca
}

interface UseViaCEPLookupOptions {
  onSuccess?: (address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  }) => void;
  onError?: (error: string) => void;
  onAutoFocusField?: () => void; // Chamado quando deve fazer auto-focus no campo "Número"
}

/**
 * Hook para buscar endereço via ViaCEP e preencher automaticamente
 * Gerencia loading, erro, e dispara callback para auto-focus após sucesso
 *
 * @param options - Callbacks para sucesso, erro, e auto-focus
 * @returns Object com lookup function, loading, error states
 *
 * @example
 * const { lookup, loading, error } = useViaCEPLookup({
 *   onSuccess: (address) => setFormData(prev => ({ ...prev, ...address })),
 *   onAutoFocusField: () => numberInputRef.current?.focus(),
 * });
 *
 * // Chamar quando CEP estiver completo (8 dígitos)
 * if (cepValue.length === 8) {
 *   lookup(cepValue);
 * }
 */
export function useViaCEPLookup(options: UseViaCEPLookupOptions = {}) {
  const { onSuccess, onError, onAutoFocusField } = options;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookup = useCallback(
    async (zipCode: string) => {
      // Limpar timer anterior se existir (debounce)
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }

      // Remover caracteres especiais
      const cleanZipCode = zipCode.replace(/\D/g, '').slice(0, 8);

      // Validar formato (8 dígitos)
      if (cleanZipCode.length !== 8) {
        onError?.('CEP deve ter 8 dígitos');
        return;
      }

      // Debounce 300ms antes de fazer a requisição
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch('/api/v1/bakery/customers/lookup-cep/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ zip_code: cleanZipCode }),
          });

          if (!response.ok) {
            throw new Error('CEP não encontrado');
          }

          const data: ViaCEPResponse = await response.json();

          if (data.erro) {
            onError?.('CEP não encontrado');
            return;
          }

          // Sucesso: preencher e fazer auto-focus
          onSuccess?.({
            street: data.street || '',
            neighborhood: data.neighborhood || '',
            city: data.city || '',
            state: data.state || '',
          });

          // ⚡ Auto-focus no campo "Número" após preencher
          setTimeout(() => {
            onAutoFocusField?.();
          }, 100);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Erro ao buscar CEP';
          onError?.(errorMsg);
        }
      }, 300);
    },
    [onSuccess, onError, onAutoFocusField]
  );

  return {
    lookup,
  };
}
