import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request);
    const requests = await prisma.accessRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: { message: error.message } },
      { status: error.status || 500 }
    );
  }
}
