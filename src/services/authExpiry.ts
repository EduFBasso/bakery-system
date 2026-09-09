const EXPIRY_MESSAGE = 'Sua sessão expirou após 10 horas. Faça login novamente para continuar.';
const EXPIRY_MESSAGE_KEY = 'bread_auth_expiry_message';

function clearAdminSession() {
  localStorage.removeItem('bread_admin_token');
  localStorage.removeItem('bread_admin_refresh');
  localStorage.removeItem('bread_admin_role');
  localStorage.removeItem('bread_admin_user');
}

function clearCustomerSession() {
  localStorage.removeItem('bread_customer_token');
  localStorage.removeItem('bread_customer_refresh');
  localStorage.removeItem('bread_customer_user');
}

function clearSessionForToken(token: string) {
  if (token && token === localStorage.getItem('bread_admin_token')) {
    clearAdminSession();
  }
  if (token && token === localStorage.getItem('bread_customer_token')) {
    clearCustomerSession();
  }
}

export function consumeAuthExpiryMessage() {
  const message = sessionStorage.getItem(EXPIRY_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(EXPIRY_MESSAGE_KEY);
  }
  return message;
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

    if (response.status === 401 && authorization?.startsWith('Bearer ')) {
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
