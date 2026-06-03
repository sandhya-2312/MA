import type { PayrollEmployeeRow } from '../services/payrollApi.ts';
import { countAttendanceBreakdown } from './attendance.ts';
import { calcRowFinalPayment, countTotalOtHours, rowOtAmount, rowOtRate } from './payroll.ts';

export type PayrollShareContext = {
  monthLabel: string;
  year: number;
  projectName: string;
  companyName?: string;
  daysInMonth: number;
};

export type PhoneValidation = { ok: true; e164: string } | { ok: false; error: string };

export function formatInrMessage(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

/** Normalize Indian mobile to digits for wa.me / sms: (91XXXXXXXXXX). */
export function normalizePhoneForMessaging(contact: string | null | undefined): PhoneValidation {
  const digits = String(contact ?? '').replace(/\D/g, '');
  if (!digits) {
    return { ok: false, error: 'No contact number on file for this employee.' };
  }

  let normalized = digits;
  if (normalized.length === 10) {
    normalized = `91${normalized}`;
  } else if (normalized.length === 11 && normalized.startsWith('0')) {
    normalized = `91${normalized.slice(1)}`;
  } else if (normalized.length === 12 && normalized.startsWith('91')) {
    normalized = normalized;
  } else if (normalized.length < 10) {
    return { ok: false, error: 'Contact number is too short. Add a valid 10-digit mobile number.' };
  }

  if (normalized.length < 12 || !normalized.startsWith('91')) {
    return { ok: false, error: 'Use a valid Indian mobile number (10 digits).' };
  }

  return { ok: true, e164: normalized };
}

export function buildPayrollShareMessage(row: PayrollEmployeeRow, ctx: PayrollShareContext): string {
  const company = (ctx.companyName ?? 'MC.Engg').trim();
  const project = (row.project ?? ctx.projectName).trim() || ctx.projectName;
  const breakdown = countAttendanceBreakdown(row.attendance);
  const otHours = row.total_ot_hours ?? countTotalOtHours(row.attendance);
  const finalPayment = calcRowFinalPayment(row, ctx.daysInMonth);
  const advance = row.advance ?? 0;
  const food = row.food ?? 0;

  const lines = [
    `${company} Payroll - ${ctx.monthLabel} ${ctx.year}`,
    '',
    `Employee: ${row.name.trim()}`,
    `Project: ${project}`,
    '',
    `Present Days: ${breakdown.presentDays}`,
    `Half Days: ${breakdown.halfDays}`,
    `Absent Days: ${breakdown.absentDays}`,
    `OT Hours: ${otHours}`,
    `Advance: ${formatInrMessage(advance)}`,
    `Food Deduction: ${formatInrMessage(food)}`,
    '',
    `Final Payment: ${formatInrMessage(finalPayment)}`,
  ];

  return lines.join('\n');
}

export function encodeMessageForUrl(message: string): string {
  return encodeURIComponent(message);
}

export function buildWhatsAppUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164}?text=${encodeMessageForUrl(message)}`;
}

export function buildSmsUrl(phoneE164: string, message: string): string {
  return `sms:+${phoneE164}?body=${encodeMessageForUrl(message)}`;
}

export function openWhatsAppShare(row: PayrollEmployeeRow, ctx: PayrollShareContext): PhoneValidation {
  const phone = normalizePhoneForMessaging(row.contact_number);
  if (!phone.ok) return phone;
  const message = buildPayrollShareMessage(row, ctx);
  const link = document.createElement('a');
  link.href = buildWhatsAppUrl(phone.e164, message);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return phone;
}

export function openSmsShare(row: PayrollEmployeeRow, ctx: PayrollShareContext): PhoneValidation {
  const phone = normalizePhoneForMessaging(row.contact_number);
  if (!phone.ok) return phone;
  const message = buildPayrollShareMessage(row, ctx);
  window.location.href = buildSmsUrl(phone.e164, message);
  return phone;
}

export async function copyPayrollShareMessage(row: PayrollEmployeeRow, ctx: PayrollShareContext): Promise<void> {
  const message = buildPayrollShareMessage(row, ctx);
  await navigator.clipboard.writeText(message);
}

export function buildBulkShareText(rows: PayrollEmployeeRow[], ctx: PayrollShareContext): string {
  return rows
    .map((row, index) => {
      const header = rows.length > 1 ? `——— ${index + 1}. ${row.name} ———` : '';
      const body = buildPayrollShareMessage(row, ctx);
      return header ? `${header}\n\n${body}` : body;
    })
    .join('\n\n');
}

export type PayslipDetails = {
  row: PayrollEmployeeRow;
  ctx: PayrollShareContext;
  breakdown: ReturnType<typeof countAttendanceBreakdown>;
  otHours: number;
  otRate: number;
  otAmount: number;
  finalPayment: number;
};

export function buildPayslipDetails(row: PayrollEmployeeRow, ctx: PayrollShareContext): PayslipDetails {
  return {
    row,
    ctx,
    breakdown: countAttendanceBreakdown(row.attendance),
    otHours: row.total_ot_hours ?? countTotalOtHours(row.attendance),
    otRate: rowOtRate(row),
    otAmount: rowOtAmount(row),
    finalPayment: calcRowFinalPayment(row, ctx.daysInMonth),
  };
}
