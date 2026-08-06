import { useState, useCallback } from 'react';
import { maskPatterns, MaskType } from '../utils/maskPatterns';

interface UseMaskInputResult {
  value: string;
  setValue: (value: string) => void;
  onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formattedValue: string;
  inputMode: 'numeric' | 'tel' | 'text';
}

/**
 * Hook para gerenciar input com máscara inteligente
 * Suporta backspace smart, auto-formatting, etc.
 *
 * @param maskType - Tipo de máscara: 'cpf' | 'cnpj' | 'phone' | 'zipCode' | 'streetNumber'
 * @param initialValue - Valor inicial (default: '')
 * @returns Object com value, setValue, onChangeHandler, formattedValue, inputMode
 *
 * @example
 * const { formattedValue, onChangeHandler } = useMaskInput('cpf');
 * return <input value={formattedValue} onChange={onChangeHandler} />;
 */
export function useMaskInput(maskType: MaskType, initialValue = ''): UseMaskInputResult {
  const pattern = maskPatterns[maskType];
  const [internalValue, setInternalValue] = useState(initialValue);

  // Aplica a máscara ao valor
  const applyMask = useCallback(
    (rawValue: string) => {
      // Se não atender ao regex, retorna o valor anterior (rejeita a entrada)
      if (!pattern.regex.test(rawValue)) {
        return internalValue;
      }

      // Aplica o formato visual
      return pattern.format(rawValue);
    },
    [pattern, internalValue]
  );

  // Handler para onChange do input
  const onChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Extrair apenas dígitos para validação
      const digitsOnly = inputValue.replace(/\D/g, '');

      // Se não atender ao regex (validação de dígitos puros), rejeita
      if (!pattern.regex.test(digitsOnly)) {
        return;
      }

      // Aplicar máscara ao valor
      const masked = pattern.format(digitsOnly);
      setInternalValue(masked);
    },
    [pattern]
  );

  // Setter manual (útil para programatic updates)
  const setValue = useCallback(
    (newValue: string) => {
      const masked = applyMask(newValue);
      setInternalValue(masked);
    },
    [applyMask]
  );

  // Valor apenas com números (para enviar ao backend)
  const rawValue = internalValue.replace(/\D/g, '');

  return {
    value: rawValue, // Valor numérico puro para backend
    setValue,
    onChangeHandler,
    formattedValue: internalValue, // Valor formatado para exibir no input
    inputMode: pattern.inputMode,
  };
}
