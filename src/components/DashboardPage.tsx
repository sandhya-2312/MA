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
type TonnageBarDatum = { key: string; label: string; tonnage: number; color: string };

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

type ProductionRange = 'daily' | 'weekly' | 'monthly';

function productionRangeSinceMs(range: ProductionRange, now = Date.now()): number {
  const dayMs = 24 * 60 * 60 * 1000;
  if (range === 'daily') return now - dayMs;
  if (range === 'weekly') return now - 7 * dayMs;
  return now - 30 * dayMs;
}

function productionRangeWindowLabel(range: ProductionRange): string {
  if (range === 'daily') return '24 hours';
  if (range === 'weekly') return '7 days';
  return '30 days';
}

function filterProjectsEntriesSince(
  projects: Project[],
  sinceMs: number,
  entryUsername?: string,
): Project[] {
  return projects.map((project) => ({
    ...project,
    entries: project.entries.filter((entry) => {
      if (entryUsername && entry.user !== entryUsername) return false;
      const createdAtMs = Date.parse(entry.createdAt);
      return !Number.isNaN(createdAtMs) && createdAtMs >= sinceMs;
    }),
  }));
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
  projectBars: TonnageBarDatum[];
  materialBars: TonnageBarDatum[];
};

function buildTonnageBreakdown(projects: Project[], username?: string): { projectBars: TonnageBarDatum[]; materialBars: TonnageBarDatum[] } {
  const entryProjectWeights = new Map<number, number>();
  const entryMaterialWeights = new Map<string, number>();

  projects.forEach((project) => {
    let projectWeight = 0;
    project.entries.forEach((entry) => {
      if (username && entry.user !== username) return;
      const weightKg = parseFloat(entry.weight) || parseFloat(entry.value) || 0;
      if (weightKg <= 0) return;
      projectWeight += weightKg;
      const materialName = entry.itemDetails.trim() || 'Unknown material';
      entryMaterialWeights.set(materialName, (entryMaterialWeights.get(materialName) ?? 0) + weightKg);
    });
    if (projectWeight > 0) {
      entryProjectWeights.set(project.id, projectWeight);
    }
  });

  // Fallback to planned/material master data when there are no entry-level weight rows.
  if (entryProjectWeights.size === 0 && entryMaterialWeights.size === 0) {
    projects.forEach((project) => {
      let projectWeight = 0;
      (project.materials ?? []).forEach((material) => {
        const weightKg = computeStoredMaterialWeightKg(material);
        if (weightKg <= 0) return;
        projectWeight += weightKg;
        const materialName = material.name.trim() || 'Unknown material';
        entryMaterialWeights.set(materialName, (entryMaterialWeights.get(materialName) ?? 0) + weightKg);
      });
      if (projectWeight > 0) {
        entryProjectWeights.set(project.id, projectWeight);
      }
    });
  }

  const sortedProjects = projects
    .map((project) => ({ id: project.id, name: project.name, weightKg: entryProjectWeights.get(project.id) ?? 0 }))
    .filter((row) => row.weightKg > 0)
    .sort((a, b) => b.weightKg - a.weightKg);
  const sortedMaterials = Array.from(entryMaterialWeights.entries())
    .map(([name, weightKg]) => ({ name, weightKg }))
    .filter((row) => row.weightKg > 0)
    .sort((a, b) => b.weightKg - a.weightKg);

  return {
    projectBars: sortedProjects.map((row, index) => ({
      key: `project-${row.id}`,
      label: row.name,
      tonnage: row.weightKg / 1000,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    })),
    materialBars: sortedMaterials.map((row, index) => ({
      key: `material-${row.name}-${index}`,
      label: row.name,
      tonnage: row.weightKg / 1000,
      color: DONUT_COLORS[index % DONUT_COLORS.length],
    })),
  };
}

