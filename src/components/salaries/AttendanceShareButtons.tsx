import type { PayrollEmployeeRow } from '../../services/payrollApi.ts';
import {
  copyPayrollShareMessage,
  openSmsShare,
  openWhatsAppShare,
  type PayrollShareContext,
  type PhoneValidation,
} from '../../utils/payrollShare.ts';
type AttendanceShareButtonsProps = {
  row: PayrollEmployeeRow;
  shareContext: PayrollShareContext;
  onNotify: (message: string, variant?: 'success' | 'error') => void;
  onOpenPayslip: (row: PayrollEmployeeRow) => void;
  compact?: boolean;
};

function IconWhatsApp({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconSms({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCopy({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function IconPdf({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function handlePhoneResult(result: PhoneValidation, onNotify: AttendanceShareButtonsProps['onNotify']) {
  if (!result.ok) onNotify(result.error, 'error');
}

const btnBase =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40';

export function AttendanceShareButtons({
  row,
  shareContext,
  onNotify,
  onOpenPayslip,
  compact = true,
}: AttendanceShareButtonsProps) {
  const handleWhatsApp = () => {
    const result = openWhatsAppShare(row, shareContext);
    handlePhoneResult(result, onNotify);
  };

  const handleSms = () => {
    const result = openSmsShare(row, shareContext);
    handlePhoneResult(result, onNotify);
  };

  const handleCopy = async () => {
    try {
      await copyPayrollShareMessage(row, shareContext);
      onNotify('Message copied to clipboard', 'success');
    } catch {
      onNotify('Could not copy message', 'error');
    }
  };

  const handlePdf = () => {
    onOpenPayslip(row);
  };

  return (
    <div className={`flex flex-wrap items-center justify-center gap-0.5 ${compact ? '' : 'gap-1'}`}>
      <button
        type="button"
        onClick={handleWhatsApp}
        className={`${btnBase} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700`}
        title="Send Attendance via WhatsApp"
        aria-label={`WhatsApp ${row.name}`}
      >
        <IconWhatsApp />
      </button>
      <button
        type="button"
        onClick={handleSms}
        className={`${btnBase} border-sky-600 bg-sky-600 text-white hover:bg-sky-700`}
        title="Send Attendance via SMS"
        aria-label={`SMS ${row.name}`}
      >
        <IconSms />
      </button>
      <button
        type="button"
        onClick={handlePdf}
        className={`${btnBase} border-slate-400 bg-slate-100 text-slate-800 hover:bg-slate-200`}
        title="View payslip — print or save as PDF"
        aria-label={`Payslip ${row.name}`}
      >
        <IconPdf />
      </button>
      {!compact && (
        <button
          type="button"
          onClick={() => void handleCopy()}
          className={`${btnBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}
          title="Copy attendance message"
          aria-label={`Copy message ${row.name}`}
        >
          <IconCopy />
        </button>
      )}
    </div>
  );
}
