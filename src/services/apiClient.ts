import axios, { isAxiosError } from 'axios';
import { buildApiUrl } from '../config/api.ts';

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

type RequestOptions = {
  method?: string;
  body?: string;
  token?: string;
  parseJson?: boolean;
  responseType?: 'json' | 'blob' | 'text';
};

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

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const responseData = error.response?.data;
    const detail =
      responseData && typeof responseData === 'object' && 'detail' in responseData
        ? (responseData as { detail?: unknown }).detail
        : responseData;
    const message =
      formatDetail(detail) ??
      (typeof responseData === 'string' ? responseData : undefined) ??
      error.message ??
      'Request failed';
    return new ApiError(message, status, detail);
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }

  return new ApiError('Request failed', 0);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, parseJson = true, responseType = 'json', method = 'GET', body } = options;
  const url = buildApiUrl(path);
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await axios.request<T>({
      url,
      method,
      data: body ? JSON.parse(body) : undefined,
      headers,
      responseType: responseType === 'blob' ? 'blob' : responseType === 'text' ? 'text' : 'json',
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      const detail =
        response.data && typeof response.data === 'object' && 'detail' in response.data
          ? (response.data as { detail?: unknown }).detail
          : response.data;
      const message =
        formatDetail(detail) ??
        (typeof response.data === 'string' ? response.data : undefined) ??
        (response.statusText || 'Request failed');
      throw new ApiError(message, response.status, detail);
    }

    if (response.status === 204 || !parseJson) {
      return undefined as T;
    }

    return response.data as T;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function downloadAuthenticatedBlob(path: string, token: string): Promise<Blob> {
  const url = buildApiUrl(path);

  try {
    const response = await axios.get<Blob>(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
      validateStatus: () => true,
    });

    if (response.status < 200 || response.status >= 300) {
      let detail: unknown = response.data;
      if (response.data instanceof Blob) {
        try {
          detail = JSON.parse(await response.data.text());
        } catch {
          detail = undefined;
        }
      }
      const message = formatDetail(
        detail && typeof detail === 'object' && 'detail' in detail
          ? (detail as { detail?: unknown }).detail
          : detail,
      ) ?? 'Request failed';
      throw new ApiError(message, response.status, detail);
    }

    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}
