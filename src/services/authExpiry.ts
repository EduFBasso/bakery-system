import { clearAdminSession, clearCustomerSession } from './session';

const EXPIRY_MESSAGE = 'Sua sessão expirou. Faça login novamente para continuar.';
const EXPIRY_MESSAGE_KEY = 'bread_auth_expiry_message';

function clearSessionForToken(token: string) {
  if (token && token === localStorage.getItem('bread_admin_token')) {
    clearAdminSession();
  }
  if (token && token === localStorage.getItem('bread_customer_token')) {
    clearCustomerSession();
  }
}

function isAdminPasswordEndpoint(input: RequestInfo | URL): boolean {
  const url = input instanceof Request ? input.url : String(input);
  return (
    (url.includes('/api/v1/bakery/customers/') &&
      /\/(approve|block|unblock|reject|update-credit-limit|set-password|reveal-password)\/?(?:\?|$)/.test(
        url
      )) ||
    (url.includes('/api/v1/bakery/orders/') && /\/(cancel|status)\/?(?:\?|$)/.test(url))
  );
}

async function isInvalidTokenResponse(response: Response): Promise<boolean> {
  const payload = (await response
    .clone()
    .json()
    .catch(() => null)) as { code?: unknown; detail?: unknown } | null;
  const detail = typeof payload?.detail === 'string' ? payload.detail : '';
  return (
    payload?.code === 'token_not_valid' ||
    /token not valid|token inválido|token expirado/i.test(detail)
  );
}

export function consumeAuthExpiryMessage() {
  const message = sessionStorage.getItem(EXPIRY_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(EXPIRY_MESSAGE_KEY);
  }
  return message;
}

export function clearAuthExpiryMessage() {
  sessionStorage.removeItem(EXPIRY_MESSAGE_KEY);
}

export function installAuthExpiryHandler() {
  const originalFetch = window.fetch.bind(window);
  let redirecting = false;

  window.fetch = async (input, init) => {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined)
    );
    const authorization = headers.get('Authorization');
    const response = await originalFetch(input, init);

    const hasBearerToken = authorization?.startsWith('Bearer ');
    const isProtectedAction = isAdminPasswordEndpoint(input);
    const tokenExpired =
      response.status === 401 && hasBearerToken && (await isInvalidTokenResponse(response));

    if (
      response.status === 401 &&
      authorization &&
      hasBearerToken &&
      (!isProtectedAction || tokenExpired)
    ) {
      const token = authorization.slice('Bearer '.length).trim();
      clearSessionForToken(token);

      if (!redirecting && window.location.pathname !== '/') {
        redirecting = true;
        sessionStorage.setItem(EXPIRY_MESSAGE_KEY, EXPIRY_MESSAGE);
        const currentRoute = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.replace(currentRoute);
      }
    }

    return response;
  };

  return () => {
    window.fetch = originalFetch;
  };
}
