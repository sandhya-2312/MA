import axios from 'axios';
import type { Role } from '../types.ts';
import { getResolvedApiUrl } from '../config/api.ts';
import { ApiError } from './apiClient.ts';

export type LoginResponse = {
  access_token: string;
  role: Role;
  first_login: boolean;
};

export async function login(username: string, password: string) {
  const API = getResolvedApiUrl();

  try {
    const { data } = await axios.post<LoginResponse>(`${API}/login`, { username, password });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      const message =
        typeof detail === 'string'
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item?.msg ?? String(item)).join('; ')
            : error.message || 'Login failed';
      throw new ApiError(message, error.response?.status ?? 0, detail);
    }
    throw error;
  }
}
