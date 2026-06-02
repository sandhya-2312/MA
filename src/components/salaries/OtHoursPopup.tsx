import { useEffect, useRef, useState } from 'react';

type OtHoursPopupProps = {
  open: boolean;
  initialHours: number;
  onConfirm: (hours: number) => void;
  onClearDay: () => void;
  onCancel: () => void;
};

export function OtHoursPopup({ open, initialHours, onConfirm, onClearDay, onCancel }: OtHoursPopupProps) {
  const [hours, setHours] = useState(String(initialHours || ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setHours(initialHours > 0 ? String(initialHours) : '');
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, initialHours]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const submit = () => {
    const n = Number(hours.trim());
    if (!Number.isFinite(n) || n < 0) return;
    onConfirm(Math.round(n * 10) / 10);
  };

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/30 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-[240px] rounded-lg border border-violet-200 bg-white p-4 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ot-hours-title"
      >
        <h3 id="ot-hours-title" className="text-sm font-bold text-violet-900">
          Overtime hours
        </h3>
        <p className="mt-1 text-xs text-slate-600">Present + OT — enter hours for this day (e.g. 2 or 4.5).</p>
        <input
          ref={inputRef}
          type="number"
          min={0}
          step={0.5}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Hours"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClearDay}
            className="text-xs font-semibold text-slate-500 underline hover:text-slate-800"
          >
            Clear day
          </button>
          <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-md bg-violet-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-800"
          >
            OK
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
