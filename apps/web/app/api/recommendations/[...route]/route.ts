/**
 * Recommendations Proxy API — /api/recommendations/*
 * Proxies to Python ML service for recommendation engine.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, AuthError } from "@/lib/server/auth";
import { mlClient, MLServiceError } from "@/lib/server/ml-client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ route?: string[] }> }
) {
  try {
    const user = await getCurrentUser(request);
    const { route } = await params;
    const path = route?.join("/") || "";
    const url = new URL(request.url);
    const mlUser = { id: user.id, tenantId: user.tenantId };

    // GET /api/recommendations/ — personalized recommendations
    if (!path) {
      const maxResults = parseInt(url.searchParams.get("max_results") || "10", 10);
      const availableMinutes = url.searchParams.get("available_minutes")
        ? parseInt(url.searchParams.get("available_minutes")!, 10)
        : undefined;

      const result = await mlClient.getRecommendations(mlUser, {
        max_results: maxResults,
        available_minutes: availableMinutes,
      });
      return NextResponse.json(result);
    }

    // GET /api/recommendations/daily-mission
    if (path === "daily-mission") {
      const availableMinutes = parseInt(
        url.searchParams.get("available_minutes") || "30",
        10
      );
      const result = await mlClient.getDailyMission(mlUser, availableMinutes);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Unknown recommendations path" } },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: { code: "AUTH_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    if (error instanceof MLServiceError) {
      return NextResponse.json(
        { error: { code: "ML_SERVICE_ERROR", message: error.message } },
        { status: error.status }
      );
    }
    console.error("Recommendations proxy error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
