import { Customer, LoginResponse, Address, PendingCustomer } from '../types';

const API_BASE_URL = '/api/v1/bakery';
const BAKERY_AUTH_LOGIN_URL = '/api/v1/auth/bakery/login/';

export class ApiService {
  // ============ AUTENTICAÇÃO ============

  static async registerCustomer(data: {
    nickname: string;
    customer_type: 'PJ' | 'PF';
    cpf?: string;
    cnpj?: string;
    phone: string;
    zip_code: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    company_name?: string;
    tenant_slug?: string;
  }): Promise<{ id: number; access_token: string; refresh_token: string; customer: Customer }> {
    const adminToken = localStorage.getItem('bread_admin_token');
    const tenantSlug =
      data.tenant_slug || import.meta.env.VITE_BAKERY_TENANT_SLUG || 'admin-panificadora';
    const response = await fetch(`${API_BASE_URL}/customers/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({
        ...data,
        tenant_slug: tenantSlug,
      }),
    });

    const bodyText = await response.text();
    let parsedBody: any = null;
    try {
      parsedBody = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      const apiMessage =
        parsedBody?.detail ||
        (Array.isArray(parsedBody?.non_field_errors) ? parsedBody.non_field_errors[0] : null) ||
        'Erro ao registrar cliente';
      throw new Error(String(apiMessage));
    }

    if (!parsedBody || typeof parsedBody !== 'object') {
      throw new Error('Resposta inválida do servidor no cadastro.');
    }

    return parsedBody;
  }

  static async loginCustomer(nickname: string, password: string): Promise<LoginResponse> {
    const tenantSlug = import.meta.env.VITE_BAKERY_TENANT_SLUG || 'admin-panificadora';
    const response = await fetch(BAKERY_AUTH_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: nickname, password, tenant_slug: tenantSlug }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao fazer login');
    }

    return response.json();
  }

  static async getCurrentCustomer(token: string): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do cliente autenticado');
    }

    const payload = await response.json();
    if (Array.isArray(payload)) {
      return payload[0] as Customer;
    }
    if (Array.isArray(payload?.results)) {
      return (payload.results[0] as Customer) || ({} as Customer);
    }
    return payload;
  }

  // ============ ENDEREÇO (VIACEP) ============

  static async lookupCEP(zipCode: string): Promise<Address> {
    const response = await fetch(`${API_BASE_URL}/customers/lookup-cep/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip_code: zipCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'CEP não encontrado');
    }

    return response.json();
  }

  // ============ ADMIN - APROVAÇÃO ============

  static async getPendingCustomers(token: string): Promise<PendingCustomer[]> {
    const response = await fetch(`${API_BASE_URL}/customers/?status=PENDING`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar clientes pendentes');
    }

    const data = await response.json();
    return data.results || data;
  }

  static async approveCustomer(customerId: number, token: string): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/approve/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao aprovar cliente');
    }

    return response.json();
  }

  static async blockCustomer(customerId: number, token: string): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/block/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao bloquear cliente');
    }

    return response.json();
  }

  // ============ DADOS DO CLIENTE ============

  static async getCustomer(customerId: number, token: string): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar dados do cliente');
    }

    return response.json();
  }

  static async getCustomerBalance(customerId: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/balance/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar saldo');
    }

    return response.json();
  }

  static async getCustomerTransactions(customerId: number, token: string) {
    const response = await fetch(`${API_BASE_URL}/customers/${customerId}/transactions/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar transações');
    }

    return response.json();
  }

  // ============ PRODUTOS ============

  static async getPublicProducts() {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }

    return response.json();
  }

  // ============ PEDIDOS ============

  static async createOrder(
    customerId: number,
    token: string,
    data: {
      delivery_date: string;
      payment_method: string;
      items: Array<{ product: number; quantity: number; unit_price: number }>;
    }
  ) {
    const response = await fetch(`${API_BASE_URL}/orders/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_id: customerId,
        ...data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erro ao criar pedido');
    }

    return response.json();
  }
}
