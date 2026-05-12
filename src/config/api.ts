const DEFAULT_DEV_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_PROD_API_URL = 'https://ma-api-2.onrender.com';

const API = import.meta.env.VITE_API_URL;

function normalizeApiUrl(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;

  let url = value.trim();
  if (!url) return undefined;

  url = url.replace(/^VITE_API_URL\s*=\s*/i, '').trim();
  if (url.startsWith('/')) {
    url = url.slice(1);
  }
  url = url.replace(/^(https?):\/([^/])/i, '$1://$2');
  url = url.replace(/\/+$/, '');

  return url || undefined;
}

export function getResolvedApiUrl(): string {
  const configured =
    normalizeApiUrl(API) ??
    normalizeApiUrl(import.meta.env.VITE_API_BASE_URL) ??
    (import.meta.env.PROD ? DEFAULT_PROD_API_URL : DEFAULT_DEV_API_URL);

  if (!/^https?:\/\//i.test(configured)) {
    throw new Error('VITE_API_URL must be an absolute http(s) URL.');
  }

  return configured;
}

export function buildApiUrl(path: string): string {
  const base = getResolvedApiUrl();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

export { API };
