/**
 * AI Proxy API — /api/ai/*
 * Proxies to Python ML service for AI tutor and onboarding.
 */

import { NextResponse } from 'next/server';
import { AuthError, getCurrentUser } from '@/lib/server/auth';
import { MLServiceError, mlClient } from '@/lib/server/ml-client';

export async function POST(request: Request, { params }: { params: Promise<{ route: string[] }> }) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join('/') || '';
    const body = await request.json();

    const mlUser = { id: user.id, tenantId: user.tenantId };

    // POST /api/ai/tutor/chat
    if (path === 'tutor/chat') {
      const result = await mlClient.tutorChat(mlUser, body.messages, body.context);
      return NextResponse.json(result);
    }

    // POST /api/ai/onboarding/chat
    if (path === 'onboarding/chat') {
      const result = await mlClient.onboardingChat(mlUser, body.messages);
      return NextResponse.json(result);
    }

    // POST /api/ai/explain-recommendation
    if (path === 'explain-recommendation') {
      return NextResponse.json({
        message:
          "Recommendation explanations come from the recommendation engine's evidence system, not from AI generation. See the 'reasons' field in any recommendation response.",
      });
    }

    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Unknown AI path: ${path}` } },
      { status: 404 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: 'AUTH_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    if (error instanceof MLServiceError) {
      return NextResponse.json(
        { error: { code: 'ML_SERVICE_ERROR', message: error.message } },
        { status: error.status },
      );
    }
    console.error('AI proxy error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 },
    );
  }
}
