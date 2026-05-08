import { useState, type FormEvent } from 'react';
import type { Project, ProjectEntry } from '../types';

const projectKindOptions = ['Refit', 'New Project'] as const;
export const projectStatusOptions = ['Active', 'Planning', 'On hold', 'Completed'] as const;
export type ProjectStatusOption = (typeof projectStatusOptions)[number];
const lineProjectTypeOptions = ['New Construction', 'Refit', 'Dry Dock', 'Anchorage'];
const areaSectionOptions = [
  'Mid Ship Section',
  'Cargo Tank',
  'FWD',
  'AFT',
  'Side Shell',
  'Main Deck',
  'Outfitting Items',
  'Water tight doors renewal',
  'Foot rest',
  'Engine room',
  'Bilge tank (P)',
  'Service Tank (P)',
  'Others',
];
const materialTypeOptions = ['MS Plate', 'MS Angle', 'MS Rod', 'MS Pipe', 'MS Flange', 'MS Flat Bar', 'Add manually'] as const;
const STEEL_DENSITY_KG_M3 = 7850;

export type ProjectLineItemPayload = {
  projectType: string;
  areaSection: string;
  itemDetails: string;
  /** Stored `x` dimensions from API meta (material entries); preferred over splitting L/W/Thk. */
  dimensions?: string;
  lengthMm: string;
  widthMm: string;
  thkDia: string;
  densityKgM3: string;
  qty: string;
  weightKg: string;
  weldingMeters: string;
  remarks: string;
};

export type CreateProjectPayload = {
  name: string;
  projectKind: (typeof projectKindOptions)[number];
  projectStatus: ProjectStatusOption;
  description: string;
  /** Technical / summary parameter (stored in API `parameters.parameter`). */
  parameter?: string;
  location?: string;
  dateOfCommitment?: string;
  plannedFinishDate?: string;
  materials: Array<{ name: string; dimensions: string; quantity: string }>;
  items: ProjectLineItemPayload[];
};

export type MaterialType = (typeof materialTypeOptions)[number];

export type ProjectMaterialPayload = {
  materialType: MaterialType;
  customMaterialName: string;
  quantity: string;
  lengthMm: string;
  lengthUnit: 'mm' | 'm';
  widthMm: string;
  widthUnit: 'mm' | 'm';
  thicknessMm: string;
  thicknessUnit: 'mm' | 'm';
  diameterMm: string;
  diameterUnit: 'mm' | 'm';
  outerDiameterMm: string;
  outerDiameterUnit: 'mm' | 'm';
  innerDiameterMm: string;
  innerDiameterUnit: 'mm' | 'm';
  sideAMm: string;
  sideAUnit: 'mm' | 'm';
  sideBMm: string;
  sideBUnit: 'mm' | 'm';
};

export const emptyMaterial = (): ProjectMaterialPayload => ({
  materialType: 'MS Plate',
  customMaterialName: '',
  quantity: '1',
  lengthMm: '',
  lengthUnit: 'mm',
  widthMm: '',
  widthUnit: 'mm',
  thicknessMm: '',
  thicknessUnit: 'mm',
  diameterMm: '',
  diameterUnit: 'mm',
  outerDiameterMm: '',
  outerDiameterUnit: 'mm',
  innerDiameterMm: '',
  innerDiameterUnit: 'mm',
  sideAMm: '',
  sideAUnit: 'mm',
  sideBMm: '',
  sideBUnit: 'mm',
});

