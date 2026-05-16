import { useMemo } from 'react';
import { deleteIconButtonClass, IconTrash } from './actionIcons';
import type { Project, ProjectEntry } from '../types';
import {
  computeEntryWeightKg,
  computeStoredMaterialWeightKg,
  formatEntryWeightKg,
  formatStoredMaterialDimensions,
  getEntryDimensionCells,
} from './CreateProjectForm';
import { EntryDimensionTd } from './EntryDimensionCells';

function cell(value: string | undefined) {
  const v = value?.trim();
  return v || '';
}

type SummaryGroup = {
  sn: number;
  category: string;
  rows: ProjectEntry[];
};

function buildSummaryGroups(project: Project): SummaryGroup[] {
  const orderedKeys: string[] = [];
  const map = new Map<string, ProjectEntry[]>();

  for (const entry of project.entries) {
    const key = entry.areaSection.trim() || 'General';
    if (!map.has(key)) {
      map.set(key, []);
      orderedKeys.push(key);
    }
    map.get(key)!.push(entry);
  }

  return orderedKeys.map((category, i) => ({
    sn: i + 1,
    category,
    rows: map.get(category)!,
  }));
}

type ProjectSummaryPageProps = {
  project: Project;
  onBack: () => void;
  onDeleteEntry: (projectId: number, dataId: number) => Promise<void>;
  onExportReport: (projectId: number) => Promise<void>;
};

