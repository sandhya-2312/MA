import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AdminProjectsSection } from './AdminProjectsSection';
import { AllProjectsSummaryStrip } from './AllProjectsSummaryStrip';
import { ProjectSummaryPage } from './ProjectSummaryPage';
import {
  computeStoredMaterialWeightKg,
  CreateProjectForm,
  formatStoredMaterialDimensions,
  type CreateProjectPayload,
} from './CreateProjectForm';
import { MembersSection } from './MembersSection';
import { ProfilePage } from './ProfilePage';
import { UserProjectsSection } from './UserProjectsSection';
import { roleLabel } from '../roleLabel';
import type { NavTab, Project, ProjectEntry, Role, UserAccount } from '../types';

type UserEntryWithProject = ProjectEntry & { projectName: string };
type UserProjectBar = { id: number; name: string; count: number };

const navIconClass = 'h-4 w-4 shrink-0';

function IconNavDashboard() {
  return (
    <svg viewBox="0 0 24 24" className={navIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNavProjects() {
  return (
    <svg viewBox="0 0 24 24" className={navIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7h5l2-3h8a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNavMembers() {
  return (
    <svg viewBox="0 0 24 24" className={navIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconNavProfile() {
  return (
    <svg viewBox="0 0 24 24" className={navIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statIconMd = 'h-5 w-5 shrink-0';

function IconStatFolder() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7h5l2-3h8a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatUsersGroup() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatDocument() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatBars() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatWelding() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatClipboard() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const actionCardIconClass = 'h-6 w-6 shrink-0';

function IconActionUserPlus() {
  return (
    <svg viewBox="0 0 24 24" className={actionCardIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" strokeLinecap="round" />
    </svg>
  );
}

function IconActionFolderPlus() {
  return (
    <svg viewBox="0 0 24 24" className={actionCardIconClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7h5l2-3h8a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11v4m-2-2h4" strokeLinecap="round" />
    </svg>
  );
}

const iconEyeClass = 'h-4 w-4 shrink-0';

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" className={iconEyeClass} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const DONUT_COLORS = ['#14b8a6', '#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];
function sumEntryWeightKg(entries: ProjectEntry[]) {
  return entries.reduce((s, e) => s + (parseFloat(e.weight) || parseFloat(e.value) || 0), 0);
}

function sumEntryWeldingM(entries: ProjectEntry[]) {
  return entries.reduce((s, e) => s + (parseFloat(e.weldingMeters) || 0), 0);
}

function sumProjectMaterialWeightKg(project: Project): number {
  return (project.materials ?? []).reduce((sum, material) => sum + computeStoredMaterialWeightKg(material), 0);
}

/** Dimensions string for dashboard rows: prefer API meta, else legacy L×W×Thk. */
function entryDimensionsRaw(e: ProjectEntry): string {
  const d = e.dimensions?.trim();
  if (d) return d;
  const parts = [e.lengthMm, e.widthMm, e.thkDia].map((x) => String(x ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join('x') : '';
}

function entryDimensionsLabel(e: ProjectEntry): string {
  const raw = entryDimensionsRaw(e);
  if (!raw) return '—';
  return formatStoredMaterialDimensions(e.itemDetails ?? '', raw);
}

function entryWeightDisplayForRecent(e: ProjectEntry): string {
  const raw = entryDimensionsRaw(e);
  if (raw && e.itemDetails?.trim() && e.qty?.trim()) {
    const w = computeStoredMaterialWeightKg({
      name: e.itemDetails,
      dimensions: raw,
      quantity: e.qty,
    });
    if (w > 0) {
      return w.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  }
  const w = parseFloat(e.weight) || parseFloat(e.value) || 0;
  return w ? w.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
}

function earliestEntryDateYMD(entries: ProjectEntry[]): string {
  if (!entries.length) return '—';
  const times = entries.map((e) => new Date(e.createdAt).getTime()).filter((t) => !Number.isNaN(t));
  if (!times.length) return '—';
  return new Date(Math.min(...times)).toISOString().slice(0, 10);
}

function projectCreatedDisplay(project: Project): string {
  const fromEntries = earliestEntryDateYMD(project.entries);
  if (fromEntries !== '—') return fromEntries;
  return project.dateOfCommitment || project.plannedFinishDate || '—';
}

function projectSummaryStatusDisplay(project: Project): string {
  const raw = project.projectStatus?.trim();
  if (!raw) return 'Active';
  return raw;
}

function donutSegmentPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);
  const x3 = cx + innerR * Math.cos(endAngle);
  const y3 = cy + innerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(startAngle);
  const y4 = cy + innerR * Math.sin(startAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

type TonnageBarChartCardProps = {
  title: string;
  plannedWeightKg: number;
  actualWeightKg: number;
};

function TonnageBarChartCard({ title, plannedWeightKg, actualWeightKg }: TonnageBarChartCardProps) {
  const totalTonnage = Math.max(plannedWeightKg, 0) / 1000;
  const actualTonnage = Math.max(actualWeightKg, 0) / 1000;
  const maxValue = Math.max(totalTonnage, actualTonnage, 1) * 1.15;
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = maxValue * (1 - ratio);
    return { y: 18 + ratio * 64, value };
  });
  const totalBarHeight = (totalTonnage / maxValue) * 64;
  const actualBarHeight = (actualTonnage / maxValue) * 64;

  return (
    <article className="flex min-h-0 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] lg:col-span-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-3 text-[10px] text-slate-500">Total tonnage vs actual tonnage</p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <svg viewBox="0 0 100 88" className="h-40 w-full" role="img" aria-label="Total tonnage and actual tonnage bar chart">
          {yAxisTicks.map((tick) => (
            <g key={tick.y}>
              <line x1="14" y1={tick.y} x2="94" y2={tick.y} stroke="#cbd5e1" strokeWidth="0.5" />
              <text x="12" y={tick.y + 1.5} textAnchor="end" className="fill-slate-500" style={{ fontSize: '3px' }}>
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}
          <line x1="14" y1="82" x2="94" y2="82" stroke="#94a3b8" strokeWidth="0.7" />
          <rect x="36" y={82 - totalBarHeight} width="10" height={Math.max(totalBarHeight, 0)} rx="1.2" fill="#3b82f6" />
          <rect x="54" y={82 - actualBarHeight} width="10" height={Math.max(actualBarHeight, 0)} rx="1.2" fill="#10b981" />
          <text x="41" y="86" textAnchor="middle" className="fill-slate-600" style={{ fontSize: '3px' }}>
            Total
          </text>
          <text x="59" y="86" textAnchor="middle" className="fill-slate-600" style={{ fontSize: '3px' }}>
            Actual
          </text>
          <text x="41" y={Math.max(12, 80 - totalBarHeight)} textAnchor="middle" className="fill-slate-700" style={{ fontSize: '3px' }}>
            {totalTonnage.toFixed(2)}t
          </text>
          <text x="59" y={Math.max(12, 80 - actualBarHeight)} textAnchor="middle" className="fill-slate-700" style={{ fontSize: '3px' }}>
            {actualTonnage.toFixed(2)}t
          </text>
        </svg>
        <div className="mt-1 flex items-center justify-center gap-4 text-[10px] text-slate-700">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500" />
            Total Tonnage
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" />
            Actual Tonnage
          </span>
        </div>
      </div>
    </article>
  );
}

type DashboardPageProps = {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  summaryProjectId: number | null;
  openProjectSummary: (projectId: number) => void;
  closeProjectSummary: () => void;
  navButtonClass: (tab: NavTab) => string;
  isAdmin: boolean;
  loggedInUser: UserAccount;
  setSessionUserId: (id: number | null) => void;
  totalProjects: number;
  totalMembers: number;
  visibleProjects: Project[];
  userSubmissionCount: number;
  latestUserEntry: ProjectEntry | undefined;
  viewerActiveUsers: number;
  viewerCompletionRate: number;
  viewerTrendMonths: string[];
  viewerTrendValues: number[];
  viewerTrendMax: number;
  viewerTrendPoints: string;
  viewerActivityMonths: string[];
  viewerActivityValues: number[];
  viewerActivityMax: number;
  viewerActivityPoints: string;
  projects: Project[];
  handleCreateUser: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
  handleCreateProject: (payload: CreateProjectPayload) => Promise<boolean>;
  handleCreateUserProjectEntry: (payload: {
    projectId: number;
    areaSection: string;
    materialName: string;
    dimensions: string;
    quantity: string;
    weldingMeters: string;
    remarks: string;
  }) => Promise<void>;
  userTrendEntries: UserEntryWithProject[];
  userTrendValues: number[];
  userTrendMax: number;
  userTrendPoints: string;
  userActivityMonths: string[];
  userActivityValues: number[];
  userActivityMax: number;
  userActivityPoints: string;
  userProjectBars: UserProjectBar[];
  userProjectBarMax: number;
  users: UserAccount[];
  showProjectCreateForm: boolean;
  setShowProjectCreateForm: (updater: (current: boolean) => boolean) => void;
  handleUpdateProject: (projectId: number, payload: CreateProjectPayload) => Promise<boolean>;
  handleDeleteProject: (projectId: number) => void;
  showMemberCreateForm: boolean;
  setShowMemberCreateForm: (updater: (current: boolean) => boolean) => void;
  editingMemberId: number | null;
  editFullName: string;
  setEditFullName: (value: string) => void;
  editUsername: string;
  setEditUsername: (value: string) => void;
  editEmail: string;
  setEditEmail: (value: string) => void;
  editContactNo: string;
  setEditContactNo: (value: string) => void;
  editDesignation: string;
  setEditDesignation: (value: string) => void;
  editAssignedOn: string;
  setEditAssignedOn: (value: string) => void;
  editRole: Role;
  setEditRole: (value: Role) => void;
  editProjectIds: number[];
  handleToggleEditProject: (projectId: number) => void;
  handleStartEditMember: (member: UserAccount) => void;
  handleSaveMemberEdit: (memberId: number) => void;
  setEditingMemberId: (value: number | null) => void;
  handleDeleteMember: (memberId: number) => void;
  handleSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
  status: string;
  handleUpdateUserProjectEntry: (
    projectId: number,
    entryIndex: number,
    updates: Pick<
      ProjectEntry,
      'projectType' | 'areaSection' | 'itemDetails' | 'lengthMm' | 'widthMm' | 'thkDia' | 'densityKgM3' | 'qty' | 'weldingMeters' | 'remarks'
    >,
  ) => void;
  adminProjectsPageSummary: { totalProjects: number; totalEntries: number; activeMembers: number } | null;
  adminProjectSearch: string;
  setAdminProjectSearch: (value: string | ((prev: string) => string)) => void;
  onAdminProjectSearch: () => Promise<void>;
  onClearAdminProjectSearch: () => Promise<void>;
  onDeleteProjectEntry: (projectId: number, dataId: number) => Promise<void>;
  onExportProjectReport: (projectId: number) => Promise<void>;
};

export function DashboardPage({
  activeTab,
  setActiveTab,
  summaryProjectId,
  openProjectSummary,
  closeProjectSummary,
  navButtonClass,
  isAdmin,
  loggedInUser,
  setSessionUserId,
  totalProjects,
  totalMembers,
  visibleProjects,
  userSubmissionCount,
  latestUserEntry,
  viewerActiveUsers,
  viewerCompletionRate,
  viewerTrendMonths,
  viewerTrendValues,
  viewerTrendMax,
  viewerTrendPoints,
  viewerActivityMonths,
  viewerActivityValues,
  viewerActivityMax,
  viewerActivityPoints,
  projects,
  handleCreateUser,
  handleCreateProject,
  handleCreateUserProjectEntry,
  userTrendEntries,
  userTrendValues,
  userTrendMax,
  userTrendPoints,
  userActivityMonths,
  userActivityValues,
  userActivityMax,
  userActivityPoints,
  userProjectBars,
  userProjectBarMax,
  users,
  showProjectCreateForm,
  setShowProjectCreateForm,
  handleUpdateProject,
  handleDeleteProject,
  showMemberCreateForm,
  setShowMemberCreateForm,
  editingMemberId,
  editFullName,
  setEditFullName,
  editUsername,
  setEditUsername,
  editEmail,
  setEditEmail,
  editContactNo,
  setEditContactNo,
  editDesignation,
  setEditDesignation,
  editAssignedOn,
  setEditAssignedOn,
  editRole,
  setEditRole,
  editProjectIds,
  handleToggleEditProject,
  handleStartEditMember,
  handleSaveMemberEdit,
  setEditingMemberId,
  handleDeleteMember,
  handleSaveProfile,
  status,
  handleUpdateUserProjectEntry,
  adminProjectsPageSummary,
  adminProjectSearch,
  setAdminProjectSearch,
  onAdminProjectSearch,
  onClearAdminProjectSearch,
  onDeleteProjectEntry,
  onExportProjectReport,
}: DashboardPageProps) {
  const [showDashboardCreateUser, setShowDashboardCreateUser] = useState(false);
  const [showDashboardCreateProject, setShowDashboardCreateProject] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [requestedAdminEditProjectId, setRequestedAdminEditProjectId] = useState<number | null>(null);
  const [requestedUserProjectId, setRequestedUserProjectId] = useState<number | null>(null);
  const [projectFilterId, setProjectFilterId] = useState<number | 'all'>('all');
  const [productionRange, setProductionRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [productionDateFrom, setProductionDateFrom] = useState<string>('');
  const [productionDateTo, setProductionDateTo] = useState<string>('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const parseEntryTimeMs = (raw: string): number => {
    const t = Date.parse(raw);
    return Number.isNaN(t) ? NaN : t;
  };

  const accessibleProjectsForFilter = useMemo(() => {
    const base = isAdmin ? projects : visibleProjects;
    return [...base].sort((a, b) => a.id - b.id);
  }, [isAdmin, projects, visibleProjects]);

  const filteredAdminProjects = useMemo(() => {
    if (!isAdmin) return [];
    if (projectFilterId === 'all') return projects;
    return projects.filter((p) => p.id === projectFilterId);
  }, [isAdmin, projects, projectFilterId]);

  const filteredVisibleProjects = useMemo(() => {
    if (projectFilterId === 'all') return visibleProjects;
    return visibleProjects.filter((p) => p.id === projectFilterId);
  }, [visibleProjects, projectFilterId]);

  const productionStats = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const fromRaw = productionDateFrom.trim();
    const toRaw = productionDateTo.trim();
    const hasCustomRange = !!(fromRaw || toRaw);
    const fromMs = fromRaw ? Date.parse(`${fromRaw}T00:00:00`) : NaN;
    // inclusive end date: add one day and use < endExclusive
    const toExclusiveMs = toRaw ? Date.parse(`${toRaw}T00:00:00`) + dayMs : NaN;
    const since =
      !hasCustomRange
        ? productionRange === 'daily'
          ? now - dayMs
          : productionRange === 'weekly'
            ? now - 7 * dayMs
            : now - 30 * dayMs
        : NaN;

    const baseProjects = loggedInUser.role === 'Admin' ? filteredAdminProjects : filteredVisibleProjects;
    const entries = baseProjects.flatMap((p) => p.entries);
    const scopedEntries =
      loggedInUser.role === 'User' ? entries.filter((e) => e.user === loggedInUser.username) : entries;

    const recent = scopedEntries.filter((e) => {
      const t = parseEntryTimeMs(e.createdAt);
      if (Number.isNaN(t)) return false;
      if (hasCustomRange) {
        if (!Number.isNaN(fromMs) && t < fromMs) return false;
        if (!Number.isNaN(toExclusiveMs) && t >= toExclusiveMs) return false;
        return true;
      }
      return t >= since;
    });

    return {
      entryCount: recent.length,
      weightKg: sumEntryWeightKg(recent),
      weldingM: sumEntryWeldingM(recent),
      hasCustomRange,
    };
  }, [
    productionRange,
    productionDateFrom,
    productionDateTo,
    loggedInUser.role,
    loggedInUser.username,
    filteredAdminProjects,
    filteredVisibleProjects,
  ]);

  const summaryProject =
    summaryProjectId != null ? (visibleProjects.find((p) => p.id === summaryProjectId) ?? null) : null;

  const pageTitle =
    activeTab === 'projectSummary'
      ? ''
      : activeTab === 'dashboard'
          ? 'Metal Works Control Center'
          : activeTab === 'projects'
            ? isAdmin || loggedInUser.role === 'Viewer'
              ? ''
              : 'My Projects'
            : activeTab === 'members'
              ? 'Members'
              : 'Profile';

  const headerDisplayName =
    loggedInUser.role === 'Admin' ? 'Admin' : loggedInUser.fullName?.trim() || loggedInUser.username;

  const avatarLetter = (loggedInUser.fullName?.trim() || loggedInUser.username).slice(0, 1).toUpperCase();

  const closeMobileNav = () => setMobileNavOpen(false);

  const toggleHamburger = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setMobileNavOpen((open) => !open);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  };

  const adminTotalEntries =
    projectFilterId === 'all'
      ? (adminProjectsPageSummary?.totalEntries ?? projects.reduce((sum, p) => sum + p.entries.length, 0))
      : filteredAdminProjects.reduce((sum, p) => sum + p.entries.length, 0);
  const adminTotalWeight = useMemo(
    () => filteredAdminProjects.reduce((sum, p) => sum + sumProjectMaterialWeightKg(p), 0),
    [filteredAdminProjects],
  );
  const adminTotalWelding = useMemo(
    () =>
      filteredAdminProjects.reduce(
        (sum, p) => sum + p.entries.reduce((s, e) => s + (parseFloat(e.weldingMeters) || 0), 0),
        0,
      ),
    [filteredAdminProjects],
  );

  const adminProjectSummaryRows = useMemo(
    () =>
      filteredAdminProjects.map((p) => ({
        id: p.id,
        name: p.name,
        entryCount: p.entries.length,
        weightKg: sumProjectMaterialWeightKg(p),
        weldingM: sumEntryWeldingM(p.entries),
        createdOn: projectCreatedDisplay(p),
        statusLabel: projectSummaryStatusDisplay(p),
      })),
    [filteredAdminProjects],
  );

  const adminWeightDonut = useMemo(() => {
    type Slice = {
      key: string;
      name: string;
      weight: number;
      pct: number;
      color: string;
      path: string;
      labelX: number;
      labelY: number;
      midAngle: number;
    };
    const rows = filteredAdminProjects.map((p, index) => ({
      index,
      id: p.id,
      name: p.name,
      weight: sumEntryWeightKg(p.entries),
    }));
    const totalW = rows.reduce((s, r) => s + r.weight, 0);
    if (totalW <= 0) {
      return { totalW: 0, slices: [] as Slice[] };
    }
    const cx = 50;
    const cy = 50;
    const innerR = 28;
    const outerR = 42;
    const labelR = 56;
    const nonZero = rows.filter((r) => r.weight > 0);
    const slices: Slice[] = [];

    if (nonZero.length === 1) {
      const row = nonZero[0];
      const color = DONUT_COLORS[row.index % DONUT_COLORS.length];
      const path = `${donutSegmentPath(cx, cy, innerR, outerR, -Math.PI / 2, Math.PI / 2)} ${donutSegmentPath(cx, cy, innerR, outerR, Math.PI / 2, (3 * Math.PI) / 2)}`;
      const midAngle = -Math.PI / 2;
      slices.push({
        key: `${row.id}`,
        name: row.name,
        weight: row.weight,
        pct: 100,
        color,
        path,
        labelX: cx + labelR * Math.cos(midAngle),
        labelY: cy + labelR * Math.sin(midAngle),
        midAngle,
      });
      return { totalW, slices };
    }

    let angle = -Math.PI / 2;
    nonZero.forEach((row) => {
      const frac = row.weight / totalW;
      const span = frac * 2 * Math.PI;
      const start = angle;
      const end = angle + span;
      const color = DONUT_COLORS[row.index % DONUT_COLORS.length];
      const path = donutSegmentPath(cx, cy, innerR, outerR, start, end);
      const midAngle = start + span / 2;
      slices.push({
        key: `${row.id}`,
        name: row.name,
        weight: row.weight,
        pct: frac * 100,
        color,
        path,
        labelX: cx + labelR * Math.cos(midAngle),
        labelY: cy + labelR * Math.sin(midAngle),
        midAngle,
      });
      angle = end;
    });
    return { totalW, slices };
  }, [filteredAdminProjects]);

  const adminRecentEntries = useMemo(() => {
    type Flat = {
      key: string;
      projectId: number;
      projectName: string;
      areaSection: string;
      materialName: string;
      dimensionsDisplay: string;
      qty: string;
      weightDisplay: string;
      welding: string;
      remarks: string;
      sortTime: number;
    };
    const flat: Flat[] = filteredAdminProjects.flatMap((p) =>
      p.entries.map((e, idx) => ({
        key: `${p.id}-${e.dataId ?? idx}-${idx}`,
        projectId: p.id,
        projectName: p.name,
        areaSection: e.areaSection.trim(),
        materialName: e.itemDetails.trim(),
        dimensionsDisplay: entryDimensionsLabel(e),
        qty: e.qty.trim(),
        weightDisplay: entryWeightDisplayForRecent(e),
        welding: e.weldingMeters.trim() || '—',
        remarks: e.remarks.trim() || '—',
        sortTime: Date.parse(e.createdAt) || 0,
      })),
    );
    flat.sort((a, b) => b.sortTime - a.sortTime);
    const rows = flat.slice(0, 12);
    const projectNames = new Set(rows.map((r) => r.projectName));
    const titleSuffix =
      projectNames.size === 1 && rows.length > 0 ? ` — ${rows[0].projectName}` : '';
    const showProjectColumn = projectNames.size > 1;
    return { rows, titleSuffix, showProjectColumn };
  }, [filteredAdminProjects]);

  const userProjectSummaryRows = useMemo(
    () =>
      filteredVisibleProjects.map((p) => {
        const mine = p.entries.filter((e) => e.user === loggedInUser.username);
        return {
          id: p.id,
          name: p.name,
          entryCount: mine.length,
          weightKg: sumEntryWeightKg(mine),
          weldingM: sumEntryWeldingM(mine),
          createdOn: earliestEntryDateYMD(mine),
          statusLabel: projectSummaryStatusDisplay(p),
        };
      }),
    [filteredVisibleProjects, loggedInUser.username],
  );

  const userTotalWeight = useMemo(
    () => filteredVisibleProjects.reduce((sum, project) => sum + sumProjectMaterialWeightKg(project), 0),
    [filteredVisibleProjects],
  );

  const userTotalWelding = useMemo(
    () =>
      filteredVisibleProjects.reduce(
        (sum, project) => sum + project.entries.reduce((entrySum, entry) => entrySum + (parseFloat(entry.weldingMeters) || 0), 0),
        0,
      ),
    [filteredVisibleProjects],
  );

  const userRecentEntries = useMemo(() => {
    type Flat = {
      key: string;
      projectId: number;
      projectName: string;
      areaSection: string;
      materialName: string;
      dimensionsDisplay: string;
      qty: string;
      weightDisplay: string;
      welding: string;
      remarks: string;
      sortTime: number;
    };
    const flat: Flat[] = filteredVisibleProjects.flatMap((p) =>
      p.entries
        .filter((e) => e.user === loggedInUser.username)
        .map((e, idx) => ({
          key: `${p.id}-${e.dataId ?? idx}-${idx}`,
          projectId: p.id,
          projectName: p.name,
          areaSection: e.areaSection.trim(),
          materialName: e.itemDetails.trim(),
          dimensionsDisplay: entryDimensionsLabel(e),
          qty: e.qty.trim(),
          weightDisplay: entryWeightDisplayForRecent(e),
          welding: e.weldingMeters.trim() || '—',
          remarks: e.remarks.trim() || '—',
          sortTime: Date.parse(e.createdAt) || 0,
        })),
    );
    flat.sort((a, b) => b.sortTime - a.sortTime);
    const rows = flat.slice(0, 12);
    const projectNames = new Set(rows.map((r) => r.projectName));
    const titleSuffix =
      projectNames.size === 1 && rows.length > 0 ? ` — ${rows[0].projectName}` : '';
    const showProjectColumn = projectNames.size > 1;
    return { rows, titleSuffix, showProjectColumn };
  }, [filteredVisibleProjects, loggedInUser.username]);

  const viewerProjectSummaryRows = useMemo(
    () =>
      filteredVisibleProjects.map((p) => ({
        id: p.id,
        name: p.name,
        entryCount: p.entries.length,
        weightKg: sumProjectMaterialWeightKg(p),
        weldingM: sumEntryWeldingM(p.entries),
        createdOn: projectCreatedDisplay(p),
        statusLabel: projectSummaryStatusDisplay(p),
      })),
    [filteredVisibleProjects],
  );

  const viewerTotalEntries = useMemo(
    () => filteredVisibleProjects.reduce((sum, p) => sum + p.entries.length, 0),
    [filteredVisibleProjects],
  );

  const viewerTotalWeight = useMemo(
    () => filteredVisibleProjects.reduce((sum, p) => sum + sumProjectMaterialWeightKg(p), 0),
    [filteredVisibleProjects],
  );

  const viewerTotalWelding = useMemo(
    () =>
      filteredVisibleProjects.reduce(
        (sum, p) => sum + p.entries.reduce((s, e) => s + (parseFloat(e.weldingMeters) || 0), 0),
        0,
      ),
    [filteredVisibleProjects],
  );

  const viewerWeightDonut = useMemo(() => {
    type Slice = {
      key: string;
      name: string;
      weight: number;
      pct: number;
      color: string;
      path: string;
      labelX: number;
      labelY: number;
      midAngle: number;
    };
    const rows = filteredVisibleProjects.map((p, index) => ({
      index,
      id: p.id,
      name: p.name,
      weight: sumEntryWeightKg(p.entries),
    }));
    const totalW = rows.reduce((s, r) => s + r.weight, 0);
    if (totalW <= 0) {
      return { totalW: 0, slices: [] as Slice[] };
    }
    const cx = 50;
    const cy = 50;
    const innerR = 28;
    const outerR = 42;
    const labelR = 56;
    const nonZero = rows.filter((r) => r.weight > 0);
    const slices: Slice[] = [];

    if (nonZero.length === 1) {
      const row = nonZero[0];
      const color = DONUT_COLORS[row.index % DONUT_COLORS.length];
      const path = `${donutSegmentPath(cx, cy, innerR, outerR, -Math.PI / 2, Math.PI / 2)} ${donutSegmentPath(cx, cy, innerR, outerR, Math.PI / 2, (3 * Math.PI) / 2)}`;
      const midAngle = -Math.PI / 2;
      slices.push({
        key: `${row.id}`,
        name: row.name,
        weight: row.weight,
        pct: 100,
        color,
        path,
        labelX: cx + labelR * Math.cos(midAngle),
        labelY: cy + labelR * Math.sin(midAngle),
        midAngle,
      });
      return { totalW, slices };
    }

    let angle = -Math.PI / 2;
    nonZero.forEach((row) => {
      const frac = row.weight / totalW;
      const span = frac * 2 * Math.PI;
      const start = angle;
      const end = angle + span;
      const color = DONUT_COLORS[row.index % DONUT_COLORS.length];
      const path = donutSegmentPath(cx, cy, innerR, outerR, start, end);
      const midAngle = start + span / 2;
      slices.push({
        key: `${row.id}`,
        name: row.name,
        weight: row.weight,
        pct: frac * 100,
        color,
        path,
        labelX: cx + labelR * Math.cos(midAngle),
        labelY: cy + labelR * Math.sin(midAngle),
        midAngle,
      });
      angle = end;
    });
    return { totalW, slices };
  }, [filteredVisibleProjects]);

  const viewerRecentEntries = useMemo(() => {
    type Flat = {
      key: string;
      projectId: number;
      projectName: string;
      areaSection: string;
      materialName: string;
      dimensionsDisplay: string;
      qty: string;
      weightDisplay: string;
      welding: string;
      remarks: string;
      sortTime: number;
    };
    const flat: Flat[] = filteredVisibleProjects.flatMap((p) =>
      p.entries.map((e, idx) => ({
        key: `${p.id}-${e.dataId ?? idx}-${idx}`,
        projectId: p.id,
        projectName: p.name,
        areaSection: e.areaSection.trim(),
        materialName: e.itemDetails.trim(),
        dimensionsDisplay: entryDimensionsLabel(e),
        qty: e.qty.trim(),
        weightDisplay: entryWeightDisplayForRecent(e),
        welding: e.weldingMeters.trim() || '—',
        remarks: e.remarks.trim() || '—',
        sortTime: Date.parse(e.createdAt) || 0,
      })),
    );
    flat.sort((a, b) => b.sortTime - a.sortTime);
    const rows = flat.slice(0, 12);
    const projectNames = new Set(rows.map((r) => r.projectName));
    const titleSuffix =
      projectNames.size === 1 && rows.length > 0 ? ` — ${rows[0].projectName}` : '';
    const showProjectColumn = projectNames.size > 1;
    return { rows, titleSuffix, showProjectColumn };
  }, [filteredVisibleProjects]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const el = userMenuRef.current;
      if (el && !el.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!showDashboardCreateUser && !showDashboardCreateProject) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDashboardCreateUser(false);
        setShowDashboardCreateProject(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showDashboardCreateUser, showDashboardCreateProject]);

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-slate-100 font-sans">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 shrink-0 border-b border-slate-100/90 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <div className="px-3 py-3 sm:px-4 sm:py-3.5 md:px-6 md:py-4">
              <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold tracking-tight text-white">
                      MW
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-slate-800">Metal Works</p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-row items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
                    aria-label="Notifications"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <div className="relative" ref={userMenuRef}>
                    <button
                      type="button"
                      onClick={() => setUserMenuOpen((open) => !open)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 py-0.5 pl-0.5 pr-2 transition hover:bg-slate-100 sm:gap-2 sm:pr-2.5"
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {avatarLetter}
                      </span>
                      <span className="hidden max-w-[7rem] truncate text-[10px] font-medium leading-none text-slate-800 sm:inline sm:text-[11px]">
                        {headerDisplayName}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition ${userMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    {userMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
                      >
                        <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{loggedInUser.username}</span>
                          <span className="block text-slate-400">{roleLabel(loggedInUser.role)}</span>
                        </p>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                          onClick={() => {
                            setActiveTab('profile');
                            setUserMenuOpen(false);
                          }}
                        >
                          Profile
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="flex w-full px-4 py-2.5 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setSessionUserId(null);
                          }}
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside
              className={`z-20 hidden min-h-0 shrink-0 flex-col self-stretch overflow-hidden border-r border-slate-200/90 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.05)] md:flex md:flex-col ${sidebarCollapsed ? 'md:w-16' : 'md:w-52'}`}
            >
              <div className={`hidden shrink-0 px-2 pt-3 md:flex ${sidebarCollapsed ? 'md:justify-center' : 'md:justify-end'}`}>
                <button
                  type="button"
                  onClick={toggleHamburger}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-100"
                  aria-label="Collapse sidebar"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-3 pt-3">
                <button type="button" onClick={() => setActiveTab('dashboard')} className={navButtonClass('dashboard')}>
                  <span className={`inline-flex items-center gap-2 ${sidebarCollapsed ? 'w-full justify-center' : ''}`}>
                    <IconNavDashboard />
                    {!sidebarCollapsed && 'Dashboard'}
                  </span>
                </button>
                <button type="button" onClick={() => setActiveTab('projects')} className={navButtonClass('projects')}>
                  <span className={`inline-flex items-center gap-2 ${sidebarCollapsed ? 'w-full justify-center' : ''}`}>
                    <IconNavProjects />
                    {!sidebarCollapsed && (isAdmin || loggedInUser.role === 'Viewer' ? 'All Projects' : 'My Projects')}
                  </span>
                </button>
                {isAdmin && (
                  <button type="button" onClick={() => setActiveTab('members')} className={navButtonClass('members')}>
                    <span className={`inline-flex items-center gap-2 ${sidebarCollapsed ? 'w-full justify-center' : ''}`}>
                      <IconNavMembers />
                      {!sidebarCollapsed && 'Members'}
                    </span>
                  </button>
                )}
                <button type="button" onClick={() => setActiveTab('profile')} className={navButtonClass('profile')}>
                  <span className={`inline-flex items-center gap-2 ${sidebarCollapsed ? 'w-full justify-center' : ''}`}>
                    <IconNavProfile />
                    {!sidebarCollapsed && 'Profile'}
                  </span>
                </button>
              </nav>

              <div className="mt-auto shrink-0 border-t border-slate-200/90 px-3 pb-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSessionUserId(null)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {!sidebarCollapsed && 'Log out'}
                </button>
              </div>
            </aside>

        {mobileNavOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
              aria-label="Close menu"
              onClick={closeMobileNav}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex h-dvh max-h-dvh w-[min(100%,16rem)] min-w-0 flex-col overflow-hidden rounded-r-2xl border border-slate-200/90 bg-white p-4 shadow-xl md:hidden">
              <nav className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    closeMobileNav();
                  }}
                  className={navButtonClass('dashboard')}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconNavDashboard />
                    Dashboard
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('projects');
                    closeMobileNav();
                  }}
                  className={navButtonClass('projects')}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconNavProjects />
                    {isAdmin || loggedInUser.role === 'Viewer' ? 'All Projects' : 'My Projects'}
                  </span>
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('members');
                      closeMobileNav();
                    }}
                    className={navButtonClass('members')}
                  >
                    <span className="inline-flex items-center gap-2">
                      <IconNavMembers />
                      Members
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('profile');
                    closeMobileNav();
                  }}
                  className={navButtonClass('profile')}
                >
                  <span className="inline-flex items-center gap-2">
                    <IconNavProfile />
                    Profile
                  </span>
                </button>
              </nav>
              <div className="mt-auto shrink-0 border-t border-slate-100 pt-4">
              </div>
              <div className="shrink-0 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileNav();
                    setSessionUserId(null);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Log out
                </button>
              </div>
            </aside>
          </>
        )}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-white no-scrollbar overflow-x-hidden p-5 [-webkit-overflow-scrolling:touch] sm:p-6 md:p-8">
          <div className="mb-6 shrink-0 md:mb-8">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{pageTitle}</h1>

            {activeTab === 'dashboard' && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-end gap-2">
                  <label htmlFor="dashboard-project-filter-above" className="sr-only">
                    Project Filter
                  </label>
                  <select
                    id="dashboard-project-filter-above"
                    value={projectFilterId === 'all' ? 'all' : String(projectFilterId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setProjectFilterId(v === 'all' ? 'all' : Number(v));
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 transition focus:ring-2 sm:w-[260px]"
                    title="Project Filter"
                  >
                    <option value="all">All Projects</option>
                    {accessibleProjectsForFilter.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Production</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {productionStats.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                      {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setProductionRange(range)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            productionRange === range
                              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {range === 'daily' ? 'Daily' : range === 'weekly' ? 'Weekly' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 sm:items-end">
                    <div>
                      <label htmlFor="production-from" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        From
                      </label>
                      <input
                        id="production-from"
                        type="date"
                        value={productionDateFrom}
                        onChange={(e) => setProductionDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 transition focus:ring-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="production-to" className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        To
                      </label>
                      <input
                        id="production-to"
                        type="date"
                        value={productionDateTo}
                        onChange={(e) => setProductionDateTo(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 transition focus:ring-2"
                      />
                    </div>
                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setProductionDateFrom('');
                          setProductionDateTo('');
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Based on {loggedInUser.role === 'User' ? 'your' : 'all'} entries{' '}
                    {productionStats.hasCustomRange
                      ? 'in the selected date range.'
                      : `from the last ${productionRange === 'daily' ? '24 hours' : productionRange === 'weekly' ? '7 days' : '30 days'}.`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {activeTab === 'projectSummary' && summaryProject && (
            <ProjectSummaryPage
              project={summaryProject}
              onBack={closeProjectSummary}
              onDeleteEntry={onDeleteProjectEntry}
              onExportReport={onExportProjectReport}
            />
          )}
          {activeTab === 'projectSummary' && !summaryProject && (
            <article className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
              <p className="text-slate-600">This project could not be found or you do not have access.</p>
              <button
                type="button"
                onClick={closeProjectSummary}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to projects
              </button>
            </article>
          )}

          {activeTab === 'dashboard' && (
            <>
              {loggedInUser.role === 'Admin' && (
                <section className="mb-4 shrink-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                  <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconStatFolder />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Projects</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{totalProjects}</p>
                        <p className="text-[10px] text-emerald-600">Projects created</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconStatUsersGroup />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Members</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{totalMembers}</p>
                        <p className="text-[10px] text-emerald-600">System members</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconStatDocument />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Entries</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{adminTotalEntries}</p>
                        <p className="text-[10px] text-slate-500">All project entries</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconStatBars />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Weight (tons)</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                          {(adminTotalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-500">All projects</p>
                      </div>
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconStatWelding />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Welding (m)</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                          {adminTotalWelding.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-slate-500">All projects</p>
                      </div>
                    </div>
                  </article>
                </section>
              )}

              {loggedInUser.role === 'Viewer' && (
                <div className="flex flex-col gap-4 md:gap-5">
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatFolder />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Visible Projects</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{visibleProjects.length}</p>
                          <p className="text-[10px] text-emerald-600">Visible to you</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatUsersGroup />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Active Members</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{viewerActiveUsers}</p>
                          <p className="text-[10px] text-emerald-600">Across submissions</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatDocument />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Entries</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{viewerTotalEntries}</p>
                          <p className="text-[10px] text-slate-500">Across visible projects</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatBars />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Weight (tons)</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                            {(viewerTotalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-500">Visible scope</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatWelding />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Welding (m)</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                            {viewerTotalWelding.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-500">Visible scope</p>
                        </div>
                      </div>
                    </article>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2 md:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-blue-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconActionFolderPlus />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Open Projects</h3>
                            <p className="text-[11px] text-slate-500">View all projects available in your scope.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Open Projects
                        </button>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconNavProfile />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Profile Settings</h3>
                            <p className="text-[11px] text-slate-500">Update your account details and password.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="shrink-0 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                        >
                          Open Profile
                        </button>
                      </div>
                    </article>
                  </section>

                  <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] lg:col-span-8">
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">Project Summary</h3>
                      <p className="mb-2 text-[11px] text-slate-500">Read-only view of projects you can access.</p>
                      <div className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                              <th className="px-2 py-1 font-medium">S.N</th>
                              <th className="px-2 py-1 font-medium">Project Name</th>
                              <th className="px-2 py-1 font-medium">Total Entries</th>
                              <th className="px-2 py-1 font-medium">Total Weight (kg)</th>
                              <th className="px-2 py-1 font-medium">Total Welding (m)</th>
                              <th className="px-2 py-1 font-medium">Created On</th>
                              <th className="px-2 py-1 font-medium">Project status</th>
                              <th className="px-2 py-1 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewerProjectSummaryRows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-2 py-5 text-center text-[11px] text-slate-500">
                                  No projects visible yet
                                </td>
                              </tr>
                            ) : (
                              viewerProjectSummaryRows.map((row, i) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-1 text-slate-700">{i + 1}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.name}</td>
                                  <td className="px-2 py-1 font-medium text-blue-600">{row.entryCount}</td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weldingM.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-600">{row.createdOn}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.statusLabel}</td>
                                  <td className="px-2 py-1">
                                    <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openProjectSummary(row.id)}
                                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 [&>svg]:h-3.5 [&>svg]:w-3.5"
                                      aria-label={`View summary for ${row.name}`}
                                    >
                                      <IconEye />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openProjectSummary(row.id)}
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Open
                                    </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        Showing {viewerProjectSummaryRows.length ? 1 : 0} to {viewerProjectSummaryRows.length} of{' '}
                        {viewerProjectSummaryRows.length} projects
                      </p>
                    </article>

                    <TonnageBarChartCard
                      title="Tonnage Overview"
                      plannedWeightKg={viewerTotalWeight}
                      actualWeightKg={viewerWeightDonut.totalW}
                    />
                  </section>

                  <section className="w-full">
                    <article className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-tight text-slate-900">
                          Recent Entries
                          {viewerRecentEntries.titleSuffix}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="shrink-0 rounded-md border border-emerald-600 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                        >
                          View All Projects
                        </button>
                      </div>
                      <div className="max-h-[min(36vh,240px)] min-w-0 overflow-x-auto overflow-y-auto no-scrollbar rounded-lg border border-slate-200 sm:max-h-[min(38vh,260px)] lg:max-h-[min(34vh,280px)]">
                        <table className="w-full min-w-[920px] border-collapse text-left text-[11px] leading-snug">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                              <th className="px-2 py-1 font-semibold">S.N</th>
                              {viewerRecentEntries.showProjectColumn ? (
                                <th className="px-2 py-1 font-semibold">Project</th>
                              ) : null}
                              <th className="px-2 py-1 font-semibold">Area / Section</th>
                              <th className="px-2 py-1 font-semibold">Material name</th>
                              <th className="min-w-[14rem] px-2 py-1 font-semibold">Dimensions (form order, mm)</th>
                              <th className="px-2 py-1 font-semibold text-center">Qty</th>
                              <th className="px-2 py-1 font-semibold text-center">Weight (kg)</th>
                              <th className="px-2 py-1 font-semibold text-center">Welding (m)</th>
                              <th className="px-2 py-1 font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white text-slate-800">
                            {viewerRecentEntries.rows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={viewerRecentEntries.showProjectColumn ? 10 : 9}
                                  className="px-2 py-6 text-center text-[11px] text-slate-500"
                                >
                                  No entries in visible projects yet.
                                </td>
                              </tr>
                            ) : (
                              viewerRecentEntries.rows.map((row, i) => (
                                <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-0.5 tabular-nums text-slate-700">{i + 1}</td>
                                  {viewerRecentEntries.showProjectColumn ? (
                                    <td className="max-w-[9rem] truncate px-2 py-0.5 text-slate-800">{row.projectName}</td>
                                  ) : null}
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">
                                    {row.areaSection || <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">{row.materialName || '—'}</td>
                                  <td className="max-w-[20rem] whitespace-normal break-words px-2 py-0.5 text-slate-700">
                                    {row.dimensionsDisplay}
                                  </td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.qty || '—'}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-800">{row.weightDisplay}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.welding}</td>
                                  <td className="max-w-[12rem] px-2 py-0.5 text-slate-600">{row.remarks}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </section>

                  <section className="grid gap-3 md:grid-cols-3 md:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">Performance Trend</h4>
                      <p className="mb-2 text-[10px] text-slate-500">Last 6 months weight trend (kg)</p>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <svg viewBox="0 0 100 100" className="h-32 w-full">
                          <line x1="0" y1="90" x2="100" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                          <polyline
                            fill="none"
                            stroke="#14b8a6"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={viewerTrendPoints}
                          />
                          {viewerTrendValues.map((value, index) => {
                            const x = (index / (viewerTrendValues.length - 1)) * 100;
                            const y = 100 - (value / viewerTrendMax) * 100;
                            return <circle key={`vt-${value}-${index}`} cx={x} cy={y} r="2" fill="#0d9488" />;
                          })}
                        </svg>
                      </div>
                      <div className="mt-2 grid grid-cols-5 gap-1.5 text-[10px] text-slate-600">
                        {viewerTrendMonths.map((month) => (
                          <span key={month} className="rounded bg-teal-50 px-1.5 py-0.5 text-center">
                            {month}
                          </span>
                        ))}
                      </div>
                    </article>

                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-1 text-sm font-semibold text-slate-900">Performance Snapshot</h4>
                      <p className="mb-2 text-[10px] text-slate-500">
                        Completion {viewerCompletionRate}% · projects with line items
                      </p>
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                        {viewerTrendValues.map((value, index) => (
                          <div key={`${viewerTrendMonths[index]}-${value}`}>
                            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600">
                              <span>{viewerTrendMonths[index]}</span>
                              <span className="font-semibold text-slate-800">{value.toLocaleString()}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200">
                              <div
                                className="h-1.5 rounded-full bg-teal-600"
                                style={{ width: `${(value / viewerTrendMax) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-1 text-sm font-semibold text-slate-900">Activity overview</h4>
                      <p className="mb-2 text-[10px] text-slate-500">Last 6 months entries trend</p>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <svg viewBox="0 0 100 100" className="h-32 w-full">
                          <line x1="0" y1="90" x2="100" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={viewerActivityPoints}
                          />
                          {viewerActivityValues.map((value, index) => {
                            const x = (index / (viewerActivityValues.length - 1)) * 100;
                            const y = 100 - (value / viewerActivityMax) * 100;
                            return <circle key={`va-${value}-${index}`} cx={x} cy={y} r="2" fill="#7c3aed" />;
                          })}
                        </svg>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600">
                        {viewerActivityMonths.map((month) => (
                          <span key={`vam-${month}`} className="rounded bg-violet-50 px-1.5 py-0.5 text-center">
                            {month}
                          </span>
                        ))}
                      </div>
                    </article>
                  </section>
                </div>
              )}

              {loggedInUser.role === 'Admin' && (
                <>
                  <div className="mb-0 flex shrink-0 flex-col gap-4 md:gap-5">
                  <section className="grid gap-3 md:grid-cols-2 md:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconActionUserPlus />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Add New Member</h3>
                            <p className="text-[11px] text-slate-500">Create new member and assign role.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDashboardCreateProject(false);
                            setShowDashboardCreateUser((current) => !current);
                          }}
                          className="shrink-0 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                        >
                          {showDashboardCreateUser ? 'Close' : 'Add Member'}
                        </button>
                      </div>
                    </article>

                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-blue-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconActionFolderPlus />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Create New Project</h3>
                            <p className="text-[11px] text-slate-500">Create a new project for steel renewal.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDashboardCreateUser(false);
                            setShowDashboardCreateProject((current) => !current);
                          }}
                          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          {showDashboardCreateProject ? 'Close' : 'Create Project'}
                        </button>
                      </div>
                    </article>
                  </section>

                  <section className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] lg:col-span-8">
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">Project Summary</h3>
                      <div className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                              <th className="px-2 py-1 font-medium">S.N</th>
                              <th className="px-2 py-1 font-medium">Project Name</th>
                              <th className="px-2 py-1 font-medium">Total Entries</th>
                              <th className="px-2 py-1 font-medium">Total Weight (kg)</th>
                              <th className="px-2 py-1 font-medium">Total Welding (m)</th>
                              <th className="px-2 py-1 font-medium">Created On</th>
                              <th className="px-2 py-1 font-medium">Project status</th>
                              <th className="px-2 py-1 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminProjectSummaryRows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-2 py-5 text-center text-[11px] text-slate-500">
                                  No projects yet
                                </td>
                              </tr>
                            ) : (
                              adminProjectSummaryRows.map((row, i) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-1 text-slate-700">{i + 1}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.name}</td>
                                  <td className="px-2 py-1 font-medium text-blue-600">{row.entryCount}</td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weldingM.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-600">{row.createdOn}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.statusLabel}</td>
                                  <td className="px-2 py-1">
                                    <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openProjectSummary(row.id)}
                                      className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 [&>svg]:h-3.5 [&>svg]:w-3.5"
                                      aria-label={`View summary for ${row.name}`}
                                    >
                                      <IconEye />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openProjectSummary(row.id)}
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                      Open
                                    </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        Showing {adminProjectSummaryRows.length ? 1 : 0} to {adminProjectSummaryRows.length} of{' '}
                        {adminProjectSummaryRows.length} projects
                      </p>
                    </article>

                    <TonnageBarChartCard
                      title="Tonnage Overview"
                      plannedWeightKg={adminTotalWeight}
                      actualWeightKg={adminWeightDonut.totalW}
                    />
                  </section>

                  <section className="w-full">
                    <article className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-tight text-slate-900">
                          Recent Entries
                          {adminRecentEntries.titleSuffix}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="shrink-0 rounded-md border border-emerald-600 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                        >
                          View All Entries
                        </button>
                      </div>
                      <div className="max-h-[min(36vh,240px)] min-w-0 overflow-x-auto overflow-y-auto no-scrollbar rounded-lg border border-slate-200 sm:max-h-[min(38vh,260px)] lg:max-h-[min(34vh,280px)]">
                        <table className="w-full min-w-[920px] border-collapse text-left text-[11px] leading-snug">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                              <th className="px-2 py-1 font-semibold">S.N</th>
                              {adminRecentEntries.showProjectColumn ? (
                                <th className="px-2 py-1 font-semibold">Project</th>
                              ) : null}
                              <th className="px-2 py-1 font-semibold">Area / Section</th>
                              <th className="px-2 py-1 font-semibold">Material name</th>
                              <th className="min-w-[14rem] px-2 py-1 font-semibold">Dimensions (form order, mm)</th>
                              <th className="px-2 py-1 font-semibold text-center">Qty</th>
                              <th className="px-2 py-1 font-semibold text-center">Weight (kg)</th>
                              <th className="px-2 py-1 font-semibold text-center">Welding (m)</th>
                              <th className="px-2 py-1 font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white text-slate-800">
                            {adminRecentEntries.rows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={adminRecentEntries.showProjectColumn ? 10 : 9}
                                  className="px-2 py-6 text-center text-[11px] text-slate-500"
                                >
                                  No entries yet. Create a project and add line items to see them here.
                                </td>
                              </tr>
                            ) : (
                              adminRecentEntries.rows.map((row, i) => (
                                <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-0.5 tabular-nums text-slate-700">{i + 1}</td>
                                  {adminRecentEntries.showProjectColumn ? (
                                    <td className="max-w-[9rem] truncate px-2 py-0.5 text-slate-800">{row.projectName}</td>
                                  ) : null}
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">
                                    {row.areaSection || <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">{row.materialName || '—'}</td>
                                  <td className="max-w-[20rem] whitespace-normal break-words px-2 py-0.5 text-slate-700">
                                    {row.dimensionsDisplay}
                                  </td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.qty || '—'}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-800">{row.weightDisplay}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.welding}</td>
                                  <td className="max-w-[12rem] px-2 py-0.5 text-slate-600">{row.remarks}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </section>
                  </div>

                  {showDashboardCreateUser && (
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-modal-add-member-title"
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
                        onClick={() => setShowDashboardCreateUser(false)}
                      >
                        <div
                          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto no-scrollbar rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h3 id="dashboard-modal-add-member-title" className="text-lg font-semibold text-slate-800">
                                Add Member
                              </h3>
                              <p className="text-sm text-slate-500">Add a member/viewer and assign projects.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowDashboardCreateUser(false)}
                              className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              aria-label="Close"
                            >
                              ×
                            </button>
                          </div>
                          <form
                            onSubmit={async (event) => {
                              const ok = await handleCreateUser(event);
                              if (ok) setShowDashboardCreateUser(false);
                            }}
                            className="grid gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)] md:grid-cols-2"
                          >
                            <input
                              name="fullName"
                              placeholder="First Name"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                              required
                            />
                            <input
                              name="username"
                              placeholder="Username (login)"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                            />
                            <input
                              name="email"
                              type="email"
                              placeholder="Email ID"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                              required
                            />
                            <input
                              name="contactNo"
                              placeholder="Contact No"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                            />
                            <input
                              name="designation"
                              placeholder="Designation (optional)"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                            />
                            <input
                              name="password"
                              type="password"
                              minLength={8}
                              placeholder="Create Password (min 8 chars)"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                              required
                            />
                            <select
                              name="role"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition hover:border-slate-300 hover:bg-slate-50 focus:ring-2"
                            >
                              <option value="User">Member</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                            <fieldset className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
                              <legend className="px-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">Assign Projects</legend>
                              {projects.map((project) => (
                                <label key={project.id} className="flex items-center gap-2 text-sm text-slate-600">
                                  <input name="projects" type="checkbox" value={project.id} />
                                  {project.name}
                                </label>
                              ))}
                            </fieldset>
                            <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
                              <button
                                type="button"
                                onClick={() => setShowDashboardCreateUser(false)}
                                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                              >
                                Create Member
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {showDashboardCreateProject && (
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-modal-create-project-title"
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
                        onClick={() => setShowDashboardCreateProject(false)}
                      >
                        <div
                          className="max-h-[90vh] w-full max-w-5xl overflow-y-auto no-scrollbar rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h3 id="dashboard-modal-create-project-title" className="text-lg font-semibold text-slate-800">
                                Create Project
                              </h3>
                              <p className="text-sm text-slate-500">Add a new project to the suite.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowDashboardCreateProject(false)}
                              className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              aria-label="Close"
                            >
                              ×
                            </button>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                            <CreateProjectForm
                              onCreate={async (payload) => {
                                const ok = await handleCreateProject(payload);
                                if (ok) setShowDashboardCreateProject(false);
                                return ok;
                              }}
                            />
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowDashboardCreateProject(false)}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                  )}
                </>
              )}

              {loggedInUser.role === 'User' && (
                <div className="flex flex-col gap-4 md:gap-5">
                  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatFolder />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">My Projects</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{visibleProjects.length}</p>
                          <p className="text-[10px] text-emerald-600">Assigned to you</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatClipboard />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">My Submissions</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{userSubmissionCount}</p>
                          <p className="text-[10px] text-emerald-600">Your entries</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatDocument />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Latest Value</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{latestUserEntry?.value ?? '—'}</p>
                          <p className="text-[10px] text-slate-500">Most recent entry</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatBars />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Project Weight (tons)</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                            {(userTotalWeight / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-500">Across assigned projects</p>
                        </div>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600 [&_svg]:h-4 [&_svg]:w-4">
                          <IconStatWelding />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Project Welding (m)</p>
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">
                            {userTotalWelding.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-slate-500">Across assigned projects</p>
                        </div>
                      </div>
                    </article>
                  </section>

                  <section className="grid gap-3 md:grid-cols-2 md:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-blue-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconActionFolderPlus />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Open My Projects</h3>
                            <p className="text-[11px] text-slate-500">Review and submit data in assigned projects.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        >
                          Open Projects
                        </button>
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
                            <IconNavProfile />
                          </div>
                          <div className="min-w-0 flex flex-col gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">Profile Settings</h3>
                            <p className="text-[11px] text-slate-500">Update your profile and password anytime.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveTab('profile')}
                          className="shrink-0 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700"
                        >
                          Open Profile
                        </button>
                      </div>
                    </article>
                  </section>

                  <section className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-5">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] lg:col-span-8">
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">My Project Summary</h3>
                      <div className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-x-auto">
                        <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                              <th className="px-2 py-1 font-medium">S.N</th>
                              <th className="px-2 py-1 font-medium">Project Name</th>
                              <th className="px-2 py-1 font-medium">My Entries</th>
                              <th className="px-2 py-1 font-medium">My Weight (kg)</th>
                              <th className="px-2 py-1 font-medium">My Welding (m)</th>
                              <th className="px-2 py-1 font-medium">First Entry On</th>
                              <th className="px-2 py-1 font-medium">Project status</th>
                              <th className="px-2 py-1 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userProjectSummaryRows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="px-2 py-5 text-center text-[11px] text-slate-500">
                                  No projects assigned
                                </td>
                              </tr>
                            ) : (
                              userProjectSummaryRows.map((row, i) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-1 text-slate-700">{i + 1}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.name}</td>
                                  <td className="px-2 py-1 font-medium text-blue-600">{row.entryCount}</td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-700">
                                    {row.weldingM.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-2 py-1 tabular-nums text-slate-600">{row.createdOn}</td>
                                  <td className="px-2 py-1 text-slate-800">{row.statusLabel}</td>
                                  <td className="px-2 py-1">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => openProjectSummary(row.id)}
                                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-1 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 [&>svg]:h-3.5 [&>svg]:w-3.5"
                                        aria-label={`View summary for ${row.name}`}
                                      >
                                        <IconEye />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openProjectSummary(row.id)}
                                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
                                      >
                                        Open
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">
                        Showing {userProjectSummaryRows.length ? 1 : 0} to {userProjectSummaryRows.length} of{' '}
                        {userProjectSummaryRows.length} projects
                      </p>
                    </article>

                    <div className="lg:col-span-4">
                      <TonnageBarChartCard
                        title="My Tonnage Overview"
                        plannedWeightKg={userTotalWeight}
                        actualWeightKg={sumEntryWeightKg(filteredVisibleProjects.flatMap((p) => p.entries.filter((e) => e.user === loggedInUser.username)))}
                      />
                    </div>
                  </section>

                  <section className="w-full">
                    <article className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-tight text-slate-900">
                          My Recent Entries
                          {userRecentEntries.titleSuffix}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('projects')}
                          className="shrink-0 rounded-md border border-emerald-600 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                        >
                          View All Entries
                        </button>
                      </div>
                      <div className="max-h-[min(36vh,240px)] min-w-0 overflow-x-auto overflow-y-auto no-scrollbar rounded-lg border border-slate-200 sm:max-h-[min(38vh,260px)] lg:max-h-[min(34vh,280px)]">
                        <table className="w-full min-w-[920px] border-collapse text-left text-[11px] leading-snug">
                          <thead className="sticky top-0 z-10">
                            <tr className="border-b border-slate-200 bg-slate-100 text-slate-700">
                              <th className="px-2 py-1 font-semibold">S.N</th>
                              {userRecentEntries.showProjectColumn ? (
                                <th className="px-2 py-1 font-semibold">Project</th>
                              ) : null}
                              <th className="px-2 py-1 font-semibold">Area / Section</th>
                              <th className="px-2 py-1 font-semibold">Material name</th>
                              <th className="min-w-[14rem] px-2 py-1 font-semibold">Dimensions (form order, mm)</th>
                              <th className="px-2 py-1 font-semibold text-center">Qty</th>
                              <th className="px-2 py-1 font-semibold text-center">Weight (kg)</th>
                              <th className="px-2 py-1 font-semibold text-center">Welding (m)</th>
                              <th className="px-2 py-1 font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white text-slate-800">
                            {userRecentEntries.rows.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={userRecentEntries.showProjectColumn ? 10 : 9}
                                  className="px-2 py-6 text-center text-[11px] text-slate-500"
                                >
                                  No entries yet. Add line items from My Projects to see them here.
                                </td>
                              </tr>
                            ) : (
                              userRecentEntries.rows.map((row, i) => (
                                <tr key={row.key} className="border-b border-slate-100 last:border-0">
                                  <td className="px-2 py-0.5 tabular-nums text-slate-700">{i + 1}</td>
                                  {userRecentEntries.showProjectColumn ? (
                                    <td className="max-w-[9rem] truncate px-2 py-0.5 text-slate-800">{row.projectName}</td>
                                  ) : null}
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">
                                    {row.areaSection || <span className="text-slate-400">—</span>}
                                  </td>
                                  <td className="max-w-[10rem] px-2 py-0.5 text-slate-800">{row.materialName || '—'}</td>
                                  <td className="max-w-[20rem] whitespace-normal break-words px-2 py-0.5 text-slate-700">
                                    {row.dimensionsDisplay}
                                  </td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.qty || '—'}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-800">{row.weightDisplay}</td>
                                  <td className="px-2 py-0.5 text-center tabular-nums text-slate-700">{row.welding}</td>
                                  <td className="max-w-[12rem] px-2 py-0.5 text-slate-600">{row.remarks}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </article>
                  </section>

                  <section className="grid gap-3 md:grid-cols-3 md:gap-4">
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">Project Trend</h4>
                      <p className="mb-2 text-[10px] text-slate-500">Last 6 entries weight trend (kg)</p>
                      <div className="space-y-3">
                        {userTrendEntries.length > 0 ? (
                          <>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <svg viewBox="0 0 100 100" className="h-32 w-full">
                                <line x1="0" y1="90" x2="100" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                                <polyline
                                  fill="none"
                                  stroke="#14b8a6"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={userTrendPoints}
                                />
                                {userTrendValues.map((value, index) => {
                                  const x = userTrendValues.length === 1 ? 50 : (index / (userTrendValues.length - 1)) * 100;
                                  const y = 100 - (value / userTrendMax) * 100;
                                  return <circle key={`ut-${value}-${index}`} cx={x} cy={y} r="2" fill="#0d9488" />;
                                })}
                              </svg>
                            </div>
                            <div className="mt-2 grid grid-cols-5 gap-1.5 text-[10px] text-slate-600">
                              {userTrendEntries.map((entry, index) => (
                                <span key={`utm-${entry.createdAt}-${index}`} className="rounded bg-teal-50 px-1.5 py-0.5 text-center">
                                  {entry.createdAt.slice(5, 10)}
                                </span>
                              ))}
                            </div>
                            <div className="grid max-h-40 gap-1.5 overflow-y-auto no-scrollbar">
                              {userTrendEntries.map((entry, index) => (
                                <div key={`${entry.createdAt}-${index}`} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px]">
                                  <p className="font-medium text-slate-800">
                                    {entry.projectName} — {entry.label}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {userTrendValues[index].toFixed(2)} · {entry.createdAt}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500">No trend data yet.</p>
                        )}
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">Project Comparison</h4>
                      <p className="mb-2 text-[10px] text-slate-500">Your entry count by project</p>
                      <div className="space-y-2">
                        {userProjectBars.map((project) => {
                          const width = `${(project.count / userProjectBarMax) * 100}%`;
                          return (
                            <div key={project.id} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <p className="truncate text-[11px] font-semibold text-slate-800">{project.name}</p>
                                <p className="shrink-0 text-[10px] font-semibold text-teal-700">{project.count}</p>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-200">
                                <div className="h-1.5 rounded-full bg-teal-600" style={{ width }} />
                              </div>
                            </div>
                          );
                        })}
                        {userProjectBars.length === 0 && <p className="text-xs text-slate-500">No projects assigned.</p>}
                      </div>
                    </article>
                    <article className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                      <h4 className="mb-1 text-sm font-semibold text-slate-900">Activity overview</h4>
                      <p className="mb-2 text-[10px] text-slate-500">Last 6 months entries trend</p>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <svg viewBox="0 0 100 100" className="h-32 w-full">
                          <line x1="0" y1="90" x2="100" y2="90" stroke="#cbd5e1" strokeWidth="1" />
                          <polyline
                            fill="none"
                            stroke="#8b5cf6"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={userActivityPoints}
                          />
                          {userActivityValues.map((value, index) => {
                            const x = userActivityValues.length === 1 ? 50 : (index / (userActivityValues.length - 1)) * 100;
                            const y = 100 - (value / userActivityMax) * 100;
                            return <circle key={`ua-${value}-${index}`} cx={x} cy={y} r="2" fill="#7c3aed" />;
                          })}
                        </svg>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px] text-slate-600">
                        {userActivityMonths.map((month, index) => (
                          <span key={`uam-${month}-${index}`} className="rounded bg-violet-50 px-1.5 py-0.5 text-center">
                            {month}
                          </span>
                        ))}
                      </div>
                    </article>
                  </section>
                </div>
              )}
            </>
          )}

          {activeTab === 'projects' && (
            <>
              {isAdmin ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">All Projects</h3>
                      <p className="text-sm text-slate-500">Manage projects and review team assignments.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProjectCreateForm((current) => !current)}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      {showProjectCreateForm ? 'Close' : 'Create Project'}
                    </button>
                  </div>
                  <AllProjectsSummaryStrip
                    pageSummary={adminProjectsPageSummary}
                    projects={projects}
                    users={users}
                  />
                  <AdminProjectsSection
                    isAdmin={isAdmin}
                    projects={projects}
                    users={users}
                    showProjectCreateForm={showProjectCreateForm}
                    setShowProjectCreateForm={setShowProjectCreateForm}
                    handleCreateProject={handleCreateProject}
                    handleUpdateProject={handleUpdateProject}
                    handleDeleteProject={handleDeleteProject}
                    onOpenProjectSummary={openProjectSummary}
                    searchQuery={adminProjectSearch}
                    setSearchQuery={setAdminProjectSearch}
                    onSearch={onAdminProjectSearch}
                    onClearSearch={onClearAdminProjectSearch}
                    requestedEditProjectId={requestedAdminEditProjectId}
                    onRequestedEditHandled={() => setRequestedAdminEditProjectId(null)}
                    onRequestedEditClosed={() => setActiveTab('dashboard')}
                  />
                </div>
              ) : (
                <UserProjectsSection
                  loggedInUser={loggedInUser}
                  visibleProjects={visibleProjects}
                  onOpenProjectSummary={openProjectSummary}
                  handleCreateUserProjectEntry={handleCreateUserProjectEntry}
                  handleUpdateProject={handleUpdateProject}
                  handleUpdateUserProjectEntry={handleUpdateUserProjectEntry}
                  requestedProjectId={requestedUserProjectId}
                  onRequestedProjectHandled={() => setRequestedUserProjectId(null)}
                />
              )}
            </>
          )}

          {activeTab === 'members' && (
            <MembersSection
              isAdmin={isAdmin}
              users={users}
              projects={projects}
              loggedInUserId={loggedInUser.id}
              showMemberCreateForm={showMemberCreateForm}
              setShowMemberCreateForm={setShowMemberCreateForm}
              handleCreateUser={handleCreateUser}
              editingMemberId={editingMemberId}
              editFullName={editFullName}
              setEditFullName={setEditFullName}
              editUsername={editUsername}
              setEditUsername={setEditUsername}
              editEmail={editEmail}
              setEditEmail={setEditEmail}
              editContactNo={editContactNo}
              setEditContactNo={setEditContactNo}
              editDesignation={editDesignation}
              setEditDesignation={setEditDesignation}
              editAssignedOn={editAssignedOn}
              setEditAssignedOn={setEditAssignedOn}
              editRole={editRole}
              setEditRole={setEditRole}
              editProjectIds={editProjectIds}
              handleToggleEditProject={handleToggleEditProject}
              handleStartEditMember={handleStartEditMember}
              handleSaveMemberEdit={handleSaveMemberEdit}
              setEditingMemberId={setEditingMemberId}
              handleDeleteMember={handleDeleteMember}
            />
          )}

          {activeTab === 'profile' && (
            <ProfilePage loggedInUser={loggedInUser} status={status} handleSaveProfile={handleSaveProfile} />
          )}
        </section>
          </div>
        </div>
      </main>
    </div>
  );
}
