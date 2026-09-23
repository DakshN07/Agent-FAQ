// Centralized API Client for Agent-FAQ

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// --------------------------------------------------------------------------
// Token handling
//
// The access token lives ONLY in JS memory (never localStorage, so a DOM XSS
// can't exfiltrate it). It expires after 15 minutes; when a request returns
// 401 the client transparently calls POST /api/auth/refresh, which rotates
// the refresh token stored in the httpOnly `rf` cookie on the API origin,
// then retries the original request once.
// --------------------------------------------------------------------------
export const USER_KEY = 'agent_faq_user';
export const EVENT_KEY = 'agent_faq_active_event';

let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export const getToken = (): string | null => (typeof window === 'undefined' ? null : accessToken);

export const setToken = (token: string): void => {
  accessToken = token;
};

export const removeToken = (): void => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const setStoredUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const getStoredActiveEventId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(EVENT_KEY);
};

export const setStoredActiveEventId = (eventId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(EVENT_KEY, eventId);
  }
};

/** Refresh the access token via the httpOnly refresh cookie. Dedupes concurrent calls. */
async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data.token) {
        accessToken = data.token;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

const AUTH_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/accept-invite',
];

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // round-trip the httpOnly refresh cookie
  });

  // Transparent session refresh: on 401 (except for auth endpoints
  // themselves), refresh then retry the original request once.
  if (response.status === 401 && !retried && !AUTH_ENDPOINTS.some((e) => endpoint.startsWith(e))) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(endpoint, options, true);
    }
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    let errorMsg = `API Error ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  // Check if content-type is json
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------
export const api = {
  // Auth
  async login(credentials: { email: string; password?: string }) {
    const data = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) setToken(data.token);
    if (data.user) setStoredUser(data.user);
    return data;
  },

  async register(userData: { username: string; email: string; password?: string; role?: string }) {
    const data = await apiRequest<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token) setToken(data.token);
    if (data.user) setStoredUser(data.user);
    return data;
  },

  async acceptInvite(inviteData: { token: string; name: string; password: string }) {
    const data = await apiRequest<{ token: string; user: any }>('/api/auth/accept-invite', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
    if (data.token) setToken(data.token);
    if (data.user) setStoredUser(data.user);
    return data;
  },

  async getMe() {
    const data = await apiRequest<{ user: any }>('/api/auth/me');
    if (data.user) setStoredUser(data.user);
    return data;
  },

  /** Changes the password; clears the session (server revokes all refresh sessions). */
  async changePassword(body: { currentPassword: string; newPassword: string }) {
    return apiRequest<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async logout() {
    try {
      await apiRequest<{ message: string }>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } finally {
      removeToken();
    }
  },

  // Events
  async getEvents() {
    return apiRequest<any[]>('/api/events');
  },

  async getEventById(eventId: string) {
    return apiRequest<any>(`/api/events/${eventId}`);
  },

  async createEvent(eventData: {
    name: string;
    description?: string;
    faqThreshold?: number;
    instagramHandle?: string;
    websiteUrl?: string;
    contactNumber?: string;
    appointmentLink?: string;
    useAIIntro?: boolean;
    details?: any;
  }) {
    return apiRequest<{ event: any; aiPrompts?: any[] }>('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },

  async joinEvent(inviteCode: string) {
    return apiRequest<{ message: string; event: any }>('/api/events/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  // FAQs
  async getFaqs(eventId: string) {
    return apiRequest<any[]>(`/api/faqs?eventId=${eventId}`);
  },

  async createFaq(faq: { question: string; answer: string; eventId: string; platforms?: string[] }) {
    return apiRequest<any>('/api/faqs', {
      method: 'POST',
      body: JSON.stringify(faq),
    });
  },

  async updateFaq(id: string, faq: { question?: string; answer?: string; platforms?: string[] }) {
    return apiRequest<any>(`/api/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(faq),
    });
  },

  async deleteFaq(id: string) {
    return apiRequest<{ message: string }>(`/api/faqs/${id}`, {
      method: 'DELETE',
    });
  },

  // Analytics
  async getAnalytics(eventId: string) {
    return apiRequest<any>(`/api/analytics?eventId=${eventId}`);
  },

  // Settings
  async getSettings() {
    return apiRequest<any>('/api/settings');
  },

  async updateSettings(settings: {
    similarityThreshold?: number;
    maxSuggestions?: number;
    autoRespond?: boolean;
    notificationEmail?: string;
  }) {
    return apiRequest<any>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Unknown Questions & Suggestions
  async getUnknownQuestions(eventId: string) {
    return apiRequest<any[]>(`/api/unknown-questions?eventId=${eventId}`);
  },

  async getSuggestions(eventId: string) {
    return apiRequest<any[]>(`/api/suggestions?eventId=${eventId}`);
  },

  // Moderation
  async getModerationEvents(eventId: string) {
    return apiRequest<any[]>(`/api/events/${eventId}/moderation`);
  },

  // Conversations & Messages (paginated)
  async getConversations(eventId: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'All') params.set('status', status);
    return apiRequest<{ data: any[]; total: number; page: number; totalPages: number }>(
      `/api/events/${eventId}/conversations?${params.toString()}`
    );
  },

  async getMessages(eventId: string, conversationId: string, page = 1, limit = 50) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return apiRequest<{ data: any[]; total: number; page: number; totalPages: number }>(
      `/api/events/${eventId}/conversations/${conversationId}/messages?${params.toString()}`
    );
  },

  /** Sends a human (manual) reply through the conversation's channel bot. */
  async sendManualReply(eventId: string, conversationId: string, text: string) {
    return apiRequest<any>(`/api/events/${eventId}/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  /**
   * Live inbox stream URL (Server-Sent Events). EventSource can't set an
   * Authorization header, so the short-lived access token is passed via
   * ?token=. Callers must close the EventSource on unmount.
   */
  getConversationStreamUrl(eventId: string): string {
    const token = getToken() || '';
    return `${API_BASE_URL}/api/events/${encodeURIComponent(eventId)}/conversations/stream?token=${encodeURIComponent(token)}`;
  },

  // Integrations
  async getIntegrations(eventId: string) {
    return apiRequest<any[]>(`/api/events/${eventId}/integrations`);
  },

  async updateIntegration(eventId: string, data: { platform: string; credentials?: any; isActive?: boolean }) {
    return apiRequest<any>(`/api/events/${eventId}/integrations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Team
  async getTeamMembers(eventId: string) {
    return apiRequest<any[]>(`/api/events/${eventId}/team`);
  },

  async inviteTeamMember(eventId: string, data: { email: string; role?: string; platformAccess?: string[] }) {
    return apiRequest<any>(`/api/events/${eventId}/team/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeTeamMember(eventId: string, memberId: string) {
    return apiRequest<any>(`/api/events/${eventId}/team/${memberId}`, {
      method: 'DELETE',
    });
  },

  // AI Ask — runs the same LangGraph pipeline as the channel bots
  async askAI(question: string, eventId?: string) {
    const params = new URLSearchParams({ question });
    if (eventId) params.set('eventId', eventId);
    return apiRequest<{ answer: string; confidence: number; matched: boolean }>(
      `/api/ai/ask?${params.toString()}`
    );
  },
};