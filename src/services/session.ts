import { normalizeCustomerStatus } from '../utils/normalizeCustomerStatus';

export const ADMIN_ROLES = ['owner', 'admin'] as const;
export const CUSTOMER_ROLE = 'member';

export const ADMIN_ROLE_MISMATCH_MESSAGE =
  'Esta conta não possui acesso administrativo. Use o login de cliente.';
export const CUSTOMER_ROLE_MISMATCH_MESSAGE =
  'Conta administrativa não pode entrar como cliente. Use o login administrativo.';

const ADMIN_KEYS = [
  'bread_admin_token',
  'bread_admin_refresh',
  'bread_admin_role',
  'bread_admin_user',
] as const;
const CUSTOMER_KEYS = ['bread_customer_token', 'bread_customer_refresh', 'bread_customer_user'] as const;

interface TokenClaims {
  role?: string;
  ecosystem?: string;
}

interface LoginTokens {
  access?: string;
  refresh?: string;
  role?: string;
  tenant?: unknown;
  professional?: Record<string, unknown>;
  customer?: { status?: string } & Record<string, unknown>;
}

export function clearAdminSession() {
  ADMIN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function clearCustomerSession() {
  CUSTOMER_KEYS.forEach((key) => localStorage.removeItem(key));
}

function decodeClaims(token: string): TokenClaims | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)) as TokenClaims;
  } catch {
    return null;
  }
}

export function isAdminRole(role?: string | null): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(String(role));
}

/** Retorna o token administrativo somente se o JWT for de owner/admin do Bakery. */
export function getAdminSessionToken(): string | null {
  const token = localStorage.getItem('bread_admin_token');
  if (!token) return null;

  const claims = decodeClaims(token);
  if (claims?.ecosystem === 'bakery' && isAdminRole(claims.role)) {
    return token;
  }

  clearAdminSession();
  return null;
}

/** Retorna o token de cliente somente se o JWT for de member do Bakery. */
export function getCustomerSessionToken(): string | null {
  const token = localStorage.getItem('bread_customer_token');
  if (!token) return null;

  const claims = decodeClaims(token);
  if (claims?.ecosystem === 'bakery' && claims.role === CUSTOMER_ROLE) {
    return token;
  }

  clearCustomerSession();
  return null;
}

/** Persiste a sessão admin e descarta a de cliente. Retorna a mensagem de erro, se houver. */
export function persistAdminSession(data: LoginTokens): string | null {
  if (!data.access || !data.refresh || !isAdminRole(data.role)) {
    return ADMIN_ROLE_MISMATCH_MESSAGE;
  }

  clearCustomerSession();
  localStorage.setItem('bread_admin_token', data.access);
  localStorage.setItem('bread_admin_refresh', data.refresh);
  localStorage.setItem('bread_admin_role', String(data.role));
  localStorage.setItem(
    'bread_admin_user',
    JSON.stringify({ ...(data.professional || {}), tenant: data.tenant })
  );
  return null;
}

/** Persiste a sessão de cliente e descarta a administrativa. Retorna a mensagem de erro, se houver. */
export function persistCustomerSession(data: LoginTokens): string | null {
  if (data.role !== CUSTOMER_ROLE) {
    return CUSTOMER_ROLE_MISMATCH_MESSAGE;
  }
  if (!data.access || !data.refresh || !data.customer) {
    return 'Cadastro de cliente não encontrado.';
  }
  if (normalizeCustomerStatus(data.customer.status) !== 'APROVADO') {
    return 'Cadastro ainda não aprovado.';
  }

  clearAdminSession();
  localStorage.setItem('bread_customer_token', data.access);
  localStorage.setItem('bread_customer_refresh', data.refresh);
  localStorage.setItem('bread_customer_user', JSON.stringify(data.customer));
  return null;
}
