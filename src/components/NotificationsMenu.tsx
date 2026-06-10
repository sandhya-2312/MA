import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildNotifications,
  formatNotificationTime,
  loadReadNotificationIds,
  saveReadNotificationIds,
  type AppNotification,
} from '../utils/notifications';
import type { Project, UserAccount } from '../types';

type NotificationsMenuProps = {
  userId: number;
  isAdmin: boolean;
  projects: Project[];
  visibleProjects: Project[];
  users: UserAccount[];
  onNavigate: (notification: AppNotification) => void;
  dismissWhen?: boolean;
  onMenuOpen?: () => void;
};

export function NotificationsMenu({
  userId,
  isAdmin,
  projects,
  visibleProjects,
  users,
  onNavigate,
  dismissWhen = false,
  onMenuOpen,
}: NotificationsMenuProps) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadNotificationIds(userId));
  const menuRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(
    () => buildNotifications({ isAdmin, projects, visibleProjects, users }),
    [isAdmin, projects, visibleProjects, users],
  );

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.informational && !readIds.has(item.id)).length,
    [notifications, readIds],
  );

  useEffect(() => {
    setReadIds(loadReadNotificationIds(userId));
  }, [userId]);

  useEffect(() => {
    if (dismissWhen) setOpen(false);
  }, [dismissWhen]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const el = menuRef.current;
      if (el && !el.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const persistReadIds = (next: Set<string>) => {
    setReadIds(next);
    saveReadNotificationIds(userId, next);
  };

  const markRead = (id: string) => {
    persistReadIds(new Set([...readIds, id]));
  };

  const markAllRead = () => {
    const next = new Set(readIds);
    for (const item of notifications) {
      if (!item.informational) next.add(item.id);
    }
    persistReadIds(next);
  };

  const handleSelect = (notification: AppNotification) => {
    if (!notification.informational) markRead(notification.id);
    if (notification.tab || notification.projectId) onNavigate(notification);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() =>
          setOpen((value) => {
            if (!value) onMenuOpen?.();
            return !value;
          })
        }
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-teal-600 transition hover:text-teal-700"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto py-1">
            {notifications.map((notification) => {
              const unread = !notification.informational && !readIds.has(notification.id);
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(notification)}
                    disabled={notification.informational}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition ${
                      notification.informational
                        ? 'cursor-default bg-slate-50/80'
                        : 'hover:bg-slate-50'
                    } ${unread ? 'bg-teal-50/40' : ''}`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        unread ? 'bg-teal-500' : 'bg-transparent'
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-800">{notification.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{notification.message}</span>
                      {!notification.informational && (
                        <span className="mt-1 block text-[11px] text-slate-400">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
