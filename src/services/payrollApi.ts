import { API_ENDPOINTS } from '../config/endpoints.ts';
import { apiRequest, downloadAuthenticatedBlob } from './apiClient.ts';

export type PayrollEmployeeRow = {
  id: number;
  module_id: number;
  serial_no: number;
  name: string;
  designation: string | null;
  attendance: Record<string, string> | null;
  ot: string | null;
  ot_amount?: number;
  advance: number;
  wage: number;
  food: number | null;
  remarks: string | null;
  total_days: number;
  final_payment: number;
};

export type PayrollModuleSummary = {
  id: number;
  title: string;
  month: number;
  year: number;
  location: string | null;
  company_name: string | null;
  employee_count: number;
  total_final_payment: number;
};

export type PayrollModuleDetail = PayrollModuleSummary & {
  weekday_labels: string[];
  days_in_month: number;
  employees: PayrollEmployeeRow[];
};

export type PayrollModuleCreateBody = {
  month: number;
  year: number;
  location?: string;
  company_name?: string;
  copy_from_module_id?: number | null;
};

export type PayrollEmployeeBody = {
  serial_no: number;
  name: string;
  designation?: string | null;
  attendance?: Record<string, string> | null;
  ot?: string | null;
  advance?: number;
  wage?: number;
  food?: number | null;
  remarks?: string | null;
};

export function listPayrollLocations(token: string) {
  return apiRequest<{ locations: string[] }>(API_ENDPOINTS.payrollLocations, { token });
}

export function listPayrollModules(
  token: string,
  params?: { month?: number; year?: number; location?: string },
) {
  const search = new URLSearchParams();
  if (params?.month) search.set('month', String(params.month));
  if (params?.year) search.set('year', String(params.year));
  if (params?.location) search.set('location', params.location);
  const qs = search.toString();
  const path = qs ? `${API_ENDPOINTS.payrollModules}?${qs}` : API_ENDPOINTS.payrollModules;
  return apiRequest<PayrollModuleSummary[]>(path, { token });
}

export function resolvePayrollModule(
  token: string,
  params: { month: number; year: number; location?: string },
) {
  const search = new URLSearchParams({
    month: String(params.month),
    year: String(params.year),
  });
  if (params.location) search.set('location', params.location);
  return apiRequest<PayrollModuleDetail | null>(
    `${API_ENDPOINTS.payrollModuleResolve}?${search.toString()}`,
    { token },
  );
}

export function getPayrollModule(token: string, moduleId: number) {
  return apiRequest<PayrollModuleDetail>(API_ENDPOINTS.payrollModule(moduleId), { token });
}

export function createPayrollModule(token: string, body: PayrollModuleCreateBody) {
  return apiRequest<PayrollModuleDetail>(API_ENDPOINTS.payrollModules, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export async function exportPayrollModule(token: string, moduleId: number, filename: string) {
  const blob = await downloadAuthenticatedBlob(API_ENDPOINTS.payrollModuleExport(moduleId), token);
  return { blob, filename };
}

export function deletePayrollModule(token: string, moduleId: number) {
  return apiRequest(API_ENDPOINTS.payrollModule(moduleId), {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}

export function addPayrollEmployee(token: string, moduleId: number, body: PayrollEmployeeBody) {
  return apiRequest<PayrollEmployeeRow>(API_ENDPOINTS.payrollModuleEmployees(moduleId), {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function updatePayrollEmployee(token: string, employeeId: number, body: PayrollEmployeeBody) {
  return apiRequest<PayrollEmployeeRow>(API_ENDPOINTS.payrollEmployee(employeeId), {
    method: 'PUT',
    body: JSON.stringify(body),
    token,
  });
}

export function deletePayrollEmployee(token: string, employeeId: number) {
  return apiRequest(API_ENDPOINTS.payrollEmployee(employeeId), {
    method: 'DELETE',
    token,
    parseJson: false,
  });
}
