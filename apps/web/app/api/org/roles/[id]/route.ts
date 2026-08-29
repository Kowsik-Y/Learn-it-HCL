import { NextResponse } from "next/server";
import { requireOrgAdmin, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOrgAdmin(request);
    
    // In Next.js 16+, params is a Promise and needs to be awaited
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing role ID" } },
        { status: 400 }
      );
    }

    // Verify it's an org role before deleting
    const existingRole = await prisma.customRole.findFirst({
      where: { 
        id,
        tenantId: auth.tenantId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Custom role not found" } },
        { status: 404 }
      );
    }
    
    // Check if the role is protected
    const usersWithRole = await prisma.user.findFirst({
      where: { 
        tenantId: auth.tenantId,
        role: existingRole.slug 
      }
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

    return NextResponse.json({ message: "Custom role deleted successfully" });

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Delete custom role error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete custom role" } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOrgAdmin(request);
    
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
        tenantId: auth.tenantId,
      },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Custom role not found" } },
        { status: 404 }
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
    console.error("Update custom role error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update custom role" } },
      { status: 500 }
    );
  }
}
