export function formatDate(value?: string | null): string {
  if (!value) return 'Não informado';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleDateString('pt-BR');
}
