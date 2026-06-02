import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { PayrollEmployeeRow } from '../../services/payrollApi.ts';
import { Modal } from '../ui/Modal.tsx';
import {
  EMPTY_EMPLOYEE_FORM,
  employeeRowToForm,
  type EmployeeFormErrors,
  type EmployeeFormValues,
  validateEmployeeForm,
} from '../../utils/employeeForm.ts';

type EmployeeFormModalProps = {
  open: boolean;
  mode: 'add' | 'edit';
  defaultProject: string;
  projects: string[];
  editingRow: PayrollEmployeeRow | null;
  saving: boolean;
  onClose: () => void;
  onSave: (values: EmployeeFormValues) => void;
  onDelete?: () => void;
};

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
      {required && <span className="text-rose-600"> *</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-600">{message}</p>;
}

function inputClass(hasError: boolean) {
  return `w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
    hasError ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-200'
  }`;
}

export function EmployeeFormModal({
  open,
  mode,
  defaultProject,
  projects,
  editingRow,
  saving,
  onClose,
  onSave,
  onDelete,
}: EmployeeFormModalProps) {
  const [values, setValues] = useState<EmployeeFormValues>({ ...EMPTY_EMPLOYEE_FORM, project: defaultProject });
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && editingRow) {
      setValues(employeeRowToForm(editingRow, defaultProject));
    } else {
      setValues({ ...EMPTY_EMPLOYEE_FORM, project: defaultProject });
    }
    setErrors({});
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, mode, editingRow, defaultProject]);

  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateEmployeeForm(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave(values);
  };

  const title = mode === 'add' ? 'Add Employee' : `Edit Employee — ${editingRow?.name ?? ''}`;

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="rounded-md border border-rose-400 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
              >
                Delete Employee
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="employee-form"
              disabled={saving}
              className="rounded-md bg-sky-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Employee'}
            </button>
          </div>
        </div>
      }
    >
      <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Personal Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <FieldLabel required>Full Name</FieldLabel>
              <input
                ref={firstFieldRef}
                type="text"
                value={values.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className={inputClass(!!errors.fullName)}
                placeholder="Employee full name"
                autoComplete="name"
              />
              <FieldError message={errors.fullName} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel required>Contact Number</FieldLabel>
              <input
                type="tel"
                value={values.contactNumber}
                onChange={(e) => set('contactNumber', e.target.value)}
                className={inputClass(!!errors.contactNumber)}
                placeholder="10-digit mobile"
                autoComplete="tel"
              />
              <FieldError message={errors.contactNumber} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Email ID</FieldLabel>
              <input
                type="email"
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
                className={inputClass(!!errors.email)}
                placeholder="name@example.com"
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <FieldLabel>Address</FieldLabel>
              <textarea
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
                rows={2}
                className={inputClass(false)}
                placeholder="Residential address"
              />
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Work Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <FieldLabel required>Designation</FieldLabel>
              <input
                type="text"
                value={values.designation}
                onChange={(e) => set('designation', e.target.value)}
                className={inputClass(!!errors.designation)}
                placeholder="e.g. Welder, Helper"
              />
              <FieldError message={errors.designation} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel required={mode === 'add'}>Project</FieldLabel>
              <input
                type="text"
                list="employee-project-suggestions"
                value={values.project}
                onChange={(e) => set('project', e.target.value)}
                readOnly={mode === 'edit'}
                className={`${inputClass(!!errors.project)} ${mode === 'edit' ? 'bg-slate-50' : ''}`}
                placeholder="Project / site"
              />
              <datalist id="employee-project-suggestions">
                {projects.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              <FieldError message={errors.project} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Joining Date</FieldLabel>
              <input
                type="date"
                value={values.joiningDate}
                onChange={(e) => set('joiningDate', e.target.value)}
                className={inputClass(false)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Daily Wage</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.wage}
                onChange={(e) => set('wage', e.target.value)}
                className={inputClass(!!errors.wage)}
                placeholder="₹ per day"
              />
              <FieldError message={errors.wage} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Salary per Month</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.monthlySalary}
                onChange={(e) => set('monthlySalary', e.target.value)}
                className={inputClass(!!errors.monthlySalary)}
                placeholder="₹ monthly (fixed)"
              />
              <FieldError message={errors.monthlySalary} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>OT Rate (₹/hour)</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.otRate}
                onChange={(e) => set('otRate', e.target.value)}
                className={inputClass(!!errors.otRate)}
                placeholder="Overtime rate per hour"
              />
              <FieldError message={errors.otRate} />
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Bank Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <FieldLabel required={mode === 'add'}>Bank Name</FieldLabel>
              <input
                type="text"
                value={values.bankName}
                onChange={(e) => set('bankName', e.target.value)}
                className={inputClass(!!errors.bankName)}
              />
              <FieldError message={errors.bankName} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel required={mode === 'add'}>Account Number</FieldLabel>
              <input
                type="text"
                value={values.accountNumber}
                onChange={(e) => set('accountNumber', e.target.value)}
                className={inputClass(!!errors.accountNumber)}
              />
              <FieldError message={errors.accountNumber} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel required={mode === 'add'}>IFSC Code</FieldLabel>
              <input
                type="text"
                value={values.ifscCode}
                onChange={(e) => set('ifscCode', e.target.value.toUpperCase())}
                className={inputClass(!!errors.ifscCode)}
                placeholder="e.g. SBIN0001234"
              />
              <FieldError message={errors.ifscCode} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>UPI ID (optional)</FieldLabel>
              <input
                type="text"
                value={values.upiId}
                onChange={(e) => set('upiId', e.target.value)}
                className={inputClass(false)}
                placeholder="name@upi"
              />
            </label>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Additional</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <FieldLabel>Food Deduction</FieldLabel>
              <input
                type="number"
                min={0}
                value={values.foodDeduction}
                onChange={(e) => set('foodDeduction', e.target.value)}
                className={inputClass(!!errors.foodDeduction)}
              />
              <FieldError message={errors.foodDeduction} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Advance Amount</FieldLabel>
              <input
                type="number"
                min={0}
                value={values.advanceAmount}
                onChange={(e) => set('advanceAmount', e.target.value)}
                className={inputClass(!!errors.advanceAmount)}
              />
              <FieldError message={errors.advanceAmount} />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <FieldLabel>Remarks</FieldLabel>
              <input
                type="text"
                value={values.remarks}
                onChange={(e) => set('remarks', e.target.value)}
                className={inputClass(false)}
                placeholder="Optional notes"
              />
            </label>
          </div>
        </section>
      </form>
    </Modal>
  );
}
