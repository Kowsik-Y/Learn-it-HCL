import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            isActive: true,
          }
        },
      }
    });

    if (!org) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Organization not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...org,
      user_count: org.users.length,
      active_user_count: org.users.filter((u: { isActive: any; }) => u.isActive).length,
      users: undefined // Omit detailed user list from org detail payload
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 }
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

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.slug !== undefined) dataToUpdate.slug = body.slug;
    if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;
    
    const org = await prisma.organization.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(org);
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;
    
    // Prevent deletion if it's the system admin org (assumed safe pattern, or let Prisma throw if protected)
    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return NextResponse.json({ error: { message: "Organization not found" } }, { status: 404 });
    }
    
    if (org.tenantType === "SYSTEM") {
       return NextResponse.json({ error: { message: "Cannot delete a SYSTEM organization" } }, { status: 403 });
    }

    await prisma.organization.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, message: "Organization deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 }
    );
  }
}
