import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { PayrollEmployeeRow } from '../../services/payrollApi.ts';
import { Modal } from '../ui/Modal.tsx';
import {
  EMPTY_EMPLOYEE_FORM,
  empIdYearFromJoiningDate,
  employeeRowToForm,
  suggestNextEmpId,
  type EmployeeFormErrors,
  type EmployeeFormValues,
  validateEmployeeForm,
} from '../../utils/employeeForm.ts';
import { derivePayRatesFromMonthlySalary } from '../../utils/payroll.ts';

type EmployeeFormModalProps = {
  open: boolean;
  mode: 'add' | 'edit';
  defaultProject: string;
  projects: string[];
  editingRow: PayrollEmployeeRow | null;
  daysInMonth: number;
  moduleYear: number;
  existingEmpIds: (string | null | undefined)[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: EmployeeFormValues) => void;
  onDelete?: () => void;
};

type FormTab = 'personal' | 'work' | 'identity' | 'bank' | 'additional';

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'personal', label: 'Personal' },
  { id: 'work', label: 'Work' },
  { id: 'identity', label: 'Aadhar & PAN' },
  { id: 'bank', label: 'Bank' },
  { id: 'additional', label: 'Additional' },
];

const TAB_FIELDS: Record<FormTab, (keyof EmployeeFormValues)[]> = {
  personal: ['fullName', 'contactNumber', 'email', 'address'],
  work: ['empId', 'designation', 'project', 'joiningDate', 'wage', 'monthlySalary', 'otRate'],
  identity: ['aadharNumber', 'panNumber'],
  bank: ['bankName', 'accountNumber', 'ifscCode', 'upiId'],
  additional: ['foodDeduction', 'advanceAmount', 'remarks'],
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

function firstTabWithError(errors: EmployeeFormErrors): FormTab | null {
  for (const tab of FORM_TABS) {
    if (TAB_FIELDS[tab.id].some((field) => errors[field])) {
      return tab.id;
    }
  }
  return null;
}

export function EmployeeFormModal({
  open,
  mode,
  defaultProject,
  projects,
  editingRow,
  daysInMonth,
  moduleYear,
  existingEmpIds,
  saving,
  onClose,
  onSave,
  onDelete,
}: EmployeeFormModalProps) {
  const [values, setValues] = useState<EmployeeFormValues>({ ...EMPTY_EMPLOYEE_FORM, project: defaultProject });
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [activeTab, setActiveTab] = useState<FormTab>('personal');
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const baseValues =
      mode === 'edit' && editingRow
        ? employeeRowToForm(editingRow, defaultProject)
        : {
            ...EMPTY_EMPLOYEE_FORM,
            project: defaultProject,
            empId: suggestNextEmpId(
              existingEmpIds,
              empIdYearFromJoiningDate(EMPTY_EMPLOYEE_FORM.joiningDate, moduleYear),
            ),
          };
    const monthly = Math.round(Number(baseValues.monthlySalary) || 0);
    if (monthly > 0 && daysInMonth > 0) {
      const { wage, otRate } = derivePayRatesFromMonthlySalary(monthly, daysInMonth);
      setValues({ ...baseValues, wage: String(wage), otRate: String(otRate) });
    } else {
      setValues(baseValues);
    }
    setErrors({});
    setActiveTab('personal');
    const timer = window.setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, mode, editingRow, defaultProject, daysInMonth, moduleYear, existingEmpIds]);

  const setJoiningDate = (joiningDate: string) => {
    setValues((prev) => {
      const next = { ...prev, joiningDate };
      if (mode === 'add') {
        const year = empIdYearFromJoiningDate(joiningDate, moduleYear);
        const yearSuffix = String(year % 100).padStart(2, '0');
        const prefix =
          prev.empId.length >= 3
            ? prev.empId.slice(0, 3)
            : suggestNextEmpId(existingEmpIds, year).slice(0, 3);
        next.empId = `${prefix}${yearSuffix}`;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, joiningDate: undefined, empId: undefined }));
  };

  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setMonthlySalary = (monthlySalary: string) => {
    const monthly = Math.round(Number(monthlySalary) || 0);
    if (monthly > 0 && daysInMonth > 0) {
      const { wage, otRate } = derivePayRatesFromMonthlySalary(monthly, daysInMonth);
      setValues((prev) => ({
        ...prev,
        monthlySalary,
        wage: String(wage),
        otRate: String(otRate),
      }));
      setErrors((prev) => ({ ...prev, monthlySalary: undefined, wage: undefined, otRate: undefined }));
      return;
    }
    set('monthlySalary', monthlySalary);
  };

  const hasMonthlySalary = Math.round(Number(values.monthlySalary) || 0) > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateEmployeeForm(values, mode);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const tab = firstTabWithError(nextErrors);
      if (tab) setActiveTab(tab);
      return;
    }
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
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200 pb-0">
        {FORM_TABS.map((tab) => {
          const hasError = TAB_FIELDS[tab.id].some((field) => errors[field]);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-t-md border-b-2 px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-800'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {hasError && <span className="ml-1 text-rose-600">•</span>}
            </button>
          );
        })}
      </div>

      <form id="employee-form" onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'personal' && (
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
        )}

        {activeTab === 'work' && (
          <section>
            <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Work Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <FieldLabel>EMP ID</FieldLabel>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={values.empId}
                  onChange={(e) => set('empId', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  className={inputClass(!!errors.empId)}
                  placeholder="e.g. 00126"
                />
                <p className="text-xs text-slate-500">3-digit prefix + 2-digit year (auto-suggested for new employees)</p>
                <FieldError message={errors.empId} />
              </label>
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
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className={inputClass(false)}
                />
              </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Salary per Month</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                className={inputClass(!!errors.monthlySalary)}
                placeholder="₹ monthly (fixed)"
              />
              <FieldError message={errors.monthlySalary} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>Daily Wage</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.wage}
                readOnly={hasMonthlySalary}
                onChange={(e) => set('wage', e.target.value)}
                className={`${inputClass(!!errors.wage)} ${hasMonthlySalary ? 'bg-slate-50' : ''}`}
                placeholder="₹ per day"
              />
              {hasMonthlySalary && (
                <p className="text-xs text-slate-500">Calculated from monthly salary ÷ {daysInMonth} days</p>
              )}
              <FieldError message={errors.wage} />
            </label>
            <label className="flex flex-col gap-1">
              <FieldLabel>OT Rate (₹/hour)</FieldLabel>
              <input
                type="number"
                min={0}
                step={1}
                value={values.otRate}
                readOnly={hasMonthlySalary}
                onChange={(e) => set('otRate', e.target.value)}
                className={`${inputClass(!!errors.otRate)} ${hasMonthlySalary ? 'bg-slate-50' : ''}`}
                placeholder="Overtime rate per hour"
              />
              {hasMonthlySalary && (
                <p className="text-xs text-slate-500">Calculated as daily wage ÷ 8 hours</p>
              )}
              <FieldError message={errors.otRate} />
            </label>
            </div>
          </section>
        )}

        {activeTab === 'identity' && (
          <section>
            <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-800">Aadhar & PAN</h3>
            <p className="mb-4 text-sm text-slate-600">Government ID details for employee records and compliance.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <FieldLabel>Aadhar Number</FieldLabel>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={values.aadharNumber}
                  onChange={(e) => set('aadharNumber', e.target.value.replace(/[^\d\s]/g, ''))}
                  className={inputClass(!!errors.aadharNumber)}
                  placeholder="12-digit Aadhar number"
                  autoComplete="off"
                />
                <FieldError message={errors.aadharNumber} />
              </label>
              <label className="flex flex-col gap-1">
                <FieldLabel>PAN Number</FieldLabel>
                <input
                  type="text"
                  maxLength={10}
                  value={values.panNumber}
                  onChange={(e) => set('panNumber', e.target.value.toUpperCase())}
                  className={inputClass(!!errors.panNumber)}
                  placeholder="e.g. ABCDE1234F"
                  autoComplete="off"
                />
                <FieldError message={errors.panNumber} />
              </label>
            </div>
          </section>
        )}

        {activeTab === 'bank' && (
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
        )}

        {activeTab === 'additional' && (
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
        )}
      </form>
    </Modal>
  );
}
