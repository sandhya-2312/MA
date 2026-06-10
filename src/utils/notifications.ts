import type { NavTab, Project, ProjectEntry, UserAccount } from '../types';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  tab?: NavTab;
  projectId?: number;
  informational?: boolean;
};

const RECENT_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_RECENT_ENTRIES = 8;

function entrySortTime(entry: ProjectEntry): number {
  return Date.parse(entry.createdAt) || 0;
}

export function formatNotificationTime(iso: string): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const diffMs = Date.now() - time;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(time).toLocaleDateString();
}

export function readStorageKey(userId: number): string {
  return `ma-notifications-read-${userId}`;
}

export function loadReadNotificationIds(userId: number): Set<string> {
  try {
    const raw = localStorage.getItem(readStorageKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function saveReadNotificationIds(userId: number, ids: Set<string>): void {
  localStorage.setItem(readStorageKey(userId), JSON.stringify([...ids]));
}

export function buildNotifications(params: {
  isAdmin: boolean;
  projects: Project[];
  visibleProjects: Project[];
  users: UserAccount[];
}): AppNotification[] {
  const { isAdmin, projects, visibleProjects, users } = params;
  const now = Date.now();
  const list: AppNotification[] = [];

  if (isAdmin) {
    for (const user of users) {
      if (user.id && user.firstLogin) {
        list.push({
          id: `first-login-${user.id}`,
          title: 'Account setup pending',
          message: `${user.fullName?.trim() || user.username} has not completed first login setup.`,
          createdAt: new Date().toISOString(),
          tab: 'members',
        });
      }
    }

    for (const project of projects) {
      if (project.entries.length === 0) {
        list.push({
          id: `empty-project-${project.id}`,
          title: 'Empty project',
          message: `"${project.name}" has no data entries yet.`,
          createdAt: project.dateOfCommitment || new Date().toISOString(),
          tab: 'projects',
          projectId: project.id,
        });
      }
    }
  }

  const projectPool = isAdmin ? projects : visibleProjects;
  const recentEntries: Array<{ project: Project; entry: ProjectEntry; sortTime: number }> = [];

  for (const project of projectPool) {
    for (const entry of project.entries) {
      const sortTime = entrySortTime(entry);
      if (sortTime > 0 && now - sortTime <= RECENT_MS) {
        recentEntries.push({ project, entry, sortTime });
      }
    }
  }

  recentEntries.sort((a, b) => b.sortTime - a.sortTime);

  for (const { project, entry, sortTime } of recentEntries.slice(0, MAX_RECENT_ENTRIES)) {
    const entryKey = entry.dataId ?? `${entry.createdAt}-${entry.user}-${entry.areaSection}`;
    list.push({
      id: `entry-${project.id}-${entryKey}`,
      title: 'New project data',
      message: `${entry.user} added an entry to "${project.name}".`,
      createdAt: new Date(sortTime).toISOString(),
      tab: 'projects',
      projectId: project.id,
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'all-clear',
      title: 'All caught up',
      message: 'No new updates in the last 7 days.',
      createdAt: new Date().toISOString(),
      informational: true,
    });
  }

  return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
