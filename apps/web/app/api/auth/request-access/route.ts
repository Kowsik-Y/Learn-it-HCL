import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function POST(request: Request) {
  try {
    const { fullName, email, company, reason } = await request.json();

    // Validation
    if (!email || !fullName || !reason) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Full Name, Email, and Reason are required." } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "An account with this email already exists." } },
        { status: 409 }
      );
    }

    // Check if an open request already exists
    const existingRequest = await prisma.accessRequest.findFirst({
      where: { email, status: "pending" },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: { code: "CONFLICT", message: "You already have a pending access request." } },
        { status: 409 }
      );
    }

    // Create the request
    await prisma.accessRequest.create({
      data: {
        fullName,
        email,
        company: company || null,
        reason,
        status: "pending",
      },
    });

    return NextResponse.json(
      { message: "Access request submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Access Request error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred while processing your request." } },
      { status: 500 }
    );
  }
}
