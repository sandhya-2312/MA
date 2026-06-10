import { useRef } from 'react';
import type { PayrollEmployeeRow } from '../../services/payrollApi.ts';
import { buildPayslipDetails, type PayrollShareContext } from '../../utils/payrollShare.ts';
import { formatInr } from '../../utils/payroll.ts';
import { Modal } from '../ui/Modal.tsx';

type PayslipModalProps = {
  open: boolean;
  row: PayrollEmployeeRow | null;
  shareContext: PayrollShareContext;
  onClose: () => void;
};

export function PayslipModal({ open, row, shareContext, onClose }: PayslipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!open || !row) return null;

  const d = buildPayslipDetails(row, shareContext);
  const company = (shareContext.companyName ?? 'MC.Engineering').trim();
  const project = (d.row.project ?? shareContext.projectName).trim() || shareContext.projectName;

  const handlePrint = () => {
    const source = printRef.current;
    if (!source) return;

    const clone = source.cloneNode(true) as HTMLElement;
    clone.classList.add('payslip-print-clone');
    document.body.appendChild(clone);
    document.body.classList.add('payslip-print-active');

    const cleanup = () => {
      document.body.classList.remove('payslip-print-active');
      clone.remove();
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.setTimeout(cleanup, 2000);
    window.print();
  };

  return (
    <Modal
      open={open}
      title="Salary payslip"
      onClose={onClose}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Print / Save as PDF
          </button>
        </div>
      }
    >
      <p className="mb-3 text-xs text-slate-500">
        Use <strong>Print / Save as PDF</strong>, then choose &quot;Save as PDF&quot; as the printer. No pop-ups required.
      </p>
      <div ref={printRef} className="payslip-print-root rounded-lg border border-slate-200 bg-white p-4 text-slate-900">
        <h3 className="text-base font-bold">{company} — Salary Payslip</h3>
        <p className="mt-1 text-sm text-slate-600">
          {shareContext.monthLabel} {shareContext.year} · {project}
        </p>
        <table className="mt-4 w-full border-collapse text-sm">
          <tbody>
            <PayslipRow label="Employee" value={d.row.name} />
            <PayslipRow label="Designation" value={d.row.designation ?? '—'} />
            <PayslipRow label="Present days" value={String(d.breakdown.presentDays)} />
            <PayslipRow label="Half days" value={String(d.breakdown.halfDays)} />
            <PayslipRow label="Absent days" value={String(d.breakdown.absentDays)} />
            <PayslipRow label="OT hours" value={String(d.otHours)} />
            <PayslipRow label="OT rate" value={`${formatInr(d.otRate)} / hr`} />
            <PayslipRow label="OT amount" value={formatInr(d.otAmount)} />
            <PayslipRow label="Daily wage" value={formatInr(d.row.wage)} />
            <PayslipRow label="Salary / month" value={formatInr(d.row.monthly_salary ?? 0)} />
            <PayslipRow label="Advance" value={formatInr(d.row.advance)} />
            <PayslipRow label="Food deduction" value={formatInr(d.row.food ?? 0)} />
          </tbody>
        </table>
        <p className="mt-4 text-base font-bold">Final payment: {formatInr(d.finalPayment)}</p>
      </div>
    </Modal>
  );
}

function PayslipRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-200">
      <th className="w-[42%] bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700">{label}</th>
      <td className="px-3 py-2 text-slate-900">{value}</td>
    </tr>
  );
}
