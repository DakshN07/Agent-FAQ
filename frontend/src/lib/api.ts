// Centralized API Client for Agent-FAQ

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const TOKEN_KEY = 'agent_faq_token';
export const USER_KEY = 'agent_faq_user';
export const EVENT_KEY = 'agent_faq_active_event';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EVENT_KEY);
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

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

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

  logout() {
    removeToken();
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

  // Conversations & Messages
  async getConversations(eventId: string, status?: string) {
    const query = status && status !== 'All' ? `?status=${status}` : '';
    return apiRequest<any[]>(`/api/events/${eventId}/conversations${query}`);
  },

  async getMessages(eventId: string, conversationId: string) {
    return apiRequest<any[]>(`/api/events/${eventId}/conversations/${conversationId}/messages`);
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

  // AI Ask
  async askAI(question: string) {
    return apiRequest<{ answer: string }>(`/api/ai/ask?question=${encodeURIComponent(question)}`);
  },
};
