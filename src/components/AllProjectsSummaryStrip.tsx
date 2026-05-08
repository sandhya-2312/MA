import type { Project, UserAccount } from '../types';

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
      <path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const dashboardStatCardClass =
  'rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]';

const iconWrapClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:h-4 [&_svg]:w-4';

type AllProjectsSummaryStripProps = {
  pageSummary: { totalProjects: number; totalEntries: number; activeMembers: number } | null;
  projects: Project[];
  users: UserAccount[];
};

export function AllProjectsSummaryStrip({ pageSummary, projects, users }: AllProjectsSummaryStripProps) {
  const totalProjectsDisplay = pageSummary?.totalProjects ?? projects.length;
  const totalEntriesDisplay =
    pageSummary?.totalEntries ?? projects.reduce((sum, project) => sum + project.entries.length, 0);
  const activeMembersDisplay =
    pageSummary?.activeMembers ?? users.filter((member) => member.assignedProjectIds.length > 0).length;

  return (
    <section className="grid gap-3 sm:grid-cols-3 lg:gap-4">
      <article className={dashboardStatCardClass}>
        <div className="flex items-center gap-4">
          <div className={`${iconWrapClass} bg-emerald-100 text-emerald-600`}>
            <IconStatFolder />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Projects</p>
            <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{totalProjectsDisplay}</p>
            <p className="text-[10px] text-emerald-600">Projects created</p>
          </div>
        </div>
      </article>
      <article className={dashboardStatCardClass}>
        <div className="flex items-center gap-4">
          <div className={`${iconWrapClass} bg-violet-100 text-violet-600`}>
            <IconStatDocument />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Entries</p>
            <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{totalEntriesDisplay}</p>
            <p className="text-[10px] text-slate-500">All project entries</p>
          </div>
        </div>
      </article>
      <article className={dashboardStatCardClass}>
        <div className="flex items-center gap-4">
          <div className={`${iconWrapClass} bg-teal-100 text-teal-600`}>
            <IconStatUsersGroup />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Active Members</p>
            <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{activeMembersDisplay}</p>
            <p className="text-[10px] text-emerald-600">With project assignments</p>
          </div>
        </div>
      </article>
    </section>
  );
}
