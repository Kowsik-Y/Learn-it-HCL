import { NextResponse } from 'next/server';
import { AuthError, hashPassword, ROLES, requireOrgAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function GET(request: Request) {
  try {
    const adminUser = await requireOrgAdmin(request);

    const users = await prisma.user.findMany({
      where: { tenantId: adminUser.tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({
      items: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        is_active: u.isActive,
        created_at: u.createdAt.toISOString(),
        last_login_at: u.lastLoginAt?.toISOString() || null,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('List users error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list users' } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireOrgAdmin(request);

    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 },
      );
    }

    // Ensure the org admin can only create TEACHER or STUDENT roles, unless they are SUPER_ADMIN
    if (
      role === ROLES.SUPER_ADMIN ||
      (role === ROLES.ORG_ADMIN && adminUser.role !== ROLES.SUPER_ADMIN)
    ) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot assign this role' } },
        { status: 403 },
      );
    }

    // Check if user already exists in this tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: adminUser.tenantId,
          email: email,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'User already exists in this organization' } },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        tenantId: adminUser.tenantId,
        email,
        fullName: full_name,
        hashedPassword,
        role,
        isVerified: true, // Auto-verified if created by admin
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.fullName,
          role: newUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 },
    );
  }
}
