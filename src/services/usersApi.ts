import type { Role } from '../types.ts';
import { apiRequest } from './apiClient.ts';

export type ApiUserRow = {
  id: number;
  username: string;
  role: Role;
  first_login: boolean;
  assigned_project_ids?: number[];
  contact_no?: string | null;
  full_name?: string | null;
  email?: string | null;
  designation?: string | null;
};

export function listUsers(token: string) {
  return apiRequest<ApiUserRow[]>('/users', { token });
}

export function getProfile(token: string) {
  return apiRequest<ApiUserRow>('/profile', { token });
}

export function updateProfile(token: string, body: unknown) {
  return apiRequest<ApiUserRow>('/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function createUser(token: string, body: unknown) {
  return apiRequest<{ user: ApiUserRow; temporary_password: string | null }>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updateUser(token: string, memberId: number, body: unknown) {
  return apiRequest<ApiUserRow>(`/users/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deleteUser(token: string, memberId: number) {
  return apiRequest(`/users/${memberId}`, {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function assignUserToProject(token: string, userId: number, projectId: number) {
  return apiRequest('/assign-user', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, project_id: projectId }),
    token,
  });
}
