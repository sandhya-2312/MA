import type { FormEvent } from 'react';
import { roleLabel } from '../roleLabel';
import type { UserAccount } from '../types';

type ProfilePageProps = {
  loggedInUser: UserAccount;
  status: string;
  handleSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
};

const labelClass = 'mb-1 block text-xs font-medium text-slate-600';
const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-slate-200 transition focus:ring-2';

function IconProfile() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfilePage({ loggedInUser, status, handleSaveProfile }: ProfilePageProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)] sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600 [&_svg]:h-4 [&_svg]:w-4">
            <IconProfile />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800">My Profile</h3>
            <p className="text-sm text-slate-500">Update and save your first-login details anytime.</p>
          </div>
        </div>
        <form
          key={`${loggedInUser.id}-${loggedInUser.username}-${loggedInUser.contactNo}-${loggedInUser.fullName}-${loggedInUser.email}-${loggedInUser.designation}`}
          onSubmit={handleSaveProfile}
          className="grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className={labelClass} htmlFor="profile-full-name">
              Full name
            </label>
            <input
              id="profile-full-name"
              name="fullName"
              defaultValue={loggedInUser.fullName}
              placeholder="Enter full name"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-username">
              Username
            </label>
            <input
              id="profile-username"
              name="username"
              defaultValue={loggedInUser.username}
              placeholder="Login username"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              name="email"
              type="email"
              defaultValue={loggedInUser.email}
              placeholder="name@example.com"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-contact">
              Contact number
            </label>
            <input
              id="profile-contact"
              name="contactNo"
              defaultValue={loggedInUser.contactNo}
              placeholder="Phone or mobile number"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-designation">
              Designation
            </label>
            <input
              id="profile-designation"
              name="designation"
              defaultValue={loggedInUser.designation}
              placeholder="Job title (optional)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-role">
              Role
            </label>
            <input
              id="profile-role"
              value={roleLabel(loggedInUser.role)}
              readOnly
              className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-600`}
              aria-readonly="true"
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="profile-password">
              New password
            </label>
            <input
              id="profile-password"
              name="newPassword"
              type="password"
              placeholder="Leave blank to keep current password"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 md:col-span-2 md:justify-self-start"
          >
            Save Profile
          </button>
        </form>
        <p className="mt-3 text-sm text-slate-500">{status}</p>
      </div>
    </section>
  );
}
