import type { PayrollModuleDetail } from '../services/payrollApi.ts';
import { formatInr } from './payroll.ts';

export function downloadPayrollCsv(detail: PayrollModuleDetail) {
  const dayCount = detail.days_in_month;
  const lines: string[] = [];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  lines.push(esc(detail.title));
  lines.push(
    ['S.No', 'Name', 'Designation', ...Array.from({ length: dayCount }, (_, i) => String(i + 1)), 'OT', 'Total Days', 'Advance', 'Wage', 'Food', 'Final Payment', 'Remarks']
      .map(esc)
      .join(','),
  );
  lines.push(
    ['', '', '', ...detail.weekday_labels, '', '', '', '', '', '', ''].map(esc).join(','),
  );

  for (const row of detail.employees) {
    const att = row.attendance ?? {};
    lines.push(
      [
        row.serial_no,
        row.name,
        row.designation ?? '',
        ...Array.from({ length: dayCount }, (_, i) => att[String(i + 1)] ?? ''),
        row.ot_amount ?? row.ot ?? 0,
        row.total_days,
        row.advance,
        row.wage,
        row.food ?? '',
        row.final_payment,
        row.remarks ?? '',
      ]
        .map(esc)
        .join(','),
    );
  }

  const total = detail.employees.reduce((s, e) => s + e.final_payment, 0);
  lines.push('');
  lines.push(['', '', 'Total', ...Array(dayCount).fill(''), '', '', '', '', '', formatInr(total), ''].map(esc).join(','));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `salaries_${detail.year}_${String(detail.month).padStart(2, '0')}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
