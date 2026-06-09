import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PayrollEmployeeBody, PayrollEmployeeRow, PayrollModuleDetail, PayrollAttendanceSummary, PayrollProjectAttendanceSummary } from '../../services/payrollApi.ts';
import {
  addPayrollEmployee,
  createPayrollModule,
  deletePayrollModule,
  fetchPayrollAttendanceSummary,
  listPayrollCompanies,
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
import {
  DEFAULT_COMPANIES,
  DEFAULT_PROJECTS,
  MONTH_OPTIONS,
  buildPayrollModuleTitle,
  enrichEmployeeRow,
} from '../../utils/payroll.ts';
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
import { SalariesToolbar, type PayrollSheetSelectionInput } from './SalariesToolbar.tsx';
import { ApiError } from '../../services/apiClient.ts';
import { buildBulkShareText } from '../../utils/payrollShare.ts';
import { BulkShareModal } from './BulkShareModal.tsx';
import { PayslipModal } from './PayslipModal.tsx';
import { OtHoursPopup } from './OtHoursPopup.tsx';
import { SalaryAttendanceTable } from './SalaryAttendanceTable.tsx';
import { PayrollSummaryDashboard } from './PayrollSummaryDashboard.tsx';
import { IconArrowLeft } from '../actionIcons.tsx';

function employeeToBody(row: PayrollEmployeeRow): PayrollEmployeeBody {
  return {
    serial_no: row.serial_no,
    emp_id: row.emp_id ?? null,
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
    aadhar_number: row.aadhar_number ?? null,
    pan_number: row.pan_number ?? null,
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
  const [company, setCompany] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [companies, setCompanies] = useState<string[]>(DEFAULT_COMPANIES);
  const [project, setProject] = useState('');
  const [projectInput, setProjectInput] = useState('');
  const [projects, setProjects] = useState<string[]>(DEFAULT_PROJECTS);
  const [detail, setDetail] = useState<PayrollModuleDetail | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployeeRow[]>([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetNotFound, setSheetNotFound] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);
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
  const [attendanceSummary, setAttendanceSummary] = useState<PayrollAttendanceSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState<number | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<PayrollProjectAttendanceSummary | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      try {
        const locRes = await listPayrollLocations(accessToken);
        if (cancelled) return;
        setProjects(locRes.locations.length ? locRes.locations : DEFAULT_PROJECTS);

        try {
          const companyRes = await listPayrollCompanies(accessToken);
          if (!cancelled) {
            setCompanies(companyRes.companies.length ? companyRes.companies : DEFAULT_COMPANIES);
          }
        } catch {
          if (!cancelled) setCompanies(DEFAULT_COMPANIES);
        }
      } catch (error) {
        if (!cancelled) {
          onStatus(error instanceof Error ? error.message : 'Failed to load payroll options.');
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, onStatus]);

  const refreshAttendanceSummary = useCallback(async () => {
    const parsedYear = Number.parseInt(yearInput.trim(), 10);
    const summaryYear =
      Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : year;
    setLoadingSummary(true);
    try {
      const summary = await fetchPayrollAttendanceSummary(accessToken, {
        month,
        year: summaryYear,
      });
      setAttendanceSummary(summary);
    } catch {
      setAttendanceSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }, [accessToken, month, year, yearInput]);

  useEffect(() => {
    if (sheetVisible) return;
    void refreshAttendanceSummary();
  }, [sheetVisible, refreshAttendanceSummary]);

  const requestDeleteProject = (projectSummary: PayrollProjectAttendanceSummary) => {
    if (!canEdit) return;
    setDeleteConfirmProject(projectSummary);
  };

  const confirmDeleteProject = async () => {
    if (!deleteConfirmProject || !canEdit) return;
    const projectSummary = deleteConfirmProject;
    setDeletingModuleId(projectSummary.module_id);
    try {
      await deletePayrollModule(accessToken, projectSummary.module_id);
      if (detail?.id === projectSummary.module_id) {
        setSheetVisible(false);
        setDetail(null);
        setEmployees([]);
      }
      setDeleteConfirmProject(null);
      showToast('Payroll sheet deleted');
      onStatus('Payroll sheet deleted');
      await refreshAttendanceSummary();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not delete payroll sheet.';
      showToast(msg, 'error');
      onStatus(msg);
    } finally {
      setDeletingModuleId(null);
    }
  };

  const applyResolvedSheet = useCallback(
    (resolved: PayrollModuleDetail, companyName: string, projectName: string) => {
      setDetail(resolved);
      setEmployees((resolved.employees ?? []).map((r) => enrichEmployeeRow(r, resolved.days_in_month ?? 0)));
      setCompany(companyName);
      setCompanyInput(companyName);
      setProject(projectName);
      setProjectInput(projectName);
      setYear(resolved.year);
      setYearInput(String(resolved.year));
      setCompanies((prev) => (prev.includes(companyName) ? prev : [companyName, ...prev]));
      setProjects((prev) => (prev.includes(projectName) ? prev : [projectName, ...prev]));
      setSheetVisible(true);
      setSheetNotFound(false);
      setDirty(false);
    },
    [],
  );

  const loadSheet = useCallback(
    async (companyName: string, projectName: string, sheetYear: number) => {
      setLoadingSheet(true);
      setSheetNotFound(false);
      try {
        const resolved = await resolvePayrollModule(accessToken, {
          month,
          year: sheetYear,
          location: projectName,
          company_name: companyName,
        });
        if (!resolved) {
          setSheetVisible(false);
          setDetail(null);
          setEmployees([]);
          setSheetNotFound(true);
          const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);
          onStatus(
            `No payroll sheet for ${companyName} · ${projectName} (${monthLabel} ${sheetYear}). Create one manually.`,
          );
          return;
        }
        applyResolvedSheet(resolved, companyName, projectName);
      } catch (error) {
        setSheetVisible(false);
        setDetail(null);
        setEmployees([]);
        setSheetNotFound(false);
        onStatus(error instanceof Error ? error.message : 'Failed to load payroll sheet.');
      } finally {
        setLoadingSheet(false);
      }
    },
    [accessToken, month, applyResolvedSheet, onStatus],
  );

  const handleSelectProjectFromSummary = (projectSummary: PayrollProjectAttendanceSummary) => {
    const summaryYear = attendanceSummary?.year ?? year;
    const companyName = projectSummary.company_name || companyInput.trim() || company;
    setCompanyInput(companyName);
    setProjectInput(projectSummary.project);
    void loadSheet(companyName, projectSummary.project, summaryYear);
  };

  const createSheet = useCallback(
    async (companyName: string, projectName: string, sheetYear: number) => {
      if (!canEdit) return;
      setCreatingSheet(true);
      setSheetNotFound(false);
      try {
        const created = await createPayrollModule(accessToken, {
          month,
          year: sheetYear,
          location: projectName,
          company_name: companyName,
        });
        applyResolvedSheet(created, companyName, projectName);
        const monthLabel = MONTH_OPTIONS.find((m) => m.value === month)?.label ?? String(month);
        const msg = `Created payroll sheet for ${companyName} · ${projectName} (${monthLabel} ${sheetYear}).`;
        showToast(msg);
        onStatus(msg);
      } catch (error) {
        const isConflict =
          (error instanceof ApiError && error.status === 409) ||
          (error instanceof Error &&
            (error.message.includes('already exists') || error.message.includes('409')));
        if (isConflict) {
          const msg = 'Payroll sheet already exists — opening it now.';
          showToast(msg);
          onStatus(msg);
          await loadSheet(companyName, projectName, sheetYear);
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to create payroll sheet.';
        showToast(message, 'error');
        onStatus(message);
      } finally {
        setCreatingSheet(false);
      }
    },
    [accessToken, month, canEdit, applyResolvedSheet, loadSheet, onStatus],
  );

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
        const body = formToEmployeeBody(
          values,
          {
            serial_no: employees.length + 1,
            attendance,
            ot: '0',
          },
          detail.days_in_month,
        );
        const created = await addPayrollEmployee(accessToken, detail.id, body);
        const enriched = enrichEmployeeRow(created, detail.days_in_month);
        setEmployees((rows) => [...rows, enriched]);
        setDetail({ ...detail, employees: [...employees, enriched] });
        setDirty(false);
        showToast('Employee added successfully');
        setEmployeeModalOpen(false);
        setEditingEmployee(null);
        onStatus('Employee added successfully');
      } else if (editingEmployee) {
        const body = formToEmployeeBody(
          values,
          {
            serial_no: editingEmployee.serial_no,
            attendance: editingEmployee.attendance ?? {},
            ot: editingEmployee.ot,
          },
          detail.days_in_month,
        );
        const saved = await updatePayrollEmployee(accessToken, editingEmployee.id, body);
        const enriched = enrichEmployeeRow(saved, detail.days_in_month);
        setEmployees((rows) => rows.map((r) => (r.id === saved.id ? enriched : r)));
        setDetail({ ...detail, employees: employees.map((r) => (r.id === saved.id ? enriched : r)) });
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
      companyName: company || detail?.company_name || 'MC.Engg',
      daysInMonth: detail?.days_in_month ?? 0,
    }),
    [monthLabel, year, project, company, detail?.company_name, detail?.days_in_month],
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

  const parseSheetSelection = (raw: PayrollSheetSelectionInput) => {
    const trimmedCompany = raw.company.trim();
    const trimmedProject = raw.project.trim();
    setCompanyInput(trimmedCompany);
    setProjectInput(trimmedProject);
    setYearInput(raw.yearRaw.trim());
    if (!trimmedCompany || !trimmedProject) {
      const msg = 'Enter both company and project.';
      showToast(msg, 'error');
      onStatus(msg);
      return null;
    }
    const parsedYear = Number.parseInt(raw.yearRaw.trim(), 10);
    if (!Number.isFinite(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      setYearInput(String(year));
      const msg = 'Enter a valid year between 2000 and 2100.';
      showToast(msg, 'error');
      onStatus(msg);
      return null;
    }
    setYear(parsedYear);
    return { company: trimmedCompany, project: trimmedProject, year: parsedYear };
  };

  const handleLoadSheet = (raw: PayrollSheetSelectionInput) => {
    const selection = parseSheetSelection(raw);
    if (!selection) return;
    void loadSheet(selection.company, selection.project, selection.year);
  };

  const handleCreateSheet = (raw: PayrollSheetSelectionInput) => {
    if (!canEdit) return;
    const selection = parseSheetSelection(raw);
    if (!selection) return;
    void createSheet(selection.company, selection.project, selection.year);
  };

  const handleMonthChange = (nextMonth: number) => {
    setMonth(nextMonth);
    if (!sheetVisible || !company.trim() || !project.trim()) return;
    const parsedYear = Number.parseInt(yearInput.trim(), 10);
    const sheetYear =
      Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : year;
    void loadSheet(company, project, sheetYear);
  };

  const handleBackToDashboard = () => {
    if (dirty && canEdit && !window.confirm('You have unsaved attendance changes. Leave without saving?')) {
      return;
    }
    setSheetVisible(false);
    setDetail(null);
    setEmployees([]);
    setSheetNotFound(false);
    setDirty(false);
    setSearch('');
    setDesignationFilter('');
    setCompany('');
    setCompanyInput('');
    setProject('');
    setProjectInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (bootstrapping) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm font-medium text-slate-600">Loading payroll options…</p>
      </div>
    );
  }

  return (
    <div className="salaries-page space-y-4 print:space-y-2">
      <header>
        {sheetVisible && (
          <button
            type="button"
            onClick={handleBackToDashboard}
            className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900 print:hidden"
            title="Back to attendance overview"
          >
            <IconArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Payroll</h2>
          <p className="text-sm text-slate-600">
            {sheetVisible && detail
              ? `${buildPayrollModuleTitle(detail.month, detail.year, detail.location, detail.company_name)} · attendance register`
              : 'Industrial payroll · attendance register · select company and project to begin'}
          </p>
        </div>
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
          companyInput={companyInput}
          companies={companies}
          projectInput={projectInput}
          projects={projects}
          search={search}
          designationFilter={designationFilter}
          designations={designations}
          sheetReady={sheetVisible}
          loadingSheet={loadingSheet}
          creatingSheet={creatingSheet}
          canEdit={canEdit}
          dirty={dirty}
          saving={saving}
          onMonthChange={handleMonthChange}
          onYearInputChange={setYearInput}
          onCompanyInputChange={setCompanyInput}
          onProjectInputChange={setProjectInput}
          onLoadSheet={handleLoadSheet}
          onCreateSheet={handleCreateSheet}
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

      {!sheetVisible && (
        <PayrollSummaryDashboard
          summary={attendanceSummary}
          loading={loadingSummary}
          canEdit={canEdit}
          deletingModuleId={deletingModuleId}
          onSelectProject={handleSelectProjectFromSummary}
          onDeleteProject={requestDeleteProject}
        />
      )}

      {!sheetVisible && !loadingSheet && !creatingSheet && !loadingSummary && (attendanceSummary?.projects.length ?? 0) === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          {sheetNotFound ? (
            <>
              <p className="text-base font-semibold text-slate-800">No payroll sheet found</p>
              <p className="mt-2 text-sm text-slate-600">
                No sheet exists for <span className="font-semibold">{companyInput || company}</span> ·{' '}
                <span className="font-semibold">{projectInput || project}</span> (
                {MONTH_OPTIONS.find((m) => m.value === month)?.label} {yearInput}).
              </p>
              {canEdit ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateSheet({
                        company: companyInput || company,
                        project: projectInput || project,
                        yearRaw: yearInput,
                      })
                    }
                    disabled={creatingSheet || loadingSheet}
                    className="rounded bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingSheet ? 'Creating…' : 'Create Payroll Sheet'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleLoadSheet({
                        company: companyInput || company,
                        project: projectInput || project,
                        yearRaw: yearInput,
                      })
                    }
                    disabled={creatingSheet || loadingSheet}
                    className="rounded border border-sky-700 bg-white px-5 py-2.5 text-sm font-semibold text-sky-800 shadow-sm hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load Sheet
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Ask an admin to create the payroll sheet.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-base font-semibold text-slate-800">No payroll sheet loaded</p>
              <p className="mt-2 text-sm text-slate-600">
                Choose a company and project above, then click <span className="font-semibold">Load Sheet</span> to open an
                existing register
                {canEdit && (
                  <>
                    {' '}
                    or <span className="font-semibold">Create Payroll Sheet</span> to start a new one
                  </>
                )}
                .
              </p>
            </>
          )}
        </div>
      )}

      {(loadingSheet || creatingSheet) && !sheetVisible && (
        <div className="flex min-h-[10rem] items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-600">
            {creatingSheet ? 'Creating payroll sheet…' : 'Loading payroll sheet…'}
          </p>
        </div>
      )}

      {sheetVisible && detail && (
      <div className="salaries-print-target">
        <div className="salaries-print-meta hidden">
          <p className="text-sm font-bold text-slate-900">
            {buildPayrollModuleTitle(detail.month, detail.year, detail.location, detail.company_name)}
          </p>
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
      )}

      {sheetVisible && dirty && canEdit && (
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
        daysInMonth={detail?.days_in_month ?? 0}
        moduleYear={year}
        existingEmpIds={employees.map((e) => e.emp_id)}
        saving={employeeFormSaving}
        onClose={closeEmployeeModal}
        onSave={(values) => void handleSaveEmployeeForm(values)}
        onDelete={employeeModalMode === 'edit' ? handleDeleteFromForm : undefined}
      />

      <Toast message={toastMessage} variant={toastVariant} onDismiss={() => setToastMessage(null)} />

      {deleteConfirmProject !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && deletingModuleId === null) setDeleteConfirmProject(null);
          }}
        >
          <div className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
            <h3 className="text-base font-bold text-slate-900">Delete payroll sheet?</h3>
            <p className="mt-2 text-sm text-slate-700">
              Delete payroll sheet for{' '}
              <span className="font-semibold">
                {[deleteConfirmProject.company_name, deleteConfirmProject.project].filter(Boolean).join(' · ')}
              </span>
              ? This permanently removes all employees and attendance for{' '}
              <span className="font-semibold">
                {monthLabel} {attendanceSummary?.year ?? yearInput}
              </span>
              .
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setDeleteConfirmProject(null)}
                disabled={deletingModuleId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void confirmDeleteProject()}
                disabled={deletingModuleId !== null}
              >
                {deletingModuleId !== null ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
