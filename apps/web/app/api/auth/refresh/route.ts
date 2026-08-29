/**
 * Auth API — POST /api/auth/refresh
 */

import { NextResponse } from "next/server";
import { verifyToken, createTokenPair } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();

    if (!refresh_token) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "refresh_token is required" } },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = await verifyToken(refresh_token);
    } catch {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Invalid refresh token" } },
        { status: 401 }
      );
    }

    if (payload.type !== "refresh") {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "Invalid token type" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: "User not found or inactive" } },
        { status: 401 }
      );
    }

    const tokens = await createTokenPair(user);
    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
