import { describe, expect, it } from 'vitest';
import { resolveLocalTenantSlug, resolveTenantSlugForHostname } from './tenant';

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

describe('resolveTenantSlugForHostname', () => {
  it('uses the configured tenant for the fixed public host', () => {
    expect(
      resolveTenantSlugForHostname('panificadora-admin.ebsis.com.br', {
        tenantSlug: 'admin-panificadora',
        publicHost: 'panificadora-admin.ebsis.com.br',
        rootDomain: 'ebsis.com.br',
      }),
    ).toBe('admin-panificadora');
  });

  it('resolves a subdomain when wildcard tenant hosting is configured', () => {
    expect(
      resolveTenantSlugForHostname('other.panificadora.ebsis.com.br', {
        tenantSlug: 'admin-panificadora',
        rootDomain: 'panificadora.ebsis.com.br',
      }),
    ).toBe('other');
  });
});
