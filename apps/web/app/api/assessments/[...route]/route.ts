/**
 * Assessments API — /api/assessments/*
 * List, start attempts, submit answers.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { prisma } from "@/lib/server/db";
import { mlClient, MLServiceError } from "@/lib/server/ml-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route?: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);

    const assessments = await prisma.assessment.findMany({
      where: {
        tenantId: user.tenantId,
        isPublished: true,
      },
    });

    return NextResponse.json({
      items: assessments.map((a: { id: any; title: any; assessmentType: any; questionCount: any; timeLimitMinutes: any; passingScore: any; isAdaptive: any; }) => ({
        id: a.id,
        title: a.title,
        assessment_type: a.assessmentType,
        question_count: a.questionCount,
        time_limit_minutes: a.timeLimitMinutes,
        passing_score: a.passingScore,
        is_adaptive: a.isAdaptive,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Assessments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ route: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";
    const body = await request.json();

    // POST /api/assessments/start
    if (path === "start") {
      return handleStartAssessment(user, body);
    }

    // POST /api/assessments/submit/:attemptId
    if (route && route[0] === "submit" && route.length === 2) {
      return handleSubmitAnswer(user, route[1], body);
    }

    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unknown assessments path" } },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Assessments error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}

async function handleStartAssessment(
  user: { id: string; tenantId: string },
  body: { assessment_id: string }
) {
  const attempt = await prisma.assessmentAttempt.create({
    data: {
      assessmentId: body.assessment_id,
      learnerId: user.id,
      tenantId: user.tenantId,
      status: "in_progress",
      startedAt: new Date(),
    },
  });

  const question = await prisma.question.findFirst({
    where: { assessmentId: body.assessment_id },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({
    attempt_id: attempt.id,
    question: question
      ? {
          id: question.id,
          content: question.content,
          question_type: question.questionType,
          difficulty_level: question.difficultyLevel,
          estimated_time_seconds: question.estimatedTimeSeconds,
          options: question.options,
          hints: question.hints,
        }
      : null,
  });
}

async function handleSubmitAnswer(
  user: { id: string; tenantId: string },
  attemptId: string,
  body: { question_id: string; answer: string }
) {
  const question = await prisma.question.findUnique({
    where: { id: body.question_id },
  });

  if (!question) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Question not found" } },
      { status: 404 }
    );
  }

  const isCorrect = body.answer === question.correctAnswer;

  // Record mastery evidence via ML service
  if (question.skillIds && Array.isArray(question.skillIds)) {
    for (const skillId of question.skillIds as string[]) {
      try {
        await mlClient.recordMasteryEvidence(
          { id: user.id, tenantId: user.tenantId },
          {
            skill_id: skillId,
            evidence_type: "assessment",
            source_id: question.id,
            score: isCorrect ? 1.0 : 0.0,
          }
        );
      } catch {
        // Non-critical: mastery update failure shouldn't block answer submission
        console.warn(`Failed to record mastery evidence for skill ${skillId}`);
      }
    }
  }

  return NextResponse.json({
    is_correct: isCorrect,
    explanation: !isCorrect ? question.explanation : null,
    correct_answer: !isCorrect ? question.correctAnswer : null,
  });
}
