import { NextResponse } from 'next/server';
import { AuthError, requireOrgAdmin } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function GET(request: Request) {
  try {
    const adminUser = await requireOrgAdmin(request);

    // Get both global roles and tenant-specific roles
    const roles = await prisma.customRole.findMany({
      where: {
        OR: [{ tenantId: null }, { tenantId: adminUser.tenantId }],
      },
      orderBy: [
        { tenantId: 'asc' }, // Nulls first usually, then ascending
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({
      items: roles.map((role: any) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        is_global: role.tenantId === null,
        permissions: role.permissions || [],
        created_at: role.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('List org roles error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to list organization roles' } },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await requireOrgAdmin(request);

    const body = await request.json();
    const { name, slug, permissions } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Missing required fields (name, slug)' } },
        { status: 400 },
      );
    }

    // Check if slug is taken in this tenant (or globally)
    const existingRole = await prisma.customRole.findFirst({
      where: {
        OR: [
          { tenantId: null, slug: slug },
          { tenantId: adminUser.tenantId, slug: slug },
        ],
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Role slug already exists' } },
        { status: 409 },
      );
    }

    const newRole = await prisma.customRole.create({
      data: {
        tenantId: adminUser.tenantId,
        name,
        slug,
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    return NextResponse.json(
      {
        message: 'Organization role created successfully',
        role: {
          id: newRole.id,
          name: newRole.name,
          slug: newRole.slug,
          is_global: false,
          permissions: newRole.permissions,
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
    console.error('Create org role error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create organization role' } },
      { status: 500 },
    );
  }
}
