type SalariesToolbarProps = {
  month: number;
  yearInput: string;
  yearSuggestions: number[];
  projectInput: string;
  projects: string[];
  search: string;
  designationFilter: string;
  designations: string[];
  canEdit: boolean;
  dirty: boolean;
  saving: boolean;
  exporting: boolean;
  onMonthChange: (month: number) => void;
  onYearInputChange: (year: string) => void;
  onProjectInputChange: (project: string) => void;
  onSheetApply: () => void;
  onSearchChange: (value: string) => void;
  onDesignationFilterChange: (value: string) => void;
  onAddEmployee: () => void;
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function SalariesToolbar({
  month,
  yearInput,
  yearSuggestions,
  projectInput,
  projects,
  search,
  designationFilter,
  designations,
  canEdit,
  dirty,
  saving,
  exporting,
  onMonthChange,
  onYearInputChange,
  onProjectInputChange,
  onSheetApply,
  onSearchChange,
  onDesignationFilterChange,
  onAddEmployee,
  onSave,
  onExport,
  onPrint,
}: SalariesToolbarProps) {
  const commitSheet = () => onSheetApply();

  return (
    <div className="salaries-toolbar rounded-lg border border-slate-300 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-end gap-3">
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
              type="number"
              list="salary-year-suggestions"
              min={2000}
              max={2100}
              value={yearInput}
              onChange={(e) => onYearInputChange(e.target.value)}
              onBlur={commitSheet}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSheet();
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
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Project
            <input
              type="text"
              list="salary-project-suggestions"
              value={projectInput}
              onChange={(e) => onProjectInputChange(e.target.value)}
              onBlur={commitSheet}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSheet();
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
        </div>
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
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Click day cells to cycle: <span className="font-semibold text-emerald-700">P</span> Present ·{' '}
        <span className="font-semibold text-rose-700">A</span> Absent ·{' '}
        <span className="font-semibold text-amber-700">H</span> Half ·{' '}
        <span className="font-semibold text-violet-700">OT</span> Overtime day · Press{' '}
        <span className="font-semibold">Enter</span> or click away from Project / Year to load that sheet
      </p>
    </div>
  );
}
