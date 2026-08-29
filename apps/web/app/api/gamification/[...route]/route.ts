/**
 * Gamification API — /api/gamification/*
 * XP, streaks, badges, quests.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";

const LEVELS = [
  { name: "Novice", number: 1, min_xp: 0, max_xp: 500, icon: "🌱" },
  { name: "Explorer", number: 2, min_xp: 500, max_xp: 1500, icon: "🔍" },
  { name: "Builder", number: 3, min_xp: 1500, max_xp: 3500, icon: "🔨" },
  { name: "Practitioner", number: 4, min_xp: 3500, max_xp: 7000, icon: "⚡" },
  { name: "Advanced", number: 5, min_xp: 7000, max_xp: 12000, icon: "🚀" },
  { name: "Expert", number: 6, min_xp: 12000, max_xp: 999999, icon: "👑" },
];

function getLevel(totalXp: number) {
  for (const level of LEVELS) {
    if (level.min_xp <= totalXp && totalXp < level.max_xp) {
      const progress = (totalXp - level.min_xp) / (level.max_xp - level.min_xp);
      return { ...level, progress: parseFloat(progress.toFixed(3)) };
    }
  }
  return { ...LEVELS[LEVELS.length - 1], progress: 1.0 };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";

    if (path === "profile") return handleProfile(user);
    if (path === "xp-history") return handleXPHistory(user);
    if (path === "badges") return handleBadges(user);
    if (path === "quests") return handleQuests(user);

    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unknown gamification path" } },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Gamification error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

async function handleProfile(user: { id: string; tenantId: string }) {
  const [xpAgg, streak, badgeCount, questsCompleted, lessonEvents] = await Promise.all([
    prisma.xPEvent.aggregate({
      where: { learnerId: user.id },
      _sum: { amount: true },
    }),
    prisma.streak.findFirst({ where: { learnerId: user.id } }),
    prisma.learnerBadge.count({ where: { learnerId: user.id } }),
    prisma.quest.count({ where: { learnerId: user.id, isCompleted: true } }),
    prisma.xPEvent.findMany({
      where: { learnerId: user.id, sourceType: "lesson" },
      select: { sourceId: true }
    })
  ]);

  const totalXp = xpAgg._sum.amount || 0;
  const level = getLevel(totalXp);
  const completedLessons = Array.from(new Set(lessonEvents.map((e: { sourceId: any; }) => e.sourceId)));

  return NextResponse.json({
    total_xp: totalXp,
    level,
    streak: {
      current: streak?.currentCount || 0,
      longest: streak?.longestCount || 0,
      is_active: streak?.isActive || false,
      freeze_available: (streak?.freezeCount || 0) > 0,
    },
    badges_count: badgeCount,
    quests_completed: questsCompleted,
    completed_lessons: completedLessons,
  });
}

async function handleXPHistory(user: { id: string }) {
  const events = await prisma.xPEvent.findMany({
    where: { learnerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: events.map((e: { id: any; amount: any; reason: any; sourceType: any; createdAt: { toISOString: () => any; }; }) => ({
      id: e.id,
      amount: e.amount,
      reason: e.reason,
      source_type: e.sourceType,
      created_at: e.createdAt.toISOString(),
    })),
  });
}

async function handleBadges(user: { id: string; tenantId: string }) {
  const [allBadges, earnedBadges] = await Promise.all([
    prisma.badge.findMany({ where: { tenantId: user.tenantId } }),
    prisma.learnerBadge.findMany({
      where: { learnerId: user.id },
      select: { badgeId: true },
    }),
  ]);

  const earnedIds = new Set(earnedBadges.map((b: { badgeId: any; }) => b.badgeId));

  return NextResponse.json({
    items: allBadges.map((b: { id: unknown; name: any; description: any; iconUrl: any; category: any; }) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      icon_url: b.iconUrl,
      category: b.category,
      is_earned: earnedIds.has(b.id),
    })),
  });
}

async function handleQuests(user: { id: string }) {
  const quests = await prisma.quest.findMany({
    where: { learnerId: user.id, isCompleted: false },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: quests.map((q: { id: any; title: any; description: any; questType: any; tasks: any; xpReward: any; progressPercentage: any; expiresAt: { toISOString: () => any; }; }) => ({
      id: q.id,
      title: q.title,
      description: q.description,
      quest_type: q.questType,
      tasks: q.tasks,
      xp_reward: q.xpReward,
      progress_percentage: q.progressPercentage,
      expires_at: q.expiresAt?.toISOString() || null,
    })),
  });
}
