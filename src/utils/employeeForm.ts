import type { PayrollEmployeeBody, PayrollEmployeeRow } from '../services/payrollApi.ts';
import { attendanceForApi, createEmptyAttendanceMap } from './attendance.ts';
import { derivePayRatesFromMonthlySalary } from './payroll.ts';

export type EmployeeFormValues = {
  fullName: string;
  empId: string;
  contactNumber: string;
  email: string;
  address: string;
  designation: string;
  project: string;
  joiningDate: string;
  wage: string;
  monthlySalary: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  foodDeduction: string;
  advanceAmount: string;
  otRate: string;
  remarks: string;
  aadharNumber: string;
  panNumber: string;
};

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const AADHAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const EMP_ID_RE = /^\d{5}$/;

export function formatEmpId(prefix: number, year: number): string {
  return `${String(prefix).padStart(3, '0')}${String(year % 100).padStart(2, '0')}`;
}

export function empIdYearFromJoiningDate(joiningDate: string, fallbackYear: number): number {
  if (joiningDate && joiningDate.length >= 4) {
    const year = Number(joiningDate.slice(0, 4));
    if (Number.isFinite(year) && year >= 2000 && year <= 2100) return year;
  }
  return fallbackYear;
}

export function suggestNextEmpId(existingEmpIds: (string | null | undefined)[], year: number): string {
  const yearSuffix = String(year % 100).padStart(2, '0');
  let maxPrefix = 0;
  for (const id of existingEmpIds) {
    if (id?.length === 5 && id.endsWith(yearSuffix)) {
      const prefix = Number(id.slice(0, 3));
      if (Number.isFinite(prefix)) maxPrefix = Math.max(maxPrefix, prefix);
    }
  }
  return formatEmpId(maxPrefix + 1, year);
}

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  fullName: '',
  empId: '',
  contactNumber: '',
  email: '',
  address: '',
  designation: '',
  project: '',
  joiningDate: '',
  wage: '',
  monthlySalary: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  foodDeduction: '0',
  advanceAmount: '0',
  otRate: '0',
  remarks: '',
  aadharNumber: '',
  panNumber: '',
};

export function employeeRowToForm(row: PayrollEmployeeRow, defaultProject: string): EmployeeFormValues {
  return {
    fullName: row.name,
    empId: row.emp_id ?? '',
    contactNumber: row.contact_number ?? '',
    email: row.email ?? '',
    address: row.address ?? '',
    designation: row.designation ?? '',
    project: row.project ?? defaultProject,
    joiningDate: row.joining_date ?? '',
    wage: String(row.wage ?? 0),
    monthlySalary: String(row.monthly_salary ?? 0),
    bankName: row.bank_name ?? '',
    accountNumber: row.account_number ?? '',
    ifscCode: row.ifsc_code ?? '',
    upiId: row.upi_id ?? '',
    foodDeduction: row.food != null ? String(row.food) : '0',
    advanceAmount: String(row.advance ?? 0),
    otRate: String(row.ot_rate ?? row.ot ?? 0),
    remarks: row.remarks ?? '',
    aadharNumber: row.aadhar_number ?? '',
    panNumber: row.pan_number ?? '',
  };
}

