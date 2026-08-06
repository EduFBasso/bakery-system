// Tipos de Status do Cliente
export type ApprovalStatus = 'PENDENTE' | 'APROVADO' | 'BLOQUEADO';
export type CustomerType = 'PF' | 'PJ';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: number;
  nickname: string;
  customer_type: CustomerType;

  // CPF ou CNPJ
  cpf?: string; // Para PF (11 dígitos)
  cnpj?: string; // Para PJ (14 dígitos)

  // Contato e Endereço
  phone: string;
  zip_code: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  company_name?: string; // Para PJ

  // Crédito e Saldo
  credit_limit: number;
  balance?: number; // Saldo atual

  // Status de Aprovação
  status?: ApprovalStatus; // PENDENTE, APROVADO, BLOQUEADO
  approved_at?: string;
  is_approved?: boolean;

  // Autenticação
  token?: string;
  access_token?: string;
  refresh_token?: string;

  // Meta
  created_at?: string;
}

// Dados de endereço para auto-preenchimento via ViaCEP
export interface Address {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: number;
  customer: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  delivery_date: string;
  payment_method: string;
  total_value: number;
  items: OrderItem[];
  created_at: string;
}

export interface OrderItem {
  id: number;
  product: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: number;
  customer: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  created_at: string;
}

// Respostas de API
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  customer: Customer;
}

export interface ViaCEPResponse {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface PendingCustomer {
  id: number;
  nickname: string;
  customer_type: CustomerType;
  phone: string;
  status: ApprovalStatus;
  created_at: string;
}

// Telegram Types
export type { TelegramNotification, TelegramCallbackData } from './telegram';
