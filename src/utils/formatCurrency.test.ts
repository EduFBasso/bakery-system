import { describe, expect, it } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats numeric and string values in Brazilian currency format', () => {
    expect(formatCurrency(1500)).toBe('R$ 1500,00');
    expect(formatCurrency(1500.5)).toBe('R$ 1500,50');
    expect(formatCurrency('99.9')).toBe('R$ 99,90');
  });

  it('uses zero for empty or invalid values', () => {
    expect(formatCurrency()).toBe('R$ 0,00');
    expect(formatCurrency(null)).toBe('R$ 0,00');
    expect(formatCurrency('invalid')).toBe('R$ 0,00');
  });
});
