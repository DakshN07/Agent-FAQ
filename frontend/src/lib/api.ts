// Centralized API Client for Agent-FAQ

// Must match the backend port (4000 locally — see ../.env). This fallback only
// applies if .env.local is missing; keeping it on 4000 means the frontend
// still reaches the API instead of accidentally calling the Next.js dev server
// on port 3000.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

/**
 * Connection state for one channel, as returned by
 * `GET /api/events/:id/integrations`. Mirrors
 * `services/integrationCredentials.toPublicJSON`.
 *
 * Note the deliberate absence of any credential field: the backend never
 * serialises bot tokens into an API response.
 */
export type IntegrationState = {
  /** Credentials are stored. */
  connected: boolean;
  /** The adapter's socket is actually open — `connected && !running` means the
   *  connection was saved but the bot is not answering. */
  running: boolean;
  /** Display name of the server/workspace/bot, when known. */
  label?: string | null;
  connectedAt?: string;
  lastError?: string | null;
  runtimeError?: string | null;
};

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

  // Mistral API key (bring-your-own-key)
  /** Whether AI is usable: 'user' = your own key, 'env' = shared key, 'none' = not configured. */
  async getMistralKeyStatus() {
    return apiRequest<{ configured: boolean; source: 'user' | 'env' | 'none'; verifiedAt: string | null }>(
      '/api/auth/mistral-key'
    );
  },

  /** Verifies the key against Mistral server-side, then stores it encrypted. */
  async saveMistralKey(apiKey: string) {
    return apiRequest<{ message: string; source: string; verifiedAt: string }>('/api/auth/mistral-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    });
  },

  async removeMistralKey() {
    return apiRequest<{ message: string }>('/api/auth/mistral-key', {
      method: 'DELETE',
    });
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

  // --------------------------------------------------------------------------
  // Channel integrations (Discord / Slack / Telegram)
  //
  // Connections are established by redirecting the browser to the provider, so
  // there is no "save credentials" call — the backend performs the OAuth
  // round-trip and stores the tokens itself.
  // --------------------------------------------------------------------------

  /** Per-platform connection state, keyed by platform. Never includes tokens. */
  async getIntegrationStatus(eventId: string) {
    return apiRequest<Record<string, IntegrationState>>(`/api/events/${eventId}/integrations`);
  },

  /**
   * Step 1 of connecting Discord/Slack. Returns the provider's consent URL; the
   * caller navigates there. Deliberately a POST so the access token stays in the
   * Authorization header rather than the query string.
   */
  async beginOAuthConnect(platform: 'discord' | 'slack', eventId: string) {
    return apiRequest<{ authorizeUrl: string }>(`/api/oauth/${platform}/connect`, {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    });
  },

  /** Whether the server has app credentials configured for this platform. */
  async getOAuthStatus(platform: 'discord' | 'slack' | 'telegram') {
    return apiRequest<{ platform: string; configured: boolean; usesOauth: boolean }>(
      `/api/oauth/${platform}/status`
    );
  },

  /**
   * Telegram has no bot OAuth, so it uses a token from @BotFather instead.
   * `verifyTelegramToken` checks the token against Telegram before the user
   * commits to it, so a typo isn't discovered after saving.
   */
  async verifyTelegramToken(token: string) {
    return apiRequest<{ valid: boolean; botUsername: string | null; error?: string }>('/api/oauth/telegram/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async connectTelegramBot(eventId: string, token: string) {
    return apiRequest<{ connected: boolean; botUsername: string }>('/api/oauth/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ eventId, token }),
    });
  },

  /** Restarts a saved connection whose socket failed to open. */
  async reconnectIntegration(eventId: string, platform: string) {
    return apiRequest<IntegrationState>(`/api/events/${eventId}/integrations/${platform}/reconnect`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /** Stops the adapter and deletes the stored (encrypted) credentials. */
  async disconnectIntegration(eventId: string, platform: string) {
    return apiRequest<{ disconnected: boolean }>(`/api/oauth/${platform}/disconnect`, {
      method: 'DELETE',
      body: JSON.stringify({ eventId }),
    });
  },

  // --------------------------------------------------------------------------
  // FAQ import — pull existing Q&A out of a connected channel
  // --------------------------------------------------------------------------

  /**
   * Channels that FAQs can be imported from. Only Discord and Slack support
   * this: the Telegram Bot API gives bots no access to chat history.
   */
  async getImportSources(eventId: string, platform: string) {
    return apiRequest<{ platform: string; sources: { id: string; name: string; topic?: string }[] }>(
      `/api/events/${eventId}/integrations/${platform}/import-sources`
    );
  },

  /** Imports pinned Q&A from the chosen channels as FAQs. */
  async importFaqs(eventId: string, platform: string, sourceIds: string[], limit?: number) {
    return apiRequest<{
      imported: number;
      skipped: number;
      failed: number;
      truncated: boolean;
      faqs: { id: string; question: string }[];
      message: string;
    }>(`/api/events/${eventId}/integrations/${platform}/import-faqs`, {
      method: 'POST',
      body: JSON.stringify({ sourceIds, limit }),
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