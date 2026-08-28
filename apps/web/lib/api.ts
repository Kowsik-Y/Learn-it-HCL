/**
 * Learn-it HCL — API Client
 *
 * Type-safe API client for the backend.
 * Handles auth token management, refresh, and error formatting.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    // Auto-refresh on 401
    if (res.status === 401 && token) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.getToken()}`;
        res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      } else {
        // Redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        throw new Error('Session expired');
      }
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let errorMessage = 'An error occurred';
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData?.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // ── Auth ─────────────────────────────────────
  login(email: string, password: string) {
    return this.request<{ user: unknown; tokens: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  register(data: { email: string; password: string; full_name: string }) {
    return this.request<{ user: unknown; tokens: unknown }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getProfile() {
    return this.request<unknown>('/auth/me');
  }

  // ── Learner ──────────────────────────────────
  getLearnerProfile() {
    return this.request<unknown>('/learners/profile');
  }

  getLearnerGoals() {
    return this.request<unknown>('/learners/goals');
  }

  // ── Skills ───────────────────────────────────
  getSkills(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<unknown>(`/skills/?${query}`);
  }

  // ── Content ──────────────────────────────────
  getCourses(params?: { search?: string; difficulty?: string }) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<unknown>(`/content/courses?${query}`);
  }

  getCourse(courseId: string) {
    return this.request<unknown>(`/content/courses/${courseId}`);
  }

  getLesson(lessonId: string) {
    return this.request<unknown>(`/content/lessons/${lessonId}`);
  }

  // ── Mastery ──────────────────────────────────
  getMastery() {
    return this.request<unknown>('/mastery/');
  }

  getSkillMastery(skillId: string) {
    return this.request<unknown>(`/mastery/${skillId}`);
  }

  // ── Recommendations ──────────────────────────
  getRecommendations(params?: { max_results?: number; available_minutes?: number }) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params || {}).map(([k, v]) => [k, String(v)])),
    ).toString();
    return this.request<unknown>(`/recommendations/?${query}`);
  }

  getDailyMission(availableMinutes: number = 30) {
    return this.request<unknown>(`/recommendations/daily-mission?available_minutes=${availableMinutes}`);
  }

  // ── Assessments ──────────────────────────────
  getAssessments() {
    return this.request<unknown>('/assessments/');
  }

  startAssessment(assessmentId: string) {
    return this.request<unknown>('/assessments/start', {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId }),
    });
  }

  submitAnswer(attemptId: string, questionId: string, answer: string) {
    return this.request<unknown>(`/assessments/submit/${attemptId}`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer }),
    });
  }

  // ── Gamification ─────────────────────────────
  getGamificationProfile() {
    return this.request<unknown>('/gamification/profile');
  }

  getXPHistory() {
    return this.request<unknown>('/gamification/xp-history');
  }

  getBadges() {
    return this.request<unknown>('/gamification/badges');
  }

  getActiveQuests() {
    return this.request<unknown>('/gamification/quests');
  }

  // ── AI Tutor ─────────────────────────────────
  tutorChat(messages: Array<{ role: string; content: string }>, context?: Record<string, unknown>) {
    return this.request<unknown>('/ai/tutor/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, context }),
    });
  }

  onboardingChat(messages: Array<{ role: string; content: string }>) {
    return this.request<unknown>('/ai/onboarding/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  }

  // ── Attendance ───────────────────────────────
  checkIn(sessionId: string, otpCode?: string) {
    return this.request<unknown>('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, otp_code: otpCode }),
    });
  }

  getAttendanceHistory() {
    return this.request<unknown>('/attendance/history');
  }

  // ── Analytics ────────────────────────────────
  getDashboardData() {
    return this.request<unknown>('/analytics/dashboard');
  }

  getLearnerSummary() {
    return this.request<unknown>('/analytics/learner-summary');
  }
}

export const api = new ApiClient();
export default ApiClient;
