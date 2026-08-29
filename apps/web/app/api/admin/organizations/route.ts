import { NextResponse } from "next/server";
import { requireSuperAdmin, AuthError, ROLES, hashPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request);

    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json({
      items: organizations.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        tenant_type: org.tenantType,
        is_active: org.isActive,
        created_at: org.createdAt.toISOString(),
        user_count: org._count.users,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("List orgs error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to list organizations" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request);
    
    const body = await request.json();
    const { name, slug, admin_email, admin_password, admin_name } = body;

    if (!name || !slug || !admin_email || !admin_password || !admin_name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    // Check if slug is taken
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Organization slug already exists" } },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(admin_password);

    // Create Org and the Org Admin in a transaction
    const organization = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name,
          slug,
          tenantType: "standalone",
        },
      });

      // Create the org admin user
      await tx.user.create({
        data: {
          tenantId: org.id,
          email: admin_email,
          fullName: admin_name,
          hashedPassword,
          role: ROLES.ORG_ADMIN,
          isVerified: true,
        },
      });

      return org;
    });

    return NextResponse.json({
      message: "Organization and initial admin created successfully",
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Create org error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create organization" } },
      { status: 500 }
    );
  }
}
