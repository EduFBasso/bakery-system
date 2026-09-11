export function formatCurrency(value?: string | number | null): string {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(value || '0');
  const safe = Number.isFinite(numeric) ? numeric : 0;
  return `R$ ${safe.toFixed(2).replace('.', ',')}`;
}
