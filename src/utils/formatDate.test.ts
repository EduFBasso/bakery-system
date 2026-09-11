import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats valid dates in Brazilian date format', () => {
    expect(formatDate('2026-09-11T12:00:00Z')).toBe('11/09/2026');
  });

  it('uses a fallback for empty and invalid values', () => {
    expect(formatDate()).toBe('Não informado');
    expect(formatDate(null)).toBe('Não informado');
    expect(formatDate('invalid')).toBe('Não informado');
  });
});
