import type { PayrollEmployeeRow, PayrollModuleDetail } from '../../services/payrollApi.ts';
import {
  attendanceCellClass,
  calcFinalPayment,
  countTotalDays,
  formatInr,
  normalizeAttendanceCode,
} from '../../utils/payroll.ts';

type SalaryAttendanceTableProps = {
  detail: PayrollModuleDetail;
  rows: PayrollEmployeeRow[];
  canEdit: boolean;
  onToggleDay: (employeeId: number, day: number) => void;
  onPatchRow: (employeeId: number, patch: Partial<PayrollEmployeeRow>) => void;
};

export function SalaryAttendanceTable({ detail, rows, canEdit, onToggleDay, onPatchRow }: SalaryAttendanceTableProps) {
  const days = Array.from({ length: detail.days_in_month }, (_, i) => i + 1);
  const totalPayment = rows.reduce((sum, row) => sum + calcFinalPayment(row), 0);

  return (
    <div className="salaries-sheet overflow-hidden rounded-lg border border-slate-400 bg-white shadow-md">
      <div className="border-b border-slate-300 bg-sky-100/80 px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">{detail.title}</h3>
      </div>
      <div className="max-h-[calc(100vh-18rem)] overflow-auto">
        <table className="salaries-table w-full min-w-[1100px] border-collapse text-[11px]">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-200 text-slate-800">
              <th className="sticky left-0 z-30 min-w-[2.25rem] border border-slate-400 bg-slate-200 px-1 py-1">S.No</th>
              <th className="sticky left-[2.25rem] z-30 min-w-[7rem] border border-slate-400 bg-slate-200 px-1.5 py-1 text-left">
                Employee Name
              </th>
              <th className="sticky left-[9.25rem] z-30 min-w-[5.5rem] border border-slate-400 bg-slate-200 px-1.5 py-1 text-left">
                Designation
              </th>
              {days.map((day) => {
                const isSunday = detail.weekday_labels[day - 1] === 'Sun';
                return (
                  <th
                    key={`wd-${day}`}
                    className={`min-w-[1.75rem] border border-slate-400 px-0 py-0.5 text-center font-normal ${isSunday ? 'bg-amber-200/90' : ''}`}
                  >
                    {detail.weekday_labels[day - 1]}
                  </th>
                );
              })}
              <th className="min-w-[3rem] border border-slate-400 px-1 py-1">OT</th>
              <th className="min-w-[3.5rem] border border-slate-400 px-1 py-1">Total Days</th>
              <th className="min-w-[3.5rem] border border-slate-400 px-1 py-1">Advance</th>
              <th className="min-w-[3rem] border border-slate-400 px-1 py-1">Wage</th>
              <th className="min-w-[3rem] border border-slate-400 px-1 py-1">Food</th>
              <th className="min-w-[4.5rem] border border-slate-400 px-1 py-1">Final Payment</th>
              <th className="min-w-[4.5rem] border border-slate-400 px-1 py-1">Remarks</th>
            </tr>
            <tr className="bg-slate-100 text-slate-900">
              <th className="sticky left-0 z-30 border border-slate-400 bg-slate-100" />
              <th className="sticky left-[2.25rem] z-30 border border-slate-400 bg-slate-100" />
              <th className="sticky left-[9.25rem] z-30 border border-slate-400 bg-slate-100" />
              {days.map((day) => {
                const isSunday = detail.weekday_labels[day - 1] === 'Sun';
                return (
                  <th
                    key={`d-${day}`}
                    className={`border border-slate-400 py-0.5 text-center font-semibold ${isSunday ? 'bg-amber-100' : ''}`}
                  >
                    {day}
                  </th>
                );
              })}
              <th className="border border-slate-400" colSpan={6} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3 + days.length + 6} className="border border-slate-300 px-4 py-8 text-center text-slate-500">
                  No employees match filters. Add an employee or clear filters.
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => {
                const totalDays = countTotalDays(row.attendance);
                const payment = calcFinalPayment(row);
                const stripe = rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/90';
                return (
                  <tr key={row.id} className={`${stripe} hover:bg-sky-50/50`}>
                    <td className={`sticky left-0 z-10 border border-slate-300 ${stripe} px-1 py-0.5 text-center font-medium`}>
                      {row.serial_no}
                    </td>
                    <td className={`sticky left-[2.25rem] z-10 border border-slate-300 ${stripe} px-1 py-0.5`}>
                      <input
                        value={row.name}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { name: e.target.value })}
                        className="w-full min-w-0 border-0 bg-transparent px-0.5 py-0.5 text-[11px] font-medium focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    <td className={`sticky left-[9.25rem] z-10 border border-slate-300 ${stripe} px-1 py-0.5`}>
                      <input
                        value={row.designation ?? ''}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { designation: e.target.value })}
                        className="w-full min-w-0 border-0 bg-transparent px-0.5 py-0.5 focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                    {days.map((day) => {
                      const isSunday = detail.weekday_labels[day - 1] === 'Sun';
                      const code = normalizeAttendanceCode((row.attendance ?? {})[String(day)]);
                      return (
                        <td key={`${row.id}-${day}`} className={`border border-slate-300 p-0 text-center ${isSunday ? 'bg-amber-50/80' : ''}`}>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => onToggleDay(row.id, day)}
                            className={attendanceCellClass(code, isSunday)}
                            title="Click to cycle P → A → H → OT"
                          >
                            {code || '·'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 px-1 py-0.5">
                      <input
                        type="number"
                        value={row.ot ?? ''}
                        readOnly={!canEdit}
                        onChange={(e) => onPatchRow(row.id, { ot: e.target.value })}
                        className="w-full border-0 bg-transparent text-right text-[11px] focus:outline focus:outline-1 focus:outline-sky-500"
                      />
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
                        className="w-full min-w-[4rem] border-0 bg-transparent focus:outline focus:outline-1 focus:outline-sky-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-slate-200 font-bold text-slate-900">
              <td colSpan={3} className="sticky left-0 z-10 border border-slate-400 bg-slate-200 px-2 py-2 text-right">
                Monthly Total
              </td>
              {days.map((day) => (
                <td key={`tot-${day}`} className="border border-slate-400" />
              ))}
              <td colSpan={5} className="border border-slate-400 px-2 py-2 text-right">
                Grand Total
              </td>
              <td className="border border-slate-400 px-2 py-2 text-right tabular-nums">{formatInr(totalPayment)}</td>
              <td className="border border-slate-400" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
