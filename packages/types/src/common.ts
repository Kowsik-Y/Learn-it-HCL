// Common types used across the platform

export type UUID = string;
export type ISODateTime = string;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiResponse<T> {
  data: T;
  request_id: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  MENTOR = 'mentor',
  STUDENT = 'student',
}

export enum TenantType {
  STANDALONE = 'standalone',
  SCHOOL = 'school',
  COLLEGE = 'college',
  UNIVERSITY = 'university',
  BOOTCAMP = 'bootcamp',
  CORPORATE = 'corporate',
  COACHING = 'coaching',
}
