/** Per-day attendance stored in payroll JSON. */
export type AttendanceStatus = '' | 'P' | 'A' | 'H' | 'P+OT';

export type DayAttendance = {
  attendanceStatus: AttendanceStatus;
  otHours: number;
};

export type AttendanceMap = Record<string, DayAttendance | string>;

const CYCLE: AttendanceStatus[] = ['', 'P', 'A', 'H', 'P+OT'];

export function emptyDay(): DayAttendance {
  return { attendanceStatus: '', otHours: 0 };
}

/** Parse legacy string codes and new object shape. */
export function parseDayAttendance(raw: unknown): DayAttendance {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const statusRaw = String(obj.attendanceStatus ?? obj.status ?? '').trim().toUpperCase();
    let status: AttendanceStatus = '';
    if (statusRaw === 'P+OT' || statusRaw === 'POT' || statusRaw === 'OT') status = 'P+OT';
    else if (statusRaw === 'P' || statusRaw === '1') status = 'P';
    else if (statusRaw === 'A') status = 'A';
    else if (statusRaw === 'H') status = 'H';
    const otHours = parseOtHoursValue(obj.otHours ?? obj.ot_hours);
    return { attendanceStatus: status, otHours: status === 'P+OT' ? otHours : 0 };
  }

  const token = String(raw ?? '').trim().toUpperCase();
  if (!token || token === '.' || token === '·') return emptyDay();
  if (token === '1' || token === 'P') return { attendanceStatus: 'P', otHours: 0 };
  if (token === 'A') return { attendanceStatus: 'A', otHours: 0 };
  if (token === 'H') return { attendanceStatus: 'H', otHours: 0 };
  if (token === 'OT' || token === 'P+OT' || token.startsWith('P+OT')) {
    const match = token.match(/P\+OT\(([\d.]+)\)/i);
    const hours = match ? parseOtHoursValue(match[1]) : 0;
    return { attendanceStatus: 'P+OT', otHours: hours };
  }
  return emptyDay();
}

export function parseOtHoursValue(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 10) / 10;
}

export function serializeDay(day: DayAttendance): DayAttendance | null {
  if (!day.attendanceStatus) return null;
  return {
    attendanceStatus: day.attendanceStatus,
    otHours: day.attendanceStatus === 'P+OT' ? day.otHours : 0,
  };
}

export function formatDayLabel(day: DayAttendance): string {
  if (!day.attendanceStatus) return '·';
  if (day.attendanceStatus === 'P+OT') {
    const h = day.otHours;
    return h > 0 ? `P+OT(${h})` : 'P+OT';
  }
  return day.attendanceStatus;
}

export function nextAttendanceStatus(current: AttendanceStatus): AttendanceStatus {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}

export function dayWorkingPoints(status: AttendanceStatus): number {
  if (status === 'P' || status === 'P+OT') return 1;
  if (status === 'H') return 0.5;
  return 0;
}

export function countTotalDays(attendance: AttendanceMap | null | undefined): number {
  if (!attendance) return 0;
  const sum = Object.values(attendance).reduce(
    (acc, raw) => acc + dayWorkingPoints(parseDayAttendance(raw).attendanceStatus),
    0,
  );
  return Math.round(sum * 10) / 10;
}

export type AttendanceBreakdown = {
  presentDays: number;
  halfDays: number;
  absentDays: number;
  otHours: number;
};

/** Count P / P+OT as present days, H as half, A as absent. */
export function countAttendanceBreakdown(attendance: AttendanceMap | null | undefined): AttendanceBreakdown {
  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let otHours = 0;
  if (!attendance) return { presentDays, halfDays, absentDays, otHours };

  for (const raw of Object.values(attendance)) {
    const day = parseDayAttendance(raw);
    if (day.attendanceStatus === 'P' || day.attendanceStatus === 'P+OT') {
      presentDays += 1;
      if (day.attendanceStatus === 'P+OT') otHours += day.otHours;
    } else if (day.attendanceStatus === 'H') {
      halfDays += 1;
    } else if (day.attendanceStatus === 'A') {
      absentDays += 1;
    }
  }
  return {
    presentDays,
    halfDays,
    absentDays,
    otHours: Math.round(otHours * 10) / 10,
  };
}

export function countTotalOtHours(attendance: AttendanceMap | null | undefined): number {
  if (!attendance) return 0;
  const sum = Object.values(attendance).reduce((acc, raw) => {
    const day = parseDayAttendance(raw);
    return day.attendanceStatus === 'P+OT' ? acc + day.otHours : acc;
  }, 0);
  return Math.round(sum * 10) / 10;
}

export function parseOtRate(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

export function calcOtAmount(totalOtHours: number, otRate: number): number {
  return Math.round(totalOtHours * otRate);
}

export function calcBasePay(input: {
  totalDays: number;
  wage: number;
  monthly_salary?: number;
  days_in_month?: number;
}): number {
  const monthly = input.monthly_salary ?? 0;
  const daysInMonth = input.days_in_month ?? 0;
  if (monthly > 0 && (input.wage || 0) <= 0 && daysInMonth > 0) {
    return Math.round(input.totalDays * (monthly / daysInMonth));
  }
  return Math.round(input.totalDays * (input.wage || 0));
}

export function calcFinalPayment(input: {
  attendance: AttendanceMap | null | undefined;
  wage: number;
  monthly_salary?: number;
  days_in_month?: number;
  ot_rate?: number;
  ot?: string | null;
  advance: number;
  food: number | null;
}): number {
  const totalDays = countTotalDays(input.attendance);
  const totalOtHours = countTotalOtHours(input.attendance);
  const otRate = input.ot_rate ?? parseOtRate(input.ot);
  const base = calcBasePay({
    totalDays,
    wage: input.wage,
    monthly_salary: input.monthly_salary,
    days_in_month: input.days_in_month,
  });
  const otAmount = calcOtAmount(totalOtHours, otRate);
  const advance = input.advance || 0;
  const food = input.food || 0;
  return Math.max(0, base + otAmount - advance - food);
}

export function createEmptyAttendanceMap(daysInMonth: number): Record<string, DayAttendance> {
  const attendance: Record<string, DayAttendance> = {};
  for (let day = 1; day <= daysInMonth; day += 1) {
    attendance[String(day)] = emptyDay();
  }
  return attendance;
}

export function attendanceCellClass(status: AttendanceStatus, isSunday: boolean): string {
  const base =
    'flex min-h-[1.75rem] min-w-[1.75rem] cursor-pointer items-center justify-center border border-slate-300 px-0.5 text-[9px] font-bold leading-tight transition select-none';
  if (!status) {
    return `${base} ${isSunday ? 'bg-amber-50 hover:bg-amber-100' : 'bg-white hover:bg-sky-50'} text-slate-400`;
  }
  if (status === 'P') return `${base} bg-emerald-100 text-emerald-900 hover:bg-emerald-200`;
  if (status === 'A') return `${base} bg-rose-100 text-rose-800 hover:bg-rose-200`;
  if (status === 'H') return `${base} bg-orange-100 text-orange-900 hover:bg-orange-200`;
  return `${base} bg-violet-100 text-violet-900 hover:bg-violet-200`;
}

/** Normalize attendance map for API (drop empty days). */
export function attendanceForApi(attendance: AttendanceMap | null | undefined): Record<string, DayAttendance> {
  const out: Record<string, DayAttendance> = {};
  if (!attendance) return out;
  for (const [key, raw] of Object.entries(attendance)) {
    const day = parseDayAttendance(raw);
    const serialized = serializeDay(day);
    if (serialized) out[key] = serialized;
  }
  return out;
}
