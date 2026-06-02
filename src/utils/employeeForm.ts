import type { PayrollEmployeeBody, PayrollEmployeeRow } from '../services/payrollApi.ts';
import { attendanceForApi, createEmptyAttendanceMap } from './attendance.ts';

export type EmployeeFormValues = {
  fullName: string;
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
};

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;

export const EMPTY_EMPLOYEE_FORM: EmployeeFormValues = {
  fullName: '',
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
};

export function employeeRowToForm(row: PayrollEmployeeRow, defaultProject: string): EmployeeFormValues {
  return {
    fullName: row.name,
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
): PayrollEmployeeBody {
  const wage = Math.round(Number(values.wage) || 0);
  const monthly_salary = Math.round(Number(values.monthlySalary) || 0);
  const food = Math.round(Number(values.foodDeduction) || 0);
  const advance = Math.round(Number(values.advanceAmount) || 0);
  const otRate = Math.round(Number(values.otRate) || 0);

  return {
    serial_no: row.serial_no,
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
  };
}

export function createEmptyAttendance(daysInMonth: number) {
  return createEmptyAttendanceMap(daysInMonth);
}