function parseDimensionParts(raw: string): number[] {
  const matches = raw.match(/-?\d+(?:\.\d+)?/g) ?? [];
  return matches
    .map((part) => Number.parseFloat(part))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function mmToM(raw: string): number {
  return (Number.parseFloat(raw) || 0) / 1000;
}

function toMmByUnit(raw: string, unit: 'mm' | 'm'): number {
  const value = Number.parseFloat(raw) || 0;
  return unit === 'm' ? value * 1000 : value;
}

function normalizeMaterialType(name: string): MaterialType {
  const n = name.toLowerCase();
  if (n.includes('angle') || n.includes('angel')) return 'MS Angle';
  if (n.includes('rod')) return 'MS Rod';
  if (n.includes('pipe')) return 'MS Pipe';
  if (n.includes('flange') || n.includes('flunge')) return 'MS Flange';
  if (n.includes('flat')) return 'MS Flat Bar';
  if (n.includes('plate')) return 'MS Plate';
  return 'Add manually';
}

export function materialToDimensions(material: ProjectMaterialPayload): string {
  const lengthMm = String(toMmByUnit(material.lengthMm, material.lengthUnit));
  const widthMm = String(toMmByUnit(material.widthMm, material.widthUnit));
  const thicknessMm = String(toMmByUnit(material.thicknessMm, material.thicknessUnit));
  const diameterMm = String(toMmByUnit(material.diameterMm, material.diameterUnit));
  const outerDiameterMm = String(toMmByUnit(material.outerDiameterMm, material.outerDiameterUnit));
  const innerDiameterMm = String(toMmByUnit(material.innerDiameterMm, material.innerDiameterUnit));
  const sideAMm = String(toMmByUnit(material.sideAMm, material.sideAUnit));
  const sideBMm = String(toMmByUnit(material.sideBMm, material.sideBUnit));
  switch (material.materialType) {
    case 'MS Plate':
      return `${lengthMm}x${widthMm}x${thicknessMm}`;
    case 'MS Rod':
      return `${diameterMm}x${lengthMm}`;
    case 'MS Pipe':
      return `${outerDiameterMm}x${innerDiameterMm}x${lengthMm}`;
    case 'MS Flat Bar':
      return `${widthMm}x${thicknessMm}x${lengthMm}`;
    case 'MS Angle':
      return `${sideAMm}x${sideBMm}x${thicknessMm}x${lengthMm}`;
    case 'MS Flange':
      return `${outerDiameterMm}x${innerDiameterMm}x${thicknessMm}`;
    case 'Add manually':
      return `${lengthMm}x${widthMm}x${thicknessMm}`;
    default:
      return '';
  }
}

function materialFromStored(name: string, dimensions: string, quantity: string): ProjectMaterialPayload {
  const materialType = normalizeMaterialType(name);
  const dims = parseDimensionParts(dimensions);
  const base = emptyMaterial();
  base.materialType = materialType;
  if (materialType === 'Add manually') {
    base.customMaterialName = name;
  }
  base.quantity = quantity || '1';
  if (materialType === 'MS Plate' && dims.length >= 3) {
    [base.lengthMm, base.widthMm, base.thicknessMm] = [String(dims[0]), String(dims[1]), String(dims[2])];
  } else if (materialType === 'MS Rod' && dims.length >= 2) {
    [base.diameterMm, base.lengthMm] = [String(dims[0]), String(dims[1])];
  } else if (materialType === 'MS Pipe' && dims.length >= 3) {
    [base.outerDiameterMm, base.innerDiameterMm, base.lengthMm] = [String(dims[0]), String(dims[1]), String(dims[2])];
  } else if (materialType === 'MS Flat Bar' && dims.length >= 3) {
    [base.widthMm, base.thicknessMm, base.lengthMm] = [String(dims[0]), String(dims[1]), String(dims[2])];
  } else if (materialType === 'MS Angle' && dims.length >= 4) {
    [base.sideAMm, base.sideBMm, base.thicknessMm, base.lengthMm] = [
      String(dims[0]),
      String(dims[1]),
      String(dims[2]),
      String(dims[3]),
    ];
  } else if (materialType === 'MS Flange' && dims.length >= 3) {
    [base.outerDiameterMm, base.innerDiameterMm, base.thicknessMm] = [String(dims[0]), String(dims[1]), String(dims[2])];
  }
  return base;
}

function computeMaterialWeightKg(material: ProjectMaterialPayload): number {
  const qty = Math.max(Number.parseFloat(material.quantity) || 0, 0);
  if (!qty) return 0;
  const pi = Math.PI;
  const density = STEEL_DENSITY_KG_M3;
  const l = mmToM(String(toMmByUnit(material.lengthMm, material.lengthUnit)));
  const w = mmToM(String(toMmByUnit(material.widthMm, material.widthUnit)));
  const t = mmToM(String(toMmByUnit(material.thicknessMm, material.thicknessUnit)));
  const d = mmToM(String(toMmByUnit(material.diameterMm, material.diameterUnit)));
  const od = mmToM(String(toMmByUnit(material.outerDiameterMm, material.outerDiameterUnit)));
  const id = mmToM(String(toMmByUnit(material.innerDiameterMm, material.innerDiameterUnit)));
  const a = mmToM(String(toMmByUnit(material.sideAMm, material.sideAUnit)));
  const b = mmToM(String(toMmByUnit(material.sideBMm, material.sideBUnit)));
  let volumeM3 = 0;
  if (material.materialType === 'MS Plate') volumeM3 = l * w * t;
  if (material.materialType === 'MS Rod') volumeM3 = pi * (d / 2) ** 2 * l;
  if (material.materialType === 'MS Pipe') volumeM3 = pi * ((od ** 2 - id ** 2) / 4) * l;
  if (material.materialType === 'MS Flat Bar') volumeM3 = w * t * l;
  if (material.materialType === 'MS Angle') volumeM3 = (a + b - t) * t * l;
  if (material.materialType === 'MS Flange') volumeM3 = pi * ((od ** 2 - id ** 2) / 4) * t;
  if (material.materialType === 'Add manually') volumeM3 = l * w * t;
  return volumeM3 * density * qty;
}

/** Same weight calculation as the live project form (per-field mm/m). */
export function computeMaterialPayloadWeightKg(material: ProjectMaterialPayload): number {
  return computeMaterialWeightKg(material);
}

/** Weight from API-stored `name` / `dimensions` / `quantity` (dimensions are mm, `x`-separated like the form saves). */
export function computeStoredMaterialWeightKg(material: { name?: string; dimensions?: string; quantity?: string }): number {
  const payload = materialFromStored(material.name ?? '', material.dimensions ?? '', material.quantity ?? '1');
  return computeMaterialWeightKg(payload);
}

/** Human-readable dimensions matching the project form field order; values shown in mm (storage format). */
export function formatStoredMaterialDimensions(name: string, dimensions: string): string {
  const raw = dimensions?.trim();
  if (!raw) return '—';
  const m = materialFromStored(name || '', raw, '1');
  const seg = (label: string, val: string) => {
    const v = val.trim();
    return v ? `${label} ${v} mm` : '';
  };
  const parts: string[] = [];
  switch (m.materialType) {
    case 'MS Plate':
      parts.push(seg('L', m.lengthMm), seg('W', m.widthMm), seg('T', m.thicknessMm));
      break;
    case 'MS Rod':
      parts.push(seg('Ø', m.diameterMm), seg('L', m.lengthMm));
      break;
    case 'MS Pipe':
      parts.push(seg('OD', m.outerDiameterMm), seg('ID', m.innerDiameterMm), seg('L', m.lengthMm));
      break;
    case 'MS Flat Bar':
      parts.push(seg('W', m.widthMm), seg('T', m.thicknessMm), seg('L', m.lengthMm));
      break;
    case 'MS Angle':
      parts.push(seg('A', m.sideAMm), seg('B', m.sideBMm), seg('T', m.thicknessMm), seg('L', m.lengthMm));
      break;
    case 'MS Flange':
      parts.push(seg('OD', m.outerDiameterMm), seg('ID', m.innerDiameterMm), seg('T', m.thicknessMm));
      break;
    case 'Add manually':
      parts.push(seg('L', m.lengthMm), seg('W', m.widthMm), seg('T', m.thicknessMm));
      break;
    default:
      return raw;
  }
  const joined = parts.filter(Boolean);
  return joined.length ? joined.join(' × ') : raw;
}

export function formatPrimaryMaterialCardLine(material: { name?: string; dimensions?: string; quantity?: string } | undefined): string {
  if (!material) return 'N/A';
  const n = material.name?.trim();
  const d = material.dimensions?.trim();
  if (!n && !d) return 'N/A';
  const dims = formatStoredMaterialDimensions(n ?? '', d ?? '');
  const q = material.quantity?.trim() || '—';
  return `${n || 'Material'} · ${dims} · Qty ${q}`;
}

function rowHasLineContent(row: ProjectLineItemPayload): boolean {
  return !!(
    row.areaSection.trim() ||
    row.itemDetails.trim() ||
    row.projectType.trim() ||
    row.dimensions?.trim() ||
    row.lengthMm.trim() ||
    row.widthMm.trim() ||
    row.qty.trim() ||
    row.weightKg.trim() ||
    row.densityKgM3.trim() ||
    row.thkDia.trim() ||
    row.weldingMeters.trim() ||
    row.remarks.trim()
  );
}

function entryToLineItem(e: ProjectEntry): ProjectLineItemPayload {
  const w = e.weight ?? '';
  return {
    projectType: e.projectType ?? '',
    areaSection: e.areaSection ?? '',
    itemDetails: e.itemDetails ?? '',
    dimensions: e.dimensions ?? '',
    lengthMm: e.lengthMm ?? '',
    widthMm: e.widthMm ?? '',
    thkDia: e.thkDia ?? '',
    densityKgM3: e.densityKgM3 ?? '',
    qty: e.qty ?? '',
    weightKg: w,
    weldingMeters: e.weldingMeters ?? '',
    remarks: e.remarks ?? '',
  };
}

function lineItemDimensionsRaw(row: ProjectLineItemPayload): string {
  if (row.dimensions?.trim()) return row.dimensions.trim();
  const parts = [row.lengthMm, row.widthMm, row.thkDia]
    .map((s) => String(s ?? '').replace(/\s*MM\s*$/i, '').trim())
    .filter(Boolean);
  return parts.length ? parts.join('x') : '';
}

function lineItemToMaterial(row: ProjectLineItemPayload): ProjectMaterialPayload {
  const dimRaw = lineItemDimensionsRaw(row);
  const qty = row.qty?.trim() || '1';
  return materialFromStored(row.itemDetails || '', dimRaw, qty);
}

function patchLineFromMaterial(m: ProjectMaterialPayload, prev: ProjectLineItemPayload): Partial<ProjectLineItemPayload> {
  const name =
    m.materialType === 'Add manually' ? m.customMaterialName.trim() || prev.itemDetails.trim() || 'Custom Material' : m.materialType;
  const dimensions = materialToDimensions(m);
  const dimParts = parseDimensionParts(dimensions);
  let lengthMm = '';
  let widthMm = '';
  let thkDia = '';
  if (dimParts.length >= 1) lengthMm = String(dimParts[0]);
  if (dimParts.length >= 2) widthMm = String(dimParts[1]);
  if (dimParts.length >= 3) thkDia = String(dimParts[2]);
  return {
    itemDetails: name,
    qty: m.quantity.trim(),
    dimensions,
    lengthMm,
    widthMm,
    thkDia,
    densityKgM3: prev.densityKgM3?.trim() || String(STEEL_DENSITY_KG_M3),
    weightKg: computeMaterialWeightKg(m).toFixed(2),
  };
}

/** Maps a loaded project into form defaults for the edit modal. */
export function buildInitialValuesFromProject(project: Project): CreateProjectPayload {
  const kindRaw = project.projectKind === 'Renewal' ? 'Refit' : (project.projectKind ?? 'Refit');
  const projectKind = projectKindOptions.includes(kindRaw as (typeof projectKindOptions)[number])
    ? (kindRaw as (typeof projectKindOptions)[number])
    : 'Refit';
  const statusRaw = (project.projectStatus ?? '').trim() || 'Active';
  const projectStatus = projectStatusOptions.includes(statusRaw as ProjectStatusOption)
    ? (statusRaw as ProjectStatusOption)
    : 'Active';
  const items =
    project.entries.length > 0 ? project.entries.map(entryToLineItem) : [emptyLine()];
  return {
    name: project.name,
    projectKind,
    projectStatus,
    description: project.description,
    parameter: project.parameter ?? '',
    location: project.location ?? '',
    dateOfCommitment: project.dateOfCommitment ?? '',
    plannedFinishDate: project.plannedFinishDate ?? '',
    materials: project.materials?.length
      ? project.materials.map((material) => ({
          name: material.name ?? '',
          dimensions: material.dimensions ?? '',
          quantity: material.quantity ?? '',
        }))
      : [{ name: '', dimensions: '', quantity: '' }],
    items,
  };
}

const emptyLine = (): ProjectLineItemPayload => ({
  projectType: '',
  areaSection: '',
  itemDetails: '',
  dimensions: '',
  lengthMm: '',
  widthMm: '',
  thkDia: '',
  densityKgM3: '',
  qty: '',
  weightKg: '',
  weldingMeters: '',
  remarks: '',
});

const fieldClass =
  'rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2';
/** Manual line-item row: white fields like the Excel-style entry sheet */
const manualFieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-slate-200/50 transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200';
const labelClass = 'mb-1 block text-xs font-medium text-slate-500';
const manualLabelClass = 'mb-1 block text-xs font-semibold text-slate-600';

/** Suggested values + free typing (native combobox). */
function ComboboxInput({
  id,
  listId,
  value,
  onValueChange,
  options,
  placeholder,
  className,
  readOnly,
}: {
  id: string;
  listId: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  className: string;
  readOnly?: boolean;
}) {
  return (
    <>
      <input
        id={id}
        type="text"
        list={readOnly ? undefined : listId}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        className={className}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}

function UnitInput({
  value,
  onChange,
  placeholder,
  unit,
  className,
  readOnly,
  onUnitChange,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  unit: 'mm' | 'm' | 'qty' | 'kg';
  className: string;
  readOnly?: boolean;
  onUnitChange?: (unit: 'mm' | 'm') => void;
}) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`${className} pr-12`}
      />
      {onUnitChange && !readOnly ? (
        <select
          value={unit}
          onChange={(e) => onUnitChange(e.target.value as 'mm' | 'm')}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-600"
        >
          <option value="mm">mm</option>
          <option value="m">m</option>
        </select>
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">
          {unit}
        </span>
      )}
    </div>
  );
}

