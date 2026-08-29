import { NextResponse } from "next/server";
import { requireSuperAdmin, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request);

    const roles = await prisma.customRole.findMany({
      where: { tenantId: null },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      items: roles.map((role: { id: any; name: any; slug: any; permissions: any; createdAt: { toISOString: () => any; }; }) => ({
        id: role.id,
        name: role.name,
        slug: role.slug,
        is_global: true,
        permissions: role.permissions || [],
        created_at: role.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("List global roles error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to list global roles" } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin(request);
    
    const body = await request.json();
    const { name, slug, permissions } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields (name, slug)" } },
        { status: 400 }
      );
    }

    // Check if slug is taken globally
    const existingRole = await prisma.customRole.findFirst({
      where: { 
        tenantId: null,
        slug: slug,
      },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Global role slug already exists" } },
        { status: 409 }
      );
    }

    const newRole = await prisma.customRole.create({
      data: {
        tenantId: null, // Global
        name,
        slug,
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    return NextResponse.json({
      message: "Global role created successfully",
      role: {
        id: newRole.id,
        name: newRole.name,
        slug: newRole.slug,
        is_global: true,
        permissions: newRole.permissions,
      },
    }, { status: 201 });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Create global role error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to create global role" } },
      { status: 500 }
    );
  }
}
