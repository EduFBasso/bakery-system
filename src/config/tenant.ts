const DEFAULT_TENANT_SLUG = 'admin-panificadora';

export function resolveTenantSlug(): string {
  const hostname = window.location.hostname;
  const configuredFallback = import.meta.env.VITE_BAKERY_TENANT_SLUG || DEFAULT_TENANT_SLUG;

  // Desenvolvimento local:
  // admin-panificadora.localhost
  if (hostname.endsWith('.localhost')) {
    return hostname.split('.')[0];
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
