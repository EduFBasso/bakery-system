import { describe, expect, it } from 'vitest';
import { normalizeCustomerStatus } from './normalizeCustomerStatus';

describe('normalizeCustomerStatus', () => {
  it('translates backend status values to Bakery labels', () => {
    expect(normalizeCustomerStatus('PENDING')).toBe('PENDENTE');
    expect(normalizeCustomerStatus('APPROVED')).toBe('APROVADO');
    expect(normalizeCustomerStatus('BLOCKED')).toBe('BLOQUEADO');
  });

  it('normalizes case and whitespace', () => {
    expect(normalizeCustomerStatus(' approved ')).toBe('APROVADO');
  });

  it('uses pending as the fallback for empty values', () => {
    expect(normalizeCustomerStatus()).toBe('PENDENTE');
    expect(normalizeCustomerStatus(null)).toBe('PENDENTE');
  });

  it('preserves unknown nonempty statuses in uppercase', () => {
    expect(normalizeCustomerStatus('archived')).toBe('ARCHIVED');
  });
});
