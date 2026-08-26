import type { UUID, ISODateTime, UserRole } from './common';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: UUID;
  is_active: boolean;
  avatar_url?: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface UserProfile extends User {
  permissions: string[];
  organization?: Organization;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  tenant_type: string;
  logo_url?: string;
  is_active: boolean;
}
