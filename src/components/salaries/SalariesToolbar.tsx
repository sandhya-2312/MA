import { useRef } from 'react';

export type PayrollSheetSelectionInput = {
  company: string;
  project: string;
  yearRaw: string;
};

type SalariesToolbarProps = {
  month: number;
  yearInput: string;
  yearSuggestions: number[];
  companyInput: string;
  companies: string[];
  projectInput: string;
  projects: string[];
  search: string;
  designationFilter: string;
  designations: string[];
  sheetReady: boolean;
  loadingSheet: boolean;
  creatingSheet: boolean;
  canEdit: boolean;
  dirty: boolean;
  saving: boolean;
  exporting: boolean;
  onMonthChange: (month: number) => void;
  onYearInputChange: (year: string) => void;
  onCompanyInputChange: (company: string) => void;
  onProjectInputChange: (project: string) => void;
  onLoadSheet: (selection: PayrollSheetSelectionInput) => void;
  onCreateSheet: (selection: PayrollSheetSelectionInput) => void;
  onSearchChange: (value: string) => void;
  onDesignationFilterChange: (value: string) => void;
  onAddEmployee: () => void;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onShareAll: () => void;
  onCopyAllMessages: () => void;
  employeeCount: number;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function SalariesToolbar({
  month,
  yearInput,
  yearSuggestions,
  companyInput,
  companies,
  projectInput,
  projects,
  search,
  designationFilter,
  designations,
  sheetReady,
  loadingSheet,
  creatingSheet,
  canEdit,
  dirty,
  saving,
  exporting,
  onMonthChange,
  onYearInputChange,
  onCompanyInputChange,
  onProjectInputChange,
  onLoadSheet,
  onCreateSheet,
  onSearchChange,
  onDesignationFilterChange,
  onAddEmployee,
  onSave,
  onExport,
  onPrint,
  onShareAll,
  onCopyAllMessages,
  employeeCount,
}: SalariesToolbarProps) {
  const companyRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const readSelection = (): PayrollSheetSelectionInput => {
    const company = (companyRef.current?.value ?? companyInput).trim();
    const project = (projectRef.current?.value ?? projectInput).trim();
    const yearRaw = (yearRef.current?.value ?? yearInput).trim();
    if (company !== companyInput) onCompanyInputChange(company);
    if (project !== projectInput) onProjectInputChange(project);
    if (yearRaw !== yearInput) onYearInputChange(yearRaw);
    return { company, project, yearRaw };
  };

  const commitSelection = (action: (selection: PayrollSheetSelectionInput) => void) => {
    action(readSelection());
  };

  return (
    <div className="salaries-toolbar rounded-lg border border-slate-300 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Company
            <input
              ref={companyRef}
              type="text"
              name="payroll-company"
              list="salary-company-suggestions"
              value={companyInput}
              onChange={(e) => onCompanyInputChange(e.target.value)}
              onInput={(e) => onCompanyInputChange(e.currentTarget.value)}
              onBlur={(e) => onCompanyInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSelection(onLoadSheet);
                }
              }}
              placeholder="e.g. MC.Engg"
              className="min-w-[10rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <datalist id="salary-company-suggestions">
              {companies.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Project
            <input
              ref={projectRef}
              type="text"
              name="payroll-project"
              list="salary-project-suggestions"
              value={projectInput}
              onChange={(e) => onProjectInputChange(e.target.value)}
              onInput={(e) => onProjectInputChange(e.currentTarget.value)}
              onBlur={(e) => onProjectInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSelection(onLoadSheet);
                }
              }}
              placeholder="e.g. Maruti -1 Drydock"
              className="min-w-[12rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <datalist id="salary-project-suggestions">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Month
            <select
              value={month}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              className="min-w-[8.5rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 shadow-sm"
            >
              {MONTHS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Year
            <input
              ref={yearRef}
              type="number"
              name="payroll-year"
              list="salary-year-suggestions"
              min={2000}
              max={2100}
              value={yearInput}
              onChange={(e) => onYearInputChange(e.target.value)}
              onBlur={(e) => onYearInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSelection(onLoadSheet);
                }
              }}
              placeholder="e.g. 2026"
              className="min-w-[5.5rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <datalist id="salary-year-suggestions">
              {yearSuggestions.map((y) => (
                <option key={y} value={y} />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            onClick={() => commitSelection(onLoadSheet)}
            disabled={loadingSheet || creatingSheet}
            className="rounded border border-sky-700 bg-white px-4 py-2 text-sm font-semibold text-sky-800 shadow-sm hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingSheet ? 'Loading…' : sheetReady ? 'Reload Sheet' : 'Load Sheet'}
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => commitSelection(onCreateSheet)}
              disabled={loadingSheet || creatingSheet}
              className="rounded bg-sky-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingSheet ? 'Creating…' : 'Create Payroll Sheet'}
            </button>
          )}
          {sheetReady && (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Search
                <input
                  type="search"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Employee name…"
                  className="min-w-[10rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm shadow-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Designation
                <select
                  value={designationFilter}
                  onChange={(e) => onDesignationFilterChange(e.target.value)}
                  className="min-w-[8rem] rounded border border-slate-300 bg-white px-2.5 py-2 text-sm shadow-sm"
                >
                  <option value="">All</option>
                  {designations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
        {sheetReady && (
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={onAddEmployee}
                  className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
                >
                  Add Employee
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={!dirty || saving}
                  className="rounded bg-sky-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Attendance'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onShareAll}
              disabled={employeeCount === 0}
              className="rounded border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              title="Share attendance via WhatsApp / SMS"
            >
              Share All
            </button>
            <button
              type="button"
              onClick={onCopyAllMessages}
              disabled={employeeCount === 0}
              className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              title="Copy all attendance messages"
            >
              Copy Messages
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className="rounded border border-emerald-600 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
            >
              {exporting ? 'Preparing Excel…' : 'Export to Excel'}
            </button>
            <button
              type="button"
              onClick={onPrint}
              className="rounded border border-slate-400 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
            >
              Print
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {sheetReady ? (
          <>
            <span className="font-semibold text-sky-800">Add Employee</span> opens the registration form · Day cells:{' '}
            <span className="font-semibold text-emerald-700">P</span> ·{' '}
            <span className="font-semibold text-rose-700">A</span> ·{' '}
            <span className="font-semibold text-orange-600">H</span> ·{' '}
            <span className="font-semibold text-violet-700">P+OT</span> (enter hours) · Change company or project and
            click <span className="font-semibold">Reload Sheet</span> to switch
          </>
        ) : (
          <>
            Select <span className="font-semibold">Company</span> and <span className="font-semibold">Project</span>, then
            click <span className="font-semibold">Load Sheet</span> for an existing register or{' '}
            <span className="font-semibold">Create Payroll Sheet</span> to start a new one
          </>
        )}
      </p>
    </div>
  );
}
