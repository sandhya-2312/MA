import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PayrollEmployeeBody, PayrollEmployeeRow, PayrollModuleDetail } from '../../services/payrollApi.ts';
import {
  addPayrollEmployee,
  createPayrollModule,
  exportPayrollModule,
  listPayrollLocations,
  resolvePayrollModule,
  updatePayrollEmployee,
} from '../../services/payrollApi.ts';
import { DEFAULT_PROJECTS, MONTH_OPTIONS, nextAttendanceCode } from '../../utils/payroll.ts';
import { downloadPayrollCsv } from '../../utils/payrollExport.ts';
import type { Role } from '../../types';
import { SalariesToolbar } from './SalariesToolbar.tsx';
import { SalaryAttendanceTable } from './SalaryAttendanceTable.tsx';

function employeeToBody(row: PayrollEmployeeRow): PayrollEmployeeBody {
  return {
    serial_no: row.serial_no,
    name: row.name,
    designation: row.designation,
    attendance: row.attendance ?? {},
    ot: row.ot,
    advance: row.advance,
    wage: row.wage,
    food: row.food,
    remarks: row.remarks,
  };
}

type SalariesPageProps = {
  accessToken: string;
  role: Role;
  onStatus: (message: string) => void;
};

export function SalariesPage({ accessToken, role, onStatus }: SalariesPageProps) {
  const canEdit = role === 'Admin' || role === 'User';
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [project, setProject] = useState(DEFAULT_PROJECTS[0]);
  const [projectInput, setProjectInput] = useState(DEFAULT_PROJECTS[0]);
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [detail, setDetail] = useState<PayrollModuleDetail | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');

  const loadSheet = useCallback(async () => {
    setLoading(true);
    try {
      const locRes = await listPayrollLocations(accessToken);
      setProjects(locRes.locations.length ? locRes.locations : DEFAULT_PROJECTS);

      let resolved = await resolvePayrollModule(accessToken, { month, year, location: project });
      if (!resolved && canEdit) {
        try {
          resolved = await createPayrollModule(accessToken, {
            month,
            year,
            location: project,
            company_name: 'MC.Engg',
          });
          onStatus(`Created salary sheet for ${MONTH_OPTIONS.find((m) => m.value === month)?.label} ${year}.`);
        } catch (createErr) {
          resolved = await resolvePayrollModule(accessToken, { month, year, location: project });
          if (!resolved) throw createErr;
        }
      }
      setDetail(resolved);
      setEmployees(resolved?.employees ?? []);
      if (resolved?.location?.trim()) {
        setProject(resolved.location.trim());
        setProjectInput(resolved.location.trim());
      }
      setDirty(false);
    } catch (error) {
      setDetail(null);
      setEmployees([]);
      onStatus(error instanceof Error ? error.message : 'Failed to load salary sheet.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, month, year, project, canEdit, onStatus]);

  useEffect(() => {
    void loadSheet();
  }, [loadSheet]);

  const designations = useMemo(() => {
    const set = new Set<string>();
    for (const row of employees) {
      const d = (row.designation ?? '').trim();
      if (d) set.add(d);
    }
    return [...set].sort();
  }, [employees]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((row) => {
      if (designationFilter && (row.designation ?? '') !== designationFilter) return false;
      if (q && !row.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, search, designationFilter]);

  const patchRow = (employeeId: number, patch: Partial<PayrollEmployeeRow>) => {
    setEmployees((rows) => rows.map((r) => (r.id === employeeId ? { ...r, ...patch } : r)));
    setDirty(true);
  };

  const toggleDay = (employeeId: number, day: number) => {
    if (!canEdit) return;
    setEmployees((rows) =>
      rows.map((row) => {
        if (row.id !== employeeId) return row;
        const attendance = { ...(row.attendance ?? {}) };
        const key = String(day);
        const next = nextAttendanceCode(attendance[key]);
        if (next) attendance[key] = next;
        else delete attendance[key];
        return { ...row, attendance };
      }),
    );
    setDirty(true);
  };

  const handleAddEmployee = async () => {
    if (!detail || !canEdit) return;
    try {
      const created = await addPayrollEmployee(accessToken, detail.id, {
        serial_no: employees.length + 1,
        name: 'New Employee',
        designation: 'Helper',
        attendance: {},
        advance: 0,
        wage: 0,
        ot: '0',
      });
      setEmployees((rows) => [...rows, created]);
      setDirty(false);
      onStatus('Employee row added.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not add employee.');
    }
  };

  const handleSave = async () => {
    if (!canEdit || !detail) return;
    setSaving(true);
    try {
      const updated: PayrollEmployeeRow[] = [];
      for (const row of employees) {
        const saved = await updatePayrollEmployee(accessToken, row.id, employeeToBody(row));
        updated.push(saved);
      }
      setEmployees(updated);
      setDetail({ ...detail, employees: updated });
      setDirty(false);
      onStatus('Attendance and salary entries saved.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!detail) return;
    try {
      await exportPayrollModule(accessToken, detail.id);
      onStatus('Export downloaded.');
    } catch {
      downloadPayrollCsv({ ...detail, employees });
      onStatus('Export downloaded (CSV).');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const applyProject = () => {
    const trimmed = projectInput.trim();
    if (!trimmed) {
      setProjectInput(project);
      return;
    }
    if (trimmed !== project) {
      setProject(trimmed);
      setProjects((prev) => (prev.includes(trimmed) ? prev : [trimmed, ...prev]));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading salary sheet…</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <p className="text-sm text-slate-600">No salary sheet available. Check API connection and permissions.</p>
      </div>
    );
  }

  return (
    <div className="salaries-page space-y-4 print:space-y-2">
      <header>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Salaries</h2>
        <p className="text-sm text-slate-600">Industrial payroll · attendance register · MC.Engg format</p>
      </header>

      <div className="salaries-toolbar-wrap">
        <SalariesToolbar
          month={month}
          year={year}
          projectInput={projectInput}
          projects={projects}
          search={search}
          designationFilter={designationFilter}
          designations={designations}
          canEdit={canEdit}
          dirty={dirty}
          saving={saving}
          onMonthChange={setMonth}
          onYearChange={setYear}
          onProjectInputChange={setProjectInput}
          onProjectApply={applyProject}
          onSearchChange={setSearch}
          onDesignationFilterChange={setDesignationFilter}
          onAddEmployee={() => void handleAddEmployee()}
          onSave={() => void handleSave()}
          onExport={() => void handleExport()}
          onPrint={handlePrint}
        />
      </div>

      <SalaryAttendanceTable
        detail={detail}
        rows={filteredRows}
        canEdit={canEdit}
        onToggleDay={toggleDay}
        onPatchRow={patchRow}
      />

      {dirty && canEdit && (
        <p className="print:hidden text-xs font-medium text-amber-700">Unsaved changes — click Save Attendance before leaving.</p>
      )}
    </div>
  );
}
