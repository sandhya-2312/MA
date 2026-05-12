const DEFAULT_DEV_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_PROD_API_URL = 'https://ma-api-2.onrender.com';

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function readConfiguredApiUrl(): string | undefined {
  const configured =
    import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL;
  if (typeof configured !== 'string') return undefined;
  const trimmed = configured.trim();
  return trimmed ? normalizeBaseUrl(trimmed) : undefined;
}

export function getApiBaseUrl(): string {
  return readConfiguredApiUrl() ?? (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);
}

export const API_BASE_URL = getApiBaseUrl();
