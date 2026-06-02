import { useMemo } from 'react';
import { editIconButtonClass, IconPencil } from '../actionIcons.tsx';
import type { PayrollEmployeeRow, PayrollModuleDetail } from '../../services/payrollApi.ts';
import {
  attendanceCellClass,
  formatDayLabel,
  parseDayAttendance,
} from '../../utils/attendance.ts';
import type { PayrollShareContext } from '../../utils/payrollShare.ts';
import {
  buildMonthCalendar,
  calcFinalPayment,
  countTotalDays,
  countTotalOtHours,
  formatInr,
  rowOtAmount,
  rowOtRate,
} from '../../utils/payroll.ts';
import { AttendanceShareButtons } from './AttendanceShareButtons.tsx';

type SalaryAttendanceTableProps = {
  detail: PayrollModuleDetail;
  month: number;
  year: number;
  rows: PayrollEmployeeRow[];
  canEdit: boolean;
  onDayClick: (employeeId: number, day: number) => void;
  onPatchRow: (employeeId: number, patch: Partial<PayrollEmployeeRow>) => void;
  onEditEmployee: (row: PayrollEmployeeRow) => void;
  onDeleteEmployee: (employeeId: number) => void;
  deletingEmployeeId?: number | null;
  shareContext: PayrollShareContext;
  onShareNotify: (message: string, variant?: 'success' | 'error') => void;
  onOpenPayslip: (row: PayrollEmployeeRow) => void;
};

const TAIL_COLS = 13;

