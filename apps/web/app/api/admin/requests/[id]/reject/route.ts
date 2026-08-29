import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin(request);
    const { id } = await params;

    await prisma.accessRequest.update({
      where: { id },
      data: { status: "rejected" },
    });

    return NextResponse.json({ message: "Rejected successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 }
    );
  }
}
