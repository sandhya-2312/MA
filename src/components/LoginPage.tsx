import { useState } from 'react';
import type { FormEvent } from 'react';
import { forgotPassword } from '../services/authApi.ts';
import { BrandLogo } from './BrandLogo.tsx';

type LoginPageProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loginError: string;
  defaultUsername?: string;
  defaultRememberMe?: boolean;
};

export function LoginPage({
  onSubmit,
  loginError,
  defaultUsername = '',
  defaultRememberMe = false,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(defaultRememberMe);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState(defaultUsername);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotTempPassword, setForgotTempPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotUsername(defaultUsername);
    setForgotEmail('');
    setForgotError('');
    setForgotMessage('');
    setForgotTempPassword('');
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotError('');
    setForgotMessage('');
    setForgotTempPassword('');
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const username = forgotUsername.trim();
    const email = forgotEmail.trim();
    if (!username || !email) {
      setForgotError('Username and email are required.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    setForgotTempPassword('');
    try {
      const response = await forgotPassword(username, email);
      setForgotMessage(response.message);
      setForgotTempPassword(response.temporary_password ?? '');
    } catch (error) {
      setForgotError(error instanceof Error ? error.message : 'Unable to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-md rounded-xl border border-slate-200/90 bg-white p-8 shadow-[0_4px_14px_rgba(0,0,0,0.08)] sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandLogo className="h-24 w-auto max-w-[260px] object-contain" />
            <p className="mt-5 text-sm text-slate-500">Sign in to your account</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-sm font-semibold text-slate-800">
                Username
              </label>
              <input
                id="login-username"
                name="username"
                autoComplete="username"
                defaultValue={defaultUsername}
                placeholder="Enter username"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-teal-500/20 transition focus:border-[#5FC6B7] focus:ring-2"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-slate-800">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-teal-500/20 transition focus:border-[#5FC6B7] focus:ring-2"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.73 1.8-3.28 3.06-4.56" />
                      <path d="M10.59 10.59A2 2 0 1 0 13.41 13.41" />
                      <path d="M1 1l22 22" />
                      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.77 11.77 0 0 1-2.16 3.19" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#5FC6B7] focus:ring-[#5FC6B7]"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-sm font-medium text-[#2d9d8f] transition hover:text-[#247a70] hover:underline"
                onClick={openForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            {loginError ? <p className="text-sm text-red-600">{loginError}</p> : null}

            <button
              type="submit"
              className="w-full rounded-md bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Login
            </button>
          </form>
        </section>

        <p className="mt-6 text-center text-xs text-slate-400">
          Designed by Turiya Softech Pvt Ltd.
        </p>
      </main>

      {showForgotPassword ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 id="forgot-password-title" className="text-lg font-semibold text-slate-800">
                  Reset password
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your username and registered email to receive a temporary password.
                </p>
              </div>
              <button
                type="button"
                onClick={closeForgotPassword}
                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close reset password dialog"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-username" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Username
                </label>
                <input
                  id="forgot-username"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-teal-500/20 transition focus:border-[#5FC6B7] focus:ring-2"
                  required
                />
              </div>

              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold text-slate-800">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="Enter registered email"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none ring-teal-500/20 transition focus:border-[#5FC6B7] focus:ring-2"
                  required
                />
              </div>

              {forgotError ? <p className="text-sm text-red-600">{forgotError}</p> : null}
              {forgotMessage ? <p className="text-sm text-emerald-700">{forgotMessage}</p> : null}
              {forgotTempPassword ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Temporary password</p>
                  <p className="mt-1 font-mono text-sm text-emerald-900">{forgotTempPassword}</p>
                </div>
              ) : null}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="flex-1 rounded-md border border-slate-200 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 rounded-md bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {forgotLoading ? 'Resetting…' : 'Reset password'}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
