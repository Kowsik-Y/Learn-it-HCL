import { NextResponse } from "next/server";
import { requireSuperAdmin, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    
    // In Next.js 16+, params is a Promise and needs to be awaited
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing role ID" } },
        { status: 400 }
      );
    }

    // Verify it's a global role before deleting
    const existingRole = await prisma.customRole.findFirst({
      where: { 
        id,
        tenantId: null 
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Global role not found" } },
        { status: 404 }
      );
    }

    // Check if the role is protected
    const PROTECTED_ROLES = ["super_admin", "org_admin"];
    if (PROTECTED_ROLES.includes(existingRole.slug)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot delete default system roles" } },
        { status: 403 }
      );
    }

    const usersWithRole = await prisma.user.findFirst({
      where: { role: existingRole.slug }
    });
    
    if (usersWithRole) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "Cannot delete role because it is assigned to one or more users" } },
        { status: 409 }
      );
    }

    await prisma.customRole.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Global role deleted successfully" });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Delete global role error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete global role" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    
    const { id } = await params;
    const body = await request.json();
    const { name, permissions } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const existingRole = await prisma.customRole.findFirst({
      where: { 
        id,
        tenantId: null 
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Global role not found" } },
        { status: 404 }
      );
    }

    // Do not allow editing of hardcoded protected roles' permissions to prevent lockouts,
    // although they might want to edit "student". Student is not protected in the array.
    const PROTECTED_ROLES = ["super_admin", "org_admin"];
    if (PROTECTED_ROLES.includes(existingRole.slug)) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Cannot edit default system roles" } },
        { status: 403 }
      );
    }

    const updatedRole = await prisma.customRole.update({
      where: { id },
      data: {
        name,
        permissions: permissions || [],
      },
    });

    return NextResponse.json({ item: updatedRole });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Update global role error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update global role" } },
      { status: 500 }
    );
  }
}
