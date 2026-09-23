export const formatZipCode = (value?: string | null) => {
  const digits = (value || '').replace(/\D/g, '');
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : value || '';
};
