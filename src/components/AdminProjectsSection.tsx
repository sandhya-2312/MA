import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { roleLabel } from '../roleLabel';
import type { Project, UserAccount } from '../types';
import {
  buildInitialValuesFromProject,
  computeStoredMaterialWeightKg,
  CreateProjectForm,
  formatPrimaryMaterialCardLine,
  projectStatusOptions,
  type CreateProjectPayload,
} from './CreateProjectForm';

function IconProjectsStat({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPencil({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 5l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type AdminProjectsSectionProps = {
  isAdmin: boolean;
  projects: Project[];
  users: UserAccount[];
  showProjectCreateForm: boolean;
  setShowProjectCreateForm: (updater: (current: boolean) => boolean) => void;
  handleCreateProject: (payload: CreateProjectPayload) => Promise<boolean>;
  handleUpdateProject: (projectId: number, payload: CreateProjectPayload) => Promise<boolean>;
  handleDeleteProject: (projectId: number) => void;
  onOpenProjectSummary?: (projectId: number) => void;
  searchQuery: string;
  setSearchQuery: (value: string | ((prev: string) => string)) => void;
  onSearch: () => Promise<void>;
  onClearSearch: () => Promise<void>;
  requestedEditProjectId?: number | null;
  onRequestedEditHandled?: () => void;
  onRequestedEditClosed?: () => void;
};

export function AdminProjectsSection({
  isAdmin,
  projects,
  users,
  showProjectCreateForm,
  setShowProjectCreateForm,
  handleCreateProject,
  handleUpdateProject,
  handleDeleteProject,
  onOpenProjectSummary,
  searchQuery,
  setSearchQuery,
  onSearch,
  onClearSearch,
  requestedEditProjectId,
  onRequestedEditHandled,
  onRequestedEditClosed,
}: AdminProjectsSectionProps) {
  const [editModalProject, setEditModalProject] = useState<Project | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<Project | null>(null);
  const [requestedEditActive, setRequestedEditActive] = useState(false);
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('All');

  const closeEditModal = () => {
    setEditModalProject(null);
    if (requestedEditActive) {
      setRequestedEditActive(false);
      onRequestedEditClosed?.();
    }
  };

  useEffect(() => {
    if (!editModalProject) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editModalProject, requestedEditActive, onRequestedEditClosed]);

  useEffect(() => {
    if (!requestedEditProjectId) return;
    const target = projects.find((project) => project.id === requestedEditProjectId);
    if (target) {
      setShowProjectCreateForm(() => false);
      setEditModalProject(target);
      setRequestedEditActive(true);
    }
    onRequestedEditHandled?.();
  }, [requestedEditProjectId, projects, setShowProjectCreateForm, onRequestedEditHandled]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSearch();
  };
  const filteredProjects = projectStatusFilter === 'All'
    ? projects
    : projects.filter((project) => ((project.projectStatus ?? '').trim() || 'Active') === projectStatusFilter);
  return (
    <section className="space-y-4">
      {!isAdmin && (
        <article className="rounded-xl border border-slate-200/90 bg-white p-5 text-sm text-slate-600 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          Only admins can access All Projects page.
        </article>
      )}
      {isAdmin && (
        <>
          <form
            onSubmit={submitSearch}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
          >
            <label htmlFor="admin-project-search" className="sr-only">
              Search projects by name
            </label>
            <input
              id="admin-project-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name…"
              className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-slate-200 transition focus:ring-2"
            />
            <label htmlFor="admin-project-status-filter" className="sr-only">
              Filter projects by status
            </label>
            <select
              id="admin-project-status-filter"
              value={projectStatusFilter}
              onChange={(e) => setProjectStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200 transition focus:ring-2"
              title="Project Filter"
            >
              <option value="All">All</option>
              {projectStatusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => void onClearSearch()}
              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Clear
            </button>
          </form>

          {showProjectCreateForm && (
            <article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
              <h4 className="mb-3 text-lg font-semibold text-slate-800">Create Project</h4>
              <CreateProjectForm onCreate={handleCreateProject} />
            </article>
          )}

          {editModalProject && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-edit-project-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
              onClick={closeEditModal}
            >
              <div
                className="no-scrollbar max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 id="admin-edit-project-title" className="text-lg font-semibold text-slate-800">
                      Edit Project
                    </h3>
                    <p className="text-sm text-slate-500">Update name, type, description, and parameter. Line rows are read-only.</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <CreateProjectForm
                    key={editModalProject.id}
                    mode="edit"
                    initialValues={buildInitialValuesFromProject(editModalProject)}
                    onCreate={async (payload) => {
                      const ok = await handleUpdateProject(editModalProject.id, payload);
                      if (ok) closeEditModal();
                      return ok;
                    }}
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {projects.length === 0 && (
            <article className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/50 p-8 text-center shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
              <p className="text-base font-semibold text-slate-700">No projects to show</p>
              <p className="mt-2 text-sm text-slate-500">
                Create a project with the button above, or refresh the page if data failed to load.
              </p>
            </article>
          )}

          <div className="space-y-3 md:space-y-4">
            {filteredProjects.map((project) => {
              const firstMaterial = project.materials?.[0];
              const totalMaterialWeightKg = (project.materials ?? []).reduce(
                (sum, material) => sum + computeStoredMaterialWeightKg(material),
                0,
              );
              const assignedMembers = users.filter((member) => member.assignedProjectIds.includes(project.id));
              const contributorCount = new Set(project.entries.map((entry) => entry.user)).size;
              return (
                <article key={project.id} className="group rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:h-4 [&_svg]:w-4">
                        <IconProjectsStat className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                          {project.projectKind === 'Renewal' ? 'Refit' : project.projectKind || 'General Project'}
                        </p>
                        <p className="truncate text-base font-bold leading-tight text-slate-900">{project.name}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-600">
                      {project.entries.length} {project.entries.length === 1 ? 'entry' : 'entries'} {' · '}
                      {contributorCount} {contributorCount === 1 ? 'contributor' : 'contributors'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {onOpenProjectSummary && (
                        <button
                          type="button"
                          onClick={() => onOpenProjectSummary(project.id)}
                          className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Summary
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowProjectCreateForm(() => false);
                          setEditModalProject(project);
                        }}
                        title="Edit project"
                        aria-label="Edit project"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                      >
                        <IconPencil />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteProject(project)}
                        title="Delete project"
                        aria-label="Delete project"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-3 group-hover:max-h-[32rem] group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:max-h-[32rem] group-focus-within:opacity-100">
                    <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">
                      {project.description || 'No description'}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Parameter</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">{project.parameter || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Location</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">{project.location || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:col-span-2 xl:col-span-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Primary material</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">
                          {formatPrimaryMaterialCardLine(firstMaterial)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Material items</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">{project.materials?.length ?? 0}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Weight</p>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">{totalMaterialWeightKg.toFixed(2)} kg</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Assigned</p>
                        <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{assignedMembers.length}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-2 sm:col-span-2 xl:col-span-2">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Team</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {assignedMembers.length === 0 && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">No members assigned</span>
                          )}
                          {assignedMembers.map((member) => (
                            <span
                              key={member.id}
                              className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {member.username} ({roleLabel(member.role)})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {pendingDeleteProject && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-delete-project-title"
              className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4"
              onClick={() => setPendingDeleteProject(null)}
            >
              <div
                className="w-full max-w-lg rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.35)]"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="confirm-delete-project-title" className="text-xl font-bold text-slate-900">
                  Delete Project
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Are you sure you want to delete <span className="font-semibold text-slate-800">{pendingDeleteProject.name}</span>? This
                  action cannot be undone.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteProject(null)}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProject(pendingDeleteProject.id);
                      setPendingDeleteProject(null);
                    }}
                    className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                  >
                    Delete Project
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
