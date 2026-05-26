import type { BackendRole, Role } from './types';

export const frontendToBackendRole: Record<Role | 'user' | 'developer' | 'insight_readonly', BackendRole> = {
  nasabah: 'NASABAH',
  admin: 'ADMIN',
  teller: 'TELLER',
  manager: 'MANAGER',
  user: 'NASABAH',
  developer: 'TELLER',
  insight_readonly: 'MANAGER',
};

export const backendToFrontendRole: Record<BackendRole | 'USER' | 'DEVELOPER' | 'INSIGHT_READONLY', Role> = {
  NASABAH: 'nasabah',
  ADMIN: 'admin',
  TELLER: 'teller',
  MANAGER: 'manager',
  USER: 'nasabah',
  DEVELOPER: 'teller',
  INSIGHT_READONLY: 'manager',
};

export function toBackendRole(role: Role | 'user' | 'developer' | 'insight_readonly'): BackendRole {
  return frontendToBackendRole[role];
}

export function toFrontendRole(role: BackendRole | 'USER' | 'DEVELOPER' | 'INSIGHT_READONLY'): Role {
  return backendToFrontendRole[role];
}

export function isFrontendRole(role: string): role is Role {
  return role === 'nasabah' || role === 'admin' || role === 'teller' || role === 'manager';
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem('smartbank_token');
}
