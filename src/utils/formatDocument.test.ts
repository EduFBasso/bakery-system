import { describe, expect, it } from 'vitest';
import { formatDocument } from './formatDocument';

describe('formatDocument', () => {
  it('formats CPF values for PF customers', () => {
    expect(formatDocument('12345678901', 'PF')).toBe('123.456.789-01');
    expect(formatDocument('123.456.789-01', 'PF')).toBe('123.456.789-01');
  });

  it('formats CNPJ values for non-PF customers', () => {
    expect(formatDocument('12345678000199', 'PJ')).toBe('12.345.678/0001-99');
  });

  it('preserves invalid values and handles empty values', () => {
    expect(formatDocument('123', 'PF')).toBe('123');
    expect(formatDocument('', 'PF')).toBe('Não informado');
    expect(formatDocument(null, 'PJ')).toBe('Não informado');
  });
});
