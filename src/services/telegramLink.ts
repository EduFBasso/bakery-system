// Thin client for the global Telegram-link endpoints (apps.notifications, shared with clinic).
// Uses the same admin bearer token as ApiService (bread_admin_token).

export type TelegramLinkStartResult = {
  botConfigured: boolean;
  botUsername: string;
  startToken: string;
  linkUrl: string;
  expiresAt: string;
};

export type TelegramLinkSnapshot = {
  telegramLinked: boolean;
  telegramLinkActive: boolean;
  telegramUsername: string;
  telegramLastError: string;
};

function readAdminToken(): string {
  return localStorage.getItem('bread_admin_token') || '';
}

async function parseJsonSafe(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function startTelegramLink(): Promise<TelegramLinkStartResult> {
  const token = readAdminToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/register/professionals/telegram/link-start/', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : 'Erro ao iniciar vínculo com Telegram.'
    );
  }

  return {
    botConfigured: Boolean(data.bot_configured),
    botUsername: String(data.bot_username || ''),
    startToken: String(data.start_token || ''),
    linkUrl: String(data.link_url || ''),
    expiresAt: String(data.expires_at || ''),
  };
}

export async function verifyTelegramLink(startToken: string): Promise<TelegramLinkSnapshot> {
  const token = readAdminToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/register/professionals/telegram/link-verify/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ start_token: startToken }),
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : 'Erro ao verificar vínculo Telegram.'
    );
  }

  return {
    telegramLinked: Boolean(data.linked ?? true),
    telegramLinkActive: true,
    telegramUsername: String(data.telegram_username || ''),
    telegramLastError: '',
  };
}

export async function sendTelegramTest(): Promise<void> {
  const token = readAdminToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/register/professionals/telegram/test-send/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : 'Erro ao enviar mensagem de teste.'
    );
  }
}

export async function fetchTelegramStatus(): Promise<TelegramLinkSnapshot> {
  const token = readAdminToken();
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const response = await fetch('/register/professionals/settings/', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJsonSafe(response);

  if (!response.ok) {
    throw new Error(
      typeof data.detail === 'string' ? data.detail : 'Erro ao consultar status do Telegram.'
    );
  }

  return {
    telegramLinked: Boolean(data.telegram_linked),
    telegramLinkActive: Boolean(data.telegram_link_active),
    telegramUsername: String(data.telegram_username || ''),
    telegramLastError: String(data.telegram_last_error || ''),
  };
}
