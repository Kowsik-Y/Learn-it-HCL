/**
 * Analytics API — /api/analytics/*
 * Dashboard data aggregation.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

const LEVELS = [
  { name: "Novice", number: 1, min_xp: 0, max_xp: 500 },
  { name: "Explorer", number: 2, min_xp: 500, max_xp: 1500 },
  { name: "Builder", number: 3, min_xp: 1500, max_xp: 3500 },
  { name: "Practitioner", number: 4, min_xp: 3500, max_xp: 7000 },
  { name: "Advanced", number: 5, min_xp: 7000, max_xp: 12000 },
  { name: "Expert", number: 6, min_xp: 12000, max_xp: 999999 },
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";

    if (path === "dashboard") return handleDashboard(user);
    if (path === "learner-summary") return handleLearnerSummary(user);

    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unknown analytics path" } },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

async function handleDashboard(user: { id: string; tenantId: string; email: string; fullName: string; role: string; avatarUrl: string | null }) {
  // Parallel queries for performance
  const [xpAgg, streak, profile, masteryStates, quests, recentXp] = await Promise.all([
    prisma.xPEvent.aggregate({
      where: { learnerId: user.id },
      _sum: { amount: true },
    }),
    prisma.streak.findFirst({ where: { learnerId: user.id } }),
    prisma.learnerProfile.findUnique({
      where: { userId: user.id },
      include: {
        goals: { where: { isActive: true } },
      },
    }),
    prisma.masteryState.findMany({
      where: { learnerId: user.id, tenantId: user.tenantId },
    }),
    prisma.quest.findMany({
      where: { learnerId: user.id, isCompleted: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.xPEvent.findMany({
      where: { learnerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const totalXp = xpAgg._sum.amount || 0;
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (level.min_xp <= totalXp && totalXp < level.max_xp) {
      currentLevel = level;
      break;
    }
  }

  // Get skill names for mastery
  const skillIds = masteryStates.map((m) => m.skillId);
  const skills = skillIds.length > 0
    ? await prisma.skill.findMany({ where: { id: { in: skillIds } } })
    : [];
  const skillNameMap = new Map(skills.map((s) => [s.id, s.name]));

  return NextResponse.json({
    gamification: {
      current_xp: totalXp,
      next_level_xp: currentLevel.max_xp,
      level: currentLevel.number,
      level_name: currentLevel.name,
      streak_days: streak?.currentCount || 0,
    },
    learner: {
      full_name: user.fullName,
      email: user.email,
      avatar_url: user.avatarUrl || "",
      role: user.role,
    },
    goals: (profile?.goals || []).map((g) => ({
      id: g.id,
      title: g.title,
      goal_type: g.goalType,
      target_role: g.targetRole,
      progress_percentage: g.progressPercentage,
    })),
    mastery_summary: masteryStates
      .map((m) => ({
        skill_id: m.skillId,
        skill_name: skillNameMap.get(m.skillId) || "Unknown",
        score: m.masteryScore,
        confidence: m.confidence,
        status: m.status,
      }))
      .sort((a, b) => b.score - a.score),
    daily_mission: {
      activities: [
        {
          title: "Practice: Data Structures",
          type: "lesson",
          explanation: "Your mastery is at 55% — 3 more practice sessions to reach 70%.",
        },
        {
          title: "Review: REST API Basics",
          type: "review",
          explanation: "It's been 3 days since you last studied REST APIs. A quick review will reinforce retention.",
        },
        {
          title: "Quiz: SQL Fundamentals",
          type: "challenge",
          explanation: "Test your SQL knowledge — scoring above 60% will unlock the FastAPI module.",
        },
      ],
    },
    active_quests: quests.map((q) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      reward_xp: q.xpReward,
      progress: q.progressPercentage,
      target: 100,
    })),
    recent_xp: recentXp.map((e) => ({
      id: e.id,
      amount: e.amount,
      reason: e.reason,
      created_at: e.createdAt.toISOString(),
    })),
  });
}

async function handleLearnerSummary(user: { id: string }) {
  const [xpAgg, masteryCount, streak] = await Promise.all([
    prisma.xPEvent.aggregate({
      where: { learnerId: user.id },
      _sum: { amount: true },
    }),
    prisma.masteryState.count({ where: { learnerId: user.id } }),
    prisma.streak.findFirst({ where: { learnerId: user.id } }),
  ]);

  const totalXp = xpAgg._sum.amount || 0;

  return NextResponse.json({
    total_xp: totalXp,
    total_learning_minutes: totalXp * 2,
    lessons_completed: Math.max(0, Math.floor(totalXp / 25)),
    quizzes_taken: Math.max(0, Math.floor(totalXp / 50)),
    skills_practiced: masteryCount,
    current_streak: streak?.currentCount || 0,
  });
}
