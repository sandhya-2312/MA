import type { Role } from '../types.ts';
import { apiRequest } from './apiClient.ts';

export type LoginResponse = {
  access_token: string;
  role: Role;
  first_login: boolean;
};

export function login(username: string, password: string) {
  return apiRequest<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
