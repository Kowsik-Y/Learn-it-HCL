import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;
    if (body.fullName !== undefined) dataToUpdate.fullName = body.fullName;
    if (body.role !== undefined) dataToUpdate.role = body.role;

    const user = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminUser = await requireSuperAdmin(request);
    const { id } = await params;

    if (id === adminUser.id) {
      return NextResponse.json({ error: { message: 'Cannot delete yourself' } }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 },
    );
  }
}