export function ProjectSummaryPage({ project, onBack, onDeleteEntry, onExportReport }: ProjectSummaryPageProps) {
  const groups = useMemo(() => buildSummaryGroups(project), [project]);
  const entryCount = project.entries.length;
  const materials = project.materials ?? [];
  const materialRows = useMemo(
    () => materials.map((material) => ({ ...material, weightKg: computeStoredMaterialWeightKg(material) })),
    [materials],
  );
  const totalMaterialWeightKg = useMemo(
    () => materialRows.reduce((sum, material) => sum + material.weightKg, 0),
    [materialRows],
  );

  const totals = useMemo(() => {
    let weight = 0;
    let welding = 0;
    for (const e of project.entries) {
      weight += computeEntryWeightKg(e);
      welding += parseFloat(e.weldingMeters) || 0;
    }
    return { weight, welding };
  }, [project.entries]);
  const totalTonnage = totalMaterialWeightKg / 1000;
  const actualTonnage = totals.weight / 1000;
  const maxTonnage = Math.max(totalTonnage, actualTonnage, 1) * 1.15;
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = maxTonnage * (1 - ratio);
    return { y: 18 + ratio * 64, value };
  });
  const totalBarHeight = (totalTonnage / maxTonnage) * 64;
  const actualBarHeight = (actualTonnage / maxTonnage) * 64;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">{project.name} - Summary Sheet</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
              Project Type: {project.projectKind === 'Renewal' ? 'Refit' : project.projectKind || 'Refit'}
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">Materials: {materialRows.length}</span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
              Material Weight: {totalMaterialWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">Line Entries: {entryCount}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onExportReport(project.id)}
            className="shrink-0 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            Export Report
          </button>
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ← Back
          </button>
        </div>
      </div>

      <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <p className="text-xs font-medium text-slate-500">Description</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{project.description || 'No description'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Parameter</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{project.parameter || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Location</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{project.location || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Date of commitment</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{project.dateOfCommitment || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Planned finish date</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{project.plannedFinishDate || 'N/A'}</p>
          </div>
        </div>
      </article>

      <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">Tonnage Overview</h3>
        <p className="mb-3 text-xs text-slate-500">Total tonnage vs actual tonnage for this project</p>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <svg viewBox="0 0 100 88" className="h-44 w-full" role="img" aria-label="Total and actual tonnage bar chart">
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
            <rect x="54" y={82 - actualBarHeight} width="10" height={Math.max(actualBarHeight, 0)} rx="1.2" fill="#f97316" />
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
              <span className="h-2 w-2 rounded-sm bg-orange-500" />
              Actual Tonnage
            </span>
          </div>
        </div>
      </article>

      <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 bg-slate-100/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Materials</h3>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">S.N</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Material name</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Dimensions (form order, mm)
                </th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Quantity</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Weight (kg)</th>
              </tr>
            </thead>
            <tbody>
              {materialRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="border border-slate-200 px-3 py-10 text-center text-slate-500">
                    No materials added for this project.
                  </td>
                </tr>
              ) : (
                materialRows.map((material, index) => (
                  <tr key={`${project.id}-material-${index}`} className="bg-white hover:bg-slate-50/80">
                    <td className="border border-slate-200 px-3 py-2 text-center tabular-nums text-slate-700">{index + 1}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-700">{cell(material.name) || 'N/A'}</td>
                    <td className="border border-slate-200 px-3 py-2 text-slate-700">
                      {formatStoredMaterialDimensions(cell(material.name), cell(material.dimensions))}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 tabular-nums text-slate-700">{cell(material.quantity) || 'N/A'}</td>
                    <td className="border border-slate-200 px-3 py-2 tabular-nums text-slate-800">
                      {material.weightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {materialRows.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={4} className="border border-slate-200 px-3 py-2.5 text-right">
                    Total material weight
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 tabular-nums">
                    {totalMaterialWeightKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </article>

      <article className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 bg-slate-100/60 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Line Entries</h3>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700">
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">S.N</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Category
                </th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Description / Item
                </th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Dim 1 (mm)</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Dim 2 (mm)</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Dim 3 (mm)</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Dim 4 (mm)</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Qty</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Weight (kg)</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">
                  Welding (m)
                </th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Remarks</th>
                <th className="border border-slate-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={12} className="border border-slate-200 px-3 py-12 text-center text-slate-500">
                    No entries for this project yet.
                  </td>
                </tr>
              ) : (
                groups.flatMap((group) =>
                  group.rows.map((entry, ri) => {
                    const itemLabel = cell(entry.itemDetails) || cell(entry.label) || 'Entry';
                    const [d1, d2, d3, d4] = getEntryDimensionCells(entry);
                    return (
                      <tr key={`${project.id}-${group.sn}-${ri}-${entry.dataId ?? ri}`} className="bg-white hover:bg-slate-50/80">
                        {ri === 0 ? (
                          <>
                            <td
                              rowSpan={group.rows.length}
                              className="border border-slate-200 px-3 py-2 align-middle text-center font-medium tabular-nums text-slate-800"
                            >
                              {group.sn}
                            </td>
                            <td
                              rowSpan={group.rows.length}
                              className="border border-slate-200 px-3 py-2 align-top text-slate-800"
                            >
                              <span className="font-medium leading-snug">{group.category}</span>
                            </td>
                          </>
                        ) : null}
                        <td className="border border-slate-200 px-3 py-2 text-slate-700">{itemLabel}</td>
                        <EntryDimensionTd cell={d1} className="border border-slate-200 px-3 py-2 align-top tabular-nums" />
                        <EntryDimensionTd cell={d2} className="border border-slate-200 px-3 py-2 align-top tabular-nums" />
                        <EntryDimensionTd cell={d3} className="border border-slate-200 px-3 py-2 align-top tabular-nums" />
                        <EntryDimensionTd cell={d4} className="border border-slate-200 px-3 py-2 align-top tabular-nums" />
                        <td className="border border-slate-200 px-3 py-2 tabular-nums text-slate-700">{cell(entry.qty)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-right font-semibold tabular-nums text-teal-800">
                          {formatEntryWeightKg(entry)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 tabular-nums text-slate-700">
                          {cell(entry.weldingMeters)}
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-slate-600">{cell(entry.remarks)}</td>
                        <td className="border border-slate-200 px-3 py-2 text-center">
                          {entry.dataId ? (
                            <button
                              type="button"
                              onClick={() => onDeleteEntry(project.id, entry.dataId!)}
                              title="Delete entry"
                              aria-label="Delete entry"
                              className={deleteIconButtonClass}
                            >
                              <IconTrash />
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  }),
                )
              )}
            </tbody>
            {project.entries.length > 0 ? (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-900">
                  <td colSpan={7} className="border border-slate-200 px-3 py-2.5 text-right">
                    Totals
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 tabular-nums">
                    {totals.weight.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5 tabular-nums">
                    {totals.welding.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-slate-200 px-3 py-2.5" />
                  <td className="border border-slate-200 px-3 py-2.5" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </article>
    </section>
  );
}