function TonnageBarChartCard({ title, plannedWeightKg, actualWeightKg, projectBars, materialBars }: TonnageBarChartCardProps) {
  const totalTonnage = Math.max(plannedWeightKg, 0) / 1000;
  const actualTonnage = Math.max(actualWeightKg, 0) / 1000;
  const projectChartBars = projectBars.slice(0, 6);
  const materialChartBars = materialBars.slice(0, 6);
  const projectMax = Math.max(...projectChartBars.map((bar) => bar.tonnage), 1);
  const materialMax = Math.max(...materialChartBars.map((bar) => bar.tonnage), 1);
  const yTicks = [1, 0.75, 0.5, 0.25, 0];
  const chartTop = 14;
  const chartBottom = 58;
  const chartHeight = chartBottom - chartTop;

  const formatAxisLabel = (label: string, maxChars: number) =>
    label.length > maxChars ? `${label.slice(0, Math.max(1, maxChars - 1))}…` : label;

  const renderBarValueLabel = (bar: TonnageBarDatum, x: number, barWidth: number, y: number) => (
    <text
      x={x + barWidth / 2}
      y={Math.max(7, y - 2.5)}
      textAnchor="middle"
      fill="#334155"
      fontSize="4.6"
      fontWeight="600"
    >
      {`${bar.tonnage.toFixed(2)}t`}
    </text>
  );

  return (
    <article className="flex min-h-0 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] lg:col-span-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mb-3 text-[10px] text-slate-500">Project-wise and material-wise tonnage</p>
      <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-700">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500" />
            Total Tonnage
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-emerald-500" />
            Actual Tonnage
          </span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-6 text-[11px] font-semibold text-slate-800">
          <span>{totalTonnage.toFixed(2)}t</span>
          <span>{actualTonnage.toFixed(2)}t</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Project-wise</p>
          {projectChartBars.length === 0 ? (
            <p className="text-[11px] text-slate-500">No project tonnage data.</p>
          ) : (
            <>
              <svg viewBox="0 0 100 78" className="h-40 w-full" role="img" aria-label="Project wise tonnage bar chart">
                {yTicks.map((tick) => {
                  const y = chartTop + (1 - tick) * chartHeight;
                  return <line key={`proj-grid-${tick}`} x1="10" y1={y} x2="96" y2={y} stroke="#cbd5e1" strokeWidth="0.45" />;
                })}
                <line x1="10" y1={chartBottom} x2="96" y2={chartBottom} stroke="#94a3b8" strokeWidth="0.7" />
                {projectChartBars.map((bar, index) => {
                  const slot = 86 / projectChartBars.length;
                  const barWidth = Math.min(10, slot * 0.68);
                  const x = 10 + slot * index + (slot - barWidth) / 2;
                  const barHeight = (bar.tonnage / projectMax) * chartHeight;
                  const y = chartBottom - barHeight;
                  const label = formatAxisLabel(bar.label, Math.max(8, Math.floor(slot * 1.35)));
                  const cornerRadius = Math.min(2.2, barWidth / 2, Math.max(barHeight, 0) / 2);
                  return (
                    <g key={bar.key}>
                      <title>{`${bar.label}: ${bar.tonnage.toFixed(2)}t`}</title>
                      <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 0)} rx={cornerRadius} fill={bar.color} />
                      {renderBarValueLabel(bar, x, barWidth, y)}
                      <text x={x + barWidth / 2} y="69.5" textAnchor="middle" fill="#475569" fontSize="4.1">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {projectBars.length > projectChartBars.length && (
                <p className="mt-1 text-[10px] text-slate-500">Showing top {projectChartBars.length} projects by tonnage.</p>
              )}
            </>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Material-wise</p>
          {materialChartBars.length === 0 ? (
            <p className="text-[11px] text-slate-500">No material tonnage data.</p>
          ) : (
            <>
              <svg viewBox="0 0 100 78" className="h-40 w-full" role="img" aria-label="Material wise tonnage bar chart">
                {yTicks.map((tick) => {
                  const y = chartTop + (1 - tick) * chartHeight;
                  return <line key={`mat-grid-${tick}`} x1="10" y1={y} x2="96" y2={y} stroke="#cbd5e1" strokeWidth="0.45" />;
                })}
                <line x1="10" y1={chartBottom} x2="96" y2={chartBottom} stroke="#94a3b8" strokeWidth="0.7" />
                {materialChartBars.map((bar, index) => {
                  const slot = 86 / materialChartBars.length;
                  const barWidth = Math.min(10, slot * 0.68);
                  const x = 10 + slot * index + (slot - barWidth) / 2;
                  const barHeight = (bar.tonnage / materialMax) * chartHeight;
                  const y = chartBottom - barHeight;
                  const label = formatAxisLabel(bar.label, Math.max(8, Math.floor(slot * 1.35)));
                  const cornerRadius = Math.min(2.2, barWidth / 2, Math.max(barHeight, 0) / 2);
                  return (
                    <g key={bar.key}>
                      <title>{`${bar.label}: ${bar.tonnage.toFixed(2)}t`}</title>
                      <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 0)} rx={cornerRadius} fill={bar.color} />
                      {renderBarValueLabel(bar, x, barWidth, y)}
                      <text x={x + barWidth / 2} y="69.5" textAnchor="middle" fill="#475569" fontSize="4.1">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {materialBars.length > materialChartBars.length && (
                <p className="mt-1 text-[10px] text-slate-500">Showing top {materialChartBars.length} materials by tonnage.</p>
              )}
            </>
          )}
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
  const [productionRange, setProductionRange] = useState<ProductionRange>('daily');
  const userMenuRef = useRef<HTMLDivElement>(null);

  const productionRangeWindowLabelText = productionRangeWindowLabel(productionRange);
  const productionScopeLabel = loggedInUser.role === 'User' ? 'your' : 'all';
  const dashboardEntryScopeCaption = `In the last ${productionRangeWindowLabelText}`;

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

  const rangeScopedAdminProjects = useMemo(
    () => filterProjectsEntriesSince(filteredAdminProjects, productionRangeSinceMs(productionRange)),
    [filteredAdminProjects, productionRange],
  );

  const rangeScopedVisibleProjects = useMemo(() => {
    const entryUsername = loggedInUser.role === 'User' ? loggedInUser.username : undefined;
    return filterProjectsEntriesSince(
      filteredVisibleProjects,
      productionRangeSinceMs(productionRange),
      entryUsername,
    );
  }, [filteredVisibleProjects, productionRange, loggedInUser.role, loggedInUser.username]);

  const productionStats = useMemo(() => {
    const scopedProjects = loggedInUser.role === 'Admin' ? rangeScopedAdminProjects : rangeScopedVisibleProjects;
    const entries = scopedProjects.flatMap((project) => project.entries);
    return {
      entryCount: entries.length,
      weightKg: sumEntryWeightKg(entries),
      weldingM: sumEntryWeldingM(entries),
    };
  }, [loggedInUser.role, rangeScopedAdminProjects, rangeScopedVisibleProjects]);

  const dashboardUserSubmissionCount = useMemo(
    () => rangeScopedVisibleProjects.reduce((sum, project) => sum + project.entries.length, 0),
    [rangeScopedVisibleProjects],
  );

  const dashboardLatestUserEntry = useMemo(() => {
    const entries = rangeScopedVisibleProjects.flatMap((project) => project.entries);
    entries.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    return entries[0];
  }, [rangeScopedVisibleProjects]);

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

  const adminTotalEntries = useMemo(
    () => rangeScopedAdminProjects.reduce((sum, project) => sum + project.entries.length, 0),
    [rangeScopedAdminProjects],
  );
  const adminTotalWeight = useMemo(
    () => rangeScopedAdminProjects.reduce((sum, p) => sum + sumProjectMaterialWeightKg(p), 0),
    [rangeScopedAdminProjects],
  );
  const adminTotalWelding = useMemo(
    () =>
      rangeScopedAdminProjects.reduce(
        (sum, p) => sum + p.entries.reduce((s, e) => s + (parseFloat(e.weldingMeters) || 0), 0),
        0,
      ),
    [rangeScopedAdminProjects],
  );
  const adminTonnageBreakdown = useMemo(() => buildTonnageBreakdown(rangeScopedAdminProjects), [rangeScopedAdminProjects]);

  const adminProjectSummaryRows = useMemo(
    () =>
      rangeScopedAdminProjects.map((p) => ({
        id: p.id,
        name: p.name,
        entryCount: p.entries.length,
        weightKg: sumProjectMaterialWeightKg(p),
        weldingM: sumEntryWeldingM(p.entries),
        createdOn: projectCreatedDisplay(p),
        statusLabel: projectSummaryStatusDisplay(p),
      })),
    [rangeScopedAdminProjects],
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
    const rows = rangeScopedAdminProjects.map((p, index) => ({
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
  }, [rangeScopedAdminProjects]);

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
    const flat: Flat[] = rangeScopedAdminProjects.flatMap((p) =>
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
  }, [rangeScopedAdminProjects]);

  const userProjectSummaryRows = useMemo(
    () =>
      rangeScopedVisibleProjects.map((p) => {
        const mine = p.entries;
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
    [rangeScopedVisibleProjects],
  );

  const userTotalWeight = useMemo(
    () => rangeScopedVisibleProjects.reduce((sum, project) => sum + sumProjectMaterialWeightKg(project), 0),
    [rangeScopedVisibleProjects],
  );

  const userTotalWelding = useMemo(
    () =>
      rangeScopedVisibleProjects.reduce(
        (sum, project) => sum + project.entries.reduce((entrySum, entry) => entrySum + (parseFloat(entry.weldingMeters) || 0), 0),
        0,
      ),
    [rangeScopedVisibleProjects],
  );
  const userTonnageBreakdown = useMemo(
    () => buildTonnageBreakdown(rangeScopedVisibleProjects, loggedInUser.username),
    [rangeScopedVisibleProjects, loggedInUser.username],
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
    const flat: Flat[] = rangeScopedVisibleProjects.flatMap((p) =>
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
  }, [rangeScopedVisibleProjects]);

  const viewerProjectSummaryRows = useMemo(
    () =>
      rangeScopedVisibleProjects.map((p) => ({
        id: p.id,
        name: p.name,
        entryCount: p.entries.length,
        weightKg: sumProjectMaterialWeightKg(p),
        weldingM: sumEntryWeldingM(p.entries),
        createdOn: projectCreatedDisplay(p),
        statusLabel: projectSummaryStatusDisplay(p),
      })),
    [rangeScopedVisibleProjects],
  );

  const viewerTotalEntries = useMemo(
    () => rangeScopedVisibleProjects.reduce((sum, p) => sum + p.entries.length, 0),
    [rangeScopedVisibleProjects],
  );

  const viewerTotalWeight = useMemo(
    () => rangeScopedVisibleProjects.reduce((sum, p) => sum + sumProjectMaterialWeightKg(p), 0),
    [rangeScopedVisibleProjects],
  );

  const viewerTotalWelding = useMemo(
    () =>
      rangeScopedVisibleProjects.reduce(
        (sum, p) => sum + p.entries.reduce((s, e) => s + (parseFloat(e.weldingMeters) || 0), 0),
        0,
      ),
    [rangeScopedVisibleProjects],
  );
  const viewerTonnageBreakdown = useMemo(() => buildTonnageBreakdown(rangeScopedVisibleProjects), [rangeScopedVisibleProjects]);

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
    const rows = rangeScopedVisibleProjects.map((p, index) => ({
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
  }, [rangeScopedVisibleProjects]);

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
    const flat: Flat[] = rangeScopedVisibleProjects.flatMap((p) =>
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
  }, [rangeScopedVisibleProjects]);

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
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
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

                <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Production</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-slate-900">
                        {productionStats.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
                      </p>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Based on {productionScopeLabel} entries from the last {productionRangeWindowLabelText}.
                      </p>
                    </div>
                    <div
                      className="inline-flex shrink-0 self-start rounded-lg border border-slate-200 bg-slate-50 p-1 sm:self-center"
                      role="group"
                      aria-label="Production range"
                    >
                      {(['daily', 'weekly', 'monthly'] as const).map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setProductionRange(range)}
                          aria-pressed={productionRange === range}
                          className={`min-w-[4.75rem] rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${
                            productionRange === range
                              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                </article>
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
                        <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                        <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                        <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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

                  <section className="grid grid-cols-1 gap-3">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
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

                  <section className="w-full">
                    <TonnageBarChartCard
                      title="Tonnage Overview"
                      plannedWeightKg={viewerTotalWeight}
                      actualWeightKg={viewerWeightDonut.totalW}
                      projectBars={viewerTonnageBreakdown.projectBars}
                      materialBars={viewerTonnageBreakdown.materialBars}
                    />
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

                  <section className="grid min-h-0 grid-cols-1 gap-3">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
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
                  <section className="w-full">
                    <TonnageBarChartCard
                      title="Tonnage Overview"
                      plannedWeightKg={adminTotalWeight}
                      actualWeightKg={adminWeightDonut.totalW}
                      projectBars={adminTonnageBreakdown.projectBars}
                      materialBars={adminTonnageBreakdown.materialBars}
                    />
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
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{dashboardUserSubmissionCount}</p>
                          <p className="text-[10px] text-emerald-600">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{dashboardLatestUserEntry?.value ?? '—'}</p>
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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
                          <p className="text-[10px] text-slate-500">{dashboardEntryScopeCaption}</p>
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

                  <section className="grid grid-cols-1 gap-3">
                    <article className="flex min-h-80 flex-col rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
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

                  <section className="w-full">
                    <TonnageBarChartCard
                      title="My Tonnage Overview"
                      plannedWeightKg={userTotalWeight}
                      actualWeightKg={sumEntryWeightKg(rangeScopedVisibleProjects.flatMap((project) => project.entries))}
                      projectBars={userTonnageBreakdown.projectBars}
                      materialBars={userTonnageBreakdown.materialBars}
                    />
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
