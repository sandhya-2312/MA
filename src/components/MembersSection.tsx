import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { deleteIconButtonClass, editIconButtonClass, IconPencil, IconTrash } from './actionIcons';
import { roleLabel } from '../roleLabel';
import type { Project, Role, UserAccount } from '../types';

const statIconMd = 'h-5 w-5 shrink-0';

function IconStatUsersGroup() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatFolder() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7h5l2-3h8a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
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

function IconStatBars() {
  return (
    <svg viewBox="0 0 24 24" className={statIconMd} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const dashboardStatCardClass =
  'rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]';

const iconWrapClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full [&_svg]:h-4 [&_svg]:w-4';

const memberLabelClass = 'mb-1 block text-xs font-medium text-slate-600';
const memberInputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2';

type MembersSectionProps = {
  isAdmin: boolean;
  users: UserAccount[];
  projects: Project[];
  loggedInUserId: number;
  showMemberCreateForm: boolean;
  setShowMemberCreateForm: (updater: (current: boolean) => boolean) => void;
  memberFormError: string;
  clearMemberFormError: () => void;
  handleCreateUser: (event: FormEvent<HTMLFormElement>) => Promise<boolean>;
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
};

export function MembersSection({
  isAdmin,
  users,
  projects,
  loggedInUserId,
  showMemberCreateForm,
  setShowMemberCreateForm,
  memberFormError,
  clearMemberFormError,
  handleCreateUser,
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
}: MembersSectionProps) {
  const [memberSearchInput, setMemberSearchInput] = useState('');
  const [memberSearchApplied, setMemberSearchApplied] = useState('');
  const [pendingDeleteMember, setPendingDeleteMember] = useState<UserAccount | null>(null);

  const filteredUsers = useMemo(() => {
    const q = memberSearchApplied.trim().toLowerCase();
    if (!q) return users;
    return users.filter((member) => {
      const assignedNames = projects
        .filter((project) => member.assignedProjectIds.includes(project.id))
        .map((project) => project.name)
        .join(' ');
      const haystack = [
        member.username,
        member.fullName,
        member.email,
        member.designation,
        member.contactNo,
        roleLabel(member.role),
        assignedNames,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, projects, memberSearchApplied]);

  const submitMemberSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMemberSearchApplied(memberSearchInput.trim());
  };

  const clearMemberSearch = () => {
    setMemberSearchInput('');
    setMemberSearchApplied('');
  };
  const adminCount = users.filter((member) => member.role === 'Admin').length;
  const memberCount = users.filter((member) => member.role === 'User').length;
  const viewerCount = users.filter((member) => member.role === 'Viewer').length;
  const assignedProjectsCount = projects.filter((project) => users.some((member) => member.assignedProjectIds.includes(project.id))).length;

  return (
    <section className="space-y-4">
      {!isAdmin && (
        <article className="rounded-xl border border-slate-200/90 bg-white p-5 text-sm text-slate-600 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          Only admins can access Members page.
        </article>
      )}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Team Members</h3>
              <p className="text-sm text-slate-500">Manage organization members, teams, and access permissions.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingMemberId(null);
                clearMemberFormError();
                setShowMemberCreateForm((current) => !current);
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              {showMemberCreateForm ? 'Close Form' : 'Add Member'}
            </button>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            <article className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className={`${iconWrapClass} bg-teal-100 text-teal-600`}>
                  <IconStatUsersGroup />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Total Members</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{users.length}</p>
                  <p className="text-[10px] text-emerald-600">All accounts</p>
                </div>
              </div>
            </article>
            <article className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className={`${iconWrapClass} bg-emerald-100 text-emerald-600`}>
                  <IconStatFolder />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Admins</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{adminCount}</p>
                  <p className="text-[10px] text-slate-500">Full access</p>
                </div>
              </div>
            </article>
            <article className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className={`${iconWrapClass} bg-violet-100 text-violet-600`}>
                  <IconStatDocument />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Members</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{memberCount}</p>
                  <p className="text-[10px] text-slate-500">Standard role</p>
                </div>
              </div>
            </article>
            <article className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className={`${iconWrapClass} bg-orange-100 text-orange-600`}>
                  <IconStatBars />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Viewers</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{viewerCount}</p>
                  <p className="text-[10px] text-slate-500">Read-only</p>
                </div>
              </div>
            </article>
            <article className={dashboardStatCardClass}>
              <div className="flex items-center gap-4">
                <div className={`${iconWrapClass} bg-teal-100 text-teal-700`}>
                  <IconStatFolder />
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Projects</p>
                  <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{assignedProjectsCount}</p>
                  <p className="text-[10px] text-slate-500">With assignments</p>
                </div>
              </div>
            </article>
          </section>

          <form
            onSubmit={submitMemberSearch}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            <label htmlFor="members-search" className="sr-only">
              Search members
            </label>
            <input
              id="members-search"
              type="search"
              value={memberSearchInput}
              onChange={(e) => setMemberSearchInput(e.target.value)}
              placeholder="Search by name, email, role, or project…"
              className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-slate-200 transition focus:ring-2"
            />
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearMemberSearch}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Clear
            </button>
          </form>

          {showMemberCreateForm && (
            <form
              onSubmit={handleCreateUser}
              className="grid gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)] md:grid-cols-2"
            >
              <p className="text-sm text-slate-500 md:col-span-2">
                Create a Member or Viewer account. They can sign in at the login page with the username and password you
                set here—no first-login setup is required.
              </p>
              {memberFormError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">
                  {memberFormError}
                </p>
              ) : null}
              <div>
                <label className={memberLabelClass} htmlFor="create-member-full-name">
                  Full name
                </label>
                <input
                  id="create-member-full-name"
                  name="fullName"
                  placeholder="Enter full name"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-username">
                  Username
                </label>
                <input
                  id="create-member-username"
                  name="username"
                  placeholder="Login username"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-email">
                  Email
                </label>
                <input
                  id="create-member-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-contact">
                  Contact number
                </label>
                <input
                  id="create-member-contact"
                  name="contactNo"
                  placeholder="Phone or mobile number"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-designation">
                  Designation
                </label>
                <input
                  id="create-member-designation"
                  name="designation"
                  placeholder="Job title (optional)"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-password">
                  Password
                </label>
                <input
                  id="create-member-password"
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Min 8 characters"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="create-member-role">
                  Role
                </label>
                <select id="create-member-role" name="role" className={memberInputClass}>
                  <option value="User">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <fieldset className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
                <legend className="px-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">Assign Projects</legend>
                <div className="grid gap-1 md:grid-cols-2">
                  {projects.map((project) => (
                    <label key={project.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <input name="projects" type="checkbox" value={project.id} />
                      {project.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button
                type="submit"
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 md:justify-self-start"
              >
                Create Member
              </button>
            </form>
          )}

          {editingMemberId !== null && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSaveMemberEdit(editingMemberId);
              }}
              className="grid gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)] md:grid-cols-2"
            >
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold text-slate-800">Edit Member</h4>
                <p className="text-sm text-slate-500">Update details and project access.</p>
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-full-name">
                  Full name
                </label>
                <input
                  id="edit-member-full-name"
                  value={editFullName}
                  onChange={(event) => setEditFullName(event.target.value)}
                  placeholder="Enter full name"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-username">
                  Username
                </label>
                <input
                  id="edit-member-username"
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  placeholder="Login username"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-email">
                  Email
                </label>
                <input
                  id="edit-member-email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  type="email"
                  placeholder="name@example.com"
                  className={memberInputClass}
                  required
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-contact">
                  Contact number
                </label>
                <input
                  id="edit-member-contact"
                  value={editContactNo}
                  onChange={(event) => setEditContactNo(event.target.value)}
                  placeholder="Phone or mobile number"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-designation">
                  Designation
                </label>
                <input
                  id="edit-member-designation"
                  value={editDesignation}
                  onChange={(event) => setEditDesignation(event.target.value)}
                  placeholder="Job title (optional)"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-assigned-on">
                  Assigned on
                </label>
                <input
                  id="edit-member-assigned-on"
                  value={editAssignedOn}
                  onChange={(event) => setEditAssignedOn(event.target.value)}
                  type="date"
                  className={memberInputClass}
                />
              </div>
              <div>
                <label className={memberLabelClass} htmlFor="edit-member-role">
                  Role
                </label>
                <select
                  id="edit-member-role"
                  value={editRole}
                  onChange={(event) => setEditRole(event.target.value as Role)}
                  className={memberInputClass}
                >
                  <option value="User">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <fieldset className="space-y-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3 md:col-span-2">
                <legend className="px-1 text-[10px] font-medium uppercase tracking-wide text-slate-600">Assign Projects</legend>
                <div className="grid gap-1 md:grid-cols-2">
                  {projects.map((project) => (
                    <label key={project.id} className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={editProjectIds.includes(project.id)}
                        onChange={() => handleToggleEditProject(project.id)}
                      />
                      {project.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingMemberId(null)}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
            <div className="no-scrollbar overflow-x-auto">
              <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Member</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Designation</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Email ID</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Contact No</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Project Name</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Assign Date</th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white text-sm text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                      {users.length === 0 ? 'No members yet.' : 'No members match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((member) => {
                    const assignedProjectNames = projects
                      .filter((project) => member.assignedProjectIds.includes(project.id))
                      .map((project) => project.name)
                      .join(', ');
                    return (
                      <tr key={member.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                        <td className="px-4 py-3 align-top">{member.fullName}</td>
                        <td className="px-4 py-3 align-top">{member.designation || '—'}</td>
                        <td className="px-4 py-3 align-top">{member.email}</td>
                        <td className="px-4 py-3 align-top">{member.contactNo || '-'}</td>
                        <td className="px-4 py-3 align-top">{roleLabel(member.role)}</td>
                        <td className="px-4 py-3 align-top">{assignedProjectNames || 'No project assigned'}</td>
                        <td className="px-4 py-3">{member.assignedOn}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditMember(member)}
                              title="Edit member"
                              aria-label="Edit member"
                              className={editIconButtonClass}
                            >
                              <IconPencil />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteMember(member)}
                              disabled={member.id === loggedInUserId}
                              title="Delete member"
                              aria-label="Delete member"
                              className={deleteIconButtonClass}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
          {pendingDeleteMember && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-member-title"
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4"
              onClick={() => setPendingDeleteMember(null)}
            >
              <div
                className="w-full max-w-lg rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.35)]"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="confirm-delete-member-title" className="text-xl font-bold text-slate-900">
                  Remove Member
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Are you sure you want to remove <span className="font-semibold text-slate-800">{pendingDeleteMember.fullName}</span> from
                  the organization? This action cannot be undone.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteMember(null)}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteMember(pendingDeleteMember.id);
                      setPendingDeleteMember(null);
                    }}
                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    Remove Member
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
