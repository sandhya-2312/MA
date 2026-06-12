import { useState } from 'react';
import type { FormEvent } from 'react';
import type { UserAccount } from '../types';

type FirstLoginSetupPageProps = {
  user: UserAccount;
  status: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBackToLogin: () => void;
};

export function FirstLoginSetupPage({ user, status, onSubmit, onBackToLogin }: FirstLoginSetupPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto mt-20 max-w-lg rounded-xl border border-slate-200/90 bg-white p-8 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
        <h2 className="mb-2 text-xl font-bold text-slate-800">First Login Setup</h2>
        <p className="mb-6 text-sm text-slate-500">
          Complete your profile and set new credentials to continue to dashboard.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="fullName"
            defaultValue={user.fullName}
            placeholder="Full name"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
            required
          />
          <input
            name="username"
            defaultValue={user.username}
            placeholder="Username"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
            required
          />
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
            required
          />
          <input
            name="contactNo"
            defaultValue={user.contactNo}
            placeholder="Contact number"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
            required
          />
          <input
            name="designation"
            defaultValue={user.designation}
            placeholder="Designation (optional)"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
          />
          <div className="relative">
            <input
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              minLength={6}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700"
              aria-label={showPassword ? 'Hide new password' : 'Show new password'}
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
          <button
            type="submit"
            className="w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Complete Setup
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full rounded-md border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to login page
          </button>
        </form>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </section>
    </main>
  );
}
