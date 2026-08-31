/**
 * Learn-it HCL — ML Service Client
 *
 * Internal HTTP client for calling the Python ML microservice.
 * Only used server-side in Next.js API routes.
 * Passes user_id and tenant_id via headers (already authenticated by Next.js).
 */

const baseEnv =
  process.env.ML_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
const ML_SERVICE_URL = baseEnv.replace(/\/ml\/?$/, '').replace(/\/$/, '');

interface MLRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string | number | undefined>;
}

interface MLUser {
  id: string;
  tenantId: string;
}

class MLClient {
  private baseUrl: string;

  constructor(baseUrl: string = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  async request<T = unknown>(
    path: string,
    user: MLUser,
    options: MLRequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', body, params } = options;

    let url = `${this.baseUrl}${path}`;

    // Add query parameters for GET requests
    if (params) {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      ) as Record<string, string>;
      const query = new URLSearchParams(filteredParams).toString();
      if (query) {
        url += `?${query}`;
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': user.id,
      'X-Tenant-Id': user.tenantId,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      // biome-ignore lint/suspicious/noExplicitAny: error data can be any
      let errorData: any = {};
      try {
        if (errorText) errorData = JSON.parse(errorText);
      } catch (_e) {
        // Not JSON
      }

      const message =
        errorData?.detail ||
        errorData?.error?.message ||
        `ML service error: HTTP ${res.status} ${res.statusText} - ${errorText.slice(0, 200)}`;
      throw new MLServiceError(message, res.status);
    }

    return res.json() as Promise<T>;
  }

  // ── AI Tutor ──────────────────────────────────────────

  async tutorChat(
    user: MLUser,
    messages: Array<{ role: string; content: string }>,
    context?: Record<string, unknown>,
  ) {
    return this.request('/ml/ai/tutor/chat', user, {
      method: 'POST',
      body: { messages, context },
    });
  }

  // ── Onboarding ────────────────────────────────────────

  async onboardingChat(user: MLUser, messages: Array<{ role: string; content: string }>) {
    return this.request('/ml/ai/onboarding/chat', user, {
      method: 'POST',
      body: { messages },
    });
  }

  // ── Recommendations ───────────────────────────────────

  async getRecommendations(
    user: MLUser,
    params?: { max_results?: number; available_minutes?: number },
  ) {
    return this.request('/ml/recommendations/', user, {
      params: params as Record<string, string | number | undefined>,
    });
  }

  async getDailyMission(user: MLUser, availableMinutes: number = 30) {
    return this.request('/ml/recommendations/daily-mission', user, {
      params: { available_minutes: availableMinutes },
    });
  }

  // ── Mastery Calculation ───────────────────────────────

  async recordMasteryEvidence(
    user: MLUser,
    data: {
      skill_id: string;
      evidence_type: string;
      source_id: string;
      score: number;
      max_score?: number;
    },
  ) {
    return this.request('/ml/mastery/record-evidence', user, {
      method: 'POST',
      body: data,
    });
  }
}

export class MLServiceError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'MLServiceError';
    this.status = status;
  }
}

export const mlClient = new MLClient();
