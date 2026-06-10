import type { Role } from '../types.ts';
import { API_ENDPOINTS } from '../config/endpoints.ts';
import { apiRequest } from './apiClient.ts';

export type LoginResponse = {
  access_token: string;
  role: Role;
  first_login: boolean;
};

export type ForgotPasswordResponse = {
  message: string;
  temporary_password?: string | null;
};

export function login(username: string, password: string, rememberMe = false) {
  return apiRequest<LoginResponse>(API_ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify({ username, password, remember_me: rememberMe }),
  });
}

export function forgotPassword(username: string, email: string) {
  return apiRequest<ForgotPasswordResponse>(API_ENDPOINTS.forgotPassword, {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  });
}

export function changePassword(token: string, oldPassword: string, newPassword: string) {
  return apiRequest<{ message: string }>(API_ENDPOINTS.changePassword, {
    method: 'POST',
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    token,
  });
}
