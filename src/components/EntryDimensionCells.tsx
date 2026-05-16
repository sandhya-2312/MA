import type { EntryDimensionCell } from './CreateProjectForm';

export function EntryDimensionTd({
  cell,
  className = 'px-3 py-2 align-top tabular-nums',
}: {
  cell: EntryDimensionCell;
  className?: string;
}) {
  if (cell.value === '—') {
    return <td className={`${className} text-slate-400`}>—</td>;
  }
  return (
    <td className={className}>
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{cell.label}</span>
      <span className="text-slate-800">{cell.value}</span>
    </td>
  );
}
