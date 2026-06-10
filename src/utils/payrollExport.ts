import ExcelJS from 'exceljs';
import type { PayrollEmployeeRow, PayrollModuleDetail } from '../services/payrollApi.ts';
import { formatDayLabel, parseDayAttendance } from './attendance.ts';
import {
  buildMonthCalendar,
  buildPayrollModuleTitle,
  calcRowFinalPayment,
  countTotalOtHours,
  rowOtAmount,
  rowOtRate,
} from './payroll.ts';

export function payrollExportFilename(detail: Pick<PayrollModuleDetail, 'year' | 'month' | 'location'>) {
  const loc = (detail.location ?? 'project').replace(/[^\w.-]+/g, '_').slice(0, 40);
  return `salaries_${detail.year}_${String(detail.month).padStart(2, '0')}_${loc}.xlsx`;
}

export type PayrollExportResult = {
  filename: string;
  blob: Blob;
  downloadUrl: string;
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF999999' } },
  left: { style: 'thin', color: { argb: 'FF999999' } },
  bottom: { style: 'thin', color: { argb: 'FF999999' } },
  right: { style: 'thin', color: { argb: 'FF999999' } },
};

const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E8F5' } };
const sundayFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

function styleHeaderCell(cell: ExcelJS.Cell, fill: ExcelJS.Fill = headerFill) {
  cell.font = { bold: true, size: 9 };
  cell.fill = fill;
  cell.border = thinBorder;
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

/** Build Excel workbook bytes in memory (no download yet). */
export async function buildPayrollExcelBlob(
  detail: PayrollModuleDetail,
  employees: PayrollEmployeeRow[],
): Promise<Blob> {
  const calendar = buildMonthCalendar(detail.year, detail.month);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MC.Engineering';
  const sheet = workbook.addWorksheet('Payroll', {
    views: [{ state: 'frozen', xSplit: 4, ySplit: 3 }],
  });

  const fixedHeaders = ['S.No', 'EMP ID', 'Name', 'Designation'];
  const tailHeaders = [
    'OT Hrs',
    'OT Rate',
    'OT Amt',
    'Total Days',
    'Advance',
    'Wage',
    'Salary/Month',
    'Food',
    'Final Payment',
    'Remarks',
  ];
  const lastCol = fixedHeaders.length + calendar.daysInMonth + tailHeaders.length;

  sheet.mergeCells(1, 1, 1, lastCol);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = buildPayrollModuleTitle(detail.month, detail.year, detail.location, detail.company_name);
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  let col = 1;
  for (const label of fixedHeaders) {
    styleHeaderCell(sheet.getCell(2, col), headerFill);
    sheet.getCell(2, col).value = label;
    styleHeaderCell(sheet.getCell(3, col), headerFill);
    sheet.getCell(3, col).value = '';
    col += 1;
  }

  for (const dayMeta of calendar.days) {
    const fill = dayMeta.isSunday ? sundayFill : headerFill;
    const head = sheet.getCell(2, col);
    head.value = dayMeta.day;
    styleHeaderCell(head, fill);
    const wd = sheet.getCell(3, col);
    wd.value = dayMeta.weekday;
    styleHeaderCell(wd, fill);
    col += 1;
  }

  for (const label of tailHeaders) {
    styleHeaderCell(sheet.getCell(2, col), headerFill);
    sheet.getCell(2, col).value = label;
    styleHeaderCell(sheet.getCell(3, col), headerFill);
    sheet.getCell(3, col).value = '';
    col += 1;
  }

  let rowNum = 4;
  for (const row of employees) {
    const att = row.attendance ?? {};
    let c = 1;
    const setCell = (value: string | number, align: 'left' | 'center' | 'right' = 'left') => {
      const cell = sheet.getCell(rowNum, c);
      cell.value = value;
      cell.border = thinBorder;
      cell.alignment = { horizontal: align, vertical: 'middle' };
      c += 1;
    };
    setCell(row.serial_no, 'center');
    setCell(row.emp_id ?? '', 'center');
    setCell(row.name);
    setCell(row.designation ?? '');
    for (const dayMeta of calendar.days) {
      const cell = sheet.getCell(rowNum, c);
      const dayAtt = parseDayAttendance(att[String(dayMeta.day)]);
      cell.value = formatDayLabel(dayAtt) === '·' ? '' : formatDayLabel(dayAtt);
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (dayMeta.isSunday) cell.fill = sundayFill;
      c += 1;
    }
    setCell(row.total_ot_hours ?? countTotalOtHours(row.attendance), 'right');
    setCell(rowOtRate(row), 'right');
    setCell(rowOtAmount(row), 'right');
    setCell(row.total_days ?? 0, 'center');
    setCell(row.advance, 'right');
    setCell(row.wage, 'right');
    setCell(row.monthly_salary ?? 0, 'right');
    setCell(row.food ?? '', 'right');
    setCell(calcRowFinalPayment(row, detail.days_in_month), 'right');
    setCell(row.remarks ?? '');
    rowNum += 1;
  }

  const totalPayment = employees.reduce((sum, row) => sum + calcRowFinalPayment(row, detail.days_in_month), 0);
  sheet.getCell(rowNum, 3).value = 'Total';
  sheet.getCell(rowNum, 3).font = { bold: true };
  sheet.getCell(rowNum, 3).border = thinBorder;
  const payCol = fixedHeaders.length + calendar.daysInMonth + 8;
  const totalCell = sheet.getCell(rowNum, payCol);
  totalCell.value = totalPayment;
  totalCell.font = { bold: true };
  totalCell.border = thinBorder;
  totalCell.alignment = { horizontal: 'right' };

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 14;
  for (let i = 0; i < calendar.daysInMonth; i += 1) {
    sheet.getColumn(4 + i).width = 4;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function preparePayrollExport(
  detail: PayrollModuleDetail,
  employees: PayrollEmployeeRow[],
): Promise<PayrollExportResult> {
  const filename = payrollExportFilename(detail);
  const blob = await buildPayrollExcelBlob(detail, employees);
  if (!blob.size) throw new Error('Export file is empty.');
  const downloadUrl = URL.createObjectURL(blob);
  return { filename, blob, downloadUrl };
}

export function revokePayrollExportUrl(url: string | null) {
  if (url) URL.revokeObjectURL(url);
}

/** Try automatic download; returns false if browser likely blocked it. */
export function tryAutoDownload(blob: Blob, filename: string): boolean {
  const nav = navigator as Navigator & { msSaveOrOpenBlob?: (b: Blob, name: string) => boolean };
  if (typeof nav.msSaveOrOpenBlob === 'function') {
    nav.msSaveOrOpenBlob(blob, filename);
    return true;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export async function savePayrollExportWithPicker(blob: Blob, filename: string): Promise<boolean> {
  const win = window as Window & {
    showSaveFilePicker?: (options: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;
  };
  if (!win.showSaveFilePicker) return false;
  try {
    const handle = await win.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: 'Excel workbook',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    return false;
  }
}

export async function downloadPayrollExcel(
  detail: PayrollModuleDetail,
  employees: PayrollEmployeeRow[],
): Promise<PayrollExportResult> {
  const prepared = await preparePayrollExport(detail, employees);
  await savePayrollExportWithPicker(prepared.blob, prepared.filename);
  tryAutoDownload(prepared.blob, prepared.filename);
  return prepared;
}

/** Legacy CSV fallback */
export function downloadPayrollCsv(detail: PayrollModuleDetail, employees: PayrollEmployeeRow[]) {
  const calendar = buildMonthCalendar(detail.year, detail.month);
  const dayCount = calendar.daysInMonth;
  const lines: string[] = [];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  lines.push(esc(buildPayrollModuleTitle(detail.month, detail.year, detail.location, detail.company_name)));
  lines.push(
    [
      'S.No',
      'EMP ID',
      'Name',
      'Designation',
      ...Array.from({ length: dayCount }, (_, i) => String(i + 1)),
      'OT Hrs',
      'OT Rate',
      'OT Amt',
      'Total Days',
      'Advance',
      'Wage',
      'Salary/Month',
      'Food',
      'Final Payment',
      'Remarks',
    ]
      .map(esc)
      .join(','),
  );
  lines.push(['', '', '', '', ...calendar.weekdayLabels, '', '', '', '', '', '', '', '', '', ''].map(esc).join(','));

  for (const row of employees) {
    const att = row.attendance ?? {};
    lines.push(
      [
        row.serial_no,
        row.emp_id ?? '',
        row.name,
        row.designation ?? '',
        ...Array.from({ length: dayCount }, (_, i) => {
          const label = formatDayLabel(parseDayAttendance(att[String(i + 1)]));
          return label === '·' ? '' : label;
        }),
        row.total_ot_hours ?? countTotalOtHours(row.attendance),
        rowOtRate(row),
        rowOtAmount(row),
        row.total_days ?? 0,
        row.advance,
        row.wage,
        row.monthly_salary ?? 0,
        row.food ?? '',
        calcRowFinalPayment(row, detail.days_in_month),
        row.remarks ?? '',
      ]
        .map(esc)
        .join(','),
    );
  }

  const total = employees.reduce((s, e) => s + calcRowFinalPayment(e, detail.days_in_month), 0);
  lines.push('');
  lines.push(['', '', 'Total', ...Array(dayCount).fill(''), '', '', '', '', '', '', '', total, ''].map(esc).join(','));

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const filename = payrollExportFilename(detail).replace('.xlsx', '.csv');
  tryAutoDownload(blob, filename);
}
