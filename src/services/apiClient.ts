import { API_BASE_URL } from '../config/api.ts';

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = RequestInit & {
  token?: string;
  parseJson?: boolean;
};

function buildHeaders(init: RequestInit | undefined, token?: string): Headers {
  const headers = new Headers(init?.headers ?? undefined);
  const hasBody = init?.body != null;
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function formatDetail(detail: unknown): string | undefined {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: unknown }).msg ?? '');
        }
        return '';
      })
      .filter(Boolean);
    return messages.length ? messages.join('; ') : undefined;
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return undefined;
}

async function readErrorMessage(response: Response): Promise<{ message: string; detail: unknown }> {
  const body = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const detail = 'detail' in body ? (body as { detail?: unknown }).detail : body;
    const message =
      formatDetail(detail) ??
      (typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message
        : undefined) ??
      (response.statusText || 'Request failed');
    return { message, detail };
  }
  return {
    message: response.statusText || 'Request failed',
    detail: body,
  };
}

function toNetworkError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof TypeError) {
    return new ApiError(
      'Unable to reach the API. Check your connection or try again after the server wakes up.',
      0,
    );
  }
  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }
  return new ApiError('Request failed', 0);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, parseJson = true, ...init } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: buildHeaders(init, token),
    });
  } catch (error) {
    throw toNetworkError(error);
  }

  if (!response.ok) {
    const { message, detail } = await readErrorMessage(response);
    throw new ApiError(message, response.status, detail);
  }

  if (response.status === 204 || !parseJson) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return (await response.text()) as T;
  }

  return response.json() as Promise<T>;
}

export async function downloadAuthenticatedBlob(path: string, token: string): Promise<Blob> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: buildHeaders(undefined, token),
    });
  } catch (error) {
    throw toNetworkError(error);
  }

  if (!response.ok) {
    const { message, detail } = await readErrorMessage(response);
    throw new ApiError(message, response.status, detail);
  }

  return response.blob();
}
