export type UserRole = 'Admin' | 'Operator' | 'Customer';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  avatarUrl?: string;
  claims?: Record<string, unknown>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
}
