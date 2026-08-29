import { NextResponse } from "next/server";
import { getCurrentUser, AuthError, verifyPassword, hashPassword } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);

    const profileData = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const learnerProfile = await prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: {
        preferences: true,
      }
    });

    if (!profileData) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.fullName,
        avatarUrl: profileData.avatarUrl,
      },
      learnerProfile: learnerProfile || null,
      preferences: learnerProfile?.preferences || null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Profile GET error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred fetching profile" } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();

    const { fullName, avatarUrl, bio, timezone, language, locale, ageRange, preferences, currentPassword, newPassword } = body;

    // Handle Password Change if requested
    if (currentPassword && newPassword) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found" } }, { status: 404 });
      }

      const isPasswordValid = await verifyPassword(currentPassword, dbUser.hashedPassword);
      if (!isPasswordValid) {
        return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Incorrect current password" } }, { status: 400 });
      }

      const newHashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword: newHashedPassword },
      });
    }

    // Update User
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName !== undefined ? fullName : undefined,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
      },
    });

    // Upsert LearnerProfile
    const updatedProfile = await prisma.learnerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        tenantId: user.tenantId,
        bio: bio || null,
        timezone: timezone || "UTC",
        language: language || "en",
        locale: locale || "en-US",
        ageRange: ageRange || null,
      },
      update: {
        bio: bio !== undefined ? bio : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        language: language !== undefined ? language : undefined,
        locale: locale !== undefined ? locale : undefined,
        ageRange: ageRange !== undefined ? ageRange : undefined,
      },
    });

    let updatedPreferences = null;

    // Upsert LearnerPreferences if provided
    if (preferences) {
      updatedPreferences = await prisma.learnerPreferences.upsert({
        where: { learnerId: updatedProfile.id },
        create: {
          learnerId: updatedProfile.id,
          tenantId: user.tenantId,
          preferredContentType: preferences.preferredContentType || "mixed",
          preferredStudyDurationMinutes: preferences.preferredStudyDurationMinutes || 30,
          preferredDifficulty: preferences.preferredDifficulty || "adaptive",
          projectOriented: preferences.projectOriented !== undefined ? preferences.projectOriented : true,
          mentorSupported: preferences.mentorSupported !== undefined ? preferences.mentorSupported : false,
        },
        update: {
          preferredContentType: preferences.preferredContentType !== undefined ? preferences.preferredContentType : undefined,
          preferredStudyDurationMinutes: preferences.preferredStudyDurationMinutes !== undefined ? preferences.preferredStudyDurationMinutes : undefined,
          preferredDifficulty: preferences.preferredDifficulty !== undefined ? preferences.preferredDifficulty : undefined,
          projectOriented: preferences.projectOriented !== undefined ? preferences.projectOriented : undefined,
          mentorSupported: preferences.mentorSupported !== undefined ? preferences.mentorSupported : undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      },
      learnerProfile: updatedProfile,
      preferences: updatedPreferences || (await prisma.learnerPreferences.findUnique({ where: { learnerId: updatedProfile.id } })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Profile PUT error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred updating profile" } },
      { status: 500 }
    );
  }
}
