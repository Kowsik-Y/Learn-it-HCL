/**
 * Learners API — /api/learners/profile and /api/learners/goals
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";

    if (path === "profile") {
      return handleProfile(user);
    }

    if (path === "goals") {
      return handleGoals(user);
    }

    if (path === "daily-check-in") {
      return handleDailyCheckIn();
    }

    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Unknown path: /api/learners/${path}` } },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Learners error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

async function handleProfile(user: { id: string; tenantId: string }) {
  let profile = await prisma.learnerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    profile = await prisma.learnerProfile.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
      },
    });
  }

  return NextResponse.json({
    id: profile.id,
    user_id: profile.userId,
    language: profile.language,
    timezone: profile.timezone,
    onboarding_completed: profile.onboardingCompleted,
    onboarding_data: profile.onboardingData,
  });
}

async function handleGoals(user: { id: string }) {
  const profile = await prisma.learnerProfile.findUnique({
    where: { userId: user.id },
  });

  if (!profile) {
    return NextResponse.json({ items: [] });
  }

  const goals = await prisma.learnerGoal.findMany({
    where: {
      learnerId: profile.id,
      isActive: true,
    },
  });

  return NextResponse.json({
    items: goals.map((g) => ({
      id: g.id,
      title: g.title,
      goal_type: g.goalType,
      target_role: g.targetRole,
      time_horizon_weeks: g.timeHorizonWeeks,
      hours_per_week: g.hoursPerWeek,
      progress_percentage: g.progressPercentage,
      is_active: g.isActive,
    })),
  });
}

function handleDailyCheckIn() {
  return NextResponse.json({
    prompt: "How are you feeling today?",
    energy_options: [
      { value: "ready", label: "Ready 🔥", emoji: "🔥" },
      { value: "good", label: "Good 🙂", emoji: "🙂" },
      { value: "okay", label: "Okay 😐", emoji: "😐" },
      { value: "tired", label: "Tired 😴", emoji: "😴" },
      { value: "overwhelmed", label: "Overwhelmed 😵", emoji: "😵" },
    ],
    time_options: [
      { value: 5, label: "5 min" },
      { value: 15, label: "15 min" },
      { value: 30, label: "30 min" },
      { value: 60, label: "60+ min" },
    ],
  });
}
