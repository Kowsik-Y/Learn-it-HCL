import type { ISODateTime, UUID } from './common';

export interface AttendanceSession {
  id: UUID;
  course_id: UUID;
  class_id?: UUID;
  teacher_id: UUID;
  title: string;
  session_date: string;
  start_time: ISODateTime;
  end_time: ISODateTime;
  status: AttendanceSessionStatus;
  verification_method: VerificationMethod;
  otp_code?: string;
  qr_token?: string;
}

export enum AttendanceSessionStatus {
  SCHEDULED = 'scheduled',
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum VerificationMethod {
  OTP = 'otp',
  QR = 'qr',
  BIOMETRIC = 'biometric',
  MANUAL = 'manual',
  DEVICE = 'device',
}

export interface AttendanceRecord {
  id: UUID;
  session_id: UUID;
  student_id: UUID;
  student_name: string;
  status: AttendanceStatus;
  check_in_time?: ISODateTime;
  check_out_time?: ISODateTime;
  verification_method: VerificationMethod;
  device_id?: string;
  is_verified: boolean;
  exception_reason?: string;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  EXCUSED = 'excused',
  LEAVE = 'leave',
  PARTIAL = 'partial',
  EARLY_EXIT = 'early_exit',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
  MANUALLY_CORRECTED = 'manually_corrected',
}

export interface AttendancePolicy {
  id: UUID;
  name: string;
  minimum_percentage: number;
  late_threshold_minutes: number;
  grace_period_minutes: number;
  early_departure_threshold_minutes: number;
  verification_required: VerificationMethod[];
  location_validation: boolean;
  allow_manual_override: boolean;
}

export interface AttendanceSummary {
  total_sessions: number;
  present_count: number;
  late_count: number;
  absent_count: number;
  excused_count: number;
  attendance_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface LeaveRequest {
  id: UUID;
  student_id: UUID;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approved_by?: UUID;
  created_at: ISODateTime;
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}
