import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin(request);
    const users = await prisma.user.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: users });
  } catch (error: any) {
    return NextResponse.json({ error: { message: error.message } }, { status: error.status || 500 });
  }
}
