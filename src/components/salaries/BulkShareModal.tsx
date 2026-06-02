import { useMemo, useState } from 'react';
import type { PayrollEmployeeRow } from '../../services/payrollApi.ts';
import {
  buildBulkShareText,
  buildPayrollShareMessage,
  buildWhatsAppUrl,
  copyPayrollShareMessage,
  normalizePhoneForMessaging,
  type PayrollShareContext,
} from '../../utils/payrollShare.ts';
import { Modal } from '../ui/Modal.tsx';
import { AttendanceShareButtons } from './AttendanceShareButtons.tsx';

type BulkShareModalProps = {
  open: boolean;
  rows: PayrollEmployeeRow[];
  shareContext: PayrollShareContext;
  onClose: () => void;
  onNotify: (message: string, variant?: 'success' | 'error') => void;
  onOpenPayslip: (row: PayrollEmployeeRow) => void;
};

type EligibleEmployee = {
  row: PayrollEmployeeRow;
  phone: string;
};

export function BulkShareModal({ open, rows, shareContext, onClose, onNotify, onOpenPayslip }: BulkShareModalProps) {
  const [guidedIndex, setGuidedIndex] = useState<number | null>(null);

  const withPhone = useMemo(
    () =>
      rows.map((row) => ({
        row,
        phone: normalizePhoneForMessaging(row.contact_number),
      })),
    [rows],
  );

  const eligible: EligibleEmployee[] = useMemo(
    () =>
      withPhone
        .filter((e): e is typeof e & { phone: { ok: true; e164: string } } => e.phone.ok)
        .map((e) => ({ row: e.row, phone: e.phone.e164 })),
    [withPhone],
  );

  const missingCount = withPhone.length - eligible.length;
  const currentGuided = guidedIndex !== null ? eligible[guidedIndex] : null;
  const currentMessage = currentGuided ? buildPayrollShareMessage(currentGuided.row, shareContext) : '';
  const currentWaUrl = currentGuided ? buildWhatsAppUrl(currentGuided.phone, currentMessage) : '';

  const resetGuided = () => setGuidedIndex(null);

  const handleClose = () => {
    resetGuided();
    onClose();
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(buildBulkShareText(rows, shareContext));
      onNotify(`Copied ${rows.length} attendance message(s)`, 'success');
    } catch {
      onNotify('Could not copy messages', 'error');
    }
  };

  const startGuidedWhatsApp = () => {
    if (!eligible.length) {
      onNotify('No employees have a valid contact number.', 'error');
      return;
    }
    setGuidedIndex(0);
  };

  const copyCurrentMessage = async () => {
    if (!currentGuided) return;
    try {
      await copyPayrollShareMessage(currentGuided.row, shareContext);
      onNotify('Message copied — paste in WhatsApp if needed', 'success');
    } catch {
      onNotify('Could not copy message', 'error');
    }
  };

  const goToNext = () => {
    if (guidedIndex === null) return;
    const next = guidedIndex + 1;
    if (next >= eligible.length) {
      resetGuided();
      onNotify(`Finished sending to ${eligible.length} employee(s)`, 'success');
      return;
    }
    setGuidedIndex(next);
  };

  const skipCurrent = () => goToNext();

  return (
    <Modal
      open={open}
      title="Share monthly attendance"
      onClose={handleClose}
      size="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          {guidedIndex !== null ? (
            <>
              <button
                type="button"
                onClick={resetGuided}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Exit guided send
              </button>
              <button
                type="button"
                onClick={skipCurrent}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
              >
                {guidedIndex + 1 >= eligible.length ? 'Done' : 'Next employee'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCopyAll()}
                className="rounded-md border border-slate-400 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
              >
                Copy all messages
              </button>
              <button
                type="button"
                onClick={startGuidedWhatsApp}
                disabled={eligible.length === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send all via WhatsApp ({eligible.length})
              </button>
            </>
          )}
        </div>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        Send attendance summaries for <strong>{rows.length}</strong> employee(s).
        {missingCount > 0 && (
          <span className="text-amber-700"> {missingCount} missing a valid phone number.</span>
        )}
      </p>

      {guidedIndex !== null && currentGuided && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            Step {guidedIndex + 1} of {eligible.length}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900">{currentGuided.row.name}</p>
          <p className="text-xs text-slate-600">+{currentGuided.phone}</p>
          <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-emerald-100 bg-white p-2 text-xs text-slate-800">
            {currentMessage}
          </pre>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyCurrentMessage()}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Copy message
            </button>
            <a
              href={currentWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Open WhatsApp
            </a>
          </div>
          <p className="mt-2 text-xs text-emerald-900">
            Tap <strong>Open WhatsApp</strong>, send the message, then click <strong>Next employee</strong>.
            No pop-ups required.
          </p>
        </div>
      )}

      <ul className="max-h-[min(50vh,420px)] space-y-2 overflow-y-auto pr-1">
        {withPhone.map(({ row, phone }) => {
          const isActive = guidedIndex !== null && eligible[guidedIndex]?.row.id === row.id;
          return (
            <li
              key={row.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                isActive ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50/80'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{row.name}</p>
                <p className="text-xs text-slate-500">{phone.ok ? `+${phone.e164}` : phone.error}</p>
              </div>
              <div className="flex items-center gap-2">
                {phone.ok && (
                  <a
                    href={buildWhatsAppUrl(phone.e164, buildPayrollShareMessage(row, shareContext))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
                  >
                    WhatsApp
                  </a>
                )}
                <AttendanceShareButtons
                  row={row}
                  shareContext={shareContext}
                  onNotify={onNotify}
                  onOpenPayslip={onOpenPayslip}
                  compact={false}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
