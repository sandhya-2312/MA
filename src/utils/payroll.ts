import type { PayrollEmployeeRow } from '../services/payrollApi.ts';
import {
  type AttendanceMap,
  type AttendanceStatus,
  type DayAttendance,
  attendanceCellClass,
  calcFinalPayment,
  calcOtAmount,
  countTotalDays,
  countTotalOtHours,
  createEmptyAttendanceMap,
  formatDayLabel,
  nextAttendanceStatus,
  parseDayAttendance,
  parseOtRate,
} from './attendance.ts';

export type { AttendanceStatus, DayAttendance, AttendanceMap };
export {
  attendanceCellClass,
  calcFinalPayment,
  calcOtAmount,
  countTotalDays,
  countTotalOtHours,
  createEmptyAttendanceMap,
  formatDayLabel,
  nextAttendanceStatus,
  parseDayAttendance,
  parseOtRate,
};

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const DEFAULT_PROJECTS = ['Maruti -1 Drydock', 'Maruti -2 Drydock', 'Yard Office'];

export const DEFAULT_COMPANIES = ['MC.Engg'];

export function buildPayrollModuleTitle(
  month: number,
  year: number,
  location: string | null | undefined,
  companyName?: string | null,
): string {
  const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);
  const loc = (location ?? '').trim() || DEFAULT_PROJECTS[0];
  const company = (companyName ?? 'MC.Engg').trim() || 'MC.Engg';
  return `${company} Payroll : ${monthLabel} ${year} ( ${loc} )`;
}

export function toMonthIndex(month: number): number {
  return month - 1;
}

export function daysInMonth(year: number, month: number): number {
  const monthIndex = toMonthIndex(month);
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Derive daily wage and OT/hour from fixed monthly salary (8-hour day, pro-rated by calendar days). */
export function derivePayRatesFromMonthlySalary(
  monthlySalary: number,
  daysInMonthCount: number,
): { wage: number; otRate: number } {
  if (monthlySalary <= 0 || daysInMonthCount <= 0) {
    return { wage: 0, otRate: 0 };
  }
  const wage = Math.round(monthlySalary / daysInMonthCount);
  const otRate = Math.round(wage / 8);
  return { wage, otRate };
}

export type MonthDayMeta = {
  day: number;
  weekday: string;
  isSunday: boolean;
};

export function buildMonthCalendar(year: number, month: number): {
  daysInMonth: number;
  days: MonthDayMeta[];
  weekdayLabels: string[];
} {
  const monthIndex = toMonthIndex(month);
  const daysInMonthCount = daysInMonth(year, month);
  const days: MonthDayMeta[] = Array.from({ length: daysInMonthCount }, (_, index) => {
    const day = index + 1;
    const dateObj = new Date(year, monthIndex, day);
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day,
      weekday,
      isSunday: dateObj.getDay() === 0,
    };
  });
  return {
    daysInMonth: daysInMonthCount,
    days,
    weekdayLabels: days.map((d) => d.weekday),
  };
}

export function weekdayLabels(year: number, month: number): string[] {
  return buildMonthCalendar(year, month).weekdayLabels;
}

/** @deprecated Use nextAttendanceStatus */
export function nextAttendanceCode(current: string | undefined | null): AttendanceStatus {
  const day = parseDayAttendance(current);
  return nextAttendanceStatus(day.attendanceStatus);
}

export function parseAmount(value: string | number | null | undefined): number {
  return parseOtRate(value);
}

export function rowOtRate(row: Pick<PayrollEmployeeRow, 'ot_rate' | 'ot'>): number {
  return row.ot_rate ?? parseOtRate(row.ot);
}

export function rowOtAmount(row: Pick<PayrollEmployeeRow, 'attendance' | 'ot_rate' | 'ot' | 'ot_amount'>): number {
  if (row.ot_amount != null) return row.ot_amount;
  const hours = countTotalOtHours(row.attendance as AttendanceMap);
  return calcOtAmount(hours, rowOtRate(row));
}

export type PayrollPaymentInput = Pick<
  PayrollEmployeeRow,
  'attendance' | 'wage' | 'monthly_salary' | 'ot' | 'advance' | 'food'
> & { ot_rate?: number };

export function calcRowFinalPayment(row: PayrollPaymentInput, daysInMonth = 0): number {
  return calcFinalPayment({
    attendance: row.attendance as AttendanceMap,
    wage: row.wage,
    monthly_salary: row.monthly_salary ?? 0,
    days_in_month: daysInMonth,
    ot_rate: rowOtRate(row),
    advance: row.advance,
    food: row.food,
  });
}

export function enrichEmployeeRow(row: PayrollEmployeeRow, daysInMonth = 0): PayrollEmployeeRow {
  const monthly = row.monthly_salary ?? 0;
  let wage = row.wage;
  let ot = row.ot;
  if (monthly > 0 && daysInMonth > 0) {
    const derived = derivePayRatesFromMonthlySalary(monthly, daysInMonth);
    wage = derived.wage;
    ot = String(derived.otRate);
  }
  const enriched = { ...row, wage, ot };
  const attendance = enriched.attendance as AttendanceMap;
  const total_days = countTotalDays(attendance);
  const total_ot_hours = countTotalOtHours(attendance);
  const ot_rate = rowOtRate(enriched);
  const ot_amount = calcOtAmount(total_ot_hours, ot_rate);
  const final_payment = calcRowFinalPayment(enriched, daysInMonth);
  return { ...enriched, total_days, total_ot_hours, ot_rate, ot_amount, final_payment };
}

export function formatInr(amount: number): string {
  return amount.toLocaleString('en-IN');
}
