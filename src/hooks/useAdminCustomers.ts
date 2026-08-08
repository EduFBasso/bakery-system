import { useState, useCallback, useRef, useEffect } from 'react';

interface Customer {
  id: number;
  nickname: string;
  customer_type: string;
  phone: string;
  status: string;
  company_name?: string;
  zip_code?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  credit_limit?: string;
  created_at?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  cpf?: string;
  cnpj?: string;
  cnpj_cpf?: string;
  current_balance?: string;
  available_credit?: string;
  financial_limit?: string;
  financial_used?: string;
  financial_available?: string;
}

interface AdminStats {
  total_customers: number;
  pending_customers: number;
  approved_customers: number;
  used_balance?: string;
  balance_receivable: string;
  currency: string;
}

interface UseAdminCustomersOptions {
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

const CUSTOMERS_ENDPOINT = '/api/v1/bakery/customers/';
const STATUS_PENDING = 'PENDENTE';
const STATUS_APPROVED = 'APROVADO';
const STATUS_BLOCKED = 'BLOQUEADO';

const normalizeStatus = (value?: string) => {
  const status = (value || '').trim().toUpperCase();
  if (status === 'PENDING' || status === STATUS_PENDING) return STATUS_PENDING;
  if (status === 'APPROVED' || status === STATUS_APPROVED) return STATUS_APPROVED;
  if (status === 'BLOCKED' || status === STATUS_BLOCKED) return STATUS_BLOCKED;
  return status;
};

const isPending = (value?: string) => normalizeStatus(value) === STATUS_PENDING;
const isApproved = (value?: string) => normalizeStatus(value) === STATUS_APPROVED;

export function useAdminCustomers(options?: UseAdminCustomersOptions) {
  const [pendingCustomers, setPendingCustomers] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('bread_admin_token');
    if (!token) throw new Error('Token de admin não encontrado');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  };

  const parseRows = (payload: unknown): Customer[] => {
    if (Array.isArray(payload)) {
      return payload.map((row) => ({
        ...(row as Customer),
        status: normalizeStatus((row as Customer).status),
      }));
    }
    if (
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { results?: unknown }).results)
    ) {
      return (payload as { results: Customer[] }).results.map((row) => ({
        ...row,
        status: normalizeStatus(row.status),
      }));
    }
    return [];
  };

  const fetchAdminStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(CUSTOMERS_ENDPOINT, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar estatísticas: ${response.status}`);
      }

      const rows = parseRows(await response.json());
      const pendingCount = rows.filter((row) => isPending(row.status)).length;
      const approvedCount = rows.filter((row) => isApproved(row.status)).length;
      const computedStats: AdminStats = {
        // Regra de negocio atual: total = pendentes + aprovados.
        total_customers: pendingCount + approvedCount,
        pending_customers: pendingCount,
        approved_customers: approvedCount,
        balance_receivable: rows
          .reduce((acc, row) => acc + Number.parseFloat(row.current_balance || '0'), 0)
          .toFixed(2),
        currency: 'BRL',
      };

      setStats(computedStats);
      return computedStats;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPendingCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CUSTOMERS_ENDPOINT}?status=${STATUS_PENDING}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('fetchPendingCustomers error:', text);
        throw new Error(`Erro ao carregar clientes: ${response.status}`);
      }

      const pending = parseRows(await response.json()).filter((row) => isPending(row.status));
      setPendingCustomers(pending);
      return pending;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllCustomers = useCallback(async (filters?: { status?: string; search?: string }) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);

      const url = `${CUSTOMERS_ENDPOINT}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar clientes: ${response.status}`);
      }

      const customers = parseRows(await response.json());
      setAllCustomers(customers);
      return customers;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomerDetail = useCallback(async (customerId: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CUSTOMERS_ENDPOINT}${customerId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar detalhe do cliente: ${response.status}`);
      }

      const customer: Customer = await response.json();
      setCustomerDetail(customer);
      return customer;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar detalhe';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveCustomer = useCallback(async (customerId: number, nickname: string) => {
    setError(null);
    try {
      const response = await fetch(`${CUSTOMERS_ENDPOINT}${customerId}/approve/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Erro ao aprovar cliente: ${response.status}`);
      }

      const result = await response.json();
      setPendingCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setAllCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status: STATUS_APPROVED } : c))
      );
      optionsRef.current?.onSuccess?.(`Cliente "${nickname}" aprovado com sucesso!`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao aprovar cliente';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return null;
    }
  }, []);

  const blockCustomer = useCallback(async (customerId: number, nickname: string) => {
    setError(null);
    try {
      const response = await fetch(`${CUSTOMERS_ENDPOINT}${customerId}/block/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Erro ao bloquear cliente: ${response.status}`);
      }

      const result = await response.json();
      setAllCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, status: STATUS_BLOCKED } : c))
      );
      optionsRef.current?.onSuccess?.(`Cliente "${nickname}" bloqueado com sucesso!`);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao bloquear cliente';
      setError(msg);
      optionsRef.current?.onError?.(msg);
      return null;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    pendingCustomers,
    allCustomers,
    customerDetail,
    stats,
    loading,
    error,
    fetchAdminStats,
    fetchPendingCustomers,
    fetchAllCustomers,
    fetchCustomerDetail,
    approveCustomer,
    blockCustomer,
    clearError,
  };
}
