import { useState } from 'react';
import type { FormEvent } from 'react';
import { BrandLogo } from './BrandLogo.tsx';

type LoginPageProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loginError: string;
};

export function LoginPage({ onSubmit, loginError }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
              <a
                href="#"
                className="text-sm font-medium text-[#2d9d8f] transition hover:text-[#247a70] hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
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
      </main>

    </div>
  );
}
