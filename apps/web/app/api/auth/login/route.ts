/**
 * Auth API — POST /api/auth/login
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { verifyPassword, createTokenPair } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Email and password are required" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !(await verifyPassword(password, user.hashedPassword))) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Account is deactivated" } },
        { status: 403 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await createTokenPair(user);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        tenant_id: user.tenantId,
        is_active: user.isActive,
        is_verified: user.isVerified,
        avatar_url: user.avatarUrl,
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
      },
      tokens,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
