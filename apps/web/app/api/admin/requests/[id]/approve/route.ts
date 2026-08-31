import { NextResponse } from 'next/server';
import { hashPassword, requireSuperAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
    });

    if (accessRequest?.status !== 'pending') {
      return NextResponse.json(
        { error: { message: 'Request not found or already processed' } },
        { status: 400 },
      );
    }

    // 1. Create Organization
    const orgName = accessRequest.company || 'Default Organization';
    const orgSlug =
      orgName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    const org = await prisma.organization.create({
      data: { name: orgName, slug: orgSlug },
    });

    // 2. Create User
    const rawPassword = `${Math.random().toString(36).slice(-8)}A1!`;
    const hashedPassword = await hashPassword(rawPassword);

    const user = await prisma.user.create({
      data: {
        tenantId: org.id,
        email: accessRequest.email,
        fullName: accessRequest.fullName,
        hashedPassword,
        role: 'org_admin', // Give them Org Admin privileges in their new tenant
      },
    });

    // 3. Mark request as approved
    await prisma.accessRequest.update({
      where: { id },
      data: { status: 'approved' },
    });

    // Send back the temporary password so the Super Admin can see it
    return NextResponse.json({
      message: 'Approved successfully',
      user: { email: user.email, temporaryPassword: rawPassword },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 },
    );
  }
}
