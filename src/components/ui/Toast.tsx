import { useEffect } from 'react';

type ToastProps = {
  message: string | null;
  variant?: 'success' | 'error';
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({ message, variant = 'success', onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  const styles =
    variant === 'error'
      ? 'border-rose-300 bg-rose-50 text-rose-900'
      : 'border-emerald-300 bg-emerald-50 text-emerald-900';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-[300] max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${styles}`}
    >
      {message}
    </div>
  );
}
