export type Role = 'Admin' | 'User' | 'Viewer';
export type NavTab = 'dashboard' | 'projects' | 'members' | 'profile' | 'projectSummary' | 'payroll';

export type UserAccount = {
  id: number;
  fullName: string;
  username: string;
  email: string;
  designation: string;
  contactNo: string;
  role: Role;
  password: string;
  firstLogin: boolean;
  assignedProjectIds: number[];
  assignedOn: string;
};

export type Project = {
  id: number;
  name: string;
  description: string;
  parameter: string;
  location?: string;
  dateOfCommitment?: string;
  plannedFinishDate?: string;
  materials?: Array<{ name: string; dimensions: string; quantity?: string }>;
  /** From API parameters.projectKind: "Refit" | "New Project" (legacy "Renewal" treated as Refit in UI). */
  projectKind?: string;
  /** From API parameters.projectStatus (e.g. Active, Planning, On hold, Completed). */
  projectStatus?: string;
  entries: ProjectEntry[];
};

export type ProjectEntry = {
  dataId?: number;
  user: string;
  label: string;
  value: string;
  createdAt: string;
  projectType: string;
  areaSection: string;
  itemDetails: string;
  /** Stored `x`-separated mm dimensions from material entry meta (when present). */
  dimensions?: string;
  lengthMm: string;
  widthMm: string;
  thkDia: string;
  /** MS Angle bar length (mm); 4th dimension in `dimensions` (A×B×T×L). */
  barLengthMm: string;
  densityKgM3: string;
  qty: string;
  weight: string;
  weldingMeters: string;
  remarks: string;
};
