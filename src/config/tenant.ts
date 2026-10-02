const DEFAULT_TENANT_SLUG = 'admin-panificadora';
const LOCAL_TENANT_ALIASES: Record<string, string> = {
  'admin1-panificadora1': 'admin-panificadora',
};

type TenantConfig = {
  tenantSlug?: string;
  publicHost?: string;
  rootDomain?: string;
};

export function resolveLocalTenantSlug(hostname: string): string | null {
  if (!hostname.endsWith('.localhost')) {
    return null;
  }

  const localSlug = hostname.split('.')[0];
  return LOCAL_TENANT_ALIASES[localSlug] || localSlug;
}

export function resolveTenantSlugForHostname(
  hostname: string,
  config: TenantConfig = {},
): string {
  const configuredFallback = config.tenantSlug || DEFAULT_TENANT_SLUG;

  // Desenvolvimento local:
  // admin-panificadora.localhost
  const localTenantSlug = resolveLocalTenantSlug(hostname);
  if (localTenantSlug) {
    return localTenantSlug;
  }

  if (config.publicHost && hostname === config.publicHost) {
    return configuredFallback;
  }

  // Produção:
  // admin2-panificadora2.seudominio.com
  if (config.rootDomain && hostname.endsWith(`.${config.rootDomain}`)) {
    const subdomain = hostname.slice(0, -(config.rootDomain.length + 1));

    if (subdomain && !subdomain.includes('.')) {
      return subdomain;
    }
  }

  // Preview da Vercel ou acesso direto sem subdomínio.
  return configuredFallback;
}

export function resolveTenantSlug(): string {
  return resolveTenantSlugForHostname(window.location.hostname, {
    tenantSlug: import.meta.env.VITE_BAKERY_TENANT_SLUG,
    publicHost: import.meta.env.VITE_BAKERY_PUBLIC_HOST,
    rootDomain: import.meta.env.VITE_BAKERY_ROOT_DOMAIN,
  });
}
