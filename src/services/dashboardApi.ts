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

export function getAdminProjectsStats(token: string) {
  return apiRequest<AdminProjectsStatsResponse>('/admin/projects/stats', { token });
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
  return apiRequest<AdminProjectsPageResponse>(`/admin/projects?${query.toString()}`, { token });
}

export function getBulkDashboardData(token: string, projectIds: number[]) {
  const query = new URLSearchParams({
    project_ids: projectIds.join(','),
  });
  return apiRequest<BulkDashboardDataResponse>(`/dashboard-data/bulk?${query.toString()}`, { token });
}