type CreateProjectFormProps = {
  onCreate: (payload: CreateProjectPayload) => Promise<boolean | void>;
  /** `edit` shows the same layout as create but saves via PUT; line rows are read-only. */
  mode?: 'create' | 'edit';
  /** Used when `mode` is `edit` (remount with `key={project.id}` when switching projects). */
  initialValues?: CreateProjectPayload;
  className?: string;
};

export function CreateProjectForm({
  onCreate,
  mode = 'create',
  initialValues,
  className,
}: CreateProjectFormProps) {
  const isEdit = mode === 'edit';
  const fieldId = isEdit ? 'edit-project' : 'create-project';
  const [name, setName] = useState(initialValues?.name ?? '');
  const [projectKind, setProjectKind] = useState<(typeof projectKindOptions)[number]>(
    initialValues?.projectKind ?? 'Refit',
  );
  const [projectStatus, setProjectStatus] = useState<ProjectStatusOption>(
    initialValues?.projectStatus ?? 'Active',
  );
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [parameter, setParameter] = useState(initialValues?.parameter ?? '');
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [dateOfCommitment, setDateOfCommitment] = useState(initialValues?.dateOfCommitment ?? '');
  const [plannedFinishDate, setPlannedFinishDate] = useState(initialValues?.plannedFinishDate ?? '');
  const [materials, setMaterials] = useState<ProjectMaterialPayload[]>(() =>
    initialValues?.materials?.length
      ? initialValues.materials.map((material) => materialFromStored(material.name, material.dimensions, material.quantity))
      : [emptyMaterial()],
  );
  const [materialsError, setMaterialsError] = useState('');
  const [items, setItems] = useState<ProjectLineItemPayload[]>(() =>
    initialValues?.items?.length ? initialValues.items : [emptyLine()],
  );
  const [submitting, setSubmitting] = useState(false);
  /** manual = fill line items in the form; later = create project only, add data later */
  const [lineItemMode, setLineItemMode] = useState<'manual' | 'later'>(() => {
    if (isEdit) {
      const hasLines = initialValues?.items?.some(rowHasLineContent);
      return hasLines ? 'manual' : 'later';
    }
    return 'manual';
  });
  const [manualError, setManualError] = useState('');
  const linesReadOnly = isEdit;

  const updateLine = (index: number, patch: Partial<ProjectLineItemPayload>) => {
    setItems((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addLine = () => setItems((current) => [...current, emptyLine()]);
  const removeLine = (index: number) => {
    setItems((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)));
  };

  const materialRowKey = (material: ProjectMaterialPayload) => {
    const name =
      material.materialType === 'Add manually'
        ? (material.customMaterialName || 'Custom Material').trim()
        : material.materialType.trim();
    const dimensions = materialToDimensions(material).replace(/\s+/g, '').trim();
    return `${name.toLowerCase()}|${dimensions.toLowerCase()}`;
  };

  const duplicateMaterialKeys = (() => {
    const keys = materials
      .map((m) => ({ key: materialRowKey(m), raw: m }))
      .filter((row) => {
        const name =
          row.raw.materialType === 'Add manually' ? row.raw.customMaterialName.trim() : row.raw.materialType.trim();
        const dims = materialToDimensions(row.raw).trim();
        return !!(name && dims);
      })
      .map((row) => row.key);
    const counts = new Map<string, number>();
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
    return Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([k]) => k);
  })();
  const hasDuplicateMaterials = duplicateMaterialKeys.length > 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setManualError('');
    setMaterialsError('');
    if (hasDuplicateMaterials) {
      setMaterialsError('Duplicate materials are not allowed. Please remove or change the duplicates before saving.');
      return;
    }

    setSubmitting(true);
    try {
      const ok = await onCreate({
        name: trimmedName,
        projectKind,
        projectStatus,
        description: description.trim(),
        parameter: parameter.trim(),
        location: location.trim(),
        dateOfCommitment,
        plannedFinishDate,
        materials: materials
          .map((material) => ({
            name:
              material.materialType === 'Add manually'
                ? material.customMaterialName.trim() || 'Custom Material'
                : material.materialType,
            dimensions: materialToDimensions(material),
            quantity: material.quantity.trim(),
          }))
          .filter((material) => material.name || material.dimensions || material.quantity),
        items: [],
      });
      if (ok !== false && !isEdit) {
        setName('');
        setDescription('');
        setParameter('');
        setLocation('');
        setDateOfCommitment('');
        setPlannedFinishDate('');
        setMaterials([emptyMaterial()]);
        setItems([emptyLine()]);
        setProjectKind('Refit');
        setProjectStatus('Active');
        setLineItemMode('manual');
        setMaterialsError('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formGrid = className ?? 'space-y-6';
  const manualRo = linesReadOnly ? ' cursor-default bg-slate-50 text-slate-700' : '';
  const lineInputClass = `${manualFieldClass}${manualRo}`;

  return (
    <form onSubmit={handleSubmit} className={formGrid}>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`${fieldId}-name`}>
            Project name / ID
          </label>
          <input
            id={`${fieldId}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maruti 1 - Dry Dock Steel Refit"
            required
            className={`${fieldClass} w-full`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-kind`}>
            Project type
          </label>
          <select
            id={`${fieldId}-kind`}
            value={projectKind}
            onChange={(e) => setProjectKind(e.target.value as (typeof projectKindOptions)[number])}
            className={`${fieldClass} w-full`}
          >
            {projectKindOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-status`}>
            Project status
          </label>
          <select
            id={`${fieldId}-status`}
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value as ProjectStatusOption)}
            className={`${fieldClass} w-full`}
          >
            {projectStatusOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`${fieldId}-desc`}>
            Description (optional)
          </label>
          <input
            id={`${fieldId}-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description"
            className={`${fieldClass} w-full`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`${fieldId}-parameter`}>
            Parameter (optional)
          </label>
          <input
            id={`${fieldId}-parameter`}
            value={parameter}
            onChange={(e) => setParameter(e.target.value)}
            placeholder="Technical parameter or N/A"
            className={`${fieldClass} w-full`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-location`}>
            Location (optional)
          </label>
          <input
            id={`${fieldId}-location`}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Engine Room"
            className={`${fieldClass} w-full`}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor={`${fieldId}-commitment`}>
            Date of commitment (optional)
          </label>
          <input
            id={`${fieldId}-commitment`}
            type="date"
            value={dateOfCommitment}
            onChange={(e) => setDateOfCommitment(e.target.value)}
            className={`${fieldClass} w-full`}
          />
        </div>
        <div className="md:col-span-2">
          <label className={labelClass} htmlFor={`${fieldId}-planned-finish`}>
            Planned finish date (optional)
          </label>
          <input
            id={`${fieldId}-planned-finish`}
            type="date"
            value={plannedFinishDate}
            onChange={(e) => setPlannedFinishDate(e.target.value)}
            className={`${fieldClass} w-full`}
          />
        </div>
      </div>

      <div>
        <ProjectMaterialRowsEditor
          materials={materials}
          onMaterialsChange={(next) => {
            setMaterialsError('');
            setMaterials(next);
          }}
        />
        {materialsError ? <p className="mt-2 text-xs font-medium text-rose-600">{materialsError}</p> : null}
        {!materialsError && hasDuplicateMaterials ? (
          <p className="mt-2 text-xs font-medium text-rose-600">Duplicate materials detected. Please keep each material unique.</p>
        ) : null}
      </div>

      {isEdit && (
      <div className="rounded-xl border border-slate-200/90 bg-slate-100/40 p-4">
        <h5 className="text-sm font-semibold text-slate-800">Line items</h5>
        <p className="mt-1 text-xs text-slate-500">
          {isEdit
            ? 'Existing entries are shown for reference. Add or change material lines from the project dashboard or My Projects data entry.'
            : 'Add material rows now by hand, or create the project empty and enter data from the project dashboard later.'}
        </p>
        {!isEdit && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setLineItemMode('manual');
              setManualError('');
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              lineItemMode === 'manual'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'bg-slate-200/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Add items manually
          </button>
          <button
            type="button"
            onClick={() => {
              setLineItemMode('later');
              setManualError('');
            }}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              lineItemMode === 'later'
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'bg-slate-200/80 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Add entries later
          </button>
        </div>
        )}

        {lineItemMode === 'later' && (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            {isEdit ? (
              <>
                No line entries are stored for this project yet. Team members can add data from <strong>My Projects</strong>.
              </>
            ) : (
              <>
                The project will be created with no line items. Team members can submit entries from <strong>My Projects</strong>{' '}
                once the project exists.
              </>
            )}
          </p>
        )}

        {lineItemMode === 'manual' && (
          <>
            <div className="mb-2 mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manual entry</span>
              {!linesReadOnly && (
                <button
                  type="button"
                  onClick={addLine}
                  className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  + Add item row
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Each row is one project entry. Use the same <strong>material type and dimensions</strong> controls as in project
              materials (per-field mm/m, live weight at 7850 kg/m³). Line project type and area use suggestions or free text.
              {isEdit ? (
                <span className="mt-1.5 block text-slate-600">Entries are read-only here; users update them from My Projects.</span>
              ) : null}
            </p>
            {manualError ? <p className="mb-3 text-xs font-medium text-rose-600">{manualError}</p> : null}

            <div className="space-y-4">
              {items.map((row, index) => (
                <div
                  key={`line-${index}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-sm font-bold tracking-wide text-slate-800">ITEM {index + 1}</span>
                    {!linesReadOnly && items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <label className={manualLabelClass} htmlFor={`${fieldId}-line-${index}-ptype`}>
                          Project type
                        </label>
                        <ComboboxInput
                          id={`${fieldId}-line-${index}-ptype`}
                          listId={`${fieldId}-line-${index}-ptype-dl`}
                          value={row.projectType}
                          onValueChange={(v) => updateLine(index, { projectType: v })}
                          options={lineProjectTypeOptions}
                          placeholder="Select or type…"
                          className={lineInputClass}
                          readOnly={linesReadOnly}
                        />
                      </div>
                      <div>
                        <label className={manualLabelClass} htmlFor={`${fieldId}-line-${index}-area`}>
                          Area / Section
                        </label>
                        <ComboboxInput
                          id={`${fieldId}-line-${index}-area`}
                          listId={`${fieldId}-line-${index}-area-dl`}
                          value={row.areaSection}
                          onValueChange={(v) => updateLine(index, { areaSection: v })}
                          options={areaSectionOptions}
                          placeholder="Select or type…"
                          className={lineInputClass}
                          readOnly={linesReadOnly}
                        />
                      </div>
                    </div>

                    <div className="mt-1">
                      <label className={`${manualLabelClass} mb-1.5`}>Material (same as project form)</label>
                      <ProjectMaterialRowsEditor
                        materials={[lineItemToMaterial(row)]}
                        onMaterialsChange={(next) => {
                          if (linesReadOnly) return;
                          const m = next[0];
                          if (!m) return;
                          updateLine(index, patchLineFromMaterial(m, row));
                        }}
                        readOnly={linesReadOnly}
                        embedded
                        showTotalFooter={false}
                        containerClassName="rounded-lg border border-slate-200 bg-white p-3"
                      />
                    </div>

                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <label className={manualLabelClass}>Weight (kg)</label>
                        <input
                          value={row.weightKg}
                          onChange={(e) => updateLine(index, { weightKg: e.target.value })}
                          placeholder="From material; edit to override"
                          inputMode="decimal"
                          readOnly={linesReadOnly}
                          className={lineInputClass}
                        />
                        <p className="mt-0.5 text-[10px] text-slate-500">Density fixed at 7850 kg/m³ in material calculator.</p>
                      </div>
                      <div>
                        <label className={manualLabelClass}>Welding (m)</label>
                        <input
                          value={row.weldingMeters}
                          onChange={(e) => updateLine(index, { weldingMeters: e.target.value })}
                          placeholder="Welding meters"
                          inputMode="decimal"
                          readOnly={linesReadOnly}
                          className={lineInputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={manualLabelClass}>Remarks</label>
                      <input
                        value={row.remarks}
                        onChange={(e) => updateLine(index, { remarks: e.target.value })}
                        placeholder="Remarks"
                        readOnly={linesReadOnly}
                        className={lineInputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      )}

      <button
        type="submit"
        disabled={submitting || hasDuplicateMaterials}
        className="rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
      >
        {submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save changes' : 'Create Project'}
      </button>
    </form>
  );
}

export type ProjectMaterialRowsEditorProps = {
  materials: ProjectMaterialPayload[];
  onMaterialsChange: (next: ProjectMaterialPayload[]) => void;
  containerClassName?: string;
  readOnly?: boolean;
  /** Hide section header, add/remove row controls, and default total footer (e.g. line items in project form). */
  embedded?: boolean;
  /** When false, omit total-weight footer (used with embedded). */
  showTotalFooter?: boolean;
};

/** Reusable materials block: material type, dynamic dimensions, per-field mm/m, live weight (same as project form). */
export function ProjectMaterialRowsEditor({
  materials,
  onMaterialsChange,
  containerClassName = 'rounded-xl border border-slate-200/90 bg-slate-100/40 p-4',
  readOnly = false,
  embedded = false,
  showTotalFooter = true,
}: ProjectMaterialRowsEditorProps) {
  const updateMaterial = (index: number, patch: Partial<ProjectMaterialPayload>) => {
    if (readOnly) return;
    onMaterialsChange(materials.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };
  const addMaterial = () => {
    if (readOnly) return;
    onMaterialsChange([...materials, emptyMaterial()]);
  };
  const removeMaterial = (index: number) => {
    if (readOnly) return;
    onMaterialsChange(materials.length <= 1 ? materials : materials.filter((_, i) => i !== index));
  };
  const materialWeights = materials.map((material) => computeMaterialWeightKg(material));
  const totalMaterialWeightKg = materialWeights.reduce((sum, weight) => sum + weight, 0);
  const showFooter = showTotalFooter && !embedded;

  return (
    <div className={containerClassName}>
      {!embedded && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5 className="text-sm font-semibold text-slate-800">Materials</h5>
          <button
            type="button"
            onClick={addMaterial}
            disabled={readOnly}
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add Material
          </button>
        </div>
      )}
      <div className="space-y-3">
        {materials.map((material, index) => (
          <div key={`material-${index}`} className={embedded ? '' : 'rounded-lg border border-slate-200 bg-white p-3'}>
            {!embedded && (
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Material {index + 1}</p>
                {materials.length > 1 && !readOnly && (
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-4">
              <select
                value={material.materialType}
                onChange={(e) => updateMaterial(index, { materialType: e.target.value as MaterialType })}
                disabled={readOnly}
                className={`${fieldClass} w-full disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600`}
              >
                {materialTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {material.materialType === 'Add manually' && (
                <input
                  value={material.customMaterialName}
                  onChange={(e) => updateMaterial(index, { customMaterialName: e.target.value })}
                  placeholder="Enter material type"
                  readOnly={readOnly}
                  className={`${fieldClass} w-full read-only:bg-slate-100`}
                />
              )}
              {material.materialType === 'MS Plate' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder="Length (mm)"
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.widthMm}
                    onChange={(value) => updateMaterial(index, { widthMm: value })}
                    placeholder="Width (mm)"
                    unit={material.widthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { widthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.thicknessMm}
                    onChange={(value) => updateMaterial(index, { thicknessMm: value })}
                    placeholder="Thickness (mm)"
                    unit={material.thicknessUnit}
                    onUnitChange={(unit) => updateMaterial(index, { thicknessUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'MS Rod' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.diameterMm}
                    onChange={(value) => updateMaterial(index, { diameterMm: value })}
                    placeholder="Diameter (mm)"
                    unit={material.diameterUnit}
                    onUnitChange={(unit) => updateMaterial(index, { diameterUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder="Length (mm)"
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'MS Pipe' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.outerDiameterMm}
                    onChange={(value) => updateMaterial(index, { outerDiameterMm: value })}
                    placeholder="Outer Diameter (mm)"
                    unit={material.outerDiameterUnit}
                    onUnitChange={(unit) => updateMaterial(index, { outerDiameterUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.innerDiameterMm}
                    onChange={(value) => updateMaterial(index, { innerDiameterMm: value })}
                    placeholder="Inner Diameter (mm)"
                    unit={material.innerDiameterUnit}
                    onUnitChange={(unit) => updateMaterial(index, { innerDiameterUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder="Length (mm)"
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'MS Flat Bar' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.widthMm}
                    onChange={(value) => updateMaterial(index, { widthMm: value })}
                    placeholder="Width (mm)"
                    unit={material.widthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { widthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.thicknessMm}
                    onChange={(value) => updateMaterial(index, { thicknessMm: value })}
                    placeholder="Thickness (mm)"
                    unit={material.thicknessUnit}
                    onUnitChange={(unit) => updateMaterial(index, { thicknessUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder="Length (mm)"
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'MS Angle' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.sideAMm}
                    onChange={(value) => updateMaterial(index, { sideAMm: value })}
                    placeholder="Side A (mm)"
                    unit={material.sideAUnit}
                    onUnitChange={(unit) => updateMaterial(index, { sideAUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.sideBMm}
                    onChange={(value) => updateMaterial(index, { sideBMm: value })}
                    placeholder="Side B (mm)"
                    unit={material.sideBUnit}
                    onUnitChange={(unit) => updateMaterial(index, { sideBUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.thicknessMm}
                    onChange={(value) => updateMaterial(index, { thicknessMm: value })}
                    placeholder="Thickness (mm)"
                    unit={material.thicknessUnit}
                    onUnitChange={(unit) => updateMaterial(index, { thicknessUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder="Length (mm)"
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'MS Flange' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.outerDiameterMm}
                    onChange={(value) => updateMaterial(index, { outerDiameterMm: value })}
                    placeholder="Outer Diameter (mm)"
                    unit={material.outerDiameterUnit}
                    onUnitChange={(unit) => updateMaterial(index, { outerDiameterUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.innerDiameterMm}
                    onChange={(value) => updateMaterial(index, { innerDiameterMm: value })}
                    placeholder="Inner Diameter (mm)"
                    unit={material.innerDiameterUnit}
                    onUnitChange={(unit) => updateMaterial(index, { innerDiameterUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.thicknessMm}
                    onChange={(value) => updateMaterial(index, { thicknessMm: value })}
                    placeholder="Thickness (mm)"
                    unit={material.thicknessUnit}
                    onUnitChange={(unit) => updateMaterial(index, { thicknessUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              {material.materialType === 'Add manually' && (
                <>
                  <UnitInput
                    readOnly={readOnly}
                    value={material.lengthMm}
                    onChange={(value) => updateMaterial(index, { lengthMm: value })}
                    placeholder={`Length (${material.lengthUnit})`}
                    unit={material.lengthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { lengthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.widthMm}
                    onChange={(value) => updateMaterial(index, { widthMm: value })}
                    placeholder={`Width (${material.widthUnit})`}
                    unit={material.widthUnit}
                    onUnitChange={(unit) => updateMaterial(index, { widthUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                  <UnitInput
                    readOnly={readOnly}
                    value={material.thicknessMm}
                    onChange={(value) => updateMaterial(index, { thicknessMm: value })}
                    placeholder={`Thickness (${material.thicknessUnit})`}
                    unit={material.thicknessUnit}
                    onUnitChange={(unit) => updateMaterial(index, { thicknessUnit: unit })}
                    className={`${fieldClass} w-full`}
                  />
                </>
              )}
              <UnitInput
                readOnly={readOnly}
                value={material.quantity}
                onChange={(value) => updateMaterial(index, { quantity: value })}
                placeholder="Material quantity"
                unit="qty"
                className={`${fieldClass} w-full`}
              />
              <UnitInput
                value={materialWeights[index].toFixed(2)}
                onChange={() => {}}
                placeholder="Weight"
                unit="kg"
                className={`${fieldClass} w-full bg-slate-100`}
                readOnly
              />
            </div>
          </div>
        ))}
      </div>
      {showFooter ? (
        <>
          <p className="mt-3 text-sm font-semibold text-slate-700">Total material weight: {totalMaterialWeightKg.toFixed(2)} kg</p>
          <p className="mt-1 text-xs text-slate-500">
            Per-field mm/m units; weight updates instantly using 7850 kg/m³ density.
          </p>
        </>
      ) : null}
    </div>
  );
}
