import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PayrollEmployeeBody, PayrollEmployeeRow, PayrollModuleDetail } from '../../services/payrollApi.ts';
import {
  addPayrollEmployee,
  createPayrollModule,
  listPayrollLocations,
  resolvePayrollModule,
  deletePayrollEmployee,
  updatePayrollEmployee,
} from '../../services/payrollApi.ts';
import {
  attendanceForApi,
  emptyDay,
  nextAttendanceStatus,
  parseDayAttendance,
  serializeDay,
  type DayAttendance,
} from '../../utils/attendance.ts';
import { DEFAULT_PROJECTS, MONTH_OPTIONS, enrichEmployeeRow } from '../../utils/payroll.ts';
import {
  downloadPayrollCsv,
  preparePayrollExport,
  revokePayrollExportUrl,
  savePayrollExportWithPicker,
  tryAutoDownload,
} from '../../utils/payrollExport.ts';
import { printSalariesSheet } from '../../utils/payrollPrint.ts';
import type { Role } from '../../types';
import { Toast } from '../ui/Toast.tsx';
import { createEmptyAttendance, formToEmployeeBody, type EmployeeFormValues } from '../../utils/employeeForm.ts';
import { EmployeeFormModal } from './EmployeeFormModal.tsx';
import { SalariesToolbar } from './SalariesToolbar.tsx';
import { buildBulkShareText } from '../../utils/payrollShare.ts';
import { BulkShareModal } from './BulkShareModal.tsx';
import { PayslipModal } from './PayslipModal.tsx';
import { OtHoursPopup } from './OtHoursPopup.tsx';
import { SalaryAttendanceTable } from './SalaryAttendanceTable.tsx';

function employeeToBody(row: PayrollEmployeeRow): PayrollEmployeeBody {
  return {
    serial_no: row.serial_no,
    name: row.name,
    designation: row.designation,
    attendance: attendanceForApi(row.attendance),
    ot: row.ot,
    advance: row.advance,
    wage: row.wage,
    monthly_salary: row.monthly_salary ?? 0,
    food: row.food,
    remarks: row.remarks,
    contact_number: row.contact_number ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    project: row.project ?? null,
    joining_date: row.joining_date ?? null,
    bank_name: row.bank_name ?? null,
    account_number: row.account_number ?? null,
    ifsc_code: row.ifsc_code ?? null,
    upi_id: row.upi_id ?? null,
  };
}

type SalariesPageProps = {
  accessToken: string;
  role: Role;
  onStatus: (message: string) => void;
};

