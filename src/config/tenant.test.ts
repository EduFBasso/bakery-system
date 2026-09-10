import { describe, expect, it } from 'vitest';
import { resolveLocalTenantSlug } from './tenant';

describe('resolveLocalTenantSlug', () => {
  it('maps the legacy first bakery hostname to the configured tenant slug', () => {
    expect(resolveLocalTenantSlug('admin1-panificadora1.localhost')).toBe('admin-panificadora');
  });

  it('keeps registered local tenant slugs unchanged', () => {
    expect(resolveLocalTenantSlug('admin2-panificadora2.localhost')).toBe('admin2-panificadora2');
  });

  it('does not resolve non-local hostnames', () => {
    expect(resolveLocalTenantSlug('admin-panificadora.example.com')).toBeNull();
  });
});
