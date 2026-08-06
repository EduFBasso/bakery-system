/**
 * Padrões de máscara reutilizáveis para inputs numéricos
 * Cada padrão define: regex para validação, formato visual, comprimento
 */

export interface MaskPattern {
  regex: RegExp; // Valida apenas números permitidos
  format: (value: string) => string; // Aplica máscara visual
  maxLength: number; // Comprimento máximo de números (sem símbolos)
  placeholder: string; // Placeholder visual
  inputMode: 'numeric' | 'tel' | 'text';
}

export const maskPatterns = {
  /**
   * CPF: 123.456.789-16 (11 dígitos)
   */
  cpf: {
    regex: /^\d{0,11}$/,
    format: (value: string): string => {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length === 0) return '';
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      if (digits.length <= 9)
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    },
    maxLength: 11,
    placeholder: 'XXX.XXX.XXX-XX',
    inputMode: 'numeric' as const,
  },

  /**
   * CNPJ: 12.345.678/0001-99 (14 dígitos)
   */
  cnpj: {
    regex: /^\d{0,14}$/,
    format: (value: string): string => {
      const digits = value.replace(/\D/g, '').slice(0, 14);
      if (digits.length === 0) return '';
      if (digits.length <= 2) return digits;
      if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
      if (digits.length <= 8)
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
      if (digits.length <= 12)
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    },
    maxLength: 14,
    placeholder: 'XX.XXX.XXX/XXXX-XX',
    inputMode: 'numeric' as const,
  },

  /**
   * Telefone: (11) 99999-9999 (11 dígitos)
   */
  phone: {
    regex: /^\d{0,11}$/,
    format: (value: string): string => {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length === 0) return '';
      if (digits.length <= 2) return `(${digits}`;
      if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    },
    maxLength: 11,
    placeholder: '(XX) 9XXXX-XXXX',
    inputMode: 'tel' as const,
  },

  /**
   * CEP: 01310-100 (8 dígitos)
   */
  zipCode: {
    regex: /^\d{0,8}$/,
    format: (value: string): string => {
      const digits = value.replace(/\D/g, '').slice(0, 8);
      if (digits.length === 0) return '';
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    },
    maxLength: 8,
    placeholder: 'XXXXX-XXX',
    inputMode: 'numeric' as const,
  },

  /**
   * Número da rua: apenas números
   */
  streetNumber: {
    regex: /^\d{0,10}$/,
    format: (value: string): string => {
      return value.replace(/\D/g, '').slice(0, 10);
    },
    maxLength: 10,
    placeholder: '123',
    inputMode: 'numeric' as const,
  },
} as const;

export type MaskType = keyof typeof maskPatterns;
