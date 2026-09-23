export function normalizeCustomerStatus(status?: string | null): string {
  const value = String(status || '')
    .trim()
    .toUpperCase();

  if (value === 'PENDING') {
    return 'PENDENTE';
  }
  if (value === 'APPROVED') {
    return 'APROVADO';
  }
  if (value === 'BLOCKED') {
    return 'BLOQUEADO';
  }

  return value || 'PENDENTE';
}