export function validateEmployeeForm(values: EmployeeFormValues, mode: 'add' | 'edit'): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};
  const name = values.fullName.trim();
  if (!name) errors.fullName = 'Full name is required.';

  const contact = values.contactNumber.replace(/\s/g, '');
  if (!contact) {
    errors.contactNumber = 'Contact number is required.';
  } else if (!MOBILE_RE.test(contact)) {
    errors.contactNumber = 'Enter a valid 10-digit Indian mobile number.';
  }

  const email = values.email.trim();
  if (email && !EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.designation.trim()) {
    errors.designation = 'Designation is required.';
  }

  if (mode === 'add' && !values.project.trim()) {
    errors.project = 'Project is required.';
  }

  const wageRaw = values.wage.trim();
  if (wageRaw && (!/^\d+(\.\d+)?$/.test(wageRaw) || Number(wageRaw) < 0)) {
    errors.wage = 'Daily wage must be a valid number.';
  }

  const monthlyRaw = values.monthlySalary.trim();
  if (monthlyRaw && (!/^\d+(\.\d+)?$/.test(monthlyRaw) || Number(monthlyRaw) < 0)) {
    errors.monthlySalary = 'Monthly salary must be a valid number.';
  }

  const foodRaw = values.foodDeduction.trim();
  if (foodRaw && (!/^\d+(\.\d+)?$/.test(foodRaw) || Number(foodRaw) < 0)) {
    errors.foodDeduction = 'Food deduction must be a valid number.';
  }

  const advanceRaw = values.advanceAmount.trim();
  if (advanceRaw && (!/^\d+(\.\d+)?$/.test(advanceRaw) || Number(advanceRaw) < 0)) {
    errors.advanceAmount = 'Advance must be a valid number.';
  }

  const otRateRaw = values.otRate.trim();
  if (otRateRaw && (!/^\d+(\.\d+)?$/.test(otRateRaw) || Number(otRateRaw) < 0)) {
    errors.otRate = 'OT rate must be a valid number.';
  }

  const aadhar = values.aadharNumber.replace(/\s/g, '');
  if (aadhar && !AADHAR_RE.test(aadhar)) {
    errors.aadharNumber = 'Enter a valid 12-digit Aadhar number.';
  }

  const pan = values.panNumber.trim().toUpperCase();
  if (pan && !PAN_RE.test(pan)) {
    errors.panNumber = 'Enter a valid PAN (e.g. ABCDE1234F).';
  }

  const empId = values.empId.replace(/\s/g, '');
  if (empId && !EMP_ID_RE.test(empId)) {
    errors.empId = 'EMP ID must be 5 digits (3-digit prefix + 2-digit year, e.g. 00126).';
  }

  if (mode === 'add') {
    if (!values.bankName.trim()) errors.bankName = 'Bank name is required.';
    if (!values.accountNumber.trim()) errors.accountNumber = 'Account number is required.';
    if (!values.ifscCode.trim()) errors.ifscCode = 'IFSC code is required.';
  }

  return errors;
}

export function formToEmployeeBody(
  values: EmployeeFormValues,
  row: Pick<PayrollEmployeeRow, 'serial_no' | 'attendance' | 'ot'> | { serial_no: number; attendance: PayrollEmployeeRow['attendance']; ot: string | null },
  daysInMonth = 0,
): PayrollEmployeeBody {
  const monthly_salary = Math.round(Number(values.monthlySalary) || 0);
  let wage = Math.round(Number(values.wage) || 0);
  let otRate = Math.round(Number(values.otRate) || 0);
  if (monthly_salary > 0 && daysInMonth > 0) {
    const derived = derivePayRatesFromMonthlySalary(monthly_salary, daysInMonth);
    wage = derived.wage;
    otRate = derived.otRate;
  }
  const food = Math.round(Number(values.foodDeduction) || 0);
  const advance = Math.round(Number(values.advanceAmount) || 0);

  return {
    serial_no: row.serial_no,
    emp_id: values.empId.replace(/\s/g, '') || null,
    name: values.fullName.trim(),
    designation: values.designation.trim() || null,
    attendance: attendanceForApi(row.attendance ?? {}),
    ot: String(otRate),
    advance,
    wage,
    monthly_salary,
    food: food > 0 ? food : null,
    remarks: values.remarks.trim() || null,
    contact_number: values.contactNumber.replace(/\s/g, '') || null,
    email: values.email.trim() || null,
    address: values.address.trim() || null,
    project: values.project.trim() || null,
    joining_date: values.joiningDate || null,
    bank_name: values.bankName.trim() || null,
    account_number: values.accountNumber.trim() || null,
    ifsc_code: values.ifscCode.trim().toUpperCase() || null,
    upi_id: values.upiId.trim() || null,
    aadhar_number: values.aadharNumber.replace(/\s/g, '') || null,
    pan_number: values.panNumber.trim().toUpperCase() || null,
  };
}

export function createEmptyAttendance(daysInMonth: number) {
  return createEmptyAttendanceMap(daysInMonth);
}
