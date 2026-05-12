import { downloadAuthenticatedBlob, apiRequest } from './apiClient.ts';

export type ProjectApiRecord = {
  id: number;
  name: string;
  parameters: Record<string, unknown> | null;
};

export function listProjects(token: string) {
  return apiRequest<ProjectApiRecord[]>('/projects', { token });
}

export function createProject(token: string, body: unknown) {
  return apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updateProject(token: string, projectId: number, body: unknown) {
  return apiRequest(`/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deleteProject(token: string, projectId: number) {
  return apiRequest(`/projects/${projectId}`, {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function createProjectData(token: string, body: unknown) {
  return apiRequest('/data', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updateProjectData(token: string, dataId: number, body: unknown) {
  return apiRequest(`/data/${dataId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deleteProjectData(token: string, dataId: number) {
  return apiRequest(`/data/${dataId}`, {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function exportProjectSummaryReport(token: string, projectId: number) {
  return downloadAuthenticatedBlob(`/reports/project/${projectId}/summary`, token);
}
