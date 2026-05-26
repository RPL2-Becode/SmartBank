import type { Role, User } from '../../types';
import { toBackendRole, toFrontendRole } from '../../utils';
import { apiRequest } from './client';

type AuthResponse = {
  status: 'success';
  token: string;
  data: {
    userId: string;
    name: string;
    role: Role | 'NASABAH' | 'ADMIN' | 'TELLER' | 'MANAGER';
    balance: number;
  };
};

function toUser(response: AuthResponse): User {
  const role = response.data.role.toUpperCase() === response.data.role
    ? toFrontendRole(response.data.role as 'NASABAH' | 'ADMIN' | 'TELLER' | 'MANAGER')
    : response.data.role as Role;

  return {
    id: response.data.userId,
    name: response.data.name,
    email: response.data.userId,
    role,
    accountCode: response.data.userId,
  };
}

export async function login(userId: string, password: string): Promise<{ token: string; user: User }> {
  if (!userId || !password) {
    throw new Error('User ID and password are required');
  }

  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { userId, password },
  });

  sessionStorage.setItem('smartbank_token', response.token);
  return { token: response.token, user: toUser(response) };
}

export async function register(input: {
  name: string;
  userId: string;
  password: string;
  role: Role;
}): Promise<{ user: User; initialBalance: number }> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: {
      userId: input.userId,
      name: input.name,
      password: input.password,
      role: input.role,
      backendRole: toBackendRole(input.role),
    },
  });

  sessionStorage.setItem('smartbank_token', response.token);
  return { user: toUser(response), initialBalance: response.data.balance };
}
