import type { Role } from './types';

/** UI label: backend role `User` is shown as "Member". */
export function roleLabel(role: Role): string {
  return role === 'User' ? 'Member' : role;
}
