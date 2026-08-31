import { NextResponse } from 'next/server';
import { AuthError, ROLES, requireOrgAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireOrgAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const { role, is_active, full_name } = body;

    // Verify the user belongs to the same tenant as the admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.tenantId !== adminUser.tenantId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 },
      );
    }

    // Protection against modifying super admins or self demotion without care
    if (targetUser.role === ROLES.SUPER_ADMIN && adminUser.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot modify super admin' } },
        { status: 403 },
      );
    }

    const dataToUpdate: any = {};

    if (role !== undefined) {
      if (role === ROLES.SUPER_ADMIN && adminUser.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Cannot assign super admin role' } },
          { status: 403 },
        );
      }
      dataToUpdate.role = role;
    }

    if (is_active !== undefined) {
      dataToUpdate.isActive = is_active;
    }

    if (full_name !== undefined) {
      dataToUpdate.fullName = full_name;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.fullName,
        role: updatedUser.role,
        is_active: updatedUser.isActive,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireOrgAdmin(request);
    const { id } = await params;

    // Verify the user belongs to the same tenant as the admin
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser || targetUser.tenantId !== adminUser.tenantId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 },
      );
    }

    if (id === adminUser.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot delete yourself' } },
        { status: 403 },
      );
    }

    if (targetUser.role === ROLES.SUPER_ADMIN && adminUser.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Cannot delete super admin' } },
        { status: 403 },
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' } },
      { status: 500 },
    );
  }
}
