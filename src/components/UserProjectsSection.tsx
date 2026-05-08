import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { Project, ProjectEntry, UserAccount } from '../types';
import {
  buildInitialValuesFromProject,
  computeStoredMaterialWeightKg,
  CreateProjectForm,
  emptyMaterial,
  formatPrimaryMaterialCardLine,
  formatStoredMaterialDimensions,
  projectStatusOptions,
  materialToDimensions,
  ProjectMaterialRowsEditor,
  type CreateProjectPayload,
  type ProjectMaterialPayload,
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

type UserProjectsSectionProps = {
  loggedInUser: UserAccount;
  visibleProjects: Project[];
  onOpenProjectSummary?: (projectId: number) => void;
  handleCreateUserProjectEntry: (payload: {
    projectId: number;
    areaSection: string;
    materialName: string;
    dimensions: string;
    quantity: string;
    weldingMeters: string;
    remarks: string;
  }) => Promise<void>;
  handleUpdateProject: (projectId: number, payload: CreateProjectPayload) => Promise<boolean>;
  handleUpdateUserProjectEntry: (
    projectId: number,
    entryIndex: number,
    updates: Pick<
      ProjectEntry,
      'projectType' | 'areaSection' | 'itemDetails' | 'lengthMm' | 'widthMm' | 'thkDia' | 'densityKgM3' | 'qty' | 'weldingMeters' | 'remarks'
    >,
  ) => void;
  requestedProjectId?: number | null;
  onRequestedProjectHandled?: () => void;
};

type EditableEntry = Pick<
  ProjectEntry,
  'projectType' | 'areaSection' | 'itemDetails' | 'lengthMm' | 'widthMm' | 'thkDia' | 'densityKgM3' | 'qty' | 'weldingMeters' | 'remarks'
>;

const emptyEditableEntry: EditableEntry = {
  projectType: 'Material Entry',
  areaSection: '',
  itemDetails: '',
  lengthMm: '',
  widthMm: '',
  thkDia: '',
  densityKgM3: '',
  qty: '',
  weldingMeters: '',
  remarks: '',
};

export function UserProjectsSection({
  loggedInUser,
  visibleProjects,
  onOpenProjectSummary,
  handleCreateUserProjectEntry,
  handleUpdateProject,
  handleUpdateUserProjectEntry,
  requestedProjectId,
  onRequestedProjectHandled,
}: UserProjectsSectionProps) {
  const isViewer = loggedInUser.role === 'Viewer';
  const canEditProject = loggedInUser.role === 'Admin';
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editingEntryIndex, setEditingEntryIndex] = useState<number | null>(null);
  const [editingEntryForm, setEditingEntryForm] = useState<EditableEntry>(emptyEditableEntry);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [addEntryModalOpen, setAddEntryModalOpen] = useState(false);
  const [addEntryAreaSection, setAddEntryAreaSection] = useState('');
  const [addEntryWeldingMeters, setAddEntryWeldingMeters] = useState('');
  const [addEntryRemarks, setAddEntryRemarks] = useState('');
  const [addEntryMaterials, setAddEntryMaterials] = useState<ProjectMaterialPayload[]>([emptyMaterial()]);
  const [projectSearchInput, setProjectSearchInput] = useState('');
  const [projectSearchApplied, setProjectSearchApplied] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('All');

  const filteredVisibleProjects = useMemo(() => {
    const q = projectSearchApplied.trim().toLowerCase();
    const status = projectStatusFilter.trim();
    return visibleProjects.filter((project) => {
      if (status !== 'All') {
        const pStatus = (project.projectStatus ?? '').trim() || 'Active';
        if (pStatus !== status) return false;
      }
      if (!q) return true;
      const kindLabel = project.projectKind === 'Renewal' ? 'Refit' : project.projectKind;
      const blob = [project.name, project.description, project.parameter, kindLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [visibleProjects, projectSearchApplied, projectStatusFilter]);

  const selectedProject = useMemo(
    () => visibleProjects.find((project) => project.id === selectedProjectId) ?? null,
    [selectedProjectId, visibleProjects],
  );
  const selectedProjectTotalMaterialWeightKg = useMemo(
    () => (selectedProject?.materials ?? []).reduce((sum, material) => sum + computeStoredMaterialWeightKg(material), 0),
    [selectedProject],
  );

  const submitProjectSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProjectSearchApplied(projectSearchInput.trim());
  };

  const clearProjectSearch = () => {
    setProjectSearchInput('');
    setProjectSearchApplied('');
  };
  const selectedProjectEntriesWithIndex = selectedProject
    ? selectedProject.entries
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.user === loggedInUser.username)
    : [];

  const startEditEntry = (entryIndex: number) => {
    if (!selectedProject) return;
    const sourceEntry = selectedProject.entries[entryIndex];
    if (!sourceEntry) return;
    setEditingEntryIndex(entryIndex);
    setEditingEntryForm({
      projectType: sourceEntry.projectType || 'Material Entry',
      areaSection: sourceEntry.areaSection,
      itemDetails: sourceEntry.itemDetails,
      lengthMm: sourceEntry.lengthMm,
      widthMm: sourceEntry.widthMm,
      thkDia: sourceEntry.thkDia,
      densityKgM3: sourceEntry.densityKgM3,
      qty: sourceEntry.qty,
      weldingMeters: sourceEntry.weldingMeters,
      remarks: sourceEntry.remarks,
    });
  };

  const cancelEditEntry = () => {
    setEditingEntryIndex(null);
    setEditingEntryForm(emptyEditableEntry);
  };

  const saveEditedEntry = () => {
    if (!selectedProject || editingEntryIndex === null) return;
    if (!editingEntryForm.areaSection || !editingEntryForm.itemDetails) return;
    handleUpdateUserProjectEntry(selectedProject.id, editingEntryIndex, {
      ...editingEntryForm,
      projectType: editingEntryForm.projectType.trim() || 'Material Entry',
    });
    cancelEditEntry();
  };

  const resetAddEntryForm = () => {
    setAddEntryAreaSection('');
    setAddEntryWeldingMeters('');
    setAddEntryRemarks('');
    setAddEntryMaterials([emptyMaterial()]);
  };

  useEffect(() => {
    if (!requestedProjectId) return;
    const hasProject = visibleProjects.some((project) => project.id === requestedProjectId);
    if (hasProject) {
      cancelEditEntry();
      setSelectedProjectId(requestedProjectId);
    }
    onRequestedProjectHandled?.();
  }, [requestedProjectId, visibleProjects, onRequestedProjectHandled]);

  return (
    <section className="space-y-4">
      {selectedProject && (
        <article className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{selectedProject.name}</h3>
              <p className="text-sm text-slate-500">Detailed project view for your submissions and project metadata.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isViewer && (
                <button
                  type="button"
                  onClick={() => setAddEntryModalOpen(true)}
                  className="rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  Add Entry
                </button>
              )}
              {!isViewer && canEditProject && (
                <button
                  type="button"
                  onClick={() => setEditProjectModalOpen(true)}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Edit Project
                </button>
              )}
              <button
                onClick={() => {
                  cancelEditEntry();
                  setSelectedProjectId(null);
                }}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Back to My Projects
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Project Id</p>
              <p className="mt-1 text-lg font-bold text-slate-700">{selectedProject.id}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Description</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProject.description || 'No description'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Parameter</p>
              <p className="mt-1 text-sm font-semibold text-teal-700">{selectedProject.parameter || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Materials</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {(selectedProject.materials?.length ?? 0) === 0
                  ? 'N/A'
                  : `${selectedProject.materials!.length} item${selectedProject.materials!.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Primary material (form layout)</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                {formatPrimaryMaterialCardLine(selectedProject.materials?.[0])}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Material Weight</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProjectTotalMaterialWeightKg.toFixed(2)} kg</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Location</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProject.location || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Date of Commitment</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProject.dateOfCommitment || 'N/A'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Planned Finish Date</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{selectedProject.plannedFinishDate || 'N/A'}</p>
            </div>
          </div>

          <section className="mt-4 rounded-xl border border-slate-200/90 bg-slate-50/70 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="text-base font-semibold text-slate-800">Materials</h4>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                {selectedProject.materials?.length ?? 0} {(selectedProject.materials?.length ?? 0) === 1 ? 'item' : 'items'}
              </span>
            </div>
            {selectedProject.materials && selectedProject.materials.length > 0 ? (
              <div className="space-y-2">
                {selectedProject.materials.map((material, index) => {
                  const materialWeightKg = computeStoredMaterialWeightKg(material);
                  return (
                    <div key={`${selectedProject.id}-material-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Material {index + 1}</p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Name</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800">{material.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Quantity</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800">{material.quantity || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Weight</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800">{materialWeightKg.toFixed(2)} kg</p>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Dimensions (form order, mm)</p>
                          <p className="mt-0.5 text-sm font-semibold text-slate-800">
                            {formatStoredMaterialDimensions(material.name ?? '', material.dimensions ?? '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                No materials added for this project.
              </p>
            )}
          </section>

          {!isViewer && addEntryModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-add-entry-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
              onClick={() => setAddEntryModalOpen(false)}
            >
              <div
                className="w-full max-w-5xl rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 id="user-add-entry-title" className="text-lg font-semibold text-slate-800">
                      Add Project Entry
                    </h3>
                    <p className="text-sm text-slate-500">Submit a new line entry without changing project details.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddEntryModalOpen(false)}
                    className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const rowsToSubmit = addEntryMaterials
                      .map((material) => {
                        const materialName =
                          material.materialType === 'Add manually'
                            ? material.customMaterialName.trim() || 'Custom Material'
                            : material.materialType;
                        const dimensions = materialToDimensions(material);
                        const quantity = material.quantity.trim();
                        return { materialName, dimensions, quantity };
                      })
                      .filter(
                        (row) =>
                          row.materialName &&
                          row.dimensions &&
                          row.quantity &&
                          Number.parseFloat(row.quantity) > 0 &&
                          computeStoredMaterialWeightKg({
                            name: row.materialName,
                            dimensions: row.dimensions,
                            quantity: row.quantity,
                          }) > 0,
                      );
                    if (!addEntryAreaSection.trim() || rowsToSubmit.length === 0) return;
                    for (const row of rowsToSubmit) {
                      await handleCreateUserProjectEntry({
                        projectId: selectedProject.id,
                        areaSection: addEntryAreaSection.trim(),
                        materialName: row.materialName,
                        dimensions: row.dimensions,
                        quantity: row.quantity,
                        weldingMeters: addEntryWeldingMeters.trim(),
                        remarks: addEntryRemarks.trim(),
                      });
                    }
                    resetAddEntryForm();
                    setAddEntryModalOpen(false);
                  }}
                  className="space-y-3"
                >
                  <input
                    value={addEntryAreaSection}
                    onChange={(event) => setAddEntryAreaSection(event.target.value)}
                    placeholder="Area / Section"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                    required
                  />

                  <ProjectMaterialRowsEditor
                    materials={addEntryMaterials}
                    onMaterialsChange={(next) => setAddEntryMaterials([next[0] ?? emptyMaterial()])}
                    containerClassName="rounded-xl border border-slate-200/90 bg-slate-50/70 p-4"
                    embedded
                    showTotalFooter={false}
                  />

                  <div className="grid gap-3 md:grid-cols-3">
                    <input
                      value={addEntryWeldingMeters}
                      onChange={(event) => setAddEntryWeldingMeters(event.target.value)}
                      placeholder="Welding Meters"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                    />
                    <input
                      value={addEntryRemarks}
                      onChange={(event) => setAddEntryRemarks(event.target.value)}
                      placeholder="Remarks"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2 md:col-span-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700">
                      Save Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddEntryModalOpen(false);
                        resetAddEntryForm();
                      }}
                      className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {!isViewer && canEditProject && editProjectModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="user-edit-project-title"
              className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[1px]"
              onClick={() => setEditProjectModalOpen(false)}
            >
              <div
                className="no-scrollbar max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 id="user-edit-project-title" className="text-lg font-semibold text-slate-800">
                      Edit Project
                    </h3>
                    <p className="text-sm text-slate-500">Update full project fields including materials.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditProjectModalOpen(false)}
                    className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <CreateProjectForm
                    key={selectedProject.id}
                    mode="edit"
                    initialValues={buildInitialValuesFromProject(selectedProject)}
                    onCreate={async (payload) => {
                      const ok = await handleUpdateProject(selectedProject.id, payload);
                      if (ok) setEditProjectModalOpen(false);
                      return ok;
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="no-scrollbar mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-3 py-2 font-semibold">Date</th>
                  <th className="px-3 py-2 font-semibold">Area/Section</th>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">L (mm)</th>
                  <th className="px-3 py-2 font-semibold">W (mm)</th>
                  <th className="px-3 py-2 font-semibold">Thk/Dia</th>
                  <th className="px-3 py-2 font-semibold">Density</th>
                  <th className="px-3 py-2 font-semibold">Weight (kg)</th>
                  <th className="px-3 py-2 font-semibold">Welding Meters</th>
                  <th className="px-3 py-2 font-semibold">Remarks</th>
                  {!isViewer && <th className="px-3 py-2 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white text-slate-700">
                {selectedProjectEntriesWithIndex.map(({ entry, index }) => (
                  <tr key={`${entry.createdAt}-${index}`} className="border-t border-slate-200">
                    <td className="px-3 py-2">{entry.createdAt}</td>
                    <td className="px-3 py-2">{entry.areaSection || '-'}</td>
                    <td className="px-3 py-2">{entry.itemDetails || '-'}</td>
                    <td className="px-3 py-2">{entry.qty || '-'}</td>
                    <td className="px-3 py-2">{entry.lengthMm || '-'}</td>
                    <td className="px-3 py-2">{entry.widthMm || '-'}</td>
                    <td className="px-3 py-2">{entry.thkDia || '-'}</td>
                    <td className="px-3 py-2">{entry.densityKgM3 || '-'}</td>
                    <td className="px-3 py-2">{entry.weight || '-'}</td>
                    <td className="px-3 py-2">{entry.weldingMeters || '-'}</td>
                    <td className="px-3 py-2">{entry.remarks || '-'}</td>
                    {!isViewer && (
                      <td className="px-3 py-2">
                        <button
                          onClick={() => startEditEntry(index)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {selectedProjectEntriesWithIndex.length === 0 && (
                  <tr>
                    <td colSpan={isViewer ? 11 : 12} className="px-3 py-3 text-center text-slate-500">
                      No submissions yet for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!isViewer && editingEntryIndex !== null && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-3 text-base font-semibold text-slate-800">Edit Project Entry</h4>
              <p className="mb-3 text-sm text-slate-500">Update line entry fields to match Add Entry.</p>
              <div className="grid gap-3 md:grid-cols-4">
                <input
                  value={editingEntryForm.areaSection}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, areaSection: event.target.value }))}
                  placeholder="Area / Section"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.itemDetails}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, itemDetails: event.target.value }))}
                  placeholder="Item Details"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.qty}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, qty: event.target.value }))}
                  placeholder="Qty"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.lengthMm}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, lengthMm: event.target.value }))}
                  placeholder="L (mm)"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.widthMm}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, widthMm: event.target.value }))}
                  placeholder="W (mm)"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.thkDia}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, thkDia: event.target.value }))}
                  placeholder="Thk / Dia"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.densityKgM3}
                  onChange={(event) =>
                    setEditingEntryForm((current) => ({ ...current, densityKgM3: event.target.value }))
                  }
                  placeholder="Density (kg/m3)"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.weldingMeters}
                  onChange={(event) =>
                    setEditingEntryForm((current) => ({ ...current, weldingMeters: event.target.value }))
                  }
                  placeholder="Welding Meters"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
                />
                <input
                  value={editingEntryForm.remarks}
                  onChange={(event) => setEditingEntryForm((current) => ({ ...current, remarks: event.target.value }))}
                  placeholder="Remarks"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 outline-none ring-slate-200 transition focus:ring-2 md:col-span-3"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={saveEditedEntry}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                >
                  Update Entry
                </button>
                <button
                  onClick={cancelEditEntry}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </article>
      )}

      {!selectedProject && (
        <>
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-[0_4px_14px_rgba(0,0,0,0.04)] sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">My Projects</h3>
            <p className="text-sm text-slate-500">View your assigned projects and latest submitted updates.</p>
          </div>
        </div>
        <form
          onSubmit={submitProjectSearch}
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
        >
          <label htmlFor="user-projects-search" className="sr-only">
            Search my projects
          </label>
          <input
            id="user-projects-search"
            type="search"
            value={projectSearchInput}
            onChange={(e) => setProjectSearchInput(e.target.value)}
            placeholder="Search by project name or description…"
            className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-slate-200 transition focus:ring-2"
          />
          <label htmlFor="user-projects-status-filter" className="sr-only">
            Filter projects by status
          </label>
          <select
            id="user-projects-status-filter"
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
            onClick={clearProjectSearch}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Clear
          </button>
        </form>
      </div>

      {visibleProjects.length === 0 && (
        <article className="rounded-xl border border-slate-200/90 bg-white p-5 text-sm text-slate-600 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          No projects are assigned to your account yet.
        </article>
      )}

      {visibleProjects.length > 0 && filteredVisibleProjects.length === 0 && (
        <article className="rounded-xl border border-slate-200/90 bg-white p-5 text-sm text-slate-600 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
          No projects match your search.
        </article>
      )}

      {filteredVisibleProjects.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {filteredVisibleProjects.map((project) => {
            const firstMaterial = project.materials?.[0];
            const totalMaterialWeightKg = (project.materials ?? []).reduce(
              (sum, material) => sum + computeStoredMaterialWeightKg(material),
              0,
            );
            const ownEntries = project.entries.filter((entry) => entry.user === loggedInUser.username);
            const contributorCount = new Set(project.entries.map((entry) => entry.user)).size;
            const latestOwnEntry = ownEntries[ownEntries.length - 1];

            return (
              <article key={project.id} className="group rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 [&_svg]:h-4 [&_svg]:w-4">
                      <IconProjectsStat className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
                        {project.projectKind === 'Renewal' ? 'Refit' : project.projectKind || 'Refit'}
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
                        Summary sheet
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-3 group-hover:max-h-[28rem] group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:max-h-[28rem] group-focus-within:opacity-100">
                  <p className="line-clamp-2 text-[11px] leading-snug text-slate-500">{project.description || 'No description'}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Parameter</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{project.parameter || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Location</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{project.location || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 sm:col-span-2 xl:col-span-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Primary material</p>
                      <p className="mt-0.5 break-words text-xs font-semibold text-slate-900">
                        {formatPrimaryMaterialCardLine(firstMaterial)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Material items</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{project.materials?.length ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Weight</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{totalMaterialWeightKg.toFixed(2)} kg</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">My Entries</p>
                      <p className="text-lg font-bold tabular-nums leading-none text-slate-900">{ownEntries.length}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-2 sm:col-span-2 xl:col-span-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">Latest Update</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">{latestOwnEntry?.createdAt ?? 'No updates yet'}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
        </>
      )}
    </section>
  );
}
