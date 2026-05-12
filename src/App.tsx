import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { DashboardPage } from './components/DashboardPage.tsx';
import { FirstLoginSetupPage } from './components/FirstLoginSetupPage.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import type { CreateProjectPayload } from './components/CreateProjectForm.tsx';
import type { NavTab, Project, ProjectEntry, Role, UserAccount } from './types';
import type { DashboardPointApi } from './services/dashboardApi.ts';
import {
  type ApiUserRow,
  assignUserToProject,
  createProject,
  createProjectData,
  createUser,
  deleteProject,
  deleteProjectData,
  deleteUser,
  exportProjectSummaryReport,
  getAdminProjectsPage,
  getAdminProjectsStats,
  getBulkDashboardData,
  getProfile,
  listProjects,
  listUsers,
  login,
  updateProfile,
  updateProject,
  updateProjectData,
  updateUser,
} from './services/index.ts';
const SESSION_AUTH_KEY = 'ma_session_auth';
const toNumber = (value: string) => Number.parseFloat(value) || 0;

function getPathState(pathname: string): { tab: NavTab; summaryProjectId: number | null } {
  const clean = pathname.trim().toLowerCase();
  if (clean === '/projects' || clean === '/projects/') return { tab: 'projects', summaryProjectId: null };
  if (clean === '/members' || clean === '/members/') return { tab: 'members', summaryProjectId: null };
  if (clean === '/profile' || clean === '/profile/') return { tab: 'profile', summaryProjectId: null };
  if (clean === '/dashboard' || clean === '/dashboard/' || clean === '/' || clean === '') {
    return { tab: 'dashboard', summaryProjectId: null };
  }
  const summaryMatch = clean.match(/^\/projects\/(\d+)\/?$/);
  if (summaryMatch) {
    return { tab: 'projectSummary', summaryProjectId: Number.parseInt(summaryMatch[1], 10) || null };
  }
  return { tab: 'dashboard', summaryProjectId: null };
}

function getPathForState(activeTab: NavTab, summaryProjectId: number | null): string {
  if (activeTab === 'projectSummary' && summaryProjectId != null) return `/projects/${summaryProjectId}`;
  if (activeTab === 'projects' || activeTab === 'projectSummary') return '/projects';
  if (activeTab === 'members') return '/members';
  if (activeTab === 'profile') return '/profile';
  return '/dashboard';
}

function parseDimensionParts(raw: string): number[] {
  const matches = raw.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return matches.map((part) => Number.parseFloat(part)).filter((value) => Number.isFinite(value) && value > 0);
}

function computeMaterialWeightFromDimensions(materialName: string, dimensions: string, quantity: string): number {
  const qty = Math.max(Number.parseFloat(quantity) || 0, 0);
  if (!qty) return 0;
  const dims = parseDimensionParts(dimensions);
  if (dims.length < 2) return 0;
  const name = materialName.toLowerCase();
  const density = 7850;
  const pi = Math.PI;
  let volumeMm3 = 0;
  if (name.includes('pipe') && dims.length >= 3) {
    const [length, od, thk] = dims;
    const innerDiameter = Math.max(od - 2 * thk, 0);
    volumeMm3 = (pi / 4) * (od * od - innerDiameter * innerDiameter) * length;
  } else if (name.includes('rod') && dims.length >= 2) {
    const [length, dia] = dims;
    volumeMm3 = (pi / 4) * dia * dia * length;
  } else if ((name.includes('angel') || name.includes('angle')) && dims.length >= 4) {
    const [length, legA, legB, thk] = dims;
    volumeMm3 = (legA + legB - thk) * thk * length;
  } else if ((name.includes('flunge') || name.includes('flange')) && dims.length >= 3) {
    const [od, id, thk] = dims;
    volumeMm3 = (pi / 4) * Math.max(od * od - id * id, 0) * thk;
  } else if (dims.length >= 3) {
    const [length, width, thickness] = dims;
    volumeMm3 = length * width * thickness;
  }
  return ((volumeMm3 * density) / 1_000_000_000) * qty;
}

type SessionAuth = {
  accessToken: string;
  username: string;
  role: Role;
  firstLogin: boolean;
  contactNo: string;
};

const ROLES: Role[] = ['Admin', 'User', 'Viewer'];

