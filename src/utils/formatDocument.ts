export function formatDocument(value?: string | null, type?: string): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'Não informado';

  if (type === 'PF' && digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (type !== 'PF' && digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return value || 'Não informado';
}
