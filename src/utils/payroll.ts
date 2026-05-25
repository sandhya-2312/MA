import type { PayrollEmployeeRow } from '../services/payrollApi.ts';

export type AttendanceCode = '' | 'P' | 'A' | 'H' | 'OT';

const CYCLE: AttendanceCode[] = ['', 'P', 'A', 'H', 'OT'];

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

/** `month` is 1–12 (January = 1, December = 12) from the month selector. */
export function toMonthIndex(month: number): number {
  return month - 1;
}

export function daysInMonth(year: number, month: number): number {
  const monthIndex = toMonthIndex(month);
  return new Date(year, monthIndex + 1, 0).getDate();
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

export function normalizeAttendanceCode(raw: string | undefined | null): AttendanceCode {
  const token = String(raw ?? '').trim().toUpperCase();
  if (token === '1') return 'P';
  if (token === 'P' || token === 'A' || token === 'H' || token === 'OT') return token;
  return '';
}

export function nextAttendanceCode(current: string | undefined | null): AttendanceCode {
  const token = normalizeAttendanceCode(current);
  const idx = CYCLE.indexOf(token);
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function dayPoints(code: string | undefined | null): number {
  const token = normalizeAttendanceCode(code);
  if (token === 'P' || token === 'OT') return 1;
  if (token === 'H') return 0.5;
  return 0;
}

export function countTotalDays(attendance: Record<string, string> | null | undefined): number {
  if (!attendance) return 0;
  const sum = Object.values(attendance).reduce((acc, value) => acc + dayPoints(value), 0);
  return Math.round(sum * 10) / 10;
}

export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function calcFinalPayment(row: Pick<PayrollEmployeeRow, 'attendance' | 'wage' | 'ot' | 'advance' | 'food'>): number {
  const totalDays = countTotalDays(row.attendance);
  const base = Math.round(totalDays * (row.wage || 0));
  const ot = parseAmount(row.ot);
  const advance = row.advance || 0;
  const food = row.food || 0;
  return Math.max(0, base + ot - advance - food);
}

export function enrichEmployeeRow(row: PayrollEmployeeRow): PayrollEmployeeRow {
  const total_days = countTotalDays(row.attendance);
  const final_payment = calcFinalPayment(row);
  return { ...row, total_days, final_payment, ot_amount: parseAmount(row.ot) };
}

export function formatInr(amount: number): string {
  return amount.toLocaleString('en-IN');
}

export function attendanceCellClass(code: AttendanceCode, isSunday: boolean): string {
  const base =
    'flex h-7 w-7 cursor-pointer items-center justify-center border border-slate-300 text-[10px] font-bold uppercase transition select-none';
  if (!code) {
    return `${base} ${isSunday ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-sky-50'}`;
  }
  if (code === 'P') return `${base} bg-emerald-100 text-emerald-900 hover:bg-emerald-200`;
  if (code === 'A') return `${base} bg-rose-100 text-rose-800 hover:bg-rose-200`;
  if (code === 'H') return `${base} bg-amber-100 text-amber-900 hover:bg-amber-200`;
  return `${base} bg-violet-100 text-violet-900 hover:bg-violet-200`;
}
