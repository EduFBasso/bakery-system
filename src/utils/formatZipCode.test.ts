import { describe, expect, it } from 'vitest';
import { formatZipCode } from './formatZipCode';

describe('formatZipCode', () => {
  it('aplica a máscara de CEP a oito dígitos', () => {
    expect(formatZipCode('13486465')).toBe('13486-465');
  });

  it('preserva valor incompleto sem criar uma máscara parcial', () => {
    expect(formatZipCode('1348')).toBe('1348');
  });
});
