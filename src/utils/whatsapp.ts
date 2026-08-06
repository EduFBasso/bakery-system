export function normalizeWhatsAppPhone(phone?: string | null) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function buildWhatsAppUrl(phone?: string | null, message?: string | null) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone || !message) {
    return '';
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

export function openWhatsAppMessage(phone?: string | null, message?: string | null) {
  if (typeof window === 'undefined') {
    return false;
  }

  const url = buildWhatsAppUrl(phone, message);
  if (!url) {
    return false;
  }

  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) {
    window.location.href = url;
  }

  return true;
}

export function buildRegistrationWhatsAppMessage(nickname: string) {
  return [
    `Olá, ${nickname}!`,
    'Seu cadastro foi recebido pela panificadora.',
    'Enquanto a aprovação não é concluída, sua conta permanece aguardando liberação.',
  ].join(' ');
}

export function buildAccessWhatsAppMessage(nickname: string, password: string) {
  return [
    `Olá, ${nickname}!`,
    'Seu cadastro foi aprovado.',
    `Sua senha de acesso é: ${password}`,
  ].join(' ');
}
