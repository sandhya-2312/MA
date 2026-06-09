import type { PayrollAttendanceSummary, PayrollProjectAttendanceSummary } from '../../services/payrollApi.ts';
import { MONTH_OPTIONS } from '../../utils/payroll.ts';

type PayrollSummaryDashboardProps = {
  summary: PayrollAttendanceSummary | null;
  loading: boolean;
  onSelectProject: (project: PayrollProjectAttendanceSummary) => void;
};

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'emerald' | 'violet' | 'rose' | 'amber' | 'sky';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    violet: 'bg-violet-50 text-violet-900 border-violet-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    sky: 'bg-sky-50 text-sky-900 border-sky-200',
  };
  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-center ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}

function ProjectCard({
  project,
  onSelect,
}: {
  project: PayrollProjectAttendanceSummary;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full flex-col rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-800">{project.project}</h4>
          {project.company_name && (
            <p className="text-xs text-slate-500">{project.company_name}</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {project.employee_count} emp
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill label="Present" value={project.present_days} tone="emerald" />
        <StatPill label="OT Hrs" value={project.ot_hours} tone="violet" />
        <StatPill label="Absent" value={project.absent_days} tone="rose" />
        <StatPill label="Half Days" value={project.half_days} tone="amber" />
      </div>
      <p className="mt-3 text-xs font-medium text-sky-700 opacity-0 transition group-hover:opacity-100">
        Click to open payroll sheet →
      </p>
    </button>
  );
}

export function PayrollSummaryDashboard({ summary, loading, onSelectProject }: PayrollSummaryDashboardProps) {
  const monthLabel = summary
    ? MONTH_OPTIONS.find((m) => m.value === summary.month)?.label ?? String(summary.month)
    : '';

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-600">Loading attendance summary…</p>
      </div>
    );
  }

  if (!summary) return null;

  if (summary.projects.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          Attendance Overview — {monthLabel} {summary.year}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          No payroll sheets found for this month{summary.company_name ? ` (${summary.company_name})` : ''}.
          Create or load a sheet to begin tracking attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-slate-900">
          Attendance Overview — {monthLabel} {summary.year}
          {summary.company_name ? ` · ${summary.company_name}` : ''}
        </h3>
        <p className="mt-0.5 text-xs text-slate-600">
          Total employee-day marks across all projects. Click a project to open its payroll sheet.
        </p>
      </div>

      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:grid-cols-5 sm:px-5">
        <StatPill label="Employees" value={summary.total_employees} tone="sky" />
        <StatPill label="Total Present" value={summary.total_present_days} tone="emerald" />
        <StatPill label="Total OT Hrs" value={summary.total_ot_hours} tone="violet" />
        <StatPill label="Total Absent" value={summary.total_absent_days} tone="rose" />
        <StatPill label="Total Half Days" value={summary.total_half_days} tone="amber" />
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-5">
        {summary.projects.map((project) => (
          <ProjectCard
            key={project.module_id}
            project={project}
            onSelect={() => onSelectProject(project)}
          />
        ))}
      </div>
    </div>
  );
}
