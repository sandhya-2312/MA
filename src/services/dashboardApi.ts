import { API_ENDPOINTS } from '../config/endpoints.ts';
import { apiRequest } from './apiClient.ts';

export type DashboardPointApi = {
  id: number;
  timestamp: string;
  value: number;
  meta?: Record<string, unknown> | null;
};

export type BulkDashboardDataResponse = {
  items: Array<{ project_id: number; points: DashboardPointApi[] }>;
};

export type AdminProjectsStatsResponse = {
  total_projects: number;
  total_entries: number;
  active_members: number;
};

export type AdminProjectsPageResponse = {
  items: Array<{
    id: number;
    name: string;
    parameters: Record<string, unknown> | null;
  }>;
  total: number;
  page: number;
  per_page: number;
  search: string | null;
};

export type AdminProjectDetailResponse = {
  id: number;
  name: string;
  parameters: Record<string, unknown> | null;
  total_entries: number;
  assigned_users: Array<{ id: number; username: string; role: string }>;
  points: DashboardPointApi[];
};

export function getAdminProjectsStats(token: string) {
  return apiRequest<AdminProjectsStatsResponse>(API_ENDPOINTS.adminProjectsStats, { token });
}

export function getAdminProjectsPage(
  token: string,
  page: number,
  perPage: number,
  search: string,
) {
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
    search,
  });
  return apiRequest<AdminProjectsPageResponse>(`${API_ENDPOINTS.adminProjects}?${query.toString()}`, { token });
}

export function getAdminProjectDetail(token: string, projectId: number) {
  return apiRequest<AdminProjectDetailResponse>(API_ENDPOINTS.adminProject(projectId), { token });
}

export function getBulkDashboardData(token: string, projectIds: number[]) {
  const query = new URLSearchParams({
    project_ids: projectIds.join(','),
  });
  return apiRequest<BulkDashboardDataResponse>(`${API_ENDPOINTS.dashboardDataBulk}?${query.toString()}`, { token });
}

export function getDashboardData(token: string, projectId: number, fromDate?: string, toDate?: string) {
  const query = new URLSearchParams({ project_id: String(projectId) });
  if (fromDate) query.set('from_date', fromDate);
  if (toDate) query.set('to_date', toDate);
  return apiRequest<{
    project_id: number;
    project_name: string;
    points: DashboardPointApi[];
  }>(`${API_ENDPOINTS.dashboardData}?${query.toString()}`, { token });
}

export function getHealth() {
  return apiRequest<{ status: string; database?: string; data?: Record<string, number> }>(API_ENDPOINTS.health);
}
