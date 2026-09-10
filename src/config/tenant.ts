const DEFAULT_TENANT_SLUG = 'admin-panificadora';
const LOCAL_TENANT_ALIASES: Record<string, string> = {
  'admin1-panificadora1': 'admin-panificadora',
};

export function resolveLocalTenantSlug(hostname: string): string | null {
  if (!hostname.endsWith('.localhost')) {
    return null;
  }

  const localSlug = hostname.split('.')[0];
  return LOCAL_TENANT_ALIASES[localSlug] || localSlug;
}

export function resolveTenantSlug(): string {
  const hostname = window.location.hostname;
  const configuredFallback = import.meta.env.VITE_BAKERY_TENANT_SLUG || DEFAULT_TENANT_SLUG;

  // Desenvolvimento local:
  // admin-panificadora.localhost
  const localTenantSlug = resolveLocalTenantSlug(hostname);
  if (localTenantSlug) {
    return localTenantSlug;
  }

  const rootDomain = import.meta.env.VITE_BAKERY_ROOT_DOMAIN;

  // Produção:
  // admin2-panificadora2.seudominio.com
  if (rootDomain && hostname.endsWith(`.${rootDomain}`)) {
    const subdomain = hostname.slice(0, -(rootDomain.length + 1));

    if (subdomain && !subdomain.includes('.')) {
      return subdomain;
    }
  }

  // Preview da Vercel ou acesso direto sem subdomínio.
  return configuredFallback;
}
