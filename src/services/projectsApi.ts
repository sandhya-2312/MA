import { API_ENDPOINTS } from '../config/endpoints.ts';
import { downloadAuthenticatedBlob, apiRequest } from './apiClient.ts';

export type ProjectApiRecord = {
  id: number;
  name: string;
  parameters: Record<string, unknown> | null;
};

export function listProjects(token: string) {
  return apiRequest<ProjectApiRecord[]>(API_ENDPOINTS.projects, { token });
}

export function createProject(token: string, body: unknown) {
  return apiRequest(API_ENDPOINTS.projects, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updateProject(token: string, projectId: number, body: unknown) {
  return apiRequest(API_ENDPOINTS.project(projectId), {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deleteProject(token: string, projectId: number) {
  return apiRequest(API_ENDPOINTS.project(projectId), {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function createProjectData(token: string, body: unknown) {
  return apiRequest(API_ENDPOINTS.projectData, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updateProjectData(token: string, dataId: number, body: unknown) {
  return apiRequest(API_ENDPOINTS.projectDataById(dataId), {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deleteProjectData(token: string, dataId: number) {
  return apiRequest(API_ENDPOINTS.projectDataById(dataId), {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function exportProjectSummaryReport(token: string, projectId: number) {
  return downloadAuthenticatedBlob(API_ENDPOINTS.projectReport(projectId), token);
}
