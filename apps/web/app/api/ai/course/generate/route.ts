import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server/auth';

export async function POST(request: Request) {
  try {
    let userId = 'system_admin';
    let tenantId = 'default';
    try {
      const auth = await getCurrentUser(request);
      if (auth) {
        userId = auth.id || auth.user?.id || 'system_admin';
        tenantId = auth.tenantId || 'default';
      }
    } catch {
      // Dev / unauthenticated fallback
    }

    const body = await request.json();

    // Forward the request to the Python ML Service
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

    const response = await fetch(`${mlServiceUrl}/ml/course_agent/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('ML Service Error:', errorData);
      return new NextResponse(`ML Service Error: ${errorData}`, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[COURSE_GENERATE_ERROR]', error);
    const msg =
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error);
    return new NextResponse(msg, { status: 500 });
  }
}
