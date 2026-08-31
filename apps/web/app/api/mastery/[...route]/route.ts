/**
 * Mastery API — /api/mastery/*
 * Read-only mastery states (calculation happens in Python ML service).
 */

import { NextResponse } from 'next/server';
import { AuthError, getCurrentUser } from '@/lib/server/auth';
import { prisma } from '@/lib/server/db';

export async function GET(request: Request, { params }: { params: Promise<{ route?: string[] }> }) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;

    // GET /api/mastery — all mastery states
    if (!route || route.length === 0) {
      return handleGetAllMastery(user);
    }

    // GET /api/mastery/:skillId — single skill mastery
    return handleGetSkillMastery(user, route[0]);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('Mastery error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 },
    );
  }
}

function estimateRetention(lastPracticedAt: Date | null): number {
  if (!lastPracticedAt) return 0.0;
  const daysSince = (Date.now() - lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24);
  const retention = Math.exp(-0.1 * daysSince);
  return Math.max(0.0, Math.min(1.0, retention));
}

async function handleGetAllMastery(user: { id: string; tenantId: string }) {
  const states = await prisma.masteryState.findMany({
    where: {
      learnerId: user.id,
      tenantId: user.tenantId,
    },
  });

  const mastered = states.filter((s: { status: string }) => s.status === 'mastered').length;
  const learning = states.filter((s: { status: string }) => s.status === 'learning').length;
  const practiced = states.filter((s: { status: string }) => s.status === 'practiced').length;

  return NextResponse.json({
    summary: {
      total_skills: states.length,
      mastered,
      learning,
      practiced,
      not_started: states.length - mastered - learning - practiced,
      overall_progress: (mastered / Math.max(states.length, 1)) * 100,
    },
    skills: states.map((s: any) => ({
      skill_id: s.skillId,
      mastery_score: parseFloat(s.masteryScore.toFixed(3)),
      confidence: parseFloat(s.confidence.toFixed(3)),
      status: s.status,
      evidence_count: s.evidenceCount,
      retention_estimate: parseFloat(estimateRetention(s.lastPracticedAt).toFixed(3)),
      last_assessed_at: s.lastAssessedAt?.toISOString() || null,
    })),
  });
}

async function handleGetSkillMastery(user: { id: string; tenantId: string }, skillId: string) {
  const state = await prisma.masteryState.findFirst({
    where: {
      learnerId: user.id,
      skillId,
      tenantId: user.tenantId,
    },
  });

  if (!state) {
    return NextResponse.json({
      skill_id: skillId,
      mastery_score: 0.0,
      confidence: 0.0,
      status: 'not_started',
      evidence_count: 0,
    });
  }

  return NextResponse.json({
    skill_id: state.skillId,
    mastery_score: parseFloat(state.masteryScore.toFixed(3)),
    confidence: parseFloat(state.confidence.toFixed(3)),
    status: state.status,
    evidence_count: state.evidenceCount,
    retention_estimate: parseFloat(estimateRetention(state.lastPracticedAt).toFixed(3)),
    difficulty_estimate: parseFloat(state.difficultyEstimate.toFixed(3)),
    last_assessed_at: state.lastAssessedAt?.toISOString() || null,
  });
}