export function SalariesPage({ accessToken, role, onStatus }: SalariesPageProps) {
  const canEdit = role === 'Admin';
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [yearInput, setYearInput] = useState(String(now.getFullYear()));
  const [project, setProject] = useState(DEFAULT_PROJECTS[0]);
  const [projectInput, setProjectInput] = useState(DEFAULT_PROJECTS[0]);
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [detail, setDetail] = useState<PayrollModuleDetail | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);
  const [deleteConfirmEmployeeId, setDeleteConfirmEmployeeId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [exportDownload, setExportDownload] = useState<{ url: string; filename: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [employeeModalMode, setEmployeeModalMode] = useState<'add' | 'edit'>('add');
  const [editingEmployee, setEditingEmployee] = useState<PayrollEmployeeRow | null>(null);
  const [employeeFormSaving, setEmployeeFormSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');
  const [otPopup, setOtPopup] = useState<{ employeeId: number; day: number; hours: number } | null>(null);
  const [bulkShareOpen, setBulkShareOpen] = useState(false);
  const [payslipEmployee, setPayslipEmployee] = useState<PayrollEmployeeRow | null>(null);
  const exportUrlRef = useRef<string | null>(null);
  const exportNoticeRef = useRef<HTMLDivElement | null>(null);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const openAddEmployeeModal = () => {
    setEmployeeModalMode('add');
    setEditingEmployee(null);
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (row: PayrollEmployeeRow) => {
    if (!canEdit) return;
    setEmployeeModalMode('edit');
    setEditingEmployee(row);
    setEmployeeModalOpen(true);
  };

  const closeEmployeeModal = () => {
    if (employeeFormSaving) return;
    setEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

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
      setEmployees((resolved?.employees ?? []).map((r) => enrichEmployeeRow(r, resolved?.days_in_month ?? 0)));
      if (resolved?.location?.trim()) {
        setProject(resolved.location.trim());
        setProjectInput(resolved.location.trim());
      }
      if (resolved) {
        setYear(resolved.year);
        setYearInput(String(resolved.year));
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

  useEffect(() => {
    return () => revokePayrollExportUrl(exportUrlRef.current);
  }, []);

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
    setEmployees((rows) =>
      rows.map((r) =>
        r.id === employeeId ? enrichEmployeeRow({ ...r, ...patch }, detail?.days_in_month ?? 0) : r,
      ),
    );
    setDirty(true);
  };

  const setDayAttendance = (employeeId: number, day: number, dayAtt: DayAttendance) => {
    setEmployees((rows) =>
      rows.map((row) => {
        if (row.id !== employeeId) return row;
        const attendance = { ...(row.attendance ?? {}) };
        const key = String(day);
        const serialized = serializeDay(dayAtt);
        if (serialized) attendance[key] = serialized;
        else delete attendance[key];
        return enrichEmployeeRow({ ...row, attendance }, detail?.days_in_month ?? 0);
      }),
    );
    setDirty(true);
  };

  const handleDayClick = (employeeId: number, day: number) => {
    if (!canEdit) return;
    const row = employees.find((r) => r.id === employeeId);
    if (!row) return;
    const current = parseDayAttendance((row.attendance ?? {})[String(day)]);

    if (current.attendanceStatus === 'P+OT') {
      setOtPopup({ employeeId, day, hours: current.otHours });
      return;
    }

    const next = nextAttendanceStatus(current.attendanceStatus);
    if (next === 'P+OT') {
      setOtPopup({ employeeId, day, hours: 0 });
      return;
    }

    if (!next) setDayAttendance(employeeId, day, emptyDay());
    else setDayAttendance(employeeId, day, { attendanceStatus: next, otHours: 0 });
  };

  const confirmOtHours = (hours: number) => {
    if (!otPopup) return;
    setDayAttendance(otPopup.employeeId, otPopup.day, {
      attendanceStatus: 'P+OT',
      otHours: hours,
    });
    setOtPopup(null);
  };

  const clearOtDay = () => {
    if (!otPopup) return;
    setDayAttendance(otPopup.employeeId, otPopup.day, emptyDay());
    setOtPopup(null);
  };

  const handleSaveEmployeeForm = async (values: EmployeeFormValues) => {
    if (!detail || !canEdit) return;
    setEmployeeFormSaving(true);
    try {
      if (employeeModalMode === 'add') {
        const attendance = createEmptyAttendance(detail.days_in_month);
        const body = formToEmployeeBody(values, {
          serial_no: employees.length + 1,
          attendance,
          ot: '0',
        });
        const created = await addPayrollEmployee(accessToken, detail.id, body);
        setEmployees((rows) => [...rows, created]);
        setDetail({ ...detail, employees: [...employees, created] });
        setDirty(false);
        showToast('Employee added successfully');
        setEmployeeModalOpen(false);
        setEditingEmployee(null);
        onStatus('Employee added successfully');
      } else if (editingEmployee) {
        const body = formToEmployeeBody(values, {
          serial_no: editingEmployee.serial_no,
          attendance: editingEmployee.attendance ?? {},
          ot: editingEmployee.ot,
        });
        const saved = await updatePayrollEmployee(accessToken, editingEmployee.id, body);
        setEmployees((rows) => rows.map((r) => (r.id === saved.id ? saved : r)));
        setDetail({ ...detail, employees: employees.map((r) => (r.id === saved.id ? saved : r)) });
        setDirty(false);
        showToast('Employee updated successfully');
        setEmployeeModalOpen(false);
        setEditingEmployee(null);
        onStatus('Employee updated successfully');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save employee.';
      showToast(msg, 'error');
      onStatus(msg);
    } finally {
      setEmployeeFormSaving(false);
    }
  };

  const handleDeleteFromForm = () => {
    if (!editingEmployee) return;
    setEmployeeModalOpen(false);
    setDeleteConfirmEmployeeId(editingEmployee.id);
    setEditingEmployee(null);
  };

  const requestDeleteEmployee = (employeeId: number) => {
    if (!detail || !canEdit) return;
    setDeleteConfirmEmployeeId(employeeId);
  };

  const confirmDeleteEmployee = async (employeeId: number) => {
    setDeleteConfirmEmployeeId(null);
    setDeletingEmployeeId(employeeId);
    try {
      await deletePayrollEmployee(accessToken, employeeId);

      setEmployees((rows) => {
        const next = rows.filter((r) => r.id !== employeeId);
        // Keep S.No display contiguous after removing a row.
        return next.map((r, idx) => ({ ...r, serial_no: idx + 1 }));
      });
      setDirty(true);
      showToast('Employee removed');
      onStatus('Employee row removed.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not remove employee.');
    } finally {
      setDeletingEmployeeId(null);
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
    setExportNotice(null);
    revokePayrollExportUrl(exportUrlRef.current);
    exportUrlRef.current = null;
    setExportDownload(null);
    setExporting(true);
    try {
      const prepared = await preparePayrollExport(detail, employees);
      exportUrlRef.current = prepared.downloadUrl;
      setExportDownload({ url: prepared.downloadUrl, filename: prepared.filename });

      const savedWithPicker = await savePayrollExportWithPicker(prepared.blob, prepared.filename);
      if (!savedWithPicker) {
        tryAutoDownload(prepared.blob, prepared.filename);
      }

      const msg = savedWithPicker
        ? `Saved ${prepared.filename}.`
        : 'Excel ready — click the green button below to save the file.';
      setExportNotice(msg);
      onStatus(msg);
      requestAnimationFrame(() => {
        exportNoticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (error) {
      try {
        downloadPayrollCsv(detail, employees);
        const msg = 'Downloaded CSV fallback — open from Downloads (Ctrl+J).';
        setExportNotice(msg);
        onStatus(msg);
      } catch {
        const msg = error instanceof Error ? error.message : 'Export failed';
        setExportNotice(msg);
        onStatus(msg);
      }
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    if (dirty && canEdit) {
      const proceed = window.confirm('You have unsaved changes. Print anyway?');
      if (!proceed) return;
    }
    printSalariesSheet();
  };

  const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);

  const shareContext = useMemo(
    () => ({
      monthLabel,
      year,
      projectName: project,
      companyName: detail?.company_name ?? 'MC.Engg',
      daysInMonth: detail?.days_in_month ?? 0,
    }),
    [monthLabel, year, project, detail?.company_name, detail?.days_in_month],
  );

  const handleShareNotify = (message: string, variant: 'success' | 'error' = 'success') => {
    showToast(message, variant);
    onStatus(message);
  };

  const handleCopyAllMessages = async () => {
    if (!filteredRows.length) return;
    try {
      await navigator.clipboard.writeText(buildBulkShareText(filteredRows, shareContext));
      handleShareNotify(`Copied ${filteredRows.length} attendance message(s)`);
    } catch {
      handleShareNotify('Could not copy messages', 'error');
    }
  };

  const yearSuggestions = useMemo(() => {
    const base = year;
    return Array.from({ length: 7 }, (_, i) => base - 3 + i);
  }, [year]);

  const applySheetFilters = () => {
    let nextProject = project;
    const trimmedProject = projectInput.trim();
    if (!trimmedProject) {
      setProjectInput(project);
    } else if (trimmedProject !== project) {
      nextProject = trimmedProject;
      setProject(trimmedProject);
      setProjects((prev) => (prev.includes(trimmedProject) ? prev : [trimmedProject, ...prev]));
    }

    const parsedYear = Number.parseInt(yearInput.trim(), 10);
    if (!Number.isFinite(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      setYearInput(String(year));
      return;
    }

    const projectChanged = nextProject !== project;
    const yearChanged = parsedYear !== year;
    if (yearChanged) setYear(parsedYear);
    if (!projectChanged && !yearChanged) return;
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

      {exportNotice && (
        <div
          ref={exportNoticeRef}
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm ${
            exportNotice.startsWith('Export failed')
              ? 'border-rose-200 bg-rose-50 text-rose-900'
              : 'border-emerald-200 bg-emerald-50 text-emerald-900'
          }`}
        >
          <p>{exportNotice}</p>
          {exportDownload && !exportNotice.startsWith('Export failed') && (
            <p className="mt-2 text-xs text-emerald-800">
              Look for <strong>{exportDownload.filename}</strong> in your Downloads folder (Ctrl+J in Chrome).
            </p>
          )}
          {exportDownload && !exportNotice.startsWith('Export failed') && (
            <a
              href={exportDownload.url}
              download={exportDownload.filename}
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800"
            >
              Save {exportDownload.filename}
            </a>
          )}
        </div>
      )}

      <div className="salaries-toolbar-wrap">
        <SalariesToolbar
          month={month}
          yearInput={yearInput}
          yearSuggestions={yearSuggestions}
          projectInput={projectInput}
          projects={projects}
          search={search}
          designationFilter={designationFilter}
          designations={designations}
          canEdit={canEdit}
          dirty={dirty}
          saving={saving}
          onMonthChange={setMonth}
          onYearInputChange={setYearInput}
          onProjectInputChange={setProjectInput}
          onSheetApply={applySheetFilters}
          onSearchChange={setSearch}
          onDesignationFilterChange={setDesignationFilter}
          onAddEmployee={openAddEmployeeModal}
          onSave={() => void handleSave()}
          exporting={exporting}
          onExport={() => void handleExport()}
          onPrint={handlePrint}
          onShareAll={() => setBulkShareOpen(true)}
          onCopyAllMessages={() => void handleCopyAllMessages()}
          employeeCount={filteredRows.length}
        />
      </div>

      <div className="salaries-print-target">
        <div className="salaries-print-meta hidden">
          <p className="text-sm font-bold text-slate-900">{detail.title}</p>
          <p className="text-xs text-slate-600">
            {monthLabel} {year} · {project} · Printed {new Date().toLocaleString('en-IN')}
          </p>
        </div>
        <SalaryAttendanceTable
          detail={detail}
          month={month}
          year={year}
          rows={filteredRows}
          canEdit={canEdit}
          onDayClick={handleDayClick}
          onPatchRow={patchRow}
          onEditEmployee={openEditEmployeeModal}
          onDeleteEmployee={requestDeleteEmployee}
          deletingEmployeeId={deletingEmployeeId}
          shareContext={shareContext}
          onShareNotify={handleShareNotify}
          onOpenPayslip={setPayslipEmployee}
        />
      </div>

      {dirty && canEdit && (
        <p className="print:hidden text-xs font-medium text-amber-700">Unsaved changes — click Save Attendance before leaving.</p>
      )}

      <BulkShareModal
        open={bulkShareOpen}
        rows={filteredRows}
        shareContext={shareContext}
        onClose={() => setBulkShareOpen(false)}
        onNotify={handleShareNotify}
        onOpenPayslip={setPayslipEmployee}
      />

      <PayslipModal
        open={payslipEmployee !== null}
        row={payslipEmployee}
        shareContext={shareContext}
        onClose={() => setPayslipEmployee(null)}
      />

      <OtHoursPopup
        open={otPopup !== null}
        initialHours={otPopup?.hours ?? 0}
        onConfirm={confirmOtHours}
        onClearDay={clearOtDay}
        onCancel={() => setOtPopup(null)}
      />

      <EmployeeFormModal
        open={employeeModalOpen}
        mode={employeeModalMode}
        defaultProject={project}
        projects={projects}
        editingRow={editingEmployee}
        saving={employeeFormSaving}
        onClose={closeEmployeeModal}
        onSave={(values) => void handleSaveEmployeeForm(values)}
        onDelete={employeeModalMode === 'edit' ? handleDeleteFromForm : undefined}
      />

      <Toast message={toastMessage} variant={toastVariant} onDismiss={() => setToastMessage(null)} />

      {deleteConfirmEmployeeId !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            // Close only when clicking the overlay itself, not the modal content.
            if (e.target === e.currentTarget) setDeleteConfirmEmployeeId(null);
          }}
        >
          <div className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            {(() => {
              const row = employees.find((r) => r.id === deleteConfirmEmployeeId);
              const name = row?.name?.trim();
              return (
                <>
                  <h3 className="text-base font-bold text-slate-900">Remove employee?</h3>
                  <p className="mt-2 text-sm text-slate-700">
                    {name ? (
                      <>
                        Remove <span className="font-semibold">{name}</span>? This row will be deleted.
                      </>
                    ) : (
                      'This row will be deleted.'
                    )}
                  </p>
                </>
              );
            })()}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setDeleteConfirmEmployeeId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void confirmDeleteEmployee(deleteConfirmEmployeeId)}
                disabled={deletingEmployeeId !== null}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
