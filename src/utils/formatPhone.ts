export function formatPhone(value?: string | null): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');
  const localDigits = digits.length > 11 && digits.startsWith('55') ? digits.slice(2) : digits;

  if (localDigits.length <= 2) return localDigits;
  if (localDigits.length <= 6) return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  if (localDigits.length <= 10) {
    return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }
  return `(${localDigits.slice(0, 2)}) ${localDigits.slice(2, 7)}-${localDigits.slice(7, 11)}`;
}