function readStoredAuth(): SessionAuth | null {
  try {
    const raw = localStorage.getItem(SESSION_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionAuth>;
    if (
      typeof parsed.accessToken !== 'string' ||
      !parsed.accessToken ||
      typeof parsed.username !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.firstLogin !== 'boolean'
    ) {
      return null;
    }
    if (!ROLES.includes(parsed.role as Role)) return null;
    return {
      accessToken: parsed.accessToken,
      username: parsed.username,
      role: parsed.role as Role,
      firstLogin: parsed.firstLogin,
      contactNo: typeof parsed.contactNo === 'string' ? parsed.contactNo : '',
    };
  } catch {
    return null;
  }
}

type AdminProjectsPageSummary = {
  totalProjects: number;
  totalEntries: number;
  activeMembers: number;
};

function isFirstLoginRequiredError(error: unknown) {
  return error instanceof Error && /password change required on first login/i.test(error.message);
}

function mapUser(raw: ApiUserRow): UserAccount {
  const fullName = (raw.full_name ?? '').trim() || raw.username;
  const email = (raw.email ?? '').trim() || `${raw.username}@maruthi.local`;
  return {
    id: raw.id,
    username: raw.username,
    fullName,
    email,
    designation: (raw.designation ?? '').trim(),
    contactNo: raw.contact_no ?? '',
    role: raw.role,
    password: '',
    firstLogin: raw.first_login,
    assignedProjectIds: raw.assigned_project_ids ?? [],
    assignedOn: new Date().toISOString().slice(0, 10),
  };
}

function toEntry(
  projectName: string,
  username: string,
  point: { id: number; timestamp: string; value: number; meta?: Record<string, unknown> | null },
): ProjectEntry {
  const m = point.meta;
  const fromMeta = (key: string) => (m && typeof m === 'object' && m[key] != null ? String(m[key]) : '');
  const weightStr = fromMeta('weight') || String(point.value);
  return {
    dataId: point.id,
    user: fromMeta('user') || username,
    label: projectName,
    value: String(point.value),
    createdAt: new Date(point.timestamp).toLocaleString(),
    projectType: fromMeta('projectType'),
    areaSection: fromMeta('areaSection'),
    itemDetails: fromMeta('itemDetails'),
    dimensions: fromMeta('dimensions'),
    lengthMm: fromMeta('lengthMm'),
    widthMm: fromMeta('widthMm'),
    thkDia: fromMeta('thkDia'),
    densityKgM3: fromMeta('densityKgM3'),
    qty: fromMeta('qty'),
    weight: weightStr,
    weldingMeters: fromMeta('weldingMeters'),
    remarks: fromMeta('remarks'),
  };
}

function parseLegacyMaterialFromParameter(parameterValue: unknown): Array<{ name: string; dimensions: string; quantity: string }> {
  const raw = String(parameterValue ?? '');
  if (!raw) return [];
  const segments = raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  let materialName = '';
  let dimensions = '';
  for (const segment of segments) {
    const lower = segment.toLowerCase();
    if (lower.startsWith('material:')) materialName = segment.slice('material:'.length).trim();
    if (lower.startsWith('dimensions:')) dimensions = segment.slice('dimensions:'.length).trim();
  }
  if (!materialName && !dimensions) return [];
  return [{ name: materialName, dimensions, quantity: '' }];
}

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserAccount | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminProjectsPageSummary, setAdminProjectsPageSummary] = useState<AdminProjectsPageSummary | null>(null);
  const [auth, setAuth] = useState<SessionAuth | null>(() => readStoredAuth());
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState('Use backend credentials to login.');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [summaryProjectId, setSummaryProjectId] = useState<number | null>(null);
  const [showProjectCreateForm, setShowProjectCreateForm] = useState(false);
  const [showMemberCreateForm, setShowMemberCreateForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editContactNo, setEditContactNo] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editAssignedOn, setEditAssignedOn] = useState('');
  const [editRole, setEditRole] = useState<Role>('Viewer');
  const [editProjectIds, setEditProjectIds] = useState<number[]>([]);
  const adminProjectPage = 1;
  const adminProjectPerPage = 20;
  const [adminProjectSearch, setAdminProjectSearch] = useState('');

  const loggedInUser = useMemo(() => {
    if (!auth) return null;
    const listed = users.find((user) => user.username === auth.username);
    const profile = currentUserProfile?.username === auth.username ? currentUserProfile : null;
    if (listed && profile && listed.id === profile.id) {
      return {
        ...listed,
        fullName: profile.fullName,
        email: profile.email,
        designation: profile.designation,
        contactNo: profile.contactNo || listed.contactNo,
        firstLogin: profile.firstLogin,
      };
    }
    if (listed) return listed;
    if (profile) return profile;
    return {
      id: -1,
      username: auth.username,
      fullName: auth.username,
      email: `${auth.username}@maruthi.local`,
      designation: '',
      contactNo: auth.contactNo,
      role: auth.role,
      password: '',
      firstLogin: auth.firstLogin,
      assignedProjectIds: auth.role === 'Admin' ? projects.map((project) => project.id) : [],
      assignedOn: new Date().toISOString().slice(0, 10),
    };
  }, [auth, users, currentUserProfile, projects]);

  const isAdmin = loggedInUser?.role === 'Admin';
  const visibleProjects = useMemo(() => {
    if (!loggedInUser) return [];
    if (loggedInUser.role === 'Admin') return projects;
    const assigned = new Set(loggedInUser.assignedProjectIds);
    return projects.filter((project) => assigned.has(project.id));
  }, [projects, loggedInUser]);
  const totalProjects = projects.length;
  const totalMembers = users.length;

  const userSubmissionCount = projects.reduce(
    (sum, project) => sum + project.entries.filter((entry) => entry.user === loggedInUser?.username).length,
    0,
  );
  const userEntries = visibleProjects
    .flatMap((project) =>
      project.entries
        .filter((entry) => entry.user === loggedInUser?.username)
        .map((entry) => ({ ...entry, projectName: project.name })),
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const latestUserEntry = userEntries[userEntries.length - 1];
  const userTrendEntries = userEntries.slice(-6);
  const userTrendValues = userTrendEntries.map((entry) => Number.parseFloat(entry.weight || entry.value) || 0);
  const userTrendMax = Math.max(...userTrendValues, 1);
  const userTrendPoints = userTrendValues
    .map((value, index) => {
      if (userTrendValues.length === 1) return '50,50';
      const x = (index / (userTrendValues.length - 1)) * 100;
      const y = 100 - (value / userTrendMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const userProjectBars = visibleProjects.map((project) => ({
    id: project.id,
    name: project.name,
    count: project.entries.filter((entry) => entry.user === loggedInUser?.username).length,
  }));
  const userProjectBarMax = Math.max(...userProjectBars.map((item) => item.count), 1);
  const userMonthlyMetrics = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { year: d.getFullYear(), month: d.getMonth(), label, entryCount: 0 };
    });
    const byMonth = new Map<string, number>();
    buckets.forEach((bucket, index) => byMonth.set(`${bucket.year}-${bucket.month}`, index));
    userEntries.forEach((entry) => {
      const parsed = new Date(entry.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const idx = byMonth.get(`${parsed.getFullYear()}-${parsed.getMonth()}`);
      if (idx == null) return;
      buckets[idx].entryCount += 1;
    });
    return {
      months: buckets.map((bucket) => bucket.label),
      entryValues: buckets.map((bucket) => bucket.entryCount),
    };
  }, [userEntries]);
  const userActivityMonths = userMonthlyMetrics.months;
  const userActivityValues = userMonthlyMetrics.entryValues;
  const userActivityMax = Math.max(...userActivityValues, 1);
  const userActivityPoints = userActivityValues
    .map((value, index) => {
      if (userActivityValues.length === 1) return '50,50';
      const x = (index / (userActivityValues.length - 1)) * 100;
      const y = 100 - (value / userActivityMax) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  const viewerActiveUsers = new Set(visibleProjects.flatMap((project) => project.entries.map((entry) => entry.user))).size;
  const viewerCompletionRate = visibleProjects.length
    ? Math.round((visibleProjects.filter((project) => project.entries.length > 0).length / visibleProjects.length) * 100)
    : 0;
  const viewerMonthlyMetrics = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { year: d.getFullYear(), month: d.getMonth(), label, entryCount: 0, totalWeight: 0 };
    });
    const byMonth = new Map<string, number>();
    buckets.forEach((bucket, index) => byMonth.set(`${bucket.year}-${bucket.month}`, index));
    visibleProjects.flatMap((project) => project.entries).forEach((entry) => {
      const parsed = new Date(entry.createdAt);
      if (Number.isNaN(parsed.getTime())) return;
      const idx = byMonth.get(`${parsed.getFullYear()}-${parsed.getMonth()}`);
      if (idx == null) return;
      buckets[idx].entryCount += 1;
      buckets[idx].totalWeight += Number.parseFloat(entry.weight || entry.value) || 0;
    });
    return {
      months: buckets.map((bucket) => bucket.label),
      entryValues: buckets.map((bucket) => bucket.entryCount),
      weightValues: buckets.map((bucket) => Number(bucket.totalWeight.toFixed(2))),
    };
  }, [visibleProjects]);
  const viewerTrendMonths = viewerMonthlyMetrics.months;
  const viewerTrendValues = viewerMonthlyMetrics.weightValues;
  const viewerTrendMax = Math.max(...viewerTrendValues, 1);
  const viewerTrendPoints = viewerTrendValues
    .map((value, index) => `${(index / (viewerTrendValues.length - 1)) * 100},${100 - (value / viewerTrendMax) * 100}`)
    .join(' ');
  const viewerActivityValues = viewerMonthlyMetrics.entryValues;
  const viewerActivityMax = Math.max(...viewerActivityValues, 1);
  const viewerActivityPoints = viewerActivityValues
    .map((value, index) => `${(index / (viewerActivityValues.length - 1)) * 100},${100 - (value / viewerActivityMax) * 100}`)
    .join(' ');

  const setActiveTabClearingSummary = (tab: NavTab) => {
    if (tab !== 'projectSummary') {
      setSummaryProjectId(null);
    }
    setActiveTab(tab);
  };

  const openProjectSummary = (projectId: number) => {
    setSummaryProjectId(projectId);
    setActiveTab('projectSummary');
  };

  const closeProjectSummary = () => {
    setSummaryProjectId(null);
    setActiveTab('projects');
  };

  const navButtonClass = (tab: NavTab) => {
    const active =
      activeTab === tab || (tab === 'projects' && activeTab === 'projectSummary');
    return `w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
      active ? 'bg-teal-50 font-semibold text-pulse-teal' : 'text-slate-600 hover:bg-slate-50'
    }`;
  };

  const loadAdminProjectsPageSummary = async (token: string) => {
    const stats = await getAdminProjectsStats(token);
    setAdminProjectsPageSummary({
      totalProjects: stats.total_projects,
      totalEntries: stats.total_entries,
      activeMembers: stats.active_members,
    });
  };

  const loadProjectsWithData = async (
    token: string,
    username: string,
    role: Role,
    options?: { adminSearch?: string },
  ) => {
    try {
      if (role === 'Admin') {
        const search = options?.adminSearch !== undefined ? options.adminSearch : adminProjectSearch;
        const adminProjects = await getAdminProjectsPage(token, adminProjectPage, adminProjectPerPage, search);
        const projectItems = adminProjects.items;

        const projectIds = projectItems.map((project) => project.id);
        const bulk = await getBulkDashboardData(token, projectIds);
        const pointsByProjectId = new Map<number, DashboardPointApi[]>(
          bulk.items.map((item) => [item.project_id, item.points]),
        );

        const detailResults = await Promise.allSettled(
          projectItems.map(async (project) => {
            const points = pointsByProjectId.get(project.id) ?? [];
            return {
              id: project.id,
              name: project.name,
              description: String(project.parameters?.description ?? ''),
              parameter: String(project.parameters?.parameter ?? ''),
              location: String(project.parameters?.location ?? ''),
              dateOfCommitment: String(project.parameters?.dateOfCommitment ?? ''),
              plannedFinishDate: String(project.parameters?.plannedFinishDate ?? ''),
              materials: Array.isArray(project.parameters?.materials)
                ? (project.parameters?.materials as Array<Record<string, unknown>>).map((material) => ({
                    name: String(material.name ?? ''),
                    dimensions: String(material.dimensions ?? ''),
                    quantity: String(material.quantity ?? ''),
                  }))
                : parseLegacyMaterialFromParameter(project.parameters?.parameter),
              projectKind: String(project.parameters?.projectKind ?? ''),
              projectStatus: String(project.parameters?.projectStatus ?? ''),
              entries: points.map((point) => toEntry(project.name, username, point)),
            } satisfies Project;
          }),
        );
        const loadedAdminProjects = detailResults
          .map((r) => (r.status === 'fulfilled' ? r.value : null))
          .filter((p) => p != null) as Project[];
        setProjects(loadedAdminProjects);
        if (role === 'Admin') {
          await loadAdminProjectsPageSummary(token);
        } else {
          setAdminProjectsPageSummary(null);
        }
        return;
      }

      setAdminProjectsPageSummary(null);
      let rawProjects = await listProjects(token);
      try {
        const rawProfile = await getProfile(token);
        const assigned = new Set(rawProfile.assigned_project_ids ?? []);
        rawProjects = rawProjects.filter((project) => assigned.has(project.id));
      } catch {
        // If profile fetch fails, do not widen access scope.
        rawProjects = [];
      }
      if (rawProjects.length === 0) {
        setProjects([]);
        return;
      }
      const bulk = await getBulkDashboardData(
        token,
        rawProjects.map((project) => project.id),
      );
      const pointsByProjectId = new Map<number, DashboardPointApi[]>(
        bulk.items.map((item) => [item.project_id, item.points]),
      );
      const loadedProjects = await Promise.all(
        rawProjects.map(async (project) => {
          const points = pointsByProjectId.get(project.id) ?? [];
          return {
            id: project.id,
            name: project.name,
            description: String(project.parameters?.description ?? ''),
            parameter: String(project.parameters?.parameter ?? ''),
            location: String(project.parameters?.location ?? ''),
            dateOfCommitment: String(project.parameters?.dateOfCommitment ?? ''),
            plannedFinishDate: String(project.parameters?.plannedFinishDate ?? ''),
            materials: Array.isArray(project.parameters?.materials)
              ? (project.parameters?.materials as Array<Record<string, unknown>>).map((material) => ({
                  name: String(material.name ?? ''),
                  dimensions: String(material.dimensions ?? ''),
                  quantity: String(material.quantity ?? ''),
                }))
              : parseLegacyMaterialFromParameter(project.parameters?.parameter),
            projectKind: String(project.parameters?.projectKind ?? ''),
            projectStatus: String(project.parameters?.projectStatus ?? ''),
            entries: points.map((point) => toEntry(project.name, username, point)),
          } satisfies Project;
        }),
      );
      setProjects(loadedProjects);
    } catch (error) {
      if (isFirstLoginRequiredError(error)) {
        setAuth((current) => (current ? { ...current, firstLogin: true } : current));
        setStatus('Please complete First Login Setup to continue.');
        return;
      }
      throw error;
    }
  };

  const loadUsers = async (token: string, role: Role) => {
    if (role !== 'Admin') return;
    const rawUsers = await listUsers(token);
    setUsers(rawUsers.map((user) => mapUser(user)));
  };

  const refreshCurrentUserProfile = async (token: string) => {
    try {
      const raw = await getProfile(token);
      setCurrentUserProfile(mapUser(raw));
    } catch {
      setCurrentUserProfile(null);
    }
  };

  const handleAdminProjectSearch = async () => {
    if (!auth || auth.role !== 'Admin') return;
    const q = adminProjectSearch.trim();
    setAdminProjectSearch(q);
    await loadProjectsWithData(auth.accessToken, auth.username, auth.role, { adminSearch: q });
  };

  const handleClearAdminProjectSearch = async () => {
    if (!auth || auth.role !== 'Admin') return;
    setAdminProjectSearch('');
    await loadProjectsWithData(auth.accessToken, auth.username, auth.role, { adminSearch: '' });
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const username = String(formData.get('username') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    try {
      const loginResponse = await login(username, password);
      setAuth({
        accessToken: loginResponse.access_token,
        username,
        role: loginResponse.role,
        firstLogin: loginResponse.first_login,
        contactNo: '',
      });
      setLoginError('');
      setStatus('Loading…');
      setAdminProjectSearch('');
      form.reset();
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleAdminSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) return;
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const username = String(formData.get('username') ?? auth.username).trim();
    const email = String(formData.get('email') ?? '').trim();
    const contactNo = String(formData.get('contactNo') ?? '').trim();
    const designation = String(formData.get('designation') ?? '').trim();
    const newPassword = String(formData.get('newPassword') ?? '').trim();
    if (!fullName) {
      setStatus('Full name is required.');
      return;
    }
    if (!username) {
      setStatus('Username is required.');
      return;
    }
    if (!email) {
      setStatus('Email is required.');
      return;
    }
    if (!newPassword) {
      setStatus('New password is required.');
      return;
    }
    try {
      const updated = await updateProfile(auth.accessToken, {
        username,
        new_password: newPassword,
        contact_no: contactNo || null,
        full_name: fullName,
        email,
        designation: designation || null,
      });
      const mapped = mapUser(updated);
      setCurrentUserProfile(mapped);
      setAuth({
        ...auth,
        accessToken: updated.access_token ?? auth.accessToken,
        username: updated.username,
        firstLogin: updated.first_login,
        contactNo: updated.contact_no ?? '',
      });
      setUsers((current) =>
        current.some((u) => u.id === mapped.id || u.username === auth.username || u.username === mapped.username)
          ? current.map((user) =>
              user.id === mapped.id || user.username === auth.username || user.username === mapped.username ? mapped : user,
            )
          : current,
      );
      setStatus('Setup completed successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to complete setup');
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !loggedInUser) return;
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const username = String(formData.get('username') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const newPassword = String(formData.get('newPassword') ?? '').trim();
    const contactNo = String(formData.get('contactNo') ?? '').trim();
    const designation = String(formData.get('designation') ?? '').trim();
    if (!fullName) {
      setStatus('Full name is required.');
      return;
    }
    if (!username) {
      setStatus('Username is required.');
      return;
    }
    if (!email) {
      setStatus('Email is required.');
      return;
    }
    try {
      const updated = await updateProfile(auth.accessToken, {
        username,
        new_password: newPassword || null,
        contact_no: contactNo || null,
        full_name: fullName,
        email,
        designation: designation || null,
      });
      const mapped = mapUser(updated);
      setCurrentUserProfile(mapped);
      setAuth((current) =>
        current
          ? {
              ...current,
              accessToken: updated.access_token ?? current.accessToken,
              username: updated.username,
              firstLogin: updated.first_login,
              contactNo: updated.contact_no ?? '',
            }
          : current,
      );
      setUsers((current) =>
        current.some((user) => user.id === loggedInUser.id || user.username === auth.username)
          ? current.map((user) =>
              user.id === loggedInUser.id || user.username === auth.username ? mapped : user,
            )
          : current,
      );
      setStatus('Profile saved successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Profile update failed');
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>): Promise<boolean> => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!auth || auth.role !== 'Admin') return false;
    const formData = new FormData(form);
    const fullName = String(formData.get('fullName') ?? '').trim();
    const usernamePart = String(formData.get('username') ?? '').trim();
    const username = usernamePart || fullName;
    const role = String(formData.get('role') ?? 'Viewer') as Role;
    const projectIds = formData.getAll('projects').map((id) => Number(id));
    const contactNo = String(formData.get('contactNo') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const designation = String(formData.get('designation') ?? '').trim();
    const password = String(formData.get('password') ?? '').trim();
    if (!username) {
      setStatus('First name (or username) is required.');
      return false;
    }
    if (password.length < 8) {
      setStatus('Password must be at least 8 characters.');
      return false;
    }
    try {
      const created = await createUser(auth.accessToken, {
        username,
        password,
        role,
        contact_no: contactNo || null,
        full_name: fullName || null,
        email: email || null,
        designation: designation || null,
      });
      for (const projectId of projectIds) {
        await assignUserToProject(auth.accessToken, created.user.id, projectId);
      }
      await loadUsers(auth.accessToken, auth.role);
      await loadAdminProjectsPageSummary(auth.accessToken);
      setStatus(`User created successfully. ${created.user.username} can login with the chosen password.`);
      setShowMemberCreateForm(false);
      form.reset();
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create user');
      return false;
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!auth || auth.role !== 'Admin') return;
    try {
      await deleteUser(auth.accessToken, memberId);
      await loadUsers(auth.accessToken, auth.role);
      await loadAdminProjectsPageSummary(auth.accessToken);
      setStatus('Member deleted successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleStartEditMember = (member: UserAccount) => {
    setShowMemberCreateForm(false);
    setEditingMemberId(member.id);
    setEditFullName(member.fullName);
    setEditUsername(member.username);
    setEditEmail(member.email);
    setEditContactNo(member.contactNo);
    setEditDesignation(member.designation);
    setEditAssignedOn(member.assignedOn);
    setEditRole(member.role);
    setEditProjectIds(member.assignedProjectIds);
  };

  const handleToggleEditProject = (projectId: number) => {
    setEditProjectIds((current) => (current.includes(projectId) ? current.filter((id) => id !== projectId) : [...current, projectId]));
  };

  const handleSaveMemberEdit = async (memberId: number) => {
    if (!auth || auth.role !== 'Admin') return;
    const clientFields = {
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      contactNo: editContactNo.trim(),
      designation: editDesignation.trim(),
      assignedOn: editAssignedOn,
    };
    try {
      await updateUser(auth.accessToken, memberId, {
        username: editUsername.trim(),
        role: editRole,
        project_ids: editProjectIds,
        contact_no: clientFields.contactNo || null,
        full_name: clientFields.fullName || null,
        email: clientFields.email || null,
        designation: clientFields.designation || null,
      });
      await loadUsers(auth.accessToken, auth.role);
      await loadAdminProjectsPageSummary(auth.accessToken);
      setEditingMemberId(null);
      setStatus('Member updated successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Member update failed');
    }
  };

  const handleCreateProject = async (payload: CreateProjectPayload): Promise<boolean> => {
    if (!auth || auth.role !== 'Admin') return false;
    const body = {
      name: payload.name,
      parameters: {
        description: payload.description,
        parameter: payload.parameter ?? '',
        projectKind: payload.projectKind,
        projectStatus: payload.projectStatus,
        location: payload.location ?? '',
        dateOfCommitment: payload.dateOfCommitment ?? '',
        plannedFinishDate: payload.plannedFinishDate ?? '',
        materials: payload.materials ?? [],
      },
      initial_items: payload.items.map((row) => ({
        project_type: row.projectType,
        area_section: row.areaSection,
        item_details: row.itemDetails,
        length_mm: row.lengthMm,
        width_mm: row.widthMm,
        thk_dia: row.thkDia,
        density_kg_m3: row.densityKgM3,
        qty: row.qty,
        weight_kg: row.weightKg,
        welding_meters: row.weldingMeters,
        remarks: row.remarks,
      })),
    };
    try {
      await createProject(auth.accessToken, body);
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setShowProjectCreateForm(false);
      setStatus(
        payload.items.length
          ? `Project "${payload.name}" created with ${payload.items.length} line item(s).`
          : `Project "${payload.name}" created. Add entries manually from the project or dashboard when ready.`,
      );
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to create project');
      return false;
    }
  };

  const handleUpdateProject = async (projectId: number, payload: CreateProjectPayload): Promise<boolean> => {
    if (!auth || auth.role !== 'Admin') return false;
    try {
      await updateProject(auth.accessToken, projectId, {
        name: payload.name,
        parameters: {
          description: payload.description,
          parameter: payload.parameter ?? '',
          projectKind: payload.projectKind,
          projectStatus: payload.projectStatus,
          location: payload.location ?? '',
          dateOfCommitment: payload.dateOfCommitment ?? '',
          plannedFinishDate: payload.plannedFinishDate ?? '',
          materials: payload.materials ?? [],
        },
      });
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setStatus(`Project "${payload.name}" updated.`);
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Update failed');
      return false;
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!auth || auth.role !== 'Admin') return;
    try {
      await deleteProject(auth.accessToken, projectId);
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setStatus('Project deleted successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleCreateUserProjectEntry = async (payload: {
    projectId: number;
    areaSection: string;
    materialName: string;
    dimensions: string;
    quantity: string;
    weldingMeters: string;
    remarks: string;
  }) => {
    if (!loggedInUser || !auth) return;
    const projectId = payload.projectId;
    const areaSection = payload.areaSection.trim();
    const itemDetails = payload.materialName.trim();
    const dimensions = payload.dimensions.trim();
    const qty = payload.quantity.trim();
    let lengthMm = '';
    let widthMm = '';
    let thkDia = '';
    const dimParts = parseDimensionParts(dimensions);
    if (dimParts.length >= 1) lengthMm = String(dimParts[0]);
    if (dimParts.length >= 2) widthMm = String(dimParts[1]);
    if (dimParts.length >= 3) thkDia = String(dimParts[2]);
    const densityKgM3 = '7850';
    const computedWeightValue = computeMaterialWeightFromDimensions(itemDetails, dimensions, qty);
    const computedWeight = computedWeightValue.toFixed(2);
    if (!projectId) return;
    try {
      await createProjectData(auth.accessToken, {
        project_id: projectId,
        value: Number.parseFloat(computedWeight) || 0,
        meta: {
          user: loggedInUser.username,
          projectType: 'Material Entry',
          areaSection,
          itemDetails,
          dimensions,
          lengthMm,
          widthMm,
          thkDia,
          densityKgM3,
          qty,
          weight: computedWeight,
          weldingMeters: payload.weldingMeters.trim(),
          remarks: payload.remarks.trim(),
        },
      });
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setStatus(`Data submitted for ${itemDetails || areaSection || 'project'}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Submit failed');
    }
  };

  const handleUpdateUserProjectEntry = async (
    projectId: number,
    entryIndex: number,
    updates: Pick<
      ProjectEntry,
      'projectType' | 'areaSection' | 'itemDetails' | 'lengthMm' | 'widthMm' | 'thkDia' | 'densityKgM3' | 'qty' | 'weldingMeters' | 'remarks'
    >,
  ) => {
    if (!auth) return;
    const project = projects.find((item) => item.id === projectId);
    const entry = project?.entries[entryIndex];
    if (!entry?.dataId) {
      setStatus('Entry id not found.');
      return;
    }
    const updatedWeight = (
      toNumber(updates.lengthMm) * toNumber(updates.widthMm) * toNumber(updates.thkDia) * toNumber(updates.densityKgM3) * Math.max(toNumber(updates.qty), 1) / 1_000_000_000
    ).toFixed(2);
    const meta = {
      user: entry.user,
      projectType: updates.projectType,
      areaSection: updates.areaSection,
      itemDetails: updates.itemDetails,
      lengthMm: updates.lengthMm,
      widthMm: updates.widthMm,
      thkDia: updates.thkDia,
      densityKgM3: updates.densityKgM3,
      qty: updates.qty,
      weight: updatedWeight,
      weldingMeters: updates.weldingMeters,
      remarks: updates.remarks,
    };
    try {
      await updateProjectData(auth.accessToken, entry.dataId, {
        value: Number.parseFloat(updatedWeight) || 0,
        meta,
      });
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setStatus('Project entry updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Entry update failed');
    }
  };

  const handleDeleteUserProjectEntry = async (projectId: number, dataId: number) => {
    if (!auth) return;
    try {
      await deleteProjectData(auth.accessToken, dataId);
      await loadProjectsWithData(auth.accessToken, auth.username, auth.role);
      setStatus('Project entry deleted.');
      if (summaryProjectId === projectId) {
        setSummaryProjectId(projectId);
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Entry delete failed');
    }
  };

  const handleExportProjectReport = async (projectId: number) => {
    if (!auth) return;
    try {
      const blob = await exportProjectSummaryReport(auth.accessToken, projectId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}_summary.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('Project report exported.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed');
    }
  };

  useEffect(() => {
    if (auth) return;
    setActiveTab('dashboard');
    setSummaryProjectId(null);
  }, [auth]);

  useEffect(() => {
    if (!auth || auth.firstLogin) return;
    const pathState = getPathState(window.location.pathname);
    const allowMembers = auth.role === 'Admin';
    const nextTab = !allowMembers && pathState.tab === 'members' ? 'dashboard' : pathState.tab;
    if (nextTab === 'projectSummary') {
      setSummaryProjectId(pathState.summaryProjectId);
      setActiveTab('projectSummary');
      return;
    }
    setSummaryProjectId(null);
    setActiveTab(nextTab);
  }, [auth?.accessToken, auth?.firstLogin, auth?.role]);

  useEffect(() => {
    try {
      if (auth) localStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(auth));
      else localStorage.removeItem(SESSION_AUTH_KEY);
    } catch {
      /* ignore quota / private mode */
    }
  }, [auth]);

  useEffect(() => {
    const targetPath = !auth ? '/login' : auth.firstLogin ? '/setup' : getPathForState(activeTab, summaryProjectId);
    const current = window.location.pathname;
    if (current !== targetPath) {
      window.history.replaceState(null, '', targetPath);
    }
  }, [auth, activeTab, summaryProjectId]);

  useEffect(() => {
    const token = auth?.accessToken;
    if (!token || !auth) return;
    let cancelled = false;
    (async () => {
      try {
        if (auth.firstLogin) {
          await refreshCurrentUserProfile(token);
          if (!cancelled) {
            setLoginError('');
            setStatus('Complete First Login Setup to continue.');
          }
          return;
        }
        await loadProjectsWithData(token, auth.username, auth.role, { adminSearch: '' });
        await loadUsers(token, auth.role);
        await refreshCurrentUserProfile(token);
        if (!cancelled) {
          setLoginError('');
          setStatus(`Welcome ${auth.username}.`);
        }
      } catch (error) {
        if (!cancelled) {
          setAuth(null);
          setLoginError(
            isFirstLoginRequiredError(error)
              ? 'Complete first-login setup on a fresh sign-in.'
              : 'Session expired or invalid. Please login again.',
          );
          setStatus('Use backend credentials to login.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally only re-run when the access token or first-login state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load* fns close over latest auth fields for the same token
  }, [auth?.accessToken, auth?.firstLogin]);

  if (!loggedInUser || !auth) {
    return <LoginPage onSubmit={handleLogin} loginError={loginError} />;
  }
  if (loggedInUser.firstLogin) {
    return <FirstLoginSetupPage user={loggedInUser} status={status} onSubmit={handleAdminSetup} />;
  }

  return (
    <DashboardPage
      activeTab={activeTab}
      setActiveTab={setActiveTabClearingSummary}
      summaryProjectId={summaryProjectId}
      openProjectSummary={openProjectSummary}
      closeProjectSummary={closeProjectSummary}
      navButtonClass={navButtonClass}
      isAdmin={isAdmin}
      loggedInUser={loggedInUser}
      setSessionUserId={() => {
        setAuth(null);
        setUsers([]);
        setCurrentUserProfile(null);
        setProjects([]);
        setAdminProjectsPageSummary(null);
        setAdminProjectSearch('');
      }}
      totalProjects={totalProjects}
      totalMembers={totalMembers}
      visibleProjects={visibleProjects}
      userSubmissionCount={userSubmissionCount}
      latestUserEntry={latestUserEntry}
      viewerActiveUsers={viewerActiveUsers}
      viewerCompletionRate={viewerCompletionRate}
      viewerTrendMonths={viewerTrendMonths}
      viewerTrendValues={viewerTrendValues}
      viewerTrendMax={viewerTrendMax}
      viewerTrendPoints={viewerTrendPoints}
      viewerActivityMonths={viewerTrendMonths}
      viewerActivityValues={viewerActivityValues}
      viewerActivityMax={viewerActivityMax}
      viewerActivityPoints={viewerActivityPoints}
      projects={projects}
      handleCreateUser={handleCreateUser}
      handleCreateProject={handleCreateProject}
      handleCreateUserProjectEntry={handleCreateUserProjectEntry}
      userTrendEntries={userTrendEntries}
      userTrendValues={userTrendValues}
      userTrendMax={userTrendMax}
      userTrendPoints={userTrendPoints}
      userActivityMonths={userActivityMonths}
      userActivityValues={userActivityValues}
      userActivityMax={userActivityMax}
      userActivityPoints={userActivityPoints}
      userProjectBars={userProjectBars}
      userProjectBarMax={userProjectBarMax}
      users={users}
      showProjectCreateForm={showProjectCreateForm}
      setShowProjectCreateForm={setShowProjectCreateForm}
      handleUpdateProject={handleUpdateProject}
      handleDeleteProject={handleDeleteProject}
      showMemberCreateForm={showMemberCreateForm}
      setShowMemberCreateForm={setShowMemberCreateForm}
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
      handleSaveProfile={handleSaveProfile}
      status={status}
      handleUpdateUserProjectEntry={handleUpdateUserProjectEntry}
      adminProjectsPageSummary={adminProjectsPageSummary}
      adminProjectSearch={adminProjectSearch}
      setAdminProjectSearch={setAdminProjectSearch}
      onAdminProjectSearch={handleAdminProjectSearch}
      onClearAdminProjectSearch={handleClearAdminProjectSearch}
      onDeleteProjectEntry={handleDeleteUserProjectEntry}
      onExportProjectReport={handleExportProjectReport}
    />
  );
}
