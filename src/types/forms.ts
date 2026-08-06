/**
 * Tipos para formulários
 */

export type CustomerType = 'PF' | 'PJ';

export interface RegistrationFormData {
  name: string;
  nickname: string;
  customer_type: CustomerType;
  cpf?: string; // Para PF
  cnpj?: string; // Para PJ
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement?: string; // Opcional: apto, sala, etc
  company_name?: string; // Para PJ
}

export interface FormErrors {
  name?: string;
  nickname?: string;
  customer_type?: string;
  cpf?: string;
  cnpj?: string;
  phone?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  complement?: string;
  company_name?: string;
}

export interface RegistrationResponse {
  id: number;
  nickname: string;
  phone?: string;
  status: 'PENDENTE' | 'APROVADO' | 'BLOQUEADO';
  access_token?: string;
  refresh_token?: string;
}

export interface ApiErrorResponse {
  detail?: string;
  [key: string]: any;
}
