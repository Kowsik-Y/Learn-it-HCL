import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const auth = await getCurrentUser(request);
    if (!auth?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    
    // Forward the request to the Python ML Service
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    
    const response = await fetch(`${mlServiceUrl}/ml/tutor/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": auth.user.id,
        "X-Tenant-Id": auth.tenantId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("ML Service Error:", errorData);
      return new NextResponse(`ML Service Error: ${errorData}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[TUTOR_CHAT_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
