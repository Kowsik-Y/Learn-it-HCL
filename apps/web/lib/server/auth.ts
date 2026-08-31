/**
 * Learn-it HCL — Server-Side Auth Utilities
 *
 * JWT creation/verification and password hashing.
 * Mirrors the Python backend's core/security.py logic.
 * Runs only on the server (Next.js API routes / middleware).
 */

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { type JWTPayload, jwtVerify, SignJWT } from 'jose';
import { prisma } from '@/lib/server/db';

// ── Configuration ───────────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
} as const;

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || 'change-this-to-a-random-secret-in-production',
);
const JWT_ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(
  process.env.JWT_ACCESS_TOKEN_EXPIRE_MINUTES || '30',
  10,
);
const REFRESH_TOKEN_EXPIRE_DAYS = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE_DAYS || '7', 10);

// ── Password Hashing ────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// ── JWT Token Creation ──────────────────────────────────

export interface TokenPayload extends JWTPayload {
  sub: string;
  email: string;
  role: string;
  tenant_id: string;
  type: 'access' | 'refresh';
}

export async function createAccessToken(data: {
  sub: string;
  email: string;
  role: string;
  tenant_id: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    ...data,
    type: 'access',
    jti: crypto.randomUUID(),
    iat: now,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRE_MINUTES}m`)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(data: {
  sub: string;
  email: string;
  role: string;
  tenant_id: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    ...data,
    type: 'refresh',
    jti: crypto.randomUUID(),
    iat: now,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime(`${REFRESH_TOKEN_EXPIRE_DAYS}d`)
    .sign(JWT_SECRET);
}

// ── JWT Token Verification ──────────────────────────────

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });
    return payload as TokenPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

// ── Auth Helper: Get Current User from Request ──────────

export interface AuthUser {
  user: any;
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  avatarUrl: string | null;
}

/**
 * Extract and validate the current user from the Authorization header.
 * Use this in API Route Handlers.
 */
export async function getCurrentUser(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization');
  const cookieHeader = request.headers.get('cookie');

  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token && cookieHeader) {
    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    throw new AuthError('Authentication required', 401);
  }

  let payload: TokenPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    throw new AuthError('Invalid or expired token', 401);
  }

  if (payload.type !== 'access') {
    throw new AuthError('Invalid token type', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new AuthError('User not found', 401);
  }

  if (!user.isActive) {
    throw new AuthError('Account is deactivated', 403);
  }

  return {
    user,
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    tenantId: user.tenantId,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
  };
}

/**
 * Enforce that the current user has the SUPER_ADMIN role.
 */
export async function requireSuperAdmin(request: Request): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (user.role !== ROLES.SUPER_ADMIN) {
    throw new AuthError('Forbidden: Requires Super Admin privileges', 403);
  }
  return user;
}

/**
 * Enforce that the current user has the ORG_ADMIN role (or higher).
 */
export async function requireOrgAdmin(request: Request): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.ORG_ADMIN) {
    throw new AuthError('Forbidden: Requires Organization Admin privileges', 403);
  }
  return user;
}

/**
 * Ensure the current user has a specific permission explicitly granted in their custom role.
 */
export async function requirePermission(
  request: Request,
  requiredPermission: string,
): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  // Super Admins and Org Admins inherently bypass granular permission checks
  // as they are platform/tenant owners.
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ORG_ADMIN) {
    return user;
  }

  // Fetch the user's custom role definition to check permissions
  const roleRecord = await prisma.customRole.findFirst({
    where: {
      slug: user.role,
      OR: [{ tenantId: null }, { tenantId: user.tenantId }],
    },
  });

  if (!roleRecord) {
    throw new AuthError('Forbidden: Role definition not found', 403);
  }

  const permissions = Array.isArray(roleRecord.permissions)
    ? (roleRecord.permissions as string[])
    : [];

  if (!permissions.includes(requiredPermission)) {
    throw new AuthError(`Forbidden: Missing required permission '${requiredPermission}'`, 403);
  }

  return user;
}

// ── Token Helper ────────────────────────────────────────

export async function createTokenPair(user: {
  id: string;
  email: string;
  role: string;
  tenantId: string;
}) {
  const tokenData = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenant_id: user.tenantId,
  };

  const [accessToken, refreshToken] = await Promise.all([
    createAccessToken(tokenData),
    createRefreshToken(tokenData),
  ]);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: ACCESS_TOKEN_EXPIRE_MINUTES * 60,
  };
}

// ── Error Class ─────────────────────────────────────────

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}
