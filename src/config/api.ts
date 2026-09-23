const configuredApiBase = (import.meta.env.VITE_API_BASE as string | undefined)
  ?.trim()
  .replace(/\/+$/, '');

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return configuredApiBase ? `${configuredApiBase}${normalizedPath}` : normalizedPath;
}
