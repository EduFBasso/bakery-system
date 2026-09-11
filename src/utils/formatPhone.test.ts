import { describe, expect, it } from 'vitest';
import { formatPhone } from './formatPhone';

describe('formatPhone', () => {
  it('formats Brazilian landline and mobile numbers', () => {
    expect(formatPhone('1933334444')).toBe('(19) 3333-4444');
    expect(formatPhone('19999998888')).toBe('(19) 99999-8888');
  });

  it('preserves invalid values and handles empty values', () => {
    expect(formatPhone('123')).toBe('123');
    expect(formatPhone()).toBe('Não informado');
    expect(formatPhone(null)).toBe('Não informado');
  });
});