export function SalaryAttendanceTable({
  detail,
  month,
  year,
  rows,
  canEdit,
  onDayClick,
  onPatchRow,
  onEditEmployee,
  onDeleteEmployee,
  deletingEmployeeId = null,
  shareContext,
  onShareNotify,
  onOpenPayslip,
}: SalaryAttendanceTableProps) {
  const calendar = useMemo(() => buildMonthCalendar(year, month), [year, month]);
  const days = calendar.days;
  const totalPayment = rows.reduce((sum, row) => sum + calcFinalPayment(row), 0);

  return (
    <div className="salaries-sheet overflow-hidden rounded-lg border border-slate-400 bg-white shadow-md print:overflow-visible print:rounded-none print:shadow-none">
      <div className="border-b border-slate-300 bg-sky-100/80 px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">{detail.title}</h3>
      </div>
      <div className="salaries-sheet-scroll max-h-[calc(100vh-18rem)] overflow-auto print:max-h-none print:overflow-visible">
        <table className="salaries-table w-full min-w-[1100px] border-collapse text-[11px] print:min-w-0 print:text-[8px]">
          <thead className="sticky top-0 z-20 print:static">
            <tr className="bg-slate-200 text-slate-800">
              <th className="sticky left-0 z-30 min-w-[2.25rem] border border-slate-400 bg-slate-200 px-1 py-1">S.No</th>
              <th className="sticky left-[2.25rem] z-30 min-w-[7rem] border border-slate-400 bg-slate-200 px-1.5 py-1 text-left">
                Employee Name
              </th>
              <th className="sticky left-[9.25rem] z-30 min-w-[5.5rem] border border-slate-400 bg-slate-200 px-1.5 py-1 text-left">
                Designation
              </th>
              {days.map(({ day, weekday, isSunday }) => (
                <th
                  key={`wd-${day}`}
                  className={`min-w-[1.85rem] border border-slate-400 px-0 py-0.5 text-center font-normal ${isSunday ? 'salaries-sunday bg-amber-200/90' : ''}`}
                >
                  {weekday}
                </th>
              ))}
              <th className="min-w-[2.75rem] border border-slate-400 px-1 py-1">OT Hrs</th>
              <th className="min-w-[2.75rem] border border-slate-400 px-1 py-1">OT Rate</th>
              <th className="min-w-[3rem] border border-slate-400 px-1 py-1">OT Amt</th>
              <th className="min-w-[3.25rem] border border-slate-400 px-1 py-1">Total Days</th>
              <th className="min-w-[3.25rem] border border-slate-400 px-1 py-1">Advance</th>
              <th className="min-w-[2.75rem] border border-slate-400 px-1 py-1">Wage</th>
              <th className="min-w-[3.5rem] border border-slate-400 px-1 py-1">Salary/Mo</th>
              <th className="min-w-[2.75rem] border border-slate-400 px-1 py-1">Food</th>
              <th className="min-w-[4rem] border border-slate-400 px-1 py-1">Final Pay</th>
              <th className="min-w-[3.5rem] border border-slate-400 px-1 py-1">Remarks</th>
              <th className="min-w-[4.5rem] border border-slate-400 px-1 py-1 print:hidden">Share</th>
              <th className="min-w-[2.5rem] border border-slate-400 px-1 py-1 print:hidden">Edit</th>
              <th className="min-w-[3.5rem] border border-slate-400 px-1 py-1 print:hidden">Remove</th>
            </tr>
            <tr className="bg-slate-100 text-slate-900">
              <th className="sticky left-0 z-30 border border-slate-400 bg-slate-100" />
              <th className="sticky left-[2.25rem] z-30 border border-slate-400 bg-slate-100" />
              <th className="sticky left-[9.25rem] z-30 border border-slate-400 bg-slate-100" />
              {days.map(({ day, isSunday }) => (
                <th
                  key={`d-${day}`}
                  className={`border border-slate-400 py-0.5 text-center font-semibold ${isSunday ? 'salaries-sunday bg-amber-100' : ''}`}
                >
                  {day}
                </th>
              ))}
              <th className="border border-slate-400" colSpan={TAIL_COLS} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3 + days.length + TAIL_COLS} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                  No employees match filters. Add an employee or clear filters.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const totalDays = row.total_days ?? countTotalDays(row.attendance);
                const totalOtHrs = row.total_ot_hours ?? countTotalOtHours(row.attendance);
                const otRate = rowOtRate(row);
                const otAmount = rowOtAmount(row);
                const payment = row.final_payment ?? calcFinalPayment(row);
                const stripe = rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/90';
                return (
                  <tr key={row.id} className={`${stripe} hover:bg-sky-50/50`}>
                    <td className={`sticky left-0 z-10 border border-slate-300 ${stripe} px-1 py-0.5 text-center font-medium`}>
                      {row.serial_no}
                    </td>
                    <td className={`sticky left-[2.25rem] z-10 border border-slate-300 ${stripe} px-1 py-0.5`}>
                      <span className="block px-0.5 py-0.5 text-[11px] font-medium text-slate-900">{row.name}</span>
                    </td>
                    <td className={`sticky left-[9.25rem] z-10 border border-slate-300 ${stripe} px-1 py-0.5`}>
                      <span className="block px-0.5 py-0.5 text-[11px] text-slate-800">{row.designation ?? '—'}</span>
                    </td>
                    {days.map(({ day, isSunday }) => {
                      const dayAtt = parseDayAttendance((row.attendance ?? {})[String(day)]);
                      const label = formatDayLabel(dayAtt);
                      return (
                        <td key={`${row.id}-${day}`} className={`border border-slate-300 p-0 text-center ${isSunday ? 'salaries-sunday bg-amber-50/80' : ''}`}>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => onDayClick(row.id, day)}
                            className={attendanceCellClass(dayAtt.attendanceStatus, isSunday)}
                            title={
                              dayAtt.attendanceStatus === 'P+OT'
                                ? 'Click to edit OT hours · cycles on next status'
                                : 'Click: · → P → A → H → P+OT'
                            }
                          >
                            {label}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 px-1.5 py-0.5 text-center font-medium tabular-nums text-violet-900">
                      {totalOtHrs || '—'}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        min={0}
                        value={otRate}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { ot: e.target.value })}
                        className="w-full min-w-[2.5rem] border-0 bg-transparent text-right text-[10px] tabular-nums focus:outline focus:outline-1 focus:outline-violet-500"
                        title="OT rate per hour"
                      />
                    </td>
                    <td className="border border-slate-300 px-1.5 py-0.5 text-right font-semibold tabular-nums text-violet-900">
                      {formatInr(otAmount)}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-0.5 text-center font-semibold tabular-nums">{totalDays}</td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        value={row.advance}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { advance: Number(e.target.value) || 0 })}
                        className="w-full border-0 bg-transparent text-right tabular-nums focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        value={row.wage}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { wage: Number(e.target.value) || 0 })}
                        className="w-full border-0 bg-transparent text-right tabular-nums focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        value={row.monthly_salary ?? 0}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { monthly_salary: Number(e.target.value) || 0 })}
                        className="w-full border-0 bg-transparent text-right tabular-nums focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        value={row.food ?? ''}
                        readOnly={!canEdit}
                        onChange={(e) =>
                          onPatchRow(row.id, { food: e.target.value === '' ? null : Number(e.target.value) || 0 })
                        }
                        className="w-full border-0 bg-transparent text-right tabular-nums focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1.5 py-0.5 text-right font-bold tabular-nums text-slate-900">
                      {formatInr(payment)}
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        value={row.remarks ?? ''}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { remarks: e.target.value })}
                        className="w-full min-w-[3rem] border-0 bg-transparent focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-0.5 py-0.5 text-center print:hidden">
                      <AttendanceShareButtons
                        row={row}
                        shareContext={shareContext}
                        onNotify={onShareNotify}
                        onOpenPayslip={onOpenPayslip}
                        compact={false}
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center print:hidden">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => onEditEmployee(row)}
                        className={`${editIconButtonClass} !h-7 !w-7`}
                        title="View / edit employee details"
                        aria-label={`Edit ${row.name}`}
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="border border-slate-300 px-1 py-0.5 text-center print:hidden">
                      <button
                        type="button"
                        disabled={!canEdit || deletingEmployeeId === row.id}
                        onClick={() => onDeleteEmployee(row.id)}
                        className="rounded border border-rose-500 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        title="Remove employee row"
                      >
                        {deletingEmployeeId === row.id ? 'Removing…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-slate-200 font-bold text-slate-900">
              <td colSpan={3} className="sticky left-0 z-10 border border-slate-400 bg-slate-200 px-2 py-2 text-right">
                Monthly Total
              </td>
              {days.map(({ day }) => (
                <td key={`tot-${day}`} className="border border-slate-400" />
              ))}
              <td colSpan={8} className="border border-slate-400 px-2 py-2 text-right">
                Grand Total
              </td>
              <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatInr(totalPayment)}</td>
              <td className="border border-slate-400" />
              <td className="border border-slate-400 print:hidden" />
              <td className="border border-slate-400 print:hidden" />
              <td className="border border-slate-400 print:hidden" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
